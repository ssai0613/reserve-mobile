import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
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
   DONATION HUB DATA
===================================================== */

const requests = [
  {
    id: "REQ001",
    requester: "Rescue Kids",
    type: "Canned Goods",
    quantity: "500",
    urgency: "Urgent",
    date: "Today",
    status: "Awaiting",
  },
  {
    id: "REQ002",
    requester: "Rescue Kids",
    type: "Canned Goods",
    quantity: "500",
    urgency: "Urgent",
    date: "Today",
    status: "Accepted",
  },
  {
    id: "REQ003",
    requester: "Rescue Kids",
    type: "Canned Goods",
    quantity: "500",
    urgency: "Urgent",
    date: "Today",
    status: "Awaiting",
  },
  {
    id: "REQ004",
    requester: "Rescue Kids",
    type: "Canned Goods",
    quantity: "500",
    urgency: "Standard",
    date: "Today",
    status: "Accepted",
  },
  {
    id: "REQ005",
    requester: "Rescue Kids",
    type: "Canned Goods",
    quantity: "500",
    urgency: "Urgent",
    date: "Today",
    status: "Responding",
  },
];

const foodBanks = [
  {
    id: 1,
    name: "Rainier Valley Food Bank",
    address: "1st Ave, Cebu City",
    distance: "1.5 km",
    hours: "8AM - 5PM",
  },
  {
    id: 2,
    name: "Rainier Valley Food Bank",
    address: "1st Ave, Cebu City",
    distance: "1.5 km",
    hours: "8AM - 5PM",
  },
  {
    id: 3,
    name: "Rainier Valley Food Bank",
    address: "1st Ave, Cebu City",
    distance: "1.5 km",
    hours: "8AM - 5PM",
  },
  {
    id: 4,
    name: "Rainier Valley Food Bank",
    address: "1st Ave, Cebu City",
    distance: "1.5 km",
    hours: "8AM - 5PM",
  },
];

/* =====================================================
   REQUEST TYPE
===================================================== */

type DonationRequest = {
  id: string;
  requester: string;
  type: string;
  quantity: string;
  urgency: string;
  date: string;
  status: string;
};

/* =====================================================
   MAIN DONATION PAGE
===================================================== */

export default function DonationHub() {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  /* =====================================================
     VIEW MODAL
  ===================================================== */

  const [selectedRequest, setSelectedRequest] =
    useState<DonationRequest | null>(null);

  const [viewModalVisible, setViewModalVisible] = useState(false);

  /* =====================================================
     DONATION MODAL
  ===================================================== */

  const [donationModalVisible, setDonationModalVisible] =
    useState(false);

  /* =====================================================
     FILTER REQUESTS
  ===================================================== */

  const filteredRequests = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesSearch =
        request.id.toLowerCase().includes(searchValue) ||
        request.requester.toLowerCase().includes(searchValue) ||
        request.type.toLowerCase().includes(searchValue) ||
        request.status.toLowerCase().includes(searchValue);

      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Awaiting" &&
          request.status === "Awaiting") ||
        (selectedFilter === "Accepted" &&
          request.status === "Accepted") ||
        (selectedFilter === "Responding" &&
          request.status === "Responding");

      return matchesSearch && matchesFilter;
    });
  }, [search, selectedFilter]);

  /* =====================================================
     VIEW REQUEST FUNCTION
  ===================================================== */

  const handleViewRequest = (request: DonationRequest) => {
    setSelectedRequest(request);
    setViewModalVisible(true);
  };

  /* =====================================================
     DONATE FUNCTION
  ===================================================== */

  const handleDonate = (request: DonationRequest) => {
    setSelectedRequest(request);
    setDonationModalVisible(true);
  };

  /* =====================================================
     CLOSE VIEW
  ===================================================== */

  const closeViewModal = () => {
    setViewModalVisible(false);
    setSelectedRequest(null);
  };

  /* =====================================================
     CLOSE DONATION
  ===================================================== */

  const closeDonationModal = () => {
    setDonationModalVisible(false);
    setSelectedRequest(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>

          <Text style={styles.headerSubtitle}>
            Establishment Portal
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* NOTIFICATIONS */}

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() =>
              router.push("/establishment/notifications")
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.primary}
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>

          {/* PROFILE */}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push("/establishment/profile")
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
          <Text style={styles.pageTitle}>Donation Hub</Text>
        </View>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <View style={styles.statsRow}>
          {/* TOTAL REQUESTS */}

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="heart-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {requests.length}
              </Text>

              <Text style={styles.statLabel}>
                Donation requests
              </Text>
            </View>
          </View>

          {/* AWAITING */}

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
                {
                  requests.filter(
                    (request) =>
                      request.status === "Awaiting"
                  ).length
                }
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  styles.statLabelWhite,
                ]}
              >
                Awaiting response
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
            placeholder="Search donation requests..."
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              activeOpacity={0.7}
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
            "Awaiting",
            "Accepted",
            "Responding",
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
            COMMUNITY REQUESTS
        ================================================= */}

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Community Food Bank Requests
              </Text>

              <Text style={styles.sectionSubtitle}>
                {filteredRequests.length} request
                {filteredRequests.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </Text>
            </View>

            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                Donations
              </Text>
            </View>
          </View>

          {/* =================================================
              REQUEST TABLE
          ================================================= */}

          {filteredRequests.length > 0 ? (
            <RequestTable
              requests={filteredRequests}
              onView={handleViewRequest}
              onDonate={handleDonate}
            />
          ) : (
            <EmptyRequests
              title="No donation requests"
              description="No requests match your current search or filter."
            />
          )}
        </View>

        {/* =================================================
            FOOD BANKS
        ================================================= */}

        <View style={styles.foodBankSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Explore Food Banks Nearby
              </Text>

              <Text style={styles.sectionSubtitle}>
                Food banks available for donations
              </Text>
            </View>
          </View>

          <View style={styles.foodBankGrid}>
            {foodBanks.map((bank) => (
              <FoodBankCard
                key={bank.id}
                bank={bank}
              />
            ))}
          </View>
        </View>

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
          icon="basket-outline"
          label="Orders"
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
          icon="heart"
          label="Donation"
          active
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
          VIEW REQUEST MODAL
      ================================================= */}

      <Modal
        visible={viewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeViewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Donation Request
                </Text>

                <Text style={styles.modalSubtitle}>
                  Request details
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeViewModal}
                activeOpacity={0.7}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            </View>

            {/* REQUEST ICON */}

            <View style={styles.modalRequestIcon}>
              <Ionicons
                name="heart-outline"
                size={28}
                color={Colors.primary}
              />
            </View>

            {/* DETAILS */}

            {selectedRequest && (
              <View style={styles.detailsContainer}>
                <DetailRow
                  label="Request ID"
                  value={selectedRequest.id}
                />

                <DetailRow
                  label="Requester"
                  value={selectedRequest.requester}
                />

                <DetailRow
                  label="Request Type"
                  value={selectedRequest.type}
                />

                <DetailRow
                  label="Quantity"
                  value={selectedRequest.quantity}
                />

                <DetailRow
                  label="Urgency"
                  value={selectedRequest.urgency}
                  valueStyle={
                    selectedRequest.urgency === "Urgent"
                      ? styles.detailUrgent
                      : styles.detailStandard
                  }
                />

                <DetailRow
                  label="Request Date"
                  value={selectedRequest.date}
                />

                <DetailRow
                  label="Status"
                  value={selectedRequest.status}
                  valueStyle={
                    selectedRequest.status === "Accepted"
                      ? styles.detailAccepted
                      : selectedRequest.status ===
                        "Responding"
                      ? styles.detailResponding
                      : styles.detailAwaiting
                  }
                />
              </View>
            )}

            {/* CLOSE BUTTON */}

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              activeOpacity={0.8}
              onPress={closeViewModal}
            >
              <Text style={styles.modalPrimaryButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* =================================================
          DONATION MODAL
      ================================================= */}

      <Modal
        visible={donationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDonationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* HEADER */}

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Donate to Request
                </Text>

                <Text style={styles.modalSubtitle}>
                  Review before confirming
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeDonationModal}
                activeOpacity={0.7}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <>
                <View style={styles.donationIcon}>
                  <Ionicons
                    name="gift-outline"
                    size={30}
                    color={Colors.white}
                  />
                </View>

                <Text style={styles.donationQuestion}>
                  Donate to {selectedRequest.requester}?
                </Text>

                <Text style={styles.donationDescription}>
                  This request is asking for{" "}
                  <Text style={styles.boldText}>
                    {selectedRequest.quantity}
                  </Text>{" "}
                  of{" "}
                  <Text style={styles.boldText}>
                    {selectedRequest.type}
                  </Text>
                  .
                </Text>

                <View style={styles.donationSummary}>
                  <View>
                    <Text style={styles.summaryLabel}>
                      Request ID
                    </Text>

                    <Text style={styles.summaryValue}>
                      {selectedRequest.id}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.summaryLabel}>
                      Urgency
                    </Text>

                    <Text
                      style={[
                        styles.summaryValue,
                        selectedRequest.urgency ===
                          "Urgent"
                          ? styles.detailUrgent
                          : styles.detailStandard,
                      ]}
                    >
                      {selectedRequest.urgency}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    activeOpacity={0.8}
                    onPress={closeDonationModal}
                  >
                    <Text
                      style={
                        styles.modalSecondaryButtonText
                      }
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalPrimaryButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      closeDonationModal();
                    }}
                  >
                    <Ionicons
                      name="gift-outline"
                      size={16}
                      color={Colors.white}
                    />

                    <Text
                      style={
                        styles.modalPrimaryButtonText
                      }
                    >
                      Confirm Donation
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =====================================================
   REQUEST TABLE
===================================================== */

function RequestTable({
  requests,
  onView,
  onDonate,
}: {
  requests: DonationRequest[];
  onView: (request: DonationRequest) => void;
  onDonate: (request: DonationRequest) => void;
}) {
  return (
    <View style={styles.tableOuter}>
      {/* ONLY TABLE SCROLLS HORIZONTALLY */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
      >
        <View style={styles.table}>
          {/* TABLE HEADER */}

          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableHeaderText,
                styles.tableRequester,
              ]}
            >
              Requester
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableType,
              ]}
            >
              Request Type
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableQuantity,
              ]}
            >
              Qty
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableUrgency,
              ]}
            >
              Urgency
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableDate,
              ]}
            >
              Request Date
            </Text>

            <Text
              style={[
                styles.tableHeaderText,
                styles.tableRequestStatus,
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

          {requests.map((request, index) => (
            <View
              key={request.id}
              style={[
                styles.tableRow,
                index % 2 === 0 &&
                  styles.tableRowAlternate,
              ]}
            >
              {/* REQUESTER */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableRequester,
                ]}
                numberOfLines={1}
              >
                {request.requester}
              </Text>

              {/* TYPE */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableType,
                ]}
                numberOfLines={1}
              >
                {request.type}
              </Text>

              {/* QUANTITY */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableQuantity,
                ]}
              >
                {request.quantity}
              </Text>

              {/* URGENCY */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableUrgency,
                  request.urgency === "Urgent"
                    ? styles.urgentText
                    : styles.standardText,
                ]}
              >
                {request.urgency}
              </Text>

              {/* DATE */}

              <Text
                style={[
                  styles.tableCell,
                  styles.tableDate,
                ]}
              >
                {request.date}
              </Text>

              {/* STATUS */}

              <View
                style={[
                  styles.tableRequestStatus,
                  styles.statusCell,
                ]}
              >
                <View
                  style={[
                    styles.statusBadgeSmall,
                    request.status === "Accepted"
                      ? styles.acceptedBadge
                      : request.status ===
                        "Responding"
                      ? styles.respondingBadge
                      : styles.awaitingBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      request.status ===
                        "Accepted"
                        ? styles.acceptedDot
                        : request.status ===
                          "Responding"
                        ? styles.respondingDot
                        : styles.awaitingDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusTextSmall,
                      request.status ===
                        "Accepted"
                        ? styles.acceptedStatusText
                        : request.status ===
                          "Responding"
                        ? styles.respondingStatusText
                        : styles.awaitingStatusText,
                    ]}
                  >
                    {request.status}
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
                    onView(request)
                  }
                >
                  <Ionicons
                    name="eye-outline"
                    size={15}
                    color={Colors.icon}
                  />
                </TouchableOpacity>

                {/* DONATE */}

                <TouchableOpacity
                  style={styles.confirmButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    onDonate(request)
                  }
                >
                  <Ionicons
                    name="gift-outline"
                    size={15}
                    color={Colors.white}
                  />
                </TouchableOpacity>
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
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text
        style={[
          styles.detailValue,
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* =====================================================
   EMPTY REQUESTS
===================================================== */

function EmptyRequests({
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
          name="heart-outline"
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
   FOOD BANK CARD
===================================================== */

function FoodBankCard({
  bank,
}: {
  bank: {
    id: number;
    name: string;
    address: string;
    distance: string;
    hours: string;
  };
}) {
  return (
    <TouchableOpacity
      style={styles.foodBankCard}
      activeOpacity={0.8}
    >
      <View style={styles.foodBankLogo}>
        <Ionicons
          name="leaf"
          size={30}
          color={Colors.white}
        />
      </View>

      <View style={styles.foodBankInfo}>
        <Text
          style={styles.foodBankName}
          numberOfLines={1}
        >
          {bank.name}
        </Text>

        <Text style={styles.foodBankDetail}>
          {bank.distance} · {bank.address}
        </Text>

        <Text style={styles.foodBankDetail}>
          {bank.hours}
        </Text>

        <Text style={styles.acceptedFood}>
          Accepted Food:
        </Text>

        <View style={styles.foodIcons}>
          <Ionicons
            name="leaf-outline"
            size={11}
            color={Colors.primary}
          />

          <Ionicons
            name="nutrition-outline"
            size={11}
            color={Colors.primary}
          />

          <Ionicons
            name="fast-food-outline"
            size={11}
            color={Colors.primary}
          />

          <Ionicons
            name="restaurant-outline"
            size={11}
            color={Colors.primary}
          />
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.icon}
      />
    </TouchableOpacity>
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

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 2,
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
    marginBottom: 18,
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

    paddingHorizontal: 11,
  },

  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
  },

  filterTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.white,
  },

  /* ===================================================
     SECTION
  =================================================== */

  sectionContainer: {
    marginBottom: 22,
  },

  foodBankSection: {
    marginBottom: 10,
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
    width: 790,
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

  tableRequester: {
    width: 120,
  },

  tableType: {
    width: 145,
  },

  tableQuantity: {
    width: 65,
    textAlign: "center",
  },

  tableUrgency: {
    width: 100,
  },

  tableDate: {
    width: 110,
  },

  tableRequestStatus: {
    width: 120,
  },

  tableActions: {
    width: 90,
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

  awaitingBadge: {
    backgroundColor: "#F4EEDF",
  },

  acceptedBadge: {
    backgroundColor: "#E7F0E9",
  },

  respondingBadge: {
    backgroundColor: "#F4EEDF",
  },

  statusDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    marginRight: 4,
  },

  awaitingDot: {
    backgroundColor: Colors.accent,
  },

  acceptedDot: {
    backgroundColor: Colors.button,
  },

  respondingDot: {
    backgroundColor: "#D99027",
  },

  statusTextSmall: {
    fontFamily: "PoppinsMedium",
    fontSize: 6.5,
  },

  awaitingStatusText: {
    color: Colors.accent,
  },

  acceptedStatusText: {
    color: Colors.button,
  },

  respondingStatusText: {
    color: "#D99027",
  },

  /* ===================================================
     URGENCY
  =================================================== */

  urgentText: {
    color: "#A94A3A",
    fontFamily: "PoppinsMedium",
  },

  standardText: {
    color: Colors.accent,
    fontFamily: "PoppinsMedium",
  },

  /* ===================================================
     ACTIONS
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
     FOOD BANKS
  =================================================== */

  foodBankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  foodBankCard: {
    width: "48.2%",

    minHeight: 118,

    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 9,

    flexDirection: "row",
    alignItems: "center",
  },

  foodBankLogo: {
    width: 55,
    height: 55,

    borderRadius: 28,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 7,
  },

  foodBankInfo: {
    flex: 1,
  },

  foodBankName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 8.5,
    color: Colors.primary2,
    marginBottom: 2,
  },

  foodBankDetail: {
    fontFamily: "PoppinsRegular",
    fontSize: 6.5,
    color: Colors.primary1,
    lineHeight: 10,
  },

  acceptedFood: {
    fontFamily: "PoppinsMedium",
    fontSize: 6.5,
    color: Colors.primary1,
    marginTop: 2,
  },

  foodIcons: {
    flexDirection: "row",
    gap: 5,
    marginTop: 1,
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
     MODAL
  =================================================== */

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0, 0, 0, 0.45)",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",

    maxWidth: 430,

    backgroundColor: Colors.white,

    borderRadius: 14,

    padding: 18,
  },

  modalHeader: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 15,
  },

  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.primary2,
  },

  modalSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
    marginTop: 1,
  },

  modalCloseButton: {
    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "#F3F6F4",

    alignItems: "center",
    justifyContent: "center",
  },

  modalRequestIcon: {
    width: 58,
    height: 58,

    borderRadius: 29,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    alignSelf: "center",

    marginBottom: 15,
  },

  /* ===================================================
     DETAILS
  =================================================== */

  detailsContainer: {
    backgroundColor: "#F7F9F7",

    borderRadius: 10,

    padding: 12,

    marginBottom: 15,
  },

  detailRow: {
    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "center",

    minHeight: 32,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  detailLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
  },

  detailValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 8.5,
    color: Colors.primary2,
    textAlign: "right",
  },

  detailUrgent: {
    color: "#A94A3A",
  },

  detailStandard: {
    color: Colors.accent,
  },

  detailAccepted: {
    color: Colors.button,
  },

  detailResponding: {
    color: "#D99027",
  },

  detailAwaiting: {
    color: "#A94A3A",
  },

  /* ===================================================
     DONATION MODAL
  =================================================== */

  donationIcon: {
    width: 62,
    height: 62,

    borderRadius: 31,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    alignSelf: "center",

    marginBottom: 12,
  },

  donationQuestion: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
    textAlign: "center",
  },

  donationDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,

    textAlign: "center",

    lineHeight: 15,

    marginTop: 5,
    marginBottom: 14,
  },

  boldText: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },

  donationSummary: {
    backgroundColor: "#F7F9F7",

    borderRadius: 9,

    padding: 12,

    flexDirection: "row",

    justifyContent: "space-between",

    marginBottom: 15,
  },

  summaryLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.primary1,
  },

  summaryValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary2,
    marginTop: 2,
  },

  /* ===================================================
     MODAL BUTTONS
  =================================================== */

  modalButtons: {
    flexDirection: "row",
    gap: 8,
  },

  modalPrimaryButton: {
    minHeight: 42,

    flex: 1,

    borderRadius: 8,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    flexDirection: "row",
    gap: 6,
  },

  modalPrimaryButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.white,
  },

  modalSecondaryButton: {
    minHeight: 42,

    flex: 1,

    borderRadius: 8,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    alignItems: "center",
    justifyContent: "center",
  },

  modalSecondaryButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary1,
  },
});