import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
  PhoneOtpVerifier,
  RegistrationOtpModal,
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";

export default function EstablishmentSignup() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = height < 700;
  const isNarrowPhone = width < 360;
  const horizontalPadding = isNarrowPhone ? 12 : 15;

  const [latitude, setLatitude] = useState(10.3157);
  const [longitude, setLongitude] = useState(123.8854);
  const [contactPerson, setContactPerson] = useState("");
  const [hotline, setHotline] = useState("");
  const [phone, setPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [merchType, setMerchType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const businessTypes = ["Bakeshop", "Market Vendor"];

  const [permitFile, setPermitFile] = useState<any>(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    onConfirm: (() => void) | null = null
  ) => {
    setModalAlert({ visible: true, title, message, type, onConfirm });
  };

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPermitFile({
          uri: asset.uri,
          name: asset.fileName || "business_permit.jpg",
          mimeType: asset.mimeType || "image/jpeg",
          file: (asset as any).file,
        });
      }
    } catch (err) {
      console.log("Error picking document:", err);
    }
  };

  const handleRequestOtp = async () => {
    if (
      !contactPerson.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !merchType ||
      !permitFile
    ) {
      showModal(
        "Missing Required Details",
        "Please fill in your Contact Person, verified Phone Number, Email, Password, Business Type, pin your location on the map, and upload your Cebu City Business Permit.",
        "warning"
      );
      return;
    }
    if (password.length < 6) {
      showModal(
        "Weak Password",
        "Your password must be at least 6 characters long.",
        "warning"
      );
      return;
    }
    if (password !== confirmPassword) {
      showModal(
        "Password Mismatch",
        "Your Password and Confirm Password do not match. Please re-check both fields.",
        "error"
      );
      return;
    }
    if (!isPhoneVerified) {
      showModal(
        "Phone Verification Required",
        "Please verify your Contact Person Number first by tapping 'Send OTP' inside the phone number field.",
        "warning"
      );
      return;
    }
    if (!isAgreed) {
      showModal(
        "Terms of Service",
        "You must agree to the Terms of Service for Food Establishments.",
        "warning"
      );
      return;
    }

    setIsLoading(true);
    try {
      await api.post("accounts/send-otp/", {
        email: email.trim(),
        phone: phone.trim(),
        channel: "email",
      });
      setOtpCode("");
      setOtpModalVisible(true);
    } catch (err: any) {
      showModal(
        "Email OTP Error",
        err.response?.data?.error || "Failed to send Email OTP.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (otpCode.trim().length < 6) {
      showModal(
        "Incomplete Code",
        "Please enter the 6-digit Email OTP code.",
        "warning"
      );
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await api.post("accounts/verify-otp/", {
        email: email.trim(),
        phone: phone.trim(),
        otp: otpCode.trim(),
        channel: "email",
      });
      setOtpModalVisible(false);
      await handleSignup();
    } catch (err: any) {
      showModal(
        "Verification Failed",
        err.response?.data?.error || "Invalid Email OTP code.",
        "error"
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append("user_email", email.trim());
      formData.append("user_pass", password);
      formData.append("contact_person", contactPerson.trim());
      formData.append("hotline", hotline.trim());
      formData.append("phone", phone.trim());
      formData.append("merch_type", merchType);
      formData.append("bus_expiry_date", "2026-12-31");
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));

      if (Platform.OS === "web" && permitFile.file) {
        formData.append("bus_permit_path", permitFile.file);
      } else if (Platform.OS === "web" && permitFile.uri) {
        const res = await fetch(permitFile.uri);
        const blob = await res.blob();
        formData.append(
          "bus_permit_path",
          blob,
          permitFile.name || "business_permit.jpg"
        );
      } else {
        formData.append("bus_permit_path", {
          uri: permitFile.uri,
          name: permitFile.name || "business_permit.jpg",
          type: permitFile.mimeType || "image/jpeg",
        } as any);
      }

      const regRes = await api.post("accounts/register/merchant/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const ocrName = regRes.data?.ocr_analysis?.business_name;
      const detectedMsg =
        ocrName && ocrName !== "Not Detected"
          ? `Detected Establishment: "${ocrName}". `
          : "";

      showModal(
        "Application Submitted!",
        `Phone & Email verified! ${detectedMsg}Your Business Permit has been scanned via AI OCR and sent to ReServe Admin for KYB verification.`,
        "success",
        () => router.replace("/consumer")
      );
    } catch (error: any) {
      console.log("FULL ERROR:", error);
      const errorData = error.response?.data;
      const errorMessage =
        typeof errorData === "object" && errorData !== null
          ? Object.values(errorData).flat().join("\n")
          : "Registration failed.";
      showModal("Registration Error", errorMessage, "error");
    } finally {
      setIsLoading(false);
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
              FOOD ESTABLISHMENT
            </Text>
            <Text style={styles.mainSubtitle}>
              Register your establishment to list surplus food and help reduce
              food waste.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Store Location Pin &amp; Contact Details
            </Text>
          </View>

          <View style={styles.ocrNoticeBanner}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.ocrNoticeText}>
              <Text style={{ fontFamily: "PoppinsSemiBold" }}>
                Automated AI OCR Onboarding:
              </Text>{" "}
              You do not need to type your Establishment Name or Business
              Address manually—our AI OCR engine extracts them directly from
              your uploaded Cebu City Business Permit in Step 4. Simply pin your
              exact store coordinates on the map below!
            </Text>
          </View>

          <CebuAddressMapPicker
            pinOnly
            latitude={latitude}
            longitude={longitude}
            onChangeCoords={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Person *</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Kate Cogtas"
                placeholderTextColor={Colors.placeholder}
                value={contactPerson}
                onChangeText={setContactPerson}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Hotline (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. (032) 234-5678"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
                value={hotline}
                onChangeText={setHotline}
              />
            </View>
          </View>

          {/* INLINE PHONE OTP VERIFIER */}
          <PhoneOtpVerifier
            label="Contact Person Number (SMS OTP Required) *"
            phone={phone}
            onChangePhone={setPhone}
            isVerified={isPhoneVerified}
            onVerifiedChange={setIsPhoneVerified}
            iconName="phone-portrait-outline"
          />

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Account Details</Text>
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
                placeholder="e.g. merchant@email.com"
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
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 4 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* CONFIRM PASSWORD FIELD */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View
              style={[
                styles.inputContainer,
                confirmPassword.length > 0 &&
                  password !== confirmPassword && { borderColor: "#D9383A" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password to confirm"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ paddingHorizontal: 4 }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Business Type</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Select Business Type *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              activeOpacity={0.7}
              onPress={() => setDropdownVisible(true)}
            >
              <View style={styles.dropdownLeft}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text
                  style={[
                    styles.dropdownText,
                    merchType ? { color: Colors.primary2 } : {},
                  ]}
                >
                  {merchType || "-- Select Type --"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={Colors.primary2} />
            </TouchableOpacity>
          </View>

          <Modal visible={dropdownVisible} transparent animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setDropdownVisible(false)}
            >
              <View style={styles.dropdownMenu}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownHeaderText}>
                    Select Business Type
                  </Text>
                </View>
                {businessTypes.map((type, index) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      index === businessTypes.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => {
                      setMerchType(type);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                    {merchType === type && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>4</Text>
            </View>
            <View style={styles.sectionTitleArea}>
              <Text style={styles.sectionTitle}>
                Upload Business Permit (AI OCR)
              </Text>
              <Text style={styles.requiredText}>
                Extracts Establishment Name, Address &amp; Expiry automatically
              </Text>
            </View>
          </View>

          <Text style={styles.documentDescription}>
            Upload a clear photo of your Cebu City Mayor&apos;s Business Permit.
            Our AI OCR engine will automatically extract your Establishment Name,
            Registered Address, Permit Number, and Expiry Date for Admin KYB
            verification.
          </Text>

          <TouchableOpacity
            style={styles.uploadBox}
            activeOpacity={0.7}
            onPress={pickDocument}
          >
            <View style={styles.uploadIconCircle}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={Colors.primary}
              />
            </View>
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>Business Permit</Text>
              <Text style={styles.uploadSubtitle}>
                {permitFile ? permitFile.name : "JPG or PNG Image"}
              </Text>
              <Text style={styles.uploadAction}>
                {permitFile ? "Tap to change file" : "Tap to upload"}
              </Text>
            </View>
            <Ionicons
              name={permitFile ? "checkmark-circle" : "cloud-upload-outline"}
              size={23}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={Colors.primary}
            />
            <Text style={styles.secureText}>
              Files are securely scanned via AI OCR and reviewed by ReServe
              Admin.
            </Text>
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
              <Text style={styles.termsLink}>Terms of Service</Text> for Food
              Establishments.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleRequestOtp}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>
              {isLoading
                ? "SENDING EMAIL OTP..."
                : "Verify Email & Submit Application"}
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
        phone={phone}
        otpCode={otpCode}
        onChangeOtp={setOtpCode}
        onVerify={handleVerifyAndSubmit}
        onResend={handleRequestOtp}
        onClose={() => setOtpModalVisible(false)}
        isVerifying={isVerifyingOtp}
      />

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => {
          const cb = modalAlert.onConfirm;
          setModalAlert((prev) => ({
            ...prev,
            visible: false,
            onConfirm: null,
          }));
          if (cb) cb();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingRight: 12,
  },
  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
    marginLeft: 2,
  },
  brandContainer: { alignItems: "center", marginBottom: 18 },
  logo: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 1,
  },
  card: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 21,
    elevation: 4,
  },
  titleContainer: { marginBottom: 20 },
  mainTitle: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 0.3,
  },
  mainSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 15,
    color: "#777777",
    marginTop: 4,
    maxWidth: 330,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  sectionNumberText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.white,
  },
  sectionTitleArea: { flex: 1 },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: Colors.primary2,
  },
  requiredText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: "#888888",
    marginTop: 1,
  },
  ocrNoticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    padding: 11,
    marginBottom: 12,
  },
  ocrNoticeText: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 14.5,
    color: Colors.primary2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 17,
  },
  fieldContainer: { width: "100%", marginBottom: 12 },
  label: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: "#303030",
    marginBottom: 5,
  },
  inputContainer: {
    width: "100%",
    height: 45,
    backgroundColor: Colors.input,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  inputIcon: { marginRight: 9 },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary2,
    paddingVertical: 0,
  },
  dropdown: {
    width: "100%",
    height: 45,
    backgroundColor: Colors.input,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dropdownLeft: { flexDirection: "row", alignItems: "center" },
  dropdownText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: "#999999",
    marginLeft: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownMenu: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 10,
  },
  dropdownHeader: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  dropdownHeaderText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
    textAlign: "center",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemText: {
    fontFamily: "PoppinsMedium",
    fontSize: 12,
    color: Colors.primary2,
  },
  documentDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 14,
    color: "#777777",
    marginBottom: 10,
  },
  uploadBox: {
    width: "100%",
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#D5E4DC",
    backgroundColor: "#FAFCFB",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 9,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E7F1EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  uploadContent: { flex: 1, minWidth: 0 },
  uploadTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: "#252525",
  },
  uploadSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: "#888888",
    marginTop: 1,
  },
  uploadAction: {
    fontFamily: "PoppinsMedium",
    fontSize: 8.5,
    color: Colors.primary,
    marginTop: 2,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 15,
  },
  secureText: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,
    color: "#777777",
    marginLeft: 6,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,
    color: "#666666",
  },
  termsLink: { fontFamily: "PoppinsMedium", color: Colors.primary },
  submitButton: {
    width: "100%",
    minHeight: 48,
    backgroundColor: Colors.button,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
  },
  submitText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.white,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary2,
  },
  loginLink: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
});