import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      const res = await api.get(
        `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(storedEmail)}`
      );
      setNotifications(res.data?.notifications || []);
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with your RESERVE activity
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Recent Activity & Broadcasts</Text>

        {notifications.length > 0 ? (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={styles.notificationCard}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name={n.icon || "notifications-outline"}
                  size={21}
                  color={Colors.primary}
                />
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{n.title}</Text>
                <Text style={styles.notificationText}>{n.text}</Text>
                <Text style={styles.timeText}>{n.time}</Text>
              </View>

              {n.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.endText}>
            No notifications yet. Reserve a food item to see live updates!
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 70, paddingHorizontal: 18, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center" },
  backButton: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTextContainer: { marginLeft: 11 },
  headerTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, lineHeight: 21, color: Colors.primary2 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 8, lineHeight: 12, color: Colors.primary1, marginTop: 1 },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 30 },
  sectionTitle: { fontFamily: "PoppinsBold", fontSize: 15, lineHeight: 20, color: Colors.primary2, marginBottom: 10, marginTop: 2 },
  notificationCard: { width: "100%", minHeight: 86, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8EFEA", borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginRight: 11 },
  notificationContent: { flex: 1, paddingRight: 5 },
  notificationTitle: { fontFamily: "PoppinsSemiBold", fontSize: 10.5, lineHeight: 15, color: Colors.primary2, marginBottom: 2 },
  notificationText: { fontFamily: "PoppinsRegular", fontSize: 9, lineHeight: 14, color: Colors.primary1 },
  timeText: { fontFamily: "PoppinsRegular", fontSize: 7.5, lineHeight: 11, color: Colors.placeholder, marginTop: 5 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, alignSelf: "flex-start", marginTop: 5, marginLeft: 4 },
  endText: { fontFamily: "PoppinsRegular", fontSize: 10, lineHeight: 15, color: Colors.placeholder, textAlign: "center", marginTop: 20 },
});