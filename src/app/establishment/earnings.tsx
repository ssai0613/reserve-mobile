import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
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
import {
  EstablishmentBottomNav,
  EstablishmentHeader,
} from "../components/EstablishmentNav";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function EstablishmentEarnings() {
  const [merchantId, setMerchantId] = useState("1");
  const [planId, setPlanId] = useState<number>(1);
  const [defaultPhone, setDefaultPhone] = useState("");
  const [defaultContact, setDefaultContact] = useState("");
  const [search, setSearch] = useState("");

  const [totalEarnings, setTotalEarnings] = useState("₱0.00");
  const [walletBalance, setWalletBalance] = useState("₱0.00");
  const [rawWalletBal, setRawWalletBal] = useState<number>(0);
  const [savedSpoilage, setSavedSpoilage] = useState("₱0.00");
  const [txCompletedCount, setTxCompletedCount] = useState("0");
  const [monthlyEarnings, setMonthlyEarnings] = useState<
    { month: string; amount: number }[]
  >([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Request Withdrawal Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawChannel, setWithdrawChannel] = useState<"GCash" | "Maya">(
    "GCash"
  );
  const [withdrawAcctName, setWithdrawAcctName] = useState("");
  const [withdrawAcctNum, setWithdrawAcctNum] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Clickable Row Detail Modals
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(
    null
  );
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(
    null
  );

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
  ) => setModalAlert({ visible: true, title, message, type });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      setMerchantId(storedId);
      const res = await api.get(
        `listings/merchant-portal/${storedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );
      const p = res.data.profile;
      const e = res.data.earnings;
      if (p) {
        setPlanId(Number(p.plan_id || 1));
        setDefaultPhone(p.phone !== "Not Provided" ? p.phone : "");
        setDefaultContact(p.contact_person || p.bus_name || "");
      }
      if (e) {
        setTotalEarnings(e.total_earnings || "₱0.00");
        setWalletBalance(e.wallet_balance || "₱0.00");
        setRawWalletBal(Number(e.raw_wallet_balance || 0));
        setSavedSpoilage(e.saved_on_spoilage || "₱0.00");
        setTxCompletedCount(String(e.transactions_completed ?? 0));
        setMonthlyEarnings(
          Array.isArray(e.monthly_earnings) && e.monthly_earnings.length > 0
            ? e.monthly_earnings
            : [
                { month: "Jun", amount: 0 },
                { month: "Jul", amount: 0 },
                { month: "Aug", amount: 0 },
                { month: "Sep", amount: 0 },
                { month: "Oct", amount: 0 },
                { month: "Nov", amount: Number(e.raw_total_earnings || 0) },
              ]
        );
        setTransactions(e.transactions || []);
        setWithdrawals(e.withdrawals || []);
      }
    } catch (err) {
      console.log("Earnings fetch error:", err);
    }
  };

  const openWithdrawModal = () => {
    setWithdrawChannel("GCash");
    setWithdrawAcctName(defaultContact);
    setWithdrawAcctNum(defaultPhone);
    setWithdrawAmount(rawWalletBal > 0 ? String(rawWalletBal) : "");
    setWithdrawModalOpen(true);
  };

  const handleSubmitWithdrawal = async () => {
    const amtNum = parseFloat(withdrawAmount || "0");
    if (!amtNum || amtNum <= 0) {
      showModal(
        "Invalid Amount",
        "Please enter a withdrawal amount greater than ₱0.00.",
        "warning"
      );
      return;
    }
    if (amtNum > rawWalletBal) {
      showModal(
        "Insufficient Wallet Balance",
        `Your requested amount (₱${amtNum.toFixed(
          2
        )}) exceeds your active wallet balance (${walletBalance}).`,
        "error"
      );
      return;
    }
    if (!withdrawAcctName.trim() || !withdrawAcctNum.trim()) {
      showModal(
        "Missing E-Wallet Info",
        `Please enter both your ${withdrawChannel} account name and account number.`,
        "warning"
      );
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await api.post(`listings/merchant-portal/${merchantId}/`, {
        action: "request_withdrawal",
        channel: withdrawChannel,
        account_name: withdrawAcctName.trim(),
        account_number: withdrawAcctNum.trim(),
        amount: amtNum,
      });
      setWithdrawModalOpen(false);
      await loadEarnings();
      showModal(
        "Withdrawal Requested!",
        res.data?.message || "Your withdrawal request has been sent to Admin.",
        "success"
      );
    } catch (e: any) {
      showModal(
        "Withdrawal Failed",
        e.response?.data?.error || "Unable to request withdrawal.",
        "error"
      );
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchValue = search.toLowerCase();
    return (
      (transaction.food || "").toLowerCase().includes(searchValue) ||
      (transaction.id || "").toLowerCase().includes(searchValue) ||
      (transaction.customer || "").toLowerCase().includes(searchValue) ||
      (transaction.total || "").toLowerCase().includes(searchValue)
    );
  });

  const maxChartAmount = Math.max(
    500,
    ...monthlyEarnings.map((m) => Number(m.amount || 0))
  );

  const parsedWithdrawAmt = parseFloat(withdrawAmount || "0") || 0;
  const withdrawFee = planId === 2 ? 0 : parsedWithdrawAmt * 0.1;
  const withdrawNet = Math.max(0, parsedWithdrawAmt - withdrawFee);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      <EstablishmentHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Earnings Analytics</Text>
          <Text style={styles.pageSubtitle}>
            Track revenue, wallet balances, and tap any row to view full summaries
          </Text>
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
              <Text style={[styles.statNumber, styles.statNumberWhite]}>
                {walletBalance}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelWhite]}>
                Active Wallet Balance
              </Text>
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
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{txCompletedCount}</Text>
              <Text style={styles.statLabel}>Transactions Completed</Text>
            </View>
          </View>
        </View>

        {/* DYNAMIC MONTHLY EARNINGS CHART */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Monthly Earnings Trend</Text>
              <Text style={styles.cardSubtitle}>
                Live database revenue performance
              </Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>{totalEarnings}</Text>
            </View>
          </View>

          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>₱{Math.round(maxChartAmount)}</Text>
              <Text style={styles.axisText}>
                ₱{Math.round(maxChartAmount * 0.75)}
              </Text>
              <Text style={styles.axisText}>
                ₱{Math.round(maxChartAmount * 0.5)}
              </Text>
              <Text style={styles.axisText}>
                ₱{Math.round(maxChartAmount * 0.25)}
              </Text>
              <Text style={styles.axisText}>₱0</Text>
            </View>

            <View style={styles.graphContainer}>
              <View style={[styles.gridLine, { top: 5 }]} />
              <View style={[styles.gridLine, { top: 38 }]} />
              <View style={[styles.gridLine, { top: 72 }]} />
              <View style={[styles.gridLine, { top: 106 }]} />
              <View style={[styles.gridLine, { top: 140 }]} />

              <View style={styles.bars}>
                {monthlyEarnings.map((m, i) => {
                  const barH = Math.max(
                    8,
                    Math.min(130, (Number(m.amount || 0) / maxChartAmount) * 130)
                  );
                  return (
                    <View
                      key={`${m.month}-${i}`}
                      style={[
                        styles.bar,
                        {
                          height: barH,
                          backgroundColor:
                            Number(m.amount) > 0 ? Colors.button : "#CBD5E1",
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.xAxis}>
                {monthlyEarnings.map((m, i) => (
                  <Text key={`${m.month}-lbl-${i}`} style={styles.axisText}>
                    {m.month}
                  </Text>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.chartFooter}>
            Net merchant earnings across completed rescues
          </Text>
        </View>

        {/* ACTIVE WALLET & CLICKABLE WITHDRAWALS TABLE */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.cardTitle}>Active Wallet</Text>
              <Text style={styles.cardSubtitle}>
                {planId === 2
                  ? "Pro Tier: 0% Commission on Withdrawals"
                  : "Free Tier: 10% Platform Fee Deducted on Withdrawals"}
              </Text>
            </View>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.walletBalance}>
            <Text style={styles.walletAmount}>{walletBalance}</Text>
            <Text style={styles.walletLabel}>Available for Disbursement</Text>
          </View>

          <TouchableOpacity
            style={styles.withdrawButton}
            activeOpacity={0.8}
            onPress={openWithdrawModal}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={18}
              color={Colors.white}
            />
            <Text style={styles.withdrawText}>Request Withdrawal</Text>
          </TouchableOpacity>

          <Text style={styles.withdrawTitle}>
            Requested Withdrawals (Tap a row to view full summary)
          </Text>
          <View style={styles.miniTable}>
            <View style={styles.miniHeader}>
              <Text style={styles.miniHeaderText}>Req ID</Text>
              <Text style={styles.miniHeaderText}>Channel</Text>
              <Text style={styles.miniHeaderText}>Net Payout</Text>
              <Text style={styles.miniHeaderText}>Status</Text>
              <Text style={styles.miniHeaderText}>Action</Text>
            </View>

            {withdrawals.length > 0 ? (
              withdrawals.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.miniRow}
                  activeOpacity={0.75}
                  onPress={() => setSelectedWithdrawal(w)}
                >
                  <Text style={[styles.miniText, { fontFamily: "PoppinsSemiBold" }]}>
                    {w.id}
                  </Text>
                  <Text style={styles.miniText}>{w.channel || "GCash"}</Text>
                  <Text style={[styles.miniText, { color: Colors.primary, fontFamily: "PoppinsSemiBold" }]}>
                    {w.net_payout || w.amount}
                  </Text>
                  <View style={styles.miniStatus}>
                    <View
                      style={[
                        styles.miniStatusDot,
                        w.status === "Pending" && { backgroundColor: "#D97706" },
                        w.status === "Rejected" && { backgroundColor: "#B3261E" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.miniStatusText,
                        w.status === "Pending" && { color: "#D97706" },
                        w.status === "Rejected" && { color: "#B3261E" },
                      ]}
                    >
                      {w.status}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Ionicons name="eye-outline" size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.miniRow}>
                <Text style={[styles.miniText, { flex: 5 }]}>
                  No withdrawals requested yet.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* CLICKABLE TRANSACTION HISTORY TABLE */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.cardSubtitle}>
              Tap any transaction row to inspect its full breakdown
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={Colors.icon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search voucher ID, food item, or buyer..."
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
                <Text style={styles.tableHeaderText}>Order ID</Text>
                <Text style={styles.tableHeaderText}>Food Item(s)</Text>
                <Text style={styles.tableHeaderText}>Qty Sold</Text>
                <Text style={styles.tableHeaderText}>Discounted</Text>
                <Text style={styles.tableHeaderText}>Net Earning</Text>
                <Text style={styles.tableHeaderText}>Action</Text>
              </View>

              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, index) => (
                  <TouchableOpacity
                    key={`${tx.id || tx.food}-${index}`}
                    style={styles.tableRow}
                    activeOpacity={0.75}
                    onPress={() => setSelectedTransaction(tx)}
                  >
                    <Text style={[styles.tableText, { fontFamily: "PoppinsSemiBold", color: Colors.primary }]}>
                      {tx.id || `TX-${index + 1}`}
                    </Text>
                    <Text style={styles.tableText} numberOfLines={1}>
                      {tx.food}
                    </Text>
                    <Text style={styles.tableText}>{tx.qty}</Text>
                    <Text style={styles.tableText}>{tx.discounted}</Text>
                    <Text style={[styles.tableText, styles.totalEarningText]}>
                      {tx.total}
                    </Text>
                    <View style={{ width: 135, alignItems: "center" }}>
                      <View style={styles.viewPillBtn}>
                        <Ionicons name="eye-outline" size={14} color={Colors.white} />
                        <Text style={styles.viewPillBtnText}>View</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noTransactions}>
                  <Ionicons
                    name="receipt-outline"
                    size={26}
                    color={Colors.primary}
                  />
                  <Text style={styles.noTransactionsTitle}>
                    No transactions found
                  </Text>
                  <Text style={styles.noTransactionsText}>
                    Completed order pickups will appear here.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>

      {/* REQUEST WITHDRAWAL MODAL (GCASH / MAYA + ACCOUNT NAME & NUMBER + AMOUNT + 10% FEE) */}
      <Modal
        visible={withdrawModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={styles.modalTitle}>Request Wallet Withdrawal</Text>
              <TouchableOpacity onPress={() => setWithdrawModalOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardSubtitle}>
              Available Wallet Balance:{" "}
              <Text style={{ fontFamily: "PoppinsBold", color: Colors.primary }}>
                {walletBalance}
              </Text>
            </Text>

            <Text style={styles.inputLabel}>Preferred E-Wallet for Disbursement *</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
              {(["GCash", "Maya"] as const).map((ch) => {
                const active = withdrawChannel === ch;
                return (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.channelBtn,
                      active && styles.channelBtnActive,
                    ]}
                    onPress={() => setWithdrawChannel(ch)}
                  >
                    <Ionicons
                      name={ch === "GCash" ? "wallet-outline" : "card-outline"}
                      size={16}
                      color={active ? Colors.white : Colors.primary2}
                    />
                    <Text
                      style={[
                        styles.channelBtnText,
                        active && { color: Colors.white, fontFamily: "PoppinsSemiBold" },
                      ]}
                    >
                      {ch}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Registered Account Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={withdrawAcctName}
              onChangeText={setWithdrawAcctName}
              placeholder="e.g. Juan Dela Cruz"
              placeholderTextColor={Colors.placeholder}
            />

            <Text style={styles.inputLabel}>{withdrawChannel} Account Number *</Text>
            <TextInput
              style={styles.modalInput}
              value={withdrawAcctNum}
              onChangeText={setWithdrawAcctNum}
              keyboardType="phone-pad"
              placeholder="e.g. 09171234567"
              placeholderTextColor={Colors.placeholder}
            />

            <Text style={styles.inputLabel}>Amount to Withdraw (₱) *</Text>
            <TextInput
              style={styles.modalInput}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="e.g. 250.00"
              placeholderTextColor={Colors.placeholder}
            />

            <View style={styles.breakdownBox}>
              <SummaryLine
                label="Requested Withdrawal"
                value={`₱${parsedWithdrawAmt.toFixed(2)}`}
              />
              <SummaryLine
                label={
                  planId === 2
                    ? "Pro Tier Platform Fee (0%)"
                    : "Free Tier Deduction (10%)"
                }
                value={`-₱${withdrawFee.toFixed(2)}`}
                valueColor="#B3261E"
              />
              <View style={styles.breakdownDivider} />
              <SummaryLine
                label={`Net Disbursement to ${withdrawChannel}`}
                value={`₱${withdrawNet.toFixed(2)}`}
                bold
                valueColor={Colors.primary}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setWithdrawModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitWithdrawal}
                disabled={submittingWithdraw}
              >
                <Text style={styles.modalSubmitText}>
                  {submittingWithdraw ? "Submitting..." : "Submit Withdrawal"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VIEW WITHDRAWAL SUMMARY MODAL */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Withdrawal Request Summary ({selectedWithdrawal?.id})
            </Text>
            {selectedWithdrawal && (
              <View style={{ gap: 8, marginTop: 8 }}>
                <SummaryLine label="Status" value={selectedWithdrawal.status} bold />
                <SummaryLine label="Disbursement E-Wallet" value={selectedWithdrawal.channel || "GCash"} />
                <SummaryLine label="Account Name" value={selectedWithdrawal.account_name || defaultContact} />
                <SummaryLine label="Account Number" value={selectedWithdrawal.account_number || defaultPhone} />
                <SummaryLine label="Requested Gross Amount" value={selectedWithdrawal.amount} />
                <SummaryLine label="Platform Fee Deducted" value={selectedWithdrawal.fee_deducted || "₱0.00"} valueColor="#B3261E" />
                <SummaryLine label="Net Payout Amount" value={selectedWithdrawal.net_payout || selectedWithdrawal.amount} bold valueColor={Colors.primary} />
                <SummaryLine
                  label="Official Transfer Ref #"
                  value={selectedWithdrawal.reference_number || "Pending Admin Transfer"}
                  bold
                />
                <SummaryLine label="Date Requested" value={selectedWithdrawal.created_at || "Recent"} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { flex: 0, marginTop: 18 }]}
              onPress={() => setSelectedWithdrawal(null)}
            >
              <Text style={styles.modalSubmitText}>Close Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VIEW TRANSACTION SUMMARY MODAL */}
      <Modal
        visible={!!selectedTransaction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Transaction Summary ({selectedTransaction?.id || "Order"})
            </Text>
            {selectedTransaction && (
              <View style={{ gap: 8, marginTop: 8 }}>
                <SummaryLine label="Customer" value={selectedTransaction.customer || "Verified Consumer"} />
                <SummaryLine label="Date Completed" value={selectedTransaction.date || "Recent"} />
                <SummaryLine label="Food Item(s)" value={selectedTransaction.food} bold />
                <SummaryLine label="Quantity Sold" value={selectedTransaction.qty} />
                <SummaryLine label="Original Retail Value" value={selectedTransaction.original} />
                <SummaryLine label="Discounted Sale Total" value={selectedTransaction.discounted} />
                {selectedTransaction.deposit_paid && (
                  <SummaryLine label="10% Online Deposit Credited" value={selectedTransaction.deposit_paid} />
                )}
                {selectedTransaction.cash_collected && (
                  <SummaryLine label="90% Cash Collected at Pickup" value={selectedTransaction.cash_collected} />
                )}
                <View style={styles.breakdownDivider} />
                <SummaryLine
                  label="Net Establishment Earning"
                  value={selectedTransaction.total}
                  bold
                  valueColor={Colors.primary}
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { flex: 0, marginTop: 18 }]}
              onPress={() => setSelectedTransaction(null)}
            >
              <Text style={styles.modalSubmitText}>Close Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((p) => ({ ...p, visible: false }))}
      />

      <EstablishmentBottomNav activeTab="Earnings" />
    </SafeAreaView>
  );
}

function SummaryLine({
  label,
  value,
  bold = false,
  valueColor = Colors.primary2,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontFamily: bold ? "PoppinsBold" : "PoppinsRegular", fontSize: 11.5, color: Colors.primary1 }}>
        {label}:
      </Text>
      <Text
        style={{
          fontFamily: bold ? "PoppinsBold" : "PoppinsSemiBold",
          fontSize: bold ? 12.5 : 11.5,
          color: valueColor,
          maxWidth: "58%",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  yAxis: { width: 52, justifyContent: "space-between", paddingBottom: 20 },
  axisText: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1 },
  graphContainer: { flex: 1, position: "relative", marginLeft: 4 },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: Colors.border },
  bars: { position: "absolute", left: 4, right: 4, bottom: 20, height: 145, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" },
  bar: { width: 22, backgroundColor: Colors.button, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
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
  withdrawTitle: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2, marginBottom: 8 },
  miniTable: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: "hidden" },
  miniHeader: { flexDirection: "row", backgroundColor: "#F7F9F7", paddingHorizontal: 8, paddingVertical: 9 },
  miniHeaderText: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.primary2, textAlign: "center" },
  miniRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 11, borderTopWidth: 1, borderTopColor: Colors.border },
  miniText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary2, textAlign: "center" },
  miniStatus: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  miniStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.button, marginRight: 4 },
  miniStatusText: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.button },
  transactionSection: { marginBottom: 12 },
  transactionHeader: { marginBottom: 10 },
  searchContainer: { minHeight: 45, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, marginLeft: 8, paddingVertical: 8 },
  transactionTable: { width: 820, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  tableHeader: { height: 42, backgroundColor: "#F7F9F7", flexDirection: "row", alignItems: "center", paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHeaderText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, width: 135, textAlign: "center" },
  tableRow: { minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  tableText: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary2, width: 135, textAlign: "center" },
  totalEarningText: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  viewPillBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  viewPillBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, color: Colors.white },
  noTransactions: { alignItems: "center", justifyContent: "center", paddingVertical: 45, backgroundColor: Colors.white },
  noTransactionsTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, marginTop: 10 },
  noTransactionsText: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: Colors.white, borderRadius: 18, padding: 20 },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary2 },
  inputLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginTop: 10, marginBottom: 4 },
  modalInput: { height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, fontFamily: "PoppinsRegular", fontSize: 12.5, color: Colors.primary2, backgroundColor: Colors.input },
  channelBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.input, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  channelBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  channelBtnText: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  breakdownBox: { backgroundColor: "#F2F7F4", borderRadius: 12, padding: 12, marginTop: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  breakdownDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary1 },
  modalSubmitBtn: { flex: 1.3, height: 44, borderRadius: 10, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  modalSubmitText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.white },
});