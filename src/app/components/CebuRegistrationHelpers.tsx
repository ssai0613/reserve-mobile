import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { api } from "../../../services/api";

export type BarangayCoord = {
  name: string;
  lat: number;
  lng: number;
};

export type ReserveModalState = {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onConfirm?: (() => void) | null;
};

export const CEBU_CITY_BARANGAYS: BarangayCoord[] = [
  { name: "Apas", lat: 10.3364, lng: 123.9056 },
  { name: "Banilad", lat: 10.3456, lng: 123.9136 },
  { name: "Basak Pardo", lat: 10.2872, lng: 123.8614 },
  { name: "Basak San Nicolas", lat: 10.2917, lng: 123.8689 },
  { name: "Busay", lat: 10.3694, lng: 123.8781 },
  { name: "Calamba", lat: 10.3014, lng: 123.8831 },
  { name: "Capitol Site", lat: 10.3168, lng: 123.8906 },
  { name: "Carreta", lat: 10.3078, lng: 123.9083 },
  { name: "Cogon Pardo", lat: 10.2789, lng: 123.8581 },
  { name: "Cogon Ramos", lat: 10.3092, lng: 123.8969 },
  { name: "Day-as", lat: 10.3036, lng: 123.9017 },
  { name: "Duljo Fatima", lat: 10.2939, lng: 123.8819 },
  { name: "Ermita (Carbon Market)", lat: 10.2919, lng: 123.8992 },
  { name: "Guadalupe", lat: 10.3219, lng: 123.8769 },
  { name: "Hipodromo", lat: 10.3144, lng: 123.9086 },
  { name: "Inayawan", lat: 10.2708, lng: 123.8569 },
  { name: "Kamagayan", lat: 10.3025, lng: 123.8986 },
  { name: "Kamputhaw (Camputhaw)", lat: 10.3203, lng: 123.8981 },
  { name: "Kasambagan", lat: 10.3292, lng: 123.9125 },
  { name: "Kinasang-an Pardo", lat: 10.2817, lng: 123.8542 },
  { name: "Labangon", lat: 10.3019, lng: 123.8761 },
  { name: "Lahug", lat: 10.3322, lng: 123.8986 },
  { name: "Lorega San Miguel", lat: 10.3069, lng: 123.9039 },
  { name: "Luz", lat: 10.3236, lng: 123.9069 },
  { name: "Mabolo", lat: 10.3228, lng: 123.9147 },
  { name: "Mambaling", lat: 10.2889, lng: 123.8778 },
  { name: "Pahina Central", lat: 10.2969, lng: 123.8936 },
  { name: "Pardo (Poblacion)", lat: 10.2803, lng: 123.8644 },
  { name: "Pari-an", lat: 10.3003, lng: 123.9028 },
  { name: "Pasil", lat: 10.2917, lng: 123.8894 },
  { name: "Pit-os", lat: 10.3917, lng: 123.9222 },
  { name: "Punta Princesa", lat: 10.2986, lng: 123.8689 },
  { name: "Quiot Pardo", lat: 10.2897, lng: 123.8594 },
  { name: "Sambag I", lat: 10.3044, lng: 123.8919 },
  { name: "Sambag II", lat: 10.3094, lng: 123.8919 },
  { name: "San Antonio", lat: 10.2997, lng: 123.8983 },
  { name: "San Jose", lat: 10.3625, lng: 123.9139 },
  { name: "San Nicolas Proper", lat: 10.2944, lng: 123.8886 },
  { name: "San Roque (Ciudad)", lat: 10.2939, lng: 123.9056 },
  { name: "Santa Cruz", lat: 10.3067, lng: 123.8953 },
  { name: "Santo Niño (Downtown)", lat: 10.2944, lng: 123.9019 },
  { name: "Suba", lat: 10.2908, lng: 123.8917 },
  { name: "Talamban", lat: 10.3711, lng: 123.9169 },
  { name: "Tejero", lat: 10.3039, lng: 123.9086 },
  { name: "Tinago", lat: 10.3008, lng: 123.9078 },
  { name: "Tisa", lat: 10.2992, lng: 123.8681 },
  { name: "Zapatera", lat: 10.3086, lng: 123.9006 },
];

export function ReserveAlertModal({
  visible,
  title,
  message,
  type = "info",
  buttonText = "OK",
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  buttonText?: string;
  onClose: () => void;
}) {
  const iconConfig = {
    success: {
      name: "checkmark-circle" as const,
      color: Colors.primary,
      bg: "#E7F3EC",
    },
    error: { name: "alert-circle" as const, color: "#D9383A", bg: "#FDECEC" },
    warning: { name: "warning" as const, color: "#D97706", bg: "#FEF3C7" },
    info: {
      name: "information-circle" as const,
      color: Colors.primary,
      bg: "#E8EFEA",
    },
  }[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { padding: 22, maxWidth: 370 }]}>
          <View
            style={[styles.otpIconCircle, { backgroundColor: iconConfig.bg }]}
          >
            <Ionicons
              name={iconConfig.name}
              size={30}
              color={iconConfig.color}
            />
          </View>

          <Text style={styles.otpTitle}>{title}</Text>
          <Text
            style={[styles.otpSubtitle, { marginTop: 6, marginBottom: 18 }]}
          >
            {message}
          </Text>

          <TouchableOpacity
            style={[
              styles.verifyBtn,
              type === "error" && { backgroundColor: "#D9383A" },
            ]}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Text style={styles.verifyBtnText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function ReserveConfirmModal({
  visible,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes, Proceed",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { padding: 22, maxWidth: 370 }]}>
          <View
            style={[
              styles.otpIconCircle,
              { backgroundColor: isDestructive ? "#FDECEC" : "#E8EFEA" },
            ]}
          >
            <Ionicons
              name={isDestructive ? "log-out-outline" : "help-circle-outline"}
              size={28}
              color={isDestructive ? "#D9383A" : Colors.primary}
            />
          </View>

          <Text style={styles.otpTitle}>{title}</Text>
          <Text
            style={[styles.otpSubtitle, { marginTop: 6, marginBottom: 18 }]}
          >
            {message}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.verifyBtn,
                {
                  flex: 1,
                  backgroundColor: "#F2F4F3",
                  borderWidth: 1,
                  borderColor: Colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={onCancel}
            >
              <Text style={[styles.verifyBtnText, { color: Colors.primary2 }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.verifyBtn,
                {
                  flex: 1,
                  backgroundColor: isDestructive ? "#D9383A" : Colors.button,
                },
              ]}
              activeOpacity={0.85}
              onPress={onConfirm}
            >
              <Text style={styles.verifyBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ForgotPasswordEmailModal({
  visible,
  initialEmail = "",
  onClose,
  onSuccess,
}: {
  visible: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}) {
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setResetEmail(initialEmail);
      setFeedback(null);
    }
  }, [visible, initialEmail]);

  const handleSendResetLink = async () => {
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFeedback({
        type: "error",
        text: "Please enter the valid email address linked to your RESERVE account.",
      });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const res = await api.post("accounts/forgot-password/", {
        email: cleanEmail,
      });
      const msg =
        res.data?.message ||
        `A password reset link has been sent to ${cleanEmail}. Check your email inbox and click the link to set a new password.`;
      setFeedback({ type: "success", text: msg });
      if (onSuccess) onSuccess(msg);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text:
          err.response?.data?.error ||
          "Could not send password reset email. Please verify your email address.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { padding: 22, maxWidth: 380 }]}>
          <View style={styles.otpIconCircle}>
            <Ionicons name="key-outline" size={28} color={Colors.primary} />
          </View>

          <Text style={styles.otpTitle}>Forgot Your Password?</Text>
          <Text style={styles.otpSubtitle}>
            Enter your registered email address below. We will send you a secure
            link to reset your password directly from your email.
          </Text>

          <Text style={styles.fieldLabel}>Registered Email Address *</Text>
          <View style={[styles.inputBox, { marginBottom: 12 }]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. user@email.com"
              placeholderTextColor={Colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={resetEmail}
              onChangeText={setResetEmail}
            />
          </View>

          {feedback && (
            <View
              style={[
                styles.feedbackBanner,
                feedback.type === "success"
                  ? styles.feedbackSuccess
                  : styles.feedbackError,
              ]}
            >
              <Ionicons
                name={
                  feedback.type === "success"
                    ? "checkmark-circle"
                    : "alert-circle"
                }
                size={16}
                color={feedback.type === "success" ? Colors.primary : "#D9383A"}
              />
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color:
                      feedback.type === "success" ? Colors.primary2 : "#B91C1C",
                  },
                ]}
              >
                {feedback.text}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.verifyBtn}
            activeOpacity={0.85}
            onPress={handleSendResetLink}
            disabled={sending}
          >
            <Text style={styles.verifyBtnText}>
              {sending ? "SENDING RESET LINK..." : "Send Reset Link to Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 14, alignSelf: "center" }}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function PhoneOtpVerifier({
  label = "Phone Number (SMS OTP Verified) *",
  phone,
  onChangePhone,
  isVerified,
  onVerifiedChange,
  iconName = "call-outline",
}: {
  label?: string;
  phone: string;
  onChangePhone: (val: string) => void;
  isVerified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  iconName?: any;
}) {
  const [sendingSms, setSendingSms] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [normalizedDisplay, setNormalizedDisplay] = useState("");
  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModalAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setModalAlert({ visible: true, title, message, type });
  };

  const handlePhoneTextChange = (text: string) => {
    onChangePhone(text);
    if (isVerified) {
      onVerifiedChange(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      showModalAlert(
        "Phone Number Required",
        "Please enter your Philippine mobile number first.",
        "warning"
      );
      return;
    }

    setSendingSms(true);
    try {
      const res = await api.post("accounts/send-otp/", {
        phone: phone.trim(),
        channel: "sms",
      });
      setNormalizedDisplay(res.data?.normalized_phone || phone.trim());
      setSmsCode("");
      setOtpSent(true);
      showModalAlert(
        "SMS OTP Sent",
        res.data?.message ||
          `6-digit SMS OTP sent to ${
            res.data?.normalized_phone || phone.trim()
          }!`,
        "success"
      );
    } catch (err: any) {
      showModalAlert(
        "SMS Dispatch Error",
        err.response?.data?.error ||
          "Could not send SMS OTP. Please check your phone number.",
        "error"
      );
    } finally {
      setSendingSms(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (smsCode.trim().length < 6) {
      showModalAlert(
        "Incomplete Code",
        "Please enter the 6-digit SMS OTP sent to your phone.",
        "warning"
      );
      return;
    }

    setVerifyingSms(true);
    try {
      await api.post("accounts/verify-otp/", {
        phone: phone.trim(),
        sms_otp: smsCode.trim(),
        channel: "sms",
      });
      onVerifiedChange(true);
      setOtpSent(false);
      showModalAlert(
        "Phone Verified",
        "Your Philippine mobile number has been verified!",
        "success"
      );
    } catch (err: any) {
      showModalAlert(
        "Verification Failed",
        err.response?.data?.error || "Invalid SMS OTP code.",
        "error"
      );
    } finally {
      setVerifyingSms(false);
    }
  };

  return (
    <View style={{ width: "100%", marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          { marginBottom: otpSent && !isVerified ? 8 : 0 },
          isVerified && {
            borderColor: Colors.primary,
            backgroundColor: "#F2F9F5",
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={19}
          color={Colors.primary}
          style={{ marginRight: 9 }}
        />
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 09123456789 or +639123456789"
          placeholderTextColor={Colors.placeholder}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={handlePhoneTextChange}
        />

        {isVerified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
            <Text style={styles.verifiedBadgeText}>Verified</Text>
          </View>
        ) : (
          phone.trim().length >= 10 && (
            <TouchableOpacity
              style={styles.inlineSendOtpBtn}
              activeOpacity={0.8}
              onPress={handleSendPhoneOtp}
              disabled={sendingSms}
            >
              <Text style={styles.inlineSendOtpText}>
                {sendingSms ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {otpSent && !isVerified && (
        <View style={styles.inlineOtpContainer}>
          <Text style={styles.inlineOtpHint}>
            Enter 6-digit SMS code sent to {normalizedDisplay || phone}:
          </Text>
          <View style={styles.inlineOtpRow}>
            <TextInput
              style={styles.inlineOtpInput}
              placeholder="••••••"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              maxLength={6}
              value={smsCode}
              onChangeText={setSmsCode}
            />
            <TouchableOpacity
              style={styles.inlineVerifyBtn}
              activeOpacity={0.85}
              onPress={handleVerifyPhoneOtp}
              disabled={verifyingSms}
            >
              <Text style={styles.inlineVerifyBtnText}>
                {verifyingSms ? "Checking..." : "Verify OTP"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

export function CebuAddressMapPicker({
  selectedBarangay = "",
  onSelectBarangay,
  streetDetail = "",
  onChangeStreetDetail,
  latitude,
  longitude,
  onChangeCoords,
  pinOnly = false,
}: {
  selectedBarangay?: string;
  onSelectBarangay?: (brgyName: string, fullAddress: string) => void;
  streetDetail?: string;
  onChangeStreetDetail?: (street: string, fullAddress: string) => void;
  latitude: number;
  longitude: number;
  onChangeCoords: (lat: number, lng: number) => void;
  pinOnly?: boolean;
}) {
  const [brgyModalOpen, setBrgyModalOpen] = useState(false);
  const [brgySearch, setBrgySearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [gpsAlert, setGpsAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      const handler = (event: MessageEvent) => {
        if (event.data && event.data.type === "RESERVE_MAP_PIN") {
          onChangeCoords(
            Number(Number(event.data.lat).toFixed(6)),
            Number(Number(event.data.lng).toFixed(6))
          );
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }
  }, [onChangeCoords]);

  const buildFullAddress = (street: string, brgy: string) => {
    const cleanStreet = street.trim();
    const cleanBrgy = brgy.trim() || "Santo Niño";
    return cleanStreet
      ? `${cleanStreet}, Brgy. ${cleanBrgy}, Cebu City, Cebu, Region VII`
      : `Brgy. ${cleanBrgy}, Cebu City, Cebu, Region VII`;
  };

  const handleChooseBarangay = (item: BarangayCoord) => {
    const fullAddr = buildFullAddress(streetDetail, item.name);
    if (onSelectBarangay) onSelectBarangay(item.name, fullAddr);
    onChangeCoords(item.lat, item.lng);
    setBrgyModalOpen(false);
  };

  const handleStreetInput = (val: string) => {
    const fullAddr = buildFullAddress(val, selectedBarangay);
    if (onChangeStreetDetail) onChangeStreetDetail(val, fullAddr);
  };

  const useDeviceGps = async () => {
    setLocating(true);
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              onChangeCoords(
                Number(pos.coords.latitude.toFixed(6)),
                Number(pos.coords.longitude.toFixed(6))
              );
              setLocating(false);
            },
            () => {
              setGpsAlert({
                visible: true,
                title: "GPS Notice",
                message:
                  "Browser GPS permission denied or unavailable. Tap on the map to pin your location.",
                type: "warning",
              });
              setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          setGpsAlert({
            visible: true,
            title: "GPS Unsupported",
            message:
              "Geolocation is not supported by your browser. Please tap the map to pin.",
            type: "warning",
          });
          setLocating(false);
        }
      } else {
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setGpsAlert({
            visible: true,
            title: "Location Permission Required",
            message:
              "RESERVE needs location access to match surplus food within your 10km Cebu City radius. Please allow location access in your device settings.",
            type: "warning",
          });
          setLocating(false);
          return;
        }

        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });

        onChangeCoords(
          Number(location.coords.latitude.toFixed(6)),
          Number(location.coords.longitude.toFixed(6))
        );
        setLocating(false);
      }
    } catch (e: any) {
      console.log("GPS Location capture error:", e);
      setGpsAlert({
        visible: true,
        title: "GPS Notice",
        message:
          "Could not fetch device coordinates. You can drag or tap on the map to place your pin.",
        type: "info",
      });
      setLocating(false);
    }
  };

  const filteredBarangays = CEBU_CITY_BARANGAYS.filter((b) =>
    b.name.toLowerCase().includes(brgySearch.toLowerCase())
  );

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true, tap: false }).setView([${latitude}, ${longitude}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var marker = L.marker([${latitude}, ${longitude}], { draggable: true }).addTo(map);
        marker.bindPopup("<b>Pinned Location</b><br>Drag pin or tap map").openPopup();

        function emitCoords(lat, lng) {
          var payload = JSON.stringify({ type: 'RESERVE_MAP_PIN', lat: lat, lng: lng });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
          } else if (window.parent) {
            window.parent.postMessage({ type: 'RESERVE_MAP_PIN', lat: lat, lng: lng }, '*');
          }
        }

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          emitCoords(e.latlng.lat, e.latlng.lng);
        });

        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          emitCoords(pos.lat, pos.lng);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.groupLabel}>
        Service Area Location (Strictly Cebu City Scope)
      </Text>

      <View style={styles.lockedGrid}>
        <View style={styles.lockedPill}>
          <Text style={styles.lockedTitle}>Region</Text>
          <View style={styles.lockedValRow}>
            <Text style={styles.lockedValue} numberOfLines={1}>
              Region VII
            </Text>
            <Ionicons name="lock-closed" size={11} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.lockedPill}>
          <Text style={styles.lockedTitle}>Province</Text>
          <View style={styles.lockedValRow}>
            <Text style={styles.lockedValue} numberOfLines={1}>
              Cebu
            </Text>
            <Ionicons name="lock-closed" size={11} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.lockedPill}>
          <Text style={styles.lockedTitle}>City</Text>
          <View style={styles.lockedValRow}>
            <Text style={styles.lockedValue} numberOfLines={1}>
              Cebu City
            </Text>
            <Ionicons name="lock-closed" size={11} color={Colors.primary} />
          </View>
        </View>
      </View>

      {!pinOnly && (
        <>
          <Text style={styles.fieldLabel}>Barangay (Cebu City) *</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            activeOpacity={0.75}
            onPress={() => setBrgyModalOpen(true)}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.dropdownText,
                  selectedBarangay && {
                    color: Colors.primary2,
                    fontFamily: "PoppinsMedium",
                  },
                ]}
              >
                {selectedBarangay
                  ? `Brgy. ${selectedBarangay}, Cebu City`
                  : "-- Select Cebu City Barangay --"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.primary2} />
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Street / Building / Landmark *</Text>
          <View style={styles.inputBox}>
            <Ionicons
              name="home-outline"
              size={18}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Unit 4, Osmeña Blvd near Fuente Circle"
              placeholderTextColor={Colors.placeholder}
              value={streetDetail}
              onChangeText={handleStreetInput}
            />
          </View>
        </>
      )}

      <View style={styles.mapHeaderRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.fieldLabel}>
            Pin Exact Store Location on Map (Haversine 10km Matching) *
          </Text>
          <Text style={styles.coordSubtext}>
            Pinned GPS: {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
          </Text>
        </View>
        <TouchableOpacity
          style={styles.gpsBtn}
          activeOpacity={0.8}
          onPress={useDeviceGps}
          disabled={locating}
        >
          <Ionicons name="locate" size={14} color={Colors.white} />
          <Text style={styles.gpsBtnText}>
            {locating ? "Locating..." : "Use GPS"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapFrame}>
        {Platform.OS === "web" ? (
          React.createElement("iframe", {
            srcDoc: leafletHtml,
            style: { width: "100%", height: "100%", border: "none" },
            title: "Cebu City Map Picker",
          })
        ) : (
          <WebView
            originWhitelist={["*"]}
            source={{ html: leafletHtml }}
            style={{ flex: 1 }}
            scrollEnabled={false}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "RESERVE_MAP_PIN") {
                  onChangeCoords(
                    Number(Number(data.lat).toFixed(6)),
                    Number(Number(data.lng).toFixed(6))
                  );
                }
              } catch (err) {
                console.log("WebView postMessage error:", err);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>

      {!pinOnly && (
        <Modal
          visible={brgyModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setBrgyModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Cebu City Barangay</Text>
                <TouchableOpacity onPress={() => setBrgyModalOpen(false)}>
                  <Ionicons name="close" size={20} color={Colors.primary2} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={16} color={Colors.icon} />
                <TextInput
                  value={brgySearch}
                  onChangeText={setBrgySearch}
                  placeholder="Search Cebu City barangay..."
                  placeholderTextColor={Colors.placeholder}
                  style={styles.searchInput}
                />
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                {filteredBarangays.map((b) => (
                  <TouchableOpacity
                    key={b.name}
                    style={styles.brgyItem}
                    onPress={() => handleChooseBarangay(b)}
                  >
                    <View>
                      <Text style={styles.brgyItemText}>Brgy. {b.name}</Text>
                      <Text style={styles.brgyCoordHint}>
                        Cebu City • ({b.lat.toFixed(4)}, {b.lng.toFixed(4)})
                      </Text>
                    </View>
                    {selectedBarangay === b.name && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={Colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <ReserveAlertModal
        visible={gpsAlert.visible}
        title={gpsAlert.title}
        message={gpsAlert.message}
        type={gpsAlert.type}
        onClose={() => setGpsAlert((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

export function validatePhilippinePhone(rawPhone: string): {
  valid: boolean;
  normalized: string;
} {
  const cleaned = (rawPhone || "").replace(/[\s\-\(\)]/g, "");
  if (/^09\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+63${cleaned.slice(1)}` };
  }
  if (/^\+639\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }
  if (/^639\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+${cleaned}` };
  }
  return { valid: false, normalized: cleaned };
}

export function RegistrationOtpModal({
  visible,
  email,
  otpCode,
  onChangeOtp,
  onVerify,
  onResend,
  onClose,
  isVerifying,
}: {
  visible: boolean;
  email: string;
  phone?: string;
  otpCode: string;
  onChangeOtp: (val: string) => void;
  smsOtpCode?: string;
  onChangeSmsOtp?: (val: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onClose: () => void;
  isVerifying: boolean;
  devOtpHint?: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { padding: 20 }]}>
          <View style={styles.otpIconCircle}>
            <Ionicons
              name="mail-unread-outline"
              size={28}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.otpTitle}>Email Verification</Text>
          <Text style={styles.otpSubtitle}>
            Your phone number is verified! Now enter the 6-digit code sent to
            your email{" "}
            <Text
              style={{ fontFamily: "PoppinsSemiBold", color: Colors.primary2 }}
            >
              ({email})
            </Text>
            .
          </Text>

          <Text style={styles.fieldLabel}>
            Email Verification Code (6 Digits)
          </Text>
          <TextInput
            value={otpCode}
            onChangeText={onChangeOtp}
            placeholder="••••••"
            keyboardType="numeric"
            maxLength={6}
            style={styles.otpInput}
          />

          <TouchableOpacity
            style={styles.verifyBtn}
            activeOpacity={0.85}
            onPress={onVerify}
            disabled={isVerifying}
          >
            <Text style={styles.verifyBtnText}>
              {isVerifying
                ? "VERIFYING & CREATING ACCOUNT..."
                : "Verify Email & Complete Registration"}
            </Text>
          </TouchableOpacity>

          <View style={styles.otpFooterRow}>
            <TouchableOpacity onPress={onResend}>
              <Text style={styles.resendText}>Resend Email Code</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default CebuAddressMapPicker;

const styles = StyleSheet.create({
  wrapper: { width: "100%", marginBottom: 12 },
  groupLabel: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary,
    marginBottom: 6,
  },
  lockedGrid: { flexDirection: "row", gap: 6, marginBottom: 10 },
  lockedPill: {
    flex: 1,
    backgroundColor: "#E8EFEA",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedTitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
  },
  lockedValRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  lockedValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.primary2,
  },
  fieldLabel: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: "#303030",
    marginBottom: 4,
  },
  dropdownBtn: {
    width: "100%",
    height: 44,
    backgroundColor: Colors.input,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 10,
  },
  dropdownText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.placeholder,
  },
  inputBox: {
    width: "100%",
    height: 45,
    backgroundColor: Colors.input,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary2,
  },
  inlineSendOtpBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    marginLeft: 6,
  },
  inlineSendOtpText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.white,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    marginLeft: 6,
  },
  verifiedBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.white,
  },
  inlineOtpContainer: {
    backgroundColor: "#F2F7F4",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineOtpHint: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary2,
    marginBottom: 6,
  },
  inlineOtpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineOtpInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    textAlign: "center",
    fontFamily: "PoppinsBold",
    fontSize: 15,
    letterSpacing: 4,
    color: Colors.primary2,
  },
  inlineVerifyBtn: {
    height: 40,
    backgroundColor: Colors.button,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineVerifyBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.white,
  },
  mapHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  coordSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gpsBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.white,
  },
  mapFrame: {
    width: "100%",
    height: 195,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#E8EFEA",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary2,
  },
  brgyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F3",
  },
  brgyItemText: {
    fontFamily: "PoppinsMedium",
    fontSize: 12,
    color: Colors.primary2,
  },
  brgyCoordHint: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.placeholder,
  },
  otpIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  otpTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: Colors.primary2,
    textAlign: "center",
  },
  otpSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  otpInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    textAlign: "center",
    fontFamily: "PoppinsBold",
    fontSize: 20,
    letterSpacing: 6,
    color: Colors.primary2,
    backgroundColor: Colors.input,
    marginBottom: 14,
  },
  verifyBtn: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  otpFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  resendText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
  cancelText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.placeholder,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  feedbackError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  feedbackText: {
    flex: 1,
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    lineHeight: 15,
  },
});