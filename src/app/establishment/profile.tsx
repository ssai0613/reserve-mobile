import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import {
  CebuAddressMapPicker,
  ReserveAlertModal,
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import { getAppStorage, setAppStorage } from "../components/EstablishmentNav";

const clearStorage = async () => {
  const keys = [
    "access",
    "refresh",
    "user_role",
    "user_email",
    "profile_id",
    "entity_name",
    "merch_type",
    "account_status",
    "status_reason",
    "expiry_date",
  ];
  for (const k of keys) {
    if (Platform.OS === "web") localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  }
};

export default function EstablishmentProfile() {
  const [merchantId, setMerchantId] = useState("1");
  const [busName, setBusName] = useState("Partner Establishment");
  const [merchType, setMerchType] = useState("Establishment Account");
  const [contactPerson, setContactPerson] = useState("Manager");
  const [email, setEmail] = useState("Not Set");
  const [phone, setPhone] = useState("Not Provided");
  const [address, setAddress] = useState("Cebu City, Philippines");
  const [latitude, setLatitude] = useState(10.3157);
  const [longitude, setLongitude] = useState(123.8854);

  // Merchant Star Rating Tally
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // Wallet & Withdrawals State
  const [walletBalanceStr, setWalletBalanceStr] = useState("₱0.00");
  const [rawWalletBal, setRawWalletBal] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawChannel, setWithdrawChannel] = useState<"GCash" | "Maya">("GCash");
  const [withdrawAcctNum, setWithdrawAcctNum] = useState("");
  const [withdrawAcctName, setWithdrawAcctName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);

  // Subscription Plan State
  const [planId, setPlanId] = useState<number>(1);
  const [planName, setPlanName] = useState("Free Tier (Basic)");
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [weeklyLimit, setWeeklyLimit] = useState("10");

  // Persistent Enterprise Toggles
  const [weatherTttAlerts, setWeatherTttAlerts] = useState(true);
  const [autoDonateReminder, setAutoDonateReminder] = useState(true);

  // Edit Profile & Location Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBarangay, setEditBarangay] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLat, setEditLat] = useState(10.3157);
  const [editLng, setEditLng] = useState(123.8854);

  // Change Password Modal
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Premium Upgrade Payment Modal (Xendit GCash/Maya)
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Logout Confirm & Alert Modals
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
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
  ) => {
    setModalAlert({ visible: true, title, message, type });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const rawId = await getAppStorage("profile_id");
      const storedId = rawId && /^\d+$/.test(rawId) ? rawId : "1";
      const storedEmail = (await getAppStorage("user_email")) || "";
      setMerchantId(storedId);

      const res = await api.get(
        `listings/merchant-portal/${storedId}/?email=${encodeURIComponent(storedEmail)}`
      );
      const p = res.data.profile;
      const e = res.data.earnings;
      if (p) {
        setMerchantId(String(p.merch_id));
        setBusName(p.bus_name);
        setMerchType(`${p.merch_type} Account`);
        setContactPerson(p.contact_person || "Manager");
        setEmail(p.email);
        setPhone(p.phone);
        setAddress(p.address);
        setPlanId(Number(p.plan_id || 1));
        setPlanName(p.plan_name || "Free Tier (Basic)");
        setWeeklyUsed(Number(p.weekly_listings_used || 0));
        setWeeklyLimit(String(p.weekly_listings_limit || "10"));
        setAvgRating(Number(p.avg_rating || 0));
        setReviewCount(Number(p.review_count || 0));
        if (p.latitude) setLatitude(Number(p.latitude));
        if (p.longitude) setLongitude(Number(p.longitude));
      }
      if (e) {
        setWalletBalanceStr(e.wallet_balance || "₱0.00");
        setRawWalletBal(Number(e.raw_wallet_balance || 0));
        setWithdrawals(e.withdrawals || []);
      }

      // Load saved persistent settings from DB
      const setRes = await api.get(
        `accounts/settings/?role=Merchant&profile_id=${storedId}&email=${encodeURIComponent(
          storedEmail
        )}`
      );
      if (setRes.data) {
        if (typeof setRes.data.weatherTttAlerts === "boolean") {
          setWeatherTttAlerts(setRes.data.weatherTttAlerts);
        }
        if (typeof setRes.data.autoDonateReminder === "boolean") {
          setAutoDonateReminder(setRes.data.autoDonateReminder);
        }
      }
    } catch (e) {
      console.log("Profile fetch error:", e);
    }
  };

  const handleToggleSetting = async (
    key: "weatherTttAlerts" | "autoDonateReminder",
    val: boolean
  ) => {
    if (key === "weatherTttAlerts") setWeatherTttAlerts(val);
    if (key === "autoDonateReminder") setAutoDonateReminder(val);

    try {
      await api.post("accounts/settings/", {
        role: "Merchant",
        profile_id: merchantId,
        email: email,
        settings: {
          weatherTttAlerts: key === "weatherTttAlerts" ? val : weatherTttAlerts,
          autoDonateReminder:
            key === "autoDonateReminder" ? val : autoDonateReminder,
        },
      });
    } catch (err) {
      console.log("Settings save notice:", err);
    }
  };

  const openWithdrawModal = () => {
    setWithdrawChannel("GCash");
    setWithdrawAcctNum(phone !== "Not Provided" ? phone : "");
    setWithdrawAcctName(contactPerson);
    setWithdrawAmount(rawWalletBal > 0 ? String(rawWalletBal) : "");
    setWithdrawModalOpen(true);
  };

  const handleSubmitWithdrawal = async () => {
    const amtNum = parseFloat(withdrawAmount || "0");
    if (!amtNum || amtNum <= 0) {
      showModal(
        "Invalid Amount",
        "Please enter a withdrawal amount greater than ₱0.00.",
        "warning"
      );
      return;
    }
    if (amtNum > rawWalletBal) {
      showModal(
        "Insufficient Balance",
        `Your requested amount (₱${amtNum.toFixed(
          2
        )}) exceeds your available wallet balance (${walletBalanceStr}).`,
        "error"
      );
      return;
    }
    if (!withdrawAcctNum.trim() || !withdrawAcctName.trim()) {
      showModal(
        "Missing Account Info",
        `Please enter both your ${withdrawChannel} account number and registered account name.`,
        "warning"
      );
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "request_withdrawal",
        channel: withdrawChannel,
        account_number: withdrawAcctNum.trim(),
        account_name: withdrawAcctName.trim(),
        amount: amtNum,
      });
      setWithdrawModalOpen(false);
      await loadProfile();
      showModal(
        "Withdrawal Request Submitted",
        res.data?.message || "Your withdrawal request is now pending Admin transfer.",
        "success"
      );
    } catch (err: any) {
      showModal(
        "Withdrawal Failed",
        err.response?.data?.error || "Could not submit withdrawal request.",
        "error"
      );
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const openEditModal = () => {
    setEditName(busName);
    setEditContactPerson(contactPerson);
    setEditEmail(email);
    setEditPhone(phone);
    setEditAddress(address);
    setEditStreet(address.split(",")[0] || "");
    setEditLat(latitude);
    setEditLng(longitude);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "update_profile",
        bus_name: editName,
        contact_person: editContactPerson,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        latitude: editLat,
        longitude: editLng,
      });
      setBusName(editName);
      setContactPerson(editContactPerson);
      setEmail(editEmail);
      setPhone(editPhone);
      setAddress(editAddress);
      setLatitude(editLat);
      setLongitude(editLng);
      await setAppStorage("entity_name", editName);
      setEditModalVisible(false);
      showModal(
        "Profile Updated",
        res.data.message || "Enterprise profile & Haversine coordinates updated!",
        "success"
      );
    } catch (e) {
      showModal("Update Failed", "Could not update profile.", "error");
    }
  };

  const handleXenditUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const pmRes = await api.post("listings/paymongo-checkout/", {
        amount: 499.0,
        description: `RESERVE Premium Tier Subscription - ${busName}`,
        payment_method: "GCash",
      });
      if (pmRes.data?.checkout_url) {
        if (Platform.OS === "web") {
          window.open(pmRes.data.checkout_url, "_blank");
        } else {
          Linking.openURL(pmRes.data.checkout_url);
        }
      }
      await completeTierUpgrade(2);
    } catch (err: any) {
      showModal(
        "Xendit Gateway Notice",
        err.response?.data?.error ||
          "Could not open Xendit checkout. Check XENDIT_SECRET_KEY in .env or use the Instant Simulator button.",
        "error"
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  const completeTierUpgrade = async (targetPlan: number) => {
    setIsUpgrading(true);
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "upgrade_tier",
        plan_id: targetPlan,
      });
      setPlanId(targetPlan);
      setPlanName(res.data.plan_name);
      setWeeklyLimit(targetPlan === 2 ? "Unlimited" : "10");
      setUpgradeModalVisible(false);
      showModal("Subscription Updated", res.data.message, "success");
    } catch (e) {
      showModal("Upgrade Error", "Failed to update subscription tier.", "error");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showModal(
        "Weak Password",
        "Password must be at least 6 characters.",
        "warning"
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal("Password Mismatch", "Passwords do not match.", "error");
      return;
    }
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "change_password",
        new_password: newPassword,
      });
      setPwModalVisible(false);
      setNewPassword("");
      setConfirmPassword("");
      showModal(
        "Password Updated",
        res.data.message || "Password updated!",
        "success"
      );
    } catch (e: any) {
      showModal(
        "Error",
        e.response?.data?.error || "Could not update password.",
        "error"
      );
    }
  };

  const executeLogout = async () => {
    setLogoutConfirmOpen(false);
    await clearStorage();
    router.replace("/consumer");
  };

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/establishment/dashboard");
  };

  const parsedWithdrawAmt = parseFloat(withdrawAmount || "0") || 0;
  const withdrawFee = planId === 2 ? 0 : parsedWithdrawAmt * 0.1;
  const withdrawNet = Math.max(0, parsedWithdrawAmt - withdrawFee);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "slide_from_right", headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Enterprise Settings & Wallet</Text>
          <Text style={styles.headerSubtitle}>
            Manage ratings, withdrawals, subscription & Cebu City geolocation
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PROFILE SUMMARY WITH STAR RATING TALLY */}
        <View style={styles.profileCard}>
          <View style={styles.largeProfileCircle}>
            <Ionicons name="storefront" size={38} color={Colors.white} />
          </View>
          <Text style={styles.profileName}>{busName}</Text>
          <Text style={styles.profileRole}>{merchType}</Text>

          <View style={styles.ratingPill}>
            <Text style={styles.ratingStars}>
              {"⭐".repeat(reviewCount > 0 ? Math.max(1, Math.round(avgRating)) : 5)}
            </Text>
            <Text style={styles.ratingText}>
              {reviewCount > 0 ? `${avgRating.toFixed(1)}` : "New"} ({reviewCount}{" "}
              {reviewCount === 1 ? "review" : "reviews"})
            </Text>
          </View>

          <View style={styles.tierBadge}>
            <Ionicons
              name={planId === 2 ? "diamond" : "leaf"}
              size={13}
              color={planId === 2 ? "#B45309" : Colors.primary}
            />
            <Text style={[styles.tierBadgeText, planId === 2 && { color: "#B45309" }]}>
              {planName} • {weeklyUsed}/{weeklyLimit} Listings Used
            </Text>
          </View>
        </View>

        {/* WALLET & WITHDRAWAL REQUESTS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchant Wallet & Withdrawals</Text>
          <View style={styles.planCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={styles.infoLabel}>Available Wallet Balance</Text>
                <Text style={{ fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary }}>
                  {walletBalanceStr}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.upgradeBtn, { marginTop: 0, paddingHorizontal: 16 }]}
                activeOpacity={0.85}
                onPress={openWithdrawModal}
              >
                <Ionicons name="wallet-outline" size={16} color={Colors.white} />
                <Text style={styles.upgradeBtnText}>Request Withdraw</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.planDesc, { marginTop: 8 }]}>
              {planId === 2
                ? "Pro Tier Benefit: 0% platform deduction on all GCash & Maya withdrawals."
                : "Free Tier Policy: 10% platform commission is deducted upon withdrawal."}
            </Text>

            {withdrawals.length > 0 && (
              <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }}>
                <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2, marginBottom: 8 }}>
                  Recent Withdrawal Requests
                </Text>
                {withdrawals.map((w) => (
                  <View
                    key={w.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 9,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F0F2F1",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 }}>
                        {w.id} • {w.amount} ({w.channel})
                      </Text>
                      <Text style={{ fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 }}>
                        Net: {w.net_payout} • {w.created_at}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          backgroundColor:
                            w.status === "Approved"
                              ? "#E4F0E8"
                              : w.status === "Rejected"
                              ? "#FBE4E1"
                              : "#FEF3C7",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "PoppinsSemiBold",
                            fontSize: 9.5,
                            color:
                              w.status === "Approved"
                                ? "#1F6B52"
                                : w.status === "Rejected"
                                ? "#B3261E"
                                : "#B45309",
                          }}
                        >
                          {w.status}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 7,
                          borderWidth: 1,
                          borderColor: Colors.border,
                          backgroundColor: Colors.background,
                        }}
                        onPress={() => setSelectedWithdrawal(w)}
                      >
                        <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary2 }}>
                          View
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* SUBSCRIPTION TIER & UPGRADE CARD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription & Commission Plan</Text>
          <View style={styles.planCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{planName}</Text>
                <Text style={styles.planDesc}>
                  {planId === 2
                    ? "Unlimited weekly listings • 0% ReServe commission (Keep 100% of wallet payouts)"
                    : "Limited to 10 listings/week • 10% ReServe commission deducted on wallet payouts"}
                </Text>
              </View>
            </View>

            {planId === 1 ? (
              <TouchableOpacity
                style={styles.upgradeBtn}
                activeOpacity={0.85}
                onPress={() => setUpgradeModalVisible(true)}
              >
                <Ionicons name="sparkles" size={16} color={Colors.white} />
                <Text style={styles.upgradeBtnText}>
                  Upgrade to Premium Tier (₱499 / month)
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: "#E8EFEA" }]}
                onPress={() => completeTierUpgrade(1)}
              >
                <Text style={[styles.upgradeBtnText, { color: Colors.primary2 }]}>
                  Switch Back to Free Tier (Demo Toggle)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ESTABLISHMENT DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Establishment & Geolocation Info</Text>
          <View style={styles.infoCard}>
            <ProfileInfo icon="business-outline" label="Establishment name" value={busName} />
            <ProfileInfo icon="person-outline" label="Contact person" value={contactPerson} />
            <ProfileInfo icon="mail-outline" label="Email address" value={email} />
            <ProfileInfo icon="call-outline" label="Contact / GCash number" value={phone} />
            <ProfileInfo icon="location-outline" label="Cebu City Address" value={address} />
            <ProfileInfo
              icon="navigate-outline"
              label="Pinned Haversine GPS"
              value={`${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`}
              last
            />
          </View>
        </View>

        {/* ENTERPRISE CONFIGURATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Operational Controls</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={openEditModal}>
              <View style={styles.settingIcon}>
                <Ionicons name="map-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Edit Profile & Cebu City Map Pin</Text>
                <Text style={styles.settingSubtitle}>
                  Update business details, barangay, and 10km Haversine pin
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => setPwModalVisible(true)}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingSubtitle}>Update your account security credentials</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="thermometer-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Live Cebu Weather TTT Alerts</Text>
                <Text style={styles.settingSubtitle}>
                  Notify when high Cebu temperatures accelerate shelf-life decay
                </Text>
              </View>
              <Switch
                value={weatherTttAlerts}
                onValueChange={(val) => handleToggleSetting("weatherTttAlerts", val)}
                trackColor={{ false: Colors.border, true: "#B8CFC2" }}
                thumbColor={Colors.primary}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="heart-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>1-Hr Expiry Donation Prompts</Text>
                <Text style={styles.settingSubtitle}>
                  Prompt to donate unsold items 1 hour before safety threshold
                </Text>
              </View>
              <Switch
                value={autoDonateReminder}
                onValueChange={(val) => handleToggleSetting("autoDonateReminder", val)}
                trackColor={{ false: Colors.border, true: "#B8CFC2" }}
                thumbColor={Colors.primary}
              />
            </View>

            <View style={styles.settingDivider} />

            {/* HELP & SUPPORT OPTION */}
            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => router.push("/help-support?role=Merchant" as any)}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="help-buoy-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSubtitle}>
                  Browse Merchant FAQs or send a report to ReServe Admin
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={() => setLogoutConfirmOpen(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#A94A3A" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* REQUEST WITHDRAWAL MODAL (GCASH / MAYA + 10% FEE BREAKDOWN) */}
      <Modal
        visible={withdrawModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Wallet Withdrawal</Text>
            <Text style={styles.planDesc}>
              Available Wallet Balance:{" "}
              <Text style={{ fontFamily: "PoppinsBold", color: Colors.primary2 }}>
                {walletBalanceStr}
              </Text>
            </Text>

            <Text style={styles.inputLabel}>Select E-Wallet Channel *</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
              {(["GCash", "Maya"] as const).map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: withdrawChannel === ch ? Colors.primary : Colors.border,
                    backgroundColor: withdrawChannel === ch ? "#E8EFEA" : Colors.input,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setWithdrawChannel(ch)}
                >
                  <Text
                    style={{
                      fontFamily:
                        withdrawChannel === ch ? "PoppinsSemiBold" : "PoppinsRegular",
                      fontSize: 12,
                      color: withdrawChannel === ch ? Colors.primary : Colors.primary2,
                    }}
                  >
                    {ch}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{withdrawChannel} Account Number *</Text>
            <TextInput
              style={styles.input}
              value={withdrawAcctNum}
              onChangeText={setWithdrawAcctNum}
              keyboardType="phone-pad"
              placeholder="e.g. 09171234567"
            />

            <Text style={styles.inputLabel}>Registered Account Name *</Text>
            <TextInput
              style={styles.input}
              value={withdrawAcctName}
              onChangeText={setWithdrawAcctName}
              placeholder="Full name on e-wallet"
            />

            <Text style={styles.inputLabel}>Amount to Withdraw (₱) *</Text>
            <TextInput
              style={styles.input}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="e.g. 500.00"
            />

            <View
              style={{
                backgroundColor: "#F2F7F4",
                borderRadius: 10,
                padding: 12,
                marginTop: 12,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 }}>
                  Requested Amount:
                </Text>
                <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 }}>
                  ₱{parsedWithdrawAmt.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 }}>
                  {planId === 2 ? "Pro Tier Fee (0%):" : "Free Tier Deduction (10%):"}
                </Text>
                <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 11, color: "#B3261E" }}>
                  -₱{withdrawFee.toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 6,
                  paddingTop: 6,
                  borderTopWidth: 1,
                  borderTopColor: Colors.border,
                }}
              >
                <Text style={{ fontFamily: "PoppinsBold", fontSize: 12, color: Colors.primary2 }}>
                  Net Transfer to {withdrawChannel}:
                </Text>
                <Text style={{ fontFamily: "PoppinsBold", fontSize: 13, color: Colors.primary }}>
                  ₱{withdrawNet.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setWithdrawModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSubmitWithdrawal}
                disabled={submittingWithdraw}
              >
                <Text style={styles.saveBtnText}>
                  {submittingWithdraw ? "Submitting..." : "Submit Request"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW WITHDRAWAL REQUEST DETAILS MODAL */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Withdrawal Details ({selectedWithdrawal?.id})
            </Text>
            {selectedWithdrawal && (
              <View style={{ gap: 8, marginTop: 4 }}>
                <DetailLine label="Status" value={selectedWithdrawal.status} />
                <DetailLine label="E-Wallet Channel" value={selectedWithdrawal.channel} />
                <DetailLine
                  label="Account Number"
                  value={selectedWithdrawal.account_number}
                />
                <DetailLine label="Account Name" value={selectedWithdrawal.account_name} />
                <DetailLine label="Requested Amount" value={selectedWithdrawal.amount} />
                <DetailLine
                  label="Platform Fee Deducted"
                  value={selectedWithdrawal.fee_deducted}
                />
                <DetailLine
                  label="Net Amount to Receive"
                  value={selectedWithdrawal.net_payout}
                />
                <DetailLine
                  label="Transfer Reference #"
                  value={selectedWithdrawal.reference_number || "Awaiting Admin Transfer"}
                />
                <DetailLine label="Requested On" value={selectedWithdrawal.created_at} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, { flex: 0, marginTop: 16 }]}
              onPress={() => setSelectedWithdrawal(null)}
            >
              <Text style={styles.saveBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT PROFILE + CEBU CITY MAP RE-PINNING MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Establishment & Map Location</Text>

              <Text style={styles.inputLabel}>Establishment Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} />

              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput
                style={styles.input}
                value={editContactPerson}
                onChangeText={setEditContactPerson}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Contact / GCash Number (+63)</Text>
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} />

              <View style={{ marginTop: 10 }}>
                <CebuAddressMapPicker
                  selectedBarangay={editBarangay}
                  onSelectBarangay={(brgy, fullAddr) => {
                    setEditBarangay(brgy);
                    setEditAddress(fullAddr);
                  }}
                  streetDetail={editStreet}
                  onChangeStreetDetail={(st, fullAddr) => {
                    setEditStreet(st);
                    setEditAddress(fullAddr);
                  }}
                  latitude={editLat}
                  longitude={editLng}
                  onChangeCoords={(lat, lng) => {
                    setEditLat(lat);
                    setEditLng(lng);
                  }}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PREMIUM UPGRADE MODAL (XENDIT GCASH / MAYA) */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upgrade to Premium Tier (Pro)</Text>
            <Text style={styles.planDesc}>
              • Unlimited weekly food listings{"\n"}• 0% ReServe commission on all sales{"\n"}•
              Priority placement in 10km Haversine feed{"\n"}• Subscription Fee: ₱499.00 / month
            </Text>

            <TouchableOpacity
              style={[styles.upgradeBtn, { marginTop: 14 }]}
              onPress={handleXenditUpgrade}
              disabled={isUpgrading}
            >
              <Ionicons name="globe-outline" size={16} color={Colors.white} />
              <Text style={styles.upgradeBtnText}>
                Pay ₱499.00 via Xendit (GCash / Maya)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: Colors.primary2, marginTop: 8 }]}
              onPress={() => completeTierUpgrade(2)}
              disabled={isUpgrading}
            >
              <Ionicons name="flash-outline" size={16} color={Colors.white} />
              <Text style={styles.upgradeBtnText}>
                Instant Demo Upgrade (Simulator)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 10, flex: 0 }]}
              onPress={() => setUpgradeModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={pwModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Minimum 6 characters"
            />
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter password"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPwModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                <Text style={styles.saveBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <ReserveConfirmModal
        visible={logoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out of your Food Establishment account?"
        confirmText="Yes, Log Out"
        cancelText="Stay Logged In"
        isDestructive
        onConfirm={executeLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      {/* GLOBAL ALERT MODAL */}
      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F2F1",
        paddingBottom: 6,
      }}
    >
      <Text style={{ fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 }}>
        {value}
      </Text>
    </View>
  );
}

function ProfileInfo({
  icon,
  label,
  value,
  last = false,
}: {
  icon: any;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoItem, !last && styles.infoItemBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { minHeight: 70, backgroundColor: Colors.background, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "PoppinsBold", fontSize: 19, color: Colors.primary2 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: -2 },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 40 },
  profileCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 22, paddingHorizontal: 18, alignItems: "center", marginBottom: 20 },
  largeProfileCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  profileName: { fontFamily: "PoppinsSemiBold", fontSize: 18, color: Colors.primary2 },
  profileRole: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1 },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF3C7", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: "#FDE68A" },
  ratingStars: { fontSize: 11 },
  ratingText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: "#92400E" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E8EFEA", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginTop: 8 },
  tierBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.primary },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginBottom: 8 },
  planCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  planTitle: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary2 },
  planDesc: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 4, lineHeight: 17 },
  upgradeBtn: { height: 44, backgroundColor: Colors.button, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  upgradeBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  infoCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  infoItem: { minHeight: 58, flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 11 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1 },
  infoValue: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2, marginTop: 1 },
  settingsCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  settingItem: { minHeight: 64, flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 11 },
  settingContent: { flex: 1, paddingRight: 8 },
  settingTitle: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  settingSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, marginTop: 1 },
  settingDivider: { height: 1, backgroundColor: Colors.border },
  logoutButton: { minHeight: 48, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: "#E1C8C3", flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  logoutText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: "#A94A3A", marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: Colors.white, borderRadius: 16, padding: 18 },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary2, marginBottom: 10 },
  inputLabel: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary1, marginTop: 8, marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, backgroundColor: Colors.input },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, height: 42, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  saveBtn: { flex: 1, height: 42, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
});