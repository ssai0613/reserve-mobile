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

type RequestStatus = "Standard" | "Urgent";

type RequestItem = {
  id: string;
  foodType: string;
  quantity: number;
  date: string;
  status: RequestStatus;
};

/* =====================================================
   MOCK DATA
===================================================== */

const requests: RequestItem[] = [
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Urgent",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
  {
    id: "RQ101",
    foodType: "Assorted Bakery",
    quantity: 100,
    date: "04-07-2026",
    status: "Standard",
  },
];

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function FoodBankRequests() {
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
            onPress={() => router.push("/foodbank/dashboard")}
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
            onPress={() => router.push("/foodbank/dashboard")}
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
            Donation Requests
          </Text>

          <Text style={styles.pageSubtitle}>
            Manage your food donation requests
          </Text>
        </View>

        {/* =================================================
            FILTER / SEARCH
        ================================================= */}

        <View
          style={[
            styles.toolbar,
            isSmallScreen && styles.toolbarSmall,
          ]}
        >
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

          <TouchableOpacity
            style={[
              styles.addButton,
              isSmallScreen && styles.fullWidthButton,
            ]}
            activeOpacity={0.85}
            onPress={() =>
              router.push("/foodbank/dashboard")
            }
          >
            <Ionicons
              name="add"
              size={18}
              color={Colors.white}
            />

            <Text style={styles.addButtonText}>
              ADD NEW REQUEST
            </Text>
          </TouchableOpacity>

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
            REQUEST TABLE
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
                <View style={styles.reqIdColumn}>
                  <Text style={styles.tableHeaderText}>
                    Req ID
                  </Text>
                </View>

                <View style={styles.foodColumn}>
                  <Text style={styles.tableHeaderText}>
                    Food Type
                  </Text>
                </View>

                <View style={styles.quantityColumn}>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      styles.centerText,
                    ]}
                  >
                    Quantity
                    {"\n"}
                    Requested
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

              {requests.map((item, index) => (
                <RequestRow
                  key={`${item.id}-${index}`}
                  item={item}
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
          icon="document-text"
          label="Requests"
          active
          onPress={() =>
            router.replace("/foodbank/requests")
          }
        />

        <BottomNavItem
          icon="gift-outline"
          label="Donations"
          onPress={() =>
            router.push("/foodbank/donations")
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
   REQUEST ROW
===================================================== */

function RequestRow({
  item,
  index,
}: {
  item: RequestItem;
  index: number;
}) {
  return (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 && styles.tableRowGreen,
      ]}
    >
      {/* REQUEST ID */}

      <View style={styles.reqIdColumn}>
        <Text style={styles.cellText}>
          {item.id}
        </Text>
      </View>

      {/* FOOD TYPE */}

      <View style={styles.foodColumn}>
        <Text
          style={styles.cellText}
          numberOfLines={1}
        >
          {item.foodType}
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
          {item.quantity}
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
          {item.date}
        </Text>
      </View>

      {/* STATUS */}

      <View style={styles.statusColumn}>
        <StatusBadge status={item.status} />
      </View>

      {/* ACTIONS */}

      <View style={styles.actionsColumn}>
        <View style={styles.actions}>
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

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push("/foodbank/dashboard")
            }
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={15}
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

function StatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const isUrgent = status === "Urgent";

  return (
    <View
      style={[
        styles.statusBadge,
        isUrgent
          ? styles.statusUrgent
          : styles.statusStandard,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isUrgent
            ? styles.statusUrgentText
            : styles.statusStandardText,
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
    marginBottom: 17,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 30,
    color: Colors.primary2,
  },

  pageTitleSmall: {
    fontSize: 21,
    lineHeight: 27,
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

  addButton: {
    height: 36,
    minWidth: 153,

    backgroundColor: Colors.primary,

    borderRadius: 8,

    paddingHorizontal: 11,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 8.5,
    color: Colors.white,
    marginLeft: 4,
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
    minWidth: 570,
  },

  tableNormal: {
    width: "100%",
  },

  tableSmall: {
    width: 620,
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

  reqIdColumn: {
    width: 92,
    paddingHorizontal: 10,
  },

  foodColumn: {
    width: 130,
    paddingHorizontal: 7,
  },

  quantityColumn: {
    width: 88,
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
    width: 92,
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
    minWidth: 57,
    height: 20,

    paddingHorizontal: 8,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  statusStandard: {
    backgroundColor: "#F28C00",
  },

  statusUrgent: {
    backgroundColor: "#FF0808",
  },

  statusText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7,
    lineHeight: 10,
  },

  statusStandardText: {
    color: Colors.white,
  },

  statusUrgentText: {
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