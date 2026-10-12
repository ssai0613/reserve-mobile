import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

export default function PersonalInfo() {
  return (
    <SafeAreaView style={styles.container}>

      {/* =====================================================
          HEADER — SAME AS CART STYLE
      ===================================================== */}

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
            Personal Information
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage your account details
          </Text>
        </View>
      </View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* =================================================
            PROFILE ICON
        ================================================= */}

        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Ionicons
              name="person"
              size={40}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.profileTitle}>
            Your Information
          </Text>

          <Text style={styles.profileSubtitle}>
            Keep your personal details up to date.
          </Text>
        </View>

        {/* =================================================
            PERSONAL INFORMATION CARD
        ================================================= */}

        <View style={styles.formCard}>

          {/* FULL NAME */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={Colors.icon}
              />

              <TextInput
                style={styles.input}
                value="Sky"
                placeholder="Enter your full name"
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          {/* EMAIL */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Email Address
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={Colors.icon}
              />

              <TextInput
                style={styles.input}
                value="sky@email.com"
                placeholder="Enter your email"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* PHONE */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Phone Number
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={19}
                color={Colors.icon}
              />

              <TextInput
                style={styles.input}
                value="09XXXXXXXXX"
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

        </View>

        {/* =================================================
            SAVE BUTTON
        ================================================= */}

        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={19}
            color={Colors.white}
          />

          <Text style={styles.saveText}>
            Save Changes
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Your information is used to help manage your RESERVE account.
        </Text>

      </ScrollView>

    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =====================================================
     CONTAINER
  ===================================================== */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* =====================================================
     HEADER — MATCH CART
  ===================================================== */

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

  /* =====================================================
     CONTENT
  ===================================================== */

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 30,
  },

  /* =====================================================
     PROFILE SECTION
  ===================================================== */

  profileSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  profileCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  profileTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    lineHeight: 21,
    color: Colors.primary2,
  },

  profileSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* =====================================================
     FORM CARD
  ===================================================== */

  formCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
  },

  /* =====================================================
     FIELDS
  ===================================================== */

  fieldContainer: {
    marginBottom: 16,
  },

  fieldContainerLast: {
    marginBottom: 0,
  },

  label: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    lineHeight: 14,
    color: Colors.primary2,
    marginBottom: 6,
  },

  inputContainer: {
    height: 43,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.text,
    marginLeft: 8,
    paddingVertical: 0,
  },

  /* =====================================================
     SAVE BUTTON
  ===================================================== */

  saveButton: {
    height: 45,
    backgroundColor: Colors.button,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  saveText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.white,
    marginLeft: 6,
  },

  /* =====================================================
     NOTE
  ===================================================== */

  note: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 12,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});