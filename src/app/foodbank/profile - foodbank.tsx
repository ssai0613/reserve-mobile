import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Modal,
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

export default function FoodBankProfile() {
  const [orgId, setOrgId] = useState("1");
  const [orgName, setOrgName] = useState("Food Bank Partner");
  const [contactPerson, setContactPerson] = useState("Coordinator");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("Not Provided");
  const [address, setAddress] = useState("Cebu City");
  const [latitude, setLatitude] = useState(10.3157);
  const [longitude, setLongitude] = useState(123.8854);
  const [totalReceived, setTotalReceived] = useState(0);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editOrgName, setEditOrgName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBarangay, setEditBarangay] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLat, setEditLat] = useState(10.3157);
  const [editLng, setEditLng] = useState(123.8854);

  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setOrgId(storedId);

      const res = await api.get(
        `donations/profile/${storedId}/?email=${encodeURIComponent(storedEmail)}`
      );
      if (res.data) {
        setOrgId(String(res.data.org_id));
        setOrgName(res.data.org_name);
        setContactPerson(res.data.contact_person);
        setEmail(res.data.email);
        setPhone(res.data.phone);
        setAddress(res.data.address);
        setTotalReceived(Number(res.data.total_food_received || 0));
        if (res.data.latitude) setLatitude(Number(res.data.latitude));
        if (res.data.longitude) setLongitude(Number(res.data.longitude));
      }
    } catch (e) {
      console.log("FoodBank profile error:", e);
    }
  };

  const openEditModal = () => {
    setEditOrgName(orgName);
    setEditContact(contactPerson);
    setEditEmail(email);
    setEditPhone(phone);
    setEditAddress(address);
    setEditStreet(address.split(",")[0] || "");
    setEditLat(latitude);
    setEditLng(longitude);
    setEditModalVisible(true);
  };

  const handleSaveOrg = async () => {
    try {
      const res = await api.post(`donations/profile/${orgId}/`, {
        action: "update_profile",
        org_name: editOrgName,
        contact_person: editContact,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        latitude: editLat,
        longitude: editLng,
      });
      setOrgName(editOrgName);
      setContactPerson(editContact);
      setEmail(editEmail);
      setPhone(editPhone);
      setAddress(editAddress);
      setLatitude(editLat);
      setLongitude(editLng);
      setEditModalVisible(false);
      alert(res.data.message || "Organization updated!");
    } catch (e) {
      alert("Could not update organization details.");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const res = await api.post(`donations/profile/${orgId}/`, {
        action: "change_password",
        new_password: newPassword,
      });
      setPwModalVisible(false);
      setNewPassword("");
      setConfirmPassword("");
      alert(res.data.message || "Password updated!");
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not update password.");
    }
  };

  const handleLogout = () => {
    router.replace("/consumer");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.replace("/foodbank/dashboard")}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Food Bank Enterprise Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage organization details, Cebu City map pin & security
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.largeProfileCircle}>
            <Ionicons name="business" size={38} color={Colors.white} />
          </View>
          <Text style={styles.profileName}>{orgName}</Text>
          <Text style={styles.profileRole}>
            Verified Food Bank • {totalReceived} Units Rescued
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization information</Text>
          <View style={styles.infoCard}>
            <ProfileInfo icon="business-outline" label="Organization name" value={orgName} />
            <ProfileInfo icon="person-outline" label="Contact person" value={contactPerson} />
            <ProfileInfo icon="mail-outline" label="Email address" value={email} />
            <ProfileInfo icon="call-outline" label="Contact number (+63)" value={phone} />
            <ProfileInfo icon="location-outline" label="Cebu City Address" value={address} />
            <ProfileInfo
              icon="navigate-outline"
              label="Pinned Haversine GPS"
              value={`${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`}
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account settings</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={openEditModal}>
              <View style={styles.settingIcon}>
                <Ionicons name="create-outline" size={19} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Edit Organization & Cebu Map Pin</Text>
                <Text style={styles.settingSubtitle}>
                  Update organization details, barangay & GPS coordinates
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => setPwModalVisible(true)}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Change password</Text>
                <Text style={styles.settingSubtitle}>Update your account password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#A94A3A" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* EDIT ORGANIZATION + MAP MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Organization & Location</Text>
              <Text style={styles.inputLabel}>Organization Name</Text>
              <TextInput style={styles.input} value={editOrgName} onChangeText={setEditOrgName} />
              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput style={styles.input} value={editContact} onChangeText={setEditContact} />
              <Text style={styles.inputLabel}>Official Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                autoCapitalize="none"
              />
              <Text style={styles.inputLabel}>Contact Number (+63)</Text>
              <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} />

              <View style={{ marginTop: 10 }}>
                <CebuAddressMapPicker
                  selectedBarangay={editBarangay}
                  onSelectBarangay={(brgy, fullAddr) => {
                    setEditBarangay(brgy);
                    setEditAddress(fullAddr);
                  }}
                  streetDetail={editStreet}
                  onChangeStreetDetail={(st, fullAddr) => {
                    setEditStreet(st);
                    setEditAddress(fullAddr);
                  }}
                  latitude={editLat}
                  longitude={editLng}
                  onChangeCoords={(lat, lng) => {
                    setEditLat(lat);
                    setEditLng(lng);
                  }}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOrg}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PASSWORD MODAL */}
      <Modal
        visible={pwModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPwModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                <Text style={styles.saveBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileInfo({
  icon,
  label,
  value,
  last = false,
}: {
  icon: any;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoItem, !last && styles.infoItemBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { minHeight: 70, backgroundColor: Colors.background, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary2 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: -2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  profileCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 22, paddingHorizontal: 16, alignItems: "center", marginBottom: 20 },
  largeProfileCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  profileName: { fontFamily: "PoppinsSemiBold", fontSize: 18, color: Colors.primary2, textAlign: "center" },
  profileRole: { fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginBottom: 8 },
  infoCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  infoItem: { minHeight: 58, flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1 },
  infoValue: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2, marginTop: 1 },
  settingsCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  settingItem: { minHeight: 62, flexDirection: "row", alignItems: "center" },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 12 },
  settingContent: { flex: 1 },
  settingTitle: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  settingSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, marginTop: 1 },
  settingDivider: { height: 1, backgroundColor: Colors.border },
  logoutButton: { minHeight: 48, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: "#E1C8C3", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: "#A94A3A" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: Colors.white, borderRadius: 16, padding: 18 },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary2, marginBottom: 10 },
  inputLabel: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary1, marginTop: 8, marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, backgroundColor: Colors.input },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, height: 42, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  saveBtn: { flex: 1, height: 42, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
});