import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

export default function PrivacySecurity() {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER — SAME AS CART STYLE */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={Colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Privacy & Security
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage your privacy and account security
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* ACCOUNT SECURITY */}
        <Text style={styles.sectionTitle}>
          Account Security
        </Text>

        {/* CHANGE PASSWORD */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => router.push("/consumer/change-pass")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.menuText}>
              Change Password
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* PHONE NUMBER */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => router.push("/consumer/phone-num")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="call-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.menuText}>
              Phone Number
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* EMAIL */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => router.push("/consumer/email-add")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <Text style={styles.menuText}>
              Email Address
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />
        </TouchableOpacity>

        {/* PRIVACY */}
        <Text style={styles.sectionTitle}>
          Privacy
        </Text>

        {/* PROFILE VISIBILITY */}
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="eye-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.menuText}>
                Profile Visibility
              </Text>

              <Text style={styles.description}>
                Control who can see your profile
              </Text>
            </View>
          </View>

          <Switch
            value={true}
            trackColor={{
              false: Colors.border,
              true: "#B8CFC2",
            }}
            thumbColor={Colors.primary}
          />
        </View>

        {/* LOCATION */}
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="location-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.menuText}>
                Location Permissions
              </Text>

              <Text style={styles.description}>
                Allow RESERVE to access your location
              </Text>
            </View>
          </View>

          <Switch
            value={true}
            trackColor={{
              false: Colors.border,
              true: "#B8CFC2",
            }}
            thumbColor={Colors.primary}
          />
        </View>

        {/* NOTIFICATIONS */}
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.menuText}>
                Notification Permissions
              </Text>

              <Text style={styles.description}>
                Allow notifications from RESERVE
              </Text>
            </View>
          </View>

          <Switch
            value={true}
            trackColor={{
              false: Colors.border,
              true: "#B8CFC2",
            }}
            thumbColor={Colors.primary}
          />
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>
          Account
        </Text>

        {/* LOG OUT */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer")}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconCircle,
                styles.dangerIconCircle,
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#B23A3A"
              />
            </View>

            <Text
              style={[
                styles.menuText,
                styles.dangerText,
              ]}
            >
              Log Out
            </Text>
          </View>
        </TouchableOpacity>

        {/* DELETE ACCOUNT */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconCircle,
                styles.dangerIconCircle,
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#B23A3A"
              />
            </View>

            <Text
              style={[
                styles.menuText,
                styles.dangerText,
              ]}
            >
              Delete Account
            </Text>
          </View>
        </TouchableOpacity>

        {/* FOOTER */}
        <Text style={styles.footerText}>
          Your privacy and security are important to us.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* =========================
     HEADER — CART STYLE
  ========================= */

  header: {
    height: 70,
    paddingHorizontal: 18,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    marginLeft: 11,
  },

  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 16,
    lineHeight: 21,
    color: Colors.primary2,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 12,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* =========================
     CONTENT
  ========================= */

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 35,
  },

  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    lineHeight: 20,
    color: Colors.primary2,
    marginBottom: 10,
    marginTop: 4,
  },

  /* =========================
     MENU ITEMS
  ========================= */

  menuItem: {
    width: "100%",
    minHeight: 62,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 12,
    paddingVertical: 10,

    marginBottom: 10,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: "#E8EFEA",

    borderWidth: 1,
    borderColor: Colors.border,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  textContainer: {
    flex: 1,
    paddingRight: 5,
  },

  menuText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary2,
  },

  description: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 12,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* =========================
     DANGER
  ========================= */

  dangerIconCircle: {
    backgroundColor: "#FBEDED",
    borderColor: "#E8CACA",
  },

  dangerText: {
    color: "#B23A3A",
  },

  /* =========================
     FOOTER
  ========================= */

  footerText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 13,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});