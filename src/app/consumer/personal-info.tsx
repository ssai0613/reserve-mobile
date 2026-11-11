import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import {
  CebuAddressMapPicker,
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import { CONSUMER_LOCATION_KEY } from "../components/ConsumerNav";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const setStorageItem = async (key: string, val: string) => {
  if (!key || typeof key !== "string" || key.trim() === "") return;
  if (Platform.OS === "web") {
    localStorage.setItem(key, val);
  } else {
    try {
      await SecureStore.setItemAsync(key, val);
    } catch (e) {}
  }
};

export default function PersonalInfo() {
  const [consId, setConsId] = useState("1");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [address, setAddress] = useState("Cebu City");
  const [latitude, setLatitude] = useState(10.3157);
  const [longitude, setLongitude] = useState(123.8854);
  const [totalSavedKg, setTotalSavedKg] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
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
        setAddress(p.address || "Cebu City");
        setTotalSavedKg(Number(p.total_food_saved || 0));

        const parts = (p.address || "").split(",");
        setStreetDetail(parts[0] ? parts[0].trim() : "");
        if (parts[1]) {
          setBarangay(parts[1].replace(/brgy\.?/i, "").trim());
        }
        if (p.latitude) setLatitude(Number(p.latitude));
        if (p.longitude) setLongitude(Number(p.longitude));
      }
    } catch (e) {
    } finally {
      setIsLoaded(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInfo();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert("Name Required", "Please enter your full name.", "warning");
      return;
    }

    setSaving(true);
    try {
      const fullAddress =
        address ||
        (barangay
          ? `${streetDetail}, Brgy. ${barangay}, Cebu City`
          : streetDetail || "Cebu City");

      const res = await api.post(`listings/consumer-portal/${consId}/`, {
        action: "update_profile",
        full_name: fullName.trim(),
        email: email,
        phone: phone || "",
        address: fullAddress,
        latitude: latitude,
        longitude: longitude,
      });

      await setStorageItem("entity_name", fullName.trim());
      await setStorageItem("user_email", email);

      const payload = {
        street: streetDetail || fullAddress.split(",")[0],
        barangay: barangay,
        address: fullAddress,
        lat: latitude,
        lng: longitude,
      };

      await setStorageItem(CONSUMER_LOCATION_KEY, JSON.stringify(payload));

      DeviceEventEmitter.emit("app_location_updated", payload);
      DeviceEventEmitter.emit("consumer_profile_updated");
      if (Platform.OS === "web") {
        window.dispatchEvent(new Event("reserve_location_changed"));
      }

      showAlert(
        "Success",
        res.data?.message ||
          "Personal info & Cebu City Haversine location updated!",
        "success"
      );
    } catch (e: any) {
      showAlert(
        "Update Error",
        e.response?.data?.error || "Could not save changes.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* STATUS-BAR-SAFE HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/consumer/profile" as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <Text style={styles.headerSubtitle}>
            Manage your detailed profile and Cebu City Haversine address pin
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* DETAILED PROFILE OVERVIEW CARD */}
          <View style={styles.profileSummaryCard}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={34} color={Colors.primary} />
            </View>
            <Text style={styles.profileTitle}>
              {isLoaded ? fullName || "Consumer Profile" : "Loading..."}
            </Text>
            <Text style={styles.profileSubtitle}>{address}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Account ID</Text>
                <Text style={styles.detailCellValue}>CID-{consId}</Text>
              </View>
              <View style={styles.detailCellDivider} />
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Food Rescued</Text>
                <Text style={styles.detailCellValue}>
                  {totalSavedKg.toFixed(1)} kg
                </Text>
              </View>
              <View style={styles.detailCellDivider} />
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Haversine GPS</Text>
                <Text style={styles.detailCellValue}>
                  {latitude.toFixed(3)}°N, {longitude.toFixed(3)}°E
                </Text>
              </View>
            </View>
          </View>

          {/* EDIT PERSONAL DETAILS & ADDRESS FORM */}
          <View style={styles.formCard}>
            <Text style={styles.cardSectionHeading}>
              Identity &amp; Cebu City Address
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            {barangay ? (
              <View style={styles.selectedBrgyBadge}>
                <Ionicons name="location" size={14} color={Colors.primary} />
                <Text style={styles.selectedBrgyText}>
                  Selected Barangay:{" "}
                  <Text style={{ fontFamily: "PoppinsBold" }}>{barangay}</Text>
                </Text>
              </View>
            ) : null}

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
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color={Colors.white}
            />
            <Text style={styles.saveText}>
              {saving ? "SAVING CHANGES..." : "Save Personal Information"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your pinned Cebu City coordinates power the Haversine surplus food
            matching on your Home feed.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => {
          setModalAlert((prev) => ({ ...prev, visible: false }));
          if (modalAlert.type === "success") {
            router.back();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
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
  headerTextContainer: { marginLeft: 11, flex: 1 },
  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
    marginTop: -1,
  },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  profileSummaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  profileCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  profileTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.primary2,
  },
  profileSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
    marginTop: 2,
    textAlign: "center",
  },
  detailGrid: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#F7F9F7",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 14,
  },
  detailCell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  detailCellDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  detailCellLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
  },
  detailCellValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary2,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 15,
  },
  cardSectionHeading: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
    marginBottom: 12,
  },
  fieldContainer: { marginBottom: 16 },
  label: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary2,
    marginBottom: 6,
  },
  inputContainer: {
    height: 44,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 11.5,
    color: Colors.primary2,
    marginLeft: 8,
    paddingVertical: 0,
  },
  selectedBrgyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
  },
  selectedBrgyText: {
    fontFamily: "PoppinsMedium",
    fontSize: 10.5,
    color: Colors.primary2,
  },
  saveButton: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  saveText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  note: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 14,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});