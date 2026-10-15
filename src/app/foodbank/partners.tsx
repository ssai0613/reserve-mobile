import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { EmptyState, ErrorBanner } from "@/constants/FoodBankUI";

type HistoryItem = {
  food_name: string;
  qty: number;
  unit: string;
  status: string;
  date: string;
};

type Partner = {
  merchant_id: number;
  name: string;
  type: string;
  is_verified: boolean;
  address: string;
  contact_phone: string;
  contact_name: string;
  contact_email: string;
  donations_count: number;
  received_qty: number;
  requests_fulfilled: number;
  active_offers: number;
  last_activity: string;
  history: HistoryItem[];
};

type PartnersResponse = {
  partners: Partner[];
  summary: { count: number; items_received: number };
};

// Mock data so the frontend works right away without a backend endpoint
const MOCK_PARTNERS_DATA: PartnersResponse = {
  summary: { count: 3, items_received: 145 },
  partners: [
    {
      merchant_id: 1,
      name: "Green Basket Bakery",
      type: "Bakery & Pastries",
      is_verified: true,
      address: "A. S. Fortuna St, Mandaue City",
      contact_phone: "+63 912 345 6789",
      contact_name: "Maria Santos",
      contact_email: "contact@greenbasket.com",
      donations_count: 12,
      received_qty: 85,
      requests_fulfilled: 4,
      active_offers: 2,
      last_activity: "2026-05-10T08:30:00Z",
      history: [
        { food_name: "Assorted Bread Loaves", qty: 25, unit: "pcs", status: "Completed", date: "2026-05-10" },
        { food_name: "Chocolate Pastries", qty: 15, unit: "boxes", status: "Completed", date: "2026-05-02" },
      ],
    },
    {
      merchant_id: 2,
      name: "Cebu Fresh Grocers",
      type: "Fruits & Vegetables",
      is_verified: true,
      address: "IT Park, Cebu City",
      contact_phone: "+63 923 456 7890",
      contact_name: "John Tan",
      contact_email: "support@cebufresh.com",
      donations_count: 8,
      received_qty: 40,
      requests_fulfilled: 2,
      active_offers: 1,
      last_activity: "2026-05-08T11:15:00Z",
      history: [
        { food_name: "Ripe Bananas & Apples", qty: 20, unit: "kg", status: "Completed", date: "2026-05-08" },
      ],
    },
    {
      merchant_id: 3,
      name: "Sunny Side Diner",
      type: "Cooked Meals",
      is_verified: false,
      address: "Colon St, Cebu City",
      contact_phone: "+63 934 567 8901",
      contact_name: "Elena Reyes",
      contact_email: "",
      donations_count: 5,
      received_qty: 20,
      requests_fulfilled: 1,
      active_offers: 0,
      last_activity: "2026-04-28T14:00:00Z",
      history: [
        { food_name: "Packed Rice Meals", qty: 20, unit: "boxes", status: "Completed", date: "2026-04-28" },
      ],
    },
  ],
};

const HISTORY_LABEL: Record<string, string> = {
  Claimed: "Accepted",
  "In-Transit": "On the way",
  Completed: "Received",
};

const initials = (name: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const formatQty = (qty: number, unit?: string) => `${qty} ${unit || "items"}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const timeAgo = (dateStr: string) => {
  if (!dateStr) return "Recently";
  const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function FoodBankPartnersScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const [data, setData] = useState<PartnersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Partner | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Frontend mock fallback directly without requiring backend route active yet
      await new Promise((r) => setTimeout(r, 400));
      setData(MOCK_PARTNERS_DATA);
      setLoadError("");
    } catch (e: any) {
      setLoadError(e.message || "Failed to load partners.");
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

  const partners = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.partners || []).filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
    );
  }, [data, search]);

    //notifcations
    const [unreadCount, setUnreadCount] = useState(0);
    
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
          <Text style={styles.pageTitle}>Partner Merchants</Text>
          <Text style={styles.pageSubtitle}>
            Businesses you've received donations from or who accepted your requests
          </Text>
        </View>

        {data && data.summary.count > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: "#D5E7DC" }]}>
              <Text style={styles.statValue}>{data.summary.count}</Text>
              <Text style={styles.statLabel}>Partners</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: Colors.accent }]}>
              <Text style={[styles.statValue, { color: Colors.white }]}>
                {data.summary.items_received}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.white }]}>Items received</Text>
            </View>
          </View>
        )}

        {data && data.summary.count > 0 && (
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search partners..."
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
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(item) => String(item.merchant_id)}
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
            (data?.partners.length ?? 0) === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No partners yet"
                message="A merchant becomes your partner once you accept one of their donations or they accept one of your requests."
                actionLabel="Browse donation offers"
                onAction={() => router.push("/foodbank/donations")}
              />
            ) : (
              <EmptyState
                icon="search-outline"
                title="No partner found"
                message="Try a different name."
              />
            )
          }
          renderItem={({ item }) => <PartnerCard partner={item} onPress={() => setSelected(item)} />}
        />
      )}

      {/* ================= PARTNER DETAIL ================= */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSelected(null)} />
          {selected && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHead}>
                  <View style={styles.avatarBig}>
                    <Text style={styles.avatarBigText}>{initials(selected.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.detailName} numberOfLines={2}>{selected.name}</Text>
                      {selected.is_verified && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.button} />
                      )}
                    </View>
                    <Text style={styles.detailType}>{selected.type}</Text>
                  </View>
                </View>

                <View style={styles.detailStats}>
                  <DetailStat value={selected.donations_count} label="Donations" />
                  <DetailStat value={selected.received_qty} label="Items received" />
                  <DetailStat value={selected.requests_fulfilled} label="Requests filled" />
                </View>

                {selected.active_offers > 0 && (
                  <TouchableOpacity
                    style={styles.offersBanner}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelected(null);
                      router.push("/foodbank/donations");
                    }}
                  >
                    <Ionicons name="gift-outline" size={18} color={Colors.button} />
                    <Text style={styles.offersBannerText}>
                      {selected.active_offers} donation{selected.active_offers > 1 ? "s" : ""} available
                      from this merchant right now
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.button} />
                  </TouchableOpacity>
                )}

                <Text style={styles.sectionLabel}>Contact</Text>
                <View style={styles.infoBox}>
                  <InfoRow icon="location-outline" value={selected.address} />
                  {selected.contact_name !== "" && (
                    <InfoRow icon="person-outline" value={selected.contact_name} />
                  )}
                  <InfoRow icon="call-outline" value={selected.contact_phone} last={selected.contact_email === ""} />
                  {selected.contact_email !== "" && (
                    <InfoRow icon="mail-outline" value={selected.contact_email} last />
                  )}
                </View>

                {/\d/.test(selected.contact_phone) && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(`tel:${selected.contact_phone.replace(/\s/g, "")}`)}
                  >
                    <Ionicons name="call-outline" size={18} color={Colors.white} />
                    <Text style={styles.callBtnText}>Call {selected.contact_name || "merchant"}</Text>
                  </TouchableOpacity>
                )}

                {selected.history.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Recent donations</Text>
                    <View style={styles.infoBox}>
                      {selected.history.map((h, i) => (
                        <View
                          key={`${h.date}-${i}`}
                          style={[styles.historyRow, i < selected.history.length - 1 && styles.rowBorder]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyName} numberOfLines={1}>{h.food_name}</Text>
                            <Text style={styles.historyMeta}>
                              {formatQty(h.qty, h.unit)} · {formatDate(h.date)}
                            </Text>
                          </View>
                          <Text style={styles.historyStatus}>{HISTORY_LABEL[h.status] || h.status}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* FOOD BANK BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid-outline" label="Home" onPress={() => router.replace("/foodbank/dashboard")} />
        <BottomNavItem icon="document-text-outline" label="Requests" onPress={() => router.replace("/foodbank/requests")} />
        <BottomNavItem icon="gift-outline" label="Donations" onPress={() => router.replace("/foodbank/donations")} />
        <BottomNavItem icon="people" label="Partners" active onPress={() => router.replace("/foodbank/partners")} />
        <BottomNavItem icon="time-outline" label="Activity" onPress={() => router.replace("/foodbank/activity")} />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   PIECES
===================================================== */

function PartnerCard({ partner, onPress }: { partner: Partner; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(partner.name)}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{partner.name}</Text>
          {partner.is_verified && <Ionicons name="checkmark-circle" size={15} color={Colors.button} />}
        </View>
        <Text style={styles.cardType}>{partner.type}</Text>
        <Text style={styles.cardMeta}>
          {partner.donations_count} donation{partner.donations_count === 1 ? "" : "s"}
          {partner.received_qty > 0 ? ` · ${partner.received_qty} items received` : ""}
        </Text>
        <Text style={styles.cardLast}>Last activity {timeAgo(partner.last_activity)}</Text>

        {partner.active_offers > 0 && (
          <View style={styles.offerBadge}>
            <Ionicons name="gift-outline" size={12} color={Colors.button} />
            <Text style={styles.offerBadgeText}>{partner.active_offers} available now</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
    </TouchableOpacity>
  );
}

function DetailStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.detailStat}>
      <Text style={styles.detailStatValue}>{value}</Text>
      <Text style={styles.detailStatLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, value, last }: { icon: any; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={18} color={Colors.icon} />
      <Text style={styles.infoValue}>{value}</Text>
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

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  statValue: { fontFamily: "PoppinsBold", fontSize: 26, lineHeight: 32, color: "#2F3A34" },
  statLabel: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },

  searchBox: { height: 42, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 42, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.text, paddingVertical: 0 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  listContent: { paddingHorizontal: 17, paddingTop: 10, paddingBottom: 70 },

  card: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E4F0E8", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardName: { flexShrink: 1, fontFamily: "PoppinsSemiBold", fontSize: 14.5, color: Colors.primary2 },
  cardType: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  cardMeta: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2, marginTop: 4 },
  cardLast: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.placeholder, marginTop: 1 },
  offerBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: "#E4F0E8", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 7 },
  offerBadgeText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.button },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(15,48,38,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20, maxHeight: "90%" },
  sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 14 },
  detailHead: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarBig: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E4F0E8", alignItems: "center", justifyContent: "center" },
  avatarBigText: { fontFamily: "PoppinsBold", fontSize: 21, color: Colors.primary },
  detailName: { flexShrink: 1, fontFamily: "PoppinsBold", fontSize: 19, lineHeight: 25, color: Colors.primary2 },
  detailType: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1 },

  detailStats: { flexDirection: "row", gap: 8, marginTop: 16 },
  detailStat: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  detailStatValue: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary2 },
  detailStatLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, textAlign: "center" },

  offersBanner: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#E4F0E8", borderRadius: 12, padding: 12, marginTop: 12 },
  offersBannerText: { flex: 1, fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.button },

  sectionLabel: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2, marginTop: 18, marginBottom: 8 },
  infoBox: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#ECEFEC" },
  infoValue: { flex: 1, fontFamily: "PoppinsMedium", fontSize: 12.5, lineHeight: 18, color: Colors.primary2 },

  callBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, backgroundColor: Colors.button, marginTop: 12 },
  callBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.white },

  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  historyName: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  historyMeta: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.placeholder },
  historyStatus: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.button },

  closeBtn: { alignItems: "center", paddingVertical: 14 },
  closeBtnText: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary1 },

 bottomNav: {
    position: "absolute",
    bottom: 0, // Negative value pushes the bar further down
    left: 0,
    right: 0,
    height: 90,  // Keeps your exact original height
    paddingBottom: 25, // Keeps your exact original padding
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