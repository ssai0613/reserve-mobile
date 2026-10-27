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
import { CebuAddressMapPicker } from "../components/CebuRegistrationHelpers";
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

  // Subscription Plan State
  const [planId, setPlanId] = useState<number>(1);
  const [planName, setPlanName] = useState("Free Tier (Basic)");
  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [weeklyLimit, setWeeklyLimit] = useState("10");

  // Enterprise Toggles
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

  // Premium Upgrade Payment Modal (PayMongo Live + Mock Simulator)
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

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
        if (p.latitude) setLatitude(Number(p.latitude));
        if (p.longitude) setLongitude(Number(p.longitude));
      }
    } catch (e) {
      console.log("Profile fetch error:", e);
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
      alert(res.data.message || "Enterprise profile & Haversine coordinates updated!");
    } catch (e) {
      alert("Could not update profile.");
    }
  };

  const handlePayMongoUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const pmRes = await api.post("listings/paymongo-checkout/", {
        amount: 499.0,
        description: `RESERVE Premium Tier Subscription - ${busName}`,
        payment_method: "gcash",
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
      alert(
        err.response?.data?.error ||
          "Could not open PayMongo checkout. Check PAYMONGO_SECRET_KEY in .env or use the Instant Simulator button below."
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
      alert(res.data.message);
    } catch (e) {
      alert("Failed to update subscription tier.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
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
      alert(res.data.message || "Password updated!");
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not update password.");
    }
  };

  const handleLogout = async () => {
    await clearStorage();
    router.replace("/consumer");
  };

  const handleGoBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/establishment/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "slide_from_right", headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Enterprise Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage subscription tier, Cebu City geolocation & security
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PROFILE SUMMARY */}
        <View style={styles.profileCard}>
          <View style={styles.largeProfileCircle}>
            <Ionicons name="storefront" size={38} color={Colors.white} />
          </View>
          <Text style={styles.profileName}>{busName}</Text>
          <Text style={styles.profileRole}>{merchType}</Text>
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
                onValueChange={setWeatherTttAlerts}
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
                onValueChange={setAutoDonateReminder}
                trackColor={{ false: Colors.border, true: "#B8CFC2" }}
                thumbColor={Colors.primary}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#A94A3A" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

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

      {/* PREMIUM UPGRADE DUAL PAYMENT MODAL (PAYMONGO LIVE + SIMULATOR) */}
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
              onPress={handlePayMongoUpgrade}
              disabled={isUpgrading}
            >
              <Ionicons name="globe-outline" size={16} color={Colors.white} />
              <Text style={styles.upgradeBtnText}>
                Pay ₱499.00 via PayMongo Live Gateway
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
    </SafeAreaView>
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