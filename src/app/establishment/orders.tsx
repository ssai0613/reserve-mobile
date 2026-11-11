import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { api } from "../../../services/api";
import {
  ReserveAlertModal,
  ReserveConfirmModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  EstablishmentBottomNav,
  EstablishmentHeader,
  useIsInsideMerchantShell,
} from "../components/EstablishmentNav";

type Order = {
  id: string;
  prod_id?: number;
  customer: string;
  customer_phone?: string;
  item: string;
  items_breakdown?: any[];
  qty: string;
  time: string;
  expiry: string;
  is_past_expiry?: boolean;
  status: string;
  image: string;
  establishment: string;
  price: string;
  unit_price?: string;
  total_price?: string;
  deposit_paid?: string;
  cash_due?: string;
  category: string;
  description: string;
  preparationDate: string;
  storageCondition: string;
  pickupDate: string;
  pickupTime: string;
  rescueVoucher: boolean;
};

let cachedOrdersMemory = {
  pendingOrders: [] as Order[],
  completedOrders: [] as Order[],
  activePickupsCount: 0,
  nearingExpiryCount: 0,
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const extractCleanVoucherCode = (rawScanned: string): string => {
  const cleaned = String(rawScanned || "")
    .replace(/^RESERVE:/i, "")
    .trim()
    .toUpperCase();
  const match = cleaned.match(/OID\d+/i);
  if (match) return match[0].toUpperCase();
  return cleaned.split("-")[0].trim();
};

export default function EstablishmentOrders() {
  const isInsideShell = useIsInsideMerchantShell();
  if (!isInsideShell) return null;

  const [merchantId, setMerchantId] = useState("");
  const [pendingOrders, setPendingOrders] = useState<Order[]>(
    cachedOrdersMemory.pendingOrders
  );
  const [completedOrders, setCompletedOrders] = useState<Order[]>(
    cachedOrdersMemory.completedOrders
  );
  const [activePickupsCount, setActivePickupsCount] = useState(
    cachedOrdersMemory.activePickupsCount
  );
  const [nearingExpiryCount, setNearingExpiryCount] = useState(
    cachedOrdersMemory.nearingExpiryCount
  );
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "All" | "Pending" | "Completed" | "No-Show"
  >("All");

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [verifyMode, setVerifyMode] = useState<
    "choose" | "live_scan" | "manual"
  >("choose");
  const [qrOrderCode, setQrOrderCode] = useState("");
  const [decodingQr, setDecodingQr] = useState(false);
  const [qrBase64ToDecode, setQrBase64ToDecode] = useState<string | null>(null);

  // Live QR Scanner States
  const [hasScannedLock, setHasScannedLock] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const scanLockRef = useRef(false);

  const [summaryConfirmOrder, setSummaryConfirmOrder] = useState<Order | null>(
    null
  );
  const [releasingOrder, setReleasingOrder] = useState(false);

  const [noShowTargetOrder, setNoShowTargetOrder] = useState<Order | null>(
    null
  );
  const [markingNoShow, setMarkingNoShow] = useState(false);

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
  ) => {
    setModalAlert({ visible: true, title, message, type });
  };

  const isOrderPastExpiry = (order: Order) => {
    if (order.is_past_expiry) return true;
    if ((order.expiry || "").toLowerCase().includes("expired")) return true;
    return false;
  };

  const openVerificationModal = () => {
    setVerifyMode("choose");
    setQrOrderCode("");
    setDecodingQr(false);
    setQrBase64ToDecode(null);
    setHasScannedLock(false);
    setTorchEnabled(false);
    scanLockRef.current = false;
    setQrModalVisible(true);
  };

  const closeVerificationModal = () => {
    setQrModalVisible(false);
    setVerifyMode("choose");
    setTorchEnabled(false);
    setHasScannedLock(false);
    scanLockRef.current = false;
  };

  const lookupAndPreviewVoucher = async (rawCode: string) => {
    const code = extractCleanVoucherCode(rawCode);
    if (!code) {
      scanLockRef.current = false;
      setHasScannedLock(false);
      showModal(
        "Unrecognized QR Code",
        "Could not read a valid RESERVE Voucher ID from the scanned QR code. Please try again or enter the Voucher ID manually.",
        "warning"
      );
      return;
    }

    const localMatch = pendingOrders.find((o) => o.id.toUpperCase() === code);
    if (localMatch) {
      closeVerificationModal();
      setQrOrderCode("");
      setSummaryConfirmOrder(localMatch);
      return;
    }

    setDecodingQr(true);
    try {
      const activeId =
        merchantId || (await getStorageItem("profile_id")) || "0";
      const res = await api.post(`listings/merchant-portal/${activeId}/`, {
        action: "preview_order",
        order_code: code,
      });
      if (res.data?.order) {
        closeVerificationModal();
        setQrOrderCode("");
        setSummaryConfirmOrder(res.data.order);
      }
    } catch (e: any) {
      scanLockRef.current = false;
      setHasScannedLock(false);
      showModal(
        "Order Not Found",
        e.response?.data?.error ||
          `No pending order at your store matches scanned voucher "${code}".`,
        "error"
      );
    } finally {
      setDecodingQr(false);
    }
  };

  const handleStartLiveCameraScan = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showModal(
            "Camera Permission Required",
            "Please allow camera access in your device settings to scan customer QR Rescue Vouchers live.",
            "warning"
          );
          return;
        }
      }
      scanLockRef.current = false;
      setHasScannedLock(false);
      setTorchEnabled(false);
      setVerifyMode("live_scan");
    } catch (err) {
      showModal(
        "Camera Error",
        "Could not start live camera scanner. You can upload a QR image from your gallery or enter the Voucher ID manually.",
        "warning"
      );
    }
  };

  const handleLiveBarcodeScanned = ({ data }: { type?: string; data: string }) => {
    if (scanLockRef.current || !data) return;
    scanLockRef.current = true;
    setHasScannedLock(true);
    lookupAndPreviewVoucher(data);
  };

  // Listen for live WebRTC QR scan messages when running on Web
  useEffect(() => {
    if (Platform.OS === "web" && qrModalVisible && verifyMode === "live_scan") {
      const handleWebMessage = (event: MessageEvent) => {
        if (
          event.data &&
          event.data.type === "RESERVE_LIVE_QR_SCANNED" &&
          event.data.data
        ) {
          handleLiveBarcodeScanned({ data: String(event.data.data) });
        }
      };
      window.addEventListener("message", handleWebMessage);
      return () => window.removeEventListener("message", handleWebMessage);
    }
  }, [qrModalVisible, verifyMode, pendingOrders, merchantId]);

  const decodeQrFromUriOrBase64 = async (
    uri: string,
    base64Data?: string | null
  ) => {
    setDecodingQr(true);
    try {
      if (Platform.OS === "web") {
        const formData = new FormData();
        const blobRes = await fetch(uri);
        const blob = await blobRes.blob();
        formData.append("file", blob, "qr.png");
        const qrRes = await fetch("https://api.qrserver.com/v1/read-qr-code/", {
          method: "POST",
          body: formData,
        });
        const qrJson = await qrRes.json();
        const decodedText = qrJson?.[0]?.symbol?.[0]?.data;
        setDecodingQr(false);
        if (decodedText) {
          await lookupAndPreviewVoucher(decodedText);
        } else {
          showModal(
            "QR Code Not Detected",
            "No valid QR code was detected in the image. Please ensure the QR voucher is clearly visible or enter the Voucher ID manually.",
            "warning"
          );
        }
        return;
      }

      if (base64Data) {
        setQrBase64ToDecode(base64Data);
        return;
      }

      setDecodingQr(false);
      showModal(
        "QR Scan Notice",
        "Could not read image data. Please try again or type the Voucher ID.",
        "warning"
      );
    } catch (err) {
      setDecodingQr(false);
      showModal(
        "QR Decode Error",
        "Could not decode the QR image. Please try again or enter the Voucher ID manually.",
        "error"
      );
    }
  };

  const handlePickQrFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await decodeQrFromUriOrBase64(asset.uri, asset.base64);
      }
    } catch (err) {
      showModal("Gallery Error", "Could not open image library.", "error");
    }
  };

  useEffect(() => {
    loadOrders();

    const ordSub = DeviceEventEmitter.addListener(
      "merchant_orders_updated",
      () => {
        loadOrders();
      }
    );
    const listSub = DeviceEventEmitter.addListener(
      "merchant_listings_updated",
      () => {
        loadOrders();
      }
    );

    return () => {
      ordSub.remove();
      listSub.remove();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const storedId = await getStorageItem("profile_id");
      const storedEmail = (await getStorageItem("user_email")) || "";
      if (!storedId && !storedEmail) {
        router.replace("/consumer");
        return;
      }
      const resolvedId = storedId || "0";
      setMerchantId(resolvedId);
      const res = await api.get(
        `listings/merchant-portal/${resolvedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );
      const o = res.data.orders;
      if (o) {
        cachedOrdersMemory = {
          pendingOrders: o.pending_orders || [],
          completedOrders: o.completed_orders || [],
          activePickupsCount: o.active_pickups_count || 0,
          nearingExpiryCount: o.nearing_expiry_count || 0,
        };
        setPendingOrders(cachedOrdersMemory.pendingOrders);
        setCompletedOrders(cachedOrdersMemory.completedOrders);
        setActivePickupsCount(cachedOrdersMemory.activePickupsCount);
        setNearingExpiryCount(cachedOrdersMemory.nearingExpiryCount);
      }
    } catch (e) {
      console.log("Orders fetch error:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const promptOrderSummaryBeforeRelease = (order: Order) => {
    setSummaryConfirmOrder(order);
  };

  const handleLookupOrderSummaryByCode = async () => {
    const code = qrOrderCode.trim().toUpperCase();
    if (!code) {
      showModal(
        "Order ID Required",
        "Please enter the customer's Order ID / Voucher code (e.g. OID101).",
        "warning"
      );
      return;
    }
    await lookupAndPreviewVoucher(code);
  };

  const executeReleaseOrder = async () => {
    if (!summaryConfirmOrder) return;
    setReleasingOrder(true);
    try {
      const activeId =
        merchantId || (await getStorageItem("profile_id")) || "0";
      const res = await api.post(`listings/merchant-portal/${activeId}/`, {
        action: "confirm_order",
        prod_id: summaryConfirmOrder.prod_id,
        order_code: summaryConfirmOrder.id,
      });
      setSummaryConfirmOrder(null);
      await loadOrders();
      DeviceEventEmitter.emit("merchant_orders_updated");
      DeviceEventEmitter.emit("merchant_notifs_updated");
      showModal(
        "Order Released & Completed!",
        res.data.message ||
          "Pickup confirmed and deposit credited to your wallet!",
        "success"
      );
    } catch (e: any) {
      showModal(
        "Release Failed",
        e.response?.data?.error || "Could not confirm pickup.",
        "error"
      );
    } finally {
      setReleasingOrder(false);
    }
  };

  const executeMarkNoShow = async () => {
    if (!noShowTargetOrder) return;
    setMarkingNoShow(true);
    try {
      const activeId =
        merchantId || (await getStorageItem("profile_id")) || "0";
      const res = await api.post("accounts/orders/mark-no-show/", {
        merchant_id: Number(activeId),
        order_code: noShowTargetOrder.id,
        force: false,
      });
      setNoShowTargetOrder(null);
      setViewModalVisible(false);
      await loadOrders();
      DeviceEventEmitter.emit("merchant_orders_updated");
      DeviceEventEmitter.emit("merchant_notifs_updated");
      showModal(
        "No-Show Recorded & Admin Alerted",
        res.data?.message ||
          "Order marked as No-Show. The 10% deposit was credited to your wallet and a strike was logged.",
        "warning"
      );
    } catch (e: any) {
      setNoShowTargetOrder(null);
      showModal(
        "No-Show Action Failed",
        e.response?.data?.error ||
          "Orders can only be marked as No-Show after their pickup deadline has expired.",
        "error"
      );
    } finally {
      setMarkingNoShow(false);
    }
  };

  const openViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewModalVisible(true);
  };

  const filteredPendingOrders = pendingOrders.filter((order) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(searchValue) ||
      order.customer.toLowerCase().includes(searchValue) ||
      order.item.toLowerCase().includes(searchValue);
    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "Pending" && order.status === "Pending Pickup");
    return matchesSearch && matchesFilter;
  });

  const filteredCompletedOrders = completedOrders.filter((order) => {
    const searchValue = search.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(searchValue) ||
      order.customer.toLowerCase().includes(searchValue) ||
      order.item.toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Completed") return order.status === "Successful";
    if (selectedFilter === "No-Show") return order.status === "No-Show";
    return false;
  });

  // Hidden decoder for Gallery image uploads on iOS/Android
  const qrDecoderHtml = qrBase64ToDecode
    ? `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        (function() {
          var img = new Image();
          img.onload = function() {
            var canvas = document.getElementById('canvas');
            var ctx = canvas.getContext('2d');
            var maxDim = 900;
            var w = img.width;
            var h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
              else { w = Math.round((w * maxDim) / h); h = maxDim; }
            }
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            var imageData = ctx.getImageData(0, 0, w, h);
            var code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;
            var result = code && code.data ? { ok: true, data: code.data } : { ok: false };
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(result));
            }
          };
          img.onerror = function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ ok: false }));
            }
          };
          img.src = "data:image/jpeg;base64,${qrBase64ToDecode}";
        })();
      </script>
    </body>
    </html>
  `
    : "";

  // Live WebRTC Video Stream QR Scanner for Web Browsers
  const webLiveScannerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
        video { width: 100%; height: 100%; object-fit: cover; }
        .reticle { position: absolute; width: 210px; height: 210px; border: 3px solid #3A826D; border-radius: 18px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.45); pointer-events: none; }
        .status { position: absolute; bottom: 14px; background: rgba(18,55,44,0.88); color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; }
      </style>
    </head>
    <body>
      <video id="video" playsinline muted></video>
      <div class="reticle"></div>
      <div id="status" class="status">Point camera at customer's QR code...</div>
      <canvas id="canvas" style="display:none;"></canvas>
      <script>
        var video = document.getElementById('video');
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        var statusEl = document.getElementById('status');
        var locked = false;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(function(stream) {
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();
            requestAnimationFrame(tick);
          })
          .catch(function(err) {
            statusEl.innerText = 'Camera permission denied or unavailable.';
          });

        function tick() {
          if (locked) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (window.jsQR) {
              var code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });
              if (code && code.data) {
                locked = true;
                statusEl.innerText = 'QR Detected: ' + code.data;
                if (window.parent) {
                  window.parent.postMessage({ type: 'RESERVE_LIVE_QR_SCANNED', data: code.data }, '*');
                }
                return;
              }
            }
          }
          requestAnimationFrame(tick);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <EstablishmentHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Orders management</Text>
          <Text style={styles.pageSubTitle}>
            Manage active pickups, verify QR vouchers live, and report unclaimed
            No-Shows past expiry
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="basket-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{activePickupsCount}</Text>
              <Text style={styles.statLabel}>Active pickups</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={[styles.statIcon, styles.statIconGreen]}>
              <Ionicons name="time-outline" size={20} color={Colors.white} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, styles.statNumberWhite]}>
                {nearingExpiryCount}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelWhite]}>
                Nearing expiry
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search voucher ID, customer, or food item..."
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(["All", "Pending", "Completed", "No-Show"] as const).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.75}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          activeOpacity={0.85}
          onPress={openVerificationModal}
        >
          <View style={styles.scanIcon}>
            <Ionicons name="qr-code-outline" size={19} color={Colors.white} />
          </View>
          <View style={styles.scanTextContainer}>
            <Text style={styles.scanTitle}>Scan QR code / Enter Voucher</Text>
            <Text style={styles.scanSubtitle}>
              Live camera QR detection &amp; pickup verification
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={Colors.white} />
        </TouchableOpacity>

        {(selectedFilter === "All" || selectedFilter === "Pending") && (
          <View style={styles.orderSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Pending orders</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredPendingOrders.length} order
                  {filteredPendingOrders.length !== 1 ? "s" : ""} awaiting
                  pickup (Orders past expiry can be marked No-Show)
                </Text>
              </View>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>For pickup</Text>
              </View>
            </View>

            {filteredPendingOrders.length > 0 ? (
              <OrdersTable
                orders={filteredPendingOrders}
                pending
                onView={openViewOrder}
                onConfirm={promptOrderSummaryBeforeRelease}
                onMarkNoShow={(ord) => setNoShowTargetOrder(ord)}
                isOrderPastExpiry={isOrderPastExpiry}
              />
            ) : (
              <EmptyOrders
                title="No pending orders"
                description="There are no orders waiting for pickup."
              />
            )}
          </View>
        )}

        {(selectedFilter === "All" ||
          selectedFilter === "Completed" ||
          selectedFilter === "No-Show") && (
          <View style={styles.orderSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Completed &amp; No-Show History
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredCompletedOrders.length} recorded order
                  {filteredCompletedOrders.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[styles.sectionBadge, styles.completedBadge]}>
                <Text
                  style={[styles.sectionBadgeText, styles.completedBadgeText]}
                >
                  History
                </Text>
              </View>
            </View>

            {filteredCompletedOrders.length > 0 ? (
              <OrdersTable
                orders={filteredCompletedOrders}
                onView={openViewOrder}
                isOrderPastExpiry={isOrderPastExpiry}
              />
            ) : (
              <EmptyOrders
                title="No history records"
                description="Completed pickups and reported No-Shows will appear here."
              />
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <EstablishmentBottomNav activeTab="Orders" />

      {/* LIVE QR SCANNER & MANUAL VOUCHER MODAL */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeVerificationModal}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.qrCard, verifyMode === "live_scan" && { maxWidth: 400 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={styles.modalTitle}>Verify Customer Pickup</Text>
              <TouchableOpacity onPress={closeVerificationModal}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            {/* Hidden WebView running jsQR to decode gallery images on iOS/Android */}
            {Platform.OS !== "web" && qrBase64ToDecode && (
              <View style={{ width: 1, height: 1, opacity: 0 }}>
                <WebView
                  originWhitelist={["*"]}
                  source={{ html: qrDecoderHtml }}
                  javaScriptEnabled
                  onMessage={async (event) => {
                    setQrBase64ToDecode(null);
                    setDecodingQr(false);
                    try {
                      const parsed = JSON.parse(event.nativeEvent.data);
                      if (parsed.ok && parsed.data) {
                        await lookupAndPreviewVoucher(parsed.data);
                      } else {
                        showModal(
                          "QR Code Not Detected",
                          "Could not detect a valid QR voucher in the selected image. Please try Live Camera Scan or enter the Voucher ID manually.",
                          "warning"
                        );
                      }
                    } catch (e) {
                      showModal(
                        "QR Scan Error",
                        "Could not decode QR image. Please enter the Voucher ID manually.",
                        "warning"
                      );
                    }
                  }}
                />
              </View>
            )}

            {decodingQr ? (
              <View
                style={{ paddingVertical: 28, alignItems: "center", gap: 10 }}
              >
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text
                  style={{
                    fontFamily: "PoppinsSemiBold",
                    fontSize: 13,
                    color: Colors.primary2,
                  }}
                >
                  Verifying Customer QR Voucher...
                </Text>
              </View>
            ) : verifyMode === "live_scan" ? (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.modalSubtitle, { marginBottom: 10 }]}>
                  Center the customer&apos;s QR Rescue Voucher inside the frame
                  below—it will detect automatically:
                </Text>

                <View style={styles.liveScannerFrame}>
                  {Platform.OS === "web" ? (
                    React.createElement("iframe", {
                      srcDoc: webLiveScannerHtml,
                      allow: "camera *",
                      style: {
                        width: "100%",
                        height: "100%",
                        border: "none",
                      },
                      title: "Live Web QR Scanner",
                    })
                  ) : (
                    <>
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        enableTorch={torchEnabled}
                        barcodeScannerSettings={{
                          barcodeTypes: ["qr"],
                        }}
                        onBarcodeScanned={
                          hasScannedLock ? undefined : handleLiveBarcodeScanned
                        }
                      />

                      <View
                        style={styles.scannerOverlayMask}
                        pointerEvents="none"
                      >
                        <View style={styles.scannerReticleBox}>
                          <View
                            style={[styles.reticleCorner, styles.cornerTL]}
                          />
                          <View
                            style={[styles.reticleCorner, styles.cornerTR]}
                          />
                          <View
                            style={[styles.reticleCorner, styles.cornerBL]}
                          />
                          <View
                            style={[styles.reticleCorner, styles.cornerBR]}
                          />
                        </View>
                        <View style={styles.scannerLiveBadge}>
                          <Ionicons
                            name="scan-outline"
                            size={13}
                            color={Colors.white}
                          />
                          <Text style={styles.scannerLiveBadgeText}>
                            {hasScannedLock
                              ? "QR Detected! Loading order..."
                              : "Scanning live for QR code..."}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.torchToggleBtn,
                          torchEnabled && { backgroundColor: Colors.button },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setTorchEnabled((prev) => !prev)}
                      >
                        <Ionicons
                          name={torchEnabled ? "flash" : "flash-off-outline"}
                          size={18}
                          color={Colors.white}
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.viewCloseButton}
                    onPress={() => {
                      setTorchEnabled(false);
                      setVerifyMode("choose");
                    }}
                  >
                    <Text style={styles.viewCloseButtonText}>← Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.viewCloseButton,
                      {
                        backgroundColor: Colors.primary,
                        borderColor: Colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setTorchEnabled(false);
                      setVerifyMode("manual");
                    }}
                  >
                    <Text
                      style={[
                        styles.viewCloseButtonText,
                        { color: Colors.white },
                      ]}
                    >
                      Type Voucher ID
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : verifyMode === "choose" ? (
              <View style={{ gap: 12, marginTop: 6 }}>
                <Text style={styles.modalSubtitle}>
                  Scan the customer&apos;s official QR Rescue Voucher live or
                  enter their Voucher ID:
                </Text>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.primary,
                    padding: 16,
                    borderRadius: 14,
                    gap: 12,
                  }}
                  activeOpacity={0.85}
                  onPress={handleStartLiveCameraScan}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: Colors.button,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="scan-outline"
                      size={22}
                      color={Colors.white}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "PoppinsSemiBold",
                        fontSize: 14,
                        color: Colors.white,
                      }}
                    >
                      Live QR Camera Scanner
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsRegular",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Point camera at customer&apos;s QR code to auto-detect
                      live
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F3F6F4",
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: 14,
                    borderRadius: 14,
                    gap: 12,
                  }}
                  activeOpacity={0.85}
                  onPress={handlePickQrFromGallery}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: "#E7EEE9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "PoppinsSemiBold",
                        fontSize: 13.5,
                        color: Colors.primary2,
                      }}
                    >
                      Upload QR Image from Gallery
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsRegular",
                        fontSize: 11,
                        color: Colors.primary1,
                      }}
                    >
                      Decode a saved screenshot of the QR voucher
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.primary2}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F3F6F4",
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: 14,
                    borderRadius: 14,
                    gap: 12,
                  }}
                  activeOpacity={0.85}
                  onPress={() => setVerifyMode("manual")}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: "#E7EEE9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="keypad-outline"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "PoppinsSemiBold",
                        fontSize: 13.5,
                        color: Colors.primary2,
                      }}
                    >
                      Enter Voucher ID Manually
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsRegular",
                        fontSize: 11,
                        color: Colors.primary1,
                      }}
                    >
                      Type the Order / Voucher ID (e.g. OID101)
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.primary2}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.modalSubtitle, { marginBottom: 12 }]}>
                  Enter the Transaction / Order ID shown on the customer&apos;s
                  Rescue Voucher (e.g. OID101):
                </Text>
                <TextInput
                  value={qrOrderCode}
                  onChangeText={setQrOrderCode}
                  placeholder="e.g. OID101"
                  autoCapitalize="characters"
                  style={styles.qrInput}
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={styles.viewCloseButton}
                    onPress={() => setVerifyMode("choose")}
                  >
                    <Text style={styles.viewCloseButtonText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewCloseButton,
                      {
                        backgroundColor: Colors.button,
                        borderColor: Colors.button,
                      },
                    ]}
                    onPress={handleLookupOrderSummaryByCode}
                  >
                    <Text
                      style={[
                        styles.viewCloseButtonText,
                        { color: Colors.white },
                      ]}
                    >
                      Review Order Summary
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ORDER SUMMARY BEFORE RELEASE CONFIRMATION MODAL */}
      <Modal
        visible={!!summaryConfirmOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setSummaryConfirmOrder(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.qrCard, { maxWidth: 410 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View>
                <Text style={styles.modalTitle}>Order Summary Confirmation</Text>
                <Text style={styles.modalSubtitle}>
                  Review details before releasing item to customer
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSummaryConfirmOrder(null)}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            {summaryConfirmOrder && (
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: "#E9EFE9",
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  <Image
                    source={{ uri: summaryConfirmOrder.image }}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 10,
                      backgroundColor: Colors.input,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "PoppinsBold",
                        fontSize: 14,
                        color: Colors.primary2,
                      }}
                    >
                      {summaryConfirmOrder.item}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsMedium",
                        fontSize: 11.5,
                        color: Colors.primary,
                      }}
                    >
                      Voucher ID: {summaryConfirmOrder.id} • Qty:{" "}
                      {summaryConfirmOrder.qty}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsRegular",
                        fontSize: 10.5,
                        color: Colors.primary1,
                      }}
                    >
                      Customer: {summaryConfirmOrder.customer}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: "#F8FAF9",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    gap: 6,
                  }}
                >
                  <SummaryLine
                    label="Expiry Date & Time"
                    value={`${summaryConfirmOrder.pickupDate} • ${summaryConfirmOrder.pickupTime}`}
                  />
                  <SummaryLine
                    label="Total Order Value"
                    value={
                      summaryConfirmOrder.total_price ||
                      summaryConfirmOrder.price.split(" ")[0]
                    }
                  />
                  <SummaryLine
                    label="10% Online Deposit (Paid)"
                    value={
                      summaryConfirmOrder.deposit_paid || "Paid via Xendit"
                    }
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingTop: 6,
                      borderTopWidth: 1,
                      borderTopColor: Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PoppinsBold",
                        fontSize: 11.5,
                        color: "#B45309",
                      }}
                    >
                      90% Cash to Collect Now:
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PoppinsBold",
                        fontSize: 13,
                        color: "#B45309",
                      }}
                    >
                      {summaryConfirmOrder.cash_due || "See breakdown above"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    style={styles.viewCloseButton}
                    onPress={() => setSummaryConfirmOrder(null)}
                  >
                    <Text style={styles.viewCloseButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewCloseButton,
                      {
                        backgroundColor: Colors.button,
                        borderColor: Colors.button,
                        flex: 1.4,
                      },
                    ]}
                    onPress={executeReleaseOrder}
                    disabled={releasingOrder}
                  >
                    <Text
                      style={[
                        styles.viewCloseButtonText,
                        { color: Colors.white },
                      ]}
                    >
                      {releasingOrder
                        ? "Releasing..."
                        : "Confirm & Release Order"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* VIEW ORDER MODAL */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.viewModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order details</Text>
                <Text style={styles.modalSubtitle}>
                  View customer order information &amp; pickup status
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={() => setViewModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.viewModalContent}
              >
                <Image
                  source={{ uri: selectedOrder.image }}
                  style={styles.viewImage}
                  resizeMode="cover"
                />

                <View style={styles.viewTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewFoodName}>{selectedOrder.item}</Text>
                    <Text style={styles.viewEstablishment}>
                      {selectedOrder.establishment}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.activeBadge,
                      selectedOrder.status === "Successful" &&
                        styles.successOrderBadge,
                      selectedOrder.status === "No-Show" &&
                        styles.noShowOrderBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.activeDot,
                        selectedOrder.status === "Successful" &&
                          styles.successOrderDot,
                        selectedOrder.status === "No-Show" &&
                          styles.noShowOrderDot,
                      ]}
                    />
                    <Text
                      style={[
                        styles.activeText,
                        selectedOrder.status === "Successful" &&
                          styles.successOrderText,
                        selectedOrder.status === "No-Show" &&
                          styles.noShowOrderText,
                      ]}
                    >
                      {selectedOrder.status}
                    </Text>
                  </View>
                </View>

                {selectedOrder.status === "Pending Pickup" &&
                  isOrderPastExpiry(selectedOrder) && (
                    <View style={styles.pastExpiryBanner}>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color="#B3261E"
                      />
                      <Text style={styles.pastExpiryBannerText}>
                        The pickup deadline ({selectedOrder.pickupDate} •{" "}
                        {selectedOrder.pickupTime}) has passed without the
                        customer claiming this order. You may confirm this as a{" "}
                        <Text style={{ fontFamily: "PoppinsBold" }}>
                          No-Show
                        </Text>{" "}
                        below to claim the 10% deposit and alert Admin.
                      </Text>
                    </View>
                  )}

                <View style={styles.orderIdBox}>
                  <View>
                    <Text style={styles.viewLabel}>Order ID</Text>
                    <Text style={styles.orderIdText}>{selectedOrder.id}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Customer</Text>
                    <Text style={styles.viewValue}>
                      {selectedOrder.customer}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewPriceBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewLabel}>
                      Price &amp; Payment Breakdown
                    </Text>
                    <Text style={styles.viewPrice}>{selectedOrder.price}</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>
                    Order &amp; Expiry Information
                  </Text>
                  <DetailRow
                    icon="person-outline"
                    label="Customer"
                    value={selectedOrder.customer}
                  />
                  <DetailRow
                    icon="basket-outline"
                    label="Quantity"
                    value={selectedOrder.qty}
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Time ordered"
                    value={selectedOrder.time}
                  />
                  <DetailRow
                    icon="alarm-outline"
                    label="Expiry date & time"
                    value={`${selectedOrder.pickupDate} • ${selectedOrder.pickupTime} (${selectedOrder.expiry})`}
                  />
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity
                    style={styles.viewCloseButton}
                    activeOpacity={0.8}
                    onPress={() => setViewModalVisible(false)}
                  >
                    <Text style={styles.viewCloseButtonText}>Close</Text>
                  </TouchableOpacity>

                  {selectedOrder.status === "Pending Pickup" && (
                    <>
                      {isOrderPastExpiry(selectedOrder) && (
                        <TouchableOpacity
                          style={styles.noShowActionBtn}
                          activeOpacity={0.85}
                          onPress={() => setNoShowTargetOrder(selectedOrder)}
                        >
                          <Ionicons
                            name="person-remove-outline"
                            size={15}
                            color="#B3261E"
                          />
                          <Text style={styles.noShowActionBtnText}>
                            Confirm No-Show
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.viewCloseButton,
                          {
                            backgroundColor: Colors.button,
                            borderColor: Colors.button,
                          },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => {
                          setViewModalVisible(false);
                          setSummaryConfirmOrder(selectedOrder);
                        }}
                      >
                        <Text
                          style={[
                            styles.viewCloseButtonText,
                            { color: Colors.white },
                          ]}
                        >
                          Release Order
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* CONFIRM NO-SHOW MODAL */}
      <ReserveConfirmModal
        visible={!!noShowTargetOrder}
        title="Confirm Customer No-Show?"
        message={
          noShowTargetOrder
            ? `Mark Order ${noShowTargetOrder.id} (${noShowTargetOrder.customer} — ${noShowTargetOrder.item}) as a No-Show?\n\n• The 10% online deposit (${
                noShowTargetOrder.deposit_paid || "10%"
              }) will be credited to your wallet.\n• A No-Show strike will be reported to the ReServe Admin system (3 strikes lead to account suspension).`
            : ""
        }
        confirmText={markingNoShow ? "Reporting..." : "Confirm No-Show"}
        cancelText="Cancel"
        isDestructive
        onConfirm={executeMarkNoShow}
        onCancel={() => setNoShowTargetOrder(null)}
      />

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

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text
        style={{
          fontFamily: "PoppinsRegular",
          fontSize: 11,
          color: Colors.primary1,
        }}
      >
        {label}:
      </Text>
      <Text
        style={{
          fontFamily: "PoppinsSemiBold",
          fontSize: 11,
          color: Colors.primary2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function OrdersTable({
  orders,
  pending = false,
  onView,
  onConfirm,
  onMarkNoShow,
  isOrderPastExpiry,
}: {
  orders: Order[];
  pending?: boolean;
  onView: (order: Order) => void;
  onConfirm?: (order: Order) => void;
  onMarkNoShow?: (order: Order) => void;
  isOrderPastExpiry: (order: Order) => boolean;
}) {
  return (
    <View style={styles.tableOuter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableId]}>
              Order ID
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableCustomer]}>
              Customer
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.tableQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.tableTime]}>
              Time Ordered
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableExpiry]}>
              Expiry Date &amp; Time
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableStatus]}>
              Status
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableActions]}>
              Action
            </Text>
          </View>

          {orders.map((order, index) => {
            const pastExp = pending && isOrderPastExpiry(order);
            const isNoShow = order.status === "No-Show";
            return (
              <View
                key={order.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowAlternate,
                  pastExp && { backgroundColor: "#FFF8F6" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableId,
                    styles.orderIdCell,
                  ]}
                >
                  {order.id}
                </Text>
                <Text
                  style={[styles.tableCell, styles.tableCustomer]}
                  numberOfLines={1}
                >
                  {order.customer}
                </Text>
                <Text
                  style={[styles.tableCell, styles.tableItem]}
                  numberOfLines={1}
                >
                  {order.item}
                </Text>
                <Text style={[styles.tableCell, styles.tableQty]}>
                  {order.qty}
                </Text>
                <Text
                  style={[styles.tableCell, styles.tableTime]}
                  numberOfLines={1}
                >
                  {order.time}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableExpiry,
                    (pending || pastExp) && styles.expiryUrgent,
                  ]}
                  numberOfLines={2}
                >
                  {order.pickupDate} {order.pickupTime}
                  {pastExp ? " (PAST EXPIRY)" : ""}
                </Text>
                <View style={[styles.tableStatus, styles.statusCell]}>
                  <View
                    style={[
                      styles.statusBadgeSmall,
                      pending
                        ? pastExp
                          ? styles.noShowOrderBadge
                          : styles.pendingBadge
                        : isNoShow
                        ? styles.noShowOrderBadge
                        : styles.successBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        pending
                          ? pastExp
                            ? styles.noShowOrderDot
                            : styles.pendingDot
                          : isNoShow
                          ? styles.noShowOrderDot
                          : styles.successDot,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusTextSmall,
                        pending
                          ? pastExp
                            ? styles.noShowOrderText
                            : styles.pendingStatusText
                          : isNoShow
                          ? styles.noShowOrderText
                          : styles.successStatusText,
                      ]}
                    >
                      {pastExp ? "Past Expiry" : order.status}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tableActions, styles.actionCell]}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    activeOpacity={0.7}
                    onPress={() => onView(order)}
                  >
                    <Ionicons
                      name="eye-outline"
                      size={16}
                      color={Colors.icon}
                    />
                  </TouchableOpacity>
                  {pending && onConfirm && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      activeOpacity={0.8}
                      onPress={() => onConfirm(order)}
                    >
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={Colors.white}
                      />
                    </TouchableOpacity>
                  )}
                  {pending && pastExp && onMarkNoShow && (
                    <TouchableOpacity
                      style={styles.noShowSmallBtn}
                      activeOpacity={0.8}
                      onPress={() => onMarkNoShow(order)}
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={15}
                        color="#B3261E"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function EmptyOrders({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name="basket-outline" size={26} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 28 },
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, lineHeight: 31, color: Colors.primary2 },
  pageSubTitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minHeight: 85, borderRadius: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, padding: 14, flexDirection: "row", alignItems: "center" },
  statCardGreen: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 11 },
  statIconGreen: { backgroundColor: Colors.button },
  statContent: { flex: 1 },
  statNumber: { fontFamily: "PoppinsBold", fontSize: 22, color: Colors.primary2, lineHeight: 28 },
  statNumberWhite: { color: Colors.white },
  statLabel: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 1 },
  statLabelWhite: { color: "rgba(255,255,255,0.8)" },
  searchContainer: { minHeight: 45, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  filterButton: { minWidth: 72, height: 38, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  filterButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  filterTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.white },
  scanButton: { minHeight: 65, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", marginBottom: 20 },
  scanIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginRight: 12 },
  scanTextContainer: { flex: 1 },
  scanTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.white },
  scanSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  orderSection: { marginBottom: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  sectionBadge: { backgroundColor: "#E7F0E9", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  sectionBadgeText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.button },
  completedBadge: { backgroundColor: "#E7EEE9" },
  completedBadgeText: { color: Colors.primary },
  tableOuter: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  table: { width: 900 },
  tableHeader: { height: 42, backgroundColor: "#F3F6F4", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHeaderText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, paddingHorizontal: 10 },
  tableRow: { minHeight: 52, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlternate: { backgroundColor: "#F7F9F7" },
  tableCell: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, paddingHorizontal: 10 },
  tableId: { width: 90 },
  tableCustomer: { width: 110 },
  tableItem: { width: 130 },
  tableQty: { width: 65, textAlign: "center" },
  tableTime: { width: 120 },
  tableExpiry: { width: 140 },
  tableStatus: { width: 125 },
  tableActions: { width: 120 },
  statusCell: { alignItems: "flex-start", justifyContent: "center" },
  statusBadgeSmall: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  pendingBadge: { backgroundColor: "#F4EEDF" },
  successBadge: { backgroundColor: "#E7F0E9" },
  noShowOrderBadge: { backgroundColor: "#FBE4E1" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  pendingDot: { backgroundColor: Colors.accent },
  successDot: { backgroundColor: Colors.button },
  noShowOrderDot: { backgroundColor: "#B3261E" },
  statusTextSmall: { fontFamily: "PoppinsMedium", fontSize: 10.5 },
  pendingStatusText: { color: Colors.accent },
  successStatusText: { color: Colors.button },
  noShowOrderText: { color: "#B3261E", fontFamily: "PoppinsSemiBold" },
  expiryUrgent: { color: "#A94A3A", fontFamily: "PoppinsMedium" },
  actionCell: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 6 },
  viewButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  confirmButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  noShowSmallBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FDF3F2", borderWidth: 1, borderColor: "#E5B8B4", alignItems: "center", justifyContent: "center" },
  orderIdCell: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 45, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, textAlign: "center", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalOverlayCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 },
  qrCard: { width: "100%", maxWidth: 360, backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  qrInput: { height: 45, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2, backgroundColor: Colors.input },
  liveScannerFrame: { width: "100%", height: 295, borderRadius: 16, overflow: "hidden", backgroundColor: "#000", position: "relative", borderWidth: 1, borderColor: Colors.border },
  scannerOverlayMask: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.22)" },
  scannerReticleBox: { width: 200, height: 200, borderRadius: 18, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)", position: "relative" },
  reticleCorner: { position: "absolute", width: 28, height: 28, borderColor: "#4ADE80", borderWidth: 4 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  scannerLiveBadge: { position: "absolute", bottom: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(18,55,44,0.9)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scannerLiveBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.white },
  torchToggleBtn: { position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  viewModal: { width: "100%", maxHeight: "92%", backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalHeader: { minHeight: 70, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary2 },
  modalSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  viewModalContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30 },
  viewImage: { width: "100%", height: 200, borderRadius: 14, backgroundColor: Colors.input, marginBottom: 16 },
  viewTitleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  viewFoodName: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary2 },
  viewEstablishment: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  activeBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F4EEDF", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  successOrderBadge: { backgroundColor: "#E7F0E9" },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent, marginRight: 6 },
  successOrderDot: { backgroundColor: Colors.button },
  activeText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.accent },
  successOrderText: { color: Colors.button },
  pastExpiryBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FBE4E1", borderWidth: 1, borderColor: "#E5B8B4", borderRadius: 12, padding: 12, marginBottom: 14 },
  pastExpiryBannerText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11, color: "#991B1B", lineHeight: 16 },
  orderIdBox: { flexDirection: "row", backgroundColor: "#E9EFE9", borderRadius: 12, padding: 14, justifyContent: "space-between", marginBottom: 12 },
  orderIdText: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary },
  viewPriceBox: { flexDirection: "row", backgroundColor: "#E9EFE9", borderRadius: 12, padding: 14, justifyContent: "space-between", marginBottom: 18 },
  viewLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginBottom: 2 },
  viewPrice: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary },
  viewValue: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  viewSection: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 15 },
  viewSectionTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginBottom: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  detailIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 11 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2, marginTop: 1 },
  viewActions: { flexDirection: "row", gap: 8, marginTop: 5 },
  viewCloseButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  viewCloseButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary1 },
  noShowActionBtn: { flex: 1.1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#E5B8B4", backgroundColor: "#FDF3F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  noShowActionBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: "#B3261E" },
});