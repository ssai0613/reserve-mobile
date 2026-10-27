import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
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

export type BarangayCoord = {
  name: string;
  lat: number;
  lng: number;
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

export function CebuAddressMapPicker({
  selectedBarangay,
  onSelectBarangay,
  streetDetail,
  onChangeStreetDetail,
  latitude,
  longitude,
  onChangeCoords,
}: {
  selectedBarangay: string;
  onSelectBarangay: (brgyName: string, fullAddress: string) => void;
  streetDetail: string;
  onChangeStreetDetail: (street: string, fullAddress: string) => void;
  latitude: number;
  longitude: number;
  onChangeCoords: (lat: number, lng: number) => void;
}) {
  const [brgyModalOpen, setBrgyModalOpen] = useState(false);
  const [brgySearch, setBrgySearch] = useState("");

  useEffect(() => {
    if (Platform.OS === "web") {
      const handler = (event: MessageEvent) => {
        if (event.data && event.data.type === "RESERVE_MAP_PIN") {
          onChangeCoords(
            Number(event.data.lat.toFixed(6)),
            Number(event.data.lng.toFixed(6))
          );
        }
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }
  }, [onChangeCoords]);

  const buildFullAddress = (street: string, brgy: string) => {
    const cleanStreet = street.trim();
    const cleanBrgy = brgy.trim() || " Santo Niño";
    return cleanStreet
      ? `${cleanStreet}, Brgy. ${cleanBrgy}, Cebu City, Cebu, Region VII`
      : `Brgy. ${cleanBrgy}, Cebu City, Cebu, Region VII`;
  };

  const handleChooseBarangay = (item: BarangayCoord) => {
    const fullAddr = buildFullAddress(streetDetail, item.name);
    onSelectBarangay(item.name, fullAddr);
    onChangeCoords(item.lat, item.lng);
    setBrgyModalOpen(false);
  };

  const handleStreetInput = (val: string) => {
    const fullAddr = buildFullAddress(val, selectedBarangay);
    onChangeStreetDetail(val, fullAddr);
  };

  const useDeviceGps = () => {
    if (Platform.OS === "web" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChangeCoords(
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6))
          );
        },
        () => {
          alert("Could not access browser GPS. You can click directly on the map to pin your location.");
        }
      );
    } else {
      alert("Pin centered on your selected Cebu City Barangay! Use the nudge buttons below to fine-tune.");
    }
  };

  const filteredBarangays = CEBU_CITY_BARANGAYS.filter((b) =>
    b.name.toLowerCase().includes(brgySearch.toLowerCase())
  );

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${latitude}, ${longitude}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);
        var marker = L.marker([${latitude}, ${longitude}], {draggable: true}).addTo(map);
        marker.bindPopup("<b>Pinned Cebu City Location</b><br>Tap map or drag pin").openPopup();

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          window.parent.postMessage({ type: 'RESERVE_MAP_PIN', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
        });
        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          window.parent.postMessage({ type: 'RESERVE_MAP_PIN', lat: pos.lat, lng: pos.lng }, '*');
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.groupLabel}>
        Service Area Address (Strictly Cebu City Scope)
      </Text>

      {/* LOCKED REGION / PROVINCE / CITY ROW */}
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

      {/* BARANGAY DROPDOWN */}
      <Text style={styles.fieldLabel}>Barangay (Cebu City) *</Text>
      <TouchableOpacity
        style={styles.dropdownBtn}
        activeOpacity={0.75}
        onPress={() => setBrgyModalOpen(true)}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
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

      {/* STREET / BUILDING INPUT */}
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

      {/* INTERACTIVE MAP PINNING FOR HAVERSINE FORMULA */}
      <View style={styles.mapHeaderRow}>
        <View>
          <Text style={styles.fieldLabel}>
            Pin Exact Location on Map (Haversine 10km Matching)
          </Text>
          <Text style={styles.coordSubtext}>
            Pinned GPS: {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
          </Text>
        </View>
        <TouchableOpacity
          style={styles.gpsBtn}
          activeOpacity={0.8}
          onPress={useDeviceGps}
        >
          <Ionicons name="locate" size={14} color={Colors.white} />
          <Text style={styles.gpsBtnText}>Use GPS</Text>
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
          <View style={styles.mobileMapFallback}>
            <Ionicons name="map" size={28} color={Colors.primary} />
            <Text style={styles.mobileMapTitle}>
              Cebu City Geolocation Pin Active
            </Text>
            <Text style={styles.mobileMapCoords}>
              Lat: {latitude.toFixed(5)} | Lng: {longitude.toFixed(5)}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={() => onChangeCoords(latitude + 0.0005, longitude)}
              >
                <Text style={styles.nudgeText}>+ North</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={() => onChangeCoords(latitude - 0.0005, longitude)}
              >
                <Text style={styles.nudgeText}>- South</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={() => onChangeCoords(latitude, longitude + 0.0005)}
              >
                <Text style={styles.nudgeText}>+ East</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={() => onChangeCoords(latitude, longitude - 0.0005)}
              >
                <Text style={styles.nudgeText}>- West</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* BARANGAY MODAL */}
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
  phone,
  otpCode,
  onChangeOtp,
  smsOtpCode,
  onChangeSmsOtp,
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
              name="shield-checkmark-outline"
              size={28}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.otpTitle}>Multi-Factor Verification</Text>
          <Text style={styles.otpSubtitle}>
            Enter the 6-digit verification code sent to your email{" "}
            <Text style={{ fontFamily: "PoppinsSemiBold", color: Colors.primary2 }}>
              ({email})
            </Text>
            {phone ? ` and Philippine mobile (${phone})` : ""}.
          </Text>

          <Text style={styles.fieldLabel}>Email Verification Code (6 Digits)</Text>
          <TextInput
            value={otpCode}
            onChangeText={onChangeOtp}
            placeholder="••••••"
            keyboardType="numeric"
            maxLength={6}
            style={styles.otpInput}
          />

          {onChangeSmsOtp !== undefined && (
            <>
              <Text style={styles.fieldLabel}>
                SMS OTP Code Sent to {phone || "+63 Mobile"} (Optional if Twilio Trial)
              </Text>
              <TextInput
                value={smsOtpCode}
                onChangeText={onChangeSmsOtp}
                placeholder="••••••"
                keyboardType="numeric"
                maxLength={6}
                style={styles.otpInput}
              />
            </>
          )}

          <TouchableOpacity
            style={styles.verifyBtn}
            activeOpacity={0.85}
            onPress={onVerify}
            disabled={isVerifying}
          >
            <Text style={styles.verifyBtnText}>
              {isVerifying
                ? "VERIFYING & CREATING ACCOUNT..."
                : "Verify & Complete Registration"}
            </Text>
          </TouchableOpacity>

          <View style={styles.otpFooterRow}>
            <TouchableOpacity onPress={onResend}>
              <Text style={styles.resendText}>Resend Codes</Text>
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
    height: 44,
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
    height: 185,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#E8EFEA",
  },
  mobileMapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  mobileMapTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
    marginTop: 4,
  },
  mobileMapCoords: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: Colors.primary,
    marginTop: 2,
  },
  nudgeBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nudgeText: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,
    color: Colors.primary2,
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
  devOtpBanner: {
    backgroundColor: "#E7F0E9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  devOtpText: {
    fontFamily: "PoppinsBold",
    fontSize: 11,
    color: Colors.primary,
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
});