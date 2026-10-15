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

import { Colors } from "@/constants/color";
import { api } from "../../../services/api";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "order" | "donation" | "system" | "expiry_1hr" | "suggested_expiry";
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
      const response = await api.get('listings/notifications/');
      setNotifications(response.data);
      
      // Check if there's any urgent notification to pop up at the top banner
      const urgent = response.data.find((n: any) => (n.type === "system" || n.type === "expiry_1hr" || n.type === "suggested_expiry") && !n.read);
      if (urgent) {
        setLatestAlert(urgent.description);
        setTimeout(() => {
          setLatestAlert(null);
        }, 5000);
      }
    } catch (error) {
      console.warn("Could not fetch notifications:", error);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP POPUP BANNER ALERT */}
      {latestAlert && (
        <View style={styles.topPopupBanner}>
          <View style={styles.topPopupIconBox}>
            <Ionicons name="warning-outline" size={20} color="#B3261E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topPopupTitle}>Expiry & System Alert</Text>
            <Text style={styles.topPopupText} numberOfLines={2}>{latestAlert}</Text>
          </View>
          <TouchableOpacity onPress={() => setLatestAlert(null)}>
            <Ionicons name="close" size={18} color={Colors.primary2} />
          </TouchableOpacity>
        </View>
      )}
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Establishment Portal</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => router.replace("/establishment/notifications")}
          >
            <Ionicons name="notifications" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/establishment/profile")}
          >
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageHeaderRow}>
          <View>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>1-hr expiry warnings, suggested limits, and foodbank donations</Text>
          </View>
        </View>

        {/* NOTIFICATIONS LIST */}
        <View style={styles.notificationList}>
          {notifications.length > 0 ? (
            notifications.map((item) => {
              let iconName: any = "notifications-outline";
              let iconBg = "#E8EFEA";
              let iconColor: any = Colors.primary;

              // 1. Foodbank Donation Type
              if (item.type === "donation") {
                iconName = "gift-outline";
                iconBg = "#E7F0E9";
                iconColor = Colors.primary;
              } 
              // 2. 1-Hour Before Expiry Warning Type
              else if (item.type === "expiry_1hr") {
                iconName = "alarm-outline";
                iconBg = "#FEF3C7"; // Soft amber background
                iconColor = "#D97706"; // Amber / Orange text & icon
              } 
              // 3. Reached Suggested Expiry / Flagged Type
              else {
                iconName = "time-outline";
                iconBg = "#FBE4E1";
                iconColor = "#B3261E";
              }

              return (
                <View
                  key={item.id}
                  style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
                >
                  <View style={[styles.notificationIconBox, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationDesc}>{item.description}</Text>
                    <Text style={styles.notificationTime}>{item.time}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-outline" size={18} color={Colors.icon} />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={26} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyDescription}>You're all caught up! 1-hr alerts, expiry flags, and foodbank updates will appear here.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="grid-outline"
          label="Home"
          onPress={() => router.replace("/establishment/dashboard")}
        />
        <BottomNavItem
          icon="restaurant-outline"
          label="Listings"
          onPress={() => router.replace("/establishment/listing")}
        />
        <BottomNavItem
          icon="basket-outline"
          label="Orders"
          onPress={() => router.replace("/establishment/orders")}
        />
        <BottomNavItem
          icon="cash-outline"
          label="Earnings"
          onPress={() => router.replace("/establishment/earnings")}
        />
        <BottomNavItem
          icon="heart-outline"
          label="Donation"
          onPress={() => router.replace("/establishment/donation")}
        />
        <BottomNavItem
          icon="person-outline"
          label="Impact"
          onPress={() => router.replace("/establishment/impact")}
        />
      </View>
    </SafeAreaView>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
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
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 90 },
  pageHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, lineHeight: 31, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  markReadBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#E7F0E9", borderRadius: 8, marginTop: 4 },
  markReadText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary },
  notificationList: { gap: 10 },
  notificationCard: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: "flex-start" },
  notificationCardUnread: { backgroundColor: "#F7FBF8", borderColor: "#C5D9C9" },
  notificationIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  notificationTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13.5, color: Colors.primary2, flex: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 6 },
  notificationDesc: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, lineHeight: 17 },
  notificationTime: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, marginTop: 6 },
  deleteButton: { padding: 4, marginLeft: 8 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 45, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, textAlign: "center", marginTop: 4 },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, paddingBottom: 25, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 10, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 5, marginHorizontal: 2, borderRadius: 7 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.icon, marginTop: 4 },
  navTextActive: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary },
  topPopupBanner: {
    position: 'absolute',
    top: 60,
    left: 17,
    right: 17,
    backgroundColor: '#FBE4E1',
    borderWidth: 1,
    borderColor: '#B3261E',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  topPopupIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPopupTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 12,
    color: "#B3261E",
  },
  topPopupText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary2,
  },
});