import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   ESTABLISHMENT PROFILE PAGE
===================================================== */

export default function EstablishmentProfile() {
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
          <Text style={styles.logo}>
            RESERVE
          </Text>

          <Text style={styles.headerSubtitle}>
            Establishment Portal
          </Text>
        </View>

        <View style={styles.headerActions}>

          {/* NOTIFICATIONS */}

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/establishment/notifications"
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.primary}
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {/* PROFILE */}

          <TouchableOpacity
            activeOpacity={0.7}
          >
            <View style={styles.profileCircle}>
              <Ionicons
                name="person"
                size={16}
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>

        </View>

      </View>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <View style={styles.profileCard}>

          {/* PROFILE ICON */}

          <View style={styles.profileIconContainer}>

            <View style={styles.largeProfileCircle}>
              <Ionicons
                name="person"
                size={38}
                color={Colors.white}
              />
            </View>

          </View>

          {/* PROFILE NAME */}

          <Text style={styles.profileName}>
            Jennelyn's Bakery
          </Text>

          <Text style={styles.profileRole}>
            Establishment Account
          </Text>

        </View>

        {/* =================================================
            ACCOUNT INFORMATION
        ================================================= */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Account information
          </Text>

          <View style={styles.infoCard}>

            {/* ESTABLISHMENT NAME */}

            <ProfileInfo
              icon="business-outline"
              label="Establishment name"
              value="Jennelyn's Bakery"
            />

            {/* EMAIL */}

            <ProfileInfo
              icon="mail-outline"
              label="Email address"
              value="jennelynsbakery@gmail.com"
            />

            {/* PHONE */}

            <ProfileInfo
              icon="call-outline"
              label="Contact number"
              value="0912 345 6789"
            />

            {/* LOCATION */}

            <ProfileInfo
              icon="location-outline"
              label="Location"
              value="Cebu City, Cebu"
              last
            />

          </View>

        </View>

        {/* =================================================
            ACCOUNT SETTINGS
        ================================================= */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Account settings
          </Text>

          <View style={styles.settingsCard}>

            {/* EDIT PROFILE */}

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
            >

              <View style={styles.settingIcon}>
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={Colors.primary}
                />
              </View>

              <View style={styles.settingContent}>

                <Text style={styles.settingTitle}>
                  Edit profile
                </Text>

                <Text style={styles.settingSubtitle}>
                  Update your establishment information
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.icon}
              />

            </TouchableOpacity>

            {/* DIVIDER */}

            <View style={styles.settingDivider} />

            {/* CHANGE PASSWORD */}

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
            >

              <View style={styles.settingIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>

              <View style={styles.settingContent}>

                <Text style={styles.settingTitle}>
                  Change password
                </Text>

                <Text style={styles.settingSubtitle}>
                  Update your account password
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.icon}
              />

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

          <Ionicons
            name="log-out-outline"
            size={20}
            color="#A94A3A"
          />

          <Text style={styles.logoutText}>
            Log Out
          </Text>

        </TouchableOpacity>

        {/* =================================================
            VERSION
        ================================================= */}

        <Text style={styles.versionText}>
          RESERVE Establishment Portal
        </Text>

        <View style={{ height: 30 }} />

      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>

        {/* HOME */}

        <BottomNavItem
          icon="grid-outline"
          label="Home"
          onPress={() =>
            router.replace(
              "/establishment/dashboard"
            )
          }
        />

        {/* LISTINGS */}

        <BottomNavItem
          icon="restaurant-outline"
          label="Listings"
          onPress={() =>
            router.replace(
              "/establishment/listing"
            )
          }
        />

        {/* ORDERS */}

        <BottomNavItem
          icon="basket-outline"
          label="Orders"
          onPress={() =>
            router.replace(
              "/establishment/orders"
            )
          }
        />

        {/* EARNINGS */}

        <BottomNavItem
          icon="cash-outline"
          label="Earnings"
          onPress={() =>
            router.push(
              "/establishment/earnings"
            )
          }
        />

        {/* DONATION */}

        <BottomNavItem
          icon="heart-outline"
          label="Donation"
          onPress={() =>
            router.replace(
              "/establishment/donation"
            )
          }
        />

        {/* IMPACT */}

        <BottomNavItem
          icon="person-outline"
          label="Impact"
          onPress={() =>
            router.push(
              "/establishment/impact"
            )
          }
        />

      </View>

    </SafeAreaView>
  );
}

/* =====================================================
   PROFILE INFO COMPONENT
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
    <View
      style={[
        styles.infoItem,
        !last && styles.infoItemBorder,
      ]}
    >

      <View style={styles.infoIcon}>

        <Ionicons
          name={icon}
          size={18}
          color={Colors.primary}
        />

      </View>

      <View style={styles.infoContent}>

        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>

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
      style={[
        styles.navItem,
        active && styles.navItemActive,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >

      <Ionicons
        name={icon}
        size={21}
        color={
          active
            ? Colors.primary
            : Colors.icon
        }
      />

      <Text
        style={[
          styles.navText,
          active && styles.navTextActive,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  /* ===================================================
     MAIN
  =================================================== */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ===================================================
     HEADER
  =================================================== */

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
    fontSize: 23,
    color: Colors.primary,
    letterSpacing: 0.7,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    marginTop: -1,
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

  /* ===================================================
     SCROLL
  =================================================== */

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 20,
  },

  /* ===================================================
     PAGE HEADER
  =================================================== */

  pageHeader: {
    marginBottom: 17,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* ===================================================
     PROFILE CARD
  =================================================== */

  profileCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingVertical: 20,
    paddingHorizontal: 15,

    alignItems: "center",

    marginBottom: 20,
  },

  profileIconContainer: {
    marginBottom: 9,
  },

  largeProfileCircle: {
    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",
  },

  profileName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
    marginTop: 3,
  },

  profileRole: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* ===================================================
     SECTION
  =================================================== */

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,

    marginBottom: 9,
  },

  /* ===================================================
     INFORMATION CARD
  =================================================== */

  infoCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingHorizontal: 11,
  },

  infoItem: {
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",
  },

  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  infoIcon: {
    width: 35,
    height: 35,

    borderRadius: 8,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
  },

  infoValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,
    color: Colors.primary2,

    marginTop: 1,
  },

  /* ===================================================
     SETTINGS
  =================================================== */

  settingsCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingHorizontal: 11,
  },

  settingItem: {
    minHeight: 62,

    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 35,
    height: 35,

    borderRadius: 8,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,
    color: Colors.primary2,
  },

  settingSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.primary1,

    marginTop: 1,
  },

  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  /* ===================================================
     LOGOUT
  =================================================== */

  logoutButton: {
    minHeight: 46,

    backgroundColor: Colors.white,

    borderRadius: 9,

    borderWidth: 1,
    borderColor: "#E1C8C3",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginBottom: 13,
  },

  logoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,

    color: "#A94A3A",

    marginLeft: 6,
  },

  /* ===================================================
     VERSION
  =================================================== */

  versionText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,

    color: Colors.primary1,

    textAlign: "center",
  },

  /* ===================================================
     BOTTOM NAVIGATION
  =================================================== */

  bottomNav: {
    height: 64,

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

    marginVertical: 5,
    marginHorizontal: 2,

    borderRadius: 7,
  },

  navItemActive: {
    backgroundColor: "#E8EFEA",
  },

  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,

    color: Colors.icon,

    marginTop: 3,
  },

  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

});