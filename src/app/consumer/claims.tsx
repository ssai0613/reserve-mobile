import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function RescueConfirmed() {
  const params = useLocalSearchParams();
  const [claims, setClaims] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const consId = (await getStorageItem("profile_id")) || "1";
      const email = (await getStorageItem("user_email")) || "";
      const res = await api.get(
        `listings/consumer-portal/${consId}/?email=${encodeURIComponent(email)}`
      );
      const list = res.data?.claims || [];
      setClaims(list);

      if (params.voucher) {
        const found = list.find((c: any) => c.voucher_code === params.voucher);
        if (found) {
          setSelectedClaim(found);
          return;
        }
      }
      if (list.length > 0) {
        setSelectedClaim(list[0]);
      }
    } catch (e) {
      console.log("Error loading claims:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.logoSubtitle}>Consumer Portal</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={13} color={Colors.primary} />
          <Text style={styles.locationText}>Cebu / Lapu-Lapu</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Rescue Claims</Text>
          <Text style={styles.pageSubtitle}>
            Present your QR Voucher at the store and pay the remaining 90% cash balance upon pickup.
          </Text>
        </View>

        {/* CLAIM SELECTOR PILLS IF MULTIPLE ORDERS EXIST */}
        {claims.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {claims.map((c) => {
              const active = selectedClaim?.order_id === c.order_id;
              return (
                <TouchableOpacity
                  key={c.order_id}
                  onPress={() => setSelectedClaim(c)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: active ? Colors.primary : Colors.white,
                    borderWidth: 1,
                    borderColor: active ? Colors.primary : Colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PoppinsSemiBold",
                      fontSize: 11,
                      color: active ? Colors.white : Colors.primary2,
                    }}
                  >
                    {c.voucher_code} • {c.food_name} ({c.status})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {selectedClaim ? (
          <>
            <View style={styles.successSection}>
              <View style={styles.successCircle}>
                <Ionicons
                  name={
                    selectedClaim.status === "Completed"
                      ? "checkmark-done"
                      : "checkmark"
                  }
                  size={34}
                  color={Colors.white}
                />
              </View>
              <Text style={styles.successText}>
                {selectedClaim.status === "Completed"
                  ? "Rescue Picked Up & Completed!"
                  : "Rescue Reserved Successfully!"}
              </Text>
              <Text style={styles.successSubtext}>
                {selectedClaim.qty}x {selectedClaim.food_name} •{" "}
                {selectedClaim.establishment}
              </Text>
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

              <Text style={styles.voucherText}>
                Status: {selectedClaim.status}
              </Text>
              <Text style={styles.referenceLabel}>
                Official Voucher / Order ID (Show to Merchant)
              </Text>
              <Text style={styles.referenceNumber}>
                {selectedClaim.voucher_code}
              </Text>
            </View>

            {/* PICKUP REMINDER */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeIconContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Pickup Location & Deadline</Text>
                <Text style={styles.noticeText}>
                  Please arrive at{" "}
                  <Text style={styles.noticeBold}>
                    {selectedClaim.establishment} ({selectedClaim.address})
                  </Text>{" "}
                  before{" "}
                  <Text style={styles.noticeBold}>
                    {selectedClaim.pickup_deadline}
                  </Text>
                  .
                </Text>
              </View>
            </View>

            {/* PAYMENT SUMMARY */}
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Rescue Value</Text>
                <Text style={styles.summaryValue}>
                  ₱{selectedClaim.total_value}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  10% Reservation Deposit (Paid Online)
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                  ₱{selectedClaim.paid_today}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  90% Remaining Balance (Pay at Store Pickup)
                </Text>
                <Text style={[styles.summaryValue, { fontFamily: "PoppinsBold" }]}>
                  ₱{selectedClaim.remaining_balance}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.proofCard, { paddingVertical: 40 }]}>
            <Ionicons name="receipt-outline" size={34} color={Colors.icon} />
            <Text style={[styles.proofTitle, { marginTop: 10 }]}>
              No active rescue claims yet
            </Text>
            <Text style={styles.successSubtext}>
              Reserve surplus food from the Home screen to generate your QR
              Rescue Voucher.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/consumer/homepage")}
        >
          <Ionicons name="restaurant-outline" size={16} color={Colors.white} />
          <Text style={styles.doneButtonText}>Browse More Surplus Food</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.secureText}>
          Keep your QR voucher code ({selectedClaim?.voucher_code || "OID"})
          ready when claiming your rescue item.
        </Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 64, paddingHorizontal: 16, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoContainer: { justifyContent: "center" },
  logo: { fontFamily: "PoppinsBold", fontSize: 22, color: Colors.primary, letterSpacing: 0.5 },
  logoSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: -3 },
  locationPill: { height: 32, paddingHorizontal: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  titleSection: { marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  successSection: { alignItems: "center", marginBottom: 16 },
  successCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  successText: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2, textAlign: "center" },
  successSubtext: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, textAlign: "center", marginTop: 2 },
  proofCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 14 },
  proofTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2, marginBottom: 8 },
  qrContainer: { width: 155, height: 155, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  qrImage: { width: 140, height: 140 },
  voucherText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginTop: 4 },
  referenceLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, marginTop: 6 },
  referenceNumber: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary, marginTop: 1, letterSpacing: 0.5 },
  noticeCard: { backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, marginBottom: 16 },
  noticeIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  noticeContent: { flex: 1 },
  noticeTitle: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginBottom: 2 },
  noticeText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 16 },
  noticeBold: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginBottom: 6 },
  summaryCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  summaryValue: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },
  doneButton: { height: 48, backgroundColor: Colors.button, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  doneButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  secureText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, textAlign: "center", marginTop: 8 },
  bottomSpace: { height: 16 },
  bottomNav: { height: 84, paddingBottom: 20, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 8, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 4, borderRadius: 8 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon, marginTop: 2 },
  navTextActive: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
});