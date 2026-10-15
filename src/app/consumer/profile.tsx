import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/color";

export default function Profile() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.logoSubtitle}>Consumer Portal</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={13} color={Colors.primary} />
          <Text style={styles.locationText}>Lapu-Lapu City</Text>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.pageTitle}>Profile</Text>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={38} color={Colors.primary} />
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>Sky</Text>
            <Text style={styles.profileEmail}>sky@email.com</Text>

            <View style={styles.consumerBadge}>
              <Text style={styles.consumerBadgeText}>Consumer</Text>
            </View>
          </View>
        </View>

        {/* ACCOUNT SETTINGS */}
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.88}
          onPress={() => router.push("/consumer/personal-info")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>Personal Information</Text>
              <Text style={styles.menuSubtext}>Manage your personal details</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.88}
          onPress={() => router.push("/consumer/notifications")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>Notifications</Text>
              <Text style={styles.menuSubtext}>Manage your notification preferences</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.88}
          onPress={() => router.push("/consumer/privacy")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>Privacy & Security</Text>
              <Text style={styles.menuSubtext}>Manage your privacy and security</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        {/* INFORMATION */}
        <Text style={styles.sectionTitle}>Information</Text>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.88}
          onPress={() => router.push("/consumer/about")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>About RESERVE</Text>
              <Text style={styles.menuSubtext}>Learn more about RESERVE</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        {/* LOG OUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/consumer")}
        >
          <Ionicons name="log-out-outline" size={18} color="#B3261E" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/homepage")}
        >
          <Ionicons name="home-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/cart")}
        >
          <Ionicons name="cart-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/claims")}
        >
          <Ionicons name="receipt-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>My Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={1}
        >
          <Ionicons name="person" size={22} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: -3,
  },
  locationPill: {
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
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
    alignItems: "center",
    justifyContent: "center",
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    color: Colors.primary2,
  },
  profileEmail: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.placeholder,
    marginTop: 1,
  },
  consumerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F0E9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  consumerBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
    marginBottom: 8,
    marginTop: 4,
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
  menuLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
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
    borderColor: Colors.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  logoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: "#B3261E",
  },
  bottomSpacing: {
    height: 16,
  },
  bottomNav: {
    height: 84,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
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
    fontSize: 10,
    color: Colors.icon,
    marginTop: 2,
  },
  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
});