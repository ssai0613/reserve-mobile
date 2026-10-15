import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { Colors } from "@/constants/color";
import { ActivityEvent, formatTime } from "@/constants/foodbankApi";
import { EmptyState, ErrorBanner } from "@/constants/FoodBankUI";
import { api } from "../../../services/api";

type Filter = "All" | "request" | "donation";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "All", label: "All" },
  { key: "request", label: "My requests" },
  { key: "donation", label: "Donations" },
];

const dayLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const short = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (date.toDateString() === today.toDateString()) return `Today, ${short}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${short}`;
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
};

export default function FoodBankActivityLog() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  
  /* =====================================================
            DATE FILTER & CUSTOM PICKER STATES
  ===================================================== */
  const [dateFilterMode, setDateFilterMode] = useState<"All" | "Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("All");
  const [showMainDatePicker, setShowMainDatePicker] = useState(false);
  const [customMainDate, setCustomMainDate] = useState(new Date());
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get("/donations/activity/");
      setEvents(response.data);
      setLoadError("");
    } catch (e: any) {
      setLoadError(e.message || "Failed to load activity.");
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

  const sections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    const filtered = events.filter((e) => {
      const matchesFilter = activeFilter === "All" || e.type === activeFilter;
      const matchesSearch =
        !q || e.title.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q);
      
      const itemDate = new Date(e.time);
      const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);

      let matchesDate = true;
      if (dateFilterMode === "Today") {
        matchesDate =
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getDate() === now.getDate();
      } else if (dateFilterMode === "Last 7 Days") {
        matchesDate = diffDays >= 0 && diffDays <= 7;
      } else if (dateFilterMode === "Last 30 Days") {
        matchesDate = diffDays >= 0 && diffDays <= 30;
      } else if (dateFilterMode === "Custom") {
        matchesDate =
          itemDate.getFullYear() === customMainDate.getFullYear() &&
          itemDate.getMonth() === customMainDate.getMonth() &&
          itemDate.getDate() === customMainDate.getDate();
      }

      return matchesFilter && matchesSearch && matchesDate;
    });

    const groups: { title: string; data: ActivityEvent[] }[] = [];
    filtered.forEach((e) => {
      const label = dayLabel(new Date(e.time));
      const last = groups[groups.length - 1];
      if (last && last.title === label) last.data.push(e);
      else groups.push({ title: label, data: [e] });
    });
    return groups;
  }, [events, searchQuery, activeFilter, dateFilterMode, customMainDate]);

  //notifications
  const [unreadCount, setUnreadCount] = useState(0);
  
  return (
    <SafeAreaView style={styles.container}>
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

      <View style={[styles.scrollContent, isTablet && styles.contentTablet]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Activity Log</Text>
          <Text style={styles.pageSubtitle}>Everything that's happened with your requests and donations</Text>
        </View>

        {/* TAB BUTTONS */}
        <View style={styles.tabsContainer}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SEARCH BAR & SINGLE UNIFIED DATE FILTER ROW */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 5, zIndex: 30, position: "relative" }}>
          <View style={[styles.searchContainer, { flex: 1, marginBottom: 0 }]}>
            <Ionicons name="search-outline" size={18} color={Colors.icon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              placeholderTextColor={Colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={Colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* SINGLE DATE FILTER DROPDOWN */}
          <View style={{ width: 140, position: "relative" }}>
            <TouchableOpacity 
              style={styles.filterDropdownBtn} 
              activeOpacity={0.7}
              onPress={() => setDateDropdownOpen(!dateDropdownOpen)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                <Ionicons name="filter-outline" size={14} color={Colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  {dateFilterMode === "Custom" ? customMainDate.toLocaleDateString() : (dateFilterMode === "All" ? "Filter Date" : dateFilterMode)}
                </Text>
              </View>
              <Ionicons name={dateDropdownOpen ? "chevron-up" : "chevron-down"} size={14} color={Colors.icon} />
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
                    {dateFilterMode === mode && <Ionicons name="checkmark" size={14} color={Colors.primary} />}
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
      </View>

      {loading ? (
        <View style={{ paddingVertical: 50, alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, isTablet && styles.contentTablet]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
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
              icon="time-outline"
              title="No activity found"
              message={
                events.length === 0
                  ? "When you post requests or merchants list donations, it will show up here."
                  : "Try a different filter or search."
              }
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.dateHeaderContainer}>
              <Text style={styles.dateHeaderText}>{title}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const isLast = index === section.data.length - 1;
            const isRequest = item.type === "request";
            return (
              <View style={styles.timelineRow}>
                <View style={styles.timelineVisual}>
                  <View style={[styles.iconCircle, isRequest ? styles.iconReq : styles.iconDon]}>
                    <Ionicons
                      name={isRequest ? "megaphone-outline" : "gift-outline"}
                      size={14}
                      color={Colors.white}
                    />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={[styles.activityCard, isLast && { marginBottom: 25 }]}>
                  <View style={styles.activityHeaderRow}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityTime}>{formatTime(item.time)}</Text>
                  </View>
                  <Text style={styles.activityDesc}>{item.detail}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* BOTTOM NAV MATCHING THE EXACT HEIGHT & PADDING OF LISTING.TSX */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid-outline" label="Home" onPress={() => router.replace("/foodbank/dashboard")} />
        <BottomNavItem icon="document-text-outline" label="Requests" onPress={() => router.replace("/foodbank/requests")} />
        <BottomNavItem icon="gift-outline" label="Donations" onPress={() => router.replace("/foodbank/donations")} />
        <BottomNavItem icon="people-outline" label="Partners" onPress={() => router.replace("/foodbank/partners")} />
        <BottomNavItem icon="time" label="Activity" active onPress={() => router.replace("/foodbank/activity")} />
      </View>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 17, paddingTop: 15, paddingBottom: 5 },
  contentTablet: { paddingHorizontal: 28 },
  pageHeader: { marginBottom: 12 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 2 },
  
  tabsContainer: { 
    flexDirection: "row", 
    backgroundColor: "#EBEFEB", 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 10 
  },
  tabBtn: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 8, 
    borderRadius: 10, 
    gap: 5 
  },
  tabBtnActive: { 
    backgroundColor: Colors.white, 
    shadowColor: "#000", 
    shadowOpacity: 0.05, 
    shadowRadius: 3, 
    shadowOffset: { width: 0, height: 2 }, 
    elevation: 2 
  },
  tabBtnText: { 
    fontFamily: "PoppinsMedium", 
    fontSize: 11, 
    color: Colors.primary1 
  },
  tabBtnTextActive: { 
    fontFamily: "PoppinsSemiBold", 
    color: Colors.primary2 
  },

  searchContainer: { 
    minHeight: 42, 
    borderRadius: 12, 
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 12, 
    marginBottom: 5 
  },
  searchInput: { 
    flex: 1, 
    fontFamily: "PoppinsRegular", 
    fontSize: 12, 
    color: Colors.primary2, 
    marginLeft: 8, 
    paddingVertical: 9 
  },

  filterDropdownBtn: {
    height: 42,
    borderRadius: 12,
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
  floatingDropdownContainer: {
    position: "absolute",
    top: 46,
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
  inlineDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
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

  listContent: { paddingHorizontal: 17, paddingBottom: 70 },
  dateHeaderContainer: { backgroundColor: "#F3F6F4", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginBottom: 15, marginTop: 5 },
  dateHeaderText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 },
  timelineRow: { flexDirection: "row" },
  timelineVisual: { width: 30, alignItems: "center" },
  iconCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", zIndex: 2, elevation: 2, borderWidth: 2, borderColor: Colors.background },
  iconReq: { backgroundColor: "#F28C00" },
  iconDon: { backgroundColor: "#70987A" },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#E3E7E3", marginVertical: -2 },
  activityCard: { flex: 1, marginLeft: 10, marginBottom: 15, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  activityHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  activityTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2, paddingRight: 10 },
  activityTime: { fontFamily: "PoppinsMedium", fontSize: 10, color: Colors.primary1 },
  activityDesc: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: "#4A4A4A", lineHeight: 17 },

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
});