import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
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
  useIsInsideFoodBankShell,
} from "../components/FoodBankNav";

export type DonationOffer = {
  donation_id: number;
  voucher_code?: string;
  qr_payload?: string;
  radius_km?: number;
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

let cachedFbOffersMemory: DonationOffer[] = [];
let cachedDonationsRadiusKm = 10;

export default function FoodBankDonationsScreen() {
  const isInsideShell = useIsInsideFoodBankShell();
  if (!isInsideShell) return null;

  const [offers, setOffers] = useState<DonationOffer[]>(cachedFbOffersMemory);
  const [radiusKm, setRadiusKm] = useState<number>(cachedDonationsRadiusKm);
  const [loading, setLoading] = useState(cachedFbOffersMemory.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<Tab>("available");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DonationOffer | null>(null);
  const [claimQty, setClaimQty] = useState<number>(1);
  const [qrVoucherTarget, setQrVoucherTarget] = useState<DonationOffer | null>(
    null
  );

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
      const storedRad = await getFoodBankStorage("gov_radius_km");
      if (storedRad && Number(storedRad) > 0) {
        cachedDonationsRadiusKm = Number(storedRad);
        setRadiusKm(Number(storedRad));
      }

      const res = await api.get(
        `donations/available/?org_id=${orgId}&email=${encodeURIComponent(
          email
        )}`
      );
      const nextOffers: DonationOffer[] = Array.isArray(res.data)
        ? res.data
        : [];
      cachedFbOffersMemory = nextOffers;
      setOffers(nextOffers);

      const firstRadius = Number(nextOffers[0]?.radius_km || 0);
      if (firstRadius > 0) {
        cachedDonationsRadiusKm = firstRadius;
        setRadiusKm(firstRadius);
        await setFoodBankStorage("gov_radius_km", String(firstRadius));
        DeviceEventEmitter.emit("fb_radius_updated", { radiusKm: firstRadius });
      }
    } catch (e) {
      console.log("Load offers error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();

    const donSub = DeviceEventEmitter.addListener(
      "fb_donations_updated",
      () => {
        loadOffers();
      }
    );
    const profSub = DeviceEventEmitter.addListener("fb_profile_updated", () => {
      loadOffers();
    });
    const radSub = DeviceEventEmitter.addListener(
      "fb_radius_updated",
      (payload?: { radiusKm?: number }) => {
        if (payload?.radiusKm) {
          cachedDonationsRadiusKm = payload.radiusKm;
          setRadiusKm(payload.radiusKm);
        }
      }
    );

    return () => {
      donSub.remove();
      profSub.remove();
      radSub.remove();
    };
  }, [loadOffers]);

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
        (o.food_type || "").toLowerCase().includes(q) ||
        `don-${o.donation_id}`.includes(q)
      );
    });
  }, [offers, tab, search]);

  const openOfferDetail = (offer: DonationOffer) => {
    setDetail(offer);
    setClaimQty(Number(offer.qty_donated || 1));
  };

  const promptOfferAction = (
    offer: DonationOffer,
    action: "accept" | "release_claim" | "received",
    overrideQty?: number
  ) => {
    const qtyToClaim = overrideQty ?? offer.qty_donated;
    const isPartial =
      action === "accept" && qtyToClaim < Number(offer.qty_donated || 1);

    setConfirmState({
      visible: true,
      title:
        action === "accept"
          ? isPartial
            ? "Claim Partial Quantity?"
            : "Claim Full Donation Batch?"
          : action === "received"
          ? "Confirm Handoff Received?"
          : "Release Claim Back to Pool?",
      message:
        action === "accept"
          ? `Claim ${qtyToClaim} of ${offer.qty_donated} ${
              offer.unit_name || "items"
            } of ${offer.food_name} from ${offer.merchant_name}?${
              isPartial
                ? ` The remaining ${
                    offer.qty_donated - qtyToClaim
                  } ${offer.unit_name || "items"} will stay Available for other Food Banks.`
                : ""
            } Your QR Pickup Voucher will be generated immediately.`
          : action === "received"
          ? `Confirm that your organization has inspected and received ${
              offer.qty_donated
            } ${offer.unit_name || "items"} of ${offer.food_name}?`
          : `Release your claim on ${offer.qty_donated} ${
              offer.unit_name || "items"
            } of ${
              offer.food_name
            } so other nearby Food Banks within ${radiusKm}km can claim it before expiry?`,
      confirmText:
        action === "accept"
          ? "Claim & Get QR Voucher"
          : action === "received"
          ? "Mark Successful"
          : "Yes, Release Claim",
      isDestructive: action === "release_claim",
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, visible: false }));
        try {
          const orgId = (await getFoodBankStorage("profile_id")) || "1";
          const email = (await getFoodBankStorage("user_email")) || "";
          const res = await api.patch(
            `donations/respond/${offer.donation_id}/`,
            {
              org_id: orgId,
              email,
              action,
              claimed_qty: qtyToClaim,
            }
          );
          setDetail(null);
          await loadOffers();
          DeviceEventEmitter.emit("fb_donations_updated");
          DeviceEventEmitter.emit("fb_notifs_updated");

          if (action === "accept") {
            setTab("ongoing");
            if (res.data?.donation_id) {
              setQrVoucherTarget(res.data);
            }
          } else {
            showModal(
              action === "received"
                ? "Donation Handoff Completed!"
                : "Claim Released to Pool",
              action === "received"
                ? "Chain-of-custody recorded and rescued units credited to your organization!"
                : `The surplus items have been returned to the open ${radiusKm}km donation pool.`,
              "success"
            );
          }
        } catch (e: any) {
          showModal(
            "Action Failed",
            e.response?.data?.error || "Could not update donation status.",
            "error"
          );
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <FoodBankHeader />

      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>Posted Surplus Donations</Text>
        <Text style={styles.pageSubtitle}>
          Claim partial or full quantities from merchants within {radiusKm}km
          and present your QR Pickup Voucher at handoff
        </Text>

        <View style={styles.tabsBar}>
          {(
            [
              { key: "available", label: "Available" },
              { key: "ongoing", label: "Ongoing (QR)" },
              { key: "history", label: "History" },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            const count = offers.filter(
              (o) => tabOf(o.status) === t.key
            ).length;
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
            placeholder="Search voucher ID, food item, or merchant..."
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
                You can also browse active listings directly under the Merchants
                tab to request food within {radiusKm}km!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.uiCard}>
              <TouchableOpacity
                style={styles.uiCardTop}
                activeOpacity={0.85}
                onPress={() => openOfferDetail(item)}
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
                    DON-{item.donation_id} • {item.merchant_name} (
                    {item.distance || `Within ${radiusKm}km`})
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
                  onPress={() => openOfferDetail(item)}
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
                    {item.status === "Active" || item.status === "Available"
                      ? "Select Qty & Claim"
                      : "View Details"}
                  </Text>
                </TouchableOpacity>

                {(item.status === "Ongoing" ||
                  item.status === "Claimed" ||
                  item.status === "In-Transit") && (
                  <TouchableOpacity
                    style={styles.uiActionBtn}
                    onPress={() => setQrVoucherTarget(item)}
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
                      Show QR Voucher (DON-{item.donation_id})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* FULL DONATION DETAILS + PARTIAL/FULL CLAIM STEPPER MODAL */}
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
                      {detail.food_name} (DON-{detail.donation_id})
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

                  {/* PARTIAL / FULL QUANTITY SELECTOR FOR AVAILABLE DONATIONS */}
                  {(detail.status === "Active" ||
                    detail.status === "Available") && (
                    <View style={styles.claimStepperCard}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.boxHeading}>
                          Select Quantity to Claim
                        </Text>
                        <Text
                          style={{
                            fontFamily: "PoppinsRegular",
                            fontSize: 10.5,
                            color: Colors.primary1,
                          }}
                        >
                          Available Pool: {detail.qty_donated}{" "}
                          {detail.unit_name || "items"}. Unclaimed units stay in
                          the {radiusKm}km pool for other NGOs.
                        </Text>
                      </View>
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() =>
                            setClaimQty((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <Ionicons
                            name="remove"
                            size={16}
                            color={Colors.primary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.stepperVal}>{claimQty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() =>
                            setClaimQty((prev) =>
                              Math.min(detail.qty_donated, prev + 1)
                            )
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

                  <View style={styles.infoBox}>
                    <Text style={styles.boxHeading}>
                      Food Listing &amp; Expiry Information
                    </Text>
                    <DetailRow
                      icon="qr-code-outline"
                      label="Voucher Reference"
                      value={`DON-${detail.donation_id}`}
                    />
                    <DetailRow
                      icon="cube-outline"
                      label="Batch Quantity"
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
                      Donor Merchant &amp; Contact Information
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
                    <TouchableOpacity
                      style={[styles.acceptBtn, { flex: 0 }]}
                      onPress={() =>
                        promptOfferAction(detail, "accept", claimQty)
                      }
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.acceptBtnText}>
                        Claim {claimQty} {detail.unit_name || "items"} &amp;
                        Generate QR Voucher
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(detail.status === "Ongoing" ||
                    detail.status === "Claimed" ||
                    detail.status === "In-Transit") && (
                    <View style={{ gap: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.acceptBtn,
                          { flex: 0, backgroundColor: Colors.primary },
                        ]}
                        onPress={() => {
                          const target = detail;
                          setDetail(null);
                          setQrVoucherTarget(target);
                        }}
                      >
                        <Ionicons
                          name="qr-code-outline"
                          size={18}
                          color={Colors.white}
                        />
                        <Text style={styles.acceptBtnText}>
                          Show QR Pickup Voucher (DON-{detail.donation_id})
                        </Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                          style={styles.declineBtn}
                          onPress={() =>
                            promptOfferAction(detail, "release_claim")
                          }
                        >
                          <Text style={styles.declineBtnText}>
                            Release Claim to Pool
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => promptOfferAction(detail, "received")}
                        >
                          <Ionicons
                            name="checkmark-done-circle"
                            size={18}
                            color={Colors.white}
                          />
                          <Text style={styles.acceptBtnText}>
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

      {/* OFFICIAL QR DONATION PICKUP VOUCHER MODAL */}
      <Modal
        visible={!!qrVoucherTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVoucherTarget(null)}
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
              <Text style={styles.modalTitle}>Official QR Pickup Voucher</Text>
              <TouchableOpacity onPress={() => setQrVoucherTarget(null)}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            {qrVoucherTarget && (
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
                    {qrVoucherTarget.merchant_name}
                  </Text>{" "}
                  so they can scan and release your donation batch:
                </Text>

                <View style={styles.qrImageWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                        `RESERVE:DON-${qrVoucherTarget.donation_id}`
                      )}`,
                    }}
                    style={{ width: 200, height: 200 }}
                  />
                </View>

                <View style={styles.voucherCodePill}>
                  <Text style={styles.voucherCodePillLabel}>VOUCHER CODE</Text>
                  <Text style={styles.voucherCodePillValue}>
                    DON-{qrVoucherTarget.donation_id}
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: "PoppinsSemiBold",
                    fontSize: 13,
                    color: Colors.primary2,
                    marginTop: 8,
                  }}
                >
                  {qrVoucherTarget.qty_donated}{" "}
                  {qrVoucherTarget.unit_name || "items"} —{" "}
                  {qrVoucherTarget.food_name}
                </Text>
                <Text style={styles.explicitExpiry}>
                  Pickup Before: {qrVoucherTarget.expiry_display}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.acceptBtn,
                    { flex: 0, width: "100%", marginTop: 14 },
                  ]}
                  onPress={() => setQrVoucherTarget(null)}
                >
                  <Text style={styles.acceptBtnText}>Done</Text>
                </TouchableOpacity>
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
    </View>
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
  } else if (
    status === "Declined" ||
    status === "Cancelled" ||
    status === "Flagged"
  ) {
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
  claimStepperCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EFF6F2", borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, padding: 14, marginBottom: 14 },
  stepperBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 8, height: 38, gap: 12 },
  stepperBtn: { padding: 4 },
  stepperVal: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary2, minWidth: 24, textAlign: "center" },
  infoBox: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 14 },
  boxHeading: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2, marginBottom: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 },
  detailIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 10 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  actionPillBtn: { flex: 1, height: 38, borderRadius: 9, backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  actionPillBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.white },
  declineBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", alignItems: "center", justifyContent: "center" },
  declineBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: "#B3261E" },
  acceptBtn: { flex: 1.4, height: 48, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  acceptBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.white },
  qrModalCenter: { flex: 1, backgroundColor: "rgba(18,55,44,0.55)", justifyContent: "center", alignItems: "center", padding: 20 },
  qrVoucherCard: { width: "100%", maxWidth: 360, backgroundColor: Colors.white, borderRadius: 18, padding: 20, alignItems: "center" },
  qrImageWrapper: { padding: 14, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 12 },
  voucherCodePill: { backgroundColor: "#E8EFEA", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  voucherCodePillLabel: { fontFamily: "PoppinsMedium", fontSize: 9, color: Colors.primary1, letterSpacing: 1 },
  voucherCodePillValue: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary },
});