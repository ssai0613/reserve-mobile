import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

  // Permit + Autofilled Editable Business Fields
  const [permitFile, setPermitFile] = useState<any>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrStatusBanner, setOcrStatusBanner] = useState<string | null>(null);

  const [busName, setBusName] = useState("");
  const [address, setAddress] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [lineOfBusiness, setLineOfBusiness] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [calendarYear, setCalendarYear] = useState("");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");

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

  const scanPermitAndAutofill = async (pickedAsset: {
    uri: string;
    name: string;
    mimeType: string;
    file?: any;
  }) => {
    setIsScanningOcr(true);
    setOcrStatusBanner(
      "Scanning Business Permit with AI OCR to autofill your details..."
    );

    try {
      const formData = new FormData();
      if (Platform.OS === "web" && pickedAsset.file) {
        formData.append("bus_permit_path", pickedAsset.file);
      } else if (Platform.OS === "web" && pickedAsset.uri) {
        const res = await fetch(pickedAsset.uri);
        const blob = await res.blob();
        formData.append(
          "bus_permit_path",
          blob,
          pickedAsset.name || "business_permit.jpg"
        );
      } else {
        formData.append("bus_permit_path", {
          uri: pickedAsset.uri,
          name: pickedAsset.name || "business_permit.jpg",
          type: pickedAsset.mimeType || "image/jpeg",
        } as any);
      }

      const res = await api.post("accounts/scan-permit/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const ocr = res.data?.ocr_data || {};
      let detectedCount = 0;

      if (ocr.business_name) {
        setBusName(ocr.business_name);
        detectedCount++;
      }
      if (ocr.business_address) {
        setAddress(ocr.business_address);
        detectedCount++;
      }
      if (ocr.permit_number) {
        setPermitNumber(ocr.permit_number);
        detectedCount++;
      }
      if (ocr.nature_of_business) {
        setLineOfBusiness(ocr.nature_of_business);
        detectedCount++;
      }
      if (ocr.tin_number) {
        setTinNumber(ocr.tin_number);
        detectedCount++;
      }
      if (ocr.calendar_year) {
        setCalendarYear(ocr.calendar_year);
        detectedCount++;
      }
      if (ocr.expiry_date) {
        setExpiryDate(ocr.expiry_date);
      }
      if (ocr.representative && !contactPerson.trim()) {
        setContactPerson(ocr.representative);
      }

      if (detectedCount > 0) {
        setOcrStatusBanner(
          "AI OCR autofilled your permit details below! Please review and edit any field if needed."
        );
      } else {
        setOcrStatusBanner(
          "Permit uploaded! Could not auto-detect all text—please type or edit the fields below."
        );
      }
    } catch (err) {
      console.log("OCR Autofill Notice:", err);
      setOcrStatusBanner(
        "Permit attached! Please fill in or verify the business details below."
      );
    } finally {
      setIsScanningOcr(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const rawName = asset.fileName || "business_permit.jpg";
        const safeJpgName = rawName.replace(/\.(heic|heif)$/i, ".jpg");
        const fileObj = {
          uri: asset.uri,
          name: safeJpgName,
          mimeType: "image/jpeg",
          file: (asset as any).file,
        };
        setPermitFile(fileObj);
        await scanPermitAndAutofill(fileObj);
      }
    } catch (err) {
      console.log("Error picking document:", err);
    }
  };

  const handleRequestOtp = async () => {
    if (
      !permitFile ||
      !busName.trim() ||
      !address.trim() ||
      !permitNumber.trim() ||
      !lineOfBusiness.trim() ||
      !tinNumber.trim() ||
      !calendarYear.trim() ||
      !contactPerson.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !merchType
    ) {
      showModal(
        "Missing Required Details",
        "Please upload your Business Permit, review/complete all autofilled permit fields (Establishment Name, Address, Permit No., Line of Business, TIN, Calendar Year), select your Business Type, and complete your Contact & Account details.",
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
      formData.append("bus_name", busName.trim());
      formData.append("address", address.trim());
      formData.append("permit_number", permitNumber.trim());
      formData.append("line_of_business", lineOfBusiness.trim());
      formData.append("tin_number", tinNumber.trim());
      formData.append("calendar_year", calendarYear.trim());
      formData.append("contact_person", contactPerson.trim());
      formData.append("hotline", hotline.trim());
      formData.append("phone", phone.trim());
      formData.append("merch_type", merchType);
      formData.append("bus_expiry_date", expiryDate || "2026-12-31");
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

      await api.post("accounts/register/merchant/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showModal(
        "Application Submitted!",
        `Phone & Email verified! Your registration for "${busName.trim()}" has been submitted to the ReServe Admin team for review and approval.`,
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
              Upload your Cebu City Business Permit to autofill your business
              details via AI OCR, review or edit any field, and submit for Admin
              approval.
            </Text>
          </View>

          {/* STEP 1: UPLOAD PERMIT & AUTOFILL BUSINESS DETAILS */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>
            <View style={styles.sectionTitleArea}>
              <Text style={styles.sectionTitle}>
                Upload Business Permit (AI OCR Autofill)
              </Text>
              <Text style={styles.requiredText}>
                Autofills Establishment Name, Address, Permit No., TIN &amp;
                Line of Business
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadBox}
            activeOpacity={0.7}
            onPress={pickDocument}
            disabled={isScanningOcr}
          >
            <View style={styles.uploadIconCircle}>
              {isScanningOcr ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={Colors.primary}
                />
              )}
            </View>
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>
                Cebu City Mayor&apos;s Business Permit *
              </Text>
              <Text style={styles.uploadSubtitle}>
                {isScanningOcr
                  ? "Scanning permit with AI OCR..."
                  : permitFile
                  ? permitFile.name
                  : "JPG, PNG, or HEIC Image"}
              </Text>
              <Text style={styles.uploadAction}>
                {permitFile
                  ? "Tap to upload a different permit & re-scan"
                  : "Tap to upload & autofill fields below"}
              </Text>
            </View>
            <Ionicons
              name={permitFile ? "checkmark-circle" : "cloud-upload-outline"}
              size={23}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {ocrStatusBanner && (
            <View style={styles.ocrNoticeBanner}>
              <Ionicons
                name={isScanningOcr ? "sync-outline" : "sparkles-outline"}
                size={17}
                color={Colors.primary}
              />
              <Text style={styles.ocrNoticeText}>{ocrStatusBanner}</Text>
            </View>
          )}

          {/* EDITABLE AUTOFILLED PLACEHOLDERS */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Establishment Name (Autofilled • Editable) *
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="storefront-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. TISA FRESH PRODUCE TRADING"
                placeholderTextColor={Colors.placeholder}
                value={busName}
                onChangeText={setBusName}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Business Address (Autofilled • Editable) *
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Tisa Public Market, Katipunan Street, Tisa, Cebu City"
                placeholderTextColor={Colors.placeholder}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.fieldContainer, { flex: 1 }]}>
              <Text style={styles.label}>Business Permit No. *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="document-outline"
                  size={18}
                  color={Colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 126225"
                  placeholderTextColor={Colors.placeholder}
                  value={permitNumber}
                  onChangeText={setPermitNumber}
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, { flex: 1 }]}>
              <Text style={styles.label}>Calendar Year *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2026-2027"
                  placeholderTextColor={Colors.placeholder}
                  value={calendarYear}
                  onChangeText={setCalendarYear}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Line of Business (Autofilled • Editable) *
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="briefcase-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Retail sale of fresh vegetables; Retail sale of seasonal fruits"
                placeholderTextColor={Colors.placeholder}
                value={lineOfBusiness}
                onChangeText={setLineOfBusiness}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              TIN Number (Autofilled • Editable) *
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="card-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 345-678-901-000"
                placeholderTextColor={Colors.placeholder}
                value={tinNumber}
                onChangeText={setTinNumber}
              />
            </View>
          </View>

          {/* MAP PIN FOR 10KM HAVERSINE MATCHING */}
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
            <Text style={styles.label}>
              Contact Person / Authorized Taxpayer *
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Maria L. Santos"
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

          <PhoneOtpVerifier
            label="Contact Person Number (SMS OTP Required) *"
            phone={phone}
            onChangePhone={setPhone}
            isVerified={isPhoneVerified}
            onVerifiedChange={setIsPhoneVerified}
            iconName="phone-portrait-outline"
          />

          <View style={styles.sectionDivider} />

          {/* STEP 2: ACCOUNT DETAILS */}
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

          {/* STEP 3: BUSINESS TYPE */}
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

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={Colors.primary}
            />
            <Text style={styles.secureText}>
              Your verified permit and business details are securely transmitted
              to the Admin team for approval.
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
            disabled={isLoading || isScanningOcr}
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
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  ocrNoticeText: {
    flex: 1,
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    lineHeight: 14,
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
    marginBottom: 10,
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
    marginTop: 4,
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