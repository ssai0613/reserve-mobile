import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

export default function RescueConfirmed() {
  return (
    <View style={styles.container}>

      {/* =================================================
          HEADER — SAME AS CART
      ================================================= */}

      <View style={styles.header}>
        <View style={styles.logoContainer}>
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

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <View style={styles.titleSection}>

          <View style={styles.titleRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.replace("/consumer/claims")}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.pageTitle}>
                Rescue Confirmed
              </Text>

              <Text style={styles.pageSubtitle}>
                Your food rescue has been successfully confirmed.
              </Text>
            </View>

          </View>

        </View>

        {/* =================================================
            SUCCESS
        ================================================= */}

        <View style={styles.successSection}>

          <View style={styles.successCircle}>
            <Ionicons
              name="checkmark"
              size={42}
              color={Colors.white}
            />
          </View>

          <Text style={styles.successText}>
            Rescue Made Successfully!
          </Text>

          <Text style={styles.successSubtext}>
            Your rescue item has been reserved successfully.
          </Text>

        </View>

        {/* =================================================
            PROOF OF TRANSACTION
        ================================================= */}

        <View style={styles.proofCard}>

          <Text style={styles.proofTitle}>
            Proof of Transaction
          </Text>

          <View style={styles.qrContainer}>
            <Image
              source={require("../../assets/qr.png")}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.voucherText}>
            Your QR Voucher
          </Text>

          <Text style={styles.referenceLabel}>
            Reference Number
          </Text>

          <Text style={styles.referenceNumber}>
            FBK-2024-0315-A123
          </Text>

        </View>

        {/* =================================================
            IMPORTANT NOTICE
        ================================================= */}

        <View style={styles.noticeCard}>

          <View style={styles.noticeIconContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.noticeContent}>

            <Text style={styles.noticeTitle}>
              Pickup Reminder
            </Text>

            <Text style={styles.noticeText}>
              Please arrive at{" "}
              <Text style={styles.noticeBold}>
                Nena's Bakery (Pusok, Lapu-Lapu)
              </Text>{" "}
              not later than{" "}
              <Text style={styles.noticeBold}>
                4:30 PM
              </Text>
              .
            </Text>

          </View>

        </View>

        {/* =================================================
            PAYMENT SUMMARY
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Payment Summary
        </Text>

        <View style={styles.summaryCard}>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Total Value
            </Text>

            <Text style={styles.summaryValue}>
              ₱100.00
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Paid Today
            </Text>

            <Text style={styles.summaryValue}>
              ₱10.00
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Remaining Balance
            </Text>

            <Text style={styles.summaryValue}>
              ₱90.00
            </Text>
          </View>

        </View>

        {/* =================================================
            DONE BUTTON
        ================================================= */}

        <TouchableOpacity
          style={styles.doneButton}
          activeOpacity={0.8}
          onPress={() =>
            router.replace("/consumer/claims")
          }
        >
          <Ionicons
            name="receipt-outline"
            size={17}
            color={Colors.white}
          />

          <Text style={styles.doneButtonText}>
            View My Claims
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color={Colors.white}
          />
        </TouchableOpacity>

        <Text style={styles.secureText}>
          Keep your QR voucher ready when claiming your rescue item.
        </Text>

        <View style={styles.bottomSpace} />

      </ScrollView>

      {/* =================================================
          BOTTOM NAV — SAME AS CART
      ================================================= */}

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
          style={[
            styles.navItem,
            styles.navItemActive,
          ]}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer/claims")
          }
        >
          <Ionicons
            name="receipt"
            size={21}
            color={Colors.primary}
          />

          <Text
            style={[
              styles.navLabel,
              styles.navLabelActive,
            ]}
          >
            My Claims
          </Text>
        </TouchableOpacity>

        {/* PROFILE */}

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/consumer/profile")
          }
        >
          <Ionicons
            name="person-circle-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            Profile
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  // =======================================================
  // MAIN
  // =======================================================

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // =======================================================
  // HEADER — EXACT CART STYLE
  // =======================================================

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

  logoContainer: {
    justifyContent: "center",
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
    justifyContent: "center",
  },

  locationText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 12,
    color: Colors.text,
    marginLeft: 4,
  },

  // =======================================================
  // SCROLL
  // =======================================================

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
  },

  // =======================================================
  // TITLE
  // =======================================================

  titleSection: {
    marginBottom: 18,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 34,
    height: 34,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 29,
    color: Colors.primary2,
  },

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
    marginTop: 2,
  },

  // =======================================================
  // SUCCESS
  // =======================================================

  successSection: {
    alignItems: "center",
    marginBottom: 18,
  },

  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.button,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  successText: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    lineHeight: 22,
    color: Colors.primary2,
    textAlign: "center",
  },

  successSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 14,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 3,
  },

  // =======================================================
  // PROOF CARD
  // =======================================================

  proofCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 15,
  },

  proofTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    lineHeight: 18,
    color: Colors.primary2,
    marginBottom: 8,
  },

  qrContainer: {
    width: 170,
    height: 170,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  qrImage: {
    width: 155,
    height: 155,
  },

  voucherText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary2,
    marginTop: 2,
  },

  referenceLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 12,
    color: Colors.placeholder,
    marginTop: 7,
  },

  referenceNumber: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    lineHeight: 20,
    color: Colors.primary,
    marginTop: 1,
  },

  // =======================================================
  // NOTICE — SAME CARD LANGUAGE AS CART
  // =======================================================

  noticeCard: {
    backgroundColor: "#EEF3EF",
    borderWidth: 1,
    borderColor: "#D3DED6",
    borderRadius: 10,
    padding: 11,
    flexDirection: "row",
    marginBottom: 20,
  },

  noticeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EAE3",
    alignItems: "center",
    justifyContent: "center",
  },

  noticeContent: {
    flex: 1,
    marginLeft: 9,
  },

  noticeTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary2,
    marginBottom: 2,
  },

  noticeText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 14,
    color: Colors.primary1,
  },

  noticeBold: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },

  // =======================================================
  // SECTION TITLE
  // =======================================================

  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    lineHeight: 18,
    color: Colors.primary2,
    marginBottom: 9,
  },

  // =======================================================
  // SUMMARY — SAME AS CART
  // =======================================================

  summaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  summaryLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 13,
    color: Colors.primary1,
  },

  summaryValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary2,
  },

  // =======================================================
  // BUTTON
  // =======================================================

  doneButton: {
    height: 50,
    backgroundColor: Colors.button,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  doneButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    lineHeight: 15,
    color: Colors.white,
  },

  secureText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 12,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 8,
  },

  bottomSpace: {
    height: 20,
  },

  // =======================================================
  // BOTTOM NAV — EXACT CART STYLE
  // =======================================================

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

});