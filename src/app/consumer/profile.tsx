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

export default function Profile() {
  return (
    <SafeAreaView style={styles.container}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>

          <Text style={styles.logoSubtitle}>
            Consumer Portal
          </Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.icon}
          />

          <Text style={styles.locationText}>
            Lapu-Lapu City
          </Text>
        </View>
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PAGE TITLE */}

        <Text style={styles.pageTitle}>Profile</Text>

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <View style={styles.profileCard}>
          <View style={styles.profileCircle}>
            <Ionicons
              name="person"
              size={42}
              color={Colors.primary}
            />
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>Sky</Text>

            <Text style={styles.profileEmail}>
              sky@email.com
            </Text>

            <View style={styles.consumerBadge}>
              <Text style={styles.consumerBadgeText}>
                Consumer
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            ACCOUNT SETTINGS
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Account Settings
        </Text>

        {/* PERSONAL INFORMATION */}

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() =>
            router.push("/consumer/personal-info")
          }
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="person-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View>
              <Text style={styles.menuText}>
                Personal Information
              </Text>

              <Text style={styles.menuSubtext}>
                Manage your personal details
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* NOTIFICATIONS */}

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() =>
            router.push("/consumer/notifications")
          }
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View>
              <Text style={styles.menuText}>
                Notifications
              </Text>

              <Text style={styles.menuSubtext}>
                Manage your notification preferences
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* PRIVACY */}

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() =>
            router.push("/consumer/privacy")
          }
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View>
              <Text style={styles.menuText}>
                Privacy & Security
              </Text>

              <Text style={styles.menuSubtext}>
                Manage your privacy and security
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* =================================================
            INFORMATION
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Information
        </Text>

        {/* ABOUT */}

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() =>
            router.push("/consumer/about")
          }
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View>
              <Text style={styles.menuText}>
                About RESERVE
              </Text>

              <Text style={styles.menuSubtext}>
                Learn more about RESERVE
              </Text>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* =================================================
            LOG OUT
        ================================================= */}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer")
          }
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

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <View style={styles.bottomNav}>
        {/* HOME */}

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer/homepage")
          }
        >
          <Ionicons
            name="home-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            Home
          </Text>
        </TouchableOpacity>

        {/* SEARCH */}

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer/homepage")
          }
        >
          <Ionicons
            name="search-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            Search
          </Text>
        </TouchableOpacity>

        {/* CART */}

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer/cart")
          }
        >
          <Ionicons
            name="cart-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            My Cart
          </Text>
        </TouchableOpacity>

        {/* CLAIMS */}

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer/claims")
          }
        >
          <Ionicons
            name="receipt-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            My Claims
          </Text>
        </TouchableOpacity>

        {/* PROFILE */}

        <TouchableOpacity
          style={[
            styles.navItem,
            styles.navItemActive,
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-circle"
            size={21}
            color={Colors.primary}
          />

          <Text
            style={[
              styles.navLabel,
              styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* =====================================================
     CONTAINER
  ===================================================== */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* =====================================================
     HEADER — SAME AS CART
  ===================================================== */

  header: {
    height: 70,
    paddingHorizontal: 18,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 23,
    lineHeight: 26,
    color: Colors.primary,
    letterSpacing: 0.4,
  },

  logoSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 11,
    color: Colors.primary1,
    marginTop: -1,
  },

  locationPill: {
    height: 30,
    paddingHorizontal: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 12,
    color: Colors.text,
    marginLeft: 4,
  },

  /* =====================================================
     SCROLL
  ===================================================== */

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
  },

  /* =====================================================
     PAGE TITLE
  ===================================================== */

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 29,
    color: Colors.primary2,
    marginBottom: 18,
  },

  /* =====================================================
     PROFILE CARD
  ===================================================== */

  profileCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  profileCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
  },

  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    lineHeight: 25,
    color: Colors.primary2,
  },

  profileEmail: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 14,
    color: Colors.placeholder,
    marginTop: 1,
  },

  consumerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F0E9",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 7,
  },

  consumerBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 7,
    lineHeight: 10,
    color: Colors.primary,
  },

  /* =====================================================
     SECTION
  ===================================================== */

  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    lineHeight: 20,
    color: Colors.primary2,
    marginBottom: 10,
  },

  /* =====================================================
     MENU ITEMS
  ===================================================== */

  menuItem: {
    minHeight: 65,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  menuLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  menuText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    lineHeight: 15,
    color: Colors.primary2,
  },

  menuSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: Colors.placeholder,
    marginTop: 1,
  },

  /* =====================================================
     LOG OUT
  ===================================================== */

  logoutButton: {
    height: 46,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  logoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: "#A94A3A",
    marginLeft: 7,
  },

  /* =====================================================
     BOTTOM NAV — SAME AS CART
  ===================================================== */

  bottomNav: {
    height: 64,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: -2,
    },
  },

  navItem: {
    height: 48,
    minWidth: 62,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  navItemActive: {
    backgroundColor: "#E8EFEA",
  },

  navLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 11,
    color: Colors.icon,
    marginTop: 3,
  },

  navLabelActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  /* =====================================================
     BOTTOM SPACING
  ===================================================== */

  bottomSpacing: {
    height: 15,
  },
});