import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import {
  ReserveAlertModal,
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  EstablishmentBottomNav,
  useIsInsideMerchantShell,
} from "../components/EstablishmentNav";

let cachedMerchantProfileMemory = {
  merchantId: "",
  busName: "Partner Establishment",
  merchType: "Bakeshop",
  contactPerson: "Manager",
  email: "Loading...",
  phone: "Not Provided",
  address: "Cebu City, Philippines",
  status: "Active",
  avgRating: 0,
  reviewCount: 0,
  planId: 1,
  planName: "Free Tier (Basic)",
  weeklyUsed: 0,
  weeklyLimit: "10",
  commissionPct: 10,
  premiumMonthlyPrice: 399,
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const clearMerchantStorage = async () => {
  const keys = [
    "access",
    "refresh",
    "user_role",
    "user_email",
    "profile_id",
    "entity_name",
    "merch_type",
    "account_status",
  ];
  for (const k of keys) {
    if (Platform.OS === "web") localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  }
};

const maskPhoneNumber = (rawPhone: string): string => {
  if (!rawPhone || rawPhone === "Not Provided") return "No phone linked";
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("9") && digits.length === 10) {
    digits = "0" + digits;
  }
  if (digits.length >= 5) {
    const lastThree = digits.slice(-3);
    const middleLength = Math.max(6, digits.length - 5);
    return `09${"x".repeat(middleLength)}${lastThree}`;
  }
  return rawPhone;
};

export default function EstablishmentProfile() {
  const isInsideShell = useIsInsideMerchantShell();
  if (!isInsideShell) return null;

  const [merchantId, setMerchantId] = useState(
    cachedMerchantProfileMemory.merchantId
  );
  const [busName, setBusName] = useState(cachedMerchantProfileMemory.busName);
  const [merchType, setMerchType] = useState(
    cachedMerchantProfileMemory.merchType
  );
  const [contactPerson, setContactPerson] = useState(
    cachedMerchantProfileMemory.contactPerson
  );
  const [email, setEmail] = useState(cachedMerchantProfileMemory.email);
  const [phone, setPhone] = useState(cachedMerchantProfileMemory.phone);
  const [address, setAddress] = useState(cachedMerchantProfileMemory.address);
  const [status, setStatus] = useState(cachedMerchantProfileMemory.status);

  const [avgRating, setAvgRating] = useState(
    cachedMerchantProfileMemory.avgRating
  );
  const [reviewCount, setReviewCount] = useState(
    cachedMerchantProfileMemory.reviewCount
  );
  const [planId, setPlanId] = useState(cachedMerchantProfileMemory.planId);
  const [planName, setPlanName] = useState(
    cachedMerchantProfileMemory.planName
  );
  const [weeklyUsed, setWeeklyUsed] = useState(
    cachedMerchantProfileMemory.weeklyUsed
  );
  const [weeklyLimit, setWeeklyLimit] = useState(
    cachedMerchantProfileMemory.weeklyLimit
  );
  const [commissionPct, setCommissionPct] = useState(
    cachedMerchantProfileMemory.commissionPct
  );
  const [premiumMonthlyPrice, setPremiumMonthlyPrice] = useState(
    cachedMerchantProfileMemory.premiumMonthlyPrice
  );

  const [refreshing, setRefreshing] = useState(false);
  const [tierConfirmVisible, setTierConfirmVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  // Live Xendit Pro Subscription Payment Modal States
  const [proGatewayModalVisible, setProGatewayModalVisible] = useState(false);
  const [creatingProInvoice, setCreatingProInvoice] = useState(false);
  const [verifyingProPayment, setVerifyingProPayment] = useState(false);
  const [proInvoiceId, setProInvoiceId] = useState<string | null>(null);
  const [proCheckoutUrl, setProCheckoutUrl] = useState<string | null>(null);
  const [proInvoiceStatus, setProInvoiceStatus] = useState<string>("PENDING");
  const proPollRef = useRef<any>(null);

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

  const loadMerchantProfile = useCallback(async () => {
    try {
      const storedId = await getStorageItem("profile_id");
      const storedEmail = (await getStorageItem("user_email")) || "";
      if (!storedId && !storedEmail) {
        router.replace("/consumer");
        return;
      }
      const resolvedId = storedId || "0";
      setMerchantId(resolvedId);

      const portalRes = await api.get(
        `listings/merchant-portal/${resolvedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );

      const p = portalRes.data?.profile;
      if (p) {
        const nextProfile = {
          merchantId: String(p.merch_id || resolvedId),
          busName: p.bus_name || "Partner Establishment",
          merchType: p.merch_type || "Bakeshop",
          contactPerson: p.contact_person || "Manager",
          email: p.email || storedEmail,
          phone: p.phone || "Not Provided",
          address: p.address || "Cebu City, Philippines",
          status: p.status || "Active",
          avgRating: Number(p.avg_rating || 0),
          reviewCount: Number(p.review_count || 0),
          planId: Number(p.plan_id || 1),
          planName: p.plan_name || "Free Tier (Basic)",
          weeklyUsed: Number(p.weekly_listings_used || 0),
          weeklyLimit: String(p.weekly_listings_limit || "10"),
          commissionPct:
            p.commission_pct !== undefined
              ? Number(p.commission_pct)
              : cachedMerchantProfileMemory.commissionPct,
          premiumMonthlyPrice:
            p.premium_monthly_price !== undefined
              ? Number(p.premium_monthly_price)
              : cachedMerchantProfileMemory.premiumMonthlyPrice,
        };
        cachedMerchantProfileMemory = nextProfile;

        setMerchantId(nextProfile.merchantId);
        setBusName(nextProfile.busName);
        setMerchType(nextProfile.merchType);
        setContactPerson(nextProfile.contactPerson);
        setEmail(nextProfile.email);
        setPhone(nextProfile.phone);
        setAddress(nextProfile.address);
        setStatus(nextProfile.status);
        setAvgRating(nextProfile.avgRating);
        setReviewCount(nextProfile.reviewCount);
        setPlanId(nextProfile.planId);
        setPlanName(nextProfile.planName);
        setWeeklyUsed(nextProfile.weeklyUsed);
        setWeeklyLimit(nextProfile.weeklyLimit);
        setCommissionPct(nextProfile.commissionPct);
        setPremiumMonthlyPrice(nextProfile.premiumMonthlyPrice);
      }
    } catch (e) {
      console.log("Merchant profile load error:", e);
    }
  }, []);

  useEffect(() => {
    loadMerchantProfile();

    const profSub = DeviceEventEmitter.addListener(
      "merchant_profile_updated",
      () => {
        loadMerchantProfile();
      }
    );
    const listSub = DeviceEventEmitter.addListener(
      "merchant_listings_updated",
      () => {
        loadMerchantProfile();
      }
    );
    const ordSub = DeviceEventEmitter.addListener(
      "merchant_orders_updated",
      () => {
        loadMerchantProfile();
      }
    );

    return () => {
      profSub.remove();
      listSub.remove();
      ordSub.remove();
      if (proPollRef.current) clearInterval(proPollRef.current);
    };
  }, [loadMerchantProfile]);

  useEffect(() => {
    if (proGatewayModalVisible && proInvoiceId) {
      proPollRef.current = setInterval(() => {
        checkProInvoiceStatus(proInvoiceId, true);
      }, 3500);
    } else if (proPollRef.current) {
      clearInterval(proPollRef.current);
      proPollRef.current = null;
    }
    return () => {
      if (proPollRef.current) {
        clearInterval(proPollRef.current);
        proPollRef.current = null;
      }
    };
  }, [proGatewayModalVisible, proInvoiceId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMerchantProfile();
    setRefreshing(false);
  };

  const openExternalUrl = (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url);
    }
  };

  const executeTierSwitch = async () => {
    setTierConfirmVisible(false);
    const targetPlan = planId === 2 ? 1 : 2;

    // Downgrading to Free Tier (plan_id = 1) requires no payment
    if (targetPlan === 1) {
      try {
        const activeId =
          merchantId || (await getStorageItem("profile_id")) || "0";
        const res = await api.post(`listings/merchant-portal/${activeId}/`, {
          action: "upgrade_tier",
          plan_id: 1,
        });
        await loadMerchantProfile();
        DeviceEventEmitter.emit("merchant_profile_updated");
        showModal(
          "Switched to Free Tier",
          res.data?.message || "Your subscription plan has been updated.",
          "success"
        );
      } catch (e: any) {
        showModal(
          "Subscription Error",
          e.response?.data?.error || "Could not update subscription tier.",
          "error"
        );
      }
      return;
    }

    // Upgrading to Premium Pro (plan_id = 2) requires Xendit invoice payment verification
    setProInvoiceId(null);
    setProCheckoutUrl(null);
    setProInvoiceStatus("CREATING INVOICE...");
    setProGatewayModalVisible(true);
    setCreatingProInvoice(true);

    try {
      const pmRes = await api.post("listings/paymongo-checkout/", {
        action: "create_invoice",
        amount: premiumMonthlyPrice,
        description: `RESERVE Premium Pro Monthly Subscription (${busName})`,
        purpose: "merchant_upgrade",
      });

      const checkoutUrl = pmRes.data?.checkout_url;
      const invoiceId = pmRes.data?.invoice_id || pmRes.data?.session_id;

      if (checkoutUrl && invoiceId) {
        setProInvoiceId(invoiceId);
        setProCheckoutUrl(checkoutUrl);
        setProInvoiceStatus("AWAITING PAYMENT");
        openExternalUrl(checkoutUrl);
      } else {
        setProGatewayModalVisible(false);
        showModal(
          "Xendit Gateway Error",
          "Could not initialize Xendit subscription invoice.",
          "error"
        );
      }
    } catch (err: any) {
      setProGatewayModalVisible(false);
      showModal(
        "Xendit Gateway Error",
        err.response?.data?.error ||
          "Could not create Xendit subscription invoice.",
        "error"
      );
    } finally {
      setCreatingProInvoice(false);
    }
  };

  const checkProInvoiceStatus = async (invoiceId: string, silent = false) => {
    if (!invoiceId || verifyingProPayment) return;
    if (!silent) setVerifyingProPayment(true);

    try {
      const verifyRes = await api.post("listings/paymongo-checkout/", {
        action: "check_status",
        invoice_id: invoiceId,
      });

      const statusVal = String(verifyRes.data?.status || "PENDING").toUpperCase();
      setProInvoiceStatus(statusVal);

      if (
        verifyRes.data?.is_paid ||
        statusVal === "PAID" ||
        statusVal === "SETTLED"
      ) {
        if (proPollRef.current) {
          clearInterval(proPollRef.current);
          proPollRef.current = null;
        }
        const activeId =
          merchantId || (await getStorageItem("profile_id")) || "0";
        const res = await api.post(`listings/merchant-portal/${activeId}/`, {
          action: "upgrade_tier",
          plan_id: 2,
          xendit_invoice_id: invoiceId,
        });
        setProGatewayModalVisible(false);
        setProInvoiceId(null);
        setProCheckoutUrl(null);
        await loadMerchantProfile();
        DeviceEventEmitter.emit("merchant_profile_updated");
        showModal(
          "Upgraded to Premium Pro!",
          res.data?.message ||
            "Your Xendit payment was verified and Premium Pro is now active!",
          "success"
        );
      } else if (!silent) {
        showModal(
          "Payment Still Pending",
          `Xendit invoice status is currently "${statusVal}". Please complete the subscription payment in the Xendit checkout window first.`,
          "info"
        );
      }
    } catch (err: any) {
      if (!silent) {
        showModal(
          "Verification Error",
          err.response?.data?.error ||
            "Could not verify Xendit subscription status.",
          "error"
        );
      }
    } finally {
      if (!silent) setVerifyingProPayment(false);
    }
  };

  const executeLogout = async () => {
    setLogoutConfirmVisible(false);
    await clearMerchantStorage();
    router.replace("/consumer");
  };

  return (
    <View style={styles.container}>
      {/* FULL-SCREEN SCROLL CONTENT (NO TOP HEADER BAR) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Storefront &amp; Settings</Text>
          <Text style={styles.pageSubtitle}>
            Manage your establishment profile, subscription tier, Cebu City pin,
            and account security
          </Text>
        </View>

        {/* STOREFRONT HERO CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileCircle}>
            <Ionicons name="storefront" size={34} color={Colors.primary} />
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{busName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <Text style={styles.profileLocation} numberOfLines={1}>
              <Ionicons
                name="location-outline"
                size={11}
                color={Colors.primary}
              />{" "}
              {address}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.merchantBadge}>
                <Text style={styles.merchantBadgeText}>
                  {merchType} • MID-{merchantId} ({status})
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color="#D97706" />
                <Text style={styles.ratingBadgeText}>
                  {reviewCount > 0
                    ? `${avgRating.toFixed(1)} (${reviewCount})`
                    : "5.0 Verified"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* DYNAMIC GOVERNANCE SUBSCRIPTION TIER CARD */}
        <View style={styles.tierCard}>
          <View style={styles.tierHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierBadgeLabel}>
                {planId === 2
                  ? "PREMIUM PRO SUBSCRIPTION"
                  : "FREE TIER (BASIC PLAN)"}
              </Text>
              <Text style={styles.tierTitle}>{planName}</Text>
            </View>
            <View style={styles.tierPricePill}>
              <Text style={styles.tierPricePillText}>
                {planId === 2
                  ? `₱${premiumMonthlyPrice.toFixed(2)}/mo`
                  : "₱0.00/mo"}
              </Text>
            </View>
          </View>

          <View style={styles.tierMetricsBox}>
            <View style={styles.tierMetricItem}>
              <Text style={styles.tierMetricLabel}>Weekly Listings Cap</Text>
              <Text style={styles.tierMetricValue}>
                {weeklyUsed} / {weeklyLimit} used
              </Text>
            </View>
            <View style={styles.tierMetricDivider} />
            <View style={styles.tierMetricItem}>
              <Text style={styles.tierMetricLabel}>Withdrawal Fee</Text>
              <Text style={styles.tierMetricValue}>
                {planId === 2 ? "0% (Pro)" : `${commissionPct}% Fee`}
              </Text>
            </View>
          </View>

          <Text style={styles.tierSubNote}>
            {planId === 2
              ? "You enjoy unlimited weekly surplus listings and 0% platform commission on all wallet withdrawals."
              : `Upgrade to Premium Pro for ₱${premiumMonthlyPrice.toFixed(
                  2
                )}/month via Xendit to unlock Unlimited Weekly Listings and 0% Commission on all payouts!`}
          </Text>

          <TouchableOpacity
            style={[
              styles.tierActionBtn,
              planId === 2 && styles.tierActionBtnOutline,
            ]}
            activeOpacity={0.85}
            onPress={() => setTierConfirmVisible(true)}
          >
            <Ionicons
              name={planId === 2 ? "swap-horizontal-outline" : "sparkles"}
              size={16}
              color={planId === 2 ? Colors.primary2 : Colors.white}
            />
            <Text
              style={[
                styles.tierActionBtnText,
                planId === 2 && { color: Colors.primary2 },
              ]}
            >
              {planId === 2
                ? "Switch to Free Tier"
                : `Upgrade to Premium Pro (₱${premiumMonthlyPrice.toFixed(
                    2
                  )}/mo)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TWO MAIN ACCOUNT SETTINGS ROWS / CARDS */}
        <Text style={styles.sectionTitle}>Account Settings</Text>

        {/* ROW 1: STOREFRONT & PERSONAL INFORMATION */}
        <TouchableOpacity
          style={styles.featureRowCard}
          activeOpacity={0.85}
          onPress={() => router.push("/establishment/personal-info" as any)}
        >
          <View style={styles.featureIconBox}>
            <Ionicons
              name="storefront-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.featureCardBody}>
            <Text style={styles.featureCardTitle}>
              Storefront &amp; Personal Information
            </Text>
            <Text style={styles.featureCardDesc}>
              Business name, representative details, Cebu City Haversine address
              pin, and alert preferences
            </Text>
            <View style={styles.featureMetaPills}>
              <View style={styles.metaPill}>
                <Ionicons
                  name="person-circle-outline"
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.metaPillText} numberOfLines={1}>
                  {contactPerson}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.metaPillText} numberOfLines={1}>
                  {address}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
        </TouchableOpacity>

        {/* ROW 2: PRIVACY & SECURITY */}
        <TouchableOpacity
          style={styles.featureRowCard}
          activeOpacity={0.85}
          onPress={() => router.push("/establishment/privacy" as any)}
        >
          <View style={styles.featureIconBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.featureCardBody}>
            <Text style={styles.featureCardTitle}>Privacy &amp; Security</Text>
            <Text style={styles.featureCardDesc}>
              Update official email, SMS-verified mobile number, password, and
              account status
            </Text>
            <View style={styles.featureMetaPills}>
              <View style={styles.metaPill}>
                <Ionicons
                  name="mail-outline"
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.metaPillText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons
                  name="call-outline"
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.metaPillText}>
                  {maskPhoneNumber(phone)}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
        </TouchableOpacity>

        {/* SUPPORT & INFORMATION */}
        <Text style={styles.sectionTitle}>Support &amp; Information</Text>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.85}
          onPress={() => router.push("/help-support?role=Merchant" as any)}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="help-buoy-outline"
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Help &amp; Support</Text>
              <Text style={styles.menuSubtext}>
                View Merchant FAQs or submit a ticket to ReServe Admin
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.85}
          onPress={() => router.push("/consumer/about" as any)}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>About RESERVE</Text>
              <Text style={styles.menuSubtext}>
                Learn more about the RESERVE platform &amp; team
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        {/* LOG OUT WITH CONFIRMATION MODAL */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={() => setLogoutConfirmVisible(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#B3261E" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* SUBSCRIPTION TIER CONFIRM MODAL */}
      <ReserveConfirmModal
        visible={tierConfirmVisible}
        title={
          planId === 2
            ? "Switch to Free Tier?"
            : `Upgrade to Premium Pro (₱${premiumMonthlyPrice.toFixed(2)}/mo)?`
        }
        message={
          planId === 2
            ? `Switch back to the Free Tier (${weeklyLimit} listings/week cap and ${commissionPct}% withdrawal fee)?`
            : `Proceed to Xendit Checkout (GCash / Maya) for ₱${premiumMonthlyPrice.toFixed(
                2
              )}/month? Once payment is verified, Unlimited Weekly Listings and 0% Platform Commission will be activated.`
        }
        confirmText={
          planId === 2 ? "Switch to Free Tier" : "Proceed to Xendit Checkout"
        }
        cancelText="Cancel"
        onConfirm={executeTierSwitch}
        onCancel={() => setTierConfirmVisible(false)}
      />

      {/* XENDIT PRO SUBSCRIPTION VERIFICATION MODAL */}
      <Modal
        visible={proGatewayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProGatewayModalVisible(false)}
      >
        <View style={styles.gatewayOverlay}>
          <View style={styles.gatewayCard}>
            <View style={styles.gatewayHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons name="sparkles" size={19} color={Colors.white} />
                <Text style={styles.gatewayHeaderTitle}>
                  Xendit Premium Pro Subscription
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setProGatewayModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18, paddingBottom: 28 }}>
              <View style={styles.gatewayAmountBox}>
                <Text style={styles.gatewayAmountLabel}>
                  MONTHLY PRO SUBSCRIPTION ({busName})
                </Text>
                <Text style={styles.gatewayAmountValue}>
                  ₱{premiumMonthlyPrice.toFixed(2)}
                </Text>
                <Text style={styles.gatewayMerchantNote}>
                  Unlocks Unlimited Weekly Listings &amp; 0% Withdrawal Fee
                </Text>
              </View>

              {creatingProInvoice ? (
                <View
                  style={{ paddingVertical: 24, alignItems: "center", gap: 10 }}
                >
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.invoiceStatusVal}>
                    Creating Xendit subscription invoice...
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.invoiceStatusBox}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={styles.invoiceStatusLabel}>
                        Xendit Invoice ID:
                      </Text>
                      <Text style={styles.invoiceStatusVal}>
                        {proInvoiceId || "Initializing..."}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <Text style={styles.invoiceStatusLabel}>
                        Payment Status:
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
                          {proInvoiceStatus}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.gatewayInstructions}>
                    Complete your ₱{premiumMonthlyPrice.toFixed(2)} subscription
                    payment via GCash or Maya in the Xendit window. Your
                    storefront will upgrade automatically as soon as payment is
                    verified.
                  </Text>

                  <TouchableOpacity
                    style={styles.gatewayPayBtn}
                    activeOpacity={0.85}
                    onPress={() =>
                      proInvoiceId && checkProInvoiceStatus(proInvoiceId, false)
                    }
                    disabled={verifyingProPayment || !proInvoiceId}
                  >
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.gatewayPayBtnText}>
                      {verifyingProPayment
                        ? "VERIFYING PAYMENT..."
                        : "I Have Completed Payment — Verify Now"}
                    </Text>
                  </TouchableOpacity>

                  {proCheckoutUrl && (
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
                      onPress={() => openExternalUrl(proCheckoutUrl)}
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
                        Re-open Xendit Checkout Window
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRM MODAL */}
      <ReserveConfirmModal
        visible={logoutConfirmVisible}
        title="Confirm Logout"
        message="Are you sure you want to log out of your Merchant Portal account?"
        confirmText="Yes, Log Out"
        cancelText="Stay Logged In"
        isDestructive
        onConfirm={executeLogout}
        onCancel={() => setLogoutConfirmVisible(false)}
      />

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((p) => ({ ...p, visible: false }))}
      />

      <EstablishmentBottomNav activeTab="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28 },
  titleBlock: { marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 2 },
  profileCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  profileCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  profileDetails: { flex: 1, marginLeft: 14 },
  profileName: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary2 },
  profileEmail: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  profileLocation: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.placeholder, marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8 },
  merchantBadge: { backgroundColor: "#E7F0E9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  merchantBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 9, color: Colors.primary },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2.5 },
  ratingBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 9, color: "#B45309" },
  tierCard: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary, padding: 15, marginBottom: 20 },
  tierHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  tierBadgeLabel: { fontFamily: "PoppinsBold", fontSize: 9.5, color: Colors.primary, letterSpacing: 0.6 },
  tierTitle: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary2, marginTop: 2 },
  tierPricePill: { backgroundColor: "#E8EFEA", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  tierPricePillText: { fontFamily: "PoppinsBold", fontSize: 12, color: Colors.primary },
  tierMetricsBox: { flexDirection: "row", backgroundColor: "#F7F9F7", borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10, marginBottom: 10 },
  tierMetricItem: { flex: 1, alignItems: "center" },
  tierMetricDivider: { width: 1, backgroundColor: Colors.border },
  tierMetricLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  tierMetricValue: { fontFamily: "PoppinsBold", fontSize: 13, color: Colors.primary2, marginTop: 2 },
  tierSubNote: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, lineHeight: 15, marginBottom: 12 },
  tierActionBtn: { height: 44, backgroundColor: Colors.button, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tierActionBtnOutline: { backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border },
  tierActionBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginBottom: 8, marginTop: 4 },
  featureRowCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 12 },
  featureCardBody: { flex: 1, paddingRight: 8 },
  featureCardTitle: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2 },
  featureCardDesc: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, lineHeight: 15, marginTop: 2 },
  featureMetaPills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F7F9F7", borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: "100%" },
  metaPillText: { fontFamily: "PoppinsMedium", fontSize: 9.5, color: Colors.primary2, flexShrink: 1 },
  menuItem: { height: 60, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  menuLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  menuIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  menuText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  menuSubtext: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, marginTop: 1 },
  logoutButton: { height: 48, backgroundColor: Colors.white, borderWidth: 1, borderColor: "#E5B8B4", borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 },
  logoutText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: "#B3261E" },
  bottomSpacing: { height: 12 },
  gatewayOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  gatewayCard: { width: "100%", backgroundColor: Colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  gatewayHeader: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  gatewayHeaderTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.white },
  gatewayAmountBox: { backgroundColor: "#F3F6F4", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  gatewayAmountLabel: { fontFamily: "PoppinsSemiBold", fontSize: 9.5, color: Colors.primary1, textAlign: "center" },
  gatewayAmountValue: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary, marginVertical: 2 },
  gatewayMerchantNote: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon },
  invoiceStatusBox: { backgroundColor: "#F8FAF9", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  invoiceStatusLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  invoiceStatusVal: { fontFamily: "PoppinsBold", fontSize: 11.5, color: Colors.primary2 },
  gatewayInstructions: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 16, textAlign: "center", marginBottom: 4 },
  gatewayPayBtn: { height: 46, backgroundColor: Colors.button, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  gatewayPayBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
});