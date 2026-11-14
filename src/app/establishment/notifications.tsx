import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import {
  getAppStorage,
  MERCHANT_DISMISSED_NOTIFS_KEY,
  MERCHANT_READ_NOTIFS_KEY,
  MerchantTabName,
  switchMerchantTab,
} from "../components/EstablishmentNav";

type MerchantNotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  sort_ts?: number;
  target_route?: string;
  read?: boolean;
};

type MerchantAnnouncementItem = {
  id: string;
  audience: string;
  title: string;
  body: string;
  date: string;
  sort_ts?: number;
  read?: boolean;
};

export default function EstablishmentNotificationsScreen() {
  const [merchantId, setMerchantId] = useState("0");
  const [activeTab, setActiveTab] = useState<"alerts" | "announcements">(
    "alerts"
  );
  const [notifications, setNotifications] = useState<
    MerchantNotificationItem[]
  >([]);
  const [announcements, setAnnouncements] = useState<
    MerchantAnnouncementItem[]
  >([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parseFallbackTimestamp = (timeStr?: string): number => {
    if (!timeStr) return 0;
    try {
      const cleaned = String(timeStr)
        .replace(/•/g, "")
        .replace(/\|/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const parsed = Date.parse(cleaned);
      return isNaN(parsed) ? 0 : parsed / 1000;
    } catch (e) {
      return 0;
    }
  };

  const loadNotificationsFeed = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const storedId = (await getAppStorage("profile_id")) || "0";
      const storedEmail = (await getAppStorage("user_email")) || "";

      if (storedId === "0" && !storedEmail) {
        router.replace("/consumer");
        return;
      }

      setMerchantId(storedId);

      const [notifRes, annRes, rawRead, rawDismissed] = await Promise.all([
        api
          .get(
            `listings/notifications/?merchant=${storedId}&email=${encodeURIComponent(
              storedEmail
            )}`
          )
          .catch(() => ({ data: [] })),
        api
          .get(
            `listings/announcements/?merchant=${storedId}&email=${encodeURIComponent(
              storedEmail
            )}`
          )
          .catch(() => ({ data: [] })),
        AsyncStorage.getItem(`${MERCHANT_READ_NOTIFS_KEY}_${storedId}`),
        AsyncStorage.getItem(`${MERCHANT_DISMISSED_NOTIFS_KEY}_${storedId}`),
      ]);

      let readSet = new Set<string>();
      if (rawRead) {
        try {
          readSet = new Set(JSON.parse(rawRead).map(String));
        } catch (e) {}
      }

      let dismissedSet = new Set<string>();
      if (rawDismissed) {
        try {
          dismissedSet = new Set(JSON.parse(rawDismissed).map(String));
        } catch (e) {}
      }

      setReadIds(readSet);
      setDismissedIds(dismissedSet);

      const rawNotifs: MerchantNotificationItem[] = (
        Array.isArray(notifRes.data)
          ? notifRes.data
          : notifRes.data?.notifications || []
      )
        .filter((n: any) => !dismissedSet.has(String(n.id)))
        .map((n: any) => ({
          id: String(n.id),
          type: String(n.type || "system"),
          title: String(n.title || "Store Update"),
          description: String(n.description || n.message || ""),
          time: String(n.time || n.timestamp || "Recent"),
          sort_ts:
            Number(n.sort_ts || 0) ||
            parseFallbackTimestamp(n.time || n.timestamp),
          target_route: n.target_route || "/establishment/dashboard",
          read: readSet.has(String(n.id)),
        }))
        .sort(
          (a: MerchantNotificationItem, b: MerchantNotificationItem) =>
            Number(b.sort_ts || 0) - Number(a.sort_ts || 0)
        );

      const rawAnns: MerchantAnnouncementItem[] = (
        Array.isArray(annRes.data) ? annRes.data : []
      )
        .map((a: any) => ({
          id: String(a.id),
          audience: String(a.audience || "All Users (System-wide)"),
          title: String(a.title || "System Announcement"),
          body: String(a.body || a.message || ""),
          date: String(a.date || a.timestamp || "Official Broadcast"),
          sort_ts:
            Number(a.sort_ts || 0) ||
            parseFallbackTimestamp(a.date || a.timestamp),
          read: readSet.has(String(a.id)),
        }))
        .sort(
          (a: MerchantAnnouncementItem, b: MerchantAnnouncementItem) =>
            Number(b.sort_ts || 0) - Number(a.sort_ts || 0)
        );

      setNotifications(rawNotifs);
      setAnnouncements(rawAnns);
    } catch (err) {
      console.log("Merchant notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotificationsFeed(true);

    const sub = DeviceEventEmitter.addListener("merchant_notifs_updated", () => {
      loadNotificationsFeed(false);
    });
    return () => sub.remove();
  }, [loadNotificationsFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotificationsFeed(false);
    setRefreshing(false);
  };

  const markSingleRead = async (itemId: string) => {
    const nextRead = new Set(readIds);
    nextRead.add(String(itemId));
    setReadIds(nextRead);
    setNotifications((prev) =>
      prev.map((n) => (n.id === itemId ? { ...n, read: true } : n))
    );
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === itemId ? { ...a, read: true } : a))
    );
    try {
      await AsyncStorage.setItem(
        `${MERCHANT_READ_NOTIFS_KEY}_${merchantId}`,
        JSON.stringify(Array.from(nextRead))
      );
      DeviceEventEmitter.emit("merchant_notifs_updated");
    } catch (e) {}
  };

  const markAllRead = async () => {
    const nextRead = new Set(readIds);
    notifications.forEach((n) => nextRead.add(String(n.id)));
    announcements.forEach((a) => nextRead.add(String(a.id)));
    setReadIds(nextRead);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setAnnouncements((prev) => prev.map((a) => ({ ...a, read: true })));
    try {
      await AsyncStorage.setItem(
        `${MERCHANT_READ_NOTIFS_KEY}_${merchantId}`,
        JSON.stringify(Array.from(nextRead))
      );
      DeviceEventEmitter.emit("merchant_notifs_updated");
    } catch (e) {}
  };

  const dismissNotification = async (itemId: string) => {
    const nextDismissed = new Set(dismissedIds);
    nextDismissed.add(String(itemId));
    setDismissedIds(nextDismissed);
    setNotifications((prev) => prev.filter((n) => n.id !== itemId));
    try {
      await AsyncStorage.setItem(
        `${MERCHANT_DISMISSED_NOTIFS_KEY}_${merchantId}`,
        JSON.stringify(Array.from(nextDismissed))
      );
      DeviceEventEmitter.emit("merchant_notifs_updated");
    } catch (e) {}
  };

  const resolveRouteToTab = (routeStr?: string): MerchantTabName => {
    const r = String(routeStr || "").toLowerCase();
    if (r.includes("order")) return "Orders";
    if (r.includes("earning")) return "Earnings";
    if (r.includes("impact")) return "Impact";
    if (r.includes("donat")) return "Donation";
    if (r.includes("listing")) return "Listings";
    if (r.includes("profile")) return "Profile";
    return "Home";
  };

  const handlePressNotification = async (item: MerchantNotificationItem) => {
    await markSingleRead(item.id);
    const targetTab = resolveRouteToTab(item.target_route);
    switchMerchantTab(targetTab);
    router.replace((item.target_route || "/establishment/dashboard") as any);
  };

  const getIconConfig = (typeStr: string) => {
    const t = (typeStr || "").toLowerCase();
    if (t.includes("order")) {
      return {
        icon: "receipt-outline" as const,
        bg: "#E8EFEA",
        color: Colors.primary,
      };
    }
    if (t.includes("review")) {
      return {
        icon: "star-outline" as const,
        bg: "#FEF3C7",
        color: "#D97706",
      };
    }
    if (t.includes("expiry") || t.includes("flag")) {
      return {
        icon: "time-outline" as const,
        bg: "#FBE4E1",
        color: "#B3261E",
      };
    }
    if (t.includes("donation")) {
      return {
        icon: "gift-outline" as const,
        bg: "#E4F0E8",
        color: "#15803D",
      };
    }
    return {
      icon: "notifications-outline" as const,
      bg: "#E8EFEA",
      color: Colors.primary,
    };
  };

  const unreadAlertsCount = notifications.filter((n) => !n.read).length;
  const unreadAnnsCount = announcements.filter((a) => !a.read).length;

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Stack.Screen options={{ animation: "none" }} />

      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              switchMerchantTab("Home");
              router.replace("/establishment/dashboard" as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary2} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Store Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Sorted from latest to oldest • Tap any alert to open
          </Text>
        </View>

        <TouchableOpacity
          style={styles.markAllBtn}
          activeOpacity={0.8}
          onPress={markAllRead}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={15}
            color={Colors.primary}
          />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "alerts" && styles.tabBtnActive,
          ]}
          activeOpacity={0.85}
          onPress={() => setActiveTab("alerts")}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "alerts" && styles.tabBtnTextActive,
            ]}
          >
            Operational Alerts ({notifications.length})
          </Text>
          {unreadAlertsCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadAlertsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "announcements" && styles.tabBtnActive,
          ]}
          activeOpacity={0.85}
          onPress={() => setActiveTab("announcements")}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "announcements" && styles.tabBtnTextActive,
            ]}
          >
            Announcements ({announcements.length})
          </Text>
          {unreadAnnsCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadAnnsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
        {loading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.emptySubtitle, { marginTop: 10 }]}>
              Loading latest store notifications...
            </Text>
          </View>
        ) : activeTab === "alerts" ? (
          notifications.length > 0 ? (
            notifications.map((item) => {
              const cfg = getIconConfig(item.type);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notifCard,
                    !item.read && styles.notifCardUnread,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handlePressNotification(item)}
                >
                  <View
                    style={[styles.iconCircle, { backgroundColor: cfg.bg }]}
                  >
                    <Ionicons name={cfg.icon} size={19} color={cfg.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => dismissNotification(item.id)}
                  >
                    <Ionicons name="close" size={16} color={Colors.icon} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="notifications-off-outline"
                  size={26}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No operational alerts yet</Text>
              <Text style={styles.emptySubtitle}>
                Customer reservations, pickup confirmations, ratings, and TTT
                expiry warnings will appear here from latest to oldest.
              </Text>
            </View>
          )
        ) : announcements.length > 0 ? (
          announcements.map((ann) => (
            <TouchableOpacity
              key={ann.id}
              style={[styles.notifCard, !ann.read && styles.notifCardUnread]}
              activeOpacity={0.85}
              onPress={() => markSingleRead(ann.id)}
            >
              <View
                style={[styles.iconCircle, { backgroundColor: "#E8EFEA" }]}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={19}
                  color={Colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.audienceBadgeText}>{ann.audience}</Text>
                  {!ann.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.cardTitle, { marginTop: 2 }]}>
                  {ann.title}
                </Text>
                <Text style={styles.cardDesc}>{ann.body}</Text>
                <Text style={styles.cardTime}>{ann.date}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="megaphone-outline"
                size={26}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No system announcements</Text>
            <Text style={styles.emptySubtitle}>
              Official broadcasts published by ReServe Admin will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: Colors.primary2,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: -2,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  markAllText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary,
  },
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: "#EBEFEB",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
  },
  tabBtnText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11.5,
    color: Colors.primary1,
  },
  tabBtnTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },
  unreadPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#B3261E",
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadPillText: {
    fontFamily: "PoppinsBold",
    fontSize: 9.5,
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    marginBottom: 10,
    gap: 11,
  },
  notifCardUnread: {
    backgroundColor: "#F4F9F6",
    borderColor: Colors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  cardDesc: {
    fontFamily: "PoppinsRegular",
    fontSize: 11.5,
    color: Colors.primary1,
    lineHeight: 17,
    marginTop: 3,
  },
  cardTime: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: Colors.placeholder,
    marginTop: 5,
  },
  audienceBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.primary,
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dismissBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 42,
    paddingHorizontal: 22,
    alignItems: "center",
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: Colors.primary2,
  },
  emptySubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
});