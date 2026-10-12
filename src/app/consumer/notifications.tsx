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

export default function Notifications() {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER — SAME AS CART STYLE */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={Colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          <Text style={styles.headerSubtitle}>
            Stay updated with your RESERVE activity
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* TODAY */}
        <Text style={styles.sectionTitle}>
          Today
        </Text>

        {/* Reservation Confirmed */}
        <TouchableOpacity
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="checkmark-circle-outline"
              size={21}
              color={Colors.primary}
            />
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              Reservation Confirmed
            </Text>

            <Text style={styles.notificationText}>
              Your reservation for Pan Lamion has been confirmed.
            </Text>

            <Text style={styles.timeText}>
              10 minutes ago
            </Text>
          </View>

          <View style={styles.unreadDot} />
        </TouchableOpacity>

        {/* Reminder */}
        <TouchableOpacity
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="time-outline"
              size={21}
              color={Colors.primary}
            />
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              Rescue Reminder
            </Text>

            <Text style={styles.notificationText}>
              Don't forget to claim your rescued food before 4:30 PM.
            </Text>

            <Text style={styles.timeText}>
              1 hour ago
            </Text>
          </View>

          <View style={styles.unreadDot} />
        </TouchableOpacity>

        {/* YESTERDAY */}
        <Text style={styles.sectionTitle}>
          Yesterday
        </Text>

        {/* New Rescue */}
        <TouchableOpacity
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="heart-outline"
              size={21}
              color={Colors.primary}
            />
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              New Rescue Available
            </Text>

            <Text style={styles.notificationText}>
              New rescued food items are available near you.
            </Text>

            <Text style={styles.timeText}>
              Yesterday
            </Text>
          </View>
        </TouchableOpacity>

        {/* Savings */}
        <TouchableOpacity
          style={styles.notificationCard}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="pricetag-outline"
              size={21}
              color={Colors.primary}
            />
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              Great Savings!
            </Text>

            <Text style={styles.notificationText}>
              You saved ₱50.00 from your recent rescue.
            </Text>

            <Text style={styles.timeText}>
              Yesterday
            </Text>
          </View>
        </TouchableOpacity>

        {/* FOOTER */}
        <Text style={styles.endText}>
          You're all caught up!
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* =========================
     HEADER — CART STYLE
  ========================= */

  header: {
    height: 70,
    paddingHorizontal: 18,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    marginLeft: 11,
  },

  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 16,
    lineHeight: 21,
    color: Colors.primary2,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 12,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* =========================
     CONTENT
  ========================= */

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 30,
  },

  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    lineHeight: 20,
    color: Colors.primary2,
    marginBottom: 10,
    marginTop: 2,
  },

  /* =========================
     NOTIFICATION CARD
  ========================= */

  notificationCard: {
    width: "100%",
    minHeight: 86,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
    paddingVertical: 12,

    marginBottom: 10,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  notificationContent: {
    flex: 1,
    paddingRight: 5,
  },

  notificationTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    lineHeight: 15,
    color: Colors.primary2,
    marginBottom: 2,
  },

  notificationText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 14,
    color: Colors.primary1,
  },

  timeText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: Colors.placeholder,
    marginTop: 5,
  },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
    marginTop: 5,
    marginLeft: 4,
  },

  /* =========================
     FOOTER
  ========================= */

  endText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 8,
  },
});