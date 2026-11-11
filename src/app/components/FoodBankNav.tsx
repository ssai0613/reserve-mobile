import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { api } from "../../../services/api";

export type FoodBankTabName =
  | "Home"
  | "Requests"
  | "Donations"
  | "Partners"
  | "Profile";

// Indicates whether a Food Bank tab is rendered inside the persistent _layout.tsx shell
export const FoodBankShellDirectRenderContext = createContext<boolean>(false);

export const useIsInsideFoodBankShell = () =>
  useContext(FoodBankShellDirectRenderContext);

// Instant 0ms tab switcher (no full page reload)
export const switchFoodBankTab = (tab: FoodBankTabName) => {
  DeviceEventEmitter.emit("fb_switch_tab", { tab });
};

export const FOODBANK_READ_NOTIFS_KEY = "@reserve_fb_read_notifs";
export const FOODBANK_DISMISSED_NOTIFS_KEY = "@reserve_fb_dismissed_notifs";

export const getFoodBankStorage = async (
  key: string
): Promise<string | null> => {
  if (!key || typeof key !== "string" || key.trim() === "") return null;
  if (Platform.OS === "web") return localStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return null;
  }
};

export const setFoodBankStorage = async (
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

export function FoodBankMapModal({
  visible,
  shopName,
  address,
  lat,
  lng,
  onClose,
}: {
  visible: boolean;
  shopName: string;
  address: string;
  lat: number;
  lng: number;
  onClose: () => void;
}) {
  const safeLat = Number(lat) || 10.3157;
  const safeLng = Number(lng) || 123.8854;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; -webkit-touch-callout: none; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true, tap: false }).setView([${safeLat}, ${safeLng}], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);
        var marker = L.marker([${safeLat}, ${safeLng}]).addTo(map);
        marker.bindPopup("<b>${(shopName || "Merchant").replace(/"/g, "")}</b><br>${(address || "Cebu City").replace(/"/g, "")}").openPopup();
      </script>
    </body>
    </html>
  `;

  const openExternalMaps = () => {
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`;
    const iosUrl = `maps:0,0?q=${encodeURIComponent(
      shopName || "Merchant"
    )}@${safeLat},${safeLng}`;
    if (Platform.OS === "web") {
      window.open(googleUrl, "_blank");
    } else if (Platform.OS === "ios") {
      Linking.openURL(iosUrl).catch(() => Linking.openURL(googleUrl));
    } else {
      Linking.openURL(googleUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayBottom}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {shopName}
              </Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {address} ({safeLat.toFixed(4)}° N, {safeLng.toFixed(4)}° E)
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={Colors.primary2} />
            </TouchableOpacity>
          </View>

          <View
            style={{ height: 270, width: "100%", backgroundColor: "#E8EFEA" }}
          >
            {Platform.OS === "web" ? (
              React.createElement("iframe", {
                srcDoc: mapHtml,
                style: { width: "100%", height: "100%", border: "none" },
                title: "Merchant Location Map",
              })
            ) : (
              <WebView
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}
          </View>

          <View style={{ padding: 14, flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={openExternalMaps}
            >
              <Ionicons
                name="navigate-outline"
                size={16}
                color={Colors.white}
              />
              <Text style={styles.primaryBtnText}>Open in Maps App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { flex: 0.45 }]}
              onPress={onClose}
            >
              <Text style={styles.secondaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FoodBankHeader({
  subtitle,
  isShellHeader = false,
  activeTab,
  onSelectTab,
}: {
  subtitle?: string;
  isShellHeader?: boolean;
  activeTab?: FoodBankTabName;
  onSelectTab?: (tab: FoodBankTabName) => void;
}) {
  const isInsideShell = useIsInsideFoodBankShell();
  if (isInsideShell && !isShellHeader) return null;

  const pathname = usePathname();
  const [orgName, setOrgName] = useState("Food Bank & NGO Portal");
  const [unreadTotalCount, setUnreadTotalCount] = useState(0);

  useEffect(() => {
    fetchHeaderCounts();
    const timer = setInterval(fetchHeaderCounts, 4000);

    const notifSub = DeviceEventEmitter.addListener("fb_notifs_updated", () => {
      fetchHeaderCounts();
    });
    const profSub = DeviceEventEmitter.addListener("fb_profile_updated", () => {
      fetchHeaderCounts();
    });

    return () => {
      clearInterval(timer);
      notifSub.remove();
      profSub.remove();
    };
  }, []);

  const fetchHeaderCounts = async () => {
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      const storedName = (await getFoodBankStorage("entity_name")) || "";
      if (storedName) setOrgName(storedName);

      const [actRes, annRes, rawReadIds, rawDismissedIds] = await Promise.all([
        api
          .get(
            `donations/activity/?org_id=${orgId}&email=${encodeURIComponent(
              email
            )}`
          )
          .catch(() => ({ data: [] })),
        api
          .get(
            `donations/announcements/?org_id=${orgId}&email=${encodeURIComponent(
              email
            )}`
          )
          .catch(() => ({ data: [] })),
        AsyncStorage.getItem(`${FOODBANK_READ_NOTIFS_KEY}_${orgId}`),
        AsyncStorage.getItem(`${FOODBANK_DISMISSED_NOTIFS_KEY}_${orgId}`),
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

      const actList = Array.isArray(actRes.data) ? actRes.data : [];
      const annList = Array.isArray(annRes.data) ? annRes.data : [];

      const activeNotifs = actList.filter(
        (i: any) => !dismissedSet.has(String(i.id))
      );
      const unreadNotifs = activeNotifs.filter(
        (i: any) => !readSet.has(String(i.id))
      );
      const unreadAnns = annList.filter(
        (a: any) => !readSet.has(String(a.id))
      );

      setUnreadTotalCount(unreadNotifs.length + unreadAnns.length);
    } catch (e) {}
  };

  const isProfileActive =
    activeTab === "Profile" || pathname?.includes("/foodbank/profile");

  const handleGoHome = () => {
    if (onSelectTab) {
      onSelectTab("Home");
    } else {
      switchFoodBankTab("Home");
      router.replace("/foodbank/dashboard" as any);
    }
  };

  const handleGoProfile = () => {
    if (onSelectTab) {
      onSelectTab("Profile");
    } else {
      switchFoodBankTab("Profile");
      router.replace("/foodbank/profile" as any);
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.brandTouchable}
        activeOpacity={0.75}
        onPress={handleGoHome}
      >
        <View style={styles.brandIconBox}>
          <Ionicons name="heart-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.logo} numberOfLines={1}>
            RESERVE
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle || orgName}
          </Text>
        </View>
      </TouchableOpacity>

      {/* FUSED SINGLE NOTIFICATION BELL + PROFILE BUTTON */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          activeOpacity={0.75}
          onPress={() => router.push("/foodbank/notifications" as any)}
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
          onPress={handleGoProfile}
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

export function FoodBankBottomNav({
  activeTab,
  isShellNav = false,
  onSelectTab,
}: {
  activeTab?: FoodBankTabName;
  isShellNav?: boolean;
  onSelectTab?: (tab: FoodBankTabName) => void;
}) {
  const isInsideShell = useIsInsideFoodBankShell();
  if (isInsideShell && !isShellNav) return null;

  const insets = useSafeAreaInsets();
  const bottomInsetPad = Platform.OS === "ios" ? Math.max(insets.bottom, 6) : 6;

  const handleTabPress = (tab: FoodBankTabName, fallbackRoute: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      switchFoodBankTab(tab);
      router.replace(fallbackRoute as any);
    }
  };

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
        icon={activeTab === "Home" ? "grid" : "grid-outline"}
        label="Home"
        active={activeTab === "Home"}
        onPress={() => handleTabPress("Home", "/foodbank/dashboard")}
      />
      <BottomNavItem
        icon={
          activeTab === "Requests" ? "document-text" : "document-text-outline"
        }
        label="Requests"
        active={activeTab === "Requests"}
        onPress={() => handleTabPress("Requests", "/foodbank/requests")}
      />
      <BottomNavItem
        icon={activeTab === "Donations" ? "gift" : "gift-outline"}
        label="Donations"
        active={activeTab === "Donations"}
        onPress={() => handleTabPress("Donations", "/foodbank/donations")}
      />
      <BottomNavItem
        icon={activeTab === "Partners" ? "storefront" : "storefront-outline"}
        label="Merchants"
        active={activeTab === "Partners"}
        onPress={() => handleTabPress("Partners", "/foodbank/partners")}
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
        size={21}
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
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    paddingHorizontal: 6,
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
    fontSize: 10,
    color: Colors.icon,
    marginTop: 1,
  },
  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(18,55,44,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15.5,
    color: Colors.primary2,
  },
  modalSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  secondaryBtn: {
    height: 44,
    backgroundColor: Colors.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
});

export default FoodBankHeader;