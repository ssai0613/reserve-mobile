import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../../services/api";
import {
  EstablishmentBottomNav,
  EstablishmentHeader,
  useIsInsideMerchantShell,
} from "../components/EstablishmentNav";

type MonthlyImpactItem = {
  month: string;
  rescued: number;
};

type ImpactActivity = {
  id: string;
  icon: string;
  title: string;
  description: string;
  date: string;
};

type ReviewItem = {
  id: number;
  consumer: string;
  item: string;
  score: number;
  comment: string;
  date: string;
};

const getRollingSixImpactMonths = (): MonthlyImpactItem[] => {
  const result: MonthlyImpactItem[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      rescued: 0,
    });
  }
  return result;
};

let cachedImpactMemory = {
  foodRescuedKg: "0.0",
  peopleHelped: "0",
  successfulRescues: "0",
  co2AvoidedKg: "0.0",
  portionsRescued: "0",
  monthlyData: getRollingSixImpactMonths(),
  recentImpact: [] as ImpactActivity[],
  avgRating: 0,
  reviewCount: 0,
  reviews: [] as ReviewItem[],
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function EstablishmentImpact() {
  const isInsideShell = useIsInsideMerchantShell();
  if (!isInsideShell) return null;

  const [foodRescuedKg, setFoodRescuedKg] = useState(
    cachedImpactMemory.foodRescuedKg
  );
  const [peopleHelped, setPeopleHelped] = useState(
    cachedImpactMemory.peopleHelped
  );
  const [successfulRescues, setSuccessfulRescues] = useState(
    cachedImpactMemory.successfulRescues
  );
  const [co2AvoidedKg, setCo2AvoidedKg] = useState(
    cachedImpactMemory.co2AvoidedKg
  );
  const [portionsRescued, setPortionsRescued] = useState(
    cachedImpactMemory.portionsRescued
  );
  const [monthlyData, setMonthlyData] = useState<MonthlyImpactItem[]>(
    cachedImpactMemory.monthlyData
  );
  const [recentImpact, setRecentImpact] = useState<ImpactActivity[]>(
    cachedImpactMemory.recentImpact
  );
  const [avgRating, setAvgRating] = useState(cachedImpactMemory.avgRating);
  const [reviewCount, setReviewCount] = useState(
    cachedImpactMemory.reviewCount
  );
  const [reviews, setReviews] = useState<ReviewItem[]>(
    cachedImpactMemory.reviews
  );
  const [refreshing, setRefreshing] = useState(false);

  const loadImpactData = useCallback(async () => {
    try {
      const storedId = await getStorageItem("profile_id");
      const storedEmail = (await getStorageItem("user_email")) || "";

      if (!storedId && !storedEmail) {
        router.replace("/consumer");
        return;
      }

      const resolvedId = storedId || "0";
      const res = await api.get(
        `listings/merchant-portal/${resolvedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );

      const imp = res.data?.impact;
      const prof = res.data?.profile;

      if (imp) {
        const nextMonthly =
          Array.isArray(imp.monthly_data) && imp.monthly_data.length > 0
            ? imp.monthly_data.slice(-6)
            : getRollingSixImpactMonths();

        cachedImpactMemory = {
          foodRescuedKg: String(imp.food_rescued_kg || "0.0"),
          peopleHelped: String(imp.people_helped || "0"),
          successfulRescues: String(imp.successful_rescues || "0"),
          co2AvoidedKg: String(imp.co2_avoided_kg || "0.0"),
          portionsRescued: String(imp.portions_rescued || "0"),
          monthlyData: nextMonthly,
          recentImpact: Array.isArray(imp.recent_impact)
            ? imp.recent_impact
            : [],
          avgRating: Number(prof?.avg_rating || 0),
          reviewCount: Number(prof?.review_count || 0),
          reviews: Array.isArray(prof?.reviews) ? prof.reviews : [],
        };

        setFoodRescuedKg(cachedImpactMemory.foodRescuedKg);
        setPeopleHelped(cachedImpactMemory.peopleHelped);
        setSuccessfulRescues(cachedImpactMemory.successfulRescues);
        setCo2AvoidedKg(cachedImpactMemory.co2AvoidedKg);
        setPortionsRescued(cachedImpactMemory.portionsRescued);
        setMonthlyData(cachedImpactMemory.monthlyData);
        setRecentImpact(cachedImpactMemory.recentImpact);
        setAvgRating(cachedImpactMemory.avgRating);
        setReviewCount(cachedImpactMemory.reviewCount);
        setReviews(cachedImpactMemory.reviews);
      }
    } catch (e) {
      console.log("Error loading merchant impact:", e);
    }
  }, []);

  useEffect(() => {
    loadImpactData();

    const ordSub = DeviceEventEmitter.addListener(
      "merchant_orders_updated",
      () => {
        loadImpactData();
      }
    );
    const donSub = DeviceEventEmitter.addListener(
      "merchant_donations_updated",
      () => {
        loadImpactData();
      }
    );
    const listSub = DeviceEventEmitter.addListener(
      "merchant_listings_updated",
      () => {
        loadImpactData();
      }
    );

    return () => {
      ordSub.remove();
      donSub.remove();
      listSub.remove();
    };
  }, [loadImpactData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadImpactData();
    setRefreshing(false);
  };

  const maxRescuedVal = Math.max(
    ...monthlyData.map((d) => Number(d.rescued || 0)),
    5
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
          <Text style={styles.pageTitle}>Sustainability &amp; Impact</Text>
          <Text style={styles.pageSubTitle}>
            Real-time environmental metrics, community rescues, and verified
            customer reviews
          </Text>
        </View>

        {/* ENVIRONMENTAL HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroBadgeText}>
                CEBU CITY RESOURCE RECOVERY
              </Text>
              <Text style={styles.heroBigValue}>{foodRescuedKg} kg</Text>
              <Text style={styles.heroSubLabel}>
                Total Surplus Food Diverted from Landfill
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <Ionicons name="leaf" size={28} color={Colors.white} />
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricNumber}>{co2AvoidedKg} kg</Text>
              <Text style={styles.heroMetricLabel}>CO₂e Avoided</Text>
            </View>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricNumber}>{portionsRescued}</Text>
              <Text style={styles.heroMetricLabel}>Meal Portions</Text>
            </View>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricNumber}>{peopleHelped}</Text>
              <Text style={styles.heroMetricLabel}>Rescues Fulfilled</Text>
            </View>
          </View>
        </View>

        {/* SECONDARY STATS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="star" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statNumber}>
                {reviewCount > 0 ? avgRating.toFixed(1) : "5.0"} ★
              </Text>
              <Text style={styles.statLabel}>
                Store Rating ({reviewCount} review
                {reviewCount === 1 ? "" : "s"})
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="heart-outline"
                size={18}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statNumber}>{successfulRescues}</Text>
              <Text style={styles.statLabel}>Total Units Rescued</Text>
            </View>
          </View>
        </View>

        {/* ROLLING 6-MONTH FOOD RESCUED CHART */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Monthly Food Rescued (kg)
              </Text>
              <Text style={styles.sectionSubtitle}>
                Rolling 6-month surplus recovery volume
              </Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>Last 6 Months</Text>
            </View>
          </View>

          <View style={styles.barChartRow}>
            {monthlyData.map((item, idx) => {
              const val = Number(item.rescued || 0);
              const barHeight = Math.max(
                8,
                Math.round((val / maxRescuedVal) * 110)
              );
              const isLatest = idx === monthlyData.length - 1;
              return (
                <View key={item.month + idx} style={styles.barCol}>
                  <Text style={styles.barValText}>{val.toFixed(1)}kg</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
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

        {/* CUSTOMER RATINGS & REVIEWS */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Verified Customer Reviews ({reviewCount})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Feedback submitted by consumers after claiming rescues
              </Text>
            </View>
          </View>

          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{rev.consumer}</Text>
                  <Text style={styles.reviewStars}>
                    {"★".repeat(Math.max(1, Math.min(5, rev.score || 5)))}
                  </Text>
                </View>
                <Text style={styles.reviewProduct}>Item: {rev.item}</Text>
                {rev.comment ? (
                  <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                ) : null}
                <Text style={styles.reviewDate}>{rev.date}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.emptyTitle}>No customer reviews yet</Text>
              <Text style={styles.emptyDescription}>
                Completed pickups rated by consumers will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* RECENT IMPACT LOG */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Recovery Milestones</Text>
          <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>
            Completed consumer rescues and Food Bank handoffs
          </Text>

          {recentImpact.length > 0 ? (
            recentImpact.map((act, index) => (
              <View
                key={act.id || index}
                style={[
                  styles.impactRow,
                  index === recentImpact.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View style={styles.impactIcon}>
                  <Ionicons
                    name={(act.icon || "leaf-outline") as any}
                    size={17}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.impactTitle}>{act.title}</Text>
                  <Text style={styles.impactDesc}>{act.description}</Text>
                </View>
                <Text style={styles.impactDate}>{act.date}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="leaf-outline" size={24} color={Colors.primary} />
              <Text style={styles.emptyTitle}>No recovery milestones yet</Text>
              <Text style={styles.emptyDescription}>
                Confirm customer pickups or fulfill Food Bank donations to build
                your store&apos;s sustainability log.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <EstablishmentBottomNav activeTab="Impact" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 28 },
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  pageSubTitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 2 },
  heroCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, marginBottom: 14 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 9.5, color: "rgba(255,255,255,0.8)", letterSpacing: 0.6 },
  heroBigValue: { fontFamily: "PoppinsBold", fontSize: 30, color: Colors.white, marginTop: 2 },
  heroSubLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: "rgba(255,255,255,0.85)" },
  heroIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.18)", marginVertical: 14 },
  heroMetricsRow: { flexDirection: "row", justifyContent: "space-between" },
  heroMetricItem: { flex: 1, alignItems: "center" },
  heroMetricNumber: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.white },
  heroMetricLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  statIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  statNumber: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary2 },
  statLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  sectionCard: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 16 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1 },
  pillBadge: { backgroundColor: "#E8EFEA", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  pillBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
  barChartRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 155, paddingTop: 18 },
  barCol: { flex: 1, alignItems: "center" },
  barValText: { fontFamily: "PoppinsMedium", fontSize: 9, color: Colors.primary1, marginBottom: 4 },
  barTrack: { width: 24, height: 110, backgroundColor: "#F2F5F3", borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 6 },
  barMonthText: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, marginTop: 6 },
  reviewItem: { backgroundColor: "#F7F9F7", borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewAuthor: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  reviewStars: { fontFamily: "PoppinsBold", fontSize: 12, color: "#D97706" },
  reviewProduct: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary, marginTop: 2 },
  reviewComment: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary2, marginTop: 4, lineHeight: 16 },
  reviewDate: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.placeholder, marginTop: 4 },
  impactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  impactIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  impactTitle: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.primary2 },
  impactDesc: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  impactDate: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder },
  emptyBox: { paddingVertical: 24, alignItems: "center" },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.primary2, marginTop: 6 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 10.5, color: Colors.primary1, textAlign: "center", marginTop: 2 },
});