import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   TYPES
===================================================== */

type OfferStatus =
  | "Pending"
  | "Accepted"
  | "Processing"
  | "Rejected";

type DonationOffer = {
  id: string;
  establishment: string;
  foodType: string;
  quantity: number;
  date: string;
  status: OfferStatus;
};

/* =====================================================
   MOCK DATA
===================================================== */

const donationOffers: DonationOffer[] = [
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Accepted",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Processing",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Rejected",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
  {
    id: "OI101",
    establishment: "Nena’s Bakeshop",
    foodType: "Pastries",
    quantity: 100,
    date: "04-07-2026",
    status: "Pending",
  },
];

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function FoodBankDonations() {
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 430;
  const isTablet = width >= 700;

  return (
    <SafeAreaView style={styles.container}>
      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>

          <Text style={styles.headerSubtitle}>
            Food Bank Portal
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* NOTIFICATION */}

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() =>
              router.push("/foodbank/dashboard")
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
              router.push("/foodbank/requests")
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
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
      >
        {/* PAGE TITLE */}

        <View style={styles.pageHeader}>
          <Text
            style={[
              styles.pageTitle,
              isSmallScreen && styles.pageTitleSmall,
            ]}
          >
            Donation Offers Management
          </Text>

          <Text style={styles.pageSubtitle}>
            Manage food donation offers from establishments
          </Text>
        </View>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <View
          style={[
            styles.toolbar,
            isSmallScreen && styles.toolbarSmall,
          ]}
        >
          {/* FILTER */}

          <TouchableOpacity
            style={[
              styles.filterButton,
              isSmallScreen && styles.fullWidthButton,
            ]}
            activeOpacity={0.75}
          >
            <Ionicons
              name="filter-outline"
              size={15}
              color={Colors.primary}
            />

            <Text style={styles.filterText}>
              Filter by: Status
            </Text>

            <Ionicons
              name="chevron-down"
              size={14}
              color={Colors.icon}
            />
          </TouchableOpacity>

          {/* SEARCH */}

          <View
            style={[
              styles.searchContainer,
              isSmallScreen && styles.fullWidthSearch,
            ]}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={Colors.placeholder}
            />

            <Ionicons
              name="search-outline"
              size={19}
              color={Colors.primary}
            />
          </View>
        </View>

        {/* =================================================
            DONATION OFFERS TABLE
        ================================================= */}

        <View style={styles.tableOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View
              style={[
                styles.table,
                width < 500
                  ? styles.tableSmall
                  : styles.tableNormal,
              ]}
            >
              {/* TABLE HEADER */}

              <View style={styles.tableHeader}>
                <View style={styles.offerIdColumn}>
                  <Text style={styles.tableHeaderText}>
                    Offer ID
                  </Text>
                </View>

                <View style={styles.establishmentColumn}>
                  <Text style={styles.tableHeaderText}>
                    Establishment
                  </Text>
                </View>

                <View style={styles.foodColumn}>
                  <Text style={styles.tableHeaderText}>
                    Food Type
                  </Text>
                </View>

                <View style={styles.quantityColumn}>
                  <Text style={styles.tableHeaderText}>
                    Quantity
                  </Text>
                </View>

                <View style={styles.dateColumn}>
                  <Text style={styles.tableHeaderText}>
                    Date
                  </Text>
                </View>

                <View style={styles.statusColumn}>
                  <Text style={styles.tableHeaderText}>
                    Status
                  </Text>
                </View>

                <View style={styles.actionsColumn}>
                  <Text style={styles.tableHeaderText}>
                    Actions
                  </Text>
                </View>
              </View>

              {/* TABLE ROWS */}

              {donationOffers.map((offer, index) => (
                <DonationRow
                  key={`${offer.id}-${index}`}
                  offer={offer}
                  index={index}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="grid-outline"
          label="Home"
          onPress={() =>
            router.replace("/foodbank/dashboard")
          }
        />

        <BottomNavItem
          icon="document-text-outline"
          label="Requests"
          onPress={() =>
            router.push("/foodbank/requests")
          }
        />

        <BottomNavItem
          icon="gift"
          label="Donations"
          active
          onPress={() =>
            router.replace("/foodbank/donations")
          }
        />

        <BottomNavItem
          icon="people-outline"
          label="Partners"
          onPress={() =>
            router.push("/foodbank/dashboard")
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   DONATION ROW
===================================================== */

function DonationRow({
  offer,
  index,
}: {
  offer: DonationOffer;
  index: number;
}) {
  return (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 && styles.tableRowGreen,
      ]}
    >
      {/* OFFER ID */}

      <View style={styles.offerIdColumn}>
        <Text style={styles.cellText}>
          {offer.id}
        </Text>
      </View>

      {/* ESTABLISHMENT */}

      <View style={styles.establishmentColumn}>
        <Text
          style={styles.cellText}
          numberOfLines={1}
        >
          {offer.establishment}
        </Text>
      </View>

      {/* FOOD TYPE */}

      <View style={styles.foodColumn}>
        <Text style={styles.cellText}>
          {offer.foodType}
        </Text>
      </View>

      {/* QUANTITY */}

      <View style={styles.quantityColumn}>
        <Text
          style={[
            styles.cellText,
            styles.centerText,
          ]}
        >
          {offer.quantity}
        </Text>
      </View>

      {/* DATE */}

      <View style={styles.dateColumn}>
        <Text
          style={[
            styles.cellText,
            styles.centerText,
          ]}
        >
          {offer.date}
        </Text>
      </View>

      {/* STATUS */}

      <View style={styles.statusColumn}>
        <OfferStatusBadge status={offer.status} />
      </View>

      {/* ACTIONS */}

      <View style={styles.actionsColumn}>
        <View style={styles.actions}>
          {/* VIEW */}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push("/foodbank/dashboard")
            }
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {/* ACCEPT */}

          <TouchableOpacity
            activeOpacity={0.7}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {/* REJECT */}

          <TouchableOpacity
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function OfferStatusBadge({
  status,
}: {
  status: OfferStatus;
}) {
  let badgeStyle = styles.statusPending;
  let textStyle = styles.statusPendingText;

  if (status === "Accepted") {
    badgeStyle = styles.statusAccepted;
    textStyle = styles.statusAcceptedText;
  }

  if (status === "Processing") {
    badgeStyle = styles.statusProcessing;
    textStyle = styles.statusProcessingText;
  }

  if (status === "Rejected") {
    badgeStyle = styles.statusRejected;
    textStyle = styles.statusRejectedText;
  }

  return (
    <View
      style={[
        styles.statusBadge,
        badgeStyle,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          textStyle,
        ]}
      >
        {status}
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

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 20,
  },

  scrollContentTablet: {
    paddingHorizontal: 22,
  },

  bottomSpace: {
    height: 20,
  },

  /* ===================================================
     HEADER
  =================================================== */

  header: {
    height: 70,

    paddingHorizontal: 18,

    backgroundColor: Colors.background,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 23,
    lineHeight: 26,
    color: Colors.primary,
    letterSpacing: 0.7,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 11,
    color: Colors.primary1,
    marginTop: -1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
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
     PAGE HEADER
  =================================================== */

  pageHeader: {
    marginBottom: 20,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 30,
    color: Colors.primary2,
  },

  pageTitleSmall: {
    fontSize: 20,
    lineHeight: 26,
  },

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* ===================================================
     TOOLBAR
  =================================================== */

  toolbar: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    marginBottom: 24,
  },

  toolbarSmall: {
    flexWrap: "wrap",
  },

  filterButton: {
    height: 36,
    width: 145,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,

    paddingHorizontal: 10,

    flexDirection: "row",
    alignItems: "center",
  },

  filterText: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary2,

    marginLeft: 5,
  },

  searchContainer: {
    height: 36,

    flex: 1,

    minWidth: 150,
    maxWidth: 350,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,

    paddingHorizontal: 10,

    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,

    height: 36,

    fontFamily: "PoppinsRegular",
    fontSize: 9,

    color: Colors.text,

    paddingVertical: 0,
  },

  fullWidthButton: {
    width: "100%",
  },

  fullWidthSearch: {
    width: "100%",
    maxWidth: undefined,
    flex: undefined,
  },

  /* ===================================================
     TABLE
  =================================================== */

  tableOuter: {
    width: "100%",

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    borderRadius: 9,

    overflow: "hidden",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  table: {
    minWidth: 650,
  },

  tableNormal: {
    width: "100%",
  },

  tableSmall: {
    width: 680,
  },

  tableHeader: {
    height: 43,

    backgroundColor: "#F2F4F1",

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  tableRow: {
    minHeight: 43,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: "#E3E7E3",
  },

  tableRowGreen: {
    backgroundColor: "#DDF2EA",
  },

  /* ===================================================
     COLUMNS
  =================================================== */

  offerIdColumn: {
    width: 82,
    paddingHorizontal: 9,
  },

  establishmentColumn: {
    width: 125,
    paddingHorizontal: 7,
  },

  foodColumn: {
    width: 85,
    paddingHorizontal: 7,
  },

  quantityColumn: {
    width: 72,
    paddingHorizontal: 5,

    alignItems: "center",
    justifyContent: "center",
  },

  dateColumn: {
    width: 90,
    paddingHorizontal: 5,

    alignItems: "center",
    justifyContent: "center",
  },

  statusColumn: {
    width: 90,
    paddingHorizontal: 5,

    alignItems: "center",
    justifyContent: "center",
  },

  actionsColumn: {
    width: 105,
    paddingHorizontal: 5,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ===================================================
     TABLE TEXT
  =================================================== */

  tableHeaderText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7.5,
    lineHeight: 10,
    color: Colors.primary2,
  },

  cellText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: "#202624",
  },

  centerText: {
    textAlign: "center",
  },

  /* ===================================================
     STATUS
  =================================================== */

  statusBadge: {
    minWidth: 62,
    height: 20,

    paddingHorizontal: 8,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  statusPending: {
    backgroundColor: "#F6A51A",
  },

  statusAccepted: {
    backgroundColor: "#70987A",
  },

  statusProcessing: {
    backgroundColor: "#C9CBCB",
  },

  statusRejected: {
    backgroundColor: "#F21B1B",
  },

  statusText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7,
    lineHeight: 10,
  },

  statusPendingText: {
    color: "#202624",
  },

  statusAcceptedText: {
    color: Colors.white,
  },

  statusProcessingText: {
    color: "#303333",
  },

  statusRejectedText: {
    color: Colors.white,
  },

  /* ===================================================
     ACTIONS
  =================================================== */

  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  /* ===================================================
     BOTTOM NAV
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
});