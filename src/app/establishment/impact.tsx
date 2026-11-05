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
  View,
} from "react-native";
import { api } from "../../../services/api";
import {
  EstablishmentBottomNav,
  EstablishmentHeader,
} from "../components/EstablishmentNav";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function EstablishmentImpact() {
  const [foodRescuedKg, setFoodRescuedKg] = useState("0");
  const [peopleHelped, setPeopleHelped] = useState("0");
  const [successfulRescues, setSuccessfulRescues] = useState("0");
  const [co2AvoidedKg, setCo2AvoidedKg] = useState("0");
  const [portionsRescued, setPortionsRescued] = useState("0");
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([
    { month: "Jun", rescued: 0 },
    { month: "Jul", rescued: 0 },
    { month: "Aug", rescued: 0 },
    { month: "Sep", rescued: 0 },
    { month: "Oct", rescued: 0 },
    { month: "Nov", rescued: 0 },
  ]);
  const [recentImpact, setRecentImpact] = useState<any[]>([]);

  useEffect(() => {
    loadImpact();
  }, []);

  const loadImpact = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      const res = await api.get(
        `listings/merchant-portal/${storedId}/?email=${encodeURIComponent(
          storedEmail
        )}`
      );
      const p = res.data.profile;
      const imp = res.data.impact;
      if (p) {
        setAvgRating(Number(p.avg_rating || 0));
        setReviewCount(Number(p.review_count || 0));
        setReviews(Array.isArray(p.reviews) ? p.reviews : []);
      }
      if (imp) {
        setFoodRescuedKg(imp.food_rescued_kg || "0");
        setPeopleHelped(imp.people_helped || "0");
        setSuccessfulRescues(imp.successful_rescues || "0");
        setCo2AvoidedKg(imp.co2_avoided_kg || "0");
        setPortionsRescued(imp.portions_rescued || "0");
        if (Array.isArray(imp.monthly_data) && imp.monthly_data.length > 0) {
          setMonthlyData(imp.monthly_data);
        }
        setRecentImpact(imp.recent_impact || []);
      }
    } catch (e) {
      console.log("Impact fetch error:", e);
    }
  };

  const impactStats = [
    { icon: "leaf-outline", value: foodRescuedKg, label: "Food rescued", unit: "kg" },
    { icon: "people-outline", value: peopleHelped, label: "People helped", unit: "people" },
    { icon: "heart-outline", value: successfulRescues, label: "Successful rescues", unit: "rescues" },
    { icon: "cloud-outline", value: co2AvoidedKg, label: "CO₂ avoided", unit: "kg" },
  ];

  const maxBarVal = Math.max(100, ...monthlyData.map((d) => Number(d.rescued || 0)));

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      <EstablishmentHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Impact & Customer Reviews</Text>
          <Text style={styles.pageSubtitle}>
            Monitor your environmental contributions and consumer ratings
          </Text>
        </View>

        {/* CUSTOMER RATINGS & REVIEWS SECTION */}
        <View style={styles.ratingHeroCard}>
          <View style={styles.ratingHeroTop}>
            <View>
              <Text style={styles.ratingHeroLabel}>Overall Storefront Rating</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Text style={styles.ratingHeroScore}>
                  {reviewCount > 0 ? avgRating.toFixed(1) : "5.0"}
                </Text>
                <View>
                  <Text style={{ fontSize: 13 }}>
                    {"⭐".repeat(reviewCount > 0 ? Math.max(1, Math.round(avgRating)) : 5)}
                  </Text>
                  <Text style={styles.ratingHeroCount}>
                    Based on {reviewCount} verified consumer {reviewCount === 1 ? "review" : "reviews"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {reviews.length > 0 ? (
            <View style={{ marginTop: 14, gap: 10 }}>
              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItemCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.reviewConsumerName}>
                      {rev.consumer} • {"⭐".repeat(rev.score)} ({rev.score}/5)
                    </Text>
                    <Text style={styles.reviewDateText}>{rev.date}</Text>
                  </View>
                  <Text style={styles.reviewItemBadge}>Item: {rev.item}</Text>
                  {rev.comment ? (
                    <Text style={styles.reviewCommentText}>"{rev.comment}"</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.ratingHeroCount, { marginTop: 10 }]}>
              No customer reviews submitted yet. Reviews will appear here as consumers complete pickups!
            </Text>
          )}
        </View>

        <View style={styles.impactHero}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf" size={28} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Making a difference</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroNumber}>{foodRescuedKg} kg</Text>
              <Text style={styles.heroLabel}>total food rescued</Text>
            </View>
            <View style={styles.heroLeafIcon}>
              <Ionicons name="trending-up-outline" size={19} color={Colors.button} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Impact overview</Text>
          <Text style={styles.sectionSubtitle}>Your contribution so far</Text>
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly food rescue</Text>
          <Text style={styles.sectionSubtitle}>Food rescued over the last 6 months</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartTop}>
            <View>
              <Text style={styles.chartTotal}>{foodRescuedKg} kg</Text>
              <Text style={styles.chartLabel}>Total rescued</Text>
            </View>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up-outline" size={13} color={Colors.button} />
              <Text style={styles.growthText}>Live</Text>
            </View>
          </View>

          <View style={styles.chart}>
            <View style={styles.chartYAxis}>
              <Text style={styles.axisText}>{maxBarVal}</Text>
              <Text style={styles.axisText}>{Math.round(maxBarVal * 0.66)}</Text>
              <Text style={styles.axisText}>{Math.round(maxBarVal * 0.33)}</Text>
              <Text style={styles.axisText}>0</Text>
            </View>

            <View style={styles.chartArea}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />

              <View style={styles.barsRow}>
                {monthlyData.map((item) => {
                  const height = Math.max(8, (Number(item.rescued || 0) / maxBarVal) * 125);
                  return (
                    <View key={item.month} style={styles.barColumn}>
                      <View style={[styles.bar, { height }]} />
                      <Text style={styles.barLabel}>{item.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community impact</Text>
          <Text style={styles.sectionSubtitle}>How your food rescue helps people</Text>
        </View>

        <View style={styles.communityCard}>
          <ImpactRow
            icon="people-outline"
            title="People supported"
            value={peopleHelped}
            description="Consumers and community members benefited from your listings."
          />
          <View style={styles.impactDivider} />
          <ImpactRow
            icon="restaurant-outline"
            title="Food portions rescued"
            value={portionsRescued}
            description="Estimated portions saved from going to waste."
          />
          <View style={styles.impactDivider} />
          <ImpactRow
            icon="leaf-outline"
            title="Waste prevented"
            value={`${foodRescuedKg} kg`}
            description="Surplus food redirected to consumers and food banks."
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent impact</Text>
          <Text style={styles.sectionSubtitle}>Your latest contributions</Text>
        </View>

        <View style={styles.recentCard}>
          {recentImpact.length > 0 ? (
            recentImpact.map((impact, index) => (
              <View
                key={impact.id}
                style={[styles.recentRow, index === recentImpact.length - 1 && styles.recentRowLast]}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name={impact.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.recentContent}>
                  <Text style={styles.recentTitle}>{impact.title}</Text>
                  <Text style={styles.recentDescription}>{impact.description}</Text>
                </View>
                <Text style={styles.recentDate}>{impact.date}</Text>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text style={styles.recentDescription}>Completed rescues and donations will appear here.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>

      <EstablishmentBottomNav activeTab="Impact" />
    </SafeAreaView>
  );
}

function ImpactStatCard({ icon, value, label, unit }: { icon: any; value: string; label: string; unit: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function ImpactRow({ icon, title, value, description }: { icon: any; title: string; value: string; description: string }) {
  return (
    <View style={styles.impactRow}>
      <View style={styles.impactRowIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.impactRowContent}>
        <Text style={styles.impactRowTitle}>{title}</Text>
        <Text style={styles.impactRowDescription}>{description}</Text>
      </View>
      <Text style={styles.impactRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 90 },
  pageHeader: { marginBottom: 16 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 24, lineHeight: 31, color: Colors.primary2 },
  pageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  ratingHeroCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 20 },
  ratingHeroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ratingHeroLabel: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  ratingHeroScore: { fontFamily: "PoppinsBold", fontSize: 32, color: Colors.primary },
  ratingHeroCount: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  reviewItemCard: { backgroundColor: "#F8FAF9", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  reviewConsumerName: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  reviewDateText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon },
  reviewItemBadge: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: Colors.primary, marginTop: 2 },
  reviewCommentText: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, marginTop: 4, fontStyle: "italic" },
  impactHero: { backgroundColor: Colors.primary, borderRadius: 14, padding: 18, marginBottom: 24 },
  heroIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontFamily: "PoppinsBold", fontSize: 19, color: Colors.white },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.18)", marginVertical: 14 },
  heroBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroNumber: { fontFamily: "PoppinsBold", fontSize: 22, color: Colors.white },
  heroLabel: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: "#D8E3DD", marginTop: 1 },
  heroLeafIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 24 },
  statCard: { width: "48.5%", backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  statIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary },
  statLabel: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary2, marginTop: 2 },
  statUnit: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  chartCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 24 },
  chartTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  chartTotal: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary },
  chartLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  growthBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#E7F0E9", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  growthText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.button, marginLeft: 4 },
  chart: { height: 165, flexDirection: "row" },
  chartYAxis: { width: 35, height: 135, justifyContent: "space-between", alignItems: "flex-start" },
  axisText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  chartArea: { flex: 1, height: 150, position: "relative", justifyContent: "flex-end" },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: Colors.border },
  barsRow: { height: 150, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingHorizontal: 8 },
  barColumn: { height: 150, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: 26, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: Colors.button, marginBottom: 8 },
  barLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  communityCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 24 },
  impactRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13 },
  impactRowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 12 },
  impactRowContent: { flex: 1 },
  impactRowTitle: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary2 },
  impactRowDescription: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 15, marginTop: 2 },
  impactRowValue: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary },
  impactDivider: { height: 1, backgroundColor: Colors.border },
  recentCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, marginBottom: 24 },
  recentRow: { minHeight: 72, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentRowLast: { borderBottomWidth: 0 },
  recentIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 11 },
  recentContent: { flex: 1 },
  recentTitle: { fontFamily: "PoppinsMedium", fontSize: 12.5, color: Colors.primary2 },
  recentDescription: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 15, marginTop: 2, paddingRight: 6 },
  recentDate: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, alignSelf: "flex-start", marginTop: 18 },
});