import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { api } from "../../../services/api";
import {
  CebuAddressMapPicker,
  RegistrationOtpModal,
} from "../components/CebuRegistrationHelpers";

export default function ConsumerSignup() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = height < 700;
  const isNarrowPhone = width < 360;
  const horizontalPadding = isNarrowPhone ? 12 : 15;

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(10.3157);
  const [longitude, setLongitude] = useState(123.8854);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP Modal States
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleRequestOtp = async () => {
    if (!fullName || !phoneNumber || !barangay || !streetDetail || !email || !password) {
      alert("Please fill in all required fields and select your Cebu City Barangay.");
      return;
    }
    if (!isAgreed) {
      alert("You must agree to the Terms of Service.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("accounts/send-otp/", { email });
      setDevOtpHint(res.data?.dev_otp_preview || "");
      setOtpCode("");
      setOtpModalVisible(true);
    } catch (error: any) {
      alert(error.response?.data?.error || "Could not send verification OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode.trim().length < 6) {
      alert("Please enter the 6-digit OTP code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await api.post("accounts/verify-otp/", { email, otp: otpCode.trim() });

      const formData = new FormData();
      formData.append("user_email", email.trim());
      formData.append("user_pass", password);
      formData.append("user_role", "Consumer");
      formData.append("full_name", fullName);
      formData.append("phone_number", phoneNumber);
      formData.append("address", address);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));

      await api.post("accounts/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOtpModalVisible(false);
      alert("Email verified & Consumer account created! Please log in.");
      router.replace("/consumer");
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.error ||
        (typeof errorData === "object" && errorData !== null
          ? Object.values(errorData).flat().join("\n")
          : "Verification or registration failed.");
      alert(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isSmallPhone ? 14 : 20,
            paddingBottom: isSmallPhone ? 20 : 30,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.replace("/consumer/account-type")}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
        </View>

        <View style={styles.brandContainer}>
          <Text style={[styles.logo, { fontSize: isNarrowPhone ? 30 : 34 }]}>
            RESERVE
          </Text>
          <Text style={styles.brandSubtitle}>Food rescue made simple</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.mainTitle, { fontSize: isNarrowPhone ? 17 : 19 }]}
            >
              CONSUMER ACCOUNT
            </Text>
            <Text style={styles.mainSubtitle}>
              Sign up to rescue discounted surplus food within 10km of your Cebu
              City location.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Personal & Location Details</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Cyrus Vince Lingo"
                placeholderTextColor={Colors.placeholder}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. +63 912 345 6789"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          {/* CEBU CITY CASCADING DROPDOWNS + MAP PINNING */}
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

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Account Credentials</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email Address (OTP Verified) *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. consumer@email.com"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Create a secure password"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            activeOpacity={0.7}
            onPress={() => setIsAgreed(!isAgreed)}
          >
            <View
              style={[
                styles.checkbox,
                !isAgreed && { backgroundColor: Colors.input },
              ]}
            >
              {isAgreed && (
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              )}
            </View>
            <Text style={styles.termsText}>
              I have read and agree to the{" "}
              <Text style={styles.termsLink}>Terms of Service</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleRequestOtp}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>
              {isLoading ? "SENDING OTP..." : "Verify Email & Create Account"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/consumer")}
            >
              <Text style={styles.loginLink}> Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <RegistrationOtpModal
        visible={otpModalVisible}
        email={email}
        otpCode={otpCode}
        onChangeOtp={setOtpCode}
        onVerify={handleVerifyAndRegister}
        onResend={handleRequestOtp}
        onClose={() => setOtpModalVisible(false)}
        isVerifying={isVerifyingOtp}
        devOtpHint={devOtpHint}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  header: { width: "100%", flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backButton: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingRight: 12 },
  headerTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2, marginLeft: 2 },
  brandContainer: { alignItems: "center", marginBottom: 18 },
  logo: { fontFamily: "PoppinsBold", color: Colors.primary2, letterSpacing: 1.5 },
  brandSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9, color: Colors.primary1, marginTop: 1 },
  card: { width: "100%", maxWidth: 500, backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 21, elevation: 4 },
  titleContainer: { marginBottom: 20 },
  mainTitle: { fontFamily: "PoppinsBold", color: Colors.primary2, letterSpacing: 0.3 },
  mainSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9.5, lineHeight: 15, color: "#777777", marginTop: 4, maxWidth: 330 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 13 },
  sectionNumber: { width: 27, height: 27, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginRight: 9 },
  sectionNumberText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.white },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2 },
  sectionDivider: { height: 1, backgroundColor: "#E8E8E8", marginVertical: 17 },
  fieldContainer: { width: "100%", marginBottom: 12 },
  label: { fontFamily: "PoppinsMedium", fontSize: 10, color: "#303030", marginBottom: 5 },
  inputContainer: { width: "100%", height: 45, backgroundColor: Colors.input, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, height: "100%", fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary2, paddingVertical: 0 },
  termsContainer: { flexDirection: "row", alignItems: "flex-start", marginTop: 6, marginBottom: 16 },
  checkbox: { width: 17, height: 17, borderRadius: 4, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginRight: 7, marginTop: 1 },
  termsText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 8.5, lineHeight: 13, color: "#666666" },
  termsLink: { fontFamily: "PoppinsMedium", color: Colors.primary },
  submitButton: { width: "100%", minHeight: 48, backgroundColor: Colors.button, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, elevation: 2 },
  submitText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.white },
  loginContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 },
  loginText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary2 },
  loginLink: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
});