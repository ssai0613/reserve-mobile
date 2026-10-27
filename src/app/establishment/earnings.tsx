import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
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


const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function EstablishmentEarnings() {
  const [merchantId, setMerchantId] = useState("1");
  const [search, setSearch] = useState("");

  const [totalEarnings, setTotalEarnings] = useState("₱0.00");
  const [walletBalance, setWalletBalance] = useState("₱0.00");
  const [savedSpoilage, setSavedSpoilage] = useState("₱0.00");
  const [txCompletedCount, setTxCompletedCount] = useState("0");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      setMerchantId(storedId);
      const res = await api.get(`listings/merchant-portal/${storedId}/`);
      const e = res.data.earnings;
      if (e) {
        setTotalEarnings(e.total_earnings || "₱0.00");
        setWalletBalance(e.wallet_balance || "₱0.00");
        setSavedSpoilage(e.saved_on_spoilage || "₱0.00");
        setTxCompletedCount(String(e.transactions_completed ?? 0));
        setTransactions(e.transactions || []);
        setWithdrawals(e.withdrawals || []);
      }
    } catch (err) {
      console.log("Earnings fetch error:", err);
    }
  };

  const handleRequestWithdrawal = async () => {
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "request_withdrawal",
      });
      alert(res.data.message || "Withdrawal requested!");
      await loadEarnings();
    } catch (e: any) {
      alert(e.response?.data?.error || "Unable to request withdrawal.");
    }
  };

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
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <EstablishmentHeader />

      {/* MAIN CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Earnings Analytics</Text>
          <Text style={styles.pageSubtitle}>Track revenue, wallet balances, and payout history</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalEarnings}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={[styles.statIcon, styles.statIconGreen]}>
              <Ionicons name="wallet-outline" size={20} color={Colors.white} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, styles.statNumberWhite]}>{walletBalance}</Text>
              <Text style={[styles.statLabel, styles.statLabelWhite]}>Active Wallet Balance</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{savedSpoilage}</Text>
              <Text style={styles.statLabel}>Saved on Spoilage</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardGreenLight]}>
            <View style={[styles.statIcon, styles.statIconGreenLight]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{txCompletedCount}</Text>
              <Text style={styles.statLabel}>Transactions Completed</Text>
            </View>
          </View>
        </View>

        {/* MONTHLY EARNINGS */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Monthly Earnings Trend</Text>
              <Text style={styles.cardSubtitle}>Earnings performance</Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>{totalEarnings}</Text>
            </View>
          </View>

          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>₱100K</Text>
              <Text style={styles.axisText}>₱75K</Text>
              <Text style={styles.axisText}>₱50K</Text>
              <Text style={styles.axisText}>₱25K</Text>
              <Text style={styles.axisText}>₱0</Text>
            </View>

            <View style={styles.graphContainer}>
              <View style={[styles.gridLine, { top: 5 }]} />
              <View style={[styles.gridLine, { top: 38 }]} />
              <View style={[styles.gridLine, { top: 72 }]} />
              <View style={[styles.gridLine, { top: 106 }]} />
              <View style={[styles.gridLine, { top: 140 }]} />

              <View style={styles.bars}>
                {[28, 36, 44, 52, 60, 74, 82, 95, 108, 118].map((h, i) => (
                  <View key={i} style={[styles.bar, { height: h }]} />
                ))}
              </View>

              <View style={styles.xAxis}>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                  <Text key={m} style={styles.axisText}>{m}</Text>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.chartFooter}>Earnings over the selected period</Text>
        </View>

        {/* WALLET */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.cardTitle}>Active Wallet</Text>
              <Text style={styles.cardSubtitle}>Available for withdrawal</Text>
            </View>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.walletBalance}>
            <Text style={styles.walletAmount}>{walletBalance}</Text>
            <Text style={styles.walletLabel}>Active Wallet Balance</Text>
          </View>

          <TouchableOpacity
            style={styles.withdrawButton}
            activeOpacity={0.8}
            onPress={handleRequestWithdrawal}
          >
            <Ionicons name="arrow-up-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.withdrawText}>Request Withdrawal</Text>
          </TouchableOpacity>

          <Text style={styles.withdrawTitle}>Recent Withdrawal History</Text>
          <View style={styles.miniTable}>
            <View style={styles.miniHeader}>
              <Text style={styles.miniHeaderText}>Trans ID</Text>
              <Text style={styles.miniHeaderText}>Amount</Text>
              <Text style={styles.miniHeaderText}>Status</Text>
            </View>

            {withdrawals.length > 0 ? (
              withdrawals.map((withdrawal) => (
                <View key={withdrawal.id} style={styles.miniRow}>
                  <Text style={styles.miniText}>{withdrawal.id}</Text>
                  <Text style={styles.miniText}>{withdrawal.amount}</Text>
                  <View style={styles.miniStatus}>
                    <View style={styles.miniStatusDot} />
                    <Text style={styles.miniStatusText}>{withdrawal.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.miniRow}>
                <Text style={[styles.miniText, { flex: 3 }]}>No withdrawals requested yet.</Text>
              </View>
            )}
          </View>
        </View>

        {/* TRANSACTION HISTORY */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={Colors.icon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search transactions..."
              placeholderTextColor={Colors.placeholder}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={Colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.transactionTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Food Item</Text>
                <Text style={styles.tableHeaderText}>Qty Sold</Text>
                <Text style={styles.tableHeaderText}>Original Price</Text>
                <Text style={styles.tableHeaderText}>Discounted Price</Text>
                <Text style={styles.tableHeaderText}>Net Estab. Earning</Text>
                <Text style={styles.tableHeaderText}>Total Earning</Text>
              </View>

              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => (
                  <TransactionRow
                    key={`${transaction.food}-${index}`}
                    food={transaction.food}
                    qty={transaction.qty}
                    original={transaction.original}
                    discounted={transaction.discounted}
                    net={transaction.net}
                    total={transaction.total}
                  />
                ))
              ) : (
                <View style={styles.noTransactions}>
                  <Ionicons name="receipt-outline" size={26} color={Colors.primary} />
                  <Text style={styles.noTransactionsTitle}>No transactions found</Text>
                  <Text style={styles.noTransactionsText}>Completed order pickups will appear here.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <EstablishmentBottomNav activeTab="Earnings" />
    </SafeAreaView>
  );
}

function TransactionRow({ food, qty, original, discounted, net, total }: { food: string; qty: string; original: string; discounted: string; net: string; total: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableText}>{food}</Text>
      <Text style={styles.tableText}>{qty}</Text>
      <Text style={styles.tableText}>{original}</Text>
      <Text style={styles.tableText}>{discounted}</Text>
      <Text style={[styles.tableText, styles.netEarningText]}>{net}</Text>
      <Text style={[styles.tableText, styles.totalEarningText]}>{total}</Text>
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
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "48.5%", minHeight: 85, borderRadius: 14, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, padding: 14, flexDirection: "row", alignItems: "center" },
  statCardGreen: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statCardGreenLight: { backgroundColor: "#E7EEE9", borderColor: "#D5E3D9" },
  statIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 11 },
  statIconGreen: { backgroundColor: Colors.button },
  statIconGreenLight: { backgroundColor: Colors.white },
  statContent: { flex: 1 },
  statNumber: { fontFamily: "PoppinsBold", fontSize: 18, color: Colors.primary2, lineHeight: 24 },
  statNumberWhite: { color: Colors.white },
  statLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  statLabelWhite: { color: "rgba(255,255,255,0.8)" },
  chartCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, height: 245, marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2 },
  cardSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  chartBadge: { backgroundColor: "#E7F0E9", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  chartBadgeText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.button },
  chartArea: { flex: 1, flexDirection: "row" },
  yAxis: { width: 48, justifyContent: "space-between", paddingBottom: 20 },
  axisText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  graphContainer: { flex: 1, position: "relative", marginLeft: 4 },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: Colors.border },
  bars: { position: "absolute", left: 4, right: 4, bottom: 20, height: 145, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" },
  bar: { width: 14, backgroundColor: Colors.button, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  xAxis: { position: "absolute", left: 0, right: 0, bottom: 0, height: 18, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  chartFooter: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, textAlign: "center", marginTop: 4 },
  walletCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 22 },
  walletHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  walletIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center" },
  walletBalance: { backgroundColor: "#E7F0E9", borderRadius: 12, alignItems: "center", paddingVertical: 14, marginBottom: 12 },
  walletAmount: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  walletLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 2 },
  withdrawButton: { minHeight: 45, backgroundColor: Colors.button, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginBottom: 16 },
  withdrawText: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.white },
  withdrawTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2, marginBottom: 8 },
  miniTable: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: "hidden" },
  miniHeader: { flexDirection: "row", backgroundColor: "#F7F9F7", paddingHorizontal: 10, paddingVertical: 9 },
  miniHeaderText: { flex: 1, fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2, textAlign: "center" },
  miniRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  miniText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, textAlign: "center" },
  miniStatus: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  miniStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.button, marginRight: 5 },
  miniStatusText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.button },
  transactionSection: { marginBottom: 12 },
  transactionHeader: { marginBottom: 10 },
  searchContainer: { minHeight: 45, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  transactionTable: { width: 820, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  tableHeader: { height: 42, backgroundColor: "#F7F9F7", flexDirection: "row", alignItems: "center", paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHeaderText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, width: 135, textAlign: "center" },
  tableRow: { minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  tableText: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, width: 135, textAlign: "center" },
  netEarningText: { fontFamily: "PoppinsMedium", color: Colors.button },
  totalEarningText: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  noTransactions: { alignItems: "center", justifyContent: "center", paddingVertical: 45, backgroundColor: Colors.white },
  noTransactionsTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginTop: 10 },
  noTransactionsText: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 3 },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, paddingBottom: 25, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 10, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 5, marginHorizontal: 2, borderRadius: 7 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.icon, marginTop: 4 },
  navTextActive: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary },
});