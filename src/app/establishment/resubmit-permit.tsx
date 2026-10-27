import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResubmitPermitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const merchId = params.id as string;
  const role = (params.role as string) || "Merchant";
  const entityName = (params.name as string) || "Your Establishment";
  const statusType = (params.status as string) || "Resubmit Required";
  const reason =
    (params.reason as string) ||
    "Please upload a clear, valid copy of your official Business Permit.";

  const [permitFile, setPermitFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isRenewal = statusType === "Renewal Required";

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
          name: asset.fileName || "renewed_permit.jpg",
          mimeType: asset.mimeType || "image/jpeg",
          file: (asset as any).file,
        });
      }
    } catch (err) {
      console.log("Error picking image:", err);
    }
  };

  const handleResubmit = async () => {
    if (!permitFile) {
      alert("Please select your updated Business Permit image first.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("role", role);

      if (Platform.OS === "web" && permitFile.file) {
        formData.append("bus_permit_path", permitFile.file);
      } else if (Platform.OS === "web" && permitFile.uri) {
        const res = await fetch(permitFile.uri);
        const blob = await res.blob();
        formData.append("bus_permit_path", blob, permitFile.name || "renewed_permit.jpg");
      } else {
        formData.append("bus_permit_path", {
          uri: permitFile.uri,
          name: permitFile.name || "renewed_permit.jpg",
          type: permitFile.mimeType || "image/jpeg",
        } as any);
      }

      await axios.post(
        `http://127.0.0.1:8000/api/accounts/merchant/${merchId}/resubmit-permit/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(
        "Document uploaded successfully! Our AI OCR has scanned your permit and sent it to the Admin team for verification."
      );
      router.replace("/consumer");
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error ||
        "Failed to upload document. Please try again.";
      alert(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandContainer}>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.brandSubtitle}>KYB Compliance & Verification</Text>
        </View>

        <View style={styles.card}>
          {/* Status Banner */}
          <View
            style={[
              styles.alertBanner,
              isRenewal ? styles.renewalBanner : styles.rejectBanner,
            ]}
          >
            <Ionicons
              name={isRenewal ? "calendar-outline" : "alert-circle-outline"}
              size={24}
              color={isRenewal ? "#B45309" : "#BE123C"}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.alertTitle,
                  { color: isRenewal ? "#92400E" : "#9F1239" },
                ]}
              >
                {isRenewal
                  ? "ANNUAL BUSINESS PERMIT RENEWAL"
                  : "DOCUMENT RESUBMISSION REQUIRED"}
              </Text>
              <Text style={styles.alertReason}>{reason}</Text>
            </View>
          </View>

          {/* Saved Account Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ESTABLISHMENT ACCOUNT</Text>
            <Text style={styles.infoValue}>{entityName}</Text>
            <Text style={styles.infoSubtext}>
              Your registration profile is already saved. Only a new document
              upload is required.
            </Text>
          </View>

          {/* Upload Box */}
          <Text style={styles.sectionLabel}>
            {isRenewal
              ? "Upload Renewed Mayor's Business Permit"
              : "Upload Clear Replacement Document"}
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
              <Text style={styles.uploadTitle}>
                {role === "FoodBank"
                  ? "Accreditation Certificate"
                  : "Mayor's Business Permit"}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {permitFile ? permitFile.name : "JPG or PNG Image"}
              </Text>
              <Text style={styles.uploadAction}>
                {permitFile ? "Tap to change image" : "Tap to select image"}
              </Text>
            </View>
            <Ionicons
              name={permitFile ? "checkmark-circle" : "cloud-upload-outline"}
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleResubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>
              {isLoading ? "SCANNING & UPLOADING..." : "Submit for Verification"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => router.replace("/consumer")}
          >
            <Text style={styles.backToLoginText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  brandContainer: { alignItems: "center", marginBottom: 18 },
  logo: { fontFamily: "PoppinsBold", fontSize: 32, color: Colors.primary2, letterSpacing: 1.5 },
  brandSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  card: { width: "100%", maxWidth: 460, backgroundColor: Colors.white, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  alertBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  rejectBanner: { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
  renewalBanner: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  alertTitle: { fontFamily: "PoppinsBold", fontSize: 11, letterSpacing: 0.3 },
  alertReason: { fontFamily: "PoppinsRegular", fontSize: 10, color: "#4B5563", marginTop: 3, lineHeight: 15 },
  infoBox: { backgroundColor: "#F8FAFC", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 18 },
  infoLabel: { fontFamily: "PoppinsSemiBold", fontSize: 9, color: "#64748B", letterSpacing: 0.5 },
  infoValue: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginTop: 2 },
  infoSubtext: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: "#64748B", marginTop: 4 },
  sectionLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginBottom: 8 },
  uploadBox: { width: "100%", minHeight: 74, borderWidth: 1, borderColor: "#D5E4DC", backgroundColor: "#FAFCFB", borderRadius: 12, flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 18 },
  uploadIconCircle: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#E7F1EC", alignItems: "center", justifyContent: "center", marginRight: 12 },
  uploadContent: { flex: 1 },
  uploadTitle: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: "#252525" },
  uploadSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9, color: "#888888", marginTop: 1 },
  uploadAction: { fontFamily: "PoppinsMedium", fontSize: 9, color: Colors.primary, marginTop: 2 },
  submitButton: { width: "100%", minHeight: 48, backgroundColor: Colors.button, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontFamily: "PoppinsSemiBold", fontSize: 11.5, color: Colors.white },
  backToLogin: { alignItems: "center", marginTop: 16 },
  backToLoginText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary1 },
});