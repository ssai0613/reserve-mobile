import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import { CebuAddressMapPicker } from "../components/CebuRegistrationHelpers";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const setStorageItem = async (key: string, val: string) => {
  if (Platform.OS === "web") localStorage.setItem(key, val);
  else await SecureStore.setItemAsync(key, val);
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

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setConsId(storedId);
      const res = await api.get(
        `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(storedEmail)}`
      );
      if (res.data?.profile) {
        const p = res.data.profile;
        setConsId(String(p.cons_id));
        setFullName(p.full_name || "");
        setEmail(p.email || "");
        setPhone(p.phone || "");
        setAddress(p.address || "Cebu City");
        setStreetDetail((p.address || "").split(",")[0] || "");
        if (p.latitude) setLatitude(Number(p.latitude));
        if (p.longitude) setLongitude(Number(p.longitude));
      }
    } catch (e) {}
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`listings/consumer-portal/${consId}/`, {
        action: "update_profile",
        full_name: fullName,
        email: email,
        phone: phone,
        address: address,
        latitude: latitude,
        longitude: longitude,
      });
      await setStorageItem("entity_name", fullName);
      await setStorageItem("user_email", email);
      alert(res.data?.message || "Personal info & Cebu City Haversine location updated!");
      router.back();
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not save changes.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Personal & Location Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account details and 10km Cebu City Haversine pin
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.profileTitle}>{fullName || "Your Information"}</Text>
          <Text style={styles.profileSubtitle}>{address}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={19} color={Colors.icon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={19} color={Colors.icon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Philippine Mobile Number (+63)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={19} color={Colors.icon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

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
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={19}
            color={Colors.white}
          />
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Your pinned Cebu City coordinates power the 10km Haversine surplus food matching.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 70, paddingHorizontal: 18, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center" },
  backButton: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTextContainer: { marginLeft: 11 },
  headerTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, lineHeight: 21, color: Colors.primary2 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 8, lineHeight: 12, color: Colors.primary1, marginTop: 1 },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 30 },
  profileSection: { alignItems: "center", marginBottom: 22 },
  profileCircle: { width: 78, height: 78, borderRadius: 39, backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  profileTitle: { fontFamily: "PoppinsBold", fontSize: 16, lineHeight: 21, color: Colors.primary2 },
  profileSubtitle: { fontFamily: "PoppinsRegular", fontSize: 8.5, lineHeight: 13, color: Colors.primary1, marginTop: 2, textAlign: "center" },
  formCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14 },
  fieldContainer: { marginBottom: 16 },
  label: { fontFamily: "PoppinsSemiBold", fontSize: 9.5, lineHeight: 14, color: Colors.primary2, marginBottom: 6 },
  inputContainer: { height: 43, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 11, flexDirection: "row", alignItems: "center" },
  input: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 10, lineHeight: 14, color: Colors.text, marginLeft: 8, paddingVertical: 0 },
  saveButton: { height: 45, backgroundColor: Colors.button, borderRadius: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 },
  saveText: { fontFamily: "PoppinsSemiBold", fontSize: 10, lineHeight: 14, color: Colors.white, marginLeft: 6 },
  note: { fontFamily: "PoppinsRegular", fontSize: 7.5, lineHeight: 12, color: Colors.placeholder, textAlign: "center", marginTop: 10, paddingHorizontal: 20 },
});