import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   ORDER TYPE
===================================================== */

type Order = {
  id: string;
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

/* =====================================================
   PENDING ORDERS
===================================================== */

const pendingOrders: Order[] = [
  {
    id: "OID101",
    customer: "Jennelyn",
    item: "Pan Lamion",
    qty: "10 kg",
    time: "Today | 04:30 PM",
    expiry: "1 hr left",
    status: "Pending Pickup",

    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    establishment: "Cebu Bakery",
    price: "₱350",
    category: "Bread",
    description:
      "Freshly baked Pan Lamion prepared today.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "04:30 PM",
    rescueVoucher: true,
  },

  {
    id: "OID102",
    customer: "Jennelyn",
    item: "Assorted Bread",
    qty: "5 kg",
    time: "Today | 04:15 PM",
    expiry: "2 hrs left",
    status: "Pending Pickup",

    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    establishment: "Cebu Bakery",
    price: "₱250",
    category: "Bread",
    description:
      "Assorted freshly baked bread available for rescue.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "04:15 PM",
    rescueVoucher: true,
  },

  {
    id: "OID103",
    customer: "Jennelyn",
    item: "Fresh Pastries",
    qty: "8 kg",
    time: "Today | 03:50 PM",
    expiry: "3 hrs left",
    status: "Pending Pickup",

    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a",
    establishment: "Cebu Bakery",
    price: "₱300",
    category: "Pastry",
    description:
      "Fresh pastries prepared earlier today.",
    preparationDate: "August 25, 2026",
    storageCondition: "Refrigerated",
    pickupDate: "August 25, 2026",
    pickupTime: "03:50 PM",
    rescueVoucher: false,
  },

  {
    id: "OID104",
    customer: "Maria",
    item: "Bread Loaf",
    qty: "6 kg",
    time: "Today | 03:20 PM",
    expiry: "4 hrs left",
    status: "Pending Pickup",

    image:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73",
    establishment: "Cebu Bakery",
    price: "₱200",
    category: "Bread",
    description:
      "Fresh bread loaves available for customer pickup.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "03:20 PM",
    rescueVoucher: true,
  },

  {
    id: "OID105",
    customer: "John",
    item: "Croissant",
    qty: "4 kg",
    time: "Today | 02:45 PM",
    expiry: "5 hrs left",
    status: "Pending Pickup",

    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a",
    establishment: "Cebu Bakery",
    price: "₱180",
    category: "Pastry",
    description:
      "Buttery freshly baked croissants.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "02:45 PM",
    rescueVoucher: false,
  },
];

/* =====================================================
   COMPLETED ORDERS
===================================================== */

const completedOrders: Order[] = [
  {
    id: "OID091",
    customer: "Jennelyn",
    item: "Pan Lamion",
    qty: "10 kg",
    time: "Today | 04:30 PM",
    expiry: "1 hr left",
    status: "Successful",

    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    establishment: "Cebu Bakery",
    price: "₱350",
    category: "Bread",
    description:
      "Freshly baked Pan Lamion prepared today.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "04:30 PM",
    rescueVoucher: true,
  },

  {
    id: "OID092",
    customer: "Jennelyn",
    item: "Assorted Bread",
    qty: "5 kg",
    time: "Today | 03:40 PM",
    expiry: "2 hrs left",
    status: "Successful",

    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    establishment: "Cebu Bakery",
    price: "₱250",
    category: "Bread",
    description:
      "Assorted freshly baked bread.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "03:40 PM",
    rescueVoucher: true,
  },

  {
    id: "OID093",
    customer: "Jennelyn",
    item: "Fresh Pastries",
    qty: "8 kg",
    time: "Today | 02:30 PM",
    expiry: "3 hrs left",
    status: "Successful",

    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a",
    establishment: "Cebu Bakery",
    price: "₱300",
    category: "Pastry",
    description:
      "Fresh pastries prepared today.",
    preparationDate: "August 25, 2026",
    storageCondition: "Refrigerated",
    pickupDate: "August 25, 2026",
    pickupTime: "02:30 PM",
    rescueVoucher: false,
  },

  {
    id: "OID094",
    customer: "Maria",
    item: "Bread Loaf",
    qty: "6 kg",
    time: "Today | 01:40 PM",
    expiry: "4 hrs left",
    status: "Successful",

    image:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73",
    establishment: "Cebu Bakery",
    price: "₱200",
    category: "Bread",
    description:
      "Fresh bread loaf successfully picked up.",
    preparationDate: "August 25, 2026",
    storageCondition: "Room temperature",
    pickupDate: "August 25, 2026",
    pickupTime: "01:40 PM",
    rescueVoucher: true,
  },
];

/* =====================================================
   MAIN ORDERS PAGE
===================================================== */

export default function EstablishmentOrders() {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState("All");

  /* =====================================================
     VIEW MODAL STATE
  ===================================================== */

  const [viewModalVisible, setViewModalVisible] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  /* =====================================================
     OPEN VIEW MODAL
  ===================================================== */

  const openViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewModalVisible(true);
  };

  /* =====================================================
     FILTER PENDING
  ===================================================== */

  const filteredPendingOrders = pendingOrders.filter(
    (order) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        order.id.toLowerCase().includes(searchValue) ||
        order.customer
          .toLowerCase()
          .includes(searchValue) ||
        order.item
          .toLowerCase()
          .includes(searchValue);

      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Pending" &&
          order.status === "Pending Pickup");

      return matchesSearch && matchesFilter;
    }
  );

  /* =====================================================
     FILTER COMPLETED
  ===================================================== */

  const filteredCompletedOrders =
    completedOrders.filter((order) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        order.id.toLowerCase().includes(searchValue) ||
        order.customer
          .toLowerCase()
          .includes(searchValue) ||
        order.item
          .toLowerCase()
          .includes(searchValue);

      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Completed" &&
          order.status === "Successful");

      return matchesSearch && matchesFilter;
    });

  return (
    <SafeAreaView style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <View>
          <Text style={styles.logo}>
            RESERVE
          </Text>

          <Text style={styles.headerSubtitle}>
            Establishment Portal
          </Text>
        </View>

        <View style={styles.headerActions}>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/establishment/notifications"
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.primary}
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/establishment/profile"
              )
            }
          >
            <View style={styles.profileCircle}>
              <Ionicons
                name="person"
                size={16}
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>

        </View>

      </View>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <View style={styles.pageHeader}>

          <Text style={styles.pageTitle}>
            Orders management
          </Text>

        </View>

        {/* =================================================
            STATISTICS
        ================================================= */}

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

              <Text style={styles.statNumber}>
                123
              </Text>

              <Text style={styles.statLabel}>
                Active pickups
              </Text>

            </View>

          </View>

          <View
            style={[
              styles.statCard,
              styles.statCardGreen,
            ]}
          >

            <View
              style={[
                styles.statIcon,
                styles.statIconGreen,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={Colors.white}
              />
            </View>

            <View style={styles.statContent}>

              <Text
                style={[
                  styles.statNumber,
                  styles.statNumberWhite,
                ]}
              >
                428
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  styles.statLabelWhite,
                ]}
              >
                Nearing expiry
              </Text>

            </View>

          </View>

        </View>

        {/* =================================================
            SEARCH
        ================================================= */}

        <View style={styles.searchContainer}>

          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.icon}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search orders..."
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.icon}
              />
            </TouchableOpacity>
          )}

        </View>

        {/* =================================================
            FILTERS
        ================================================= */}

        <View style={styles.filterRow}>

          {[
            "All",
            "Pending",
            "Completed",
          ].map((filter) => (

            <TouchableOpacity
              key={filter}
              activeOpacity={0.75}
              style={[
                styles.filterButton,
                selectedFilter === filter &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setSelectedFilter(filter)
              }
            >

              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter &&
                    styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>

            </TouchableOpacity>

          ))}

        </View>

        {/* =================================================
            QR SCANNER
        ================================================= */}

        <TouchableOpacity
          style={styles.scanButton}
          activeOpacity={0.85}
        >

          <View style={styles.scanIcon}>

            <Ionicons
              name="qr-code-outline"
              size={19}
              color={Colors.white}
            />

          </View>

          <View style={styles.scanTextContainer}>

            <Text style={styles.scanTitle}>
              Scan QR code
            </Text>

            <Text style={styles.scanSubtitle}>
              Verify customer pickup
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={Colors.white}
          />

        </TouchableOpacity>

        {/* =================================================
            PENDING ORDERS
        ================================================= */}

        {(selectedFilter === "All" ||
          selectedFilter === "Pending") && (

          <View style={styles.orderSection}>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>
                  Pending orders
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  {filteredPendingOrders.length} order
                  {filteredPendingOrders.length !== 1
                    ? "s"
                    : ""}{" "}
                  awaiting pickup
                </Text>

              </View>

              <View style={styles.sectionBadge}>

                <Text
                  style={styles.sectionBadgeText}
                >
                  For pickup
                </Text>

              </View>

            </View>

            {filteredPendingOrders.length > 0 ? (

              <OrdersTable
                orders={filteredPendingOrders}
                pending
                onView={openViewOrder}
              />

            ) : (

              <EmptyOrders
                title="No pending orders"
                description="There are no orders waiting for pickup."
              />

            )}

          </View>

        )}

        {/* =================================================
            COMPLETED ORDERS
        ================================================= */}

        {(selectedFilter === "All" ||
          selectedFilter === "Completed") && (

          <View style={styles.orderSection}>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>
                  Completed orders
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  {filteredCompletedOrders.length} order
                  {filteredCompletedOrders.length !== 1
                    ? "s"
                    : ""}{" "}
                  successfully picked up
                </Text>

              </View>

              <View
                style={[
                  styles.sectionBadge,
                  styles.completedBadge,
                ]}
              >

                <Text
                  style={[
                    styles.sectionBadgeText,
                    styles.completedBadgeText,
                  ]}
                >
                  Completed
                </Text>

              </View>

            </View>

            {filteredCompletedOrders.length > 0 ? (

              <OrdersTable
                orders={filteredCompletedOrders}
                onView={openViewOrder}
              />

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

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>

        <BottomNavItem
          icon="grid-outline"
          label="Home"
          onPress={() =>
            router.replace(
              "/establishment/dashboard"
            )
          }
        />

        <BottomNavItem
          icon="restaurant-outline"
          label="Listings"
          onPress={() =>
            router.replace(
              "/establishment/listing"
            )
          }
        />

        <BottomNavItem
          icon="basket"
          label="Orders"
          active
          onPress={() =>
            router.replace(
              "/establishment/orders"
            )
          }
        />

        <BottomNavItem
          icon="cash-outline"
          label="Earnings"
          onPress={() =>
            router.push(
              "/establishment/earnings"
            )
          }
        />

        <BottomNavItem
          icon="heart-outline"
          label="Donation"
          onPress={() =>
            router.replace(
              "/establishment/donation"
            )
          }
        />

        <BottomNavItem
          icon="person-outline"
          label="Impact"
          onPress={() =>
            router.push(
              "/establishment/impact"
            )
          }
        />

      </View>

      {/* =================================================
          VIEW ORDER MODAL
      ================================================= */}

      <Modal
        visible={viewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setViewModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.viewModal}>

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Order details
                </Text>

                <Text
                  style={styles.modalSubtitle}
                >
                  View customer order information
                </Text>

              </View>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={() =>
                  setViewModalVisible(false)
                }
              >

                <Ionicons
                  name="close"
                  size={22}
                  color={Colors.primary}
                />

              </TouchableOpacity>

            </View>

            {/* =================================================
                ORDER CONTENT
            ================================================= */}

            {selectedOrder && (

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.viewModalContent
                }
              >

                {/* IMAGE */}

                <Image
                  source={{
                    uri: selectedOrder.image,
                  }}
                  style={styles.viewImage}
                  resizeMode="cover"
                />

                {/* NAME + STATUS */}

                <View style={styles.viewTitleRow}>

                  <View style={{ flex: 1 }}>

                    <Text
                      style={styles.viewFoodName}
                    >
                      {selectedOrder.item}
                    </Text>

                    <Text
                      style={
                        styles.viewEstablishment
                      }
                    >
                      {selectedOrder.establishment}
                    </Text>

                  </View>

                  <View
                    style={[
                      styles.activeBadge,
                      selectedOrder.status ===
                        "Successful" &&
                        styles.successOrderBadge,
                    ]}
                  >

                    <View
                      style={[
                        styles.activeDot,
                        selectedOrder.status ===
                          "Successful" &&
                          styles.successOrderDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.activeText,
                        selectedOrder.status ===
                          "Successful" &&
                          styles.successOrderText,
                      ]}
                    >
                      {selectedOrder.status}
                    </Text>

                  </View>

                </View>

                {/* ORDER ID */}

                <View style={styles.orderIdBox}>

                  <View>

                    <Text
                      style={styles.viewLabel}
                    >
                      Order ID
                    </Text>

                    <Text
                      style={styles.orderIdText}
                    >
                      {selectedOrder.id}
                    </Text>

                  </View>

                  <View>

                    <Text
                      style={styles.viewLabel}
                    >
                      Customer
                    </Text>

                    <Text
                      style={styles.viewValue}
                    >
                      {selectedOrder.customer}
                    </Text>

                  </View>

                </View>

                {/* PRICE / QUANTITY / CATEGORY */}

                <View style={styles.viewPriceBox}>

                  <View>

                    <Text
                      style={styles.viewLabel}
                    >
                      Price
                    </Text>

                    <Text
                      style={styles.viewPrice}
                    >
                      {selectedOrder.price}
                    </Text>

                  </View>

                  <View>

                    <Text
                      style={styles.viewLabel}
                    >
                      Quantity
                    </Text>

                    <Text
                      style={styles.viewValue}
                    >
                      {selectedOrder.qty}
                    </Text>

                  </View>

                  <View>

                    <Text
                      style={styles.viewLabel}
                    >
                      Category
                    </Text>

                    <Text
                      style={styles.viewValue}
                    >
                      {selectedOrder.category}
                    </Text>

                  </View>

                </View>

                {/* DESCRIPTION */}

                <View style={styles.viewSection}>

                  <Text
                    style={styles.viewSectionTitle}
                  >
                    Description
                  </Text>

                  <Text
                    style={styles.viewDescription}
                  >
                    {selectedOrder.description ||
                      "No description provided."}
                  </Text>

                </View>

                {/* CUSTOMER ORDER */}

                <View style={styles.viewSection}>

                  <Text
                    style={styles.viewSectionTitle}
                  >
                    Order information
                  </Text>

                  <DetailRow
                    icon="person-outline"
                    label="Customer"
                    value={
                      selectedOrder.customer
                    }
                  />

                  <DetailRow
                    icon="calendar-outline"
                    label="Time ordered"
                    value={
                      selectedOrder.time
                    }
                  />

                  <DetailRow
                    icon="basket-outline"
                    label="Quantity"
                    value={
                      selectedOrder.qty
                    }
                  />

                </View>

                {/* PICKUP */}

                <View style={styles.viewSection}>

                  <Text
                    style={styles.viewSectionTitle}
                  >
                    Pickup information
                  </Text>

                  <DetailRow
                    icon="calendar-outline"
                    label="Pickup date"
                    value={
                      selectedOrder.pickupDate
                    }
                  />

                  <DetailRow
                    icon="time-outline"
                    label="Pickup time"
                    value={
                      selectedOrder.pickupTime
                    }
                  />

                  <DetailRow
                    icon="ticket-outline"
                    label="Rescue voucher"
                    value={
                      selectedOrder.rescueVoucher
                        ? "Required"
                        : "Not required"
                    }
                  />

                </View>

                {/* EXPIRY */}

                <View style={styles.viewSection}>

                  <Text
                    style={styles.viewSectionTitle}
                  >
                    Expiry
                  </Text>

                  <DetailRow
                    icon="time-outline"
                    label="Time remaining"
                    value={
                      selectedOrder.expiry
                    }
                  />

                  <DetailRow
                    icon="thermometer-outline"
                    label="Storage condition"
                    value={
                      selectedOrder.storageCondition
                    }
                  />

                </View>

                {/* CLOSE */}

                <View style={styles.viewActions}>

                  <TouchableOpacity
                    style={
                      styles.viewCloseButton
                    }
                    activeOpacity={0.8}
                    onPress={() =>
                      setViewModalVisible(false)
                    }
                  >

                    <Text
                      style={
                        styles.viewCloseButtonText
                      }
                    >
                      Close
                    </Text>

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

/* =====================================================
   ORDERS TABLE
===================================================== */

function OrdersTable({
  orders,
  pending = false,
  onView,
}: {
  orders: Order[];
  pending?: boolean;
  onView: (order: Order) => void;
}) {

  return (
    <View style={styles.tableOuter}>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
      >

        <View style={styles.table}>

          {/* TABLE HEADER */}

          <View style={styles.tableHeader}>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableId,
              ]}
            >
              Order ID
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableCustomer,
              ]}
            >
              Customer
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableItem,
              ]}
            >
              Item
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableQty,
              ]}
            >
              Qty
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableTime,
              ]}
            >
              Time Ordered
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableExpiry,
              ]}
            >
              Expiry
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableStatus,
              ]}
            >
              Status
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableActions,
              ]}
            >
              Action
            </Text>

          </View>

          {/* TABLE ROWS */}

          {orders.map((order, index) => (

            <View
              key={order.id}
              style={[
                styles.tableRow,
                index % 2 === 0 &&
                  styles.tableRowAlternate,
              ]}
            >

              {/* ORDER ID */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableId,
                  styles.orderIdCell,
                ]}
              >
                {order.id}
              </Text>

              {/* CUSTOMER */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableCustomer,
                ]}
                numberOfLines={1}
              >
                {order.customer}
              </Text>

              {/* ITEM */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableItem,
                ]}
                numberOfLines={1}
              >
                {order.item}
              </Text>

              {/* QUANTITY */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableQty,
                ]}
              >
                {order.qty}
              </Text>

              {/* TIME */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableTime,
                ]}
                numberOfLines={1}
              >
                {order.time}
              </Text>

              {/* EXPIRY */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableExpiry,
                  pending &&
                    styles.expiryUrgent,
                ]}
              >
                {order.expiry}
              </Text>

              {/* STATUS */}

              <View
                style={[
                  styles.tableStatus,
                  styles.statusCell,
                ]}
              >

                <View
                  style={[
                    styles.statusBadgeSmall,
                    pending
                      ? styles.pendingBadge
                      : styles.successBadge,
                  ]}
                >

                  <View
                    style={[
                      styles.statusDot,
                      pending
                        ? styles.pendingDot
                        : styles.successDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusTextSmall,
                      pending
                        ? styles.pendingStatusText
                        : styles.successStatusText,
                    ]}
                  >
                    {order.status}
                  </Text>

                </View>

              </View>

              {/* ACTIONS */}

              <View
                style={[
                  styles.tableActions,
                  styles.actionCell,
                ]}
              >

                {/* VIEW */}

                <TouchableOpacity
                  style={styles.viewButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    onView(order)
                  }
                >

                  <Ionicons
                    name="eye-outline"
                    size={15}
                    color={Colors.icon}
                  />

                </TouchableOpacity>

                {/* CONFIRM */}

                {pending && (

                  <TouchableOpacity
                    style={
                      styles.confirmButton
                    }
                    activeOpacity={0.8}
                  >

                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={Colors.white}
                    />

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

/* =====================================================
   DETAIL ROW
===================================================== */

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

        <Ionicons
          name={icon}
          size={15}
          color={Colors.primary}
        />

      </View>

      <View style={{ flex: 1 }}>

        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>

      </View>

    </View>
  );
}

/* =====================================================
   EMPTY ORDERS
===================================================== */

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

        <Ionicons
          name="basket-outline"
          size={25}
          color={Colors.primary}
        />

      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptyDescription}>
        {description}
      </Text>

    </View>
  );
}

/* =====================================================
   BOTTOM NAV ITEM
===================================================== */

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {

  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active && styles.navItemActive,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >

      <Ionicons
        name={icon}
        size={21}
        color={
          active
            ? Colors.primary
            : Colors.icon
        }
      />

      <Text
        style={[
          styles.navText,
          active && styles.navTextActive,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  /* ===================================================
     MAIN
  =================================================== */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ===================================================
     HEADER
  =================================================== */

  header: {
    minHeight: 70,

    backgroundColor: Colors.background,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 23,
    color: Colors.primary,
    letterSpacing: 0.7,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    marginTop: -1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  headerIconButton: {
    position: "relative",
    padding: 4,
  },

  notificationDot: {
    position: "absolute",

    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#A94A3A",

    right: 3,
    top: 2,

    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  profileCircle: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ===================================================
     SCROLL
  =================================================== */

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 20,
  },

  /* ===================================================
     PAGE HEADER
  =================================================== */

  pageHeader: {
    marginBottom: 17,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },

  /* ===================================================
     STATISTICS
  =================================================== */

  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 17,
  },

  statCard: {
    flex: 1,

    minHeight: 72,

    borderRadius: 10,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 11,

    flexDirection: "row",
    alignItems: "center",
  },

  statCardGreen: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  statIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  statIconGreen: {
    backgroundColor: Colors.button,
  },

  statContent: {
    flex: 1,
  },

  statNumber: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    color: Colors.primary2,
  },

  statNumberWhite: {
    color: Colors.white,
  },

  statLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  statLabelWhite: {
    color: "#D8E3DD",
  },

  /* ===================================================
     SEARCH
  =================================================== */

  searchContainer: {
    minHeight: 42,

    borderRadius: 8,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 11,

    marginBottom: 10,
  },

  searchInput: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 9.5,

    color: Colors.primary2,

    marginLeft: 8,

    paddingVertical: 7,
  },

  /* ===================================================
     FILTERS
  =================================================== */

  filterRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 17,
  },

  filterButton: {
    minWidth: 63,

    height: 31,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: Colors.border,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,
  },

  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
  },

  filterTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.white,
  },

  /* ===================================================
     SCAN BUTTON
  =================================================== */

  scanButton: {
    minHeight: 64,

    backgroundColor: Colors.primary,

    borderRadius: 10,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 20,
  },

  scanIcon: {
    width: 39,
    height: 39,

    borderRadius: 20,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  scanTextContainer: {
    flex: 1,
  },

  scanTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },

  scanSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: "#D8E3DD",
    marginTop: 1,
  },

  /* ===================================================
     ORDER SECTION
  =================================================== */

  orderSection: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 16,
    color: Colors.primary2,
  },

  sectionSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  sectionBadge: {
    backgroundColor: "#E7F0E9",

    borderRadius: 10,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  sectionBadgeText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7,
    color: Colors.button,
  },

  completedBadge: {
    backgroundColor: "#E7EEE9",
  },

  completedBadgeText: {
    color: Colors.primary,
  },

  /* ===================================================
     TABLE
  =================================================== */

  tableOuter: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    overflow: "hidden",
  },

  table: {
    width: 760,
  },

  tableHeader: {
    height: 38,

    backgroundColor: "#F3F6F4",

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  tableHeaderText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 7.5,
    color: Colors.primary2,

    paddingHorizontal: 8,
  },

  tableRow: {
    minHeight: 43,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  tableRowAlternate: {
    backgroundColor: "#F7F9F7",
  },

  tableCell: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary2,

    paddingHorizontal: 8,
  },

  /* ===================================================
     TABLE COLUMNS
  =================================================== */

  tableId: {
    width: 82,
  },

  tableCustomer: {
    width: 95,
  },

  tableItem: {
    width: 125,
  },

  tableQty: {
    width: 55,
    textAlign: "center",
  },

  tableTime: {
    width: 125,
  },

  tableExpiry: {
    width: 85,
  },

  tableStatus: {
    width: 115,
  },

  tableActions: {
    width: 78,
  },

  /* ===================================================
     STATUS
  =================================================== */

  statusCell: {
    alignItems: "flex-start",
    justifyContent: "center",
  },

  statusBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",

    borderRadius: 10,

    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  pendingBadge: {
    backgroundColor: "#F4EEDF",
  },

  successBadge: {
    backgroundColor: "#E7F0E9",
  },

  statusDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    marginRight: 4,
  },

  pendingDot: {
    backgroundColor: Colors.accent,
  },

  successDot: {
    backgroundColor: Colors.button,
  },

  statusTextSmall: {
    fontFamily: "PoppinsMedium",
    fontSize: 6.5,
  },

  pendingStatusText: {
    color: Colors.accent,
  },

  successStatusText: {
    color: Colors.button,
  },

  expiryUrgent: {
    color: "#A94A3A",
    fontFamily: "PoppinsMedium",
  },

  /* ===================================================
     TABLE ACTIONS
  =================================================== */

  actionCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
  },

  viewButton: {
    width: 28,
    height: 28,

    borderRadius: 6,

    borderWidth: 1,
    borderColor: Colors.border,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.white,
  },

  confirmButton: {
    width: 28,
    height: 28,

    borderRadius: 6,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",
  },

  orderIdCell: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  /* ===================================================
     EMPTY
  =================================================== */

  emptyCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingVertical: 35,
    paddingHorizontal: 20,

    alignItems: "center",
  },

  emptyIcon: {
    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 9,
  },

  emptyTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },

  emptyDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 3,
  },

  /* ===================================================
     BOTTOM NAVIGATION
  =================================================== */

  bottomNav: {
    height: 64,

    backgroundColor: Colors.white,

    flexDirection: "row",

    borderTopWidth: 1,
    borderTopColor: Colors.border,

    elevation: 10,

    paddingHorizontal: 2,
  },

  navItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    marginVertical: 5,
    marginHorizontal: 2,

    borderRadius: 7,
  },

  navItemActive: {
    backgroundColor: "#E8EFEA",
  },

  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.icon,
    marginTop: 3,
  },

  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  /* ===================================================
     VIEW MODAL
  =================================================== */

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.35)",

    justifyContent: "flex-end",
  },

  viewModal: {
    width: "100%",

    maxHeight: "92%",

    backgroundColor: Colors.background,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,

    overflow: "hidden",
  },

  modalHeader: {
    minHeight: 70,

    paddingHorizontal: 17,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: Colors.white,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: Colors.primary2,
  },

  modalSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
    marginTop: 2,
  },

  closeButton: {
    width: 35,
    height: 35,

    borderRadius: 18,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",
  },

  viewModalContent: {
    paddingHorizontal: 17,
    paddingTop: 17,
  },

  viewImage: {
    width: "100%",
    height: 190,

    borderRadius: 10,

    backgroundColor: Colors.input,

    marginBottom: 14,
  },

  viewTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 15,
  },

  viewFoodName: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    color: Colors.primary2,
  },

  viewEstablishment: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* ===================================================
     ORDER STATUS
  =================================================== */

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F4EEDF",

    borderRadius: 12,

    paddingHorizontal: 8,
    paddingVertical: 5,

    marginLeft: 8,
  },

  successOrderBadge: {
    backgroundColor: "#E7F0E9",
  },

  activeDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: Colors.accent,

    marginRight: 5,
  },

  successOrderDot: {
    backgroundColor: Colors.button,
  },

  activeText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7,

    color: Colors.accent,
  },

  successOrderText: {
    color: Colors.button,
  },

  /* ===================================================
     ORDER ID BOX
  =================================================== */

  orderIdBox: {
    flexDirection: "row",

    backgroundColor: "#E9EFE9",

    borderRadius: 9,

    padding: 12,

    justifyContent: "space-between",

    marginBottom: 10,
  },

  orderIdText: {
    fontFamily: "PoppinsBold",
    fontSize: 12,
    color: Colors.primary,
  },

  /* ===================================================
     PRICE
  =================================================== */

  viewPriceBox: {
    flexDirection: "row",

    backgroundColor: "#E9EFE9",

    borderRadius: 9,

    padding: 12,

    justifyContent: "space-between",

    marginBottom: 17,
  },

  viewLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginBottom: 2,
  },

  viewPrice: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary,
  },

  viewValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary2,
  },

  /* ===================================================
     VIEW SECTIONS
  =================================================== */

  viewSection: {
    marginBottom: 18,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,

    paddingBottom: 14,
  },

  viewSectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 12,

    color: Colors.primary2,

    marginBottom: 9,
  },

  viewDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,

    color: Colors.primary1,

    lineHeight: 15,
  },

  /* ===================================================
     DETAIL ROW
  =================================================== */

  detailRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,
  },

  detailIcon: {
    width: 31,
    height: 31,

    borderRadius: 16,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  detailLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,

    color: Colors.primary1,
  },

  detailValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,

    color: Colors.primary2,

    marginTop: 1,
  },

  /* ===================================================
     MODAL ACTIONS
  =================================================== */

  viewActions: {
    flexDirection: "row",

    gap: 9,

    marginTop: 2,
  },

  viewCloseButton: {
    flex: 1,

    height: 44,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: Colors.border,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",
  },

  viewCloseButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,

    color: Colors.primary1,
  },

});