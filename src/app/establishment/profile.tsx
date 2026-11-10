import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
  Platform,
  RefreshControl,
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
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import { EstablishmentBottomNav } from "../components/EstablishmentNav";

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
  const [merchantId, setMerchantId] = useState("1");
  const [busName, setBusName] = useState("Partner Establishment");
  const [merchType, setMerchType] = useState("Bakeshop");
  const [contactPerson, setContactPerson] = useState("Manager");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("Not Provided");
  const [address, setAddress] = useState("Cebu City, Philippines");
  const [status, setStatus] = useState("Active");

  // Live Rating & Dynamic Governance Subscription States
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [planId, setPlanId] = useState(1);
  const [planName, setPlanName] = useState("Free Tier (Basic)");
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [weeklyLimit, setWeeklyLimit] = useState("10");
  const [commissionPct, setCommissionPct] = useState(10);
  const [premiumMonthlyPrice, setPremiumMonthlyPrice] = useState(399);

  const [refreshing, setRefreshing] = useState(false);
  const [tierConfirmVisible, setTierConfirmVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

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
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setMerchantId(storedId);

      const portalRes = await api.get(
        `listings/merchant-portal/${storedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );

      const p = portalRes.data?.profile;
      if (p) {
        setMerchantId(String(p.merch_id || storedId));
        setBusName(p.bus_name || "Partner Establishment");
        setMerchType(p.merch_type || "Bakeshop");
        setContactPerson(p.contact_person || "Manager");
        setEmail(p.email || storedEmail);
        setPhone(p.phone || "Not Provided");
        setAddress(p.address || "Cebu City, Philippines");
        setStatus(p.status || "Active");

        setAvgRating(Number(p.avg_rating || 0));
        setReviewCount(Number(p.review_count || 0));
        setPlanId(Number(p.plan_id || 1));
        setPlanName(p.plan_name || "Free Tier (Basic)");
        setWeeklyUsed(Number(p.weekly_listings_used || 0));
        setWeeklyLimit(String(p.weekly_listings_limit || "10"));
        if (p.commission_pct !== undefined) {
          setCommissionPct(Number(p.commission_pct));
        }
        if (p.premium_monthly_price !== undefined) {
          setPremiumMonthlyPrice(Number(p.premium_monthly_price));
        }
      }
    } catch (e) {
      console.log("Merchant profile load error:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMerchantProfile();
    }, [loadMerchantProfile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMerchantProfile();
    setRefreshing(false);
  };

  const executeTierSwitch = async () => {
    setTierConfirmVisible(false);
    const targetPlan = planId === 2 ? 1 : 2;
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "upgrade_tier",
        plan_id: targetPlan,
      });
      await loadMerchantProfile();
      showModal(
        targetPlan === 2 ? "Upgraded to Premium Pro!" : "Switched to Free Tier",
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
  };

  const executeLogout = async () => {
    setLogoutConfirmVisible(false);
    await clearMerchantStorage();
    router.replace("/consumer");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

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
                )}/month to unlock Unlimited Weekly Listings and 0% Commission on all payouts!`}
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

        {/* ============================================================
            TWO MAIN ACCOUNT SETTINGS ROWS / CARDS (OPEN SEPARATE PAGES)
        ============================================================ */}
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
            : `Activate Premium Pro for ₱${premiumMonthlyPrice.toFixed(
                2
              )}/month? You will immediately unlock Unlimited Weekly Listings and 0% Platform Commission on all withdrawals.`
        }
        confirmText={
          planId === 2 ? "Switch to Free Tier" : "Activate Premium Pro"
        }
        cancelText="Cancel"
        onConfirm={executeTierSwitch}
        onCancel={() => setTierConfirmVisible(false)}
      />

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

      {/* FLUSH BOTTOM NAVIGATION BAR */}
      <EstablishmentBottomNav activeTab="Profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28 },
  titleBlock: { marginBottom: 16 },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },
  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileDetails: { flex: 1, marginLeft: 14 },
  profileName: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    color: Colors.primary2,
  },
  profileEmail: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  profileLocation: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.placeholder,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  merchantBadge: {
    backgroundColor: "#E7F0E9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  merchantBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  ratingBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: "#B45309",
  },
  tierCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: 15,
    marginBottom: 20,
  },
  tierHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tierBadgeLabel: {
    fontFamily: "PoppinsBold",
    fontSize: 9.5,
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  tierTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
    marginTop: 2,
  },
  tierPricePill: {
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierPricePillText: {
    fontFamily: "PoppinsBold",
    fontSize: 12,
    color: Colors.primary,
  },
  tierMetricsBox: {
    flexDirection: "row",
    backgroundColor: "#F7F9F7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    marginBottom: 10,
  },
  tierMetricItem: { flex: 1, alignItems: "center" },
  tierMetricDivider: { width: 1, backgroundColor: Colors.border },
  tierMetricLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
  },
  tierMetricValue: {
    fontFamily: "PoppinsBold",
    fontSize: 13,
    color: Colors.primary2,
    marginTop: 2,
  },
  tierSubNote: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
    lineHeight: 15,
    marginBottom: 12,
  },
  tierActionBtn: {
    height: 44,
    backgroundColor: Colors.button,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tierActionBtnOutline: {
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierActionBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
    marginBottom: 8,
    marginTop: 4,
  },
  featureRowCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureCardBody: {
    flex: 1,
    paddingRight: 8,
  },
  featureCardTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
  },
  featureCardDesc: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
    lineHeight: 15,
    marginTop: 2,
  },
  featureMetaPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F7F9F7",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: "100%",
  },
  metaPillText: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary2,
    flexShrink: 1,
  },
  menuItem: {
    height: 60,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  menuLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
  menuSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    marginTop: 1,
  },
  logoutButton: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E5B8B4",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  logoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: "#B3261E",
  },
  bottomSpacing: { height: 12 },
});