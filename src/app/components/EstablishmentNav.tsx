import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../services/api";

export const MERCHANT_READ_NOTIFS_KEY = "@reserve_merchant_read_notifs";
export const MERCHANT_DISMISSED_NOTIFS_KEY = "@reserve_merchant_dismissed_notifs";

export const getAppStorage = async (key: string): Promise<string | null> => {
  if (!key || typeof key !== "string" || key.trim() === "") return null;
  if (Platform.OS === "web") return localStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return null;
  }
};

export const setAppStorage = async (
  key: string,
  value: string
): Promise<void> => {
  if (!key || typeof key !== "string" || key.trim() === "") return;
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {}
  }
};

export function EstablishmentHeader() {
  const pathname = usePathname();
  const [busName, setBusName] = useState("Merchant Portal");
  const [merchType, setMerchType] = useState("Establishment");
  const [unreadTotalCount, setUnreadTotalCount] = useState(0);

  useEffect(() => {
    loadHeaderData();
    const interval = setInterval(loadHeaderData, 4000);

    const sub = DeviceEventEmitter.addListener("merchant_notifs_updated", () => {
      loadHeaderData();
    });
    const profSub = DeviceEventEmitter.addListener(
      "merchant_profile_updated",
      () => {
        loadHeaderData();
      }
    );

    return () => {
      clearInterval(interval);
      sub.remove();
      profSub.remove();
    };
  }, []);

  const loadHeaderData = async () => {
    try {
      const storedId = (await getAppStorage("profile_id")) || "1";
      const storedEmail = (await getAppStorage("user_email")) || "";
      const storedName = (await getAppStorage("entity_name")) || "";
      const storedType = (await getAppStorage("merch_type")) || "Establishment";

      if (storedName) setBusName(storedName);
      if (storedType) setMerchType(storedType);

      const [notifRes, annRes, rawReadIds, rawDismissedIds] = await Promise.all([
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
      if (rawReadIds) {
        try {
          readSet = new Set(JSON.parse(rawReadIds));
        } catch (e) {}
      }

      let dismissedSet = new Set<string>();
      if (rawDismissedIds) {
        try {
          dismissedSet = new Set(JSON.parse(rawDismissedIds));
        } catch (e) {}
      }

      const rawNotifs = Array.isArray(notifRes.data)
        ? notifRes.data
        : notifRes.data?.notifications || [];
      const rawAnns = Array.isArray(annRes.data) ? annRes.data : [];

      const activeNotifs = rawNotifs.filter(
        (n: any) => !dismissedSet.has(String(n.id))
      );
      const unreadNotifs = activeNotifs.filter(
        (n: any) => !readSet.has(String(n.id))
      );
      const unreadAnns = rawAnns.filter(
        (a: any) => !readSet.has(String(a.id))
      );

      setUnreadTotalCount(unreadNotifs.length + unreadAnns.length);
    } catch (e) {}
  };

  const isProfileActive = pathname?.includes("/establishment/profile");

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.brandTouchable}
        activeOpacity={0.75}
        onPress={() => router.replace("/establishment/dashboard" as any)}
      >
        <View style={styles.brandIconBox}>
          <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.logo} numberOfLines={1}>
            RESERVE
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {busName} • {merchType}
          </Text>
        </View>
      </TouchableOpacity>

      {/* FUSED SINGLE NOTIFICATION BELL + PROFILE BUTTON */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          activeOpacity={0.75}
          onPress={() => router.push("/establishment/notifications" as any)}
        >
          <Ionicons
            name="notifications-outline"
            size={21}
            color={Colors.primary}
          />
          {unreadTotalCount > 0 && (
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountBadgeText}>
                {unreadTotalCount > 99 ? "99+" : unreadTotalCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.profileBtn,
            isProfileActive && styles.profileBtnActive,
          ]}
          activeOpacity={0.8}
          onPress={() => router.replace("/establishment/profile" as any)}
        >
          <Ionicons
            name={isProfileActive ? "person" : "person-outline"}
            size={18}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function EstablishmentBottomNav({
  activeTab,
}: {
  activeTab?:
    | "Home"
    | "Listings"
    | "Orders"
    | "Donation"
    | "Earnings"
    | "Impact"
    | "Profile";
}) {
  const insets = useSafeAreaInsets();
  const [merchType, setMerchType] = useState("Bakeshop");

  useEffect(() => {
    getAppStorage("merch_type").then((t) => {
      if (t) setMerchType(t);
    });
  }, []);

  const bottomInsetPad = Platform.OS === "ios" ? Math.max(insets.bottom, 6) : 6;
  const listingsRoute = merchType.toLowerCase().includes("market")
    ? "/establishment/market_listing"
    : "/establishment/listing";

  return (
    <View
      style={[
        styles.bottomNav,
        {
          height: 56 + bottomInsetPad,
          paddingBottom: bottomInsetPad,
        },
      ]}
    >
      <BottomNavItem
        icon={activeTab === "Home" ? "home" : "home-outline"}
        label="Home"
        active={activeTab === "Home"}
        onPress={() => router.replace("/establishment/dashboard" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Listings" ? "restaurant" : "restaurant-outline"}
        label="Listings"
        active={activeTab === "Listings"}
        onPress={() => router.replace(listingsRoute as any)}
      />
      <BottomNavItem
        icon={activeTab === "Orders" ? "receipt" : "receipt-outline"}
        label="Orders"
        active={activeTab === "Orders"}
        onPress={() => router.replace("/establishment/orders" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Donation" ? "gift" : "gift-outline"}
        label="Donation"
        active={activeTab === "Donation"}
        onPress={() => router.replace("/establishment/donation" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Earnings" ? "wallet" : "wallet-outline"}
        label="Earnings"
        active={activeTab === "Earnings"}
        onPress={() => router.replace("/establishment/earnings" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Impact" ? "leaf" : "leaf-outline"}
        label="Impact"
        active={activeTab === "Impact"}
        onPress={() => router.replace("/establishment/impact" as any)}
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
        size={20}
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
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 9,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: -2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 8.5,
    backgroundColor: "#B3261E",
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCountBadgeText: {
    fontFamily: "PoppinsBold",
    fontSize: 8.5,
    color: Colors.white,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtnActive: {
    backgroundColor: Colors.button,
    borderWidth: 2,
    borderColor: "#8BC3A3",
  },
  bottomNav: {
    backgroundColor: Colors.white,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 4,
    paddingTop: 4,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 4,
  },
  navItemActive: {
    backgroundColor: "#E8EFEA",
  },
  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.icon,
    marginTop: 1,
  },
  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.primary,
  },
});