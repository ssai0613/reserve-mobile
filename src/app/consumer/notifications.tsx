import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import {
  DeviceEventEmitter,
  Modal,
  Platform,
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
  CONSUMER_READ_NOTIFS_KEY,
  switchConsumerTab,
} from "../components/ConsumerNav";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function Notifications() {
  const [consId, setConsId] = useState("1");
  const [activeTab, setActiveTab] = useState<"activity" | "announcements">(
    "activity"
  );
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(
    null
  );

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setConsId(storedId);

      const [res, savedReads] = await Promise.all([
        api.get(
          `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(
            storedEmail
          )}`
        ),
        AsyncStorage.getItem(`${CONSUMER_READ_NOTIFS_KEY}_${storedId}`),
      ]);

      if (savedReads) {
        try {
          setReadIds(new Set(JSON.parse(savedReads)));
        } catch (e) {}
      }

      const rawList = Array.isArray(res.data?.notifications)
        ? res.data.notifications
        : [];
      // Sort strictly latest to oldest
      const sorted = [...rawList].sort(
        (a, b) => Number(b.sort_ts || 0) - Number(a.sort_ts || 0)
      );
      setNotifications(sorted);
    } catch (e) {
      console.log("Error loading consumer notifications:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const persistReadIds = async (nextSet: Set<string>) => {
    setReadIds(new Set(nextSet));
    await AsyncStorage.setItem(
      `${CONSUMER_READ_NOTIFS_KEY}_${consId}`,
      JSON.stringify(Array.from(nextSet))
    );
    DeviceEventEmitter.emit("consumer_notifs_updated");
  };

  const markSingleRead = async (id: string) => {
    const next = new Set(readIds);
    next.add(String(id));
    await persistReadIds(next);
  };

  const handleMarkAllAsRead = async () => {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(String(n.id)));
    await persistReadIds(next);
  };

  const activityList = useMemo(
    () => notifications.filter((n) => n.type !== "announcement"),
    [notifications]
  );

  const announcementsList = useMemo(
    () => notifications.filter((n) => n.type === "announcement"),
    [notifications]
  );

  const unreadActivityCount = useMemo(
    () => activityList.filter((n) => !readIds.has(String(n.id))).length,
    [activityList, readIds]
  );

  const unreadAnnouncementsCount = useMemo(
    () => announcementsList.filter((n) => !readIds.has(String(n.id))).length,
    [announcementsList, readIds]
  );

  const displayedList =
    activeTab === "activity" ? activityList : announcementsList;

  const handlePressItem = async (item: any) => {
    await markSingleRead(String(item.id));
    if (item.type === "announcement") {
      setSelectedAnnouncement(item);
      return;
    }

    const route = String(item.target_route || "/consumer/claims");
    if (route.includes("/consumer/homepage")) {
      switchConsumerTab("Home");
    } else if (route.includes("/consumer/cart")) {
      switchConsumerTab("Cart");
    } else if (route.includes("/consumer/profile")) {
      switchConsumerTab("Profile");
    } else {
      DeviceEventEmitter.emit("consumer_claims_updated");
      switchConsumerTab("Claims");
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/consumer/claims" as any);
    }
  };

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
            else router.replace("/consumer/homepage" as any);
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

      {/* DEDICATED TABS: ACTIVITY NOTIFICATIONS vs. SYSTEM ANNOUNCEMENTS */}
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
            Notifications ({activityList.length})
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
            Announcements ({announcementsList.length})
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
          displayedList.map((n, idx) => {
            const isRead = readIds.has(String(n.id));
            return (
              <TouchableOpacity
                key={n.id || idx}
                style={[
                  styles.notificationCard,
                  isRead ? styles.cardRead : styles.cardUnread,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePressItem(n)}
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
                    name={
                      n.type === "announcement"
                        ? "megaphone-outline"
                        : n.icon || "notifications-outline"
                    }
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
                      {n.title}
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
                    {n.text}
                  </Text>

                  <View style={styles.footerRow}>
                    <View style={styles.timeRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={Colors.icon}
                      />
                      <Text style={styles.timeText}>{n.time}</Text>
                    </View>
                    <Text style={styles.openHintText}>
                      {n.type === "announcement"
                        ? "Read Broadcast →"
                        : "Open Claim →"}
                    </Text>
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
                ? "No announcements published yet"
                : "No activity notifications yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "announcements"
                ? "Official broadcasts from ReServe Admin will appear here."
                : "Reserve a surplus food listing to receive live order updates!"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ANNOUNCEMENT DETAIL MODAL */}
      <Modal
        visible={!!selectedAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedAnnouncement(null)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalBadge}>
                <Ionicons
                  name="megaphone-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.modalBadgeText}>Official Broadcast</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>
              {selectedAnnouncement?.title}
            </Text>
            <Text style={styles.modalTime}>{selectedAnnouncement?.time}</Text>
            <Text style={styles.modalBody}>{selectedAnnouncement?.text}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedAnnouncement(null)}
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