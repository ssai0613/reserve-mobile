import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";
import {
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return null;
  }
};

export default function ResubmitPermitScreen() {
  const params = useLocalSearchParams();
  const { width, height } = useWindowDimensions();

  const isSmallPhone = height < 700;
  const isNarrowPhone = width < 360;
  const horizontalPadding = isNarrowPhone ? 14 : 18;

  const [accountId, setAccountId] = useState(String(params.id || ""));
  const [accountRole, setAccountRole] = useState(
    String(params.role || "Merchant")
  );
  const [accountStatus, setAccountStatus] = useState(
    String(params.status || "Resubmit Required")
  );
  const [statusReason, setStatusReason] = useState(
    String(
      params.reason ||
        "Please upload a clear, valid copy of your official permit document."
    )
  );

  const [permitFile, setPermitFile] = useState<any>(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrStatusBanner, setOcrStatusBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [busName, setBusName] = useState(String(params.name || ""));
  const [address, setAddress] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [lineOfBusiness, setLineOfBusiness] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [calendarYear, setCalendarYear] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [expiryDate, setExpiryDate] = useState(
    String(params.expiry || "2026-12-31")
  );

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

  useEffect(() => {
    const loadExistingPermitContext = async () => {
      const storedId = await getStorageItem("profile_id");
      const storedRole = await getStorageItem("user_role");
      const storedName = await getStorageItem("entity_name");
      const storedStatus = await getStorageItem("account_status");
      const storedReason = await getStorageItem("status_reason");
      const storedExpiry = await getStorageItem("expiry_date");

      const resolvedId = String(params.id || storedId || "");
      const resolvedRole = String(params.role || storedRole || "Merchant");

      if (resolvedId) setAccountId(resolvedId);
      if (resolvedRole) setAccountRole(resolvedRole);
      if (!busName && storedName) setBusName(storedName);
      if (!params.status && storedStatus) setAccountStatus(storedStatus);
      if (!params.reason && storedReason) setStatusReason(storedReason);
      if (!params.expiry && storedExpiry) setExpiryDate(storedExpiry);

      if (resolvedId && /^\d+$/.test(resolvedId)) {
        try {
          const res = await api.get(
            `accounts/merchant/${resolvedId}/resubmit-permit/?role=${encodeURIComponent(
              resolvedRole
            )}`
          );
          const d = res.data || {};
          if (d.bus_name) setBusName(d.bus_name);
          if (d.address) setAddress(d.address);
          if (d.permit_number) setPermitNumber(d.permit_number);
          if (d.line_of_business) setLineOfBusiness(d.line_of_business);
          if (d.tin_number) setTinNumber(d.tin_number);
          if (d.calendar_year) setCalendarYear(d.calendar_year);
          if (d.contact_person) setContactPerson(d.contact_person);
          if (d.status) setAccountStatus(d.status);
          if (d.reason) setStatusReason(d.reason);
          if (d.expiry_date) setExpiryDate(d.expiry_date);
        } catch (err) {
          console.log("Resubmit initial fetch notice:", err);
        }
      }
    };
    loadExistingPermitContext();
  }, [params.id, params.role]);

  const isFoodBank = accountRole.toLowerCase() === "foodbank";

  const scanPermitAndAutofill = async (pickedAsset: {
    uri: string;
    name: string;
    mimeType: string;
    file?: any;
  }) => {
    if (isFoodBank) {
      setOcrStatusBanner(
        "Accreditation certificate attached! Tap Submit below to send it to ReServe Admin."
      );
      return;
    }

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
      if (ocr.representative) {
        setContactPerson(ocr.representative);
      }

      if (detectedCount > 0) {
        setOcrStatusBanner(
          "AI OCR autofilled your permit details below! Please review and edit any field before submitting."
        );
      } else {
        setOcrStatusBanner(
          "Permit uploaded! Please review or edit your business details below before submitting."
        );
      }
    } catch (err) {
      console.log("Resubmit OCR Autofill Notice:", err);
      setOcrStatusBanner(
        "Permit attached! Please verify and complete the business details below."
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

  const handleSubmitResubmission = async () => {
    if (!permitFile) {
      showModal(
        "Document Required",
        `Please upload a clear photo of your ${
          isFoodBank
            ? "NGO Accreditation Certificate"
            : "Cebu City Mayor's Business Permit"
        } first.`,
        "warning"
      );
      return;
    }

    if (!isFoodBank && !busName.trim()) {
      showModal(
        "Establishment Name Required",
        "Please enter or verify your Establishment Name before submitting.",
        "warning"
      );
      return;
    }

    const targetId =
      accountId || (await getStorageItem("profile_id")) || "";
    if (!targetId) {
      showModal(
        "Account ID Missing",
        "Could not determine your account ID. Please log in again.",
        "error",
        () => router.replace("/consumer")
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("role", isFoodBank ? "FoodBank" : "Merchant");

      if (!isFoodBank) {
        formData.append("bus_name", busName.trim());
        formData.append(
          "address",
          address.trim() || "Cebu City, Philippines"
        );
        formData.append("permit_number", permitNumber.trim() || "N/A");
        formData.append("line_of_business", lineOfBusiness.trim());
        formData.append("tin_number", tinNumber.trim() || "N/A");
        formData.append("calendar_year", calendarYear.trim() || "2026-2027");
        formData.append("contact_person", contactPerson.trim());
        formData.append("bus_expiry_date", expiryDate || "2026-12-31");
      }

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

      const response = await api.post(
        `accounts/merchant/${targetId}/resubmit-permit/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      showModal(
        "Permit Resubmitted!",
        response.data?.message ||
          "Your updated permit and business details have been sent to the ReServe Admin team for verification.",
        "success",
        () => router.replace("/consumer")
      );
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error ||
        "Could not submit your updated permit. Please check your connection and try again.";
      showModal("Submission Failed", errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: isSmallPhone ? 12 : 18,
              paddingBottom: 32,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.replace("/consumer")}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primary2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {accountStatus === "Renewal Required"
                ? "Permit Renewal"
                : "Document Resubmission"}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.alertBanner}>
              <View style={styles.alertIconWrap}>
                <Ionicons name="warning-outline" size={22} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertBadgeText}>
                  {accountStatus.toUpperCase()}
                </Text>
                <Text style={styles.alertReasonText}>
                  Admin Notice: &quot;{statusReason}&quot;
                </Text>
              </View>
            </View>

            <Text style={styles.mainTitle}>
              {isFoodBank
                ? "Upload Updated Accreditation Certificate"
                : "Upload & Verify Business Permit (AI OCR)"}
            </Text>
            <Text style={styles.mainSubtitle}>
              {isFoodBank
                ? "Please upload a clear image of your valid DSWD / SEC / LGU Accreditation Certificate for Admin verification."
                : "Upload a clear photo of your Cebu City Mayor's Business Permit. Our AI OCR engine will autofill your business details below so you can review or edit them before submitting."}
            </Text>

            <TouchableOpacity
              style={styles.uploadBox}
              activeOpacity={0.75}
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
                  {isFoodBank
                    ? "NGO Accreditation Certificate *"
                    : "Cebu City Mayor's Business Permit *"}
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
                    ? "Tap to select a different image & re-scan"
                    : "Tap to upload & autofill fields"}
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

            {!isFoodBank && (
              <View style={{ marginTop: 6 }}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>
                    Establishment Name (Autofilled • Editable) *
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="storefront-outline"
                      size={18}
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
                      size={18}
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
                        size={17}
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
                        size={17}
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
                      size={18}
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
                      size={18}
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

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>
                    Contact Person / Authorized Taxpayer
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="person-outline"
                      size={18}
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
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || isScanningOcr) && { opacity: 0.7 },
              ]}
              activeOpacity={0.85}
              onPress={handleSubmitResubmission}
              disabled={isSubmitting || isScanningOcr}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={styles.submitText}>
                    Submit Updated Permit for Admin Approval
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  header: { width: "100%", maxWidth: 500, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginRight: 10 },
  headerTitle: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary2 },
  card: { width: "100%", maxWidth: 500, backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 20, elevation: 4 },
  alertBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#F59E0B", borderRadius: 12, padding: 12, marginBottom: 16 },
  alertIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#FDE68A", alignItems: "center", justifyContent: "center" },
  alertBadgeText: { fontFamily: "PoppinsBold", fontSize: 11, color: "#B45309", letterSpacing: 0.4 },
  alertReasonText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: "#92400E", lineHeight: 15, marginTop: 2 },
  mainTitle: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary2 },
  mainSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, lineHeight: 15, color: Colors.primary1, marginTop: 4, marginBottom: 14 },
  uploadBox: { width: "100%", minHeight: 74, borderWidth: 1, borderColor: "#D5E4DC", backgroundColor: "#FAFCFB", borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  uploadIconCircle: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#E7F1EC", alignItems: "center", justifyContent: "center", marginRight: 10 },
  uploadContent: { flex: 1, minWidth: 0 },
  uploadTitle: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 },
  uploadSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9, color: "#888888", marginTop: 1 },
  uploadAction: { fontFamily: "PoppinsMedium", fontSize: 9, color: Colors.primary, marginTop: 2 },
  ocrNoticeBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 10, marginBottom: 10 },
  ocrNoticeText: { flex: 1, fontFamily: "PoppinsMedium", fontSize: 9.5, lineHeight: 14, color: Colors.primary2 },
  fieldContainer: { width: "100%", marginBottom: 12 },
  label: { fontFamily: "PoppinsMedium", fontSize: 10, color: "#303030", marginBottom: 5 },
  inputContainer: { width: "100%", height: 45, backgroundColor: Colors.input, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, height: "100%", fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary2, paddingVertical: 0 },
  submitButton: { width: "100%", minHeight: 48, backgroundColor: Colors.button, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  submitText: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.white },
});