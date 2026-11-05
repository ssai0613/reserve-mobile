import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import { getAppStorage, setAppStorage } from "../components/EstablishmentNav";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  sort_ts?: number;
  target_route?: string;
  type: "order" | "review" | "donation" | "system" | "expiry_1hr" | "suggested_expiry";
  read: boolean;
};

export default function EstablishmentNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestAlert, setLatestAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const merchId = (await getAppStorage("profile_id")) || "1";
      const email = (await getAppStorage("user_email")) || "";
      const seenRaw = (await getAppStorage("seen_notif_ids")) || "[]";
      const dismissedRaw = (await getAppStorage("dismissed_notif_ids")) || "[]";
      const seenIds: string[] = JSON.parse(seenRaw);
      const dismissedIds: string[] = JSON.parse(dismissedRaw);

      const response = await api.get(
        `listings/notifications/?merchant=${merchId}&email=${encodeURIComponent(email)}`
      );
      const rawList: NotificationItem[] = Array.isArray(response.data)
        ? response.data
        : response.data.notifications || [];

      const visibleList = rawList.filter(
        (item) => !dismissedIds.includes(String(item.id))
      );

      // Ensure latest notifications are strictly at the top
      visibleList.sort((a, b) => Number(b.sort_ts || 0) - Number(a.sort_ts || 0));

      const processed = visibleList.map((item) => ({
        ...item,
        read: seenIds.includes(String(item.id)),
      }));

      setNotifications(processed);

      const brandNewUrgent = processed.find(
        (n) =>
          (n.type === "system" ||
            n.type === "expiry_1hr" ||
            n.type === "suggested_expiry") &&
          !n.read
      );

      if (brandNewUrgent) {
        setLatestAlert(brandNewUrgent.description);
        setTimeout(() => setLatestAlert(null), 4500);
      }

      const updatedSeen = Array.from(
        new Set([...seenIds, ...visibleList.map((i) => String(i.id))])
      );
      await setAppStorage("seen_notif_ids", JSON.stringify(updatedSeen));
    } catch (error) {
      console.warn("Could not fetch notifications:", error);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.target_route) {
      router.push(item.target_route as any);
      return;
    }
    if (item.type === "order") {
      router.push("/establishment/orders");
    } else if (item.type === "review") {
      router.push("/establishment/impact");
    } else if (item.type === "donation") {
      router.push("/establishment/donation");
    } else if (item.type === "expiry_1hr" || item.type === "suggested_expiry") {
      const mType = (await getAppStorage("merch_type")) || "";
      if (mType.toLowerCase().includes("market")) {
        router.push("/establishment/market_listing" as any);
      } else {
        router.push("/establishment/listing");
      }
    } else {
      router.push("/establishment/profile");
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    try {
      const dismissedRaw = (await getAppStorage("dismissed_notif_ids")) || "[]";
      const dismissedIds: string[] = JSON.parse(dismissedRaw);
      const updatedDismissed = Array.from(new Set([...dismissedIds, String(id)]));
      await setAppStorage("dismissed_notif_ids", JSON.stringify(updatedDismissed));
    } catch (e) {}
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/establishment/dashboard");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "slide_from_right", headerShown: false }} />

      {latestAlert && (
        <View style={styles.topPopupBanner}>
          <View style={styles.topPopupIconBox}>
            <Ionicons name="warning-outline" size={20} color="#B3261E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topPopupTitle}>New Expiry / Compliance Alert</Text>
            <Text style={styles.topPopupText} numberOfLines={2}>
              {latestAlert}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setLatestAlert(null)}>
            <Ionicons name="close" size={18} color={Colors.primary2} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Sorted latest first • Tap any alert to open its module
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.notificationList}>
          {notifications.length > 0 ? (
            notifications.map((item) => {
              let iconName: any = "notifications-outline";
              let iconBg = "#E8EFEA";
              let iconColor: any = Colors.primary;

              if (item.type === "donation") {
                iconName = "gift-outline";
                iconBg = "#E7F0E9";
                iconColor = Colors.primary;
              } else if (item.type === "review") {
                iconName = "star";
                iconBg = "#FEF3C7";
                iconColor = "#D97706";
              } else if (item.type === "expiry_1hr") {
                iconName = "alarm-outline";
                iconBg = "#FEF3C7";
                iconColor = "#D97706";
              } else if (item.type === "suggested_expiry") {
                iconName = "time-outline";
                iconBg = "#FBE4E1";
                iconColor = "#B3261E";
              } else if (item.type === "system") {
                iconName = "shield-checkmark-outline";
                iconBg = "#E8EFEA";
                iconColor = Colors.primary2;
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleNotificationPress(item)}
                  style={[
                    styles.notificationCard,
                    !item.read && styles.notificationCardUnread,
                  ]}
                >
                  <View
                    style={[
                      styles.notificationIconBox,
                      { backgroundColor: iconBg },
                    ]}
                  >
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationDesc}>
                      {item.description}
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <Text style={styles.notificationTime}>{item.time}</Text>
                      <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary }}>
                        Open →
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      deleteNotification(item.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close-outline"
                      size={20}
                      color={Colors.icon}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-off-outline"
                  size={26}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyDescription}>
                You're all caught up! Orders, reviews, expiry alerts, and foodbank
                updates will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { minHeight: 70, backgroundColor: Colors.background, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "PoppinsBold", fontSize: 19, color: Colors.primary2 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: -2 },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 40 },
  notificationList: { gap: 10 },
  notificationCard: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: "flex-start" },
  notificationCardUnread: { backgroundColor: "#F7FBF8", borderColor: "#C5D9C9" },
  notificationIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  notificationTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13.5, color: Colors.primary2, flex: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 6 },
  notificationDesc: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, lineHeight: 17 },
  notificationTime: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder },
  deleteButton: { padding: 4, marginLeft: 8 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 45, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, textAlign: "center", marginTop: 4 },
  topPopupBanner: { position: "absolute", top: 75, left: 17, right: 17, backgroundColor: "#FBE4E1", borderWidth: 1, borderColor: "#B3261E", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 9999, elevation: 6 },
  topPopupIconBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  topPopupTitle: { fontFamily: "PoppinsBold", fontSize: 12, color: "#B3261E" },
  topPopupText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary2 },
});