import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import {
  FoodBankBottomNav,
  FoodBankHeader,
  getFoodBankStorage,
  setFoodBankStorage,
  switchFoodBankTab,
  useIsInsideFoodBankShell,
} from "../components/FoodBankNav";

let cachedFbDashboardMemory: any | null = null;

export default function FoodBankDashboard() {
  const isInsideShell = useIsInsideFoodBankShell();
  if (!isInsideShell) return null;

  const [data, setData] = useState<any | null>(cachedFbDashboardMemory);
  const [radiusKm, setRadiusKm] = useState<number>(
    Number(cachedFbDashboardMemory?.radius_km || 10)
  );
  const [loading, setLoading] = useState(!cachedFbDashboardMemory);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const orgId = (await getFoodBankStorage("profile_id")) || "1";
      const email = (await getFoodBankStorage("user_email")) || "";
      const response = await api.get(
        `donations/dashboard/?org_id=${orgId}&email=${encodeURIComponent(
          email
        )}`
      );
      cachedFbDashboardMemory = response.data;
      setData(response.data);

      const liveRadius = Number(
        response.data?.radius_km ?? response.data?.stats?.radius_km ?? 10
      );
      if (liveRadius > 0) {
        setRadiusKm(liveRadius);
        await setFoodBankStorage("gov_radius_km", String(liveRadius));
        DeviceEventEmitter.emit("fb_radius_updated", { radiusKm: liveRadius });
      }
    } catch (e) {
      console.log("FoodBank dashboard error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const reqSub = DeviceEventEmitter.addListener("fb_requests_updated", () => {
      loadDashboard();
    });
    const donSub = DeviceEventEmitter.addListener(
      "fb_donations_updated",
      () => {
        loadDashboard();
      }
    );
    const profSub = DeviceEventEmitter.addListener("fb_profile_updated", () => {
      loadDashboard();
    });

    return () => {
      reqSub.remove();
      donSub.remove();
      profSub.remove();
    };
  }, [loadDashboard]);

  const stats = data?.stats;

  return (
    <View style={styles.container}>
      <FoodBankHeader />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDashboard(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.orgTitle}>
              {data?.org_name || "Food Bank Partner"}
            </Text>
          </View>

          {stats && (
            <View style={styles.statsGrid}>
              <StatCard
                icon="document-text-outline"
                label="Active Requests"
                value={String(stats.active_requests || 0)}
                onPress={() => switchFoodBankTab("Requests")}
              />
              <StatCard
                icon="gift-outline"
                label={`${radiusKm}km Donations`}
                value={String(stats.offers_available || 0)}
                onPress={() => switchFoodBankTab("Donations")}
              />
              <StatCard
                icon="storefront-outline"
                label={`${radiusKm}km Merchants`}
                value={String(stats.partners || 0)}
                onPress={() => switchFoodBankTab("Partners")}
              />
              <StatCard
                icon="heart-outline"
                label="Units Rescued"
                value={String(Math.round(stats.food_received || 0))}
                onPress={() => switchFoodBankTab("Requests")}
              />
            </View>
          )}

          {/* BROWSE MERCHANTS & BULK REQUEST CTA */}
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.85}
            onPress={() => switchFoodBankTab("Partners")}
          >
            <View style={styles.createIcon}>
              <Ionicons name="storefront" size={21} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createTitle}>
                Browse Merchants Within {radiusKm}km
              </Text>
              <Text style={styles.createSubtitle}>
                View active listings and send single or bulk donation requests
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>

          {/* POSTED DONATIONS RUNNING OUT OF TIME */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Available Surplus Donations
              </Text>
              <Text style={styles.sectionSubtitle}>
                Posted by merchants within your {radiusKm}km Cebu City radius
              </Text>
            </View>
            <TouchableOpacity onPress={() => switchFoodBankTab("Donations")}>
              <Text style={styles.viewAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {Array.isArray(data?.urgent_offers) &&
          data.urgent_offers.length > 0 ? (
            data.urgent_offers.slice(0, 3).map((offer: any) => (
              <TouchableOpacity
                key={offer.donation_id}
                style={styles.uiCard}
                activeOpacity={0.85}
                onPress={() => switchFoodBankTab("Donations")}
              >
                <View style={styles.uiCardTop}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="gift-outline"
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uiCardTitle} numberOfLines={1}>
                      {offer.food_name} ({offer.qty_donated}{" "}
                      {offer.unit_name || "items"})
                    </Text>
                    <Text style={styles.uiCardSubtitle}>
                      {offer.merchant_name} • {offer.food_type}
                    </Text>
                    <Text style={styles.explicitExpiry}>
                      Exp: {offer.expiry_display || "Standard Window"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.icon}
                  />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.softCard}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.softCardText}>
                No urgent posted donations right now. Tap &quot;Browse Merchants
                Within {radiusKm}km&quot; above to request active listings!
              </Text>
            </View>
          )}

          {/* RECENT ACTIVITY */}
          <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
            <View>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.sectionSubtitle}>
                Latest updates on your requests and donations
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/foodbank/notifications")}
            >
              <Text style={styles.viewAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {Array.isArray(data?.recent_activity) &&
            data.recent_activity.length > 0 ? (
              data.recent_activity.map((ev: any, idx: number) => (
                <TouchableOpacity
                  key={ev.id || idx}
                  style={[
                    styles.activityItem,
                    idx === data.recent_activity.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    const route = String(ev.target_route || "");
                    if (route.includes("/partners")) {
                      switchFoodBankTab("Partners");
                    } else if (
                      route.includes("/requests") ||
                      ev.type === "request"
                    ) {
                      switchFoodBankTab("Requests");
                    } else {
                      switchFoodBankTab("Donations");
                    }
                  }}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name={
                        ev.type === "request"
                          ? "document-text-outline"
                          : "gift-outline"
                      }
                      size={18}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{ev.title}</Text>
                    <Text style={styles.activityDesc}>{ev.detail}</Text>
                    <Text style={styles.activityDate}>{ev.time}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.icon}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyActivityText}>
                No recent activity recorded yet.
              </Text>
            )}
          </View>
        </ScrollView>
      )}

      <FoodBankBottomNav activeTab="Home" />
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon: any;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.statTop}>
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statNumber}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 28 },
  welcomeSection: { marginBottom: 16 },
  welcomeText: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary1 },
  orgTitle: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  statCard: { width: "48.5%", backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, minHeight: 88, marginBottom: 10 },
  statTop: { flexDirection: "row", alignItems: "center" },
  statIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#E5EDE7", alignItems: "center", justifyContent: "center", marginRight: 8 },
  statLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, flex: 1 },
  statNumber: { fontFamily: "PoppinsBold", fontSize: 23, color: Colors.primary2, marginTop: 6 },
  createButton: { minHeight: 66, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", marginBottom: 22 },
  createIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginRight: 12 },
  createTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.white },
  createSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: "#D8E3DD", marginTop: 1 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 17, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1 },
  viewAllText: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.button },
  uiCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  uiCardTop: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  uiCardTitle: { fontFamily: "PoppinsSemiBold", fontSize: 14, color: Colors.primary2 },
  uiCardSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1 },
  explicitExpiry: { fontFamily: "PoppinsMedium", fontSize: 10.5, color: "#A94A3A", marginTop: 2 },
  softCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  softCardText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1, lineHeight: 16 },
  activityCard: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  activityIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center" },
  activityTitle: { fontFamily: "PoppinsSemiBold", fontSize: 12.5, color: Colors.primary2 },
  activityDesc: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  activityDate: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, marginTop: 3 },
  emptyActivityText: { textAlign: "center", paddingVertical: 20, fontFamily: "PoppinsRegular", fontSize: 11.5, color: Colors.primary1 },
});