import { Colors } from "@/constants/color";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    DeviceEventEmitter,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import {
    ReserveAlertModal,
    ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import { switchConsumerTab } from "../components/ConsumerNav";

const CART_STORAGE_KEY = "@reserve_cart";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function PaymentSummaryScreen() {
  const params = useLocalSearchParams();
  const targetMerchant = String(params.merchant || "");

  const [allCartItems, setAllCartItems] = useState<any[]>([]);
  const [merchantItems, setMerchantItems] = useState<any[]>([]);
  const [merchantName, setMerchantName] = useState<string>(
    targetMerchant || "Partner Establishment"
  );
  const [paymentMethod, setPaymentMethod] = useState<"GCash" | "Maya">("GCash");

  // Live Xendit Invoice Verification State
  const [gatewayModalVisible, setGatewayModalVisible] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [activeCheckoutUrl, setActiveCheckoutUrl] = useState<string | null>(
    null
  );
  const [invoiceStatusText, setInvoiceStatusText] = useState<string>("PENDING");
  const pollIntervalRef = useRef<any>(null);

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => setModalAlert({ visible: true, title, message, type });

  useEffect(() => {
    loadSelectedMerchantCart();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [targetMerchant]);

  useEffect(() => {
    if (gatewayModalVisible && activeInvoiceId) {
      pollIntervalRef.current = setInterval(() => {
        checkXenditInvoiceStatus(activeInvoiceId, true);
      }, 3500);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [gatewayModalVisible, activeInvoiceId]);

  const loadSelectedMerchantCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (!storedCart) {
        router.replace("/consumer/cart" as any);
        return;
      }
      const parsed: any[] = JSON.parse(storedCart);
      setAllCartItems(parsed);

      const resolvedName =
        targetMerchant || parsed[0]?.establishment || "Partner Establishment";
      setMerchantName(resolvedName);

      const filtered = parsed.filter(
        (i) =>
          (i.establishment || "Partner Establishment") === resolvedName
      );
      setMerchantItems(filtered);
    } catch (e) {
      console.log("Payment summary cart load error:", e);
    }
  };

  const subtotal = merchantItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const originalTotal = merchantItems.reduce(
    (sum, item) =>
      sum +
      Number(item.originalPrice || item.price || 0) *
        Number(item.quantity || 1),
    0
  );
  const downpaymentFee = Math.round(subtotal * 0.1 * 100) / 100;
  const remainingBalance = Math.max(0, subtotal - downpaymentFee);
  const totalSavings = Math.max(0, originalTotal - subtotal);

  const openCheckoutUrl = (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url);
    }
  };

  const handleStartXenditCheckout = async () => {
    if (merchantItems.length === 0) {
      showModal(
        "No Items Selected",
        "Your selected merchant cart is empty.",
        "warning"
      );
      return;
    }

    const consId = await getStorageItem("profile_id");
    const email = (await getStorageItem("user_email")) || "";
    if (!consId && !email) {
      router.replace("/consumer");
      return;
    }

    setActiveInvoiceId(null);
    setActiveCheckoutUrl(null);
    setInvoiceStatusText("CREATING INVOICE...");
    setGatewayModalVisible(true);
    setIsCreatingInvoice(true);

    try {
      const pmRes = await api.post("listings/paymongo-checkout/", {
        action: "create_invoice",
        amount: downpaymentFee,
        description: `RESERVE 10% Deposit at ${merchantName} (${merchantItems
          .map((i) => `${i.quantity}x ${i.name}`)
          .join(", ")})`,
        payment_method: paymentMethod,
      });

      const checkoutUrl = pmRes.data?.checkout_url;
      const invoiceId = pmRes.data?.invoice_id || pmRes.data?.session_id;

      if (checkoutUrl && invoiceId) {
        setActiveInvoiceId(invoiceId);
        setActiveCheckoutUrl(checkoutUrl);
        setInvoiceStatusText("AWAITING PAYMENT");
        openCheckoutUrl(checkoutUrl);
      } else {
        setGatewayModalVisible(false);
        showModal(
          "Xendit Gateway Error",
          "Could not initialize Xendit invoice session.",
          "error"
        );
      }
    } catch (err: any) {
      setGatewayModalVisible(false);
      showModal(
        "Xendit Gateway Error",
        err.response?.data?.error ||
          "Could not create Xendit invoice. Please verify XENDIT_SECRET_KEY in your backend .env.",
        "error"
      );
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const checkXenditInvoiceStatus = async (
    invoiceId: string,
    silent = false
  ) => {
    if (!invoiceId || isVerifyingPayment) return;
    if (!silent) setIsVerifyingPayment(true);

    try {
      const verifyRes = await api.post("listings/paymongo-checkout/", {
        action: "check_status",
        invoice_id: invoiceId,
      });

      const statusVal = String(
        verifyRes.data?.status || "PENDING"
      ).toUpperCase();
      setInvoiceStatusText(statusVal);

      if (
        verifyRes.data?.is_paid ||
        statusVal === "PAID" ||
        statusVal === "SETTLED"
      ) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        await finalizeVerifiedReservation(invoiceId);
      } else if (!silent) {
        showModal(
          "Payment Still Pending",
          `Xendit invoice status is currently "${statusVal}". Please complete the ${paymentMethod} payment in the Xendit checkout window, then tap Verify again.`,
          "info"
        );
      }
    } catch (err: any) {
      if (!silent) {
        showModal(
          "Verification Error",
          err.response?.data?.error ||
            "Could not verify Xendit invoice status yet.",
          "error"
        );
      }
    } finally {
      if (!silent) setIsVerifyingPayment(false);
    }
  };

  const finalizeVerifiedReservation = async (verifiedInvoiceId: string) => {
    setIsVerifyingPayment(true);
    try {
      const consId = (await getStorageItem("profile_id")) || "0";
      const email = (await getStorageItem("user_email")) || "";

      const res = await api.post(`listings/consumer-portal/${consId}/`, {
        action: "checkout",
        email: email,
        payment_method: paymentMethod,
        xendit_invoice_id: verifiedInvoiceId,
        items: merchantItems,
      });

      const checkedOutIds = new Set(merchantItems.map((i: any) => String(i.id)));
      const remainingCart = allCartItems.filter(
        (item) =>
          !checkedOutIds.has(String(item.id)) &&
          (item.establishment || "Partner Establishment") !== merchantName
      );

      if (remainingCart.length === 0) {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(remainingCart)
        );
      }

      DeviceEventEmitter.emit("consumer_cart_updated");
      setGatewayModalVisible(false);
      setActiveInvoiceId(null);
      setActiveCheckoutUrl(null);

      const confirmedVoucher =
        res.data?.voucher_code || res.data?.claims?.[0]?.voucher_code || "";

      DeviceEventEmitter.emit("consumer_claims_updated", {
        voucher: confirmedVoucher,
      });
      DeviceEventEmitter.emit("consumer_notifs_updated");
      switchConsumerTab("Claims", {
        justConfirmed: "true",
        voucher: confirmedVoucher,
      });
      router.replace({
        pathname: "/consumer/claims" as any,
        params: {
          justConfirmed: "true",
          voucher: confirmedVoucher,
        },
      });
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        "Could not finalize reservation. Please check stock availability.";
      showModal("Reservation Error", msg, "error");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* TOP HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              switchConsumerTab("Cart");
              router.replace("/consumer/cart" as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Payment Summary &amp; Checkout</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Reserving from {merchantName}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SELECTED ITEMS PREVIEW */}
        <Text style={styles.sectionTitle}>
          Selected Items ({merchantItems.length})
        </Text>
        <View style={styles.itemsCard}>
          {merchantItems.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.itemRow,
                idx === merchantItems.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Image source={{ uri: item.image }} style={styles.itemThumb} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemExpiry}>
                  Exp: {item.expiryDate} • {item.expiryTime}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                ₱
                {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(
                  2
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* RESERVATION INFO & WARNINGS */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconContainer}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Colors.primary}
            />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Pickup Guarantee &amp; No-Show Policy ({merchantName})
            </Text>
            <Text style={styles.noticeText}>
              Pay the{" "}
              <Text style={styles.noticeBold}>
                10% Downpayment (₱{downpaymentFee.toFixed(2)})
              </Text>{" "}
              online now via Xendit to lock your order at{" "}
              <Text style={styles.noticeBold}>{merchantName}</Text>. Pay the
              remaining{" "}
              <Text style={styles.noticeBold}>
                90% (₱{remainingBalance.toFixed(2)})
              </Text>{" "}
              in cash upon pickup before the expiry deadline. Unclaimed orders
              past expiry forfeit the 10% deposit and incur a No-Show strike.
            </Text>
          </View>
        </View>

        {/* XENDIT PAYMENT SELECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Xendit Online Payment Method (10%)
          </Text>
        </View>

        <View style={styles.paymentCard}>
          {(["GCash", "Maya"] as const).map((method, idx) => {
            const active = paymentMethod === method;
            return (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  active && styles.paymentOptionActive,
                  idx === 1 && styles.paymentOptionLast,
                ]}
                activeOpacity={0.88}
                onPress={() => setPaymentMethod(method)}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIconContainer}>
                    <Ionicons
                      name={
                        method === "GCash" ? "wallet-outline" : "card-outline"
                      }
                      size={18}
                      color={active ? Colors.primary : Colors.icon}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.paymentText,
                        active && styles.paymentTextActive,
                      ]}
                    >
                      {method} (via Xendit Gateway)
                    </Text>
                  </View>
                </View>
                {active ? (
                  <View style={styles.radioActive}>
                    <View style={styles.radioDot} />
                  </View>
                ) : (
                  <View style={styles.radio} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ORDER SUMMARY CALCULATIONS */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Original Retail Value</Text>
            <Text style={styles.originalTotal}>
              ₱{originalTotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Discounted Rescue Subtotal ({merchantItems.length} item
              {merchantItems.length > 1 ? "s" : ""})
            </Text>
            <Text style={styles.summaryValue}>₱{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Rescue Savings</Text>
            <Text style={styles.savingsText}>-₱{totalSavings.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryLabel}>
                Remaining Balance (Pay at Store Pickup)
              </Text>
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>90%</Text>
              </View>
            </View>
            <Text style={styles.summaryValue}>
              ₱{remainingBalance.toFixed(2)}
            </Text>
          </View>

          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>
                10% Reservation Deposit
              </Text>
              <Text style={styles.grandTotalSubtext}>
                Payable online now via Xendit ({paymentMethod})
              </Text>
            </View>
            <Text style={styles.grandTotal}>₱{downpaymentFee.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          activeOpacity={0.88}
          onPress={handleStartXenditCheckout}
        >
          <Ionicons name="lock-closed-outline" size={16} color={Colors.white} />
          <Text style={styles.checkoutText} numberOfLines={2}>
            Pay ₱{downpaymentFee.toFixed(2)} Deposit via Xendit ({paymentMethod}
            )
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.secureText}>
          Powered by Xendit ({paymentMethod}) • Verifies payment before
          generating your QR Rescue Voucher
        </Text>
      </ScrollView>

      {/* LIVE XENDIT PAYMENT VERIFICATION MODAL */}
      <Modal
        visible={gatewayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGatewayModalVisible(false)}
      >
        <View style={styles.gatewayOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setGatewayModalVisible(false)}
          />
          <View style={styles.gatewayCard}>
            <View style={styles.gatewayHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.gatewayHeaderTitle}>
                  Xendit {paymentMethod} Payment Verification
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGatewayModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18, paddingBottom: 28 }}>
              <View style={styles.gatewayAmountBox}>
                <Text style={styles.gatewayAmountLabel}>
                  10% RESERVATION DEPOSIT ({merchantName})
                </Text>
                <Text style={styles.gatewayAmountValue}>
                  ₱{downpaymentFee.toFixed(2)}
                </Text>
                <Text style={styles.gatewayMerchantNote}>
                  90% Balance at Pickup: ₱{remainingBalance.toFixed(2)}
                </Text>
              </View>

              {isCreatingInvoice ? (
                <View
                  style={{ paddingVertical: 24, alignItems: "center", gap: 10 }}
                >
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.statusInfoText}>
                    Creating secure Xendit {paymentMethod} invoice...
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.invoiceStatusBox}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={styles.invoiceStatusLabel}>
                        Xendit Invoice ID:
                      </Text>
                      <Text style={styles.invoiceStatusVal}>
                        {activeInvoiceId || "Initializing..."}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <Text style={styles.invoiceStatusLabel}>
                        Live Gateway Status:
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                        <Text
                          style={[
                            styles.invoiceStatusVal,
                            { color: Colors.primary },
                          ]}
                        >
                          {invoiceStatusText}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.gatewayInstructions}>
                    Complete your {paymentMethod} payment in the Xendit checkout
                    window. This screen automatically checks your payment every
                    3 seconds and generates your QR Rescue Voucher as soon as
                    payment is confirmed.
                  </Text>

                  <TouchableOpacity
                    style={styles.gatewayPayBtn}
                    activeOpacity={0.85}
                    onPress={() =>
                      activeInvoiceId &&
                      checkXenditInvoiceStatus(activeInvoiceId, false)
                    }
                    disabled={isVerifyingPayment || !activeInvoiceId}
                  >
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.gatewayPayBtnText}>
                      {isVerifyingPayment
                        ? "VERIFYING WITH XENDIT..."
                        : "I Have Completed Payment — Verify Now"}
                    </Text>
                  </TouchableOpacity>

                  {activeCheckoutUrl && (
                    <TouchableOpacity
                      style={[
                        styles.gatewayPayBtn,
                        {
                          backgroundColor: Colors.white,
                          borderWidth: 1,
                          borderColor: Colors.primary,
                          marginTop: 10,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => openCheckoutUrl(activeCheckoutUrl)}
                    >
                      <Ionicons
                        name="open-outline"
                        size={16}
                        color={Colors.primary}
                      />
                      <Text
                        style={[
                          styles.gatewayPayBtnText,
                          { color: Colors.primary },
                        ]}
                      >
                        Re-open Xendit {paymentMethod} Checkout Page
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((p) => ({ ...p, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: { marginLeft: 11, flex: 1 },
  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: -1,
  },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13.5,
    color: Colors.primary2,
    marginBottom: 8,
  },
  itemsCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.input,
  },
  itemName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12.5,
    color: Colors.primary2,
  },
  itemExpiry: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: "#A94A3A",
    marginTop: 2,
  },
  itemSubtotal: {
    fontFamily: "PoppinsBold",
    fontSize: 13,
    color: Colors.primary,
  },
  noticeCard: {
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  noticeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeContent: { flex: 1 },
  noticeTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    lineHeight: 16,
  },
  noticeBold: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  paymentCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  paymentOption: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentOptionLast: { borderBottomWidth: 0 },
  paymentOptionActive: { backgroundColor: "#F7FBF8" },
  paymentLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  paymentIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentText: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
  },
  paymentTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  radioActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabelRow: { flexDirection: "row", alignItems: "center" },
  summaryLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  summaryValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  originalTotal: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
  },
  savingsText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
  feeBadge: {
    backgroundColor: "#E7F0E9",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  feeBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grandTotalLabel: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  grandTotalSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.placeholder,
  },
  grandTotal: {
    fontFamily: "PoppinsBold",
    fontSize: 20,
    color: Colors.primary,
  },
  checkoutButton: {
    minHeight: 50,
    backgroundColor: Colors.button,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "PoppinsSemiBold",
    fontSize: 12.5,
    color: Colors.white,
  },
  secureText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 8,
  },
  gatewayOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  gatewayCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  gatewayHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gatewayHeaderTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.white,
  },
  gatewayAmountBox: {
    backgroundColor: "#F3F6F4",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gatewayAmountLabel: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.primary1,
    textAlign: "center",
  },
  gatewayAmountValue: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary,
    marginVertical: 2,
  },
  gatewayMerchantNote: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.icon,
  },
  invoiceStatusBox: {
    backgroundColor: "#F8FAF9",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  invoiceStatusLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  invoiceStatusVal: {
    fontFamily: "PoppinsBold",
    fontSize: 11.5,
    color: Colors.primary2,
  },
  statusInfoText: {
    fontFamily: "PoppinsMedium",
    fontSize: 12,
    color: Colors.primary2,
  },
  gatewayInstructions: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  gatewayPayBtn: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  gatewayPayBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
});