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
  PhoneOtpVerifier,
  ReserveAlertModal,
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";

const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const clearFoodBankStorage = async () => {
  const keys = [
    "access",
    "refresh",
    "user_role",
    "user_email",
    "profile_id",
    "entity_name",
    "account_status",
  ];
  for (const k of keys) {
    if (Platform.OS === "web") localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  }
};

const maskPhoneNumber = (rawPhone: string): string => {
  if (!rawPhone || rawPhone === "Not Provided") return "09xxxxxxxxx";
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("9") && digits.length === 10) {
    digits = "0" + digits;
  }
  if (digits.length >= 5) {
    const lastThree = digits.slice(-3);
    const middleLength = Math.max(6, digits.length - 5);
    return `09${"x".repeat(middleLength)}${lastThree}`;
  }
  return "09xxxxxx000";
};

export default function FoodBankPrivacySecurity() {
  const [orgId, setOrgId] = useState("1");
  const [refreshing, setRefreshing] = useState(false);

  // 1. Email Update State
  const [currentEmail, setCurrentEmail] = useState("foodbank@email.com");
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // 2. Phone Update State (SMS OTP)
  const [currentPhone, setCurrentPhone] = useState("09xxxxxxxxx");
  const [newPhone, setNewPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // 3. Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // 4. Soft Delete / Deactivate Account Modal State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => setModalAlert({ visible: true, title, message, type });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail =
        (await getStorageItem("user_email")) || "foodbank@email.com";
      setOrgId(storedId);
      setCurrentEmail(storedEmail);

      const res = await api.get(
        `donations/profile/${storedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );
      if (res.data) {
        if (res.data.email) setCurrentEmail(res.data.email);
        if (res.data.phone) setCurrentPhone(res.data.phone);
      }
    } catch (e) {
      console.log("Error loading Food Bank privacy data:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const handleUpdateEmail = async () => {
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      showModal(
        "Invalid Email",
        "Please enter a valid email address.",
        "warning"
      );
      return;
    }
    if (cleanEmail === currentEmail.toLowerCase()) {
      showModal(
        "Same Email",
        "The new email address is the same as your current email.",
        "warning"
      );
      return;
    }

    setSavingEmail(true);
    try {
      const res = await api.post(`donations/profile/${orgId}/`, {
        action: "update_profile",
        email: currentEmail,
        new_email: cleanEmail,
      });

      await setStorageItem("user_email", cleanEmail);
      setCurrentEmail(cleanEmail);
      setNewEmail("");
      DeviceEventEmitter.emit("fb_profile_updated");
      showModal(
        "Email Updated",
        res.data?.message ||
          "Your official Food Bank email has been updated successfully.",
        "success"
      );
    } catch (err: any) {
      showModal(
        "Update Failed",
        err.response?.data?.error ||
          "Could not update email address. Please try again.",
        "error"
      );
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!isPhoneVerified) {
      showModal(
        "Phone Verification Required",
        "Please enter your new phone number and verify it via SMS OTP first.",
        "warning"
      );
      return;
    }

    setSavingPhone(true);
    try {
      const res = await api.post(`donations/profile/${orgId}/`, {
        action: "update_profile",
        email: currentEmail,
        phone: newPhone.trim(),
      });

      setCurrentPhone(newPhone.trim());
      setNewPhone("");
      setIsPhoneVerified(false);
      DeviceEventEmitter.emit("fb_profile_updated");
      showModal(
        "Phone Number Updated",
        res.data?.message ||
          "Your verified mobile number has been updated successfully.",
        "success"
      );
    } catch (err: any) {
      showModal(
        "Update Failed",
        err.response?.data?.error || "Could not update phone number.",
        "error"
      );
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showModal(
        "Missing Fields",
        "Please fill in all password fields.",
        "warning"
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal(
        "Password Mismatch",
        "New passwords do not match. Please check again.",
        "warning"
      );
      return;
    }
    if (newPassword.length < 6) {
      showModal(
        "Weak Password",
        "New password must be at least 6 characters long.",
        "warning"
      );
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.post(`donations/profile/${orgId}/`, {
        action: "change_password",
        email: currentEmail,
        current_password: currentPassword,
        new_password: newPassword,
      });

      showModal(
        "Password Updated",
        res.data?.message || "Your password has been changed successfully.",
        "success"
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showModal(
        "Update Failed",
        err.response?.data?.error ||
          "Could not update password. Verify your current password.",
        "error"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const executeSoftDeleteAccount = async () => {
    setDeleteConfirmVisible(false);
    try {
      await api.post(`donations/profile/${orgId}/`, {
        action: "deactivate_account",
        email: currentEmail,
      });
    } catch (e) {}
    await clearFoodBankStorage();
    router.replace("/consumer");
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
          <Text style={styles.headerTitle}>Privacy &amp; Security</Text>
          <Text style={styles.headerSubtitle}>
            Manage your official email, mobile number, password, and account
            status
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          {/* 1. UPDATE EMAIL ADDRESS */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Official Email Address</Text>
                <Text style={styles.cardSubtitle}>
                  Used for NGO login, accreditation notices, and donation
                  updates
                </Text>
              </View>
            </View>

            <View style={styles.currentContainer}>
              <Text style={styles.currentLabel}>Current Email Address</Text>
              <View style={styles.currentRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.currentValueText}>{currentEmail}</Text>
              </View>
            </View>

            <Text style={styles.label}>New Email Address *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. coordinator@ngo.org"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={newEmail}
                onChangeText={setNewEmail}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={handleUpdateEmail}
              disabled={savingEmail}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={Colors.white}
              />
              <Text style={styles.buttonText}>
                {savingEmail ? "UPDATING EMAIL..." : "Update Email Address"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. UPDATE PHONE NUMBER (WITH SMS OTP VERIFIER) */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="call-outline"
                  size={19}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Mobile Contact Number</Text>
                <Text style={styles.cardSubtitle}>
                  Verified mobile number for direct off-app merchant handshakes
                </Text>
              </View>
            </View>

            <View style={styles.currentContainer}>
              <Text style={styles.currentLabel}>Current Phone Number</Text>
              <View style={styles.currentRow}>
                <Ionicons
                  name="call-outline"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.currentValueText}>
                  {maskPhoneNumber(currentPhone)}
                </Text>
              </View>
            </View>

            <PhoneOtpVerifier
              label="New Phone Number (SMS OTP Verified) *"
              phone={newPhone}
              onChangePhone={setNewPhone}
              isVerified={isPhoneVerified}
              onVerifiedChange={setIsPhoneVerified}
              iconName="call-outline"
            />

            <TouchableOpacity
              style={[styles.button, !isPhoneVerified && { opacity: 0.65 }]}
              activeOpacity={0.85}
              onPress={handleUpdatePhone}
              disabled={savingPhone || !isPhoneVerified}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={Colors.white}
              />
              <Text style={styles.buttonText}>
                {savingPhone ? "UPDATING NUMBER..." : "Update Phone Number"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. CHANGE PASSWORD */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Change Password</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your current password and choose a secure new password
                </Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Current Password *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Ionicons
                    name={showCurrent ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color={Colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New Password *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={Colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min. 6 chars)"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons
                    name={showNew ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color={Colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={Colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color={Colors.icon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={Colors.white}
              />
              <Text style={styles.buttonText}>
                {savingPassword ? "UPDATING PASSWORD..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. SOFT DELETE / DEACTIVATE FOOD BANK ACCOUNT */}
          <View style={[styles.sectionCard, styles.dangerSectionCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, styles.dangerIconCircle]}>
                <Ionicons name="trash-outline" size={19} color="#B3261E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: "#B3261E" }]}>
                  Delete / Deactivate Organization Account
                </Text>
                <Text style={styles.cardSubtitle}>
                  Sets your Food Bank status to Inactive while preserving audit
                  and donation history
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.85}
              onPress={() => setDeleteConfirmVisible(true)}
            >
              <Ionicons name="trash-outline" size={17} color="#B3261E" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Your organization's accreditation and security records are protected
            by RESERVE.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ReserveConfirmModal
        visible={deleteConfirmVisible}
        title="Delete / Deactivate Organization?"
        message="Confirming this action will set your Food Bank account status to Inactive/Deleted. Your historical donation handshakes remain preserved for audit compliance, and you will be signed out immediately."
        confirmText="Yes, Delete Account"
        cancelText="Cancel"
        isDestructive
        onConfirm={executeSoftDeleteAccount}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
  },
  dangerSectionCard: {
    borderColor: "#E8CACA",
    backgroundColor: "#FFFBFB",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  dangerIconCircle: {
    backgroundColor: "#FBEDED",
    borderColor: "#E8CACA",
  },
  cardTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
  },
  cardSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: 1,
  },
  currentContainer: {
    backgroundColor: "#F7F9F7",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  currentLabel: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary1,
    marginBottom: 3,
  },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currentValueText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary2,
    marginBottom: 6,
  },
  inputContainer: {
    height: 44,
    backgroundColor: Colors.input,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 11.5,
    color: Colors.primary2,
    paddingVertical: 0,
  },
  button: {
    height: 44,
    backgroundColor: Colors.button,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  buttonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.white,
  },
  deleteButton: {
    height: 44,
    backgroundColor: "#FBEDED",
    borderWidth: 1,
    borderColor: "#E5B8B4",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: "#B3261E",
  },
  footerText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 4,
  },
});