import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import {
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import { ShopLocationMapModal } from "./homepage";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function RescueConfirmed() {
  const params = useLocalSearchParams();
  const [consumerId, setConsumerId] = useState("1");
  const [claims, setClaims] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);

  // Rating & Review Form State
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Map Modal Target
  const [mapTarget, setMapTarget] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => setModalAlert({ visible: true, title, message, type });

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const consId = (await getStorageItem("profile_id")) || "1";
      const email = (await getStorageItem("user_email")) || "";
      setConsumerId(consId);

      const res = await api.get(
        `listings/consumer-portal/${consId}/?email=${encodeURIComponent(email)}`
      );
      const list = res.data?.claims || [];
      setClaims(list);

      if (params.voucher) {
        const found = list.find((c: any) => c.voucher_code === params.voucher);
        if (found) {
          openClaimModal(found);
        }
      }
    } catch (e) {
      console.log("Error loading claims:", e);
    }
  };

  const openClaimModal = (claim: any) => {
    setSelectedClaim(claim);
    setRatingScore(claim.rating_score && claim.rating_score > 0 ? claim.rating_score : 5);
    setReviewComment(claim.review_comment || "");
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim) return;
    setSubmittingReview(true);
    try {
      const email = (await getStorageItem("user_email")) || "";
      const res = await api.post(`listings/consumer-portal/${consumerId}/`, {
        action: "submit_review",
        email,
        order_id: selectedClaim.order_id,
        voucher_code: selectedClaim.voucher_code,
        rating_score: ratingScore,
        review_comment: reviewComment.trim(),
      });

      const updatedClaim = {
        ...selectedClaim,
        is_reviewed: true,
        rating_score: ratingScore,
        review_comment: reviewComment.trim(),
      };
      setSelectedClaim(updatedClaim);
      setClaims((prev) =>
        prev.map((c) =>
          c.voucher_code === updatedClaim.voucher_code ? updatedClaim : c
        )
      );

      showModal(
        "Rating & Review Submitted!",
        res.data?.message ||
          "Thank you! Your review has been added to the food listing and merchant profile.",
        "success"
      );
    } catch (err: any) {
      showModal(
        "Review Error",
        err.response?.data?.error || "Could not submit your rating.",
        "error"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Pending") return c.status === "Pending";
    return c.status === "Completed";
  });

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
          <Text style={styles.locationText}>Cebu City</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Rescue Claims</Text>
          <Text style={styles.pageSubtitle}>
            Tap any claim row below to view your QR Voucher, see the shop location on the map, or rate completed pickups.
          </Text>
        </View>

        {/* STATUS FILTER TABS */}
        <View style={styles.filterTabsRow}>
          {(
            [
              { key: "All", label: `All (${claims.length})` },
              {
                key: "Pending",
                label: `Pending Pickup (${claims.filter((c) => c.status === "Pending").length})`,
              },
              {
                key: "Completed",
                label: `Completed (${claims.filter((c) => c.status === "Completed").length})`,
              },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTabBtn, active && styles.filterTabBtnActive]}
                onPress={() => setStatusFilter(tab.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    active && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CLICKABLE CONSOLIDATED CLAIMS LIST */}
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => {
            const isCompleted = claim.status === "Completed";
            const itemCount = Array.isArray(claim.items_breakdown)
              ? claim.items_breakdown.length
              : 1;
            return (
              <TouchableOpacity
                key={claim.voucher_code || claim.order_id}
                style={styles.claimRowCard}
                activeOpacity={0.85}
                onPress={() => openClaimModal(claim)}
              >
                <Image
                  source={{ uri: claim.image }}
                  style={styles.claimThumb}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.claimVoucherCode}>
                      {claim.voucher_code} ({itemCount} {itemCount > 1 ? "items" : "item"})
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted
                          ? styles.statusCompletedBg
                          : styles.statusPendingBg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted
                            ? styles.statusCompletedText
                            : styles.statusPendingText,
                        ]}
                      >
                        {isCompleted ? "Completed" : "Pending for Pickup"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.claimFoodTitle} numberOfLines={1}>
                    {itemCount === 1
                      ? `${claim.qty}x ${claim.food_name}`
                      : claim.food_name}
                  </Text>
                  <Text style={styles.claimMerchantText} numberOfLines={1}>
                    {claim.establishment} • {claim.address}
                  </Text>
                  <Text style={styles.claimExpiryText}>
                    Pickup before: {claim.pickup_deadline}
                  </Text>

                  <View style={styles.claimBottomActionRow}>
                    <Text style={styles.claimPriceInfo}>
                      Total: ₱{claim.total_value} (Paid 10%: ₱{claim.paid_today})
                    </Text>
                    <Text style={styles.tapToViewHint}>
                      {isCompleted
                        ? claim.is_reviewed
                          ? `Rated ${"⭐".repeat(claim.rating_score)}`
                          : "Tap to Rate ⭐"
                        : "View QR & Summary →"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={[styles.proofCard, { paddingVertical: 40 }]}>
            <Ionicons name="receipt-outline" size={34} color={Colors.icon} />
            <Text style={[styles.proofTitle, { marginTop: 10 }]}>
              No rescue claims found
            </Text>
            <Text style={styles.successSubtext}>
              Reserve surplus food from the Home screen to generate your QR
              Rescue Voucher.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.doneButton, { marginTop: 10 }]}
          activeOpacity={0.85}
          onPress={() => router.replace("/consumer/homepage")}
        >
          <Ionicons name="restaurant-outline" size={16} color={Colors.white} />
          <Text style={styles.doneButtonText}>Browse More Surplus Food</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* FULL ORDER INFORMATION + QR VOUCHER + MAP + RATE & REVIEW MODAL */}
      <Modal
        visible={!!selectedClaim}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedClaim && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      Order {selectedClaim.voucher_code}
                    </Text>
                    <Text style={styles.logoSubtitle}>
                      {selectedClaim.status === "Completed"
                        ? "Completed Rescue Transaction"
                        : "Pending Pickup — Show QR to Merchant"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedClaim(null)}
                  >
                    <Ionicons name="close" size={20} color={Colors.primary2} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                >
                  {/* QR VOUCHER PROOF */}
                  <View style={styles.proofCard}>
                    <Text style={styles.proofTitle}>
                      Official QR Rescue Voucher
                    </Text>
                    <View style={styles.qrContainer}>
                      <Image
                        source={require("../../assets/qr.png")}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.voucherText}>
                      Status:{" "}
                      {selectedClaim.status === "Completed"
                        ? "Completed"
                        : "Pending for Pickup"}
                    </Text>
                    <Text style={styles.referenceNumber}>
                      {selectedClaim.voucher_code}
                    </Text>
                  </View>

                  {/* PICKUP SHOP LOCATION & SHOW SHOP IN MAPS BUTTON */}
                  <View style={styles.noticeCard}>
                    <View style={styles.noticeIconContainer}>
                      <Ionicons
                        name="location"
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.noticeContent}>
                      <Text style={styles.noticeTitle}>
                        Pickup Store Location & Deadline
                      </Text>
                      <Text style={styles.noticeText}>
                        Store:{" "}
                        <Text style={styles.noticeBold}>
                          {selectedClaim.establishment}
                        </Text>
                        {"\n"}Address: {selectedClaim.address}
                        {"\n"}Pickup Before:{" "}
                        <Text style={styles.noticeBold}>
                          {selectedClaim.pickup_deadline}
                        </Text>
                      </Text>

                      <TouchableOpacity
                        style={styles.mapActionBtn}
                        onPress={() =>
                          setMapTarget({
                            name: selectedClaim.establishment,
                            address: selectedClaim.address,
                            lat: Number(selectedClaim.merchant_lat || 10.3157),
                            lng: Number(selectedClaim.merchant_lng || 123.8854),
                          })
                        }
                      >
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color={Colors.white}
                        />
                        <Text style={styles.mapActionBtnText}>
                          Show Shop in Maps
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ITEMIZED ORDER & PAYMENT BREAKDOWN */}
                  <Text style={styles.sectionTitle}>
                    Order & Payment Summary ({selectedClaim.voucher_code})
                  </Text>
                  <View style={styles.summaryCard}>
                    {Array.isArray(selectedClaim.items_breakdown) &&
                    selectedClaim.items_breakdown.length > 0 ? (
                      selectedClaim.items_breakdown.map((it: any, idx: number) => (
                        <View
                          key={idx}
                          style={[
                            styles.summaryRow,
                            {
                              backgroundColor: Colors.input,
                              padding: 9,
                              borderRadius: 8,
                              marginBottom: 8,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.summaryValue,
                              { flex: 1, fontFamily: "PoppinsSemiBold" },
                            ]}
                          >
                            {it.qty}x {it.food_name} (@ ₱{it.unit_price})
                          </Text>
                          <Text
                            style={[
                              styles.summaryValue,
                              { fontFamily: "PoppinsBold", color: Colors.primary },
                            ]}
                          >
                            ₱{it.subtotal}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Food Item & Qty</Text>
                        <Text style={styles.summaryValue}>
                          {selectedClaim.qty}x {selectedClaim.food_name}
                        </Text>
                      </View>
                    )}

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Ordered On</Text>
                      <Text style={styles.summaryValue}>
                        {selectedClaim.ordered_at}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Rescue Value</Text>
                      <Text style={styles.summaryValue}>
                        ₱{selectedClaim.total_value}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>
                        10% Reservation Deposit (Paid via Xendit)
                      </Text>
                      <Text
                        style={[styles.summaryValue, { color: Colors.primary }]}
                      >
                        ₱{selectedClaim.paid_today}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, { marginBottom: 0 }]}>
                      <Text style={styles.summaryLabel}>
                        90% Remaining Balance (Cash at Pickup)
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          { fontFamily: "PoppinsBold" },
                        ]}
                      >
                        ₱{selectedClaim.remaining_balance}
                      </Text>
                    </View>
                  </View>

                  {/* RATE & REVIEW SECTION FOR COMPLETED TRANSACTIONS */}
                  {selectedClaim.status === "Completed" && (
                    <View style={styles.reviewBox}>
                      <Text style={styles.sectionTitle}>
                        Rate & Review Your Food Rescue
                      </Text>
                      <Text
                        style={{
                          fontFamily: "PoppinsRegular",
                          fontSize: 11,
                          color: Colors.primary1,
                          marginBottom: 10,
                        }}
                      >
                        How was your order from {selectedClaim.establishment}?
                        Your rating updates the food listing and merchant's
                        profile score!
                      </Text>

                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => setRatingScore(star)}
                            style={{ paddingHorizontal: 6 }}
                          >
                            <Ionicons
                              name={
                                star <= ratingScore ? "star" : "star-outline"
                              }
                              size={30}
                              color="#F59E0B"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TextInput
                        value={reviewComment}
                        onChangeText={setReviewComment}
                        placeholder="Write a review about the food quality and pickup experience..."
                        placeholderTextColor={Colors.placeholder}
                        multiline
                        style={styles.reviewInput}
                      />

                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={handleSubmitReview}
                        disabled={submittingReview}
                      >
                        <Ionicons
                          name="star"
                          size={16}
                          color={Colors.white}
                        />
                        <Text style={styles.doneButtonText}>
                          {submittingReview
                            ? "SAVING REVIEW..."
                            : selectedClaim.is_reviewed
                            ? "Update Rating & Review"
                            : "Submit Rating & Review"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* SHOP LOCATION MAP MODAL */}
      <ShopLocationMapModal
        visible={!!mapTarget}
        shopName={mapTarget?.name || ""}
        address={mapTarget?.address || ""}
        lat={mapTarget?.lat || 10.3157}
        lng={mapTarget?.lng || 123.8854}
        onClose={() => setMapTarget(null)}
      />

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((p) => ({ ...p, visible: false }))}
      />

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
  titleSection: { marginBottom: 14 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2 },
  filterTabsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterTabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  filterTabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary2 },
  filterTabTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.white },
  claimRowCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, flexDirection: "row", marginBottom: 12 },
  claimThumb: { width: 78, height: 88, borderRadius: 10, backgroundColor: Colors.input },
  claimVoucherCode: { fontFamily: "PoppinsBold", fontSize: 12, color: Colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPendingBg: { backgroundColor: "#FEF3C7" },
  statusCompletedBg: { backgroundColor: "#E4F0E8" },
  statusBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 9.5 },
  statusPendingText: { color: "#B45309" },
  statusCompletedText: { color: "#1F6B52" },
  claimFoodTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13.5, color: Colors.primary2, marginTop: 2 },
  claimMerchantText: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1 },
  claimExpiryText: { fontFamily: "PoppinsMedium", fontSize: 10, color: "#A94A3A", marginTop: 2 },
  claimBottomActionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#F0F2F1" },
  claimPriceInfo: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary2 },
  tapToViewHint: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.primary },
  proofCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 14 },
  proofTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2, marginBottom: 8 },
  qrContainer: { width: 145, height: 145, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  qrImage: { width: 135, height: 135 },
  voucherText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginTop: 4 },
  referenceNumber: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary, marginTop: 2, letterSpacing: 0.5 },
  successSubtext: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, textAlign: "center", marginTop: 2 },
  noticeCard: { backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, marginBottom: 16 },
  noticeIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  noticeContent: { flex: 1 },
  noticeTitle: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.primary2, marginBottom: 2 },
  noticeText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 16 },
  noticeBold: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  mapActionBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginTop: 8 },
  mapActionBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.white },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginBottom: 6 },
  summaryCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  summaryValue: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },
  reviewBox: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginBottom: 16 },
  starsRow: { flexDirection: "row", justifyContent: "center", marginVertical: 10 },
  reviewInput: { minHeight: 80, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, textAlignVertical: "top", marginBottom: 12 },
  doneButton: { height: 48, backgroundColor: Colors.button, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  doneButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  bottomSpace: { height: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: Colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "92%", overflow: "hidden" },
  modalHeader: { height: 60, paddingHorizontal: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  modalCloseButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  bottomNav: { height: 84, paddingBottom: 20, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 8, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 4, borderRadius: 8 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon, marginTop: 2 },
  navTextActive: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
});