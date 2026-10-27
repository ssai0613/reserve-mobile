import { Colors } from "@/constants/color";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";

const CART_STORAGE_KEY = "@reserve_cart";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"GCash" | "PayMaya" | "Google Pay">("GCash");

  // Option A: GCash / Maya Payment Gateway Simulator Modal
  const [gatewayModalVisible, setGatewayModalVisible] = useState(false);
  const [walletPhone, setWalletPhone] = useState("09171234567");
  const [walletMpin, setWalletMpin] = useState("1234");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.log("Cart load error:", e);
    }
  };

  const updateCartStorage = async (updated: any[]) => {
    setCartItems(updated);
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
  };

  const changeQty = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const maxStock = Number(item.maxStock || item.quantity || 99);
        const nextQty = Math.max(1, Math.min(maxStock, Number(item.quantity || 1) + delta));
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    updateCartStorage(updated);
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    updateCartStorage(updated);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const originalTotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.originalPrice || item.price || 0) * Number(item.quantity || 1),
    0
  );
  const downpaymentFee = Math.round(subtotal * 0.1 * 100) / 100;
  const remainingBalance = Math.max(0, subtotal - downpaymentFee);
  const totalSavings = Math.max(0, originalTotal - subtotal);

  const handleOpenGateway = () => {
    if (cartItems.length === 0) {
      alert("Your Rescue Cart is empty. Please add food items first.");
      return;
    }
    setGatewayModalVisible(true);
  };

  const handlePayMongoLiveCheckout = async () => {
    setIsProcessing(true);
    try {
      const pmRes = await api.post("listings/paymongo-checkout/", {
        amount: downpaymentFee,
        description: `RESERVE 10% Deposit (${cartItems.map((i) => i.name).join(", ")})`,
        payment_method: paymentMethod,
      });

      if (pmRes.data?.checkout_url) {
        if (Platform.OS === "web") {
          window.open(pmRes.data.checkout_url, "_blank");
        } else {
          Linking.openURL(pmRes.data.checkout_url);
        }
      }
      // Record the reservation order in Supabase
      await handleConfirmOnlineDeposit();
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "PayMongo Live Gateway requires PAYMONGO_SECRET_KEY in .env. You can use the Instant Simulator button below!"
      );
      setIsProcessing(false);
    }
  };

  const handleConfirmOnlineDeposit = async () => {
    if (!walletPhone.trim() || walletMpin.trim().length < 4) {
      alert("Please enter a valid mobile number and 4-digit MPIN.");
      return;
    }

    setIsProcessing(true);
    try {
      const consId = (await getStorageItem("profile_id")) || "1";
      const email = (await getStorageItem("user_email")) || "";

      const res = await api.post(`listings/consumer-portal/${consId}/`, {
        action: "checkout",
        email: email,
        payment_method: paymentMethod,
        items: cartItems,
      });

      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      setCartItems([]);
      setGatewayModalVisible(false);

      const latestClaim = res.data?.claims?.[0];
      router.replace({
        pathname: "/consumer/claims" as any,
        params: {
          justConfirmed: "true",
          voucher: latestClaim?.voucher_code || "",
        },
      });
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        "Could not process reservation. Please check stock availability.";
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.logoSubtitle}>Consumer Portal</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={13} color={Colors.primary} />
          <Text style={styles.locationText}>Cebu / Lapu-Lapu</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Rescue Cart</Text>
          <Text style={styles.pageSubtitle}>
            Review your selected rescue items before paying the 10% reservation deposit.
          </Text>
        </View>

        {/* DYNAMIC CART ITEMS */}
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <View key={item.id} style={styles.cartCard}>
              <Image source={{ uri: item.image }} style={styles.productImage} />

              <View style={styles.productInfo}>
                <View style={styles.productTopRow}>
                  <View style={styles.productNameContainer}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.establishmentName} numberOfLines={1}>
                      {item.establishment}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B3261E" />
                  </TouchableOpacity>
                </View>

                <View style={styles.productDetail}>
                  <Ionicons name="time-outline" size={12} color={Colors.icon} />
                  <Text style={styles.productDetailText}>
                    Pickup before {item.expiryDate} {item.expiryTime}
                  </Text>
                </View>

                <View style={styles.productBottomRow}>
                  <View>
                    <Text style={styles.currentPrice}>
                      ₱{Number(item.price || 0).toFixed(2)}
                    </Text>
                    {Number(item.originalPrice || 0) > Number(item.price || 0) && (
                      <Text style={styles.oldPrice}>
                        ₱{Number(item.originalPrice).toFixed(2)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => changeQty(item.id, -1)}
                    >
                      <Ionicons name="remove" size={15} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => changeQty(item.id, 1)}
                    >
                      <Ionicons name="add" size={15} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View
            style={[
              styles.cartCard,
              { flexDirection: "column", alignItems: "center", paddingVertical: 28 },
            ]}
          >
            <Ionicons name="cart-outline" size={32} color={Colors.icon} />
            <Text style={[styles.productName, { marginTop: 8 }]}>
              Your Rescue Cart is empty
            </Text>
            <Text style={styles.establishmentName}>
              Browse the Home feed to rescue discounted surplus food.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => router.replace("/consumer/homepage")}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addMoreText}>Add more items</Text>
        </TouchableOpacity>

        {/* PICKUP NOTICE */}
        {cartItems.length > 0 && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeIconContainer}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Anti No-Show Reservation Policy</Text>
              <Text style={styles.noticeText}>
                You only pay the{" "}
                <Text style={styles.noticeBold}>
                  10% Downpayment (₱{downpaymentFee.toFixed(2)})
                </Text>{" "}
                online now to lock your order at{" "}
                <Text style={styles.noticeBold}>{cartItems[0].establishment}</Text>.
                Pay the remaining{" "}
                <Text style={styles.noticeBold}>
                  90% (₱{remainingBalance.toFixed(2)})
                </Text>{" "}
                directly to the store upon pickup.
              </Text>
            </View>
          </View>
        )}

        {/* PAYMENT METHOD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Online Deposit Method (10%)</Text>
          <Text style={styles.requiredText}>Required</Text>
        </View>

        <View style={styles.paymentCard}>
          {(["GCash", "PayMaya", "Google Pay"] as const).map((method, idx) => {
            const active = paymentMethod === method;
            return (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  active && styles.paymentOptionActive,
                  idx === 2 && styles.paymentOptionLast,
                ]}
                activeOpacity={0.88}
                onPress={() => setPaymentMethod(method)}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIconContainer}>
                    <Ionicons
                      name={
                        method === "GCash"
                          ? "wallet-outline"
                          : method === "PayMaya"
                          ? "card-outline"
                          : "logo-google"
                      }
                      size={18}
                      color={active ? Colors.primary : Colors.icon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentText,
                      active && styles.paymentTextActive,
                    ]}
                  >
                    {method}
                  </Text>
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

        {/* ORDER SUMMARY */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Original Retail Value</Text>
            <Text style={styles.originalTotal}>₱{originalTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discounted Rescue Subtotal</Text>
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
              <Text style={styles.grandTotalLabel}>10% Reservation Deposit</Text>
              <Text style={styles.grandTotalSubtext}>
                Payable online now via {paymentMethod}
              </Text>
            </View>
            <Text style={styles.grandTotal}>₱{downpaymentFee.toFixed(2)}</Text>
          </View>
        </View>

        {/* CHECKOUT */}
        <TouchableOpacity
          style={styles.checkoutButton}
          activeOpacity={0.88}
          onPress={handleOpenGateway}
        >
          <Ionicons name="lock-closed-outline" size={16} color={Colors.white} />
          <Text style={styles.checkoutText}>
            Pay ₱{downpaymentFee.toFixed(2)} Deposit & Reserve
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.secureText}>
          Secure checkout • Generates your official QR Rescue Voucher
        </Text>
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* DUAL PAYMENT MODAL: LIVE PAYMONGO GATEWAY + INSTANT SIMULATOR */}
      <Modal
        visible={gatewayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGatewayModalVisible(false)}
      >
        <View style={styles.gatewayOverlay}>
          <View style={styles.gatewayCard}>
            <View style={styles.gatewayHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
                <Text style={styles.gatewayHeaderTitle}>
                  {paymentMethod} Express Checkout
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGatewayModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18 }}>
              <View style={styles.gatewayAmountBox}>
                <Text style={styles.gatewayAmountLabel}>
                  10% RESERVATION DEPOSIT DUE NOW
                </Text>
                <Text style={styles.gatewayAmountValue}>
                  ₱{downpaymentFee.toFixed(2)}
                </Text>
                <Text style={styles.gatewayMerchantNote}>
                  Merchant: ReServe Escrow • Balance at Pickup: ₱
                  {remainingBalance.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.gatewayInputLabel}>
                {paymentMethod} Mobile Number
              </Text>
              <TextInput
                value={walletPhone}
                onChangeText={setWalletPhone}
                keyboardType="phone-pad"
                placeholder="09XX XXX XXXX"
                style={styles.gatewayInput}
              />

              <Text style={styles.gatewayInputLabel}>4-Digit MPIN</Text>
              <TextInput
                value={walletMpin}
                onChangeText={setWalletMpin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                style={styles.gatewayInput}
              />

              <TouchableOpacity
                style={styles.gatewayPayBtn}
                activeOpacity={0.85}
                onPress={handlePayMongoLiveCheckout}
                disabled={isProcessing}
              >
                <Text style={styles.gatewayPayBtnText}>
                  {isProcessing
                    ? "OPENING PAYMONGO GATEWAY..."
                    : `Pay ₱${downpaymentFee.toFixed(2)} via Live PayMongo (${paymentMethod})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.gatewayPayBtn, { backgroundColor: Colors.primary2, marginTop: 8 }]}
                activeOpacity={0.85}
                onPress={handleConfirmOnlineDeposit}
                disabled={isProcessing}
              >
                <Text style={styles.gatewayPayBtnText}>
                  {isProcessing
                    ? "AUTHORIZING PAYMENT..."
                    : `Instant Demo Authorize (₱${downpaymentFee.toFixed(2)})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/consumer/homepage")}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={1}
        >
          <Ionicons name="cart" size={22} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/consumer/claims")}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/consumer/profile")}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 64, paddingHorizontal: 16, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoContainer: { justifyContent: "center" },
  logo: { fontFamily: "PoppinsBold", fontSize: 22, color: Colors.primary, letterSpacing: 0.5 },
  logoSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: -3 },
  locationPill: { height: 32, paddingHorizontal: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  titleSection: { marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  cartCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, flexDirection: "row", marginBottom: 12 },
  productImage: { width: 90, height: 100, borderRadius: 10, backgroundColor: Colors.input },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  productTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  productNameContainer: { flex: 1, paddingRight: 6 },
  productName: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  establishmentName: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: 1 },
  deleteButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  productDetail: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  productDetailText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon },
  productBottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 },
  currentPrice: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary },
  oldPrice: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, textDecorationLine: "line-through" },
  quantityContainer: { height: 32, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: 8, overflow: "hidden" },
  quantityButton: { width: 30, height: 32, backgroundColor: Colors.input, alignItems: "center", justifyContent: "center" },
  quantityText: { minWidth: 28, textAlign: "center", fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  addMoreButton: { height: 46, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 },
  addMoreText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary },
  noticeCard: { backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, marginBottom: 20 },
  noticeIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  noticeContent: { flex: 1 },
  noticeTitle: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginBottom: 2 },
  noticeText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 16 },
  noticeBold: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginBottom: 6 },
  requiredText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  paymentCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  paymentOption: { height: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: Colors.border },
  paymentOptionLast: { borderBottomWidth: 0 },
  paymentOptionActive: { backgroundColor: "#F7FBF8" },
  paymentLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  paymentIconContainer: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.input, alignItems: "center", justifyContent: "center" },
  paymentText: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1 },
  paymentTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.border },
  radioActive: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  summaryCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  summaryLabelRow: { flexDirection: "row", alignItems: "center" },
  summaryLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  summaryValue: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },
  originalTotal: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.placeholder, textDecorationLine: "line-through" },
  savingsText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary },
  feeBadge: { backgroundColor: "#E7F0E9", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  feeBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 9, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  grandTotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  grandTotalLabel: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary2 },
  grandTotalSubtext: { fontFamily: "PoppinsRegular", fontSize: 9, color: Colors.placeholder },
  grandTotal: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary },
  checkoutButton: { height: 48, backgroundColor: Colors.button, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  checkoutText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  secureText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, textAlign: "center", marginTop: 8 },
  bottomSpace: { height: 16 },
  bottomNav: { height: 84, paddingBottom: 20, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 8, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 4, borderRadius: 8 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon, marginTop: 2 },
  navTextActive: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
  gatewayOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 20 },
  gatewayCard: { width: "100%", maxWidth: 380, backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden" },
  gatewayHeader: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  gatewayHeaderTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.white },
  gatewayAmountBox: { backgroundColor: "#F3F6F4", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  gatewayAmountLabel: { fontFamily: "PoppinsSemiBold", fontSize: 9.5, color: Colors.primary1 },
  gatewayAmountValue: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary, marginVertical: 2 },
  gatewayMerchantNote: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon },
  gatewayInputLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginBottom: 4, marginTop: 6 },
  gatewayInput: { height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary2, backgroundColor: Colors.input },
  gatewayPayBtn: { height: 46, backgroundColor: Colors.button, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 18 },
  gatewayPayBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.white },
});