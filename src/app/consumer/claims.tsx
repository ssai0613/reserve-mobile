import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/color";

export default function RescueConfirmed() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
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
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.replace("/consumer/claims")}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            </TouchableOpacity>

            <View>
              <Text style={styles.pageTitle}>Rescue Confirmed</Text>
              <Text style={styles.pageSubtitle}>Your food rescue has been successfully confirmed.</Text>
            </View>
          </View>
        </View>

        {/* SUCCESS */}
        <View style={styles.successSection}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color={Colors.white} />
          </View>

          <Text style={styles.successText}>Rescue Made Successfully!</Text>
          <Text style={styles.successSubtext}>Your rescue item has been reserved successfully.</Text>
        </View>

        {/* PROOF OF TRANSACTION */}
        <View style={styles.proofCard}>
          <Text style={styles.proofTitle}>Proof of Transaction</Text>

          <View style={styles.qrContainer}>
            <Image
              source={require("../../assets/qr.png")}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.voucherText}>Your QR Voucher</Text>
          <Text style={styles.referenceLabel}>Reference Number</Text>
          <Text style={styles.referenceNumber}>FBK-2024-0315-A123</Text>
        </View>

        {/* IMPORTANT NOTICE */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconContainer}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Pickup Reminder</Text>
            <Text style={styles.noticeText}>
              Please arrive at <Text style={styles.noticeBold}>Nena's Bakery (Pusok, Lapu-Lapu)</Text> not later than <Text style={styles.noticeBold}>4:30 PM</Text>.
            </Text>
          </View>
        </View>

        {/* PAYMENT SUMMARY */}
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Value</Text>
            <Text style={styles.summaryValue}>₱100.00</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid Today</Text>
            <Text style={styles.summaryValue}>₱10.00</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Balance</Text>
            <Text style={styles.summaryValue}>₱90.00</Text>
          </View>
        </View>

        {/* DONE BUTTON */}
        <TouchableOpacity
          style={styles.doneButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/consumer/claims")}
        >
          <Ionicons name="receipt-outline" size={16} color={Colors.white} />
          <Text style={styles.doneButtonText}>View My Claims</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.secureText}>Keep your QR voucher ready when claiming your rescue item.</Text>
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* BOTTOM NAV */}
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
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={1}
        >
          <Ionicons name="receipt" size={22} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>My Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/profile")}
        >
          <Ionicons name="person-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Profile</Text>
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
  logoContainer: {
    justifyContent: "center",
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
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },
  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    marginTop: 2,
  },
  successSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.button,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  successText: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.primary2,
    textAlign: "center",
  },
  successSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 2,
  },
  proofCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  proofTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: Colors.primary2,
    marginBottom: 8,
  },
  qrContainer: {
    width: 155,
    height: 155,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 140,
    height: 140,
  },
  voucherText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
    marginTop: 4,
  },
  referenceLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    marginTop: 6,
  },
  referenceNumber: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary,
    marginTop: 1,
  },
  noticeCard: {
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  noticeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    lineHeight: 16,
  },
  noticeBold: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
    marginBottom: 6,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  summaryValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  doneButton: {
    height: 48,
    backgroundColor: Colors.button,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  doneButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  secureText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 8,
  },
  bottomSpace: {
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