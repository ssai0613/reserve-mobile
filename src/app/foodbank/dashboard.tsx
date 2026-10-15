import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";
import { Countdown, ErrorBanner } from "@/constants/FoodBankUI";
import { ActivityEvent } from "@/constants/foodbankApi";
import {api} from "../../../services/api";

/* =====================================================
   TYPES & HELPERS
===================================================== */

export type FoodRequest = {
  donation_req_id: number;
  food_type: string;
  qty_needed: number;
  status: string;
  created_at: string;
};

export type DonationOffer = {
  donation_id: number;
  food_name: string;
  food_type: string;
  merchant_name: string;
  qty_donated: number;
  unit_name: string;
  expires_at: string;
  is_ttt: boolean;
};

type DashboardData = {
  org_name: string;
  stats: {
    total_requests: number;
    active_requests: number;
    fulfilled_requests: number;
    offers_available: number;
    expiring_soon: number;
    in_progress: number;
    food_received: number;
    partners: number;
  };
  urgent_offers: DonationOffer[];
  active_requests: FoodRequest[];
  recent_activity: ActivityEvent[];
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const foodIcon = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("bakery") || t.includes("bread")) return "basket-outline";
  if (t.includes("produce") || t.includes("veg")) return "leaf-outline";
  return "restaurant-outline";
};

const formatQty = (qty: number, unit: string) => {
  return `${qty} ${unit || "items"}`;
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

export default function FoodBankDashboard() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
  if (isRefresh) setRefreshing(true);
  try {
    const response = await api.get("/donations/dashboard/");
    setData(response.data);

    // AUTOMATIC UPDATE:
    // Option A: If your backend sends an unread notification count directly:
    // setUnreadCount(response.data.unread_notifications_count || 0);

    // Option B: Or automatically count items from recent activity (e.g., items from today or unread flag):
    const unreadItems = response.data.recent_activity.filter((item: any) => !item.is_read);
    setUnreadCount(unreadItems.length);

    setLoadError("");
  } catch (e: any) {
    setLoadError(e.message || "Failed to load dashboard.");
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

  const stats = data?.stats;

  //notifcations
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      {/* ESTABLISHMENT HEADER STYLE */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Food Bank Portal</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              setUnreadCount(0); // Removes the red dot when opened
              router.push("/foodbank/activity");
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.primary}
            />

            {/* Show red dot only if unreadCount > 0 */}
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/foodbank/profile")}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {loadError !== "" && <ErrorBanner message={loadError} onRetry={() => load()} />}

          {/* GREETING */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSmall}>{greeting()},</Text>
            <Text style={styles.greetingName} numberOfLines={2}>
              {data?.org_name || "Food Bank"}
            </Text>
          </View>

          {/* STATS */}
          {stats && (
            <View style={styles.statsGrid}>
              <StatCard
                icon="megaphone-outline"
                value={String(stats.active_requests)}
                label="Active requests"
                sub={`${stats.total_requests} posted in total`}
                tone="primary"
                onPress={() => router.push("/foodbank/requests")}
              />
              <StatCard
                icon="gift-outline"
                value={String(stats.offers_available)}
                label="Offers available"
                sub={stats.in_progress > 0 ? `${stats.in_progress} in progress` : "Ready to claim"}
                tone="light"
                onPress={() => router.push("/foodbank/donations")}
              />
              <StatCard
                icon="flash-outline"
                value={String(stats.expiring_soon)}
                label="Expiring soon"
                sub={stats.expiring_soon > 0 ? "Under 3 hours left" : "Nothing urgent"}
                tone={stats.expiring_soon > 0 ? "warn" : "light"}
                onPress={() => router.push("/foodbank/donations")}
              />
              <StatCard
                icon="heart-outline"
                value={String(Math.round(stats.food_received))}
                label="Items received"
                sub={`From ${stats.partners} partner${stats.partners === 1 ? "" : "s"}`}
                tone="dark"
                onPress={() => router.push("/foodbank/partners")}
              />
            </View>
          )}

          {/* POST NEW REQUEST */}
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={() => router.push("/foodbank/requests")}
          >
            <View style={styles.ctaIcon}>
              <Ionicons name="add" size={26} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Post a new request</Text>
              <Text style={styles.ctaSub}>Let merchants know what you need</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>

          {/* URGENT OFFERS */}
          {/* URGENT OFFERS */}
          <SectionHeader
            title="Claim these first"
            subtitle="Donations running out of time"
            actionLabel="See all"
            onAction={() => router.push("/foodbank/donations")}
          />
          {data && data.urgent_offers && data.urgent_offers.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.urgentRow}
            >
              {data.urgent_offers
                .slice()
                .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
                .slice(0, 3)
                .map((offer) => (
                <TouchableOpacity
                  key={offer.donation_id}
                  style={styles.urgentCard}
                  activeOpacity={0.85}
                  onPress={() => router.push("/foodbank/donations")}
                >
                  <View style={styles.urgentTop}>
                    <View style={styles.urgentIcon}>
                      <Ionicons name={foodIcon(offer.food_type)} size={20} color={Colors.primary} />
                    </View>
                    {offer.is_ttt && (
                      <View style={styles.tttChip}>
                        <Ionicons name="flash" size={11} color="#8A5A00" />
                        <Text style={styles.tttChipText}>TTT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.urgentName} numberOfLines={1}>{offer.food_name}</Text>
                  <Text style={styles.urgentMerchant} numberOfLines={1}>{offer.merchant_name}</Text>
                  <Text style={styles.urgentQty}>{formatQty(offer.qty_donated, offer.unit_name)}</Text>
                  <View style={{ marginTop: 8 }}>
                    <Countdown expiresAt={offer.expires_at} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.softCard}>
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.button} />
              <Text style={styles.softCardText}>
                No time-sensitive offers right now. New ones appear here as merchants list them.
              </Text>
            </View>
          )}

          {/* ACTIVE REQUESTS */}
          <SectionHeader
            title="Your active requests"
            subtitle="Waiting for a merchant to respond"
            actionLabel="View all"
            onAction={() => router.push("/foodbank/requests")}
          />
          {data && data.active_requests && data.active_requests.length > 0 ? (
            <View style={styles.listCard}>
              {data.active_requests.map((req, i) => (
                <TouchableOpacity
                  key={req.donation_req_id}
                  style={[styles.reqRow, i < data.active_requests.length - 1 && styles.rowBorder]}
                  activeOpacity={0.8}
                  onPress={() => router.push("/foodbank/requests")}
                >
                  <View style={styles.reqIcon}>
                    <Ionicons name={foodIcon(req.food_type)} size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqTitle}>{req.food_type}</Text>
                    <Text style={styles.reqMeta}>
                      {req.qty_needed} items · posted {timeAgo(req.created_at)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.softCard}>
              <Ionicons name="megaphone-outline" size={22} color={Colors.button} />
              <Text style={styles.softCardText}>
                You have no active requests. Post one so merchants know what you need.
              </Text>
            </View>
          )}

          {/* RECENT ACTIVITY */}
          <SectionHeader
            title="Recent activity"
            subtitle="What's been happening"
            actionLabel="View all"
            onAction={() => router.push("/foodbank/activity")}
          />
          {data && data.recent_activity && data.recent_activity.length > 0 ? (
            <View style={styles.listCard}>
              {data.recent_activity.map((e, i) => (
                <View
                  key={e.id}
                  style={[styles.activityRow, i < data.recent_activity.length - 1 && styles.rowBorder]}
                >
                  <View style={[styles.activityDot, e.type === "request" ? styles.dotReq : styles.dotDon]}>
                    <Ionicons
                      name={e.type === "request" ? "megaphone-outline" : "gift-outline"}
                      size={13}
                      color={Colors.white}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{e.title}</Text>
                    <Text style={styles.activityDetail} numberOfLines={1}>{e.detail}</Text>
                  </View>
                  <Text style={styles.activityTime}>{timeAgo(e.time)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.softCard}>
              <Ionicons name="time-outline" size={22} color={Colors.button} />
              <Text style={styles.softCardText}>Nothing yet. Your activity will appear here.</Text>
            </View>
          )}

          {/* QUICK ACTIONS */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="people-outline"
              title="Partner merchants"
              subtitle={`${stats?.partners ?? 0} connected`}
              onPress={() => router.push("/foodbank/partners")}
            />
            <QuickAction
              icon="checkbox-outline"
              title="Activity log"
              subtitle="Full history"
              onPress={() => router.push("/foodbank/activity")}
            />
          </View>
        </ScrollView>
      )}

      {/* FOOD BANK BOTTOM NAVIGATION (HOME, REQUESTS, DONATIONS, PARTNERS, ACTIVITY) */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid" label="Home" active onPress={() => router.replace("/foodbank/dashboard")} />
        <BottomNavItem icon="document-text-outline" label="Requests" onPress={() => router.replace("/foodbank/requests")} />
        <BottomNavItem icon="gift-outline" label="Donations" onPress={() => router.replace("/foodbank/donations")} />
        <BottomNavItem icon="people-outline" label="Partners" onPress={() => router.replace("/foodbank/partners")} />
        <BottomNavItem icon="time-outline" label="Activity" onPress={() => router.replace("/foodbank/activity")} />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   SUB-COMPONENTS
===================================================== */

function StatCard({
  icon,
  value,
  label,
  sub,
  tone,
  onPress,
}: {
  icon: any;
  value: string;
  label: string;
  sub: string;
  tone: "light" | "primary" | "dark" | "warn";
  onPress: () => void;
}) {
  const filled = tone === "primary" || tone === "dark";
  const bg =
    tone === "primary" ? Colors.accent : tone === "dark" ? "#729879" : tone === "warn" ? "#FCEFD9" : "#D5E7DC";
  const fg = filled ? Colors.white : tone === "warn" ? "#6B4500" : Colors.primary2;

  return (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: bg }]} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={20} color={fg} />
        <Ionicons name="chevron-forward" size={14} color={fg} style={{ opacity: 0.7 }} />
      </View>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
      <Text style={[styles.statSub, { color: fg }]} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
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
  loadingWrap: { paddingVertical: 80, alignItems: "center" },
  content: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 70 },
  contentTablet: { paddingHorizontal: 28 },

  greetingBlock: { marginBottom: 16 },
  greetingSmall: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary1 },
  greetingName: { fontFamily: "PoppinsBold", fontSize: 24, lineHeight: 31, color: Colors.primary2 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { flexBasis: "48%", flexGrow: 1, borderRadius: 16, padding: 14, minHeight: 116 },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  statValue: { fontFamily: "PoppinsBold", fontSize: 30, lineHeight: 36 },
  statLabel: { fontFamily: "PoppinsSemiBold", fontSize: 12 },
  statSub: { fontFamily: "PoppinsRegular", fontSize: 10.5, opacity: 0.85, marginTop: 1 },

  ctaButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14 },
  ctaIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  ctaTitle: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.white },
  ctaSub: { fontFamily: "PoppinsRegular", fontSize: 11, color: "rgba(255,255,255,0.8)" },

  sectionHeader: { flexDirection: "row", alignItems: "flex-end", marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, lineHeight: 22, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  sectionAction: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.button },

  urgentRow: { gap: 10, paddingRight: 8 },
  urgentCard: { width: 170, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 12 },
  urgentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  urgentIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  tttChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FCEFD9", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  tttChipText: { fontFamily: "PoppinsSemiBold", fontSize: 9.5, color: "#8A5A00" },
  urgentName: { fontFamily: "PoppinsSemiBold", fontSize: 13.5, color: Colors.primary2 },
  urgentMerchant: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  urgentQty: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary2, marginTop: 4 },

  softCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14 },
  softCardText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11.5, lineHeight: 17, color: Colors.primary1 },

  listCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#ECEFEC" },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  reqIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  reqTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13.5, color: Colors.primary2 },
  reqMeta: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },

  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  activityDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dotReq: { backgroundColor: "#F28C00" },
  dotDon: { backgroundColor: "#70987A" },
  activityTitle: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  activityDetail: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  activityTime: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.placeholder },

  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 },
  quickCard: { flexBasis: "48%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12 },
  quickIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  quickTitle: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  quickSub: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1 },

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