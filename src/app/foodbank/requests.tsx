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
  setFoodBankStorage,
  switchFoodBankTab,
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
  voucher_code?: string;
  qr_payload?: string;
  radius_km?: number;
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

type LiveMerchantListing = {
  prod_id: number;
  commerce_id: number;
  name: string;
  category: string;
  qty_available: number;
  unit_name: string;
  expiry_date: string;
  expiry_time: string;
  expiry_display: string;
  image: string;
};

type LivePartnerMerchant = {
  merchant_id: number;
  name: string;
  type: string;
  address: string;
  distance: string;
  active_listings_count: number;
  active_listings: LiveMerchantListing[];
};

let cachedFbRequestsMemory: ConsolidatedRequest[] = [];
let cachedRequestsRadiusKm = 10;

export default function FoodBankRequestsScreen() {
  const isInsideShell = useIsInsideFoodBankShell();
  if (!isInsideShell) return null;

  const [requests, setRequests] = useState<ConsolidatedRequest[]>(
    cachedFbRequestsMemory
  );
  const [radiusKm, setRadiusKm] = useState<number>(cachedRequestsRadiusKm);
  const [loading, setLoading] = useState(cachedFbRequestsMemory.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Pending" | "Ongoing" | "Successful" | "Closed"
  >("All");

  const [selectedReq, setSelectedReq] = useState<ConsolidatedRequest | null>(
    null
  );
  const [qrAppealTarget, setQrAppealTarget] =
    useState<ConsolidatedRequest | null>(null);

  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [liveMerchants, setLiveMerchants] = useState<LivePartnerMerchant[]>([]);
  const [sectorFilter, setSectorFilter] = useState<
    "All" | "Bakeshop" | "Market Vendor"
  >("All");
  const [chosenMerchant, setChosenMerchant] =
    useState<LivePartnerMerchant | null>(null);
  const [selectedItemsMap, setSelectedItemsMap] = useState<{
    [commerceId: number]: number;
  }>({});
  const [appealReason, setAppealReason] = useState("");
  const [appealAdditional, setAppealAdditional] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

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
      const storedRad = await getFoodBankStorage("gov_radius_km");
      if (storedRad && Number(storedRad) > 0) {
        cachedRequestsRadiusKm = Number(storedRad);
        setRadiusKm(Number(storedRad));
      }

      const [reqRes, typesRes] = await Promise.all([
        api.get(
          `donations/requests/?org_id=${orgId}&email=${encodeURIComponent(
            email
          )}`
        ),
        api.get("donations/food-types/").catch(() => null),
      ]);
      const nextReqs: ConsolidatedRequest[] = Array.isArray(reqRes.data)
        ? reqRes.data
        : [];
      cachedFbRequestsMemory = nextReqs;
      setRequests(nextReqs);

      const apiRadius = Number(
        typesRes?.data?.radius_km ?? nextReqs[0]?.radius_km ?? 0
      );
      if (apiRadius > 0) {
        cachedRequestsRadiusKm = apiRadius;
        setRadiusKm(apiRadius);
        await setFoodBankStorage("gov_radius_km", String(apiRadius));
        DeviceEventEmitter.emit("fb_radius_updated", { radiusKm: apiRadius });
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
    const radSub = DeviceEventEmitter.addListener(
      "fb_radius_updated",
      (payload?: { radiusKm?: number }) => {
        if (payload?.radiusKm) {
          cachedRequestsRadiusKm = payload.radiusKm;
          setRadiusKm(payload.radiusKm);
        }
      }
    );
    return () => {
      reqSub.remove();
      radSub.remove();
    };
  }, [loadRequests]);

  const openLiveSurplusPicker = async () => {
    setPickerModalOpen(true);
    setChosenMerchant(null);
    setSelectedItemsMap({});
    setAppealReason("");
    setAppealAdditional("");
    setLoadingPartners(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      const res = await api.get(
        `donations/partners/?org_id=${orgId}&email=${encodeURIComponent(email)}`
      );
      const apiRadius = Number(res.data?.radius_km || 0);
      if (apiRadius > 0) {
        cachedRequestsRadiusKm = apiRadius;
        setRadiusKm(apiRadius);
        await setFoodBankStorage("gov_radius_km", String(apiRadius));
      }
      const allPartners: LivePartnerMerchant[] = res.data?.partners || [];
      const withStock = allPartners.filter(
        (p) =>
          Array.isArray(p.active_listings) && p.active_listings.length > 0
      );
      setLiveMerchants(withStock);
      if (withStock.length > 0) {
        setChosenMerchant(withStock[0]);
      }
    } catch (e) {
      console.log("Live surplus picker load error:", e);
    } finally {
      setLoadingPartners(false);
    }
  };

  const filteredLiveMerchants = useMemo(() => {
    return liveMerchants.filter((m) => {
      if (sectorFilter === "All") return true;
      const t = (m.type || "").toLowerCase();
      if (sectorFilter === "Bakeshop") return t.includes("bake");
      return t.includes("market");
    });
  }, [liveMerchants, sectorFilter]);

  const handleSelectMerchantInPicker = (m: LivePartnerMerchant) => {
    setChosenMerchant(m);
    setSelectedItemsMap({});
  };

  const togglePickListing = (listing: LiveMerchantListing) => {
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (next[listing.commerce_id] !== undefined) {
        delete next[listing.commerce_id];
      } else {
        next[listing.commerce_id] = Math.min(5, listing.qty_available);
      }
      return next;
    });
  };

  const adjustPickedQty = (listing: LiveMerchantListing, delta: number) => {
    setSelectedItemsMap((prev) => {
      const current = prev[listing.commerce_id] || 1;
      const nextQty = Math.max(
        1,
        Math.min(listing.qty_available, current + delta)
      );
      return { ...prev, [listing.commerce_id]: nextQty };
    });
  };

  const handleSubmitInventoryAppeal = async () => {
    if (!chosenMerchant) {
      showModal(
        "Select a Store",
        "Please select a Bakeshop or Market Vendor with active surplus listings.",
        "warning"
      );
      return;
    }

    const pickedListings = chosenMerchant.active_listings.filter(
      (l) => selectedItemsMap[l.commerce_id] !== undefined
    );
    if (pickedListings.length === 0) {
      showModal(
        "Select Active Items",
        "Please check at least one active Bakeshop or Market Vendor listing to request.",
        "warning"
      );
      return;
    }

    if (!appealReason.trim()) {
      showModal(
        "Reason Required",
        "Please enter the beneficiary group or reason for this surplus request.",
        "warning"
      );
      return;
    }

    setSubmittingAppeal(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";

      const itemsPayload = pickedListings.map((l) => ({
        prod_id: l.prod_id,
        commerce_id: l.commerce_id,
        food_name: l.name,
        qty_needed: selectedItemsMap[l.commerce_id],
      }));

      const res = await api.post("donations/requests/", {
        org_id: orgId,
        email,
        merchant_id: chosenMerchant.merchant_id,
        reason: appealReason.trim(),
        additional_info: appealAdditional.trim(),
        items: itemsPayload,
      });

      setPickerModalOpen(false);
      setSelectedItemsMap({});
      await loadRequests();
      DeviceEventEmitter.emit("fb_requests_updated");
      DeviceEventEmitter.emit("fb_notifs_updated");

      showModal(
        "Inventory Appeal Sent!",
        res.data?.message ||
          `Your request (${res.data?.batch_code}) has been sent to ${chosenMerchant.name}. Once approved, your QR Pickup Voucher will activate here.`,
        "success"
      );
    } catch (e: any) {
      showModal(
        "Request Failed",
        e.response?.data?.error || "Could not submit your donation appeal.",
        "error"
      );
    } finally {
      setSubmittingAppeal(false);
    }
  };

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
          ? "Withdraw Donation Appeal?"
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

  const pickedCount = Object.keys(selectedItemsMap).length;

  return (
    <View style={styles.container}>
      <FoodBankHeader />

      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>My Donation Appeals</Text>
        <Text style={styles.pageSubtitle}>
          Request live surplus inventory from verified Bakeshops &amp; Market
          Vendors within {radiusKm}km and present your QR Voucher at pickup
        </Text>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={openLiveSurplusPicker}
        >
          <View style={styles.createIcon}>
            <Ionicons name="storefront-outline" size={20} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>
              Request from {radiusKm}km Active Surplus
            </Text>
            <Text style={styles.createSubtitle}>
              Select live Bakeshop &amp; Market Vendor items currently in stock
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search appeal code (BREQ), food item, or store..."
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
                  {tab === "Ongoing" ? "Ongoing (QR)" : tab}
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
              <Text style={styles.emptyTitle}>No donation appeals found</Text>
              <Text style={styles.emptyDescription}>
                Tap &quot;Request from {radiusKm}km Active Surplus&quot; above
                to select live Bakeshop or Market Vendor items.
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
                      Reason: &quot;{item.reason}&quot;
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
                    View Summary &amp; Contact
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
                      Withdraw Appeal
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === "Ongoing" && (
                  <TouchableOpacity
                    style={styles.uiActionBtn}
                    onPress={() => setQrAppealTarget(item)}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={16}
                      color={Colors.button}
                    />
                    <Text
                      style={[
                        styles.uiActionBtnText,
                        { color: Colors.button, fontFamily: "PoppinsSemiBold" },
                      ]}
                    >
                      Show QR Voucher ({item.batch_code})
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
                      Appeal Summary ({selectedReq.batch_code})
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
                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Merchant Store &amp; Contact Information
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

                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Requested Items &amp; Expiry Details
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
                            Expiry Date &amp; Time:{" "}
                            {line.expiry_display || "Standard Window"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Reason &amp; Additional Information
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
                        Withdraw Appeal
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedReq.status === "Ongoing" && (
                    <View style={{ gap: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.completeBigBtn,
                          { backgroundColor: Colors.primary },
                        ]}
                        onPress={() => {
                          const target = selectedReq;
                          setSelectedReq(null);
                          setQrAppealTarget(target);
                        }}
                      >
                        <Ionicons
                          name="qr-code-outline"
                          size={18}
                          color={Colors.white}
                        />
                        <Text style={styles.completeBigBtnText}>
                          Show QR Pickup Voucher ({selectedReq.batch_code})
                        </Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                          style={[styles.withdrawBigBtn, { flex: 1 }]}
                          onPress={() =>
                            handleWithdrawOrComplete(selectedReq, "withdraw")
                          }
                        >
                          <Text style={styles.withdrawBigBtnText}>
                            Release Appeal
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.completeBigBtn, { flex: 1.4 }]}
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
                            Mark Received
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* OFFICIAL QR APPEAL PICKUP VOUCHER MODAL */}
      <Modal
        visible={!!qrAppealTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setQrAppealTarget(null)}
      >
        <View style={styles.qrModalCenter}>
          <View style={styles.qrVoucherCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginBottom: 8,
              }}
            >
              <Text style={styles.modalTitle}>Official Appeal QR Voucher</Text>
              <TouchableOpacity onPress={() => setQrAppealTarget(null)}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            {qrAppealTarget && (
              <>
                <Text
                  style={{
                    fontFamily: "PoppinsRegular",
                    fontSize: 11,
                    color: Colors.primary1,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  Present this QR code to{" "}
                  <Text
                    style={{
                      fontFamily: "PoppinsBold",
                      color: Colors.primary2,
                    }}
                  >
                    {qrAppealTarget.merchant_name}
                  </Text>{" "}
                  so they can scan and verify your bulk appeal handoff:
                </Text>

                <View style={styles.qrImageWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                        `RESERVE:${qrAppealTarget.batch_code}`
                      )}`,
                    }}
                    style={{ width: 200, height: 200 }}
                  />
                </View>

                <View style={styles.voucherCodePill}>
                  <Text style={styles.voucherCodePillLabel}>
                    APPEAL VOUCHER CODE
                  </Text>
                  <Text style={styles.voucherCodePillValue}>
                    {qrAppealTarget.batch_code}
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: "PoppinsSemiBold",
                    fontSize: 12.5,
                    color: Colors.primary2,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                >
                  {qrAppealTarget.food_type}
                </Text>
                <Text style={styles.explicitExpiry}>
                  Pickup Window: {qrAppealTarget.expiry_display}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.completeBigBtn,
                    { width: "100%", marginTop: 14 },
                  ]}
                  onPress={() => setQrAppealTarget(null)}
                >
                  <Text style={styles.completeBigBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2 (OPTION 2): LIVE BAKESHOP & MARKET VENDOR SURPLUS PICKER */}
      <Modal
        visible={pickerModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Request Live {radiusKm}km Surplus
                </Text>
                <Text style={styles.modalSubtitle}>
                  Select active items from Bakeshops &amp; Market Vendors within{" "}
                  {radiusKm}km
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setPickerModalOpen(false)}
              >
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.sectorRow}>
                {(["All", "Bakeshop", "Market Vendor"] as const).map((sec) => {
                  const active = sectorFilter === sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      style={[
                        styles.sectorChip,
                        active && styles.sectorChipActive,
                      ]}
                      onPress={() => {
                        setSectorFilter(sec);
                        const matching = liveMerchants.filter((m) => {
                          if (sec === "All") return true;
                          const t = (m.type || "").toLowerCase();
                          return sec === "Bakeshop"
                            ? t.includes("bake")
                            : t.includes("market");
                        });
                        setChosenMerchant(matching[0] || null);
                        setSelectedItemsMap({});
                      }}
                    >
                      <Text
                        style={[
                          styles.sectorChipText,
                          active && styles.sectorChipTextActive,
                        ]}
                      >
                        {sec === "All" ? "All Sectors" : `${sec}s`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {loadingPartners ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text
                    style={{
                      fontFamily: "PoppinsMedium",
                      fontSize: 11.5,
                      color: Colors.primary1,
                      marginTop: 8,
                    }}
                  >
                    Loading active Bakeshop &amp; Market inventory within{" "}
                    {radiusKm}km...
                  </Text>
                </View>
              ) : filteredLiveMerchants.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    No active surplus within {radiusKm}km in this sector
                  </Text>
                  <Text style={styles.emptyDescription}>
                    Check the Donations tab for posted bundles or browse all
                    partner stores in the Merchants tab.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.actionPillBtn,
                      {
                        marginTop: 12,
                        paddingHorizontal: 14,
                        flex: 0,
                      },
                    ]}
                    onPress={() => {
                      setPickerModalOpen(false);
                      switchFoodBankTab("Partners");
                    }}
                  >
                    <Text style={styles.actionPillBtnText}>
                      Open Merchants Tab →
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.noteLabel}>
                    1. Select Partner Store ({filteredLiveMerchants.length} with
                    active stock):
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, marginBottom: 14 }}
                  >
                    {filteredLiveMerchants.map((m) => {
                      const isCurrent =
                        chosenMerchant?.merchant_id === m.merchant_id;
                      return (
                        <TouchableOpacity
                          key={m.merchant_id}
                          style={[
                            styles.merchantPillCard,
                            isCurrent && styles.merchantPillCardActive,
                          ]}
                          onPress={() => handleSelectMerchantInPicker(m)}
                        >
                          <Text
                            style={[
                              styles.merchantPillName,
                              isCurrent && { color: Colors.white },
                            ]}
                            numberOfLines={1}
                          >
                            {m.name}
                          </Text>
                          <Text
                            style={[
                              styles.merchantPillMeta,
                              isCurrent && { color: "#D8E3DD" },
                            ]}
                          >
                            {m.type} • {m.distance} ({m.active_listings.length}{" "}
                            items)
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {chosenMerchant && (
                    <>
                      <Text style={styles.noteLabel}>
                        2. Select Active Surplus Items from{" "}
                        {chosenMerchant.name}:
                      </Text>

                      {chosenMerchant.active_listings.map((listing) => {
                        const isSelected =
                          selectedItemsMap[listing.commerce_id] !== undefined;
                        const reqQty =
                          selectedItemsMap[listing.commerce_id] || 1;

                        return (
                          <View
                            key={listing.commerce_id}
                            style={[
                              styles.pickerListingCard,
                              isSelected && styles.pickerListingCardSelected,
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.pickerListingTop}
                              activeOpacity={0.85}
                              onPress={() => togglePickListing(listing)}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  isSelected && styles.checkboxActive,
                                ]}
                              >
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={14}
                                    color={Colors.white}
                                  />
                                )}
                              </View>
                              <Image
                                source={{ uri: listing.image }}
                                style={styles.pickerListingImg}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={styles.lineItemName}
                                  numberOfLines={1}
                                >
                                  {listing.name}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: "PoppinsRegular",
                                    fontSize: 11,
                                    color: Colors.primary1,
                                  }}
                                >
                                  {listing.category} • Available:{" "}
                                  {listing.qty_available} {listing.unit_name}
                                </Text>
                                <Text style={styles.explicitExpiry}>
                                  Exp: {listing.expiry_date} •{" "}
                                  {listing.expiry_time}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            {isSelected && (
                              <View style={styles.qtyStepperBar}>
                                <Text style={styles.qtyStepperLabel}>
                                  Quantity Needed (Max {listing.qty_available}{" "}
                                  {listing.unit_name}):
                                </Text>
                                <View style={styles.stepperBox}>
                                  <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() =>
                                      adjustPickedQty(listing, -1)
                                    }
                                  >
                                    <Ionicons
                                      name="remove"
                                      size={16}
                                      color={Colors.primary}
                                    />
                                  </TouchableOpacity>
                                  <Text style={styles.stepperVal}>
                                    {reqQty}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.stepperBtn}
                                    onPress={() =>
                                      adjustPickedQty(listing, 1)
                                    }
                                  >
                                    <Ionicons
                                      name="add"
                                      size={16}
                                      color={Colors.primary}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}

                      <Text style={[styles.noteLabel, { marginTop: 8 }]}>
                        3. Beneficiary Reason / Feeding Program *
                      </Text>
                      <TextInput
                        style={styles.textAreaInput}
                        multiline
                        value={appealReason}
                        onChangeText={setAppealReason}
                        placeholder="e.g. Community feeding program for 45 families in Brgy. Tejero..."
                        placeholderTextColor={Colors.placeholder}
                      />

                      <Text style={styles.noteLabel}>
                        Pickup Logistics / Coordinator Notes (Optional)
                      </Text>
                      <TextInput
                        style={styles.textAreaInput}
                        multiline
                        value={appealAdditional}
                        onChangeText={setAppealAdditional}
                        placeholder="e.g. Volunteer coordinator will arrive at 4:00 PM with insulated crates..."
                        placeholderTextColor={Colors.placeholder}
                      />

                      <TouchableOpacity
                        style={[
                          styles.completeBigBtn,
                          { marginTop: 8 },
                          pickedCount === 0 && { opacity: 0.6 },
                        ]}
                        onPress={handleSubmitInventoryAppeal}
                        disabled={submittingAppeal}
                      >
                        <Ionicons
                          name="send-outline"
                          size={17}
                          color={Colors.white}
                        />
                        <Text style={styles.completeBigBtnText}>
                          {submittingAppeal
                            ? "SUBMITTING APPEAL..."
                            : `Submit Appeal (${pickedCount} Item${
                                pickedCount === 1 ? "" : "s"
                              })`}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
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
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 34, paddingHorizontal: 20, alignItems: "center" },
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
  noteLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.primary2, marginBottom: 6 },
  noteBox: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, backgroundColor: Colors.input, padding: 10, borderRadius: 8 },
  withdrawBigBtn: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  withdrawBigBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: "#B3261E" },
  completeBigBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  completeBigBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.white },
  sectorRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  sectorChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  sectorChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sectorChipText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  sectorChipTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.white },
  merchantPillCard: { minWidth: 165, maxWidth: 220, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  merchantPillCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  merchantPillName: { fontFamily: "PoppinsBold", fontSize: 12.5, color: Colors.primary2 },
  merchantPillMeta: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: 2 },
  pickerListingCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", marginBottom: 10 },
  pickerListingCardSelected: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: "#F7FBF8" },
  pickerListingTop: { flexDirection: "row", alignItems: "center", padding: 10, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  checkboxActive: { backgroundColor: Colors.primary },
  pickerListingImg: { width: 62, height: 62, borderRadius: 9, backgroundColor: Colors.input },
  qtyStepperBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#EFF6F2", borderTopWidth: 1, borderTopColor: Colors.border },
  qtyStepperLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 },
  stepperBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 6, height: 32, gap: 10 },
  stepperBtn: { padding: 4 },
  stepperVal: { fontFamily: "PoppinsBold", fontSize: 12.5, color: Colors.primary2, minWidth: 18, textAlign: "center" },
  textAreaInput: { minHeight: 74, backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 12, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, textAlignVertical: "top", marginBottom: 12 },
  qrModalCenter: { flex: 1, backgroundColor: "rgba(18,55,44,0.55)", justifyContent: "center", alignItems: "center", padding: 20 },
  qrVoucherCard: { width: "100%", maxWidth: 360, backgroundColor: Colors.white, borderRadius: 18, padding: 20, alignItems: "center" },
  qrImageWrapper: { padding: 14, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 12 },
  voucherCodePill: { backgroundColor: "#E8EFEA", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  voucherCodePillLabel: { fontFamily: "PoppinsMedium", fontSize: 9, color: Colors.primary1, letterSpacing: 1 },
  voucherCodePillValue: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary },
});