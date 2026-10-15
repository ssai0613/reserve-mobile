import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";
import {
  ConfirmModal,
  Countdown,
  EmptyState,
  ErrorBanner,
  FilterChips,
  Toast,
} from "@/constants/FoodBankUI";
import { api } from "../../../services/api";

export type DonationOffer = {
  donation_id: number;
  food_name: string;
  food_type: string;
  qty_donated: number;
  unit_name?: string;
  status: string;
  expires_at?: string;
  created_at: string;
  merchant_name: string;
  merchant_address: string;
  merchant_contact: string;
  merchant_contact_name?: string;
  image_path?: string | null;
  is_ttt?: boolean;
  food_bank?: number | null;
};

const foodIcon = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("bakery") || t.includes("bread")) return "basket-outline";
  if (t.includes("produce") || t.includes("veg")) return "leaf-outline";
  return "restaurant-outline";
};

const formatQty = (qty: number, unit?: string) => `${qty} ${unit || "items"}`;

const imageUri = (path?: string | null) => (path ? path : null);

const secondsLeft = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const diff = Math.floor((new Date(expiresAt).getTime() - new Date().getTime()) / 1000);
  return Math.max(0, diff);
};

const timeAgo = (dateStr: string) => {
  if (!dateStr) return "Recently";
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return "Recently";

  const now = new Date().getTime();
  const diffMs = now - dateObj.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  // If under 24 hours, show relative hours/minutes
  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${Math.max(1, diffMins)}m ago`;
  }
  if (diffHrs < 24) {
    return `${diffHrs} hrs ago`;
  }

  // If 24 hours or older, format full date and relative days ago
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  return `${formattedDate} (${diffDays}d ago)`;
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

type Tab = "available" | "progress" | "history";
type Action = "accept" | "decline" | "received";

const TABS: { key: Tab; label: string }[] = [
  { key: "available", label: "Available" },
  { key: "progress", label: "In progress" },
  { key: "history", label: "History" },
];

const tabOf = (status: string): Tab => {
  if (status === "Active") return "available";
  if (status === "Claimed" || status === "In-Transit") return "progress";
  return "history";
};

const STATUS_STYLES: Record<string, { fg: string; bg: string; label: string }> = {
  Active: { fg: "#1F6B52", bg: "#E4F0E8", label: "Available" },
  Claimed: { fg: "#2C5F8A", bg: "#E1EEF8", label: "Accepted" },
  "In-Transit": { fg: "#8A5A00", bg: "#FCEFD9", label: "On the way" },
  Completed: { fg: "#4F695D", bg: "#EEF1EE", label: "Received" },
  Declined: { fg: "#8C6D1F", bg: "#F6EED9", label: "Declined" },
};

const CONFIRM_COPY: Record<Action, { title: string; confirm: string; destructive?: boolean }> = {
  accept: { title: "Accept this donation?", confirm: "Yes, accept" },
  decline: { title: "Decline this donation?", confirm: "Yes, decline", destructive: true },
  received: { title: "Mark as received?", confirm: "Yes, received" },
};

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function FoodBankDonationsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const [offers, setOffers] = useState<DonationOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [tab, setTab] = useState<Tab>("available");
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");

  /* =====================================================
            SORT & FILTER STATES
  ===================================================== */
  const [dateFilterMode, setDateFilterMode] = useState<"All" | "Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("All");
  const [showMainDatePicker, setShowMainDatePicker] = useState(false);
  const [customMainDate, setCustomMainDate] = useState(new Date());

  const [sortMode, setSortMode] = useState<"A-Z" | "Date Posted">("Date Posted");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [detail, setDetail] = useState<DonationOffer | null>(null);
  const [pending, setPending] = useState<{ offer: DonationOffer; action: Action } | null>(null);
  const [working, setWorking] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  /* ---------- data ---------- */

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get<DonationOffer[]>("/donations/available/");
      setOffers(res.data);
      setLoadError("");
    } catch (e: any) {
      setLoadError(e.message || "Failed to load available donations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /* ---------- sorting handler ---------- */
  const handleSortSelection = (mode: "A-Z" | "Date Posted") => {
    if (sortMode === mode) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortMode(mode);
      setSortDirection("asc");
    }
    setSortDropdownOpen(false);
  };

  /* ---------- filtering logic ---------- */
  const filterByDateRange = (item: DonationOffer) => {
    if (dateFilterMode === "All") return true;

    const dateStr = item.created_at;
    if (!dateStr) return false;

    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;

    const now = new Date();
    const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dateFilterMode === "Today") {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    } else if (dateFilterMode === "Last 7 Days") {
      return diffDays >= 0 && diffDays <= 7;
    } else if (dateFilterMode === "Last 30 Days") {
      return diffDays >= 0 && diffDays <= 30;
    } else if (dateFilterMode === "Custom") {
      return (
        itemDate.getFullYear() === customMainDate.getFullYear() &&
        itemDate.getMonth() === customMainDate.getMonth() &&
        itemDate.getDate() === customMainDate.getDate()
      );
    }
    return true;
  };

  /* ---------- filtering ---------- */

  const inTab = useMemo(
    () => offers.filter((o) => tabOf(o.status) === tab && !hiddenIds.includes(o.donation_id) && filterByDateRange(o)),
    [offers, tab, hiddenIds, dateFilterMode, customMainDate]
  );

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { available: 0, progress: 0, history: 0 };
    offers.forEach((o) => {
      if (hiddenIds.includes(o.donation_id)) return;
      if (o.status === "Active" && secondsLeft(o.expires_at) === 0) return;
      if (!filterByDateRange(o)) return;
      counts[tabOf(o.status)] += 1;
    });
    return counts;
  }, [offers, hiddenIds, dateFilterMode, customMainDate]);

  const chipOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    inTab.forEach((o) => (counts[o.food_type] = (counts[o.food_type] || 0) + 1));
    return [
      { label: "All", count: inTab.length },
      ...Object.keys(counts)
        .sort()
        .map((name) => ({ label: name, count: counts[name] })),
    ];
  }, [inTab]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = inTab.filter((o) => {
      const matchesType = selectedType === "All" || o.food_type === selectedType;
      const matchesSearch =
        !q ||
        o.food_name.toLowerCase().includes(q) ||
        o.merchant_name.toLowerCase().includes(q) ||
        o.food_type.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });

    return [...list].sort((a, b) => {
      if (sortMode === "A-Z") {
        const comp = a.food_name.localeCompare(b.food_name);
        return sortDirection === "asc" ? comp : -comp;
      } else {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        if (tab === "available" && sortMode === "Date Posted" && sortDirection === "desc") {
          const sA = secondsLeft(a.expires_at);
          const sB = secondsLeft(b.expires_at);
          if (sA !== null && sB !== null) return sA - sB;
        }
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
    });
  }, [inTab, selectedType, search, tab, sortMode, sortDirection]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setSelectedType("All");
  };

  /* ---------- actions ---------- */

  const runAction = async () => {
    if (!pending) return;
    const { offer, action } = pending;

    if (action === "decline" && offer.food_bank === null) {
      setHiddenIds((prev) => [...prev, offer.donation_id]);
      setPending(null);
      setDetail(null);
      showToast("Offer removed from your list.");
      return;
    }

    setWorking(true);
    try {
      await api.patch(`/donations/respond/${offer.donation_id}/`, { action });
      setPending(null);
      setDetail(null);
      await load();
      showToast(
        action === "accept"
          ? "Donation accepted! Head to the merchant to pick it up."
          : action === "received"
          ? "Marked as received. Thank you!"
          : "Donation declined."
      );
    } catch (e: any) {
      setPending(null);
      setDetail(null);
      setLoadError(e.message);
      load();
    } finally {
      setWorking(false);
    }
  };

  const emptyCopy: Record<Tab, { icon: any; title: string; message: string }> = {
    available: {
      icon: "gift-outline",
      title: "No donations available right now",
      message: "New surplus from merchants shows up here. Pull down to refresh.",
    },
    progress: {
      icon: "bag-check-outline",
      title: "Nothing in progress",
      message: "Donations you accept will appear here until you receive them.",
    },
    history: {
      icon: "time-outline",
      title: "No history yet",
      message: "Donations you've received or declined will be listed here.",
    },
  };

  //notifcations
  const [unreadCount, setUnreadCount] = useState(0);
  /* ---------- render ---------- */

  return (
    <SafeAreaView style={styles.container}>
      {/* EXACT ESTABLISHMENT HEADER STYLE */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Food Bank Portal</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={() => router.push("/foodbank/activity")}>
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/foodbank/profile")}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.top, isTablet && styles.padTablet]}>
        <View>
          <Text style={styles.pageTitle}>Donation Offers</Text>
          <Text style={styles.pageSubtitle}>
            Surplus food from merchants. Claim it before the timer runs out.
          </Text>
        </View>

        {/* SORT & FILTER ROW PLACED HERE ABOVE TABS */}
        <View style={{ flexDirection: "row", gap: 8, zIndex: 30, position: "relative" }}>
          
          {/* SORT DROPDOWN */}
          <View style={{ flex: 1, position: "relative" }}>
            <TouchableOpacity 
              style={styles.filterDropdownBtn} 
              activeOpacity={0.7}
              onPress={() => { setSortDropdownOpen(!sortDropdownOpen); setDateDropdownOpen(false); }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                <Ionicons name="swap-vertical-outline" size={15} color={Colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  Sort: {sortMode} {sortDirection === "asc" ? "↑" : "↓"}
                </Text>
              </View>
              <Ionicons name={sortDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color={Colors.icon} />
            </TouchableOpacity>

            {sortDropdownOpen && (
              <View style={styles.floatingDropdownContainer}>
                <TouchableOpacity
                  style={[styles.inlineDropdownItem, sortMode === "A-Z" && styles.inlineDropdownItemActive]}
                  onPress={() => handleSortSelection("A-Z")}
                >
                  <Text style={[styles.inlineDropdownText, sortMode === "A-Z" && styles.inlineDropdownTextActive]}>
                    A–Z {sortMode === "A-Z" ? (sortDirection === "asc" ? "(Asc)" : "(Desc)") : ""}
                  </Text>
                  {sortMode === "A-Z" && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inlineDropdownItem, sortMode === "Date Posted" && styles.inlineDropdownItemActive]}
                  onPress={() => handleSortSelection("Date Posted")}
                >
                  <Text style={[styles.inlineDropdownText, sortMode === "Date Posted" && styles.inlineDropdownTextActive]}>
                    Date Posted {sortMode === "Date Posted" ? (sortDirection === "asc" ? "(Oldest)" : "(Newest)") : ""}
                  </Text>
                  {sortMode === "Date Posted" && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* FILTER BY DATE DROPDOWN */}
          <View style={{ flex: 1, position: "relative" }}>
            <TouchableOpacity 
              style={styles.filterDropdownBtn} 
              activeOpacity={0.7}
              onPress={() => { setDateDropdownOpen(!dateDropdownOpen); setSortDropdownOpen(false); }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                <Ionicons name="filter-outline" size={15} color={Colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  Filter: {dateFilterMode === "Custom" ? customMainDate.toLocaleDateString() : dateFilterMode}
                </Text>
              </View>
              <Ionicons name={dateDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color={Colors.icon} />
            </TouchableOpacity>

            {dateDropdownOpen && (
              <View style={styles.floatingDropdownContainer}>
                {(["All", "Today", "Last 7 Days", "Last 30 Days", "Custom"] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.inlineDropdownItem, dateFilterMode === mode && styles.inlineDropdownItemActive]}
                    onPress={() => {
                      setDateDropdownOpen(false);
                      if (mode === "Custom") {
                        setShowMainDatePicker(true);
                      } else {
                        setDateFilterMode(mode);
                      }
                    }}
                  >
                    <Text style={[styles.inlineDropdownText, dateFilterMode === mode && styles.inlineDropdownTextActive]}>
                      {mode}
                    </Text>
                    {dateFilterMode === mode && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showMainDatePicker && (
              <DateTimePicker
                value={customMainDate}
                mode="date"
                display="default"
                onChange={(event: any, selectedDate?: Date) => {
                  setShowMainDatePicker(false);
                  if (event.type === "dismissed") return;
                  if (selectedDate) {
                    setCustomMainDate(selectedDate);
                    setDateFilterMode("Custom");
                  }
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.85}
                onPress={() => switchTab(t.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                {tabCounts[t.key] > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                      {tabCounts[t.key]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food or merchant..."
            placeholderTextColor={Colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {chipOptions.length > 1 && (
          <FilterChips options={chipOptions} selected={selectedType} onSelect={setSelectedType} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.donation_id)}
          contentContainerStyle={[styles.listContent, isTablet && styles.padTablet]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            loadError ? <ErrorBanner message={loadError} onRetry={() => load()} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              {...(inTab.length === 0
                ? emptyCopy[tab]
                : {
                    icon: "search-outline" as any,
                    title: "Nothing matches",
                    message: "Try a different food type or clear your search.",
                  })}
              actionLabel={inTab.length > 0 ? "Clear filters" : undefined}
              onAction={
                inTab.length > 0
                  ? () => {
                      setSelectedType("All");
                      setSearch("");
                      setDateFilterMode("All");
                    }
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onView={() => setDetail(item)}
              onAction={(action) => setPending({ offer: item, action })}
            />
          )}
        />
      )}

      {/* ================= DETAIL MODAL ================= */}
      <Modal
        visible={!!detail}
        transparent
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDetail(null)} />
          {detail && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <ScrollView showsVerticalScrollIndicator={false}>
                <OfferImage path={detail.image_path ?? null} foodType={detail.food_type} big />

                <View style={styles.detailHeadRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>{detail.food_name}</Text>
                    <Text style={styles.detailMerchant}>{detail.merchant_name}</Text>
                  </View>
                  <StatusPill status={detail.status} />
                </View>

                {detail.status === "Active" && (
                  <View style={{ marginTop: 10 }}>
                    <Countdown expiresAt={detail.expires_at ?? ""} large />
                  </View>
                )}

                {detail.is_ttt && (
                  <View style={styles.tttBanner}>
                    <Ionicons name="flash" size={18} color="#8A5A00" />
                    <Text style={styles.tttBannerText}>
                      Listed automatically by TTT because this food is close to its safe-to-consume
                      limit. Please collect it before the timer ends.
                    </Text>
                  </View>
                )}

                <View style={styles.infoBox}>
                  <InfoRow icon="cube-outline" label="Quantity" value={formatQty(detail.qty_donated, detail.unit_name)} />
                  <InfoRow icon={foodIcon(detail.food_type)} label="Food type" value={detail.food_type} />
                  {detail.expires_at && (
                    <InfoRow icon="alarm-outline" label="Best before" value={formatDateTime(detail.expires_at)} />
                  )}
                  <InfoRow icon="location-outline" label="Pick up at" value={detail.merchant_address} />
                  <InfoRow
                    icon="person-outline"
                    label="Contact"
                    value={
                      detail.merchant_contact_name
                        ? `${detail.merchant_contact_name} · ${detail.merchant_contact}`
                        : detail.merchant_contact
                    }
                  />
                  <InfoRow icon="time-outline" label="Listed" value={timeAgo(detail.created_at)} last />
                </View>

                {/\d/.test(detail.merchant_contact) && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(`tel:${detail.merchant_contact.replace(/\s/g, "")}`)}
                  >
                    <Ionicons name="call-outline" size={18} color={Colors.primary} />
                    <Text style={styles.callBtnText}>Call merchant</Text>
                  </TouchableOpacity>
                )}

                <DetailActions
                  offer={detail}
                  onAction={(action) => setPending({ offer: detail, action })}
                />

                <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={() => setDetail(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      <ConfirmModal
        visible={!!pending}
        title={pending ? CONFIRM_COPY[pending.action].title : ""}
        message={
          pending
            ? `${formatQty(pending.offer.qty_donated, pending.offer.unit_name)} of ${pending.offer.food_name} from ${pending.offer.merchant_name}.`
            : ""
        }
        confirmLabel={pending ? CONFIRM_COPY[pending.action].confirm : ""}
        destructive={pending ? CONFIRM_COPY[pending.action].destructive : false}
        loading={working}
        onConfirm={runAction}
        onCancel={() => setPending(null)}
      />

      <Toast message={toast} />

      {/* FOOD BANK BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid-outline" label="Home" onPress={() => router.replace("/foodbank/dashboard")} />
        <BottomNavItem icon="document-text-outline" label="Requests" onPress={() => router.replace("/foodbank/requests")} />
        <BottomNavItem icon="gift" label="Donations" active onPress={() => router.replace("/foodbank/donations")} />
        <BottomNavItem icon="people-outline" label="Partners" onPress={() => router.replace("/foodbank/partners")} />
        <BottomNavItem icon="time-outline" label="Activity" onPress={() => router.replace("/foodbank/activity")} />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   OFFER CARD
===================================================== */

function OfferCard({
  offer,
  onView,
  onAction,
}: {
  offer: DonationOffer;
  onView: () => void;
  onAction: (a: Action) => void;
}) {
  const expired = offer.status === "Active" && secondsLeft(offer.expires_at) === 0;

  return (
    <View style={[styles.card, expired && { opacity: 0.6 }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onView} style={styles.cardMain}>
        <OfferImage path={offer.image_path ?? null} foodType={offer.food_type} />

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{offer.food_name}</Text>
            <StatusPill status={offer.status} />
          </View>

          <Text style={styles.cardMerchant} numberOfLines={1}>{offer.merchant_name}</Text>

          <View style={styles.cardBottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardQty}>{formatQty(offer.qty_donated, offer.unit_name)} available</Text>
              {offer.is_ttt && (
                <View style={styles.tttChip}>
                  <Ionicons name="flash" size={11} color="#8A5A00" />
                  <Text style={styles.tttChipText}>TTT</Text>
                </View>
              )}
            </View>
            <Countdown expiresAt={offer.expires_at ?? ""} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <ActionBtn icon="eye-outline" label="View" onPress={onView} />
        {offer.status === "Active" && !expired && (
          <>
            <ActionBtn icon="checkmark-circle-outline" label="Accept" color={Colors.button} onPress={() => onAction("accept")} />
            <ActionBtn icon="close-circle-outline" label="Decline" color="#B3261E" onPress={() => onAction("decline")} />
          </>
        )}
        {(offer.status === "Claimed" || offer.status === "In-Transit") && (
          <ActionBtn icon="checkmark-done-outline" label="Mark received" color={Colors.button} onPress={() => onAction("received")} />
        )}
      </View>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color = Colors.primary1,
  onPress,
}: {
  icon: any;
  label: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DetailActions({ offer, onAction }: { offer: DonationOffer; onAction: (a: Action) => void }) {
  const expired = offer.status === "Active" && secondsLeft(offer.expires_at) === 0;

  if (offer.status === "Active") {
    if (expired) {
      return <Text style={styles.expiredNote}>This offer has expired and can't be claimed anymore.</Text>;
    }
    return (
      <View style={styles.detailActionRow}>
        <TouchableOpacity style={[styles.bigBtn, { backgroundColor: Colors.button }]} activeOpacity={0.85} onPress={() => onAction("accept")}>
          <Ionicons name="checkmark-circle-outline" size={19} color={Colors.white} />
          <Text style={styles.bigBtnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bigBtn, styles.bigBtnOutline]} activeOpacity={0.85} onPress={() => onAction("decline")}>
          <Ionicons name="close-circle-outline" size={19} color="#B3261E" />
          <Text style={[styles.bigBtnText, { color: "#B3261E" }]}>Decline</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (offer.status === "Claimed" || offer.status === "In-Transit") {
    return (
      <View style={styles.detailActionRow}>
        <TouchableOpacity style={[styles.bigBtn, { backgroundColor: Colors.button }]} activeOpacity={0.85} onPress={() => onAction("received")}>
          <Ionicons name="checkmark-done-outline" size={19} color={Colors.white} />
          <Text style={styles.bigBtnText}>Mark as received</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
}

/* =====================================================
   SMALL PIECES
===================================================== */

function OfferImage({ path, foodType, big }: { path: string | null; foodType: string; big?: boolean }) {
  const uri = imageUri(path);
  const box = big ? styles.imageBig : styles.image;
  if (uri) {
    return <Image source={{ uri }} style={box} resizeMode="cover" />;
  }
  return (
    <View style={[box, styles.imagePlaceholder]}>
      <Ionicons name={foodIcon(foodType)} size={big ? 54 : 34} color={Colors.primary1} />
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Active;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: s.fg }]} />
      <Text style={[styles.statusPillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Ionicons name={icon} size={18} color={Colors.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function BottomNavItem({ icon, label, active, onPress }: { icon: any; label: string; active?: boolean; onPress: () => void; }) {
  return (
    <TouchableOpacity 
      style={[styles.navItem, active && styles.navItemActive]} 
      activeOpacity={active ? 1 : 0.7} 
      onPress={active ? undefined : onPress} 
    >
      <Ionicons name={icon} size={24} color={active ? Colors.primary : Colors.icon} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    minHeight: 70,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 26,
    color: Colors.primary,
    letterSpacing: 0.7,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    marginTop: -2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerIconButton: {
    position: "relative",
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A94A3A",
    right: 3,
    top: 2,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  profileCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  top: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 6, gap: 12, backgroundColor: Colors.background, zIndex: 10 },
  padTablet: { paddingHorizontal: 28 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, lineHeight: 30, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, lineHeight: 16, color: Colors.primary1, marginTop: 1 },

  tabs: { flexDirection: "row", backgroundColor: "#DDE2DC", borderRadius: 12, padding: 3 },
  tab: { flex: 1, height: 38, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabActive: { backgroundColor: Colors.white, elevation: 1, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  tabTextActive: { color: Colors.primary2, fontFamily: "PoppinsSemiBold" },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: "#C9D3CC", alignItems: "center", justifyContent: "center" },
  tabBadgeActive: { backgroundColor: Colors.button },
  tabBadgeText: { fontFamily: "PoppinsMedium", fontSize: 9.5, color: Colors.primary2 },
  tabBadgeTextActive: { color: Colors.white },

  floatingDropdownContainer: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  filterDropdownBtn: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterDropdownText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  inlineDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inlineDropdownItemActive: {
    backgroundColor: "#E8EFEA",
  },
  inlineDropdownText: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary2,
  },
  inlineDropdownTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  searchBox: { height: 42, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 42, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.text, paddingVertical: 0 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  listContent: { paddingHorizontal: 17, paddingTop: 10, paddingBottom: 70 },

  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  cardMain: { flexDirection: "row", gap: 12, padding: 12 },
  image: { width: 92, height: 110, borderRadius: 12 },
  imageBig: { width: "100%", height: 190, borderRadius: 16, marginBottom: 14 },
  imagePlaceholder: { backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  cardMerchant: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 1 },
  cardBottomRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 8 },
  cardQty: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary2 },
  tttChip: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start", backgroundColor: "#FCEFD9", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  tttChipText: { fontFamily: "PoppinsSemiBold", fontSize: 9.5, color: "#8A5A00" },

  cardActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, gap: 18 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 },
  actionBtnText: { fontFamily: "PoppinsMedium", fontSize: 12.5 },

  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontFamily: "PoppinsMedium", fontSize: 10.5 },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,48,38,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20, maxHeight: "92%" },
  sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 12 },
  detailHeadRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailTitle: { fontFamily: "PoppinsBold", fontSize: 21, lineHeight: 27, color: Colors.primary2 },
  detailMerchant: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary1 },

  tttBanner: { flexDirection: "row", gap: 10, backgroundColor: "#FCEFD9", borderRadius: 12, padding: 12, marginTop: 14 },
  tttBannerText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11.5, lineHeight: 17, color: "#6B4500" },

  infoBox: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, marginTop: 14, paddingHorizontal: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#ECEFEC" },
  infoLabel: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.placeholder },
  infoValue: { fontFamily: "PoppinsMedium", fontSize: 12.5, lineHeight: 18, color: Colors.primary2 },

  callBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary, marginTop: 12 },
  callBtnText: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary },

  detailActionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  bigBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14 },
  bigBtnOutline: { backgroundColor: "#FDF3F2", borderWidth: 1, borderColor: "#E5B8B4" },
  bigBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.white },
  expiredNote: { fontFamily: "PoppinsMedium", fontSize: 12, color: "#7A807C", textAlign: "center", marginTop: 14 },
  closeBtn: { alignItems: "center", paddingVertical: 14 },
  closeBtnText: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary1 },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingBottom: 25,
    backgroundColor: Colors.white,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 10,
    paddingHorizontal: 2,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
    marginHorizontal: 2,
    borderRadius: 7,
  },
  navItemActive: {
    backgroundColor: "#E8EFEA",
  },
  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.icon,
    marginTop: 4,
  },
  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },
});