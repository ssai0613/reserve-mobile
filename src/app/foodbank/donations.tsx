import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
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
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  FoodBankBottomNav,
  FoodBankHeader,
  FoodBankMapModal,
  getFoodBankStorage,
} from "../components/FoodBankNav";

export type DonationOffer = {
  donation_id: number;
  food_name: string;
  food_type: string;
  description?: string;
  qty_donated: number;
  unit_name?: string;
  status: string;
  expires_at?: string;
  expiry_date?: string;
  expiry_time?: string;
  expiry_display?: string;
  created_at: string;
  merchant_name: string;
  merchant_address: string;
  merchant_contact: string;
  merchant_contact_name?: string;
  merchant_email?: string;
  merchant_lat?: number;
  merchant_lng?: number;
  distance?: string;
  image_path?: string | null;
  is_ttt?: boolean;
};

type Tab = "available" | "ongoing" | "history";

export default function FoodBankDonationsScreen() {
  const [offers, setOffers] = useState<DonationOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<Tab>("available");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DonationOffer | null>(null);

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

  const loadOffers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      const res = await api.get(
        `donations/available/?org_id=${orgId}&email=${encodeURIComponent(
          email
        )}`
      );
      setOffers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log("Load offers error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOffers();
    }, [loadOffers])
  );

  const tabOf = (status: string): Tab => {
    if (status === "Active" || status === "Available") return "available";
    if (
      status === "Claimed" ||
      status === "Ongoing" ||
      status === "In-Transit"
    )
      return "ongoing";
    return "history";
  };

  const visibleOffers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers.filter((o) => {
      if (tabOf(o.status) !== tab) return false;
      return (
        !q ||
        (o.food_name || "").toLowerCase().includes(q) ||
        (o.merchant_name || "").toLowerCase().includes(q) ||
        (o.food_type || "").toLowerCase().includes(q)
      );
    });
  }, [offers, tab, search]);

  const promptOfferAction = (
    offer: DonationOffer,
    action: "accept" | "decline" | "received"
  ) => {
    setConfirmState({
      visible: true,
      title:
        action === "accept"
          ? "Appeal & Accept Donation?"
          : action === "received"
          ? "Mark Handshake as Successful?"
          : "Decline Donation Offer?",
      message:
        action === "accept"
          ? `Accept ${offer.qty_donated} ${offer.unit_name || "items"} of ${
              offer.food_name
            } from ${offer.merchant_name}? Status will move to Ongoing.`
          : action === "received"
          ? `Confirm that your organization has received ${offer.qty_donated} ${
              offer.unit_name || "items"
            } of ${offer.food_name}?`
          : `Decline this donation offer from ${offer.merchant_name}?`,
      confirmText:
        action === "accept"
          ? "Accept (Ongoing)"
          : action === "received"
          ? "Mark Successful"
          : "Yes, Decline",
      isDestructive: action === "decline",
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, visible: false }));
        try {
          const orgId = (await getFoodBankStorage("profile_id")) || "1";
          const email = (await getFoodBankStorage("user_email")) || "";
          await api.patch(`donations/respond/${offer.donation_id}/`, {
            org_id: orgId,
            email,
            action,
          });
          setDetail(null);
          await loadOffers();
          showModal(
            action === "accept"
              ? "Donation Accepted (Ongoing)!"
              : action === "received"
              ? "Donation Completed!"
              : "Donation Declined",
            action === "accept"
              ? `Coordinate pickup with ${offer.merchant_name} via phone/SMS before ${offer.expiry_display}.`
              : "Your donation records have been updated.",
            "success"
          );
        } catch (e: any) {
          showModal(
            "Action Failed",
            "Could not update donation status.",
            "error"
          );
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      <FoodBankHeader />

      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>Posted Surplus Donations</Text>
        <Text style={styles.pageSubtitle}>
          Surplus food posted by merchants within 10km. Appeal to accept and coordinate pickup
        </Text>

        <View style={styles.tabsBar}>
          {(
            [
              { key: "available", label: "Available" },
              { key: "ongoing", label: "Ongoing" },
              { key: "history", label: "History" },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            const count = offers.filter((o) => tabOf(o.status) === t.key).length;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Text
                  style={[styles.tabBtnText, active && styles.tabBtnTextActive]}
                >
                  {t.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food item, category, or merchant..."
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
          data={visibleOffers}
          keyExtractor={(item) => String(item.donation_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOffers(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="gift-outline"
                  size={25}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No donations in this tab</Text>
              <Text style={styles.emptyDescription}>
                You can also browse active listings directly under the Merchants tab to request food!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.uiCard}>
              <TouchableOpacity
                style={styles.uiCardTop}
                activeOpacity={0.85}
                onPress={() => setDetail(item)}
              >
                <Image
                  source={{
                    uri:
                      item.image_path ||
                      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
                  }}
                  style={styles.uiImage}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.uiCardHeaderRow}>
                    <Text style={styles.uiCardTitle} numberOfLines={1}>
                      {item.food_name}
                    </Text>
                    <StatusPill status={item.status} />
                  </View>

                  <Text style={styles.uiCardSubtitle} numberOfLines={1}>
                    {item.merchant_name} • {item.distance || "Within 10km"}
                  </Text>

                  <Text style={styles.qtyText}>
                    Quantity: {item.qty_donated} {item.unit_name || "items"} (
                    {item.food_type})
                  </Text>

                  <Text style={styles.explicitExpiry}>
                    Exp: {item.expiry_display || "Standard Window"}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.uiCardActions}>
                <TouchableOpacity
                  style={styles.uiActionBtn}
                  onPress={() => setDetail(item)}
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
                    View Full Details
                  </Text>
                </TouchableOpacity>

                {(item.status === "Active" || item.status === "Available") && (
                  <TouchableOpacity
                    style={styles.uiActionBtn}
                    onPress={() => promptOfferAction(item, "accept")}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color={Colors.button}
                    />
                    <Text
                      style={[
                        styles.uiActionBtnText,
                        { color: Colors.button, fontFamily: "PoppinsSemiBold" },
                      ]}
                    >
                      Accept Donation
                    </Text>
                  </TouchableOpacity>
                )}

                {(item.status === "Ongoing" ||
                  item.status === "Claimed" ||
                  item.status === "In-Transit") && (
                  <TouchableOpacity
                    style={styles.uiActionBtn}
                    onPress={() => promptOfferAction(item, "received")}
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

      {/* FULL DONATION DETAILS + MERCHANT CONTACT + MAP MODAL */}
      <Modal
        visible={!!detail}
        transparent
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {detail && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {detail.food_name}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      Posted by {detail.merchant_name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setDetail(null)}
                  >
                    <Ionicons name="close" size={20} color={Colors.primary2} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                >
                  <Image
                    source={{
                      uri:
                        detail.image_path ||
                        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
                    }}
                    style={styles.viewImage}
                  />

                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Food Listing & Expiry Information
                    </Text>
                    <DetailRow
                      icon="cube-outline"
                      label="Quantity Available"
                      value={`${detail.qty_donated} ${
                        detail.unit_name || "items"
                      }`}
                    />
                    <DetailRow
                      icon="restaurant-outline"
                      label="Category"
                      value={detail.food_type}
                    />
                    <DetailRow
                      icon="alarm-outline"
                      label="Expiry Date & Time"
                      value={detail.expiry_display || "Standard Window"}
                    />
                    <DetailRow
                      icon="document-text-outline"
                      label="Description"
                      value={
                        detail.description ||
                        "Surplus food item posted for community distribution."
                      }
                    />
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Donor Merchant & Contact Information
                    </Text>
                    <DetailRow
                      icon="storefront-outline"
                      label="Establishment"
                      value={detail.merchant_name}
                    />
                    <DetailRow
                      icon="person-outline"
                      label="Contact Person"
                      value={detail.merchant_contact_name || "Store Manager"}
                    />
                    <DetailRow
                      icon="call-outline"
                      label="Contact Number"
                      value={detail.merchant_contact}
                    />
                    <DetailRow
                      icon="location-outline"
                      label="Pickup Location"
                      value={detail.merchant_address}
                    />

                    <View
                      style={{ flexDirection: "row", gap: 8, marginTop: 8 }}
                    >
                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() =>
                          setMapTarget({
                            name: detail.merchant_name,
                            address: detail.merchant_address,
                            lat: Number(detail.merchant_lat || 10.3157),
                            lng: Number(detail.merchant_lng || 123.8854),
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

                      {/\d/.test(detail.merchant_contact || "") && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.actionPillBtn,
                              { backgroundColor: Colors.button },
                            ]}
                            onPress={() =>
                              Linking.openURL(
                                `tel:${detail.merchant_contact.replace(
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
                                `sms:${detail.merchant_contact.replace(
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

                  {(detail.status === "Active" ||
                    detail.status === "Available") && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => promptOfferAction(detail, "decline")}
                      >
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => promptOfferAction(detail, "accept")}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color={Colors.white}
                        />
                        <Text style={styles.acceptBtnText}>
                          Accept Donation
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {(detail.status === "Ongoing" ||
                    detail.status === "Claimed" ||
                    detail.status === "In-Transit") && (
                    <TouchableOpacity
                      style={[styles.acceptBtn, { flex: 0 }]}
                      onPress={() => promptOfferAction(detail, "received")}
                    >
                      <Ionicons
                        name="checkmark-done-circle"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.acceptBtnText}>
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

      <FoodBankBottomNav activeTab="Donations" />
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: string }) {
  let bg = "#E4F0E8";
  let fg = "#1F6B52";
  let label = "Available";

  if (status === "Ongoing" || status === "Claimed" || status === "In-Transit") {
    bg = "#E1EEF8";
    fg = "#2C5F8A";
    label = "Ongoing";
  } else if (status === "Successful" || status === "Completed") {
    bg = "#E4F0E8";
    fg = "#1F6B52";
    label = "Successful";
  } else if (status === "Declined" || status === "Cancelled") {
    bg = "#FBE4E1";
    fg = "#B3261E";
    label = status;
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
  tabsBar: { flexDirection: "row", backgroundColor: "#EBEFEB", borderRadius: 12, padding: 4, marginTop: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabBtnActive: { backgroundColor: Colors.white },
  tabBtnText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary1 },
  tabBtnTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  searchContainer: { minHeight: 44, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 10 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 17, paddingTop: 8, paddingBottom: 28 },
  uiCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  uiCardTop: { flexDirection: "row", padding: 12, gap: 12, alignItems: "center" },
  uiImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.input },
  uiCardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  uiCardTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  uiCardSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2 },
  qtyText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2, marginTop: 2 },
  explicitExpiry: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: "#A94A3A", marginTop: 2 },
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
  viewImage: { width: "100%", height: 190, borderRadius: 12, backgroundColor: Colors.input, marginBottom: 14 },
  infoBox: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 14 },
  boxHeading: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2, marginBottom: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  detailIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 10 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  actionPillBtn: { flex: 1, height: 38, borderRadius: 9, backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  actionPillBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.white },
  declineBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", alignItems: "center", justifyContent: "center" },
  declineBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: "#B3261E" },
  acceptBtn: { flex: 1.4, height: 48, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  acceptBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.white },
});