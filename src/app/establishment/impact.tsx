import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   IMPACT DATA
===================================================== */

const impactStats = [
  {
    icon: "leaf-outline",
    value: "1,248",
    label: "Food rescued",
    unit: "kg",
  },
  {
    icon: "people-outline",
    value: "386",
    label: "People helped",
    unit: "people",
  },
  {
    icon: "heart-outline",
    value: "214",
    label: "Successful rescues",
    unit: "rescues",
  },
  {
    icon: "cloud-outline",
    value: "2,496",
    label: "CO₂ avoided",
    unit: "kg",
  },
];

/* =====================================================
   MONTHLY DATA
===================================================== */

const monthlyData = [
  {
    month: "Mar",
    rescued: 145,
  },
  {
    month: "Apr",
    rescued: 182,
  },
  {
    month: "May",
    rescued: 210,
  },
  {
    month: "Jun",
    rescued: 236,
  },
  {
    month: "Jul",
    rescued: 198,
  },
  {
    month: "Aug",
    rescued: 277,
  },
];

/* =====================================================
   RECENT IMPACT
===================================================== */

const recentImpact = [
  {
    id: 1,
    icon: "restaurant-outline",
    title: "Fresh Pastries rescued",
    description: "15 kg of surplus food was successfully claimed.",
    date: "Today",
  },
  {
    id: 2,
    icon: "people-outline",
    title: "8 consumers helped",
    description: "Your listings helped provide affordable food.",
    date: "Yesterday",
  },
  {
    id: 3,
    icon: "leaf-outline",
    title: "12 kg food saved",
    description: "Food was rescued instead of going to waste.",
    date: "Aug 10",
  },
];

/* =====================================================
   MAIN IMPACT SCREEN
===================================================== */

export default function EstablishmentImpact() {
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
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <View style={styles.pageHeader}>

          <Text style={styles.pageTitle}>
            Your impact
          </Text>

        </View>

        {/* =================================================
            IMPACT HERO
        ================================================= */}

        <View style={styles.impactHero}>

          <View style={styles.heroIcon}>

            <Ionicons
              name="leaf"
              size={28}
              color={Colors.white}
            />

          </View>

          <Text style={styles.heroTitle}>
            Making a difference
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottom}>

            <View>
              <Text style={styles.heroNumber}>
                1,248 kg
              </Text>

              <Text style={styles.heroLabel}>
                total food rescued
              </Text>
            </View>

            <View style={styles.heroLeafIcon}>
              <Ionicons
                name="trending-up-outline"
                size={19}
                color={Colors.button}
              />
            </View>

          </View>

        </View>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Impact overview
          </Text>

          <Text style={styles.sectionSubtitle}>
            Your contribution so far
          </Text>

        </View>

        <View style={styles.statsGrid}>

          {impactStats.map((stat) => (
            <ImpactStatCard
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              unit={stat.unit}
            />
          ))}

        </View>

        {/* =================================================
            MONTHLY IMPACT
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Monthly food rescue
          </Text>

          <Text style={styles.sectionSubtitle}>
            Food rescued over the last 6 months
          </Text>

        </View>

        <View style={styles.chartCard}>

          <View style={styles.chartTop}>

            <View>
              <Text style={styles.chartTotal}>
                1,248 kg
              </Text>

              <Text style={styles.chartLabel}>
                Total rescued
              </Text>
            </View>

            <View style={styles.growthBadge}>

              <Ionicons
                name="trending-up-outline"
                size={13}
                color={Colors.button}
              />

              <Text style={styles.growthText}>
                +18%
              </Text>

            </View>

          </View>

          {/* BAR CHART */}

          <View style={styles.chart}>

            <View style={styles.chartYAxis}>

              <Text style={styles.axisText}>
                300
              </Text>

              <Text style={styles.axisText}>
                200
              </Text>

              <Text style={styles.axisText}>
                100
              </Text>

              <Text style={styles.axisText}>
                0
              </Text>

            </View>

            <View style={styles.chartArea}>

              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />

              <View style={styles.barsRow}>

                {monthlyData.map((item) => {

                  const height =
                    (item.rescued / 300) * 125;

                  return (
                    <View
                      key={item.month}
                      style={styles.barColumn}
                    >

                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                          },
                        ]}
                      />

                      <Text
                        style={
                          styles.barLabel
                        }
                      >
                        {item.month}
                      </Text>

                    </View>
                  );
                })}

              </View>

            </View>

          </View>

        </View>

        {/* =================================================
            COMMUNITY IMPACT
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Community impact
          </Text>

          <Text style={styles.sectionSubtitle}>
            How your food rescue helps people
          </Text>

        </View>

        <View style={styles.communityCard}>

          <ImpactRow
            icon="people-outline"
            title="People supported"
            value="386"
            description="Consumers have benefited from your listings."
          />

          <View style={styles.impactDivider} />

          <ImpactRow
            icon="restaurant-outline"
            title="Food portions rescued"
            value="2,496"
            description="Estimated portions saved from going to waste."
          />

          <View style={styles.impactDivider} />

          <ImpactRow
            icon="leaf-outline"
            title="Waste prevented"
            value="1,248 kg"
            description="Surplus food redirected to consumers."
          />

        </View>

        {/* =================================================
            ENVIRONMENTAL IMPACT
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Environmental impact
          </Text>

          <Text style={styles.sectionSubtitle}>
            Your contribution to reducing food waste
          </Text>

        </View>

        <View style={styles.environmentCard}>

          <View style={styles.environmentIcon}>

            <Ionicons
              name="earth-outline"
              size={25}
              color={Colors.primary}
            />

          </View>

          <View style={styles.environmentContent}>

            <Text style={styles.environmentTitle}>
              2,496 kg CO₂ avoided
            </Text>

            <Text style={styles.environmentDescription}>
              By rescuing surplus food instead of
              letting it go to waste, your establishment
              is helping reduce its environmental impact.
            </Text>

          </View>

        </View>

        {/* =================================================
            RECENT IMPACT
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Recent impact
          </Text>

          <Text style={styles.sectionSubtitle}>
            Your latest contributions
          </Text>

        </View>

        <View style={styles.recentCard}>

          {recentImpact.map((impact, index) => (

            <View
              key={impact.id}
              style={styles.recentRow}
            >

              <View style={styles.recentIcon}>

                <Ionicons
                  name={impact.icon}
                  size={17}
                  color={Colors.primary}
                />

              </View>

              <View style={styles.recentContent}>

                <Text style={styles.recentTitle}>
                  {impact.title}
                </Text>

                <Text
                  style={
                    styles.recentDescription
                  }
                >
                  {impact.description}
                </Text>

              </View>

              <Text style={styles.recentDate}>
                {impact.date}
              </Text>

            </View>

          ))}

        </View>

        {/* =================================================
            MOTIVATION CARD
        ================================================= */}

        <View style={styles.motivationCard}>

          <View style={styles.motivationIcon}>

            <Ionicons
              name="heart"
              size={20}
              color={Colors.primary}
            />

          </View>

          <View style={styles.motivationContent}>

            <Text style={styles.motivationTitle}>
              Keep making an impact
            </Text>

            <Text style={styles.motivationDescription}>
              Every rescued listing helps reduce food
              waste and makes affordable food more
              accessible to the community.
            </Text>

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
            router.push(
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
          icon="person"
          label="Impact"
          active
          onPress={() =>
            router.push(
              "/establishment/impact"
            )
          }
        />

      </View>

    </SafeAreaView>
  );
}

/* =====================================================
   IMPACT STAT CARD
===================================================== */

function ImpactStatCard({
  icon,
  value,
  label,
  unit,
}: {
  icon: any;
  value: string;
  label: string;
  unit: string;
}) {
  return (
    <View style={styles.statCard}>

      <View style={styles.statIcon}>

        <Ionicons
          name={icon}
          size={19}
          color={Colors.primary}
        />

      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statUnit}>
        {unit}
      </Text>

    </View>
  );
}

/* =====================================================
   IMPACT ROW
===================================================== */

function ImpactRow({
  icon,
  title,
  value,
  description,
}: {
  icon: any;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <View style={styles.impactRow}>

      <View style={styles.impactRowIcon}>

        <Ionicons
          name={icon}
          size={18}
          color={Colors.primary}
        />

      </View>

      <View style={styles.impactRowContent}>

        <Text style={styles.impactRowTitle}>
          {title}
        </Text>

        <Text
          style={styles.impactRowDescription}
        >
          {description}
        </Text>

      </View>

      <Text style={styles.impactRowValue}>
        {value}
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

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    lineHeight: 14,
    marginTop: 3,
    maxWidth: "95%",
  },

  /* ===================================================
     IMPACT HERO
  =================================================== */

  impactHero: {
    backgroundColor: Colors.primary,

    borderRadius: 11,

    padding: 16,

    marginBottom: 22,
  },

  heroIcon: {
    width: 46,
    height: 46,

    borderRadius: 23,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 10,
  },

  heroTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.white,
  },

  heroDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: "#D8E3DD",

    lineHeight: 13,

    marginTop: 3,
  },

  heroDivider: {
    height: 1,

    backgroundColor: "rgba(255,255,255,0.18)",

    marginVertical: 13,
  },

  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroNumber: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    color: Colors.white,
  },

  heroLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: "#D8E3DD",
    marginTop: -1,
  },

  heroLeafIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ===================================================
     SECTION
  =================================================== */

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 17,
    color: Colors.primary2,
  },

  sectionSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* ===================================================
     STATS
  =================================================== */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "space-between",

    marginBottom: 22,
  },

  statCard: {
    width: "48.5%",

    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 12,

    marginBottom: 9,
  },

  statIcon: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 8,
  },

  statValue: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.primary,
  },

  statLabel: {
    fontFamily: "PoppinsMedium",
    fontSize: 8.5,
    color: Colors.primary2,

    marginTop: 1,
  },

  statUnit: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,

    marginTop: 1,
  },

  /* ===================================================
     CHART
  =================================================== */

  chartCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 13,

    marginBottom: 22,
  },

  chartTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 13,
  },

  chartTotal: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    color: Colors.primary,
  },

  chartLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginTop: -1,
  },

  growthBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#E7F0E9",

    borderRadius: 12,

    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  growthText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7.5,
    color: Colors.button,

    marginLeft: 3,
  },

  chart: {
    height: 160,

    flexDirection: "row",
  },

  chartYAxis: {
    width: 27,

    height: 130,

    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  axisText: {
    fontFamily: "PoppinsRegular",
    fontSize: 6.5,
    color: Colors.primary1,
  },

  chartArea: {
    flex: 1,

    height: 145,

    position: "relative",

    justifyContent: "flex-end",
  },

  gridLine: {
    position: "absolute",

    left: 0,
    right: 0,

    height: 1,

    backgroundColor: Colors.border,
  },

  barsRow: {
    height: 145,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-around",

    paddingHorizontal: 7,
  },

  barColumn: {
    height: 145,

    alignItems: "center",

    justifyContent: "flex-end",
  },

  bar: {
    width: 24,

    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,

    backgroundColor: Colors.button,

    marginBottom: 6,
  },

  barLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.primary1,
  },

  /* ===================================================
     COMMUNITY
  =================================================== */

  communityCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingHorizontal: 12,
    paddingVertical: 5,

    marginBottom: 22,
  },

  impactRow: {
    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 11,
  },

  impactRowIcon: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  impactRowContent: {
    flex: 1,
  },

  impactRowTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,
    color: Colors.primary2,
  },

  impactRowDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,

    lineHeight: 11,

    marginTop: 1,
  },

  impactRowValue: {
    fontFamily: "PoppinsBold",
    fontSize: 12,
    color: Colors.primary,
  },

  impactDivider: {
    height: 1,

    backgroundColor: Colors.border,
  },

  /* ===================================================
     ENVIRONMENT
  =================================================== */

  environmentCard: {
    backgroundColor: "#E9EFE9",

    borderRadius: 10,

    padding: 13,

    flexDirection: "row",

    marginBottom: 22,
  },

  environmentIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  environmentContent: {
    flex: 1,
  },

  environmentTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary2,
  },

  environmentDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.8,
    color: Colors.primary1,

    lineHeight: 12,

    marginTop: 2,
  },

  /* ===================================================
     RECENT IMPACT
  =================================================== */

  recentCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingHorizontal: 12,

    marginBottom: 22,
  },

  recentRow: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  recentRowLast: {
    borderBottomWidth: 0,
  },

  recentIcon: {
    width: 35,
    height: 35,

    borderRadius: 18,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  recentContent: {
    flex: 1,
  },

  recentTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 8.8,
    color: Colors.primary2,
  },

  recentDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.3,
    color: Colors.primary1,

    lineHeight: 11,

    marginTop: 2,

    paddingRight: 5,
  },

  recentDate: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.primary1,

    alignSelf: "flex-start",

    marginTop: 16,
  },

  /* ===================================================
     MOTIVATION
  =================================================== */

  motivationCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 13,

    flexDirection: "row",
  },

  motivationIcon: {
    width: 39,
    height: 39,

    borderRadius: 20,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  motivationContent: {
    flex: 1,
  },

  motivationTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary2,
  },

  motivationDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.8,
    color: Colors.primary1,

    lineHeight: 12,

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