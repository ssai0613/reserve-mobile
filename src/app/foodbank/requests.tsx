import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  FoodBankBottomNav,
  FoodBankHeader,
  FoodBankMapModal,
  getFoodBankStorage,
  useIsInsideFoodBankShell,
} from "../components/FoodBankNav";

type RequestLine = {
  donation_req_id: number;
  food_name: string;
  food_type: string;
  qty_needed: number;
  unit_name: string;
  expiry_display: string;
  image_path?: string | null;
};

type ConsolidatedRequest = {
  donation_req_id: number;
  batch_code: string;
  food_name: string;
  food_type: string;
  qty_needed: number;
  unit_name: string;
  reason: string;
  additional_info: string;
  status: string;
  created_at: string;
  merchant?: number | null;
  merchant_name: string;
  merchant_address: string;
  merchant_contact: string;
  merchant_contact_name: string;
  merchant_email: string;
  merchant_lat: number;
  merchant_lng: number;
  expiry_display: string;
  image_path?: string | null;
  items_breakdown: RequestLine[];
};

const FALLBACK_TYPES = [
  "Bread & Pastries",
  "Fruits & Vegetables",
  "Leafy Greens",
  "Root Crops",
  "Cooked Meals",
  "Other",
];

let cachedFbRequestsMemory: ConsolidatedRequest[] = [];
let cachedFbFoodTypesMemory: string[] = FALLBACK_TYPES;

export default function FoodBankRequestsScreen() {
  const isInsideShell = useIsInsideFoodBankShell();
  if (!isInsideShell) return null;

  const [requests, setRequests] = useState<ConsolidatedRequest[]>(
    cachedFbRequestsMemory
  );
  const [foodTypes, setFoodTypes] = useState<string[]>(cachedFbFoodTypesMemory);
  const [loading, setLoading] = useState(cachedFbRequestsMemory.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Pending" | "Ongoing" | "Successful" | "Closed"
  >("All");

  const [selectedReq, setSelectedReq] = useState<ConsolidatedRequest | null>(
    null
  );

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newType, setNewType] = useState(FALLBACK_TYPES[0]);
  const [newQty, setNewQty] = useState("10");
  const [newReason, setNewReason] = useState("");
  const [newAdditional, setNewAdditional] = useState("");
  const [submittingNew, setSubmittingNew] = useState(false);

  const [mapTarget, setMapTarget] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    onConfirm: () => {},
  });

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

  const loadRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      const [reqRes, typesRes] = await Promise.all([
        api.get(
          `donations/requests/?org_id=${orgId}&email=${encodeURIComponent(
            email
          )}`
        ),
        api.get("donations/food-types/").catch(() => null),
      ]);
      const nextReqs = Array.isArray(reqRes.data) ? reqRes.data : [];
      cachedFbRequestsMemory = nextReqs;
      setRequests(nextReqs);
      if (typesRes?.data?.food_types?.length) {
        cachedFbFoodTypesMemory = typesRes.data.food_types;
        setFoodTypes(typesRes.data.food_types);
      }
    } catch (e) {
      console.log("Load requests error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    const reqSub = DeviceEventEmitter.addListener("fb_requests_updated", () => {
      loadRequests();
    });
    return () => reqSub.remove();
  }, [loadRequests]);

  const visibleRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesSearch =
        !q ||
        (r.food_type || "").toLowerCase().includes(q) ||
        (r.merchant_name || "").toLowerCase().includes(q) ||
        (r.batch_code || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (statusFilter === "All") return true;
      if (statusFilter === "Pending")
        return r.status === "Pending" || r.status === "Active";
      if (statusFilter === "Ongoing") return r.status === "Ongoing";
      if (statusFilter === "Successful")
        return r.status === "Successful" || r.status === "Fulfilled";
      return (
        r.status === "Withdrawn" ||
        r.status === "Rejected" ||
        r.status === "Cancelled"
      );
    });
  }, [requests, search, statusFilter]);

  const handleWithdrawOrComplete = (
    reqItem: ConsolidatedRequest,
    action: "withdraw" | "complete"
  ) => {
    setConfirmState({
      visible: true,
      title:
        action === "withdraw"
          ? "Withdraw Donation Request?"
          : "Mark Handshake as Successful?",
      message:
        action === "withdraw"
          ? `Are you sure you want to withdraw request ${reqItem.batch_code} (${reqItem.food_type})?`
          : `Confirm that your organization has received ${reqItem.food_type} from ${reqItem.merchant_name}?`,
      confirmText:
        action === "withdraw" ? "Yes, Withdraw" : "Yes, Mark Successful",
      isDestructive: action === "withdraw",
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, visible: false }));
        try {
          const res = await api.patch("donations/requests/", {
            donation_req_id: reqItem.donation_req_id,
            batch_code: reqItem.batch_code,
            action,
          });
          setSelectedReq(null);
          await loadRequests();
          DeviceEventEmitter.emit("fb_requests_updated");
          DeviceEventEmitter.emit("fb_notifs_updated");
          showModal(
            action === "withdraw"
              ? "Request Withdrawn"
              : "Donation Received!",
            res.data?.message || "Status updated successfully.",
            "success"
          );
        } catch (e: any) {
          showModal(
            "Action Failed",
            e.response?.data?.error || "Could not update request.",
            "error"
          );
        }
      },
    });
  };

  const handlePostGeneralRequest = async () => {
    const qtyNum = parseInt(newQty || "0", 10);
    if (!newType || !qtyNum || qtyNum <= 0) {
      showModal(
        "Missing Details",
        "Please select a food category and enter a valid quantity.",
        "warning"
      );
      return;
    }
    if (!newReason.trim()) {
      showModal(
        "Reason Required",
        "Please provide the reason or beneficiary purpose for this request.",
        "warning"
      );
      return;
    }

    setSubmittingNew(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      await api.post("donations/requests/", {
        org_id: orgId,
        email,
        food_type: newType,
        qty_needed: qtyNum,
        reason: newReason.trim(),
        additional_info: newAdditional.trim(),
      });
      setNewModalOpen(false);
      setNewReason("");
      setNewAdditional("");
      await loadRequests();
      DeviceEventEmitter.emit("fb_requests_updated");
      DeviceEventEmitter.emit("fb_notifs_updated");
      showModal(
        "General Request Posted!",
        "Partner merchants can now see and fulfill your request.",
        "success"
      );
    } catch (e: any) {
      showModal("Post Failed", "Could not post request.", "error");
    } finally {
      setSubmittingNew(false);
    }
  };

  return (
    <View style={styles.container}>
      <FoodBankHeader />

      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>My Donation Requests</Text>
        <Text style={styles.pageSubtitle}>
          Track your appeals, view merchant contact details, or withdraw pending requests
        </Text>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={() => setNewModalOpen(true)}
        >
          <View style={styles.createIcon}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>Post General Food Request</Text>
            <Text style={styles.createSubtitle}>
              Or tap "Merchants" tab below to bulk-request specific active listings
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search request code, food item, or merchant..."
            placeholderTextColor={Colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: 10 }}
        >
          {(
            ["All", "Pending", "Ongoing", "Successful", "Closed"] as const
          ).map((tab) => {
            const active = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visibleRequests}
          keyExtractor={(item) =>
            item.batch_code || String(item.donation_req_id)
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRequests(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No donation requests found</Text>
              <Text style={styles.emptyDescription}>
                Visit the Merchants tab to select active listings or post a general food request above.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.uiCard}>
              <TouchableOpacity
                style={styles.uiCardTop}
                activeOpacity={0.85}
                onPress={() => setSelectedReq(item)}
              >
                {item.image_path ? (
                  <Image
                    source={{ uri: item.image_path }}
                    style={styles.uiImage}
                  />
                ) : (
                  <View style={[styles.uiImage, styles.uiImagePlaceholder]}>
                    <Ionicons
                      name="basket-outline"
                      size={28}
                      color={Colors.primary}
                    />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={styles.uiCardHeaderRow}>
                    <Text style={styles.uiCardTitle} numberOfLines={1}>
                      {item.food_type}
                    </Text>
                    <StatusPill status={item.status} />
                  </View>

                  <Text style={styles.uiCardSubtitle} numberOfLines={1}>
                    {item.batch_code} • {item.merchant_name}
                  </Text>

                  <Text style={styles.explicitExpiry}>
                    Exp: {item.expiry_display || "Standard Window"}
                  </Text>

                  {item.reason ? (
                    <Text style={styles.reasonSnippet} numberOfLines={1}>
                      Reason: "{item.reason}"
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              <View style={styles.uiCardActions}>
                <TouchableOpacity
                  style={styles.uiActionBtn}
                  onPress={() => setSelectedReq(item)}
                >
                  <Ionicons
                    name="eye-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text
                    style={[
                      styles.uiActionBtnText,
                      { color: Colors.primary, fontFamily: "PoppinsSemiBold" },
                    ]}
                  >
                    View Summary & Contact
                  </Text>
                </TouchableOpacity>

                {(item.status === "Pending" || item.status === "Active") && (
                  <TouchableOpacity
                    style={styles.uiActionBtn}
                    onPress={() => handleWithdrawOrComplete(item, "withdraw")}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color="#B3261E"
                    />
                    <Text style={[styles.uiActionBtnText, { color: "#B3261E" }]}>
                      Withdraw Request
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === "Ongoing" && (
                  <TouchableOpacity
                    style={styles.uiActionBtn}
                    onPress={() => handleWithdrawOrComplete(item, "complete")}
                  >
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={16}
                      color={Colors.button}
                    />
                    <Text
                      style={[
                        styles.uiActionBtnText,
                        { color: Colors.button, fontFamily: "PoppinsSemiBold" },
                      ]}
                    >
                      Mark Successful
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL 1: VIEW REQUEST SUMMARY & MERCHANT CONTACT */}
      <Modal
        visible={!!selectedReq}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReq(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedReq && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      Request Summary ({selectedReq.batch_code})
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      Status: {selectedReq.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedReq(null)}
                  >
                    <Ionicons name="close" size={20} color={Colors.primary2} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                >
                  {/* MERCHANT CONTACT INFORMATION */}
                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Merchant Store & Contact Information
                    </Text>
                    <DetailRow
                      icon="storefront-outline"
                      label="Establishment"
                      value={selectedReq.merchant_name}
                    />
                    <DetailRow
                      icon="person-outline"
                      label="Contact Person"
                      value={
                        selectedReq.merchant_contact_name || "Store Manager"
                      }
                    />
                    <DetailRow
                      icon="call-outline"
                      label="Contact Number"
                      value={selectedReq.merchant_contact}
                    />
                    {selectedReq.merchant_email ? (
                      <DetailRow
                        icon="mail-outline"
                        label="Email"
                        value={selectedReq.merchant_email}
                      />
                    ) : null}
                    <DetailRow
                      icon="location-outline"
                      label="Pickup Address"
                      value={selectedReq.merchant_address}
                    />

                    <View
                      style={{ flexDirection: "row", gap: 8, marginTop: 8 }}
                    >
                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() =>
                          setMapTarget({
                            name: selectedReq.merchant_name,
                            address: selectedReq.merchant_address,
                            lat: selectedReq.merchant_lat,
                            lng: selectedReq.merchant_lng,
                          })
                        }
                      >
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color={Colors.white}
                        />
                        <Text style={styles.actionPillBtnText}>
                          Show Shop in Maps
                        </Text>
                      </TouchableOpacity>

                      {/\d/.test(selectedReq.merchant_contact || "") && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.actionPillBtn,
                              { backgroundColor: Colors.button },
                            ]}
                            onPress={() =>
                              Linking.openURL(
                                `tel:${selectedReq.merchant_contact.replace(
                                  /\s/g,
                                  ""
                                )}`
                              )
                            }
                          >
                            <Ionicons
                              name="call"
                              size={14}
                              color={Colors.white}
                            />
                            <Text style={styles.actionPillBtnText}>Call</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionPillBtn,
                              { backgroundColor: Colors.primary2 },
                            ]}
                            onPress={() =>
                              Linking.openURL(
                                `sms:${selectedReq.merchant_contact.replace(
                                  /\s/g,
                                  ""
                                )}`
                              )
                            }
                          >
                            <Ionicons
                              name="chatbubble-ellipses"
                              size={14}
                              color={Colors.white}
                            />
                            <Text style={styles.actionPillBtnText}>SMS</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  {/* REQUESTED ITEMS BREAKDOWN */}
                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Requested Items & Expiry Details
                    </Text>
                    {(Array.isArray(selectedReq.items_breakdown) &&
                    selectedReq.items_breakdown.length > 0
                      ? selectedReq.items_breakdown
                      : [
                          {
                            donation_req_id: selectedReq.donation_req_id,
                            food_name: selectedReq.food_type,
                            food_type: selectedReq.food_type,
                            qty_needed: selectedReq.qty_needed,
                            unit_name: selectedReq.unit_name,
                            expiry_display: selectedReq.expiry_display,
                          },
                        ]
                    ).map((line) => (
                      <View
                        key={line.donation_req_id}
                        style={styles.lineItemRow}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lineItemName}>
                            {line.qty_needed}x {line.food_name} (
                            {line.unit_name})
                          </Text>
                          <Text style={styles.explicitExpiry}>
                            Expiry Date & Time:{" "}
                            {line.expiry_display || "Standard Window"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* REASON & ADDITIONAL NOTES */}
                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Reason & Additional Information
                    </Text>
                    <Text style={styles.noteLabel}>Reason:</Text>
                    <Text style={styles.noteBox}>
                      {selectedReq.reason || "Community food distribution"}
                    </Text>
                    {selectedReq.additional_info ? (
                      <>
                        <Text style={[styles.noteLabel, { marginTop: 8 }]}>
                          Additional Information:
                        </Text>
                        <Text style={styles.noteBox}>
                          {selectedReq.additional_info}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  {(selectedReq.status === "Pending" ||
                    selectedReq.status === "Active") && (
                    <TouchableOpacity
                      style={styles.withdrawBigBtn}
                      onPress={() =>
                        handleWithdrawOrComplete(selectedReq, "withdraw")
                      }
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#B3261E"
                      />
                      <Text style={styles.withdrawBigBtnText}>
                        Withdraw Request
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedReq.status === "Ongoing" && (
                    <TouchableOpacity
                      style={styles.completeBigBtn}
                      onPress={() =>
                        handleWithdrawOrComplete(selectedReq, "complete")
                      }
                    >
                      <Ionicons
                        name="checkmark-done-circle"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.completeBigBtnText}>
                        Handshake Done — Mark as Successful
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: POST GENERAL REQUEST */}
      <Modal
        visible={newModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNewModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post General Food Request</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setNewModalOpen(false)}
              >
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.noteLabel}>Select Food Category *</Text>
              <View style={styles.typeGrid}>
                {foodTypes.map((t) => {
                  const active = newType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        active && styles.typeChipActive,
                      ]}
                      onPress={() => setNewType(t)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          active && styles.typeChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.noteLabel}>Quantity Needed *</Text>
              <TextInput
                style={styles.singleInput}
                keyboardType="numeric"
                value={newQty}
                onChangeText={setNewQty}
                placeholder="e.g. 20"
              />

              <Text style={styles.noteLabel}>Reason for Request *</Text>
              <TextInput
                style={styles.textAreaInput}
                multiline
                value={newReason}
                onChangeText={setNewReason}
                placeholder="e.g. Weekly community pantry in Brgy. Guadalupe..."
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.noteLabel}>
                Additional Information (Optional)
              </Text>
              <TextInput
                style={styles.textAreaInput}
                multiline
                value={newAdditional}
                onChangeText={setNewAdditional}
                placeholder="Preferred pickup hours or transport details..."
                placeholderTextColor={Colors.placeholder}
              />

              <TouchableOpacity
                style={[styles.completeBigBtn, { marginTop: 12 }]}
                onPress={handlePostGeneralRequest}
                disabled={submittingNew}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.completeBigBtnText}>
                  {submittingNew ? "POSTING..." : "Submit Food Request"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FoodBankMapModal
        visible={!!mapTarget}
        shopName={mapTarget?.name || ""}
        address={mapTarget?.address || ""}
        lat={mapTarget?.lat || 10.3157}
        lng={mapTarget?.lng || 123.8854}
        onClose={() => setMapTarget(null)}
      />

      <ReserveConfirmModal
        visible={confirmState.visible}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((p) => ({ ...p, visible: false }))}
      />

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((p) => ({ ...p, visible: false }))}
      />

      <FoodBankBottomNav activeTab="Requests" />
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  let bg = "#FEF3C7";
  let fg = "#B45309";
  let label = status || "Pending";

  if (status === "Ongoing") {
    bg = "#E1EEF8";
    fg = "#2C5F8A";
    label = "Ongoing";
  } else if (status === "Successful" || status === "Fulfilled") {
    bg = "#E4F0E8";
    fg = "#1F6B52";
    label = "Successful";
  } else if (
    status === "Withdrawn" ||
    status === "Rejected" ||
    status === "Cancelled"
  ) {
    bg = "#FBE4E1";
    fg = "#B3261E";
    label = status;
  } else if (status === "Active") {
    label = "Pending";
  }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: fg }]} />
      <Text style={[styles.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topSection: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2 },
  createButton: { minHeight: 62, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", marginTop: 12 },
  createIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginRight: 11 },
  createTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14.5, color: Colors.white },
  createSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: "#D8E3DD" },
  searchContainer: { minHeight: 44, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.button, borderColor: Colors.button },
  filterChipText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  filterChipTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.white },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 17, paddingTop: 8, paddingBottom: 28 },
  uiCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  uiCardTop: { flexDirection: "row", padding: 12, gap: 12, alignItems: "center" },
  uiImage: { width: 74, height: 74, borderRadius: 10, backgroundColor: Colors.input },
  uiImagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EFE9" },
  uiCardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  uiCardTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 14.5, color: Colors.primary2 },
  uiCardSubtitle: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary, marginTop: 2 },
  explicitExpiry: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: "#A94A3A", marginTop: 2 },
  reasonSnippet: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusPillText: { fontFamily: "PoppinsSemiBold", fontSize: 10 },
  uiCardActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, padding: 10, justifyContent: "space-between" },
  uiActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  uiActionBtnText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary1 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 38, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, textAlign: "center", marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.5)", justifyContent: "flex-end" },
  modalSheet: { width: "100%", maxHeight: "92%", backgroundColor: Colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  modalHeader: { paddingHorizontal: 18, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  modalSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  infoBox: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 14 },
  boxHeading: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2, marginBottom: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  detailIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 10 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  actionPillBtn: { flex: 1, height: 38, borderRadius: 9, backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  actionPillBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.white },
  lineItemRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lineItemName: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  noteLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.primary2, marginBottom: 5 },
  noteBox: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, backgroundColor: Colors.input, padding: 10, borderRadius: 8 },
  withdrawBigBtn: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  withdrawBigBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: "#B3261E" },
  completeBigBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  completeBigBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.white },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  typeChipTextActive: { color: Colors.white },
  singleInput: { height: 44, backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary2, marginBottom: 12 },
  textAreaInput: { minHeight: 80, backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 12, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, textAlignVertical: "top", marginBottom: 12 },
});