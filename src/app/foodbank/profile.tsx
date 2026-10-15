import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   FOOD BANK PROFILE
===================================================== */

export default function FoodBankProfile() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const handleLogout = () => {
    router.replace("/consumer");
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Food Bank Portal</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => router.push("/foodbank/activity")}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================
          CONTENT
      ================================================= */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.scrollContentSmall,
        ]}
      >
        {/* =================================================
            PROFILE CARD
        ================================================= */}
        <View style={styles.profileCard}>
          <View style={styles.profileIconContainer}>
            <View style={styles.largeProfileCircle}>
              <Ionicons name="business" size={38} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.profileName}>Save the Earth, Inc.</Text>
          <Text style={styles.profileRole}>Food Bank Organization</Text>

          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            <Text style={styles.verifiedText}>Verified Food Bank</Text>
          </View>
        </View>

        {/* =================================================
            ORGANIZATION INFORMATION
        ================================================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization information</Text>
          <View style={styles.infoCard}>
            <ProfileInfo
              icon="business-outline"
              label="Organization name"
              value="Save the Earth, Inc."
            />
            <ProfileInfo
              icon="person-outline"
              label="Contact person"
              value="Kate Cogtas"
            />
            <ProfileInfo
              icon="briefcase-outline"
              label="Position"
              value="Food Bank Coordinator"
            />
            <ProfileInfo
              icon="mail-outline"
              label="Email address"
              value="saveearth@gmail.com"
            />
            <ProfileInfo
              icon="call-outline"
              label="Contact number"
              value="0912 345 6789"
            />
            <ProfileInfo
              icon="location-outline"
              label="Location"
              value="Pusok, Lapu-Lapu City, Cebu"
              last
            />
          </View>
        </View>

        {/* =================================================
            ACCOUNT SETTINGS
        ================================================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account settings</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="create-outline" size={19} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Edit organization</Text>
                <Text style={styles.settingSubtitle}>Update your organization information</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Change password</Text>
                <Text style={styles.settingSubtitle}>Update your account password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Verification documents</Text>
                <Text style={styles.settingSubtitle}>View your submitted organization documents</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================
            LOGOUT
        ================================================= */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#A94A3A" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* =================================================
            VERSION
        ================================================= */}
        <Text style={styles.versionText}>RESERVE Food Bank Portal</Text>
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}
      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="grid-outline"
          label="Home"
          onPress={() => router.replace("/foodbank/dashboard")}
        />
        <BottomNavItem
          icon="document-text-outline"
          label="Requests"
          onPress={() => router.replace("/foodbank/requests")}
        />
        <BottomNavItem
          icon="gift-outline"
          label="Donations"
          onPress={() => router.replace("/foodbank/donations")}
        />
        <BottomNavItem
          icon="people-outline"
          label="Partners"
          onPress={() => router.replace("/foodbank/partners")}
        />
        <BottomNavItem
          icon="time-outline"
          label="Activity"
          onPress={() => router.replace("/foodbank/activity")}
        />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   PROFILE INFO
===================================================== */

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
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

/* =====================================================
   BOTTOM NAV ITEM
===================================================== */

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? Colors.primary : Colors.icon}
      />
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: 70,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 26,
    color: Colors.primary,
    letterSpacing: 0.7,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    marginTop: -2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerIconButton: {
    position: "relative",
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A94A3A",
    right: 3,
    top: 2,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  profileCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 50,
  },
  scrollContentSmall: {
    paddingHorizontal: 12,
  },
  bottomSpace: {
    height: 20,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  profileIconContainer: {
    marginBottom: 10,
  },
  largeProfileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 18,
    color: Colors.primary2,
    marginTop: 4,
    textAlign: "center",
  },
  profileRole: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    marginTop: 2,
    textAlign: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EFEA",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
    gap: 5,
  },
  verifiedText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 16,
    color: Colors.primary2,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  infoItem: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E7EEE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  infoValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 13,
    color: Colors.primary2,
    marginTop: 1,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  settingItem: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E7EEE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 13,
    color: Colors.primary2,
  },
  settingSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  logoutButton: {
    minHeight: 50,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1C8C3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  logoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: "#A94A3A",
  },
  versionText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    textAlign: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0, // Negative value pushes the bar further down
    left: 0,
    right: 0,
    height: 90,  // Keeps your exact original height
    paddingBottom: 25, // Keeps your exact original padding
    backgroundColor: Colors.white,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
    paddingHorizontal: 2,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: "#E8EFEA",
  },
  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.icon,
    marginTop: 3,
  },
  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },
});