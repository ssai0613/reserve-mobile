import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Image,
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
import {
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import { EstablishmentBottomNav, EstablishmentHeader } from "../components/EstablishmentNav";

type Order = {
  id: string;
  prod_id?: number;
  customer: string;
  customer_phone?: string;
  item: string;
  qty: string;
  time: string;
  expiry: string;
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

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function EstablishmentOrders() {
  const [merchantId, setMerchantId] = useState("1");
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [activePickupsCount, setActivePickupsCount] = useState(0);
  const [nearingExpiryCount, setNearingExpiryCount] = useState(0);

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [verifyMode, setVerifyMode] = useState<"choose" | "manual">("choose");
  const [qrOrderCode, setQrOrderCode] = useState("");

  // ORDER SUMMARY CONFIRMATION BEFORE RELEASE MODAL STATE
  const [summaryConfirmOrder, setSummaryConfirmOrder] = useState<Order | null>(null);
  const [releasingOrder, setReleasingOrder] = useState(false);

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

  const openVerificationModal = () => {
    setVerifyMode("choose");
    setQrOrderCode("");
    setQrModalVisible(true);
  };

  const handleOpenCameraQrScan = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showModal(
            "Camera Permission Required",
            "Camera permission is required to scan the customer's QR code.",
            "warning"
          );
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.back,
        quality: 0.7,
      });

      if (!result.canceled) {
        if (pendingOrders.length === 1) {
          setQrModalVisible(false);
          setSummaryConfirmOrder(pendingOrders[0]);
        } else {
          setVerifyMode("manual");
          showModal(
            "QR Code Captured",
            "Please enter or confirm the Transaction / Voucher ID below to view the Order Summary before release.",
            "info"
          );
        }
      }
    } catch (err) {
      setVerifyMode("manual");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      setMerchantId(storedId);
      const res = await api.get(`listings/merchant-portal/${storedId}/`);
      const o = res.data.orders;
      if (o) {
        setPendingOrders(o.pending_orders || []);
        setCompletedOrders(o.completed_orders || []);
        setActivePickupsCount(o.active_pickups_count || 0);
        setNearingExpiryCount(o.nearing_expiry_count || 0);
      }
    } catch (e) {
      console.log("Orders fetch error:", e);
    }
  };

  // Step 1: Open Order Summary Modal before releasing
  const promptOrderSummaryBeforeRelease = (order: Order) => {
    setSummaryConfirmOrder(order);
  };

  // Step 1B: Lookup Order Summary by QR/Voucher Code
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

    const localMatch = pendingOrders.find(
      (o) => o.id.toUpperCase() === code
    );
    if (localMatch) {
      setQrModalVisible(false);
      setQrOrderCode("");
      setSummaryConfirmOrder(localMatch);
      return;
    }

    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "preview_order",
        order_code: code,
      });
      if (res.data?.order) {
        setQrModalVisible(false);
        setQrOrderCode("");
        setSummaryConfirmOrder(res.data.order);
      }
    } catch (e: any) {
      showModal(
        "Order Not Found",
        e.response?.data?.error || `No pending order matches code "${code}".`,
        "error"
      );
    }
  };

  // Step 2: Execute Release after Merchant confirms the Order Summary Modal
  const executeReleaseOrder = async () => {
    if (!summaryConfirmOrder) return;
    setReleasingOrder(true);
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "confirm_order",
        prod_id: summaryConfirmOrder.prod_id,
        order_code: summaryConfirmOrder.id,
      });
      setSummaryConfirmOrder(null);
      await loadOrders();
      showModal(
        "Order Released & Completed!",
        res.data.message || "Pickup confirmed and deposit credited to your wallet!",
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
    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "Completed" && order.status === "Successful");
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      <EstablishmentHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Orders management</Text>
          <Text style={styles.pageSubTitle}>Manage active pickups and order history</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="basket-outline" size={20} color={Colors.primary} />
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
              <Text style={[styles.statNumber, styles.statNumberWhite]}>{nearingExpiryCount}</Text>
              <Text style={[styles.statLabel, styles.statLabelWhite]}>Nearing expiry</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search orders..."
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
          {["All", "Pending", "Completed"].map((filter) => (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.75}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
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
            <Text style={styles.scanSubtitle}>Preview order summary & verify pickup</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={Colors.white} />
        </TouchableOpacity>

        {(selectedFilter === "All" || selectedFilter === "Pending") && (
          <View style={styles.orderSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Pending orders</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredPendingOrders.length} order{filteredPendingOrders.length !== 1 ? "s" : ""} awaiting pickup
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
              />
            ) : (
              <EmptyOrders
                title="No pending orders"
                description="There are no orders waiting for pickup."
              />
            )}
          </View>
        )}

        {(selectedFilter === "All" || selectedFilter === "Completed") && (
          <View style={styles.orderSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Completed orders</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredCompletedOrders.length} order{filteredCompletedOrders.length !== 1 ? "s" : ""} successfully picked up
                </Text>
              </View>
              <View style={[styles.sectionBadge, styles.completedBadge]}>
                <Text style={[styles.sectionBadgeText, styles.completedBadgeText]}>Completed</Text>
              </View>
            </View>

            {filteredCompletedOrders.length > 0 ? (
              <OrdersTable orders={filteredCompletedOrders} onView={openViewOrder} />
            ) : (
              <EmptyOrders
                title="No completed orders"
                description="Completed orders will appear here."
              />
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <EstablishmentBottomNav activeTab="Orders" />

      {/* QR SCAN OR MANUAL TRANSACTION ID MODAL */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.qrCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={styles.modalTitle}>Verify Customer Pickup</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            {verifyMode === "choose" ? (
              <View style={{ gap: 12, marginTop: 6 }}>
                <Text style={styles.modalSubtitle}>
                  Choose how you want to verify the customer's pickup voucher:
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
                  onPress={handleOpenCameraQrScan}
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
                    <Ionicons name="camera-outline" size={22} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.white }}>
                      Scan QR Code
                    </Text>
                    <Text style={{ fontFamily: "PoppinsRegular", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                      Open camera to scan customer's QR voucher
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F3F6F4",
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: 16,
                    borderRadius: 14,
                    gap: 12,
                  }}
                  activeOpacity={0.85}
                  onPress={() => setVerifyMode("manual")}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#E7EEE9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="keypad-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2 }}>
                      Enter Transaction ID
                    </Text>
                    <Text style={{ fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 }}>
                      Manually type the Order / Voucher ID
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.primary2} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.modalSubtitle, { marginBottom: 12 }]}>
                  Enter the Transaction / Order ID shown on the customer's Rescue Voucher (e.g. OID101):
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
                      { backgroundColor: Colors.button, borderColor: Colors.button },
                    ]}
                    onPress={handleLookupOrderSummaryByCode}
                  >
                    <Text style={[styles.viewCloseButtonText, { color: Colors.white }]}>
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
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
                    style={{ width: 58, height: 58, borderRadius: 10, backgroundColor: Colors.input }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2 }}>
                      {summaryConfirmOrder.item}
                    </Text>
                    <Text style={{ fontFamily: "PoppinsMedium", fontSize: 11.5, color: Colors.primary }}>
                      Voucher ID: {summaryConfirmOrder.id} • Qty: {summaryConfirmOrder.qty}
                    </Text>
                    <Text style={{ fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1 }}>
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
                    value={summaryConfirmOrder.total_price || summaryConfirmOrder.price.split(" ")[0]}
                  />
                  <SummaryLine
                    label="10% Online Deposit (Paid)"
                    value={summaryConfirmOrder.deposit_paid || "Paid via Xendit"}
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
                    <Text style={{ fontFamily: "PoppinsBold", fontSize: 11.5, color: "#B45309" }}>
                      90% Cash to Collect Now:
                    </Text>
                    <Text style={{ fontFamily: "PoppinsBold", fontSize: 13, color: "#B45309" }}>
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
                      { backgroundColor: Colors.button, borderColor: Colors.button, flex: 1.4 },
                    ]}
                    onPress={executeReleaseOrder}
                    disabled={releasingOrder}
                  >
                    <Text style={[styles.viewCloseButtonText, { color: Colors.white }]}>
                      {releasingOrder ? "Releasing..." : "Confirm & Release Order"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* VIEW ORDER MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="slide" onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.viewModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order details</Text>
                <Text style={styles.modalSubtitle}>View customer order information</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} activeOpacity={0.7} onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewModalContent}>
                <Image source={{ uri: selectedOrder.image }} style={styles.viewImage} resizeMode="cover" />

                <View style={styles.viewTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewFoodName}>{selectedOrder.item}</Text>
                    <Text style={styles.viewEstablishment}>{selectedOrder.establishment}</Text>
                  </View>
                  <View style={[styles.activeBadge, selectedOrder.status === "Successful" && styles.successOrderBadge]}>
                    <View style={[styles.activeDot, selectedOrder.status === "Successful" && styles.successOrderDot]} />
                    <Text style={[styles.activeText, selectedOrder.status === "Successful" && styles.successOrderText]}>
                      {selectedOrder.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderIdBox}>
                  <View>
                    <Text style={styles.viewLabel}>Order ID</Text>
                    <Text style={styles.orderIdText}>{selectedOrder.id}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Customer</Text>
                    <Text style={styles.viewValue}>{selectedOrder.customer}</Text>
                  </View>
                </View>

                <View style={styles.viewPriceBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewLabel}>Price & Payment Breakdown</Text>
                    <Text style={styles.viewPrice}>{selectedOrder.price}</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Order & Expiry Information</Text>
                  <DetailRow icon="person-outline" label="Customer" value={selectedOrder.customer} />
                  <DetailRow icon="basket-outline" label="Quantity" value={selectedOrder.qty} />
                  <DetailRow icon="calendar-outline" label="Time ordered" value={selectedOrder.time} />
                  <DetailRow
                    icon="alarm-outline"
                    label="Expiry date & time"
                    value={`${selectedOrder.pickupDate} • ${selectedOrder.pickupTime}`}
                  />
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity style={styles.viewCloseButton} activeOpacity={0.8} onPress={() => setViewModalVisible(false)}>
                    <Text style={styles.viewCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                  {selectedOrder.status === "Pending Pickup" && (
                    <TouchableOpacity
                      style={[styles.viewCloseButton, { backgroundColor: Colors.button, borderColor: Colors.button }]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setViewModalVisible(false);
                        setSummaryConfirmOrder(selectedOrder);
                      }}
                    >
                      <Text style={[styles.viewCloseButtonText, { color: Colors.white }]}>
                        Review & Release
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 }}>
        {label}:
      </Text>
      <Text style={{ fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2 }}>
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
}: {
  orders: Order[];
  pending?: boolean;
  onView: (order: Order) => void;
  onConfirm?: (order: Order) => void;
}) {
  return (
    <View style={styles.tableOuter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableId]}>Order ID</Text>
            <Text style={[styles.tableHeaderText, styles.tableCustomer]}>Customer</Text>
            <Text style={[styles.tableHeaderText, styles.tableItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.tableQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.tableTime]}>Time Ordered</Text>
            <Text style={[styles.tableHeaderText, styles.tableExpiry]}>Expiry Date & Time</Text>
            <Text style={[styles.tableHeaderText, styles.tableStatus]}>Status</Text>
            <Text style={[styles.tableHeaderText, styles.tableActions]}>Action</Text>
          </View>

          {orders.map((order, index) => (
            <View key={order.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlternate]}>
              <Text style={[styles.tableCell, styles.tableId, styles.orderIdCell]}>{order.id}</Text>
              <Text style={[styles.tableCell, styles.tableCustomer]} numberOfLines={1}>{order.customer}</Text>
              <Text style={[styles.tableCell, styles.tableItem]} numberOfLines={1}>{order.item}</Text>
              <Text style={[styles.tableCell, styles.tableQty]}>{order.qty}</Text>
              <Text style={[styles.tableCell, styles.tableTime]} numberOfLines={1}>{order.time}</Text>
              <Text style={[styles.tableCell, styles.tableExpiry, pending && styles.expiryUrgent]} numberOfLines={2}>
                {order.pickupDate} {order.pickupTime}
              </Text>
              <View style={[styles.tableStatus, styles.statusCell]}>
                <View style={[styles.statusBadgeSmall, pending ? styles.pendingBadge : styles.successBadge]}>
                  <View style={[styles.statusDot, pending ? styles.pendingDot : styles.successDot]} />
                  <Text style={[styles.statusTextSmall, pending ? styles.pendingStatusText : styles.successStatusText]}>
                    {order.status}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableActions, styles.actionCell]}>
                <TouchableOpacity style={styles.viewButton} activeOpacity={0.7} onPress={() => onView(order)}>
                  <Ionicons name="eye-outline" size={16} color={Colors.icon} />
                </TouchableOpacity>
                {pending && onConfirm && (
                  <TouchableOpacity style={styles.confirmButton} activeOpacity={0.8} onPress={() => onConfirm(order)}>
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
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

function EmptyOrders({ title, description }: { title: string; description: string }) {
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
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 90 },
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
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterButton: { minWidth: 75, height: 38, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
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
  table: { width: 860 },
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
  tableExpiry: { width: 135 },
  tableStatus: { width: 125 },
  tableActions: { width: 85 },
  statusCell: { alignItems: "flex-start", justifyContent: "center" },
  statusBadgeSmall: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  pendingBadge: { backgroundColor: "#F4EEDF" },
  successBadge: { backgroundColor: "#E7F0E9" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  pendingDot: { backgroundColor: Colors.accent },
  successDot: { backgroundColor: Colors.button },
  statusTextSmall: { fontFamily: "PoppinsMedium", fontSize: 10.5 },
  pendingStatusText: { color: Colors.accent },
  successStatusText: { color: Colors.button },
  expiryUrgent: { color: "#A94A3A", fontFamily: "PoppinsMedium" },
  actionCell: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 8 },
  viewButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  confirmButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  orderIdCell: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 45, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, textAlign: "center", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalOverlayCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 },
  qrCard: { width: "100%", maxWidth: 360, backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  qrInput: { height: 45, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2, backgroundColor: Colors.input },
  viewModal: { width: "100%", maxHeight: "92%", backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalHeader: { minHeight: 70, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary2 },
  modalSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  viewModalContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30 },
  viewImage: { width: "100%", height: 200, borderRadius: 14, backgroundColor: Colors.input, marginBottom: 16 },
  viewTitleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  viewFoodName: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary2 },
  viewEstablishment: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  activeBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F4EEDF", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  successOrderBadge: { backgroundColor: "#E7F0E9" },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent, marginRight: 6 },
  successOrderDot: { backgroundColor: Colors.button },
  activeText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.accent },
  successOrderText: { color: Colors.button },
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
  viewActions: { flexDirection: "row", gap: 10, marginTop: 5 },
  viewCloseButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  viewCloseButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary1 },
});