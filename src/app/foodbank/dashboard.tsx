import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   TYPES
===================================================== */

type RequestItem = {
  id: string;
  food: string;
  date: string;
  status: "Pending" | "Approved" | "Completed";
};

/* =====================================================
   MOCK DATA
===================================================== */

const requestHistory: RequestItem[] = [
  {
    id: "REQ-001",
    food: "Bread & Pastries",
    date: "Aug 12, 2026",
    status: "Pending",
  },
  {
    id: "REQ-002",
    food: "Cooked Meals",
    date: "Aug 10, 2026",
    status: "Approved",
  },
  {
    id: "REQ-003",
    food: "Fresh Produce",
    date: "Aug 08, 2026",
    status: "Completed",
  },
];

const recentActivities = [
  {
    id: 1,
    title: "Posted new food request.",
    date: "2026-08-12",
    time: "10:30 PM",
  },
  {
    id: 2,
    title: "Posted new food request.",
    date: "2026-08-10",
    time: "02:30 PM",
  },
  {
    id: 3,
    title: "Posted new food request.",
    date: "2026-08-08",
    time: "09:20 AM",
  },
  {
    id: 4,
    title: "Posted new food request.",
    date: "2026-08-06",
    time: "03:15 PM",
  },
];

/* =====================================================
   MAIN SCREEN
===================================================== */

export default function FoodBankDashboard() {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 380;
  const isPhone = width < 600;
  const isTablet = width >= 768;

  return (
    <SafeAreaView style={styles.container}>
      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text
            style={[
              styles.logo,
              isSmallPhone && styles.logoSmall,
            ]}
          >
            RESERVE
          </Text>

          <Text style={styles.headerSubtitle}>
            Food Bank Portal
          </Text>
        </View>

        <View style={styles.headerActions}>
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

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push("/foodbank/profile")
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
          isSmallPhone && styles.scrollContentSmall,
          isTablet && styles.scrollContentTablet,
        ]}
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <View style={styles.pageHeader}>
          <Text
            style={[
              styles.pageTitle,
              isSmallPhone && styles.pageTitleSmall,
            ]}
          >
            Dashboard Overview
          </Text>

          <Text style={styles.pageSubtitle}>
            Manage your food requests and donations
          </Text>
        </View>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <View
          style={[
            styles.statsRow,
            isPhone && styles.statsRowPhone,
          ]}
        >
          <StatCard
            title="Total Requests"
            value="360"
            type="light"
            isPhone={isPhone}
          />

          <StatCard
            title="Active Request"
            value="5"
            type="primary"
            isPhone={isPhone}
          />

          <StatCard
            title="Donation Offers"
            value="12"
            type="light"
            isPhone={isPhone}
          />

          <StatCard
            title="Partnered Networks"
            value="8"
            type="dark"
            isPhone={isPhone}
          />
        </View>

        {/* =================================================
            POST NEW REQUEST
        ================================================= */}

        <TouchableOpacity
          style={[
            styles.createRequestButton,
            isSmallPhone &&
              styles.createRequestButtonSmall,
          ]}
          activeOpacity={0.85}
          onPress={() =>
            router.push("/foodbank/dashboard")
          }
        >
          <View
            style={[
              styles.plusCircle,
              isSmallPhone && styles.plusCircleSmall,
            ]}
          >
            <Ionicons
              name="add"
              size={29}
              color={Colors.primary}
            />
          </View>

          <Text
            style={[
              styles.createRequestText,
              isSmallPhone &&
                styles.createRequestTextSmall,
            ]}
          >
            POST NEW REQUEST
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        {/* =================================================
            DASHBOARD COLUMNS
        ================================================= */}

        <View
          style={[
            styles.dashboardColumns,
            isPhone &&
              styles.dashboardColumnsPhone,
          ]}
        >
          {/* =================================================
              REQUEST HISTORY
          ================================================= */}

          <View
            style={[
              styles.historyCard,
              isPhone && styles.historyCardPhone,
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  Request History
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Track your recent food requests
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push("/foodbank/dashboard")
                }
              >
                <Text style={styles.viewAllText}>
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {/* TABLE HEADER */}

            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>
                REQUEST
              </Text>

              <Text style={styles.tableHeaderText}>
                STATUS
              </Text>

              <Text style={styles.tableHeaderText}>
                DATE
              </Text>
            </View>

            {/* TABLE ROWS */}

            {requestHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.requestRow}
                activeOpacity={0.75}
                onPress={() =>
                  router.push("/foodbank/dashboard")
                }
              >
                <View style={styles.requestInfo}>
                  <Text
                    style={styles.requestName}
                    numberOfLines={1}
                  >
                    {item.food}
                  </Text>

                  <Text style={styles.requestId}>
                    {item.id}
                  </Text>
                </View>

                <StatusBadge status={item.status} />

                <Text
                  style={styles.requestDate}
                  numberOfLines={1}
                >
                  {item.date}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            ))}

            <View style={styles.historyFooter}>
              <TouchableOpacity
                style={styles.historyButton}
                activeOpacity={0.7}
                onPress={() =>
                  router.push("/foodbank/dashboard")
                }
              >
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={Colors.primary}
                />

                <Text style={styles.historyButtonText}>
                  Manage requests
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* =================================================
              RECENT ACTIVITY
          ================================================= */}

          <View
            style={[
              styles.activityCard,
              isPhone && styles.activityCardPhone,
            ]}
          >
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>
                Recent Activity
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push("/foodbank/dashboard")
                }
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={17}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.timeline}>
              {recentActivities.map(
                (activity, index) => (
                  <View
                    key={activity.id}
                    style={styles.activityItem}
                  >
                    <View style={styles.timelineColumn}>
                      <View style={styles.activityDot} />

                      {index !==
                        recentActivities.length - 1 && (
                        <View
                          style={styles.timelineLine}
                        />
                      )}
                    </View>

                    <View style={styles.activityContent}>
                      <Text
                        style={styles.activityText}
                        numberOfLines={2}
                      >
                        {activity.title}
                      </Text>

                      <Text style={styles.activityDate}>
                        {activity.date} · {activity.time}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>

            <TouchableOpacity
              style={styles.activityFooter}
              activeOpacity={0.7}
              onPress={() =>
                router.push("/foodbank/dashboard")
              }
            >
              <Text style={styles.activityFooterText}>
                View activity
              </Text>

              <Ionicons
                name="arrow-forward"
                size={13}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>
            Quick Actions
          </Text>

          <View
            style={[
              styles.quickRow,
              isPhone && styles.quickRowPhone,
            ]}
          >
            <QuickAction
              icon="add-circle-outline"
              title="Post Request"
              subtitle="Request surplus food"
              onPress={() =>
                router.push("/foodbank/dashboard")
              }
            />

            <QuickAction
              icon="gift-outline"
              title="Donations"
              subtitle="View donation offers"
              onPress={() =>
                router.push("/foodbank/donations")
              }
            />

            <QuickAction
              icon="people-outline"
              title="Partners"
              subtitle="Manage networks"
              onPress={() =>
                router.push("/foodbank/dashboard")
              }
            />
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="grid"
          label="Home"
          active
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
          icon="gift-outline"
          label="Donations"
          onPress={() =>
            router.push("/foodbank/dashboard")
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
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  type,
  isPhone,
}: {
  title: string;
  value: string;
  type: "light" | "primary" | "dark";
  isPhone: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        isPhone && styles.statCardPhone,
        type === "primary" && styles.statCardPrimary,
        type === "dark" && styles.statCardDark,
      ]}
    >
      <Text
        style={[
          styles.statTitle,
          type !== "light" && styles.statTitleWhite,
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.statValue,
          type !== "light" && styles.statValueWhite,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: RequestItem["status"];
}) {
  const isPending = status === "Pending";
  const isCompleted = status === "Completed";

  return (
    <View
      style={[
        styles.statusBadge,
        isPending && styles.statusPending,
        isCompleted && styles.statusCompleted,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          isPending && styles.statusDotPending,
          isCompleted && styles.statusDotCompleted,
        ]}
      />

      <Text
        style={[
          styles.statusText,
          isPending && styles.statusTextPending,
          isCompleted && styles.statusTextCompleted,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

/* =====================================================
   QUICK ACTION
===================================================== */

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={Colors.primary}
        />
      </View>

      <View style={styles.quickInfo}>
        <Text style={styles.quickCardTitle}>
          {title}
        </Text>

        <Text style={styles.quickCardSubtitle}>
          {subtitle}
        </Text>
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
          active ? Colors.primary : Colors.icon
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

  scrollContentSmall: {
    paddingHorizontal: 14,
    paddingTop: 17,
  },

  scrollContentTablet: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  bottomSpace: {
    height: 20,
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

  headerBrand: {
    flexShrink: 1,
  },

  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 23,
    lineHeight: 27,
    color: Colors.primary,
    letterSpacing: 0.7,
  },

  logoSmall: {
    fontSize: 21,
    lineHeight: 25,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 12,
    color: Colors.primary1,
    marginTop: -1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
     STATISTICS
  =================================================== */

  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  statsRowPhone: {
    flexWrap: "wrap",
    gap: 8,
  },

  statCard: {
    flex: 1,
    minHeight: 82,
    backgroundColor: "#D5E7DC",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 11,
    justifyContent: "space-between",
  },

  statCardPhone: {
    flexBasis: "48%",
    minWidth: 0,
    minHeight: 76,
  },

  statCardPrimary: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },

  statCardDark: {
    backgroundColor: "#729879",
    borderColor: "#729879",
  },

  statTitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: Colors.primary2,
  },

  statTitleWhite: {
    color: Colors.white,
  },

  statValue: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 28,
    color: "#414744",
  },

  statValueWhite: {
    color: Colors.white,
  },

  /* ===================================================
     CREATE REQUEST
  =================================================== */

  createRequestButton: {
    minHeight: 62,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  createRequestButtonSmall: {
    minHeight: 58,
    paddingHorizontal: 10,
  },

  plusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  plusCircleSmall: {
    width: 35,
    height: 35,
    borderRadius: 18,
    marginRight: 9,
  },

  createRequestText: {
    flex: 1,
    fontFamily: "PoppinsBold",
    fontSize: 14,
    lineHeight: 19,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  createRequestTextSmall: {
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* ===================================================
     COLUMNS
  =================================================== */

  dashboardColumns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  dashboardColumnsPhone: {
    flexDirection: "column",
    gap: 12,
  },

  /* ===================================================
     REQUEST HISTORY
  =================================================== */

  historyCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },

  historyCardPhone: {
    width: "100%",
  },

  sectionHeader: {
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeaderText: {
    flex: 1,
    paddingRight: 8,
  },

  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    lineHeight: 19,
    color: Colors.primary2,
  },

  sectionSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: Colors.primary1,
    marginTop: 1,
  },

  viewAllText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7.5,
    color: Colors.primary,
  },

  /* ===================================================
     TABLE
  =================================================== */

  tableHeader: {
    minHeight: 30,
    backgroundColor: "#B7D9C9",
    marginHorizontal: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tableHeaderText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 6.5,
    color: Colors.primary2,
  },

  requestRow: {
    minHeight: 58,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  requestInfo: {
    flex: 1,
    paddingRight: 4,
    minWidth: 0,
  },

  requestName: {
    fontFamily: "PoppinsMedium",
    fontSize: 8,
    lineHeight: 12,
    color: Colors.primary2,
  },

  requestId: {
    fontFamily: "PoppinsRegular",
    fontSize: 6.5,
    lineHeight: 10,
    color: Colors.placeholder,
    marginTop: 1,
  },

  requestDate: {
    width: 62,
    fontFamily: "PoppinsRegular",
    fontSize: 6.5,
    lineHeight: 10,
    color: Colors.primary1,
    textAlign: "right",
    marginRight: 3,
  },

  /* ===================================================
     STATUS
  =================================================== */

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E7F0E9",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginHorizontal: 3,
    flexShrink: 0,
  },

  statusPending: {
    backgroundColor: "#F4EEDF",
  },

  statusCompleted: {
    backgroundColor: "#E5EEE7",
  },

  statusDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: Colors.button,
    marginRight: 3,
  },

  statusDotPending: {
    backgroundColor: Colors.accent,
  },

  statusDotCompleted: {
    backgroundColor: "#5B8063",
  },

  statusText: {
    fontFamily: "PoppinsMedium",
    fontSize: 6.5,
    color: Colors.button,
  },

  statusTextPending: {
    color: Colors.accent,
  },

  statusTextCompleted: {
    color: "#5B8063",
  },

  /* ===================================================
     HISTORY FOOTER
  =================================================== */

  historyFooter: {
    padding: 10,
    alignItems: "flex-end",
  },

  historyButton: {
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: "#E8EFEA",
    flexDirection: "row",
    alignItems: "center",
  },

  historyButtonText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7.5,
    color: Colors.primary,
    marginLeft: 4,
  },

  /* ===================================================
     RECENT ACTIVITY
  =================================================== */

  activityCard: {
    width: 130,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingTop: 11,
    paddingBottom: 9,
  },

  activityCardPhone: {
    width: "100%",
  },

  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  activityTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.primary2,
  },

  timeline: {
    paddingLeft: 1,
  },

  activityItem: {
    flexDirection: "row",
    minHeight: 50,
  },

  timelineColumn: {
    width: 17,
    alignItems: "center",
  },

  activityDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#7BA784",
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#B8CDBE",
    marginVertical: -1,
  },

  activityContent: {
    flex: 1,
    paddingLeft: 5,
    paddingTop: 0,
  },

  activityText: {
    fontFamily: "PoppinsMedium",
    fontSize: 6.5,
    lineHeight: 9,
    color: Colors.primary2,
  },

  activityDate: {
    fontFamily: "PoppinsRegular",
    fontSize: 5.2,
    lineHeight: 8,
    color: Colors.placeholder,
    marginTop: 1,
  },

  activityFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 2,
    paddingTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  activityFooterText: {
    fontFamily: "PoppinsMedium",
    fontSize: 6.5,
    color: Colors.primary,
    marginRight: 3,
  },

  /* ===================================================
     QUICK ACTIONS
  =================================================== */

  quickSection: {
    marginTop: 18,
  },

  quickTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    lineHeight: 19,
    color: Colors.primary2,
    marginBottom: 9,
  },

  quickRow: {
    flexDirection: "row",
    gap: 9,
  },

  quickRowPhone: {
    flexDirection: "column",
    gap: 8,
  },

  quickCard: {
    flex: 1,
    minHeight: 61,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  quickIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: "#E8EFEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  quickInfo: {
    flex: 1,
    minWidth: 0,
  },

  quickCardTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 8.5,
    color: Colors.primary2,
  },

  quickCardSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 6.8,
    color: Colors.primary1,
    marginTop: 1,
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