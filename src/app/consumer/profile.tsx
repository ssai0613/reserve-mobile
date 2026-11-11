import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import { ReserveConfirmModal } from "../components/CebuRegistrationHelpers";
import {
  ConsumerBottomNav,
  useIsInsideConsumerShell,
} from "../components/ConsumerNav";

let cachedProfileMemory = {
  consId: "1",
  fullName: "Consumer",
  email: "Loading...",
  phone: "",
  address: "Cebu City",
  totalSavedKg: 0,
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const clearConsumerStorage = async () => {
  const keys = [
    "access",
    "refresh",
    "user_role",
    "user_email",
    "profile_id",
    "entity_name",
    "account_status",
  ];
  for (const k of keys) {
    if (Platform.OS === "web") localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  }
};

const maskPhoneNumber = (rawPhone: string): string => {
  if (!rawPhone) return "No phone linked";
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

export default function Profile() {
  const isInsideShell = useIsInsideConsumerShell();
  if (!isInsideShell) return null;

  const [consId, setConsId] = useState(cachedProfileMemory.consId);
  const [fullName, setFullName] = useState(cachedProfileMemory.fullName);
  const [email, setEmail] = useState(cachedProfileMemory.email);
  const [phone, setPhone] = useState(cachedProfileMemory.phone);
  const [address, setAddress] = useState(cachedProfileMemory.address);
  const [totalSavedKg, setTotalSavedKg] = useState(cachedProfileMemory.totalSavedKg);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadConsumerProfile = useCallback(async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      const storedName = (await getStorageItem("entity_name")) || "";
      setConsId(storedId);
      if (storedName) setFullName(storedName);
      if (storedEmail) setEmail(storedEmail);

      const res = await api.get(
        `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );
      if (res.data?.profile) {
        const p = res.data.profile;
        const nextProfile = {
          consId: String(p.cons_id || storedId),
          fullName: p.full_name || storedName || "Consumer",
          email: p.email || storedEmail,
          phone: p.phone || "",
          address: p.address || "Cebu City",
          totalSavedKg: Number(p.total_food_saved || 0),
        };
        cachedProfileMemory = nextProfile;
        setConsId(nextProfile.consId);
        setFullName(nextProfile.fullName);
        setEmail(nextProfile.email);
        setPhone(nextProfile.phone);
        setAddress(nextProfile.address);
        setTotalSavedKg(nextProfile.totalSavedKg);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadConsumerProfile();

    const profSub = DeviceEventEmitter.addListener(
      "consumer_profile_updated",
      () => {
        loadConsumerProfile();
      }
    );
    const locSub = DeviceEventEmitter.addListener(
      "app_location_updated",
      () => {
        loadConsumerProfile();
      }
    );
    const claimsSub = DeviceEventEmitter.addListener(
      "consumer_claims_updated",
      () => {
        loadConsumerProfile();
      }
    );

    return () => {
      profSub.remove();
      locSub.remove();
      claimsSub.remove();
    };
  }, [loadConsumerProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConsumerProfile();
    setRefreshing(false);
  };

  const executeLogout = async () => {
    setLogoutConfirmVisible(false);
    await clearConsumerStorage();
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
          <Text style={styles.pageTitle}>Profile &amp; Settings</Text>
          <Text style={styles.pageSubtitle}>
            Manage your personal details, Cebu City rescue pin, and account
            security
          </Text>
        </View>

        {/* CONSUMER PROFILE HERO CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{fullName}</Text>
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
              <View style={styles.consumerBadge}>
                <Text style={styles.consumerBadgeText}>
                  Consumer • CID-{consId}
                </Text>
              </View>
              <View style={styles.impactBadge}>
                <Ionicons name="leaf" size={11} color={Colors.primary} />
                <Text style={styles.impactBadgeText}>
                  {totalSavedKg.toFixed(1)} kg Rescued
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* TWO MAIN ACCOUNT SETTINGS ROWS / CARDS (OPEN SEPARATE PAGES) */}
        <Text style={styles.sectionTitle}>Account Settings</Text>

        {/* ROW 1: PERSONAL INFORMATION & ADDRESS */}
        <TouchableOpacity
          style={styles.featureRowCard}
          activeOpacity={0.85}
          onPress={() => router.push("/consumer/personal-info")}
        >
          <View style={styles.featureIconBox}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
          </View>

          <View style={styles.featureCardBody}>
            <Text style={styles.featureCardTitle}>Personal Information</Text>
            <Text style={styles.featureCardDesc}>
              Full name, detailed profile info, and your Cebu City Haversine
              address pin
            </Text>
            <View style={styles.featureMetaPills}>
              <View style={styles.metaPill}>
                <Ionicons
                  name="person-circle-outline"
                  size={12}
                  color={Colors.primary}
                />
                <Text style={styles.metaPillText} numberOfLines={1}>
                  {fullName}
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
          onPress={() => router.push("/consumer/privacy")}
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
              Update email address, SMS-verified phone number, password, and
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
          onPress={() => router.push("/help-support?role=Consumer" as any)}
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
                View FAQs or send a report to ReServe Admin
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.85}
          onPress={() => router.push("/consumer/about")}
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

      <ReserveConfirmModal
        visible={logoutConfirmVisible}
        title="Confirm Logout"
        message="Are you sure you want to log out of your Consumer account?"
        confirmText="Yes, Log Out"
        cancelText="Stay Logged In"
        isDestructive
        onConfirm={executeLogout}
        onCancel={() => setLogoutConfirmVisible(false)}
      />

      <ConsumerBottomNav activeTab="Profile" />
    </View>
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
    marginBottom: 20,
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
  consumerBadge: {
    backgroundColor: "#E7F0E9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  consumerBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary,
  },
  impactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F2F7F4",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  impactBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary2,
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