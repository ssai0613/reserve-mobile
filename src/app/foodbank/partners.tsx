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
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  FoodBankBottomNav,
  FoodBankHeader,
  FoodBankMapModal,
  getFoodBankStorage,
  switchFoodBankTab,
  useIsInsideFoodBankShell,
} from "../components/FoodBankNav";

type ActiveListing = {
  prod_id: number;
  commerce_id: number;
  name: string;
  description: string;
  category: string;
  qty_available: number;
  unit_name: string;
  orig_price: string;
  disc_price: string;
  expiry_date: string;
  expiry_time: string;
  expiry_display: string;
  image: string;
};

type PartnerMerchant = {
  merchant_id: number;
  name: string;
  type: string;
  is_verified: boolean;
  address: string;
  latitude: number;
  longitude: number;
  distance: string;
  distance_km: number;
  contact_phone: string;
  hotline: string;
  contact_name: string;
  contact_email: string;
  donations_count: number;
  received_qty: number;
  requests_fulfilled: number;
  active_offers: number;
  active_listings_count: number;
  active_listings: ActiveListing[];
};

let cachedFbPartnersMemory: PartnerMerchant[] = [];

const initials = (name: string) =>
  (name || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default function FoodBankPartnersScreen() {
  const isInsideShell = useIsInsideFoodBankShell();
  if (!isInsideShell) return null;

  const [partners, setPartners] = useState<PartnerMerchant[]>(
    cachedFbPartnersMemory
  );
  const [loading, setLoading] = useState(cachedFbPartnersMemory.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Selected Merchant Storefront Modal
  const [selectedMerchant, setSelectedMerchant] =
    useState<PartnerMerchant | null>(null);

  // Bulk Request Selection Map: { [commerce_id]: requestedQty }
  const [selectedItemsMap, setSelectedItemsMap] = useState<{
    [commerceId: number]: number;
  }>({});

  // Request Form Modal (Reason + Additional Info)
  const [requestFormVisible, setRequestFormVisible] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

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
    onConfirm: null,
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    onConfirm: (() => void) | null = null
  ) => setModalAlert({ visible: true, title, message, type, onConfirm });

  const loadPartners = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      const res = await api.get(
        `donations/partners/?org_id=${orgId}&email=${encodeURIComponent(
          email
        )}`
      );
      const nextPartners = res.data?.partners || [];
      cachedFbPartnersMemory = nextPartners;
      setPartners(nextPartners);
    } catch (e) {
      console.log("Partners load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();

    const profSub = DeviceEventEmitter.addListener("fb_profile_updated", () => {
      loadPartners();
    });
    const reqSub = DeviceEventEmitter.addListener("fb_requests_updated", () => {
      loadPartners();
    });
    const donSub = DeviceEventEmitter.addListener(
      "fb_donations_updated",
      () => {
        loadPartners();
      }
    );

    return () => {
      profSub.remove();
      reqSub.remove();
      donSub.remove();
    };
  }, [loadPartners]);

  const visiblePartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }, [partners, search]);

  const openMerchantStorefront = (merchant: PartnerMerchant) => {
    setSelectedMerchant(merchant);
    setSelectedItemsMap({});
    setRequestReason("");
    setAdditionalInfo("");
  };

  const toggleSelectListing = (listing: ActiveListing) => {
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

  const adjustRequestedQty = (listing: ActiveListing, delta: number) => {
    setSelectedItemsMap((prev) => {
      const current = prev[listing.commerce_id] || 1;
      const nextQty = Math.max(
        1,
        Math.min(listing.qty_available, current + delta)
      );
      return { ...prev, [listing.commerce_id]: nextQty };
    });
  };

  const handleProceedToRequestForm = () => {
    const chosenIds = Object.keys(selectedItemsMap).map(Number);
    if (chosenIds.length === 0) {
      showModal(
        "Select Listings First",
        "Please tap one or more active listings from this merchant and set the quantity you wish to request.",
        "warning"
      );
      return;
    }
    setRequestFormVisible(true);
  };

  const handleSubmitBulkRequest = async () => {
    if (!selectedMerchant) return;
    if (!requestReason.trim()) {
      showModal(
        "Reason Required",
        "Please provide the reason or beneficiary group for this food request.",
        "warning"
      );
      return;
    }

    const chosenListings = selectedMerchant.active_listings.filter(
      (l) => selectedItemsMap[l.commerce_id] !== undefined
    );
    if (chosenListings.length === 0) return;

    setSubmittingRequest(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";

      const itemsPayload = chosenListings.map((l) => ({
        prod_id: l.prod_id,
        commerce_id: l.commerce_id,
        food_name: l.name,
        qty_needed: selectedItemsMap[l.commerce_id],
      }));

      const res = await api.post("donations/requests/", {
        org_id: orgId,
        email,
        merchant_id: selectedMerchant.merchant_id,
        reason: requestReason.trim(),
        additional_info: additionalInfo.trim(),
        items: itemsPayload,
      });

      setRequestFormVisible(false);
      setSelectedMerchant(null);
      setSelectedItemsMap({});
      await loadPartners();
      DeviceEventEmitter.emit("fb_requests_updated");
      DeviceEventEmitter.emit("fb_notifs_updated");

      showModal(
        "Donation Appeal Submitted!",
        res.data?.message ||
          `Your request has been sent to ${selectedMerchant.name}. You can track its status or withdraw it on the Requests page.`,
        "success",
        () => switchFoodBankTab("Requests")
      );
    } catch (err: any) {
      showModal(
        "Submission Error",
        err.response?.data?.error || "Could not submit your donation request.",
        "error"
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  const selectedCount = Object.keys(selectedItemsMap).length;

  return (
    <View style={styles.container}>
      <FoodBankHeader />

      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>Merchants Within 10km</Text>
        <Text style={styles.pageSubtitle}>
          Tap any merchant profile to inspect their location, contact info, and active listings for single or bulk donation requests
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search merchant name, type, or barangay..."
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
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visiblePartners}
          keyExtractor={(item) => String(item.merchant_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPartners(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="storefront-outline"
                  size={25}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                No merchants found within 10km
              </Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search or check your pinned Cebu City location in Profile.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.merchantCard}
              activeOpacity={0.85}
              onPress={() => openMerchantStorefront(item)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item.name)}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.is_verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={Colors.button}
                    />
                  )}
                </View>

                <Text style={styles.cardType}>
                  {item.type} • {item.distance} away
                </Text>
                <Text style={styles.cardAddr} numberOfLines={1}>
                  {item.address}
                </Text>

                <View style={styles.badgeRow}>
                  <View style={styles.activeListingsBadge}>
                    <Ionicons
                      name="restaurant-outline"
                      size={12}
                      color={Colors.primary}
                    />
                    <Text style={styles.activeListingsBadgeText}>
                      {item.active_listings_count} Active Listing
                      {item.active_listings_count === 1 ? "" : "s"}
                    </Text>
                  </View>

                  {item.active_offers > 0 && (
                    <View style={styles.offerBadge}>
                      <Ionicons
                        name="gift-outline"
                        size={12}
                        color={Colors.button}
                      />
                      <Text style={styles.offerBadgeText}>
                        {item.active_offers} Posted Donation
                        {item.active_offers > 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL 1: MERCHANT STOREFRONT + ACTIVE LISTINGS + BULK SELECT */}
      <Modal
        visible={!!selectedMerchant && !requestFormVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMerchant(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedMerchant && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedMerchant.name}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedMerchant.type} • {selectedMerchant.distance} away
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedMerchant(null)}
                  >
                    <Ionicons name="close" size={20} color={Colors.primary2} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                >
                  {/* MERCHANT CONTACT & LOCATION CARD */}
                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Store Location & Contact Information
                    </Text>
                    <DetailRow
                      icon="location-outline"
                      label="Physical Address"
                      value={`${selectedMerchant.address} (${selectedMerchant.distance})`}
                    />
                    <DetailRow
                      icon="person-outline"
                      label="Contact Person"
                      value={selectedMerchant.contact_name}
                    />
                    <DetailRow
                      icon="call-outline"
                      label="Mobile / Hotline"
                      value={`${selectedMerchant.contact_phone} (Hotline: ${selectedMerchant.hotline})`}
                    />
                    {selectedMerchant.contact_email ? (
                      <DetailRow
                        icon="mail-outline"
                        label="Official Email"
                        value={selectedMerchant.contact_email}
                      />
                    ) : null}

                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() =>
                          setMapTarget({
                            name: selectedMerchant.name,
                            address: selectedMerchant.address,
                            lat: selectedMerchant.latitude,
                            lng: selectedMerchant.longitude,
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

                      {/\d/.test(selectedMerchant.contact_phone) && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.actionPillBtn,
                              { backgroundColor: Colors.button },
                            ]}
                            onPress={() =>
                              Linking.openURL(
                                `tel:${selectedMerchant.contact_phone.replace(
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
                                `sms:${selectedMerchant.contact_phone.replace(
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

                  {/* ACTIVE LISTINGS FOR SINGLE OR BULK REQUEST */}
                  <Text style={styles.sectionLabel}>
                    Active Surplus Listings (
                    {selectedMerchant.active_listings.length})
                  </Text>
                  <Text style={styles.helperSubtext}>
                    Select one or multiple active listings below and set the quantity you need for your bulk donation request:
                  </Text>

                  {selectedMerchant.active_listings.length > 0 ? (
                    selectedMerchant.active_listings.map((listing) => {
                      const isSelected =
                        selectedItemsMap[listing.commerce_id] !== undefined;
                      const reqQty =
                        selectedItemsMap[listing.commerce_id] || 1;

                      return (
                        <View
                          key={listing.commerce_id}
                          style={[
                            styles.listingCard,
                            isSelected && styles.listingCardSelected,
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.listingTopRow}
                            activeOpacity={0.85}
                            onPress={() => toggleSelectListing(listing)}
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
                              style={styles.listingImage}
                            />

                            <View style={{ flex: 1 }}>
                              <Text
                                style={styles.listingName}
                                numberOfLines={1}
                              >
                                {listing.name}
                              </Text>
                              <Text style={styles.listingMeta}>
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
                                Request Quantity (Max {listing.qty_available}):
                              </Text>
                              <View style={styles.stepperBox}>
                                <TouchableOpacity
                                  style={styles.stepperBtn}
                                  onPress={() =>
                                    adjustRequestedQty(listing, -1)
                                  }
                                >
                                  <Ionicons
                                    name="remove"
                                    size={16}
                                    color={Colors.primary}
                                  />
                                </TouchableOpacity>
                                <Text style={styles.stepperVal}>{reqQty}</Text>
                                <TouchableOpacity
                                  style={styles.stepperBtn}
                                  onPress={() =>
                                    adjustRequestedQty(listing, 1)
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
                    })
                  ) : (
                    <View style={styles.emptyCard}>
                      <Text style={styles.emptyTitle}>
                        No active listings right now
                      </Text>
                      <Text style={styles.emptyDescription}>
                        This merchant does not have active surplus listings at the moment.
                      </Text>
                    </View>
                  )}

                  {selectedCount > 0 && (
                    <TouchableOpacity
                      style={styles.proceedRequestBtn}
                      activeOpacity={0.85}
                      onPress={handleProceedToRequestForm}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.proceedRequestBtnText}>
                        Proceed to Request Form ({selectedCount} Item
                        {selectedCount > 1 ? "s" : ""} Selected)
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color={Colors.white}
                      />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: BULK REQUEST FORM (REASON & ADDITIONAL INFO) */}
      <Modal
        visible={requestFormVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestFormVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Complete Donation Appeal</Text>
                <Text style={styles.modalSubtitle}>
                  Requesting from {selectedMerchant?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setRequestFormVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.infoBox}>
                <Text style={styles.boxHeading}>Selected Items Summary</Text>
                {selectedMerchant?.active_listings
                  .filter(
                    (l) => selectedItemsMap[l.commerce_id] !== undefined
                  )
                  .map((l) => (
                    <View key={l.commerce_id} style={styles.summaryLineRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listingName}>
                          {selectedItemsMap[l.commerce_id]}x {l.name} (
                          {l.unit_name})
                        </Text>
                        <Text style={styles.explicitExpiry}>
                          Exp: {l.expiry_date} • {l.expiry_time}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>

              <Text style={styles.inputLabel}>
                Reason for Request / Target Beneficiaries *
              </Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="e.g. Community feeding program for 45 families in Brgy. Tejero..."
                placeholderTextColor={Colors.placeholder}
                multiline
                value={requestReason}
                onChangeText={setRequestReason}
              />

              <Text style={styles.inputLabel}>
                Additional Information / Pickup Logistics (Optional)
              </Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="e.g. Our volunteer coordinator can pick up at 4:30 PM today; we will text upon arrival..."
                placeholderTextColor={Colors.placeholder}
                multiline
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.backFormBtn}
                  onPress={() => setRequestFormVisible(false)}
                >
                  <Text style={styles.backFormBtnText}>← Edit Selection</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.proceedRequestBtn, { flex: 1.4, marginTop: 0 }]}
                  onPress={handleSubmitBulkRequest}
                  disabled={submittingRequest}
                >
                  <Ionicons name="send" size={16} color={Colors.white} />
                  <Text style={styles.proceedRequestBtnText}>
                    {submittingRequest ? "SENDING..." : "Submit Appeal"}
                  </Text>
                </TouchableOpacity>
              </View>
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

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => {
          const cb = modalAlert.onConfirm;
          setModalAlert((p) => ({ ...p, visible: false, onConfirm: null }));
          if (cb) cb();
        }}
      />

      <FoodBankBottomNav activeTab="Partners" />
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
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2, lineHeight: 16 },
  searchContainer: { minHeight: 44, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 17, paddingTop: 8, paddingBottom: 28 },
  merchantCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E4F0E8", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardName: { flexShrink: 1, fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  cardType: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary },
  cardAddr: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, marginTop: 1 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  activeListingsBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E8EFEA", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeListingsBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary2 },
  offerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E4F0E8", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  offerBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.button },
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
  sectionLabel: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary2, marginBottom: 2 },
  helperSubtext: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginBottom: 10 },
  listingCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: "hidden", marginBottom: 10 },
  listingCardSelected: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: "#F7FBF8" },
  listingTopRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  checkboxActive: { backgroundColor: Colors.primary },
  listingImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: Colors.input },
  listingName: { fontFamily: "PoppinsSemiBold", fontSize: 13.5, color: Colors.primary2 },
  listingMeta: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  explicitExpiry: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: "#A94A3A", marginTop: 2 },
  qtyStepperBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#EFF6F2", borderTopWidth: 1, borderTopColor: Colors.border },
  qtyStepperLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 },
  stepperBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 6, height: 34, gap: 10 },
  stepperBtn: { padding: 4 },
  stepperVal: { fontFamily: "PoppinsBold", fontSize: 13, color: Colors.primary2, minWidth: 20, textAlign: "center" },
  proceedRequestBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  proceedRequestBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.white },
  summaryLineRow: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  inputLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.primary2, marginBottom: 6, marginTop: 6 },
  textAreaInput: { minHeight: 82, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, textAlignVertical: "top", marginBottom: 8 },
  backFormBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  backFormBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
});