import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";
import { getAppStorage, setAppStorage } from "../components/EstablishmentNav";

type BroadcastItem = {
  id: string;
  audience: string;
  title: string;
  body: string;
  date: string;
};

export default function EstablishmentAnnouncements() {
  const [announcements, setAnnouncements] = useState<BroadcastItem[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("listings/announcements/");
      const list: BroadcastItem[] = Array.isArray(res.data) ? res.data : [];
      setAnnouncements(list);

      // Mark all announcements as viewed so the Megaphone numeric badge clears
      const seenRaw = (await getAppStorage("seen_announce_ids")) || "[]";
      const seenIds: string[] = JSON.parse(seenRaw);
      const updatedSeen = Array.from(
        new Set([...seenIds, ...list.map((a) => String(a.id))])
      );
      await setAppStorage("seen_announce_ids", JSON.stringify(updatedSeen));
    } catch (e) {
      console.warn("Failed to load announcements:", e);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/establishment/dashboard");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ animation: "slide_from_right", headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>System Announcements</Text>
          <Text style={styles.headerSubtitle}>
            Official broadcasts & platform updates from ReServe Admin
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {announcements.length > 0 ? (
          announcements.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.badgeRow}>
                <View style={styles.audienceBadge}>
                  <Ionicons name="megaphone" size={12} color={Colors.primary} />
                  <Text style={styles.audienceText}>{b.audience}</Text>
                </View>
                <Text style={styles.dateText}>{b.date}</Text>
              </View>
              <Text style={styles.title}>{b.title}</Text>
              <Text style={styles.body}>{b.body}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="megaphone-outline" size={26} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No system announcements</Text>
            <Text style={styles.emptyDesc}>
              Official platform updates and maintenance broadcasts published by
              the Admin team will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    minHeight: 70,
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    color: Colors.primary2,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    marginTop: -2,
  },
  scrollContent: { padding: 17, gap: 12 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  audienceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E7F0E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audienceText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
  dateText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
  },
  title: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
    marginBottom: 4,
  },
  body: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E7EEE9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  emptyDesc: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 4,
  },
});