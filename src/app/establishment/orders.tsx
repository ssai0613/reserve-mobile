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
import { EstablishmentBottomNav, EstablishmentHeader } from "../components/EstablishmentNav";

type Order = {
  id: string;
  prod_id?: number;
  customer: string;
  item: string;
  qty: string;
  time: string;
  expiry: string;
  status: string;
  image: string;
  establishment: string;
  price: string;
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
          alert("Camera permission is required to scan the customer's QR code.");
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.back,
        quality: 0.7,
      });

      if (!result.canceled) {
        // After scanning the QR image, prompt or auto-verify the active order
        if (pendingOrders.length === 1) {
          await handleConfirmPickup(pendingOrders[0]);
          setQrModalVisible(false);
        } else {
          setVerifyMode("manual");
          alert("QR captured! Please confirm the Transaction / Order ID below.");
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

  const handleConfirmPickup = async (order: Order) => {
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "confirm_order",
        prod_id: order.prod_id,
        order_code: order.id,
      });
      alert(res.data.message || "Pickup confirmed!");
      await loadOrders();
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not confirm pickup.");
    }
  };

  const handleVerifyQrCode = async () => {
    if (!qrOrderCode.trim()) {
      alert("Please enter the customer's Order ID / Voucher code (e.g. OID101).");
      return;
    }
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "confirm_order",
        order_code: qrOrderCode.trim(),
      });
      setQrModalVisible(false);
      setQrOrderCode("");
      alert(res.data.message || "Order pickup verified!");
      await loadOrders();
    } catch (e: any) {
      alert(e.response?.data?.error || "Matching pending order not found.");
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

      {/* HEADER */}
      <EstablishmentHeader />

      {/* MAIN CONTENT */}
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
            <Text style={styles.scanSubtitle}>Verify customer pickup</Text>
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
                onConfirm={handleConfirmPickup}
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

      {/* BOTTOM NAVIGATION */}
      <EstablishmentBottomNav activeTab="Orders" />

      {/* DUAL-OPTION QR CAMERA SCAN OR MANUAL TRANSACTION ID MODAL */}
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

                {/* OPTION 1: SCAN QR CODE VIA CAMERA */}
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

                {/* OPTION 2: INPUT TRANSACTION / ORDER ID */}
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
                  Enter the Transaction / Order ID shown on the customer's Rescue Voucher (e.g. OID101 or TXN-1):
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
                    onPress={handleVerifyQrCode}
                  >
                    <Text style={[styles.viewCloseButtonText, { color: Colors.white }]}>
                      Verify Pickup
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
                  <View>
                    <Text style={styles.viewLabel}>Price</Text>
                    <Text style={styles.viewPrice}>{selectedOrder.price}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Quantity</Text>
                    <Text style={styles.viewValue}>{selectedOrder.qty}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Category</Text>
                    <Text style={styles.viewValue}>{selectedOrder.category}</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Description</Text>
                  <Text style={styles.viewDescription}>{selectedOrder.description || "No description provided."}</Text>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Order information</Text>
                  <DetailRow icon="person-outline" label="Customer" value={selectedOrder.customer} />
                  <DetailRow icon="calendar-outline" label="Time ordered" value={selectedOrder.time} />
                  <DetailRow icon="basket-outline" label="Quantity" value={selectedOrder.qty} />
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Pickup information</Text>
                  <DetailRow icon="calendar-outline" label="Pickup date" value={selectedOrder.pickupDate} />
                  <DetailRow icon="time-outline" label="Pickup time" value={selectedOrder.pickupTime} />
                  <DetailRow icon="ticket-outline" label="Rescue voucher" value={selectedOrder.rescueVoucher ? "Required" : "Not required"} />
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Expiry</Text>
                  <DetailRow icon="time-outline" label="Time remaining" value={selectedOrder.expiry} />
                  <DetailRow icon="thermometer-outline" label="Storage condition" value={selectedOrder.storageCondition} />
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity style={styles.viewCloseButton} activeOpacity={0.8} onPress={() => setViewModalVisible(false)}>
                    <Text style={styles.viewCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
            <Text style={[styles.tableHeaderText, styles.tableExpiry]}>Expiry</Text>
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
              <Text style={[styles.tableCell, styles.tableExpiry, pending && styles.expiryUrgent]}>{order.expiry}</Text>
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

function BottomNavItem({ icon, label, active, onPress }: { icon: any; label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      activeOpacity={active ? 1 : 0.7}
      onPress={active ? undefined : onPress}
    >
      <Ionicons name={icon} size={24} color={active ? Colors.primary : Colors.icon} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { minHeight: 70, backgroundColor: Colors.background, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logo: { fontFamily: "PoppinsBold", fontSize: 26, color: Colors.primary, letterSpacing: 0.7 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: -2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 15 },
  headerIconButton: { position: "relative", padding: 4 },
  notificationDot: { position: "absolute", width: 7, height: 7, borderRadius: 4, backgroundColor: "#A94A3A", right: 3, top: 2, borderWidth: 1.5, borderColor: Colors.background },
  profileCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
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
  table: { width: 820 },
  tableHeader: { height: 42, backgroundColor: "#F3F6F4", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHeaderText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, paddingHorizontal: 10 },
  tableRow: { minHeight: 52, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlternate: { backgroundColor: "#F7F9F7" },
  tableCell: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, paddingHorizontal: 10 },
  tableId: { width: 90 },
  tableCustomer: { width: 110 },
  tableItem: { width: 130 },
  tableQty: { width: 65, textAlign: "center" },
  tableTime: { width: 130 },
  tableExpiry: { width: 95 },
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
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, paddingBottom: 25, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 10, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 5, marginHorizontal: 2, borderRadius: 7 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.icon, marginTop: 4 },
  navTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
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
  viewPrice: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary },
  viewValue: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  viewSection: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 15 },
  viewSectionTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginBottom: 10 },
  viewDescription: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, lineHeight: 18 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  detailIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 11 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2, marginTop: 1 },
  viewActions: { flexDirection: "row", gap: 10, marginTop: 5 },
  viewCloseButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  viewCloseButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary1 },
});