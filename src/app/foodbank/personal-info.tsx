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
    Switch,
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

export default function FoodBankPersonalInfo() {
  const [orgId, setOrgId] = useState("1");
  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotline, setHotline] = useState("");
  const [status, setStatus] = useState("Active");
  const [totalReceived, setTotalReceived] = useState(0);

  const [barangay, setBarangay] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [address, setAddress] = useState("Cebu City");
  const [latitude, setLatitude] = useState(10.3157);
  const [longitude, setLongitude] = useState(123.8854);

  const [pushNotif, setPushNotif] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

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
    loadOrgInfo();
  }, []);

  const loadOrgInfo = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setOrgId(storedId);

      const [profRes, settingsRes] = await Promise.all([
        api.get(
          `donations/profile/${storedId}/?email=${encodeURIComponent(
            storedEmail
          )}`
        ),
        api
          .get(
            `accounts/settings/?profile_id=${storedId}&email=${encodeURIComponent(
              storedEmail
            )}&role=FoodBank`
          )
          .catch(() => null),
      ]);

      if (profRes.data) {
        const p = profRes.data;
        setOrgId(String(p.org_id || storedId));
        setOrgName(p.org_name || "");
        setContactPerson(p.contact_person || "");
        setEmail(p.email || storedEmail);
        setPhone(p.phone || "");
        setHotline(p.hotline || "");
        setStatus(p.status || "Active");
        setTotalReceived(Number(p.total_food_received || 0));
        setAddress(p.address || "Cebu City");

        const parts = (p.address || "").split(",");
        setStreetDetail(parts[0] ? parts[0].trim() : "");
        if (parts[1]) {
          setBarangay(parts[1].replace(/brgy\.?/i, "").trim());
        }
        if (p.latitude) setLatitude(Number(p.latitude));
        if (p.longitude) setLongitude(Number(p.longitude));
      }

      if (settingsRes?.data) {
        setPushNotif(Boolean(settingsRes.data.pushNotif ?? true));
        setSmsAlerts(Boolean(settingsRes.data.smsAlerts ?? true));
      }
    } catch (e) {
    } finally {
      setIsLoaded(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrgInfo();
    setRefreshing(false);
  };

  const handleToggleSetting = async (
    key: "pushNotif" | "smsAlerts",
    value: boolean
  ) => {
    if (key === "pushNotif") setPushNotif(value);
    if (key === "smsAlerts") setSmsAlerts(value);

    try {
      await api.post("accounts/settings/", {
        profile_id: orgId,
        email,
        role: "FoodBank",
        settings: {
          pushNotif: key === "pushNotif" ? value : pushNotif,
          smsAlerts: key === "smsAlerts" ? value : smsAlerts,
        },
      });
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!orgName.trim()) {
      showAlert(
        "Organization Name Required",
        "Please enter your Food Bank or NGO name.",
        "warning"
      );
      return;
    }

    setSaving(true);
    try {
      const fullAddress =
        address ||
        (barangay
          ? `${streetDetail}, Brgy. ${barangay}, Cebu City`
          : streetDetail || "Cebu City");

      const res = await api.post(`donations/profile/${orgId}/`, {
        action: "update_profile",
        org_name: orgName.trim(),
        contact_person: contactPerson.trim(),
        hotline: hotline.trim(),
        email: email,
        phone: phone,
        address: fullAddress,
        latitude: latitude,
        longitude: longitude,
      });

      await setStorageItem("entity_name", orgName.trim());
      DeviceEventEmitter.emit("fb_profile_updated");

      showAlert(
        "Organization Updated",
        res.data?.message ||
          "Your Food Bank details and Cebu City Haversine location have been saved!",
        "success"
      );
    } catch (e: any) {
      showAlert(
        "Update Error",
        e.response?.data?.error || "Could not save organization changes.",
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/foodbank/profile" as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Organization &amp; Personal Information
          </Text>
          <Text style={styles.headerSubtitle}>
            Manage your NGO details, Cebu City pin, and alert preferences
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
          {/* DETAILED ORGANIZATION OVERVIEW CARD */}
          <View style={styles.profileSummaryCard}>
            <View style={styles.profileCircle}>
              <Ionicons name="business" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.profileTitle}>
              {isLoaded ? orgName || "Food Bank Partner" : "Loading..."}
            </Text>
            <Text style={styles.profileSubtitle}>{address}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Hub ID</Text>
                <Text style={styles.detailCellValue}>
                  FB-{orgId} ({status})
                </Text>
              </View>
              <View style={styles.detailCellDivider} />
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Units Rescued</Text>
                <Text style={styles.detailCellValue}>
                  {totalReceived} Units
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

          {/* NOTIFICATION & ALERT PREFERENCES */}
          <View style={styles.formCard}>
            <Text style={styles.cardSectionHeading}>
              Notification &amp; Alert Preferences
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Surplus Donation Push Alerts
                </Text>
                <Text style={styles.settingSubtitle}>
                  Alert when nearby merchants post surplus food donations
                </Text>
              </View>
              <Switch
                value={pushNotif}
                onValueChange={(v) => handleToggleSetting("pushNotif", v)}
                trackColor={{ false: "#CBD5E1", true: Colors.button }}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Appeal Approval Notifications
                </Text>
                <Text style={styles.settingSubtitle}>
                  Notify when merchants approve or update your food requests
                </Text>
              </View>
              <Switch
                value={smsAlerts}
                onValueChange={(v) => handleToggleSetting("smsAlerts", v)}
                trackColor={{ false: "#CBD5E1", true: Colors.button }}
              />
            </View>
          </View>

          {/* EDIT ORGANIZATION DETAILS & CEBU CITY ADDRESS PIN */}
          <View style={styles.formCard}>
            <Text style={styles.cardSectionHeading}>
              Organization Identity &amp; Cebu City Pin
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Organization / NGO Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  value={orgName}
                  onChangeText={setOrgName}
                  placeholder="Enter organization name"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Coordinator / Contact Person *
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  placeholder="Enter coordinator full name"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Organization Landline / Hotline</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  value={hotline}
                  onChangeText={setHotline}
                  placeholder="e.g. (032) 231-0000 or N/A"
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
              {saving ? "SAVING CHANGES..." : "Save Organization Information"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your pinned Cebu City coordinates power the Haversine distance
            matching with partner merchants across Cebu City.
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
    textAlign: "center",
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
    marginBottom: 16,
  },
  cardSectionHeading: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
    marginBottom: 10,
  },
  settingItem: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E7EEE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: { flex: 1, paddingRight: 8 },
  settingTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 12,
    color: Colors.primary2,
  },
  settingSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: 1,
  },
  settingDivider: { height: 1, backgroundColor: Colors.border },
  fieldContainer: { marginBottom: 14 },
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
    marginTop: 4,
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