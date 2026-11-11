import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import {
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  ConsumerBottomNav,
  ConsumerHeader,
  switchConsumerTab,
  useIsInsideConsumerShell,
} from "../components/ConsumerNav";
import { ShopLocationMapModal } from "./homepage";

let cachedClaimsMemory: any[] = [];

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const getDynamicQrUrl = (voucherCode: string) => {
  const cleanCode = String(voucherCode || "").trim().toUpperCase();
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=M&margin=10&color=12372C&bgcolor=FFFFFF&data=${encodeURIComponent(
    cleanCode
  )}`;
};

export default function RescueConfirmed() {
  const isInsideShell = useIsInsideConsumerShell();
  if (!isInsideShell) return null;

  const params = useLocalSearchParams();
  const [consumerId, setConsumerId] = useState("");
  const [claims, setClaims] = useState<any[]>(cachedClaimsMemory);
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Pending" | "Completed"
  >("All");
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [ratingScore, setRatingScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
    loadClaims(params.voucher ? String(params.voucher) : undefined);

    const claimsSub = DeviceEventEmitter.addListener(
      "consumer_claims_updated",
      (payload?: { voucher?: string }) => {
        loadClaims(payload?.voucher);
      }
    );

    return () => claimsSub.remove();
  }, []);

  const loadClaims = async (targetVoucher?: string) => {
    try {
      const consId = await getStorageItem("profile_id");
      const email = (await getStorageItem("user_email")) || "";

      if (!consId && !email) {
        router.replace("/consumer");
        return;
      }

      const resolvedId = consId || "0";
      setConsumerId(resolvedId);

      const res = await api.get(
        `listings/consumer-portal/${resolvedId}/?email=${encodeURIComponent(
          email
        )}`
      );
      const list = res.data?.claims || [];
      cachedClaimsMemory = list;
      setClaims(list);

      if (targetVoucher) {
        const found = list.find(
          (c: any) =>
            String(c.voucher_code).toUpperCase() ===
            String(targetVoucher).toUpperCase()
        );
        if (found) {
          openClaimModal(found);
        }
      }
    } catch (e) {
      console.log("Error loading claims:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
    setRefreshing(false);
  };

  const openClaimModal = (claim: any) => {
    setSelectedClaim(claim);
    setRatingScore(
      claim.rating_score && claim.rating_score > 0 ? claim.rating_score : 5
    );
    setReviewComment(claim.review_comment || "");
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim) return;
    setSubmittingReview(true);
    try {
      const email = (await getStorageItem("user_email")) || "";
      const activeId =
        consumerId || (await getStorageItem("profile_id")) || "0";
      const res = await api.post(`listings/consumer-portal/${activeId}/`, {
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
      setClaims((prev) => {
        const next = prev.map((c) =>
          c.voucher_code === updatedClaim.voucher_code ? updatedClaim : c
        );
        cachedClaimsMemory = next;
        return next;
      });

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

  const getPurchasedItemsSummary = (claim: any) => {
    if (
      Array.isArray(claim.items_breakdown) &&
      claim.items_breakdown.length > 0
    ) {
      return claim.items_breakdown
        .map((it: any) => `${it.qty}x ${it.food_name}`)
        .join(", ");
    }
    return `${claim.qty || 1}x ${claim.food_name || "Surplus Food"}`;
  };

  return (
    <View style={styles.container}>
      <ConsumerHeader />

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
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Rescue Claims</Text>
        </View>

        <View style={styles.filterTabsRow}>
          {(
            [
              { key: "All", label: `All (${claims.length})` },
              {
                key: "Pending",
                label: `Pending Pickup (${
                  claims.filter((c) => c.status === "Pending").length
                })`,
              },
              {
                key: "Completed",
                label: `Completed (${
                  claims.filter((c) => c.status === "Completed").length
                })`,
              },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTabBtn,
                  active && styles.filterTabBtnActive,
                ]}
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

        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim, idx) => {
            const isCompleted = claim.status === "Completed";
            const purchasedItemsText = getPurchasedItemsSummary(claim);

            return (
              <TouchableOpacity
                key={claim.voucher_code || claim.order_id || idx}
                style={styles.claimCardContainer}
                activeOpacity={0.88}
                onPress={() => openClaimModal(claim)}
              >
                <View style={styles.claimTopRow}>
                  <Image
                    source={{ uri: claim.image }}
                    style={styles.claimThumbLarge}
                  />

                  <View style={styles.claimMainInfo}>
                    <View style={styles.claimHeaderLine}>
                      <Text style={styles.claimVoucherTitle} numberOfLines={1}>
                        {claim.establishment || "Partner Establishment"}
                      </Text>

                      <View
                        style={[
                          styles.statusPillBadge,
                          isCompleted
                            ? styles.statusCompletedBg
                            : styles.statusPendingBg,
                        ]}
                      >
                        <Ionicons
                          name={
                            isCompleted ? "checkmark-circle" : "time-outline"
                          }
                          size={12}
                          color={isCompleted ? "#15803D" : "#C2410C"}
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            isCompleted
                              ? styles.statusCompletedText
                              : styles.statusPendingText,
                          ]}
                        >
                          {isCompleted ? "Completed" : "Pending for Pickup"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.claimMetaRow}>
                      <Ionicons
                        name="fast-food-outline"
                        size={13}
                        color={Colors.primary}
                      />
                      <Text
                        style={styles.claimMerchantLabel}
                        numberOfLines={2}
                      >
                        {purchasedItemsText}
                      </Text>
                    </View>

                    <View style={styles.claimMetaRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={Colors.primary}
                      />
                      <Text
                        style={styles.claimAddressLabel}
                        numberOfLines={1}
                      >
                        {claim.address || "Cebu City, Cebu"}
                      </Text>
                    </View>

                    <View style={styles.claimMetaRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color="#B91C1C"
                      />
                      <Text
                        style={styles.claimDeadlineLabel}
                        numberOfLines={1}
                      >
                        Pick up before: {claim.pickup_deadline}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.claimCardDivider} />

                <View style={styles.claimBottomRow}>
                  <View>
                    <Text style={styles.claimTotalText}>
                      Total: ₱{Number(claim.total_value || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.claimDepositSubtext}>
                      (Paid 10%: ₱{Number(claim.paid_today || 0).toFixed(2)})
                    </Text>
                  </View>

                  {isCompleted ? (
                    <View style={styles.actionButtonRated}>
                      <Ionicons name="star" size={15} color="#EAB308" />
                      <Text style={styles.actionButtonRatedText}>Rated</Text>
                      <View
                        style={{ flexDirection: "row", gap: 1, marginLeft: 4 }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={
                              s <= (claim.rating_score || 5)
                                ? "star"
                                : "star-outline"
                            }
                            size={12}
                            color="#EAB308"
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actionButtonQR}>
                      <Ionicons
                        name="qr-code-outline"
                        size={15}
                        color={Colors.primary}
                      />
                      <Text style={styles.actionButtonQRText}>
                        View QR &amp; Summary
                      </Text>
                    </View>
                  )}
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
          onPress={() => switchConsumerTab("Home")}
        >
          <Ionicons name="restaurant-outline" size={16} color={Colors.white} />
          <Text style={styles.doneButtonText}>Browse More Surplus Food</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* FULL ORDER INFORMATION + DYNAMIC QR VOUCHER + MAP + RATE & REVIEW MODAL */}
      <Modal
        visible={!!selectedClaim}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedClaim(null)}
          />
          <View style={styles.modalSheet}>
            {selectedClaim && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedClaim.establishment || "Rescue Claim Details"}
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
                  <View style={styles.proofCard}>
                    <Text style={styles.proofTitle}>
                      Official QR Rescue Voucher
                    </Text>
                    <View style={styles.qrContainer}>
                      <Image
                        source={{
                          uri: getDynamicQrUrl(selectedClaim.voucher_code),
                        }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.referenceNumber}>
                      {selectedClaim.voucher_code}
                    </Text>
                    <Text style={styles.voucherText}>
                      Status:{" "}
                      {selectedClaim.status === "Completed"
                        ? "Completed"
                        : "Pending for Pickup"}
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>
                    Order &amp; Payment Summary
                  </Text>
                  <View style={styles.summaryCard}>
                    {Array.isArray(selectedClaim.items_breakdown) &&
                    selectedClaim.items_breakdown.length > 0 ? (
                      selectedClaim.items_breakdown.map(
                        (it: any, idx: number) => (
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
                                {
                                  fontFamily: "PoppinsBold",
                                  color: Colors.primary,
                                },
                              ]}
                            >
                              ₱{it.subtotal}
                            </Text>
                          </View>
                        )
                      )
                    ) : (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                          Food Item &amp; Qty
                        </Text>
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

                  <View style={styles.noticeCard}>
                    <View style={styles.noticeIconContainer}>
                      <Ionicons
                        name="bag-handle"
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.noticeContent}>
                      <Text style={styles.noticeTitle}>
                        Pickup Store Location &amp; Deadline
                      </Text>
                      <Text style={styles.noticeText}>
                        <Ionicons
                          name="storefront-outline"
                          size={15}
                          color={Colors.primary}
                        />
                        {` ${selectedClaim.establishment}`}
                        {"\n"}
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color={Colors.primary}
                        />
                        {` ${selectedClaim.address}`}
                        {"\n"}
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color={Colors.primary}
                        />
                        {` Pick up before: ${selectedClaim.pickup_deadline}`}
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

                  {selectedClaim.status === "Completed" && (
                    <View style={styles.reviewBox}>
                      <Text style={styles.sectionTitle}>
                        Rate &amp; Review Your Food Rescue
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

      <ConsumerBottomNav activeTab="Claims" />
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonQR: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.white },
  actionButtonQRText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary },
  actionButtonRated: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.input },
  actionButtonRatedText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 },
  container: { flex: 1, backgroundColor: Colors.background },
  logoSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: -3 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  titleSection: { marginBottom: 14 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  filterTabsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterTabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  filterTabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary2 },
  filterTabTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.white },
  claimCardContainer: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  claimTopRow: { flexDirection: "row", alignItems: "flex-start" },
  claimThumbLarge: { width: 82, height: 82, borderRadius: 12, backgroundColor: Colors.input, resizeMode: "cover" },
  claimMainInfo: { flex: 1, marginLeft: 12 },
  claimHeaderLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  claimVoucherTitle: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2, flex: 1, marginRight: 6 },
  statusPillBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusCompletedBg: { backgroundColor: "#DCFCE7" },
  statusPendingBg: { backgroundColor: "#FFEDD5" },
  statusPillText: { fontFamily: "PoppinsSemiBold", fontSize: 9.5 },
  statusCompletedText: { color: "#15803D" },
  statusPendingText: { color: "#C2410C" },
  claimMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  claimMerchantLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.primary2, flex: 1 },
  claimAddressLabel: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, flex: 1 },
  claimDeadlineLabel: { fontFamily: "PoppinsMedium", fontSize: 10, color: "#B91C1C", flex: 1 },
  claimCardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  claimBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  claimTotalText: { fontFamily: "PoppinsBold", fontSize: 13, color: Colors.primary2 },
  claimDepositSubtext: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.placeholder },
  proofCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 14 },
  proofTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2, marginBottom: 8 },
  qrContainer: { width: 170, height: 170, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 6 },
  qrImage: { width: 154, height: 154 },
  voucherText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginTop: 2 },
  referenceNumber: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary, marginTop: 8, letterSpacing: 0.5 },
  successSubtext: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, textAlign: "center", marginTop: 2 },
  noticeCard: { backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, flexDirection: "row", gap: 10, marginBottom: 16 },
  noticeIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  noticeContent: { flex: 1 },
  noticeTitle: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.primary2, marginBottom: 2 },
  noticeText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 20 },
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
  modalCloseButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});