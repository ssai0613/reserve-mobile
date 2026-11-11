import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
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
  EstablishmentBottomNav,
  EstablishmentHeader,
  getAppStorage,
  useIsInsideMerchantShell,
} from "../components/EstablishmentNav";

type AppealLineItem = {
  donation_req_id: number;
  listing_id?: number | null;
  food_name: string;
  food_type: string;
  qty_needed: number;
  qty_available: number;
  unit_name: string;
  image_path?: string | null;
  expiry_date?: string;
  expiry_time?: string;
  expiry_display?: string;
  status: string;
};

type FoodBankAppeal = {
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
  food_bank: number;
  food_bank_name: string;
  food_bank_contact_person: string;
  food_bank_phone: string;
  food_bank_hotline: string;
  food_bank_email: string;
  food_bank_address: string;
  expiry_display: string;
  image_path?: string | null;
  items_breakdown: AppealLineItem[];
};

type ActiveInventoryListing = {
  prod_id: number;
  commerce_id: number;
  name: string;
  category: string;
  qty_available: number;
  unit_name: string;
  price: string;
  expiry_date: string;
  expiry_time: string;
  image: string;
};

type PostedDonation = {
  donation_id: number;
  food_name: string;
  food_type: string;
  qty_donated: number;
  unit_name: string;
  status: string;
  created_at: string;
  expiry_date: string;
  expiry_time: string;
  expiry_display: string;
  image_path?: string | null;
  food_bank_name?: string | null;
  food_bank_contact_person?: string | null;
  food_bank_phone?: string | null;
  food_bank_email?: string | null;
  food_bank_address?: string | null;
};

let cachedDonationHubMemory = {
  appeals: [] as FoodBankAppeal[],
  activeInventory: [] as ActiveInventoryListing[],
  postedDonations: [] as PostedDonation[],
};

export default function DonationHub() {
  const isInsideShell = useIsInsideMerchantShell();
  if (!isInsideShell) return null;

  const [merchantId, setMerchantId] = useState("1");
  const [mainTab, setMainTab] = useState<"Requests" | "Donations">("Requests");
  const [requestFilter, setRequestFilter] = useState<
    "All" | "Pending" | "Ongoing" | "Successful" | "Rejected"
  >("All");
  const [donationSubTab, setDonationSubTab] = useState<
    "Select Inventory" | "Posted Donations"
  >("Select Inventory");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [appeals, setAppeals] = useState<FoodBankAppeal[]>(
    cachedDonationHubMemory.appeals
  );
  const [activeInventory, setActiveInventory] = useState<
    ActiveInventoryListing[]
  >(cachedDonationHubMemory.activeInventory);
  const [postedDonations, setPostedDonations] = useState<PostedDonation[]>(
    cachedDonationHubMemory.postedDonations
  );

  const [selectedInventoryMap, setSelectedInventoryMap] = useState<{
    [commerceId: number]: number;
  }>({});
  const [postingDonations, setPostingDonations] = useState(false);

  const [selectedAppeal, setSelectedAppeal] = useState<FoodBankAppeal | null>(
    null
  );
  const [editableAppealQtys, setEditableAppealQtys] = useState<{
    [reqId: number]: number;
  }>({});
  const [processingAppeal, setProcessingAppeal] = useState(false);

  const [selectedPosted, setSelectedPosted] = useState<PostedDonation | null>(
    null
  );
  const [editPostedQty, setEditPostedQty] = useState("1");

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

  useEffect(() => {
    loadAllDonationData();

    const listSub = DeviceEventEmitter.addListener(
      "merchant_listings_updated",
      () => {
        loadAllDonationData();
      }
    );
    const donSub = DeviceEventEmitter.addListener(
      "merchant_donations_updated",
      () => {
        loadAllDonationData();
      }
    );

    return () => {
      listSub.remove();
      donSub.remove();
    };
  }, []);

  const loadAllDonationData = async () => {
    try {
      const storedId = (await getAppStorage("profile_id")) || "1";
      const storedEmail = (await getAppStorage("user_email")) || "";
      setMerchantId(storedId);

      const [reqRes, estRes, donRes] = await Promise.all([
        api.get(`donations/requests/?merchant=${storedId}`),
        api.get(
          `listings/establishment/?merchant=${storedId}&email=${encodeURIComponent(
            storedEmail
          )}`
        ),
        api.get(`donations/available/?merchant=${storedId}`),
      ]);

      const nextAppeals = Array.isArray(reqRes.data) ? reqRes.data : [];

      const rawListings = estRes.data?.listings || estRes.data || [];
      const activeItems: ActiveInventoryListing[] = rawListings
        .filter(
          (l: any) =>
            (l.status || "Active") === "Active" &&
            Number(l.qty_available ?? l.quantity ?? 0) > 0
        )
        .map((l: any) => ({
          prod_id: Number(l.prod_id || l.id),
          commerce_id: Number(l.commerce_id || l.prod_id || l.id),
          name: l.prod_name || "Surplus Food",
          category: l.category_name || l.category || "Surplus",
          qty_available: Number(l.qty_available ?? l.quantity ?? 0),
          unit_name: l.unit_name || "pcs",
          price: `₱${Number(l.price || 0).toFixed(2)}`,
          expiry_date: l.expiry_date || "Not Set",
          expiry_time: l.expiry_time || "Not Set",
          image:
            l.image_path ||
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
        }));

      const nextPosted = Array.isArray(donRes.data) ? donRes.data : [];

      cachedDonationHubMemory = {
        appeals: nextAppeals,
        activeInventory: activeItems,
        postedDonations: nextPosted,
      };
      setAppeals(nextAppeals);
      setActiveInventory(activeItems);
      setPostedDonations(nextPosted);
    } catch (err) {
      console.log("Donation hub load error:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllDonationData();
    setRefreshing(false);
  };

  const toggleSelectInventoryItem = (item: ActiveInventoryListing) => {
    setSelectedInventoryMap((prev) => {
      const next = { ...prev };
      if (next[item.commerce_id]) {
        delete next[item.commerce_id];
      } else {
        next[item.commerce_id] = item.qty_available;
      }
      return next;
    });
  };

  const adjustInventoryDonateQty = (
    item: ActiveInventoryListing,
    delta: number
  ) => {
    setSelectedInventoryMap((prev) => {
      const current = prev[item.commerce_id] || 1;
      const nextQty = Math.max(
        1,
        Math.min(item.qty_available, current + delta)
      );
      return { ...prev, [item.commerce_id]: nextQty };
    });
  };

  const handlePostSelectedDonations = () => {
    const selectedIds = Object.keys(selectedInventoryMap).map(Number);
    if (selectedIds.length === 0) {
      showModal(
        "No Listings Selected",
        "Please tap one or more active listings and set the quantity you wish to donate.",
        "warning"
      );
      return;
    }

    const itemsPayload = selectedIds.map((cid) => ({
      commerce_id: cid,
      qty_donated: selectedInventoryMap[cid],
    }));

    setConfirmState({
      visible: true,
      title: "Post Surplus Donations?",
      message: `Publish ${selectedIds.length} selected listing(s) to the Food Bank donation feed? Food Banks within 10km will be able to appeal and accept them.`,
      confirmText: "Yes, Post Donations",
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, visible: false }));
        setPostingDonations(true);
        try {
          const res = await api.post("donations/available/", {
            merchant: Number(merchantId),
            items: itemsPayload,
          });
          setSelectedInventoryMap({});
          await loadAllDonationData();
          DeviceEventEmitter.emit("merchant_donations_updated");
          DeviceEventEmitter.emit("merchant_listings_updated");
          setDonationSubTab("Posted Donations");
          showModal(
            "Donations Published!",
            res.data?.message ||
              "Your surplus listings are now live on the Food Bank portal.",
            "success"
          );
        } catch (e: any) {
          showModal(
            "Post Failed",
            e.response?.data?.error || "Could not post donations.",
            "error"
          );
        } finally {
          setPostingDonations(false);
        }
      },
    });
  };

  const openAppealReviewModal = (appeal: FoodBankAppeal) => {
    setSelectedAppeal(appeal);
    const initialMap: { [reqId: number]: number } = {};
    if (
      Array.isArray(appeal.items_breakdown) &&
      appeal.items_breakdown.length > 0
    ) {
      appeal.items_breakdown.forEach((line) => {
        initialMap[line.donation_req_id] = Number(line.qty_needed || 1);
      });
    } else {
      initialMap[appeal.donation_req_id] = Number(appeal.qty_needed || 1);
    }
    setEditableAppealQtys(initialMap);
  };

  const changeAppealLineQty = (
    reqId: number,
    maxAvail: number,
    delta: number
  ) => {
    setEditableAppealQtys((prev) => {
      const cur = prev[reqId] || 1;
      const cap = maxAvail > 0 ? maxAvail : 999;
      return { ...prev, [reqId]: Math.max(1, Math.min(cap, cur + delta)) };
    });
  };

  const handleAppealDecision = (
    action: "approve" | "reject" | "complete"
  ) => {
    if (!selectedAppeal) return;

    const titles = {
      approve: "Approve Food Bank Request?",
      reject: "Reject Food Bank Request?",
      complete: "Mark Handshake as Successful?",
    };
    const messages = {
      approve: `Approve request ${selectedAppeal.batch_code} for ${selectedAppeal.food_bank_name} with the quantities set above? Status will move to Ongoing.`,
      reject: `Decline request ${selectedAppeal.batch_code} from ${selectedAppeal.food_bank_name}?`,
      complete: `Confirm that the food items for ${selectedAppeal.batch_code} have been handed over to ${selectedAppeal.food_bank_name}? Status will reflect as Successful.`,
    };

    const targetAppeal = selectedAppeal;
    const itemsPayload = Object.keys(editableAppealQtys).map((k) => ({
      donation_req_id: Number(k),
      qty_approved: editableAppealQtys[Number(k)],
    }));

    setConfirmState({
      visible: true,
      title: titles[action],
      message: messages[action],
      confirmText:
        action === "approve"
          ? "Approve (Ongoing)"
          : action === "reject"
          ? "Yes, Reject"
          : "Mark Successful",
      isDestructive: action === "reject",
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, visible: false }));
        setProcessingAppeal(true);
        try {
          const res = await api.patch("donations/requests/", {
            donation_req_id: targetAppeal.donation_req_id,
            batch_code: targetAppeal.batch_code,
            merchant: Number(merchantId),
            action,
            items: itemsPayload,
          });
          setSelectedAppeal(null);
          await loadAllDonationData();
          DeviceEventEmitter.emit("merchant_donations_updated");
          DeviceEventEmitter.emit("merchant_listings_updated");
          showModal(
            "Request Updated",
            res.data?.message || `Request status updated!`,
            "success"
          );
        } catch (err: any) {
          showModal(
            "Action Failed",
            err.response?.data?.error || "Could not update request.",
            "error"
          );
        } finally {
          setProcessingAppeal(false);
        }
      },
    });
  };

  const handlePostedDonationAction = (
    donation: PostedDonation,
    action: "update_qty" | "cancel" | "complete"
  ) => {
    setConfirmState({
      visible: true,
      title:
        action === "cancel"
          ? "Cancel Posted Donation?"
          : action === "complete"
          ? "Mark Donation as Successful?"
          : "Update Donation Quantity?",
      message:
        action === "cancel"
          ? `Remove ${donation.food_name} from posted donations and return ${donation.qty_donated} ${donation.unit_name} to active inventory?`
          : action === "complete"
          ? `Confirm that ${
              donation.food_bank_name || "the Food Bank"
            } has received ${donation.qty_donated} ${donation.unit_name} of ${
              donation.food_name
            }?`
          : `Update donated quantity of ${donation.food_name} to ${editPostedQty}?`,
      confirmText: "Confirm",
      isDestructive: action === "cancel",
      onConfirm: async () => {
        setConfirmState((p) => ({ ...p, visible: false }));
        try {
          await api.patch(`donations/respond/${donation.donation_id}/`, {
            action,
            qty_donated: Number(editPostedQty || donation.qty_donated),
          });
          setSelectedPosted(null);
          await loadAllDonationData();
          DeviceEventEmitter.emit("merchant_donations_updated");
          DeviceEventEmitter.emit("merchant_listings_updated");
          showModal(
            "Donation Updated",
            action === "complete"
              ? "Donation handoff marked as Successful!"
              : action === "cancel"
              ? "Donation cancelled and stock restored."
              : "Donation quantity updated.",
            "success"
          );
        } catch (e: any) {
          showModal("Error", "Could not update posted donation.", "error");
        }
      },
    });
  };

  const filteredAppeals = appeals.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (a.food_bank_name || "").toLowerCase().includes(q) ||
      (a.food_type || "").toLowerCase().includes(q) ||
      (a.batch_code || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (requestFilter === "All") return true;
    if (requestFilter === "Pending")
      return a.status === "Pending" || a.status === "Active";
    if (requestFilter === "Ongoing") return a.status === "Ongoing";
    if (requestFilter === "Successful")
      return a.status === "Successful" || a.status === "Fulfilled";
    if (requestFilter === "Rejected")
      return (
        a.status === "Rejected" ||
        a.status === "Withdrawn" ||
        a.status === "Cancelled"
      );
    return true;
  });

  const filteredPostedDonations = postedDonations.filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (d.food_name || "").toLowerCase().includes(q) ||
      (d.food_bank_name || "").toLowerCase().includes(q)
    );
  });

  const selectedCount = Object.keys(selectedInventoryMap).length;

  return (
    <View style={styles.container}>
      <EstablishmentHeader />

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
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Donation & Request Hub</Text>
          <Text style={styles.pageSubtitle}>
            Review Food Bank appeals with editable quantities or donate active surplus listings
          </Text>
        </View>

        <View style={styles.primaryTabsRow}>
          <TouchableOpacity
            style={[
              styles.primaryTabBtn,
              mainTab === "Requests" && styles.primaryTabBtnActive,
            ]}
            activeOpacity={0.85}
            onPress={() => setMainTab("Requests")}
          >
            <Ionicons
              name="megaphone-outline"
              size={17}
              color={mainTab === "Requests" ? Colors.white : Colors.primary2}
            />
            <Text
              style={[
                styles.primaryTabText,
                mainTab === "Requests" && styles.primaryTabTextActive,
              ]}
            >
              Requests ({appeals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryTabBtn,
              mainTab === "Donations" && styles.primaryTabBtnActive,
            ]}
            activeOpacity={0.85}
            onPress={() => setMainTab("Donations")}
          >
            <Ionicons
              name="gift-outline"
              size={17}
              color={mainTab === "Donations" ? Colors.white : Colors.primary2}
            />
            <Text
              style={[
                styles.primaryTabText,
                mainTab === "Donations" && styles.primaryTabTextActive,
              ]}
            >
              Donations ({postedDonations.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              mainTab === "Requests"
                ? "Search Food Bank name, request ID, or food item..."
                : "Search active listings or posted donations..."
            }
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {mainTab === "Requests" ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 14 }}
            >
              {(
                [
                  "All",
                  "Pending",
                  "Ongoing",
                  "Successful",
                  "Rejected",
                ] as const
              ).map((f) => {
                const active = requestFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    onPress={() => setRequestFilter(f)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {filteredAppeals.length > 0 ? (
              filteredAppeals.map((req) => {
                const itemCount = Array.isArray(req.items_breakdown)
                  ? req.items_breakdown.length
                  : 1;
                return (
                  <TouchableOpacity
                    key={req.batch_code || req.donation_req_id}
                    style={styles.uiCard}
                    activeOpacity={0.85}
                    onPress={() => openAppealReviewModal(req)}
                  >
                    <View style={styles.uiCardTop}>
                      {req.image_path ? (
                        <Image
                          source={{ uri: req.image_path }}
                          style={styles.uiImage}
                        />
                      ) : (
                        <View
                          style={[styles.uiImage, styles.uiImagePlaceholder]}
                        >
                          <Ionicons
                            name="people-outline"
                            size={28}
                            color={Colors.primary}
                          />
                        </View>
                      )}

                      <View style={styles.uiCardDetails}>
                        <View style={styles.uiCardHeaderRow}>
                          <Text style={styles.uiCardTitle} numberOfLines={1}>
                            {req.food_bank_name}
                          </Text>
                          <StatusPill status={req.status} />
                        </View>

                        <Text style={styles.uiCardSubtitle} numberOfLines={2}>
                          {req.batch_code} • {req.food_type}
                        </Text>

                        <Text style={styles.explicitExpiry}>
                          Exp: {req.expiry_display || "Standard Window"}
                        </Text>

                        {req.reason ? (
                          <Text
                            style={{
                              fontFamily: "PoppinsRegular",
                              fontSize: 10.5,
                              color: Colors.primary1,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            Reason: "{req.reason}"
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.uiCardActions}>
                      <TouchableOpacity
                        style={styles.uiActionBtn}
                        onPress={() => openAppealReviewModal(req)}
                      >
                        <Ionicons
                          name="eye-outline"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text
                          style={[
                            styles.uiActionBtnText,
                            {
                              color: Colors.primary,
                              fontFamily: "PoppinsSemiBold",
                            },
                          ]}
                        >
                          {req.status === "Pending" || req.status === "Active"
                            ? `Review & Edit Qty (${itemCount} item${
                                itemCount > 1 ? "s" : ""
                              })`
                            : req.status === "Ongoing"
                            ? "View Contact / Mark Successful"
                            : "View Request Summary"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="megaphone-outline"
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  No Food Bank requests found
                </Text>
                <Text style={styles.emptyDescription}>
                  When Food Banks within 10km request items from your store,
                  they will appear here.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.subTabsBar}>
              {(["Select Inventory", "Posted Donations"] as const).map((st) => {
                const active = donationSubTab === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                    onPress={() => setDonationSubTab(st)}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        active && styles.subTabTextActive,
                      ]}
                    >
                      {st === "Select Inventory"
                        ? `Select Active Listings (${activeInventory.length})`
                        : `Posted Donations (${postedDonations.length})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {donationSubTab === "Select Inventory" ? (
              <>
                <View style={styles.helperBanner}>
                  <Ionicons
                    name="checkbox-outline"
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.helperBannerText}>
                    Tap multiple active listings below and adjust the quantity
                    you want to donate, then tap "Post Selected Donations" at
                    the bottom.
                  </Text>
                </View>

                {activeInventory.length > 0 ? (
                  activeInventory.map((item) => {
                    const isSelected =
                      selectedInventoryMap[item.commerce_id] !== undefined;
                    const chosenQty =
                      selectedInventoryMap[item.commerce_id] ||
                      item.qty_available;

                    return (
                      <View
                        key={item.commerce_id}
                        style={[
                          styles.uiCard,
                          isSelected && {
                            borderColor: Colors.primary,
                            borderWidth: 1.5,
                            backgroundColor: "#F7FBF8",
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.uiCardTop}
                          activeOpacity={0.85}
                          onPress={() => toggleSelectInventoryItem(item)}
                        >
                          <View
                            style={[
                              styles.checkboxSquare,
                              isSelected && styles.checkboxSquareActive,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={15}
                                color={Colors.white}
                              />
                            )}
                          </View>

                          <Image
                            source={{ uri: item.image }}
                            style={styles.uiImage}
                          />

                          <View style={styles.uiCardDetails}>
                            <Text style={styles.uiCardTitle} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.uiCardSubtitle}>
                              {item.category} • Stock: {item.qty_available}{" "}
                              {item.unit_name}
                            </Text>
                            <Text style={styles.explicitExpiry}>
                              Exp: {item.expiry_date} • {item.expiry_time}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {isSelected && (
                          <View style={styles.qtySelectFooter}>
                            <Text
                              style={{
                                fontFamily: "PoppinsSemiBold",
                                fontSize: 11.5,
                                color: Colors.primary2,
                              }}
                            >
                              Quantity to Donate (Max {item.qty_available}):
                            </Text>
                            <View style={styles.stepperContainer}>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() =>
                                  adjustInventoryDonateQty(item, -1)
                                }
                              >
                                <Ionicons
                                  name="remove"
                                  size={16}
                                  color={Colors.primary}
                                />
                              </TouchableOpacity>
                              <Text style={styles.stepperValue}>
                                {chosenQty}
                              </Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() =>
                                  adjustInventoryDonateQty(item, 1)
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
                      No active listings available
                    </Text>
                    <Text style={styles.emptyDescription}>
                      Add surplus food in the Listings tab first to donate them
                      to Food Banks.
                    </Text>
                  </View>
                )}

                {selectedCount > 0 && (
                  <TouchableOpacity
                    style={styles.postBatchBtn}
                    activeOpacity={0.85}
                    onPress={handlePostSelectedDonations}
                    disabled={postingDonations}
                  >
                    <Ionicons
                      name="gift-outline"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.postBatchBtnText}>
                      {postingDonations
                        ? "POSTING DONATIONS..."
                        : `Post ${selectedCount} Selected Donation${
                            selectedCount > 1 ? "s" : ""
                          } to Food Banks`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {filteredPostedDonations.length > 0 ? (
                  filteredPostedDonations.map((don) => (
                    <TouchableOpacity
                      key={don.donation_id}
                      style={styles.uiCard}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedPosted(don);
                        setEditPostedQty(String(don.qty_donated));
                      }}
                    >
                      <View style={styles.uiCardTop}>
                        <Image
                          source={{
                            uri:
                              don.image_path ||
                              "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
                          }}
                          style={styles.uiImage}
                        />
                        <View style={styles.uiCardDetails}>
                          <View style={styles.uiCardHeaderRow}>
                            <Text style={styles.uiCardTitle} numberOfLines={1}>
                              {don.food_name}
                            </Text>
                            <StatusPill status={don.status} />
                          </View>
                          <Text style={styles.uiCardSubtitle}>
                            {don.qty_donated} {don.unit_name} • {don.food_type}
                          </Text>
                          <Text style={styles.explicitExpiry}>
                            Exp: {don.expiry_display}
                          </Text>
                          {don.food_bank_name && (
                            <Text
                              style={{
                                fontFamily: "PoppinsSemiBold",
                                fontSize: 10.5,
                                color: Colors.primary,
                                marginTop: 2,
                              }}
                            >
                              Claimed by: {don.food_bank_name}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.uiCardActions}>
                        <TouchableOpacity
                          style={styles.uiActionBtn}
                          onPress={() => {
                            setSelectedPosted(don);
                            setEditPostedQty(String(don.qty_donated));
                          }}
                        >
                          <Ionicons
                            name="eye-outline"
                            size={16}
                            color={Colors.primary}
                          />
                          <Text
                            style={[
                              styles.uiActionBtnText,
                              {
                                color: Colors.primary,
                                fontFamily: "PoppinsSemiBold",
                              },
                            ]}
                          >
                            View Details & Manage
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>
                      No posted donations yet
                    </Text>
                    <Text style={styles.emptyDescription}>
                      Select items under "Select Active Listings" to post
                      donations.
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <EstablishmentBottomNav activeTab="Donation" />

      {/* MODAL 1: FOOD BANK APPEAL REVIEW + CONTACT + EDITABLE QTY */}
      <Modal
        visible={!!selectedAppeal}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAppeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedAppeal && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      Appeal {selectedAppeal.batch_code}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      From {selectedAppeal.food_bank_name} • Status:{" "}
                      {selectedAppeal.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedAppeal(null)}
                  >
                    <Ionicons name="close" size={20} color={Colors.primary2} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                >
                  <View style={styles.contactCard}>
                    <Text style={styles.sectionBlockTitle}>
                      Food Bank Partner & Contact Information
                    </Text>
                    <DetailRow
                      icon="business-outline"
                      label="Organization Name"
                      value={selectedAppeal.food_bank_name}
                    />
                    <DetailRow
                      icon="person-outline"
                      label="Coordinator / Contact Person"
                      value={selectedAppeal.food_bank_contact_person}
                    />
                    <DetailRow
                      icon="call-outline"
                      label="Mobile / Contact Number"
                      value={`${selectedAppeal.food_bank_phone} (Hotline: ${selectedAppeal.food_bank_hotline})`}
                    />
                    <DetailRow
                      icon="mail-outline"
                      label="Official Email"
                      value={
                        selectedAppeal.food_bank_email || "Verified Partner"
                      }
                    />
                    <DetailRow
                      icon="location-outline"
                      label="Organization Address"
                      value={selectedAppeal.food_bank_address}
                    />

                    {/\d/.test(selectedAppeal.food_bank_phone || "") && (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          marginTop: 8,
                        }}
                      >
                        <TouchableOpacity
                          style={styles.callSmsBtn}
                          onPress={() =>
                            Linking.openURL(
                              `tel:${selectedAppeal.food_bank_phone.replace(
                                /\s/g,
                                ""
                              )}`
                            )
                          }
                        >
                          <Ionicons
                            name="call"
                            size={15}
                            color={Colors.white}
                          />
                          <Text style={styles.callSmsBtnText}>
                            Call Food Bank
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.callSmsBtn,
                            { backgroundColor: Colors.primary2 },
                          ]}
                          onPress={() =>
                            Linking.openURL(
                              `sms:${selectedAppeal.food_bank_phone.replace(
                                /\s/g,
                                ""
                              )}`
                            )
                          }
                        >
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={15}
                            color={Colors.white}
                          />
                          <Text style={styles.callSmsBtnText}>
                            Send Text (SMS)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View style={styles.contactCard}>
                    <Text style={styles.sectionBlockTitle}>
                      Appeal Reason & Additional Notes
                    </Text>
                    <Text style={styles.reasonLabel}>Reason for Request:</Text>
                    <Text style={styles.reasonValue}>
                      {selectedAppeal.reason ||
                        "Community food rescue distribution"}
                    </Text>
                    {selectedAppeal.additional_info ? (
                      <>
                        <Text style={[styles.reasonLabel, { marginTop: 8 }]}>
                          Additional Pickup / Logistics Info:
                        </Text>
                        <Text style={styles.reasonValue}>
                          {selectedAppeal.additional_info}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  <View style={styles.contactCard}>
                    <Text style={styles.sectionBlockTitle}>
                      Requested Items & Editable Donation Quantity
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsRegular",
                        fontSize: 10.5,
                        color: Colors.primary1,
                        marginBottom: 10,
                      }}
                    >
                      Adjust the quantity below based on how much you can donate
                      before approving:
                    </Text>

                    {(Array.isArray(selectedAppeal.items_breakdown) &&
                    selectedAppeal.items_breakdown.length > 0
                      ? selectedAppeal.items_breakdown
                      : [
                          {
                            donation_req_id: selectedAppeal.donation_req_id,
                            food_name: selectedAppeal.food_name,
                            food_type: selectedAppeal.food_type,
                            qty_needed: selectedAppeal.qty_needed,
                            qty_available: selectedAppeal.qty_needed,
                            unit_name: selectedAppeal.unit_name,
                            expiry_display: selectedAppeal.expiry_display,
                            status: selectedAppeal.status,
                          },
                        ]
                    ).map((line) => {
                      const canEdit =
                        selectedAppeal.status === "Pending" ||
                        selectedAppeal.status === "Active";
                      const curQty =
                        editableAppealQtys[line.donation_req_id] ??
                        line.qty_needed;

                      return (
                        <View
                          key={line.donation_req_id}
                          style={styles.lineItemRow}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.lineItemTitle}>
                              {line.food_name}
                            </Text>
                            <Text style={styles.lineItemMeta}>
                              Requested: {line.qty_needed} {line.unit_name} •
                              Stock: {line.qty_available}
                            </Text>
                            <Text style={styles.explicitExpiry}>
                              Exp: {line.expiry_display || "Standard Window"}
                            </Text>
                          </View>

                          {canEdit ? (
                            <View style={styles.stepperContainer}>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() =>
                                  changeAppealLineQty(
                                    line.donation_req_id,
                                    line.qty_available,
                                    -1
                                  )
                                }
                              >
                                <Ionicons
                                  name="remove"
                                  size={16}
                                  color={Colors.primary}
                                />
                              </TouchableOpacity>
                              <Text style={styles.stepperValue}>{curQty}</Text>
                              <TouchableOpacity
                                style={styles.stepperBtn}
                                onPress={() =>
                                  changeAppealLineQty(
                                    line.donation_req_id,
                                    line.qty_available,
                                    1
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
                          ) : (
                            <Text style={styles.approvedQtyBadge}>
                              {line.qty_needed} {line.unit_name}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {(selectedAppeal.status === "Pending" ||
                    selectedAppeal.status === "Active") && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={styles.rejectActionBtn}
                        onPress={() => handleAppealDecision("reject")}
                        disabled={processingAppeal}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={17}
                          color="#B3261E"
                        />
                        <Text style={styles.rejectActionBtnText}>
                          Reject Request
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveActionBtn}
                        onPress={() => handleAppealDecision("approve")}
                        disabled={processingAppeal}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color={Colors.white}
                        />
                        <Text style={styles.approveActionBtnText}>
                          Approve Request
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedAppeal.status === "Ongoing" && (
                    <TouchableOpacity
                      style={[styles.approveActionBtn, { flex: 0 }]}
                      onPress={() => handleAppealDecision("complete")}
                      disabled={processingAppeal}
                    >
                      <Ionicons
                        name="checkmark-done-circle"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.approveActionBtnText}>
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

      {/* MODAL 2: VIEW / MANAGE POSTED DONATION */}
      <Modal
        visible={!!selectedPosted}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPosted(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedPosted && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {selectedPosted.food_name}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      Posted Donation • Status: {selectedPosted.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedPosted(null)}
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
                        selectedPosted.image_path ||
                        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
                    }}
                    style={styles.viewImage}
                  />

                  <View style={styles.contactCard}>
                    <DetailRow
                      icon="cube-outline"
                      label="Quantity Donated"
                      value={`${selectedPosted.qty_donated} ${selectedPosted.unit_name}`}
                    />
                    <DetailRow
                      icon="alarm-outline"
                      label="Expiry Date & Time"
                      value={selectedPosted.expiry_display}
                    />
                    {selectedPosted.food_bank_name && (
                      <>
                        <DetailRow
                          icon="business-outline"
                          label="Accepted by Food Bank"
                          value={selectedPosted.food_bank_name}
                        />
                        <DetailRow
                          icon="call-outline"
                          label="Food Bank Contact"
                          value={`${
                            selectedPosted.food_bank_contact_person || ""
                          } • ${selectedPosted.food_bank_phone || ""}`}
                        />
                      </>
                    )}
                  </View>

                  {selectedPosted.status === "Available" && (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={styles.rejectActionBtn}
                        onPress={() =>
                          handlePostedDonationAction(selectedPosted, "cancel")
                        }
                      >
                        <Text style={styles.rejectActionBtnText}>
                          Cancel Donation
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {(selectedPosted.status === "Ongoing" ||
                    selectedPosted.status === "Claimed") && (
                    <TouchableOpacity
                      style={[styles.approveActionBtn, { flex: 0 }]}
                      onPress={() =>
                        handlePostedDonationAction(selectedPosted, "complete")
                      }
                    >
                      <Ionicons
                        name="checkmark-done-circle"
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.approveActionBtnText}>
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
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  let bg = "#E4F0E8";
  let fg = "#1F6B52";
  let label = status || "Available";

  if (status === "Pending" || status === "Active") {
    bg = "#FEF3C7";
    fg = "#B45309";
    label = "Pending";
  } else if (status === "Ongoing" || status === "Claimed") {
    bg = "#E1EEF8";
    fg = "#2C5F8A";
    label = "Ongoing";
  } else if (
    status === "Successful" ||
    status === "Fulfilled" ||
    status === "Completed"
  ) {
    bg = "#E4F0E8";
    fg = "#1F6B52";
    label = "Successful";
  } else if (
    status === "Rejected" ||
    status === "Withdrawn" ||
    status === "Cancelled"
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
        <Ionicons name={icon} size={16} color={Colors.primary} />
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
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 28 },
  pageHeader: { marginBottom: 14 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2 },
  primaryTabsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  primaryTabBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  primaryTabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  primaryTabText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  primaryTabTextActive: { color: Colors.white },
  searchContainer: { minHeight: 44, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.button, borderColor: Colors.button },
  filterChipText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2 },
  filterChipTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.white },
  subTabsBar: { flexDirection: "row", backgroundColor: "#EBEFEB", borderRadius: 12, padding: 4, marginBottom: 12 },
  subTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  subTabBtnActive: { backgroundColor: Colors.white },
  subTabText: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary1 },
  subTabTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  helperBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E8EFEA", padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  helperBannerText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary2, lineHeight: 16 },
  uiCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  uiCardTop: { flexDirection: "row", padding: 12, gap: 12, alignItems: "center" },
  checkboxSquare: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  checkboxSquareActive: { backgroundColor: Colors.primary },
  uiImage: { width: 76, height: 76, borderRadius: 10, backgroundColor: Colors.input },
  uiImagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EFE9" },
  uiCardDetails: { flex: 1 },
  uiCardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  uiCardTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  uiCardSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2 },
  explicitExpiry: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: "#A94A3A", marginTop: 3 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusPillText: { fontFamily: "PoppinsSemiBold", fontSize: 10 },
  uiCardActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, padding: 10, justifyContent: "flex-end" },
  uiActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  uiActionBtnText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  qtySelectFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: "#EFF6F2" },
  stepperContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 6, height: 34, gap: 10 },
  stepperBtn: { padding: 4 },
  stepperValue: { fontFamily: "PoppinsBold", fontSize: 13, color: Colors.primary2, minWidth: 22, textAlign: "center" },
  postBatchBtn: { height: 50, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  postBatchBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.white },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 38, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, textAlign: "center", marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.5)", justifyContent: "flex-end" },
  modalSheet: { width: "100%", maxHeight: "92%", backgroundColor: Colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  modalHeader: { paddingHorizontal: 18, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  modalSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  contactCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 14 },
  sectionBlockTitle: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2, marginBottom: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 10 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary2 },
  callSmsBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: Colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  callSmsBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.white },
  reasonLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary1 },
  reasonValue: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginTop: 2, backgroundColor: Colors.input, padding: 10, borderRadius: 8 },
  lineItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  lineItemTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  lineItemMeta: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  approvedQtyBadge: { fontFamily: "PoppinsBold", fontSize: 13, color: Colors.primary },
  rejectActionBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  rejectActionBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: "#B3261E" },
  approveActionBtn: { flex: 1.3, height: 48, borderRadius: 12, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  approveActionBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.white },
  viewImage: { width: "100%", height: 190, borderRadius: 12, backgroundColor: Colors.input, marginBottom: 14 },
});