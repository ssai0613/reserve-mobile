import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  DeviceEventEmitter,
  Modal,
  Pressable,
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
  FOODBANK_DISMISSED_NOTIFS_KEY,
  FOODBANK_READ_NOTIFS_KEY,
  getFoodBankStorage,
} from "../components/FoodBankNav";

type FoodBankNotifItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  sort_ts?: number;
  target_route?: string;
  audience?: string;
  type: "request" | "donation" | "announcement";
};

export default function FoodBankNotifications() {
  const [orgId, setOrgId] = useState("1");
  const [activeTab, setActiveTab] = useState<"activity" | "announcements">(
    "activity"
  );
  const [activityItems, setActivityItems] = useState<FoodBankNotifItem[]>([]);
  const [announcementItems, setAnnouncementItems] = useState<
    FoodBankNotifItem[]
  >([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] =
    useState<FoodBankNotifItem | null>(null);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const storedId = (await getFoodBankStorage("profile_id")) || "1";
      const storedEmail = (await getFoodBankStorage("user_email")) || "";
      setOrgId(storedId);

      const [actRes, annRes, savedReads, savedDismissed] = await Promise.all([
        api
          .get(
            `donations/activity/?org_id=${storedId}&email=${encodeURIComponent(
              storedEmail
            )}`
          )
          .catch(() => ({ data: [] })),
        api
          .get(
            `donations/announcements/?org_id=${storedId}&email=${encodeURIComponent(
              storedEmail
            )}`
          )
          .catch(() => ({ data: [] })),
        AsyncStorage.getItem(`${FOODBANK_READ_NOTIFS_KEY}_${storedId}`),
        AsyncStorage.getItem(`${FOODBANK_DISMISSED_NOTIFS_KEY}_${storedId}`),
      ]);

      let rSet = new Set<string>();
      if (savedReads) {
        try {
          rSet = new Set(JSON.parse(savedReads));
        } catch (e) {}
      }
      setReadIds(rSet);

      let dSet = new Set<string>();
      if (savedDismissed) {
        try {
          dSet = new Set(JSON.parse(savedDismissed));
        } catch (e) {}
      }
      setDismissedIds(dSet);

      const rawAct = Array.isArray(actRes.data) ? actRes.data : [];
      const formattedActivity: FoodBankNotifItem[] = rawAct
        .filter((item: any) => !dSet.has(String(item.id)))
        .map((item: any) => ({
          id: String(item.id),
          title: item.title || "Notification",
          detail: item.detail || "",
          time: item.time || "Recent",
          sort_ts: Number(item.sort_ts || 0),
          target_route: item.target_route,
          type: (item.type === "request" ? "request" : "donation") as
            | "request"
            | "donation",
        }))
        .sort((a, b) => Number(b.sort_ts || 0) - Number(a.sort_ts || 0));

      const rawAnn = Array.isArray(annRes.data) ? annRes.data : [];
      const formattedAnns: FoodBankNotifItem[] = rawAnn
        .map((b: any) => ({
          id: String(b.id),
          title: b.title || "System Announcement",
          detail: b.body || "",
          audience: b.audience || "Food Bank Partners",
          time: b.date || "Official Broadcast",
          sort_ts: Number(b.sort_ts || 0),
          type: "announcement" as const,
        }))
        .sort((a, b) => Number(b.sort_ts || 0) - Number(a.sort_ts || 0));

      setActivityItems(formattedActivity);
      setAnnouncementItems(formattedAnns);
    } catch (error) {
      console.warn("Could not fetch Food Bank notifications:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeds();
    setRefreshing(false);
  };

  const persistReadSet = async (nextSet: Set<string>) => {
    setReadIds(new Set(nextSet));
    await AsyncStorage.setItem(
      `${FOODBANK_READ_NOTIFS_KEY}_${orgId}`,
      JSON.stringify(Array.from(nextSet))
    );
    DeviceEventEmitter.emit("fb_notifs_updated");
  };

  const markSingleRead = async (id: string) => {
    const next = new Set(readIds);
    next.add(String(id));
    await persistReadSet(next);
  };

  const handleMarkAllAsRead = async () => {
    const next = new Set(readIds);
    activityItems.forEach((n) => next.add(String(n.id)));
    announcementItems.forEach((a) => next.add(String(a.id)));
    await persistReadSet(next);
  };

  const deleteNotification = async (id: string) => {
    setActivityItems((prev) => prev.filter((item) => item.id !== id));
    const nextDismissed = new Set(dismissedIds);
    nextDismissed.add(String(id));
    setDismissedIds(nextDismissed);
    await AsyncStorage.setItem(
      `${FOODBANK_DISMISSED_NOTIFS_KEY}_${orgId}`,
      JSON.stringify(Array.from(nextDismissed))
    );
    DeviceEventEmitter.emit("fb_notifs_updated");
  };

  const handleNotificationPress = async (item: FoodBankNotifItem) => {
    await markSingleRead(item.id);

    if (item.type === "announcement") {
      setSelectedBroadcast(item);
      return;
    }
    if (item.target_route) {
      router.push(item.target_route as any);
      return;
    }
    if (item.type === "request") {
      router.push("/foodbank/requests");
    } else {
      router.push("/foodbank/donations");
    }
  };

  const unreadActivityCount = useMemo(
    () => activityItems.filter((n) => !readIds.has(String(n.id))).length,
    [activityItems, readIds]
  );

  const unreadAnnouncementsCount = useMemo(
    () => announcementItems.filter((a) => !readIds.has(String(a.id))).length,
    [announcementItems, readIds]
  );

  const displayedList =
    activeTab === "activity" ? activityItems : announcementItems;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* STATUS-BAR-SAFE HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/foodbank/dashboard" as any);
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Notifications &amp; Updates</Text>
          <Text style={styles.headerSubtitle}>
            Sorted latest to oldest • Tap any item to open
          </Text>
        </View>

        <TouchableOpacity
          style={styles.markAllBtn}
          activeOpacity={0.75}
          onPress={handleMarkAllAsRead}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={15}
            color={Colors.primary}
          />
          <Text style={styles.markAllBtnText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {/* DEDICATED TABS: NOTIFICATIONS vs. SYSTEM ANNOUNCEMENTS */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "activity" && styles.tabButtonActive,
          ]}
          activeOpacity={0.85}
          onPress={() => setActiveTab("activity")}
        >
          <Ionicons
            name="notifications-outline"
            size={15}
            color={activeTab === "activity" ? Colors.white : Colors.primary2}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "activity" && styles.tabButtonTextActive,
            ]}
          >
            Notifications ({activityItems.length})
          </Text>
          {unreadActivityCount > 0 && (
            <View
              style={[
                styles.tabUnreadPill,
                activeTab === "activity" && { backgroundColor: Colors.white },
              ]}
            >
              <Text
                style={[
                  styles.tabUnreadPillText,
                  activeTab === "activity" && { color: Colors.primary },
                ]}
              >
                {unreadActivityCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "announcements" && styles.tabButtonActive,
          ]}
          activeOpacity={0.85}
          onPress={() => setActiveTab("announcements")}
        >
          <Ionicons
            name="megaphone-outline"
            size={15}
            color={
              activeTab === "announcements" ? Colors.white : Colors.primary2
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "announcements" && styles.tabButtonTextActive,
            ]}
          >
            Announcements ({announcementItems.length})
          </Text>
          {unreadAnnouncementsCount > 0 && (
            <View
              style={[
                styles.tabUnreadPill,
                activeTab === "announcements" && {
                  backgroundColor: Colors.white,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabUnreadPillText,
                  activeTab === "announcements" && { color: Colors.primary },
                ]}
              >
                {unreadAnnouncementsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {displayedList.length > 0 ? (
          displayedList.map((item, idx) => {
            const isRead = readIds.has(String(item.id));
            const iconName =
              item.type === "announcement"
                ? "megaphone-outline"
                : item.type === "request"
                ? "document-text-outline"
                : "gift-outline";

            return (
              <TouchableOpacity
                key={item.id || idx}
                style={[
                  styles.notificationCard,
                  isRead ? styles.cardRead : styles.cardUnread,
                ]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    !isRead && {
                      backgroundColor: Colors.primary,
                      borderColor: Colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName as any}
                    size={19}
                    color={!isRead ? Colors.white : Colors.primary}
                  />
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        !isRead && { fontFamily: "PoppinsBold" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    <View
                      style={[
                        styles.stateBadge,
                        isRead
                          ? styles.stateBadgeRead
                          : styles.stateBadgeUnread,
                      ]}
                    >
                      {!isRead && <View style={styles.unreadDot} />}
                      <Text
                        style={[
                          styles.stateBadgeText,
                          isRead
                            ? styles.stateBadgeTextRead
                            : styles.stateBadgeTextUnread,
                        ]}
                      >
                        {isRead ? "Read ✓" : "NEW"}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.notificationText,
                      !isRead && { color: Colors.primary2 },
                    ]}
                  >
                    {item.detail}
                  </Text>

                  <View style={styles.footerRow}>
                    <View style={styles.timeRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={Colors.icon}
                      />
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={styles.openHintText}>
                        {item.type === "announcement"
                          ? "Read Broadcast →"
                          : "Open →"}
                      </Text>
                      {item.type !== "announcement" && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            deleteNotification(item.id);
                          }}
                          style={{ padding: 2 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={Colors.icon}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons
              name={
                activeTab === "announcements"
                  ? "megaphone-outline"
                  : "notifications-off-outline"
              }
              size={32}
              color={Colors.icon}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === "announcements"
                ? "No system announcements yet"
                : "No notifications yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "announcements"
                ? "Official broadcasts from ReServe Admin will appear here."
                : "Updates on your donation appeals and merchant surplus postings will appear here."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ANNOUNCEMENT DETAIL MODAL */}
      <Modal
        visible={!!selectedBroadcast}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBroadcast(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedBroadcast(null)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalBadge}>
                <Ionicons
                  name="megaphone-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.modalBadgeText}>
                  {selectedBroadcast?.audience || "Official Broadcast"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBroadcast(null)}>
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>{selectedBroadcast?.title}</Text>
            <Text style={styles.modalTime}>{selectedBroadcast?.time}</Text>
            <Text style={styles.modalBody}>{selectedBroadcast?.detail}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedBroadcast(null)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: { flex: 1, marginLeft: 10, marginRight: 8 },
  headerTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
    marginTop: -1,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  markAllBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
  tabsWrapper: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
  },
  tabButtonTextActive: {
    color: Colors.white,
  },
  tabUnreadPill: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#B3261E",
    alignItems: "center",
    justifyContent: "center",
  },
  tabUnreadPillText: {
    fontFamily: "PoppinsBold",
    fontSize: 9,
    color: Colors.white,
  },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 32 },
  notificationCard: {
    width: "100%",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardUnread: {
    backgroundColor: "#E8EFEA",
    borderColor: "#3A826D",
    borderWidth: 1.2,
  },
  cardRead: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    opacity: 0.85,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    marginTop: 2,
  },
  notificationContent: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 3,
  },
  notificationTitle: {
    flex: 1,
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stateBadgeUnread: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#3A826D",
  },
  stateBadgeRead: {
    backgroundColor: "#F3F6F4",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3A826D",
  },
  stateBadgeText: {
    fontFamily: "PoppinsBold",
    fontSize: 8.5,
  },
  stateBadgeTextUnread: {
    color: Colors.primary,
  },
  stateBadgeTextRead: {
    color: Colors.primary1,
    fontFamily: "PoppinsMedium",
  },
  notificationText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    lineHeight: 16,
    color: Colors.primary1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary1,
  },
  openHintText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
  emptyBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 42,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13.5,
    color: Colors.primary2,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18,55,44,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: Colors.primary2,
  },
  modalTime: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.icon,
    marginTop: 2,
    marginBottom: 10,
  },
  modalBody: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalCloseBtn: {
    height: 44,
    backgroundColor: Colors.button,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
});