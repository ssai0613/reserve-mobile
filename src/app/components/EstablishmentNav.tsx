import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../../services/api";

export const getAppStorage = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export const setAppStorage = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
};

export function EstablishmentHeader({ subtitle }: { subtitle?: string }) {
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadAnnounceCount, setUnreadAnnounceCount] = useState(0);
  const [portalSubtitle, setPortalSubtitle] = useState(subtitle || "Establishment Portal");

  useEffect(() => {
    checkHeaderCounts();
    const timer = setInterval(checkHeaderCounts, 4000);
    return () => clearInterval(timer);
  }, [subtitle]);

  const checkHeaderCounts = async () => {
    try {
      const mId = (await getAppStorage("profile_id")) || "1";
      const email = (await getAppStorage("user_email")) || "";
      const mType = (await getAppStorage("merch_type")) || "";

      if (!subtitle) {
        setPortalSubtitle(
          mType.toLowerCase().includes("market")
            ? "Market Vendor Portal"
            : "Establishment Portal"
        );
      }

      // 1. Calculate Unread Operational Notifications (excluding dismissed/deleted ones)
      const seenNotifsRaw = (await getAppStorage("seen_notif_ids")) || "[]";
      const dismissedNotifsRaw = (await getAppStorage("dismissed_notif_ids")) || "[]";
      const seenNotifIds: string[] = JSON.parse(seenNotifsRaw);
      const dismissedNotifIds: string[] = JSON.parse(dismissedNotifsRaw);

      const notifRes = await api.get(
        `listings/notifications/?merchant=${mId}&email=${encodeURIComponent(email)}`
      );
      const notifList = Array.isArray(notifRes.data)
        ? notifRes.data
        : notifRes.data.notifications || [];

      const activeNotifs = notifList.filter(
        (n: any) => !dismissedNotifIds.includes(String(n.id))
      );
      const unseenNotifs = activeNotifs.filter(
        (n: any) => !seenNotifIds.includes(String(n.id))
      );
      setUnreadNotifCount(unseenNotifs.length);

      // 2. Calculate Unread Admin Announcements
      const seenAnnounceRaw = (await getAppStorage("seen_announce_ids")) || "[]";
      const seenAnnounceIds: string[] = JSON.parse(seenAnnounceRaw);

      const announceRes = await api.get("listings/announcements/");
      const announceList = Array.isArray(announceRes.data) ? announceRes.data : [];
      const unseenAnnouncements = announceList.filter(
        (a: any) => !seenAnnounceIds.includes(String(a.id))
      );
      setUnreadAnnounceCount(unseenAnnouncements.length);
    } catch (e) {}
  };

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.logo}>RESERVE</Text>
        <Text style={styles.headerSubtitle}>{portalSubtitle}</Text>
      </View>

      <View style={styles.headerActions}>
        {/* SYSTEM ANNOUNCEMENTS (MEGAPHONE WITH NUMERIC BADGE) */}
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => router.push("/establishment/announcements" as any)}
        >
          <Ionicons name="megaphone-outline" size={22} color={Colors.primary} />
          {unreadAnnounceCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {unreadAnnounceCount > 99 ? "99+" : unreadAnnounceCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* OPERATIONAL NOTIFICATIONS (BELL WITH NUMERIC BADGE) */}
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => router.push("/establishment/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          {unreadNotifCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* MERCHANT PROFILE */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/establishment/profile")}
        >
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function EstablishmentBottomNav({
  activeTab,
}: {
  activeTab: "Home" | "Listings" | "Orders" | "Earnings" | "Donation" | "Impact";
}) {
  const [merchType, setMerchType] = useState("Bakeshop");

  useEffect(() => {
    getAppStorage("merch_type").then((val) => {
      if (val) setMerchType(val);
    });
  }, []);

  const goToListings = () => {
    if (merchType.toLowerCase().includes("market")) {
      router.replace("/establishment/market_listing" as any);
    } else {
      router.replace("/establishment/listing");
    }
  };

  return (
    <View style={styles.bottomNav}>
      <BottomNavItem
        icon={activeTab === "Home" ? "grid" : "grid-outline"}
        label="Home"
        active={activeTab === "Home"}
        onPress={() => router.replace("/establishment/dashboard")}
      />
      <BottomNavItem
        icon={activeTab === "Listings" ? "restaurant" : "restaurant-outline"}
        label="Listings"
        active={activeTab === "Listings"}
        onPress={goToListings}
      />
      <BottomNavItem
        icon={activeTab === "Orders" ? "basket" : "basket-outline"}
        label="Orders"
        active={activeTab === "Orders"}
        onPress={() => router.replace("/establishment/orders")}
      />
      <BottomNavItem
        icon={activeTab === "Earnings" ? "cash" : "cash-outline"}
        label="Earnings"
        active={activeTab === "Earnings"}
        onPress={() => router.replace("/establishment/earnings")}
      />
      <BottomNavItem
        icon={activeTab === "Donation" ? "heart" : "heart-outline"}
        label="Donation"
        active={activeTab === "Donation"}
        onPress={() => router.replace("/establishment/donation")}
      />
      <BottomNavItem
        icon={activeTab === "Impact" ? "person" : "person-outline"}
        label="Impact"
        active={activeTab === "Impact"}
        onPress={() => router.replace("/establishment/impact")}
      />
    </View>
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
      <Ionicons
        name={icon}
        size={24}
        color={active ? Colors.primary : Colors.icon}
      />
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    gap: 14,
  },
  headerIconButton: {
    position: "relative",
    padding: 5,
  },
  countBadge: {
    position: "absolute",
    top: -2,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#B3261E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  countBadgeText: {
    fontFamily: "PoppinsBold",
    fontSize: 9,
    color: Colors.white,
    lineHeight: 11,
  },
  profileCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
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
    fontSize: 11,
    color: Colors.primary,
  },
});

export default EstablishmentHeader;