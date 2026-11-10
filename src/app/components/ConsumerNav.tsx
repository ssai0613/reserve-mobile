import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import {
  CebuAddressMapPicker,
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";

let cachedConsumerLocation: {
  street: string;
  barangay: string;
  address: string;
  lat: number;
  lng: number;
} | null = null;

const getAppStorage = async (key: string): Promise<string | null> => {
  if (!key || typeof key !== "string" || key.trim() === "") return null;
  if (Platform.OS === "web") return localStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return null;
  }
};

const setAppStorage = async (key: string, value: string): Promise<void> => {
  if (!key || typeof key !== "string" || key.trim() === "") return;
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {}
  }
};

export const CONSUMER_LOCATION_KEY = "@reserve_consumer_location";
export const CONSUMER_READ_NOTIFS_KEY = "@reserve_consumer_read_notifs";

export function ConsumerHeader() {
  const [unreadTotalCount, setUnreadTotalCount] = useState(0);

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [consId, setConsId] = useState("1");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => setModalAlert({ visible: true, title, message, type });

  const getInitialLocation = () => {
    if (cachedConsumerLocation) return cachedConsumerLocation;

    if (Platform.OS === "web") {
      try {
        const saved = localStorage.getItem(CONSUMER_LOCATION_KEY);
        if (saved) {
          cachedConsumerLocation = JSON.parse(saved);
          return cachedConsumerLocation;
        }
      } catch (e) {}
    }

    return null;
  };

  const initialLoc = getInitialLocation() || {
    street: "Cebu City",
    barangay: "",
    address: "Cebu City",
    lat: 10.3157,
    lng: 123.8854,
  };

  const [streetDetail, setStreetDetail] = useState(initialLoc.street);
  const [barangay, setBarangay] = useState(initialLoc.barangay);
  const [address, setAddress] = useState(initialLoc.address);
  const [latitude, setLatitude] = useState(initialLoc.lat);
  const [longitude, setLongitude] = useState(initialLoc.lng);

  useEffect(() => {
    if (Platform.OS !== "web" && !cachedConsumerLocation) {
      getAppStorage(CONSUMER_LOCATION_KEY).then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            cachedConsumerLocation = parsed;
            setStreetDetail(parsed.street);
            setBarangay(parsed.barangay);
            setAddress(parsed.address);
            setLatitude(parsed.lat);
            setLongitude(parsed.lng);
          } catch (e) {}
        }
      });
    }

    loadCounts();
    loadConsumerProfileWithoutOverwritingLocation();
    const timer = setInterval(loadCounts, 4000);

    const handleStorageChange = () => {
      const saved =
        Platform.OS === "web"
          ? localStorage.getItem(CONSUMER_LOCATION_KEY)
          : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          cachedConsumerLocation = parsed;
          if (parsed.street) setStreetDetail(parsed.street);
          if (parsed.barangay) setBarangay(parsed.barangay);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.lat) setLatitude(parsed.lat);
          if (parsed.lng) setLongitude(parsed.lng);
        } catch (e) {}
      }
    };

    if (Platform.OS === "web") {
      window.addEventListener("reserve_location_changed", handleStorageChange);
    }

    const locationListener = DeviceEventEmitter.addListener(
      "app_location_updated",
      (newLoc) => {
        if (newLoc) {
          cachedConsumerLocation = newLoc;
          if (newLoc.street) setStreetDetail(newLoc.street);
          if (newLoc.barangay) setBarangay(newLoc.barangay);
          if (newLoc.address) setAddress(newLoc.address);
          if (newLoc.lat) setLatitude(newLoc.lat);
          if (newLoc.lng) setLongitude(newLoc.lng);
        }
      }
    );

    const notifListener = DeviceEventEmitter.addListener(
      "consumer_notifs_updated",
      () => {
        loadCounts();
      }
    );

    return () => {
      clearInterval(timer);
      locationListener.remove();
      notifListener.remove();
      if (Platform.OS === "web") {
        window.removeEventListener(
          "reserve_location_changed",
          handleStorageChange
        );
      }
    };
  }, []);

  const loadConsumerProfileWithoutOverwritingLocation = async () => {
    try {
      const storedId = (await getAppStorage("profile_id")) || "1";
      const storedEmail = (await getAppStorage("user_email")) || "";
      setConsId(storedId);

      const res = await api.get(
        `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );
      if (res.data?.profile) {
        const p = res.data.profile;
        setConsId(String(p.cons_id || storedId));
        setFullName(p.full_name || "");
        setEmail(p.email || storedEmail);
        setPhone(p.phone || "");

        const existingLocal =
          cachedConsumerLocation ||
          (Platform.OS === "web"
            ? localStorage.getItem(CONSUMER_LOCATION_KEY)
            : await getAppStorage(CONSUMER_LOCATION_KEY));
        if (!existingLocal && p.address) {
          const parts = p.address.split(",");
          const st = parts[0] ? parts[0].trim() : "Cebu City";
          const brgy = parts[1]
            ? parts[1].replace(/brgy\.?/i, "").trim()
            : "";

          setAddress(p.address);
          setStreetDetail(st);
          setBarangay(brgy);
          if (p.latitude) setLatitude(Number(p.latitude));
          if (p.longitude) setLongitude(Number(p.longitude));

          const payload = {
            street: st,
            barangay: brgy,
            address: p.address,
            lat: Number(p.latitude || 10.3157),
            lng: Number(p.longitude || 123.8854),
          };
          cachedConsumerLocation = payload;
          await setAppStorage(CONSUMER_LOCATION_KEY, JSON.stringify(payload));
        }
      }
    } catch (e) {}
  };

  const handleSaveLocation = async () => {
    try {
      const fullAddress = barangay
        ? `${streetDetail}, Brgy. ${barangay}, Cebu City`
        : streetDetail || address;

      const activeConsId = (await getAppStorage("profile_id")) || consId || "1";
      const storedEmail = (await getAppStorage("user_email")) || email;
      const storedName = (await getAppStorage("entity_name")) || fullName;

      await api.post(`listings/consumer-portal/${activeConsId}/`, {
        action: "update_profile",
        full_name: storedName || "Consumer",
        email: storedEmail,
        phone: phone || "",
        address: fullAddress,
        latitude: latitude,
        longitude: longitude,
      });

      const payload = {
        street: streetDetail,
        barangay: barangay,
        address: fullAddress,
        lat: latitude,
        lng: longitude,
      };

      cachedConsumerLocation = payload;
      await setAppStorage(CONSUMER_LOCATION_KEY, JSON.stringify(payload));
      setLocationModalVisible(false);

      DeviceEventEmitter.emit("app_location_updated", payload);
      if (Platform.OS === "web") {
        window.dispatchEvent(new Event("reserve_location_changed"));
      }

      showAlert(
        "Location Updated",
        "Your rescue location has been updated successfully.",
        "success"
      );
    } catch (e: any) {
      showAlert(
        "Location Update Failed",
        e.response?.data?.error || "Could not update location settings.",
        "error"
      );
    }
  };

  const loadCounts = async () => {
    try {
      const storedId = (await getAppStorage("profile_id")) || "1";
      const storedEmail = (await getAppStorage("user_email")) || "";
      const [res, rawReadIds] = await Promise.all([
        api.get(
          `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(
            storedEmail
          )}`
        ),
        AsyncStorage.getItem(`${CONSUMER_READ_NOTIFS_KEY}_${storedId}`),
      ]);

      let readSet = new Set<string>();
      if (rawReadIds) {
        try {
          readSet = new Set(JSON.parse(rawReadIds));
        } catch (e) {}
      }

      if (Array.isArray(res.data?.notifications)) {
        const unread = res.data.notifications.filter(
          (n: any) => !readSet.has(String(n.id))
        );
        setUnreadTotalCount(unread.length);
      }
    } catch (e) {}
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationHeaderTouchable}
          activeOpacity={0.75}
          onPress={() => setLocationModalVisible(true)}
        >
          <View style={styles.headerLocationIconBox}>
            <Ionicons
              name="location-outline"
              size={21}
              color={Colors.primary}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerStreetLarge} numberOfLines={1}>
              {streetDetail || "Cebu City"}
            </Text>
            <Text style={styles.headerBarangaySmall} numberOfLines={1}>
              {barangay ? `Brgy. ${barangay}, Cebu City` : address || "Tap to set Cebu City pin"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* FUSED SINGLE NOTIFICATION & ANNOUNCEMENT BELL ICON */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            onPress={() => router.push("/consumer/notifications" as any)}
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
        </View>
      </View>

      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLocationModalVisible(false)}
          />
          <View style={styles.modalBottomCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Delivery / Rescue Location
              </Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <CebuAddressMapPicker
                selectedBarangay={barangay}
                onSelectBarangay={(brgy, fullAddr) => {
                  setBarangay(brgy);
                  setAddress(fullAddr);
                }}
                streetDetail={streetDetail}
                onChangeStreetDetail={(st, fullAddr) => {
                  setStreetDetail(st);
                  setAddress(fullAddr);
                }}
                latitude={latitude}
                longitude={longitude}
                onChangeCoords={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />

              <TouchableOpacity
                style={[styles.saveLocationBtn, { marginTop: 16 }]}
                activeOpacity={0.85}
                onPress={handleSaveLocation}
              >
                <Text style={styles.saveLocationBtnText}>Confirm Location</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}

export function ConsumerBottomNav({
  activeTab,
}: {
  activeTab: "Home" | "Cart" | "Claims" | "Profile";
}) {
  const insets = useSafeAreaInsets();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartCount();
    const interval = setInterval(loadCartCount, 1500);
    return () => clearInterval(interval);
  }, []);

  const loadCartCount = async () => {
    try {
      const storedCart = await AsyncStorage.getItem("@reserve_cart");
      if (storedCart) {
        const cart = JSON.parse(storedCart);
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      } else {
        setCartCount(0);
      }
    } catch (e) {
      setCartCount(0);
    }
  };

  const bottomInsetPad = Platform.OS === "ios" ? Math.max(insets.bottom, 6) : 6;

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
        onPress={() => router.replace("/consumer/homepage" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Cart" ? "cart" : "cart-outline"}
        label="My Cart"
        active={activeTab === "Cart"}
        badgeCount={cartCount}
        onPress={() => router.replace("/consumer/cart" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Claims" ? "receipt" : "receipt-outline"}
        label="My Claims"
        active={activeTab === "Claims"}
        onPress={() => router.replace("/consumer/claims" as any)}
      />
      <BottomNavItem
        icon={activeTab === "Profile" ? "person" : "person-outline"}
        label="Profile"
        active={activeTab === "Profile"}
        onPress={() => router.replace("/consumer/profile" as any)}
      />
    </View>
  );
}

function BottomNavItem({
  icon,
  label,
  active,
  badgeCount,
  onPress,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badgeCount?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      activeOpacity={active ? 1 : 0.7}
      onPress={active ? undefined : onPress}
    >
      <View style={{ position: "relative" }}>
        <Ionicons
          name={icon}
          size={21}
          color={active ? Colors.primary : Colors.icon}
        />
        {Boolean(badgeCount && badgeCount > 0) && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {badgeCount! > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}
      </View>
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
  locationHeaderTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  headerLocationIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerStreetLarge: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
  },
  headerBarangaySmall: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: -1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 7.5,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 7.5,
    color: Colors.white,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalBottomCard: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
  },
  saveLocationBtn: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLocationBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
});