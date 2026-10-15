import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  EmptyState,
  ErrorBanner,
  FilterChips,
  Toast,
} from "@/constants/FoodBankUI";
import { api } from "../../../services/api";

export type FoodRequest = {
  donation_req_id: number;
  food_type: string;
  qty_needed: number;
  status: string;
  created_at: string;
  updated_at?: string;
  merchant_name?: string;
};

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];
const FALLBACK_TYPES = [
  "Bread & Pastries",
  "Cooked Meals",
  "Fruits & Vegetables",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Beverages",
  "Other",
];

const foodIcon = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("bakery") || t.includes("bread")) return "basket-outline";
  if (t.includes("produce") || t.includes("veg")) return "leaf-outline";
  return "restaurant-outline";
};

const timeAgo = (dateStr: string) => {
  if (!dateStr) return "Recently";
  const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function FoodBankRequestsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [foodTypes, setFoodTypes] = useState<string[]>(FALLBACK_TYPES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  // New request sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newType, setNewType] = useState("");
  const [newQty, setNewQty] = useState("10");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cancel confirmation
  const [toCancel, setToCancel] = useState<FoodRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<FoodRequest>>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  /* ---------- data ---------- */

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [reqRes, typesRes] = await Promise.all([
        api.get<FoodRequest[]>("/donations/requests/"),
        api.get<{ food_types: string[] }>("/donations/food-types/").catch(() => null),
      ]);
      setRequests(reqRes.data);
      if (typesRes?.data?.food_types?.length) {
        setFoodTypes(typesRes.data.food_types);
      }
      setLoadError("");
    } catch (e: any) {
      setLoadError(e.message || "Failed to load requests.");
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
  const filterByDateRange = (item: FoodRequest) => {
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

  const chipOptions = useMemo(() => {
    const waitingCount = requests.filter((r) => r.status === "Active").length;
    const fulfilledCount = requests.filter((r) => r.status === "Fulfilled").length;
    
    return [
      { label: "All", count: requests.length },
      { label: "Waiting", count: waitingCount },
      { label: "Fulfilled", count: fulfilledCount },
    ];
  }, [requests]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = requests.filter((r) => {
      const matchesStatus =
        selectedType === "All" ||
        (selectedType === "Waiting" && r.status === "Active") ||
        (selectedType === "Fulfilled" && r.status === "Fulfilled");

      const matchesSearch =
        !q ||
        r.food_type.toLowerCase().includes(q) ||
        (r.merchant_name || "").toLowerCase().includes(q);

      const matchesDate = filterByDateRange(r);

      return matchesStatus && matchesSearch && matchesDate;
    });

    // Sort from newest to oldest based on created_at timestamp
    return filtered.sort((a, b) => {
      if (sortMode === "A-Z") {
        const comp = a.food_type.localeCompare(b.food_type);
        return sortDirection === "asc" ? comp : -comp;
      } else {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
    });
  }, [requests, selectedType, search, dateFilterMode, customMainDate, sortMode, sortDirection]);

  /* ---------- actions ---------- */

  const openSheet = () => {
    setNewType(selectedType !== "All" && selectedType !== "Waiting" && selectedType !== "Fulfilled" ? selectedType : "");
    setNewQty("10");
    setFormError("");
    setSheetOpen(true);
  };

  const changeQty = (delta: number) => {
    const current = parseInt(newQty || "0", 10) || 0;
    setNewQty(String(Math.max(1, current + delta)));
  };

  const submitRequest = async () => {
    const qty = parseInt(newQty, 10);
    if (!newType) {
      setFormError("Please choose the type of food you need.");
      return;
    }
    if (!qty || qty < 1) {
      setFormError("Please enter how many items you need.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/donations/requests/", { food_type: newType, qty_needed: qty });
      setSheetOpen(false);
      setSelectedType("All");
      setSearch("");
      await load();
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      showToast("Request posted! Merchants can see it now.");
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await api.patch("/donations/requests/", {
        donation_req_id: toCancel.donation_req_id,
        status: "Cancelled",
      });
      setToCancel(null);
      await load();
      showToast("Request cancelled.");
    } catch (e: any) {
      setToCancel(null);
      setLoadError(e.message);
    } finally {
      setCancelling(false);
    }
  };

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

      <View style={[styles.top, isTablet && styles.topTablet]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>My Requests</Text>
            <Text style={styles.pageSubtitle}>
              Tell merchants what your food bank needs
            </Text>
          </View>
        </View>

        
        <TouchableOpacity style={styles.newButton} activeOpacity={0.85} onPress={openSheet}>
          <View style={styles.newButtonIcon}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.newButtonTitle}>Post a new request</Text>
            <Text style={styles.newButtonSub}>Choose a food type and how many you need</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* SORT & FILTER ROW */}
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

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by food type or merchant..."
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

        <FilterChips options={chipOptions} selected={selectedType} onSelect={setSelectedType} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={visible}
          keyExtractor={(item) => String(item.donation_req_id)}
          contentContainerStyle={[styles.listContent, isTablet && styles.topTablet]}
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
            requests.length === 0 ? (
              <EmptyState
                icon="megaphone-outline"
                title="No requests yet"
                message="Post your first request and merchants with surplus food will see what you need."
                actionLabel="Post a request"
                onAction={openSheet}
              />
            ) : (
              <EmptyState
                icon="search-outline"
                title="Nothing matches"
                message="Try a different food type or clear your search."
                actionLabel="Show all requests"
                onAction={() => {
                  setSelectedType("All");
                  setSearch("");
                  setDateFilterMode("All");
                }}
              />
            )
          }
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              expanded={expandedId === item.donation_req_id}
              onToggle={() =>
                setExpandedId(expandedId === item.donation_req_id ? null : item.donation_req_id)
              }
              onCancel={() => setToCancel(item)}
            />
          )}
        />
      )}

      {/* ================= NEW REQUEST SHEET ================= */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => !submitting && setSheetOpen(false)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New request</Text>
              <TouchableOpacity onPress={() => setSheetOpen(false)} disabled={submitting}>
                <Ionicons name="close" size={24} color={Colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <Text style={styles.sheetLabel}>What kind of food do you need?</Text>
              <View style={styles.typeGrid}>
                {foodTypes.map((type) => {
                  const active = newType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.8}
                      onPress={() => setNewType(type)}
                      style={[styles.typeOption, active && styles.typeOptionActive]}
                    >
                      <Ionicons
                        name={foodIcon(type)}
                        size={18}
                        color={active ? Colors.white : Colors.primary}
                      />
                      <Text style={[styles.typeOptionText, active && styles.typeOptionTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sheetLabel}>How many items?</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} activeOpacity={0.7} onPress={() => changeQty(-1)}>
                  <Ionicons name="remove" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  keyboardType="number-pad"
                  value={newQty}
                  onChangeText={(t) => setNewQty(t.replace(/[^0-9]/g, ""))}
                  maxLength={5}
                />
                <TouchableOpacity style={styles.stepperBtn} activeOpacity={0.7} onPress={() => changeQty(1)}>
                  <Ionicons name="add" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    activeOpacity={0.8}
                    style={[styles.quickChip, newQty === String(n) && styles.quickChipActive]}
                    onPress={() => setNewQty(String(n))}
                  >
                    <Text style={[styles.quickChipText, newQty === String(n) && styles.quickChipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formError !== "" && <Text style={styles.formError}>{formError}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={submitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="megaphone-outline" size={18} color={Colors.white} />
                  <Text style={styles.submitText}>Post request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={!!toCancel}
        title="Cancel this request?"
        message={
          toCancel
            ? `Merchants will no longer see your request for ${toCancel.qty_needed} items of ${toCancel.food_type}.`
            : ""
        }
        confirmLabel="Yes, cancel it"
        destructive
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />

      <Toast message={toast} />

      {/* FOOD BANK BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid-outline" label="Home" onPress={() => router.replace("/foodbank/dashboard")} />
        <BottomNavItem icon="document-text" label="Requests" active onPress={() => router.replace("/foodbank/requests")} />
        <BottomNavItem icon="gift-outline" label="Donations" onPress={() => router.replace("/foodbank/donations")} />
        <BottomNavItem icon="people-outline" label="Partners" onPress={() => router.replace("/foodbank/partners")} />
        <BottomNavItem icon="time-outline" label="Activity" onPress={() => router.replace("/foodbank/activity")} />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   REQUEST CARD & SUB-COMPONENTS
===================================================== */

const STATUS_STYLES: Record<string, { fg: string; bg: string; label: string; icon: any }> = {
  Active: { fg: "#1F6B52", bg: "#E4F0E8", label: "Waiting for merchants", icon: "hourglass-outline" },
  Fulfilled: { fg: "#2C5F8A", bg: "#E1EEF8", label: "Fulfilled", icon: "checkmark-circle-outline" },
  Cancelled: { fg: "#8C6D1F", bg: "#F6EED9", label: "Cancelled", icon: "close-circle-outline" },
};

function RequestCard({
  item,
  expanded,
  onToggle,
  onCancel,
}: {
  item: FoodRequest;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
}) {
  const s = STATUS_STYLES[item.status] || STATUS_STYLES.Active;
  const dimmed = item.status === "Cancelled";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={[styles.card, dimmed && { opacity: 0.7 }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons name={foodIcon(item.food_type)} size={24} color={Colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.food_type}</Text>
          <Text style={styles.cardQty}>{item.qty_needed} items needed</Text>
          <Text style={styles.cardMeta}>Posted {timeAgo(item.created_at)}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusPillText, { color: s.fg }]}>{item.status}</Text>
        </View>
      </View>

      {item.merchant_name && item.status === "Fulfilled" && (
        <View style={styles.acceptedBar}>
          <Ionicons name="storefront-outline" size={15} color="#2C5F8A" />
          <Text style={styles.acceptedText} numberOfLines={1}>
            Accepted by {item.merchant_name}
          </Text>
        </View>
      )}

      {expanded && (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name={s.icon} size={16} color={s.fg} />
            <Text style={[styles.detailText, { color: s.fg }]}>{s.label}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.icon} />
            <Text style={styles.detailText}>Posted {formatDateTime(item.created_at)}</Text>
          </View>
          {item.status !== "Active" && (
            <View style={styles.detailRow}>
              <Ionicons name="refresh-outline" size={16} color={Colors.icon} />
              <Text style={styles.detailText}>Updated {formatDateTime(item.updated_at || item.created_at)}</Text>
            </View>
          )}

          {item.status === "Active" && (
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={17} color="#B3261E" />
              <Text style={styles.cancelBtnText}>Cancel request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.chevronRow}>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.icon}
        />
      </View>
    </TouchableOpacity>
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
  topTablet: { paddingHorizontal: 28 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, lineHeight: 30, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, lineHeight: 16, color: Colors.primary1, marginTop: 1 },

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

  newButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  newButtonIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  newButtonTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.white },
  newButtonSub: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: "rgba(255,255,255,0.8)" },

  searchBox: { height: 42, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 42, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.text, paddingVertical: 0 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  listContent: { paddingHorizontal: 17, paddingTop: 10, paddingBottom: 70 },

  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 13, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2 },
  cardQty: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.button, marginTop: 1 },
  cardMeta: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.placeholder, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontFamily: "PoppinsMedium", fontSize: 10.5 },

  acceptedBar: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E1EEF8", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginTop: 10 },
  acceptedText: { flex: 1, fontFamily: "PoppinsMedium", fontSize: 11, color: "#2C5F8A" },

  cardDetails: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, paddingTop: 12, gap: 9 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1 },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", marginTop: 4 },
  cancelBtnText: { fontFamily: "PoppinsMedium", fontSize: 12, color: "#B3261E" },
  chevronRow: { alignItems: "center", marginTop: 4, marginBottom: -4 },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,48,38,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, maxHeight: "88%" },
  sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  sheetTitle: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary2 },
  sheetLabel: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2, marginTop: 14, marginBottom: 9 },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeOption: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, height: 42, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  typeOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeOptionText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary2 },
  typeOptionTextActive: { color: Colors.white },

  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  stepperInput: { flex: 1, height: 48, borderRadius: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, textAlign: "center", fontFamily: "PoppinsBold", fontSize: 22, color: Colors.primary2, paddingVertical: 0 },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  quickChip: { flex: 1, height: 36, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  quickChipActive: { backgroundColor: "#E4F0E8", borderColor: Colors.button },
  quickChipText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  quickChipTextActive: { color: Colors.button },

  formError: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: "#B3261E", marginTop: 12 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14, backgroundColor: Colors.button, marginTop: 14 },
  submitText: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.white },

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