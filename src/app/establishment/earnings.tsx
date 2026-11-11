import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
  useIsInsideMerchantShell,
} from "../components/EstablishmentNav";

type MonthlyEarning = {
  month: string;
  amount: number;
};

type TransactionItem = {
  id: string;
  customer: string;
  date: string;
  food: string;
  qty: string;
  original: string;
  discounted: string;
  deposit_paid: string;
  cash_collected: string;
  commission_fee: string;
  net: string;
  total: string;
  items_breakdown?: {
    food_name: string;
    qty: number;
    unit: string;
    unit_price: string;
    subtotal: string;
  }[];
};

type WithdrawalItem = {
  id: string;
  withdrawal_id: number;
  amount: string;
  raw_amount: number;
  fee_deducted: string;
  net_payout: string;
  channel: string;
  account_number: string;
  account_name: string;
  reference_number: string;
  status: string;
  created_at: string;
  processed_at: string;
};

const getRollingSixMonths = (): MonthlyEarning[] => {
  const result: MonthlyEarning[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      amount: 0,
    });
  }
  return result;
};

let cachedEarningsMemory = {
  totalEarnings: "₱0.00",
  rawTotalEarnings: 0,
  walletBalance: "₱0.00",
  rawWalletBalance: 0,
  savedOnSpoilage: "₱0.00",
  transactionsCompleted: 0,
  monthlyEarnings: getRollingSixMonths(),
  transactions: [] as TransactionItem[],
  withdrawals: [] as WithdrawalItem[],
  planId: 1,
  commissionPct: 10,
  defaultPhone: "",
  defaultAccountName: "",
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function EstablishmentEarnings() {
  const isInsideShell = useIsInsideMerchantShell();
  if (!isInsideShell) return null;

  const [merchantId, setMerchantId] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(
    cachedEarningsMemory.totalEarnings
  );
  const [walletBalance, setWalletBalance] = useState(
    cachedEarningsMemory.walletBalance
  );
  const [rawWalletBalance, setRawWalletBalance] = useState(
    cachedEarningsMemory.rawWalletBalance
  );
  const [savedOnSpoilage, setSavedOnSpoilage] = useState(
    cachedEarningsMemory.savedOnSpoilage
  );
  const [transactionsCompleted, setTransactionsCompleted] = useState(
    cachedEarningsMemory.transactionsCompleted
  );
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>(
    cachedEarningsMemory.monthlyEarnings
  );
  const [transactions, setTransactions] = useState<TransactionItem[]>(
    cachedEarningsMemory.transactions
  );
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>(
    cachedEarningsMemory.withdrawals
  );

  const [planId, setPlanId] = useState(cachedEarningsMemory.planId);
  const [commissionPct, setCommissionPct] = useState(
    cachedEarningsMemory.commissionPct
  );

  const [activeHistoryTab, setActiveHistoryTab] = useState<
    "transactions" | "withdrawals"
  >("transactions");
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Automated Xendit Withdrawal Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawChannel, setWithdrawChannel] = useState<"GCash" | "Maya">(
    "GCash"
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState(
    cachedEarningsMemory.defaultPhone
  );
  const [accountName, setAccountName] = useState(
    cachedEarningsMemory.defaultAccountName
  );
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

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

  const loadEarningsData = useCallback(async () => {
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

      const e = res.data?.earnings;
      const p = res.data?.profile;

      if (e) {
        const nextMonthly =
          Array.isArray(e.monthly_earnings) && e.monthly_earnings.length > 0
            ? e.monthly_earnings.slice(-6)
            : getRollingSixMonths();

        const nextPhone =
          p?.phone && p.phone !== "Not Provided" ? String(p.phone) : "";
        const nextAccName = p?.contact_person || p?.bus_name || "";

        cachedEarningsMemory = {
          totalEarnings: e.total_earnings || "₱0.00",
          rawTotalEarnings: Number(e.raw_total_earnings || 0),
          walletBalance: e.wallet_balance || "₱0.00",
          rawWalletBalance: Number(e.raw_wallet_balance || 0),
          savedOnSpoilage: e.saved_on_spoilage || "₱0.00",
          transactionsCompleted: Number(e.transactions_completed || 0),
          monthlyEarnings: nextMonthly,
          transactions: Array.isArray(e.transactions) ? e.transactions : [],
          withdrawals: Array.isArray(e.withdrawals) ? e.withdrawals : [],
          planId: Number(p?.plan_id || 1),
          commissionPct:
            p?.commission_pct !== undefined ? Number(p.commission_pct) : 10,
          defaultPhone: nextPhone,
          defaultAccountName: nextAccName,
        };

        setTotalEarnings(cachedEarningsMemory.totalEarnings);
        setWalletBalance(cachedEarningsMemory.walletBalance);
        setRawWalletBalance(cachedEarningsMemory.rawWalletBalance);
        setSavedOnSpoilage(cachedEarningsMemory.savedOnSpoilage);
        setTransactionsCompleted(cachedEarningsMemory.transactionsCompleted);
        setMonthlyEarnings(cachedEarningsMemory.monthlyEarnings);
        setTransactions(cachedEarningsMemory.transactions);
        setWithdrawals(cachedEarningsMemory.withdrawals);
        setPlanId(cachedEarningsMemory.planId);
        setCommissionPct(cachedEarningsMemory.commissionPct);

        if (!accountNumber && nextPhone) setAccountNumber(nextPhone);
        if (!accountName && nextAccName) setAccountName(nextAccName);
      }
    } catch (err) {
      console.log("Error loading merchant earnings:", err);
    }
  }, [accountName, accountNumber]);

  useEffect(() => {
    loadEarningsData();

    const ordSub = DeviceEventEmitter.addListener(
      "merchant_orders_updated",
      () => {
        loadEarningsData();
      }
    );
    const profSub = DeviceEventEmitter.addListener(
      "merchant_profile_updated",
      () => {
        loadEarningsData();
      }
    );

    return () => {
      ordSub.remove();
      profSub.remove();
    };
  }, [loadEarningsData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const openWithdrawModal = () => {
    if (rawWalletBalance <= 100) {
      showModal(
        "Minimum Balance Required (> ₱100.00)",
        `Your active wallet balance is currently ${walletBalance}. You can only request a Xendit payout when your requested withdrawal amount is strictly greater than ₱100.00.`,
        "warning"
      );
      return;
    }
    setWithdrawAmount(rawWalletBalance.toFixed(2));
    setWithdrawModalVisible(true);
  };

  const parsedInputAmount = Math.max(0, parseFloat(withdrawAmount || "0") || 0);
  const isAmountAbove100 = parsedInputAmount > 100;
  const isAmountWithinBalance = parsedInputAmount <= rawWalletBalance;
  const isProTier = planId === 2;
  const computedFee = isProTier
    ? 0
    : Math.round(parsedInputAmount * (commissionPct / 100) * 100) / 100;
  const computedNetPayout = Math.max(0, parsedInputAmount - computedFee);

  const handleSubmitWithdrawal = async () => {
    if (!isAmountAbove100) {
      showModal(
        "Minimum Withdrawal is > ₱100.00",
        "Your requested withdrawal amount must be strictly greater than ₱100.00 (e.g. ₱101.00 or higher).",
        "warning"
      );
      return;
    }
    if (!isAmountWithinBalance) {
      showModal(
        "Exceeds Wallet Balance",
        `Please enter an amount up to your available wallet balance (${walletBalance}).`,
        "warning"
      );
      return;
    }
    if (!accountNumber.trim() || !accountName.trim()) {
      showModal(
        "Account Details Required",
        `Please provide both your ${withdrawChannel} mobile number and registered account name.`,
        "warning"
      );
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      const activeId =
        merchantId || (await getStorageItem("profile_id")) || "0";
      const storedEmail = (await getStorageItem("user_email")) || "";

      const res = await api.post(`listings/merchant-portal/${activeId}/`, {
        action: "request_withdrawal",
        email: storedEmail,
        channel: withdrawChannel,
        amount: parsedInputAmount,
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });

      setWithdrawModalVisible(false);
      await loadEarningsData();
      setActiveHistoryTab("withdrawals");
      DeviceEventEmitter.emit("merchant_orders_updated");
      DeviceEventEmitter.emit("merchant_notifs_updated");

      showModal(
        "Automated Xendit Payout Disbursed!",
        res.data?.message ||
          "Your payout has been automatically disbursed via Xendit and recorded in the Admin ledger!",
        "success"
      );
    } catch (e: any) {
      showModal(
        "Withdrawal Error",
        e.response?.data?.error || "Could not process automated withdrawal.",
        "error"
      );
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const maxChartAmount = Math.max(
    ...monthlyEarnings.map((m) => Number(m.amount || 0)),
    100
  );

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
          <Text style={styles.pageTitle}>Revenue &amp; Automated Payouts</Text>
          <Text style={styles.pageSubTitle}>
            Track rescued food revenue, active wallet deposits, and instant
            Xendit GCash / Maya disbursements
          </Text>
        </View>

        {/* ACTIVE WALLET HERO CARD */}
        <View style={styles.walletHeroCard}>
          <View style={styles.walletTopRow}>
            <View>
              <Text style={styles.walletLabel}>
                ACTIVE WALLET BALANCE (10% DEPOSITS)
              </Text>
              <Text style={styles.walletAmount}>{walletBalance}</Text>
            </View>
            <View style={styles.tierPill}>
              <Ionicons
                name={isProTier ? "sparkles" : "pricetag-outline"}
                size={13}
                color={Colors.white}
              />
              <Text style={styles.tierPillText}>
                {isProTier
                  ? "Pro Tier • 0% Fee"
                  : `Free Tier • ${commissionPct}% Fee`}
              </Text>
            </View>
          </View>

          <Text style={styles.walletHint}>
            Online 10% reservation deposits are credited here upon pickup
            confirmation. Automated Xendit withdrawals require a requested
            amount strictly greater than ₱100.00.
          </Text>

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              rawWalletBalance <= 100 && { opacity: 0.75 },
            ]}
            activeOpacity={0.85}
            onPress={openWithdrawModal}
          >
            <Ionicons name="flash-outline" size={18} color={Colors.primary2} />
            <Text style={styles.withdrawButtonText}>
              {rawWalletBalance > 100
                ? "Withdraw via Xendit (GCash / Maya)"
                : "Minimum > ₱100.00 Required to Withdraw"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.primary2}
            />
          </TouchableOpacity>
        </View>

        {/* SUMMARY STATS GRID */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="trending-up-outline"
                size={19}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.statValue}>{totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Net Revenue</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.statValue}>{savedOnSpoilage}</Text>
            <Text style={styles.statLabel}>Saved on Spoilage</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="bag-check-outline"
                size={19}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.statValue}>{transactionsCompleted}</Text>
            <Text style={styles.statLabel}>Completed Pickups</Text>
          </View>
        </View>

        {/* DYNAMIC ROLLING 6-MONTH REVENUE CHART */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.sectionTitle}>Monthly Revenue Trend</Text>
              <Text style={styles.sectionSubtitle}>
                Rolling 6-month net earnings from rescued surplus
              </Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>Last 6 Months</Text>
            </View>
          </View>

          <View style={styles.barChartRow}>
            {monthlyEarnings.map((item, index) => {
              const val = Number(item.amount || 0);
              const heightPct = Math.max(
                8,
                Math.round((val / maxChartAmount) * 110)
              );
              const isLatest = index === monthlyEarnings.length - 1;
              return (
                <View key={item.month + index} style={styles.barCol}>
                  <Text style={styles.barValueText}>
                    {val > 0 ? `₱${Math.round(val)}` : "₱0"}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: heightPct,
                          backgroundColor: isLatest
                            ? Colors.primary
                            : "#9BB9A9",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barMonthText,
                      isLatest && {
                        fontFamily: "PoppinsBold",
                        color: Colors.primary2,
                      },
                    ]}
                  >
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* HISTORY TOGGLE TABS: COMPLETED TRANSACTIONS VS. WITHDRAWAL REQUESTS */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeHistoryTab === "transactions" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveHistoryTab("transactions")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeHistoryTab === "transactions" && styles.tabBtnTextActive,
              ]}
            >
              Completed Sales ({transactions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeHistoryTab === "withdrawals" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveHistoryTab("withdrawals")}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeHistoryTab === "withdrawals" && styles.tabBtnTextActive,
              ]}
            >
              Xendit Payouts ({withdrawals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeHistoryTab === "transactions" ? (
          transactions.length > 0 ? (
            transactions.map((tx, idx) => (
              <TouchableOpacity
                key={tx.id || idx}
                style={styles.txCard}
                activeOpacity={0.85}
                onPress={() => setSelectedTx(tx)}
              >
                <View style={styles.txIconBox}>
                  <Ionicons
                    name="receipt-outline"
                    size={19}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.txTopLine}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.food}
                    </Text>
                    <Text style={styles.txNetAmount}>{tx.total}</Text>
                  </View>
                  <Text style={styles.txMeta}>
                    Voucher {tx.id} • {tx.customer} ({tx.qty})
                  </Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="receipt-outline"
                size={28}
                color={Colors.primary}
              />
              <Text style={styles.emptyTitle}>No completed sales yet</Text>
              <Text style={styles.emptyDescription}>
                Released orders and verified pickups will appear here with full
                revenue breakdowns.
              </Text>
            </View>
          )
        ) : withdrawals.length > 0 ? (
          withdrawals.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.txCard}
              activeOpacity={0.85}
              onPress={() => setSelectedWithdrawal(w)}
            >
              <View style={styles.txIconBox}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.txTopLine}>
                  <Text style={styles.txTitle}>
                    {w.id} • {w.channel} ({w.account_number})
                  </Text>
                  <View style={[styles.statusBadge, styles.statusApproved]}>
                    <Text
                      style={[styles.statusBadgeText, { color: "#15803D" }]}
                    >
                      {w.status || "Settled"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.txMeta}>
                  Gross: {w.amount} • Fee: {w.fee_deducted} • Net Disbursed:{" "}
                  <Text
                    style={{
                      fontFamily: "PoppinsBold",
                      color: Colors.primary,
                    }}
                  >
                    {w.net_payout}
                  </Text>
                </Text>
                {w.reference_number ? (
                  <Text
                    style={[
                      styles.txDate,
                      { color: Colors.primary, fontFamily: "PoppinsSemiBold" },
                    ]}
                  >
                    Xendit Ref #: {w.reference_number}
                  </Text>
                ) : null}
                <Text style={styles.txDate}>
                  Disbursed: {w.processed_at || w.created_at}
                </Text>
              </View>
              <Ionicons name="eye-outline" size={17} color={Colors.primary} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
            <Text style={styles.emptyTitle}>No Xendit payouts yet</Text>
            <Text style={styles.emptyDescription}>
              Automated Xendit GCash and Maya disbursements and
              their official invoice reference numbers are logged here.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <EstablishmentBottomNav activeTab="Earnings" />

      {/* TRANSACTION BREAKDOWN MODAL */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedTx(null)}
          />
          {selectedTx && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>
                    Transaction Breakdown ({selectedTx.id})
                  </Text>
                  <Text style={styles.modalSubtitle}>{selectedTx.date}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTx(null)}>
                  <Ionicons name="close" size={22} color={Colors.primary2} />
                </TouchableOpacity>
              </View>

              <View style={styles.breakdownBox}>
                <BreakdownRow label="Customer" value={selectedTx.customer} />
                <BreakdownRow label="Items Rescued" value={selectedTx.food} />
                <BreakdownRow label="Quantity" value={selectedTx.qty} />
                <BreakdownRow
                  label="Original Retail Price"
                  value={selectedTx.original}
                />
                <BreakdownRow
                  label="Discounted Sale Total"
                  value={selectedTx.discounted}
                />
                <BreakdownRow
                  label="10% Online Deposit"
                  value={selectedTx.deposit_paid}
                />
                <BreakdownRow
                  label="90% Cash Collected at Pickup"
                  value={selectedTx.cash_collected}
                />
                <BreakdownRow
                  label="Platform Commission Fee"
                  value={selectedTx.commission_fee}
                />
                <View style={styles.breakdownDivider} />
                <BreakdownRow
                  label="Net Store Earnings"
                  value={selectedTx.total}
                  bold
                />
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedTx(null)}
              >
                <Text style={styles.modalCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* VIEW AUTOMATED PAYOUT RECEIPT MODAL */}
      <Modal
        visible={!!selectedWithdrawal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWithdrawal(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedWithdrawal(null)}
          />
          {selectedWithdrawal && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>
                    Xendit Payout Receipt ({selectedWithdrawal.id})
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Automated E-Wallet Disbursement Record
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedWithdrawal(null)}>
                  <Ionicons name="close" size={22} color={Colors.primary2} />
                </TouchableOpacity>
              </View>

              <View style={styles.breakdownBox}>
                <BreakdownRow
                  label="Xendit Reference #"
                  value={selectedWithdrawal.reference_number || "Recorded"}
                />
                <BreakdownRow
                  label="Disbursement Channel"
                  value={selectedWithdrawal.channel}
                />
                <BreakdownRow
                  label="Recipient Account #"
                  value={selectedWithdrawal.account_number}
                />
                <BreakdownRow
                  label="Recipient Name"
                  value={selectedWithdrawal.account_name}
                />
                <BreakdownRow
                  label="Date Disbursed"
                  value={
                    selectedWithdrawal.processed_at ||
                    selectedWithdrawal.created_at
                  }
                />
                <View style={styles.breakdownDivider} />
                <BreakdownRow
                  label="Gross Requested"
                  value={selectedWithdrawal.amount}
                />
                <BreakdownRow
                  label="Platform Commission Fee"
                  value={`-${selectedWithdrawal.fee_deducted}`}
                />
                <BreakdownRow
                  label="Net Disbursed via Xendit"
                  value={selectedWithdrawal.net_payout}
                  bold
                />
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedWithdrawal(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* AUTOMATED XENDIT WITHDRAWAL MODAL */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setWithdrawModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>
                  Automated Xendit Wallet Payout
                </Text>
                <Text style={styles.modalSubtitle}>
                  Available Balance: {walletBalance} (Min. &gt; ₱100.00)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select E-Wallet Channel *</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              {(["GCash", "Maya"] as const).map((ch) => {
                const active = withdrawChannel === ch;
                return (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.channelPill,
                      active && styles.channelPillActive,
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
                        styles.channelPillText,
                        active && { color: Colors.white },
                      ]}
                    >
                      {ch}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>
              Withdrawal Amount (₱) — Must be &gt; ₱100.00 *
            </Text>
            <TextInput
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="Enter amount > 100.00"
              placeholderTextColor={Colors.placeholder}
              style={[
                styles.textInput,
                !isAmountAbove100 && { borderColor: "#B3261E" },
              ]}
            />
            {!isAmountAbove100 && (
              <Text style={styles.minWarningText}>
                Requested withdrawal amount must be strictly greater than
                ₱100.00.
              </Text>
            )}

            <Text style={styles.inputLabel}>
              {withdrawChannel} Mobile Number *
            </Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="phone-pad"
              placeholder="e.g. 09171234567"
              placeholderTextColor={Colors.placeholder}
              style={styles.textInput}
            />

            <Text style={styles.inputLabel}>
              Registered {withdrawChannel} Account Name *
            </Text>
            <TextInput
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Full name registered on E-Wallet"
              placeholderTextColor={Colors.placeholder}
              style={styles.textInput}
            />

            <View style={styles.breakdownBox}>
              <BreakdownRow
                label="Requested Withdrawal"
                value={`₱${parsedInputAmount.toFixed(2)}`}
              />
              <BreakdownRow
                label={
                  isProTier
                    ? "Platform Fee (Premium Pro 0%)"
                    : `Platform Fee (Free Tier ${commissionPct}%)`
                }
                value={`-₱${computedFee.toFixed(2)}`}
              />
              <View style={styles.breakdownDivider} />
              <BreakdownRow
                label="Instant Net Xendit Payout"
                value={`₱${computedNetPayout.toFixed(2)}`}
                bold
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitPayoutBtn,
                (!isAmountAbove100 || !isAmountWithinBalance) && {
                  opacity: 0.5,
                },
              ]}
              activeOpacity={0.85}
              onPress={handleSubmitWithdrawal}
              disabled={
                submittingWithdrawal ||
                !isAmountAbove100 ||
                !isAmountWithinBalance
              }
            >
              {submittingWithdrawal ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="flash-outline"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={styles.submitPayoutBtnText}>
                    Disburse ₱{computedNetPayout.toFixed(2)} Now via Xendit
                  </Text>
                </>
              )}
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
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          fontFamily: bold ? "PoppinsBold" : "PoppinsRegular",
          fontSize: 11.5,
          color: bold ? Colors.primary2 : Colors.primary1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: bold ? "PoppinsBold" : "PoppinsSemiBold",
          fontSize: bold ? 13 : 11.5,
          color: bold ? Colors.primary : Colors.primary2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 28 },
  pageHeader: { marginBottom: 16 },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },
  pageSubTitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11.5,
    color: Colors.primary1,
    marginTop: 2,
  },
  walletHeroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  walletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  walletLabel: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontFamily: "PoppinsBold",
    fontSize: 28,
    color: Colors.white,
    marginTop: 2,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tierPillText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.white,
  },
  walletHint: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    marginBottom: 14,
    lineHeight: 15,
  },
  withdrawButton: {
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  withdrawButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  statLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 18,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  sectionSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
  },
  chartBadge: {
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chartBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
  barChartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 155,
    paddingTop: 18,
  },
  barCol: { flex: 1, alignItems: "center" },
  barValueText: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,
    color: Colors.primary1,
    marginBottom: 4,
  },
  barTrack: {
    width: 24,
    height: 110,
    backgroundColor: "#F2F5F3",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 6 },
  barMonthText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
    marginTop: 6,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#EBEFEB",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: Colors.white },
  tabBtnText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11.5,
    color: Colors.primary1,
  },
  tabBtnTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },
  txCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 10,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  txTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  txTitle: {
    flex: 1,
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
  },
  txNetAmount: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary,
  },
  txMeta: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    marginTop: 2,
  },
  txDate: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    marginTop: 2,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusApproved: { backgroundColor: "#DCFCE7" },
  statusRejected: { backgroundColor: "#FBE4E1" },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 9.5 },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13.5,
    color: Colors.primary2,
    marginTop: 8,
  },
  emptyDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 3,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(18,55,44,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: "rgba(18,55,44,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
  },
  bottomSheetCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 28,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: Colors.primary2,
  },
  modalSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  breakdownBox: {
    backgroundColor: "#F7F9F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginVertical: 10,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  modalCloseBtn: {
    height: 44,
    backgroundColor: Colors.button,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  modalCloseBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  inputLabel: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
    marginBottom: 5,
  },
  textInput: {
    height: 44,
    backgroundColor: Colors.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary2,
    marginBottom: 8,
  },
  minWarningText: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: "#B3261E",
    marginTop: -4,
    marginBottom: 8,
  },
  channelPill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  channelPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  channelPillText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
  submitPayoutBtn: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  submitPayoutBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12.5,
    color: Colors.white,
  },
});