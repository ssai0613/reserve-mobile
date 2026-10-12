import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
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
   TRANSACTION DATA
===================================================== */

const transactions = [
  {
    food: "Wheat Bread",
    qty: "500",
    original: "₱150.00",
    discounted: "₱100.00",
    net: "₱100.00",
    total: "₱5,000.00",
  },
  {
    food: "Assorted Bread",
    qty: "350",
    original: "₱120.00",
    discounted: "₱80.00",
    net: "₱80.00",
    total: "₱3,500.00",
  },
  {
    food: "Pan Lamion",
    qty: "250",
    original: "₱100.00",
    discounted: "₱70.00",
    net: "₱70.00",
    total: "₱2,500.00",
  },
  {
    food: "Fresh Pastries",
    qty: "180",
    original: "₱90.00",
    discounted: "₱60.00",
    net: "₱60.00",
    total: "₱1,800.00",
  },
  {
    food: "Chocolate Bread",
    qty: "220",
    original: "₱110.00",
    discounted: "₱75.00",
    net: "₱75.00",
    total: "₱2,200.00",
  },
];

/* =====================================================
   WITHDRAWAL DATA
===================================================== */

const withdrawals = [
  {
    id: "PO01",
    amount: "₱10,000",
    status: "Completed",
  },
  {
    id: "PO02",
    amount: "₱5,000",
    status: "Completed",
  },
];

/* =====================================================
   MAIN EARNINGS PAGE
===================================================== */

export default function EstablishmentEarnings() {
  const [search, setSearch] = useState("");

  const filteredTransactions = transactions.filter((transaction) => {
    const searchValue = search.toLowerCase();

    return (
      transaction.food.toLowerCase().includes(searchValue) ||
      transaction.qty.toLowerCase().includes(searchValue) ||
      transaction.original.toLowerCase().includes(searchValue) ||
      transaction.discounted.toLowerCase().includes(searchValue)
    );
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

          <Text style={styles.pageTitle}>
            My Earnings Analytics
          </Text>

        </View>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <View style={styles.statsGrid}>

          {/* TOTAL EARNINGS */}

          <View style={styles.statCard}>

            <View style={styles.statIcon}>
              <Ionicons
                name="cash-outline"
                size={19}
                color={Colors.primary}
              />
            </View>

            <View style={styles.statContent}>

              <Text style={styles.statNumber}>
                ₱50,000
              </Text>

              <Text style={styles.statLabel}>
                Total Earnings
              </Text>

            </View>

          </View>

          {/* ACTIVE WALLET */}

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
                name="wallet-outline"
                size={19}
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
                ₱10,000
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  styles.statLabelWhite,
                ]}
              >
                Active Wallet Balance
              </Text>

            </View>

          </View>

          {/* SAVED ON SPOILAGE */}

          <View style={styles.statCard}>

            <View style={styles.statIcon}>
              <Ionicons
                name="leaf-outline"
                size={19}
                color={Colors.primary}
              />
            </View>

            <View style={styles.statContent}>

              <Text style={styles.statNumber}>
                ₱1,000
              </Text>

              <Text style={styles.statLabel}>
                Saved on Spoilage
              </Text>

            </View>

          </View>

          {/* TRANSACTIONS */}

          <View
            style={[
              styles.statCard,
              styles.statCardGreenLight,
            ]}
          >

            <View
              style={[
                styles.statIcon,
                styles.statIconGreenLight,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={Colors.primary}
              />
            </View>

            <View style={styles.statContent}>

              <Text style={styles.statNumber}>
                428
              </Text>

              <Text style={styles.statLabel}>
                Transactions Completed
              </Text>

            </View>

          </View>

        </View>

        {/* =================================================
            MONTHLY EARNINGS
        ================================================= */}

        <View style={styles.chartCard}>

          <View style={styles.cardHeader}>

            <View>
              <Text style={styles.cardTitle}>
                Monthly Earnings Trend
              </Text>

              <Text style={styles.cardSubtitle}>
                Earnings performance
              </Text>
            </View>

            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>
                ₱50,000
              </Text>
            </View>

          </View>

          <View style={styles.chartArea}>

            {/* Y AXIS */}

            <View style={styles.yAxis}>

              <Text style={styles.axisText}>
                ₱125K
              </Text>

              <Text style={styles.axisText}>
                ₱100K
              </Text>

              <Text style={styles.axisText}>
                ₱75K
              </Text>

              <Text style={styles.axisText}>
                ₱50K
              </Text>

              <Text style={styles.axisText}>
                ₱25K
              </Text>

              <Text style={styles.axisText}>
                ₱0
              </Text>

            </View>

            {/* GRAPH */}

            <View style={styles.graphContainer}>

              {/* GRID LINES */}

              <View
                style={[
                  styles.gridLine,
                  { top: 5 },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: 32 },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: 59 },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: 86 },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: 113 },
                ]}
              />

              <View
                style={[
                  styles.gridLine,
                  { top: 140 },
                ]}
              />

              {/* BARS */}

              <View style={styles.bars}>

                <View
                  style={[
                    styles.bar,
                    { height: 23 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 30 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 38 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 45 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 43 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 51 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 65 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 72 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 80 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 88 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 101 },
                  ]}
                />

                <View
                  style={[
                    styles.bar,
                    { height: 112 },
                  ]}
                />

              </View>

              {/* X AXIS */}

              <View style={styles.xAxis}>

                <Text style={styles.axisText}>
                  May
                </Text>

                <Text style={styles.axisText}>
                  2
                </Text>

                <Text style={styles.axisText}>
                  4
                </Text>

                <Text style={styles.axisText}>
                  6
                </Text>

                <Text style={styles.axisText}>
                  8
                </Text>

                <Text style={styles.axisText}>
                  10
                </Text>

                <Text style={styles.axisText}>
                  12
                </Text>

                <Text style={styles.axisText}>
                  16
                </Text>

                <Text style={styles.axisText}>
                  18
                </Text>

                <Text style={styles.axisText}>
                  22
                </Text>

                <Text style={styles.axisText}>
                  24
                </Text>

                <Text style={styles.axisText}>
                  26
                </Text>

              </View>

            </View>

          </View>

          <Text style={styles.chartFooter}>
            Earnings over the selected period
          </Text>

        </View>

        {/* =================================================
            WALLET
        ================================================= */}

        <View style={styles.walletCard}>

          <View style={styles.walletHeader}>

            <View>

              <Text style={styles.cardTitle}>
                Active Wallet
              </Text>

              <Text style={styles.cardSubtitle}>
                Available for withdrawal
              </Text>

            </View>

            <View style={styles.walletIcon}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color={Colors.primary}
              />
            </View>

          </View>

          <View style={styles.walletBalance}>

            <Text style={styles.walletAmount}>
              ₱10,000.00
            </Text>

            <Text style={styles.walletLabel}>
              Active Wallet Balance
            </Text>

          </View>

          <TouchableOpacity
            style={styles.withdrawButton}
            activeOpacity={0.8}
          >

            <Ionicons
              name="arrow-up-circle-outline"
              size={18}
              color={Colors.white}
            />

            <Text style={styles.withdrawText}>
              Request Withdrawal
            </Text>

          </TouchableOpacity>

          {/* WITHDRAWAL HISTORY */}

          <Text style={styles.withdrawTitle}>
            Recent Withdrawal History
          </Text>

          <View style={styles.miniTable}>

            {/* HEADER */}

            <View style={styles.miniHeader}>

              <Text style={styles.miniHeaderText}>
                Trans ID
              </Text>

              <Text style={styles.miniHeaderText}>
                Amount
              </Text>

              <Text style={styles.miniHeaderText}>
                Status
              </Text>

            </View>

            {withdrawals.map((withdrawal) => (

              <View
                key={withdrawal.id}
                style={styles.miniRow}
              >

                <Text style={styles.miniText}>
                  {withdrawal.id}
                </Text>

                <Text style={styles.miniText}>
                  {withdrawal.amount}
                </Text>

                <View style={styles.miniStatus}>

                  <View style={styles.miniStatusDot} />

                  <Text style={styles.miniStatusText}>
                    {withdrawal.status}
                  </Text>

                </View>

              </View>

            ))}

          </View>

        </View>

        {/* =================================================
            TRANSACTION HISTORY
        ================================================= */}

        <View style={styles.transactionSection}>

          <View style={styles.transactionHeader}>

            <View>

              <Text style={styles.sectionTitle}>
                Transaction History
              </Text>

            </View>

          </View>

          {/* SEARCH */}

          <View style={styles.searchContainer}>

            <Ionicons
              name="search-outline"
              size={18}
              color={Colors.icon}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search transactions..."
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

          {/* TABLE */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
          >

            <View style={styles.transactionTable}>

              {/* TABLE HEADER */}

              <View style={styles.tableHeader}>

                <Text style={styles.tableHeaderText}>
                  Food Item
                </Text>

                <Text style={styles.tableHeaderText}>
                  Qty Sold
                </Text>

                <Text style={styles.tableHeaderText}>
                  Original Price
                </Text>

                <Text style={styles.tableHeaderText}>
                  Discounted Price
                </Text>

                <Text style={styles.tableHeaderText}>
                  Net Estab. Earning
                </Text>

                <Text style={styles.tableHeaderText}>
                  Total Earning
                </Text>

              </View>

              {/* TABLE ROWS */}

              {filteredTransactions.length > 0 ? (

                filteredTransactions.map(
                  (transaction, index) => (

                    <TransactionRow
                      key={`${transaction.food}-${index}`}
                      food={transaction.food}
                      qty={transaction.qty}
                      original={transaction.original}
                      discounted={transaction.discounted}
                      net={transaction.net}
                      total={transaction.total}
                    />

                  )
                )

              ) : (

                <View style={styles.noTransactions}>

                  <Ionicons
                    name="receipt-outline"
                    size={25}
                    color={Colors.primary}
                  />

                  <Text style={styles.noTransactionsTitle}>
                    No transactions found
                  </Text>

                  <Text style={styles.noTransactionsText}>
                    Try searching for another transaction.
                  </Text>

                </View>

              )}

            </View>

          </ScrollView>

        </View>

        <View style={{ height: 25 }} />

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
          icon="cash"
          label="Earnings"
          active
          onPress={() =>
            router.replace(
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
            router.replace(
              "/establishment/impact"
            )
          }
        />

      </View>

    </SafeAreaView>
  );
}

/* =====================================================
   TRANSACTION ROW
===================================================== */

function TransactionRow({
  food,
  qty,
  original,
  discounted,
  net,
  total,
}: {
  food: string;
  qty: string;
  original: string;
  discounted: string;
  net: string;
  total: string;
}) {

  return (

    <View style={styles.tableRow}>

      <Text style={styles.tableText}>
        {food}
      </Text>

      <Text style={styles.tableText}>
        {qty}
      </Text>

      <Text style={styles.tableText}>
        {original}
      </Text>

      <Text style={styles.tableText}>
        {discounted}
      </Text>

      <Text
        style={[
          styles.tableText,
          styles.netEarningText,
        ]}
      >
        {net}
      </Text>

      <Text
        style={[
          styles.tableText,
          styles.totalEarningText,
        ]}
      >
        {total}
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
    marginBottom: 18,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* ===================================================
     SECTION
  =================================================== */

  sectionHeader: {
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

  /* ===================================================
     STATISTICS
  =================================================== */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 17,
  },

  statCard: {
    width: "48.5%",

    minHeight: 76,

    borderRadius: 10,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 10,

    flexDirection: "row",
    alignItems: "center",
  },

  statCardGreen: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  statCardGreenLight: {
    backgroundColor: "#E7EEE9",
    borderColor: "#D5E3D9",
  },

  statIcon: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 8,
  },

  statIconGreen: {
    backgroundColor: Colors.button,
  },

  statIconGreenLight: {
    backgroundColor: Colors.white,
  },

  statContent: {
    flex: 1,
  },

  statNumber: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
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
     CHART
  =================================================== */

  chartCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 11,

    height: 230,

    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 6,
  },

  cardTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
  },

  cardSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  chartBadge: {
    backgroundColor: "#E7F0E9",

    borderRadius: 9,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  chartBadgeText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7,
    color: Colors.button,
  },

  chartArea: {
    flex: 1,
    flexDirection: "row",
  },

  yAxis: {
    width: 42,

    justifyContent: "space-between",

    paddingBottom: 18,
  },

  axisText: {
    fontFamily: "PoppinsRegular",
    fontSize: 6,
    color: Colors.primary1,
  },

  graphContainer: {
    flex: 1,

    position: "relative",

    marginLeft: 3,
  },

  gridLine: {
    position: "absolute",

    left: 0,
    right: 0,

    height: 1,

    backgroundColor: Colors.border,
  },

  bars: {
    position: "absolute",

    left: 3,
    right: 3,

    bottom: 18,

    height: 140,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-around",
  },

  bar: {
    width: 12,

    backgroundColor: Colors.button,

    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  xAxis: {
    position: "absolute",

    left: 0,
    right: 0,

    bottom: 0,

    height: 15,

    flexDirection: "row",

    justifyContent: "space-around",

    alignItems: "center",
  },

  chartFooter: {
    fontFamily: "PoppinsRegular",
    fontSize: 6.5,
    color: Colors.primary1,

    textAlign: "center",

    marginTop: 1,
  },

  /* ===================================================
     WALLET
  =================================================== */

  walletCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 11,

    marginBottom: 18,
  },

  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 8,
  },

  walletIcon: {
    width: 35,
    height: 35,

    borderRadius: 18,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",
  },

  walletBalance: {
    backgroundColor: "#E7F0E9",

    borderRadius: 8,

    alignItems: "center",

    paddingVertical: 10,

    marginBottom: 8,
  },

  walletAmount: {
    fontFamily: "PoppinsBold",
    fontSize: 20,
    color: Colors.primary2,
  },

  walletLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  withdrawButton: {
    minHeight: 38,

    backgroundColor: Colors.button,

    borderRadius: 7,

    alignItems: "center",
    justifyContent: "center",

    flexDirection: "row",

    gap: 5,

    marginBottom: 11,
  },

  withdrawText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.white,
  },

  withdrawTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary2,

    marginBottom: 6,
  },

  miniTable: {
    borderWidth: 1,

    borderColor: Colors.border,

    borderRadius: 6,

    overflow: "hidden",
  },

  miniHeader: {
    flexDirection: "row",

    backgroundColor: "#F7F9F7",

    paddingHorizontal: 7,
    paddingVertical: 6,
  },

  miniHeaderText: {
    flex: 1,

    fontFamily: "PoppinsMedium",

    fontSize: 6.5,

    color: Colors.primary2,

    textAlign: "center",
  },

  miniRow: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 7,
    paddingVertical: 7,

    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  miniText: {
    flex: 1,

    fontFamily: "PoppinsRegular",

    fontSize: 6.5,

    color: Colors.primary2,

    textAlign: "center",
  },

  miniStatus: {
    flex: 1,

    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",
  },

  miniStatusDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: Colors.button,

    marginRight: 3,
  },

  miniStatusText: {
    fontFamily: "PoppinsMedium",

    fontSize: 6.5,

    color: Colors.button,
  },

  /* ===================================================
     TRANSACTION
  =================================================== */

  transactionSection: {
    marginBottom: 10,
  },

  transactionHeader: {
    marginBottom: 9,
  },

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
     TRANSACTION TABLE
  =================================================== */

  transactionTable: {
    width: 730,

    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    overflow: "hidden",
  },

  tableHeader: {
    height: 42,

    backgroundColor: "#F7F9F7",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 8,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  tableHeaderText: {
    fontFamily: "PoppinsSemiBold",

    fontSize: 7.5,

    color: Colors.primary2,

    width: 120,

    textAlign: "center",
  },

  tableRow: {
    minHeight: 43,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 8,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,

    backgroundColor: Colors.white,
  },

  tableText: {
    fontFamily: "PoppinsRegular",

    fontSize: 7.5,

    color: Colors.primary2,

    width: 120,

    textAlign: "center",
  },

  netEarningText: {
    fontFamily: "PoppinsMedium",
    color: Colors.button,
  },

  totalEarningText: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  noTransactions: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical: 35,

    backgroundColor: Colors.white,
  },

  noTransactionsTitle: {
    fontFamily: "PoppinsSemiBold",

    fontSize: 11,

    color: Colors.primary2,

    marginTop: 8,
  },

  noTransactionsText: {
    fontFamily: "PoppinsRegular",

    fontSize: 8,

    color: Colors.primary1,

    marginTop: 2,
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

});