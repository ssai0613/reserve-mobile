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

let cachedMerchantPersonalInfo = {
  merchantId: "1",
  busName: "",
  merchType: "Bakeshop",
  contactPerson: "",
  email: "",
  phone: "",
  hotline: "",
  expiryDate: "Verified",
  barangay: "",
  streetDetail: "",
  address: "Cebu City",
  latitude: 10.3157,
  longitude: 123.8854,
  pushNotif: true,
  smsAlerts: true,
  autoDonateExpiry: true,
  isLoaded: false,
};

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

export default function MerchantPersonalInfo() {
  const [merchantId, setMerchantId] = useState(
    cachedMerchantPersonalInfo.merchantId
  );
  const [busName, setBusName] = useState(cachedMerchantPersonalInfo.busName);
  const [merchType, setMerchType] = useState(
    cachedMerchantPersonalInfo.merchType
  );
  const [contactPerson, setContactPerson] = useState(
    cachedMerchantPersonalInfo.contactPerson
  );
  const [email, setEmail] = useState(cachedMerchantPersonalInfo.email);
  const [phone, setPhone] = useState(cachedMerchantPersonalInfo.phone);
  const [hotline, setHotline] = useState(cachedMerchantPersonalInfo.hotline);
  const [expiryDate, setExpiryDate] = useState(
    cachedMerchantPersonalInfo.expiryDate
  );
  const [barangay, setBarangay] = useState(cachedMerchantPersonalInfo.barangay);
  const [streetDetail, setStreetDetail] = useState(
    cachedMerchantPersonalInfo.streetDetail
  );
  const [address, setAddress] = useState(cachedMerchantPersonalInfo.address);
  const [latitude, setLatitude] = useState(cachedMerchantPersonalInfo.latitude);
  const [longitude, setLongitude] = useState(
    cachedMerchantPersonalInfo.longitude
  );

  const [pushNotif, setPushNotif] = useState(
    cachedMerchantPersonalInfo.pushNotif
  );
  const [smsAlerts, setSmsAlerts] = useState(
    cachedMerchantPersonalInfo.smsAlerts
  );
  const [autoDonateExpiry, setAutoDonateExpiry] = useState(
    cachedMerchantPersonalInfo.autoDonateExpiry
  );

  const [isLoaded, setIsLoaded] = useState(cachedMerchantPersonalInfo.isLoaded);
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
    loadMerchantInfo();
  }, []);

  const loadMerchantInfo = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setMerchantId(storedId);

      const [portalRes, settingsRes] = await Promise.all([
        api.get(
          `listings/merchant-portal/${storedId}/?email=${encodeURIComponent(
            storedEmail
          )}`
        ),
        api
          .get(
            `accounts/settings/?profile_id=${storedId}&email=${encodeURIComponent(
              storedEmail
            )}&role=Merchant`
          )
          .catch(() => null),
      ]);

      const p = portalRes.data?.profile;
      if (p) {
        const parts = (p.address || "").split(",");
        const nextStreet = parts[0] ? parts[0].trim() : "";
        const nextBrgy = parts[1]
          ? parts[1].replace(/brgy\.?/i, "").trim()
          : "";

        cachedMerchantPersonalInfo = {
          ...cachedMerchantPersonalInfo,
          merchantId: String(p.merch_id || storedId),
          busName: p.bus_name || "",
          merchType: p.merch_type || "Bakeshop",
          contactPerson: p.contact_person || "",
          email: p.email || storedEmail,
          phone: p.phone !== "Not Provided" ? p.phone || "" : "",
          hotline: p.hotline !== "N/A" ? p.hotline || "" : "",
          expiryDate: p.expiry_date || "Verified",
          address: p.address || "Cebu City",
          streetDetail: nextStreet,
          barangay: nextBrgy || cachedMerchantPersonalInfo.barangay,
          latitude: p.latitude ? Number(p.latitude) : 10.3157,
          longitude: p.longitude ? Number(p.longitude) : 123.8854,
          isLoaded: true,
        };

        setMerchantId(cachedMerchantPersonalInfo.merchantId);
        setBusName(cachedMerchantPersonalInfo.busName);
        setMerchType(cachedMerchantPersonalInfo.merchType);
        setContactPerson(cachedMerchantPersonalInfo.contactPerson);
        setEmail(cachedMerchantPersonalInfo.email);
        setPhone(cachedMerchantPersonalInfo.phone);
        setHotline(cachedMerchantPersonalInfo.hotline);
        setExpiryDate(cachedMerchantPersonalInfo.expiryDate);
        setAddress(cachedMerchantPersonalInfo.address);
        setStreetDetail(cachedMerchantPersonalInfo.streetDetail);
        if (nextBrgy) setBarangay(nextBrgy);
        setLatitude(cachedMerchantPersonalInfo.latitude);
        setLongitude(cachedMerchantPersonalInfo.longitude);
      }

      if (settingsRes?.data) {
        const pNotif = Boolean(settingsRes.data.pushNotif ?? true);
        const sAlerts = Boolean(settingsRes.data.smsAlerts ?? true);
        const aDonate = Boolean(settingsRes.data.autoDonateExpiry ?? true);
        cachedMerchantPersonalInfo.pushNotif = pNotif;
        cachedMerchantPersonalInfo.smsAlerts = sAlerts;
        cachedMerchantPersonalInfo.autoDonateExpiry = aDonate;
        setPushNotif(pNotif);
        setSmsAlerts(sAlerts);
        setAutoDonateExpiry(aDonate);
      }
    } catch (e) {
    } finally {
      setIsLoaded(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMerchantInfo();
    setRefreshing(false);
  };

  const handleToggleSetting = async (
    key: "pushNotif" | "smsAlerts" | "autoDonateExpiry",
    value: boolean
  ) => {
    if (key === "pushNotif") {
      cachedMerchantPersonalInfo.pushNotif = value;
      setPushNotif(value);
    }
    if (key === "smsAlerts") {
      cachedMerchantPersonalInfo.smsAlerts = value;
      setSmsAlerts(value);
    }
    if (key === "autoDonateExpiry") {
      cachedMerchantPersonalInfo.autoDonateExpiry = value;
      setAutoDonateExpiry(value);
    }

    try {
      await api.post("accounts/settings/", {
        profile_id: merchantId,
        email,
        role: "Merchant",
        settings: {
          pushNotif: key === "pushNotif" ? value : pushNotif,
          smsAlerts: key === "smsAlerts" ? value : smsAlerts,
          autoDonateExpiry:
            key === "autoDonateExpiry" ? value : autoDonateExpiry,
        },
      });
      DeviceEventEmitter.emit("merchant_profile_updated");
    } catch (e) {}
  };

  const handleSave = async () => {
    if (!busName.trim()) {
      showAlert(
        "Establishment Name Required",
        "Please enter your business or establishment name.",
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

      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "update_profile",
        bus_name: busName.trim(),
        contact_person: contactPerson.trim(),
        hotline: hotline.trim(),
        email: email,
        phone: phone,
        address: fullAddress,
        latitude: latitude,
        longitude: longitude,
      });

      cachedMerchantPersonalInfo = {
        ...cachedMerchantPersonalInfo,
        busName: busName.trim(),
        contactPerson: contactPerson.trim(),
        hotline: hotline.trim(),
        address: fullAddress,
        streetDetail,
        barangay,
        latitude,
        longitude,
      };

      await setStorageItem("entity_name", busName.trim());
      DeviceEventEmitter.emit("merchant_profile_updated");

      showAlert(
        "Storefront Updated",
        res.data?.message ||
          "Your establishment details and Cebu City Haversine location have been saved!",
        "success"
      );
    } catch (e: any) {
      showAlert(
        "Update Error",
        e.response?.data?.error || "Could not save storefront changes.",
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
              router.replace("/establishment/profile" as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Storefront &amp; Personal Information
          </Text>
          <Text style={styles.headerSubtitle}>
            Manage your business details, Cebu City pin, and alert preferences
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
          <View style={styles.profileSummaryCard}>
            <View style={styles.profileCircle}>
              <Ionicons name="storefront" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.profileTitle}>
              {isLoaded ? busName || "Merchant Storefront" : "Loading..."}
            </Text>
            <Text style={styles.profileSubtitle}>{address}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Category</Text>
                <Text style={styles.detailCellValue}>{merchType}</Text>
              </View>
              <View style={styles.detailCellDivider} />
              <View style={styles.detailCell}>
                <Text style={styles.detailCellLabel}>Permit Expiry</Text>
                <Text style={styles.detailCellValue}>{expiryDate}</Text>
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

          <View style={styles.formCard}>
            <Text style={styles.cardSectionHeading}>
              Automation &amp; Alert Preferences
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
                  Order &amp; Pickup Push Alerts
                </Text>
                <Text style={styles.settingSubtitle}>
                  Receive instant alerts when consumers reserve items
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
                  name="flash-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  TTT 1-Hour Expiry Warnings
                </Text>
                <Text style={styles.settingSubtitle}>
                  Alert when listings are within 1 hour of safety threshold
                </Text>
              </View>
              <Switch
                value={autoDonateExpiry}
                onValueChange={(v) =>
                  handleToggleSetting("autoDonateExpiry", v)
                }
                trackColor={{ false: "#CBD5E1", true: Colors.button }}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardSectionHeading}>
              Storefront Identity &amp; Cebu City Pin
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Establishment Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color={Colors.primary}
                />
                <TextInput
                  style={styles.input}
                  value={busName}
                  onChangeText={setBusName}
                  placeholder="Enter establishment name"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Authorized Representative / Contact Person *
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
                  placeholder="Enter manager or owner name"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Business Landline / Hotline</Text>
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
              {saving ? "SAVING CHANGES..." : "Save Storefront Information"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your pinned Cebu City coordinates allow nearby Consumers and Food
            Banks within the Haversine radius to discover your surplus listings.
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
  header: { height: 60, paddingHorizontal: 16, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center" },
  backButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTextContainer: { marginLeft: 11, flex: 1 },
  headerTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1, marginTop: -1 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  profileSummaryCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16 },
  profileCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  profileTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2, textAlign: "center" },
  profileSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, marginTop: 2, textAlign: "center" },
  detailGrid: { flexDirection: "row", width: "100%", backgroundColor: "#F7F9F7", borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, marginTop: 14 },
  detailCell: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  detailCellDivider: { width: 1, backgroundColor: Colors.border },
  detailCellLabel: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1 },
  detailCellValue: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.primary2, marginTop: 2 },
  formCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 15, marginBottom: 16 },
  cardSectionHeading: { fontFamily: "PoppinsBold", fontSize: 13.5, color: Colors.primary2, marginBottom: 10 },
  settingItem: { minHeight: 56, flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 12 },
  settingContent: { flex: 1, paddingRight: 8 },
  settingTitle: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary2 },
  settingSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: 1 },
  settingDivider: { height: 1, backgroundColor: Colors.border },
  fieldContainer: { marginBottom: 14 },
  label: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.primary2, marginBottom: 6 },
  inputContainer: { height: 44, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
  input: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, marginLeft: 8, paddingVertical: 0 },
  selectedBrgyBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 14, gap: 6 },
  selectedBrgyText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary2 },
  saveButton: { height: 46, backgroundColor: Colors.button, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 4, gap: 6 },
  saveText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  note: { fontFamily: "PoppinsRegular", fontSize: 9.5, lineHeight: 14, color: Colors.placeholder, textAlign: "center", marginTop: 10, paddingHorizontal: 20 },
});