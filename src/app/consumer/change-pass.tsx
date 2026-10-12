import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

export default function ChangePassword() {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Change Password
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>

        <Text style={styles.title}>
          Change your password
        </Text>

        <Text style={styles.subtitle}>
          Keep your account secure by using a strong password.
        </Text>

        {/* CURRENT PASSWORD */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Current Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Ionicons
              name="eye-outline"
              size={20}
              color="#777"
            />
          </View>
        </View>

        {/* NEW PASSWORD */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            New Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Ionicons
              name="eye-outline"
              size={20}
              color="#777"
            />
          </View>
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Confirm New Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              secureTextEntry
            />

            <Ionicons
              name="eye-outline"
              size={20}
              color="#777"
            />
          </View>
        </View>

        {/* CHANGE BUTTON */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            CHANGE PASSWORD
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F0F2",
  },

  /* HEADER */
  header: {
    height: 58,
    backgroundColor: "#A8D5BA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  backButton: {
    marginRight: 10,
  },

  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 18,
    color: Colors.primary,
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 18,
    paddingTop: 28,
  },

  title: {
    fontFamily: "PoppinsBold",
    fontSize: 20,
    color: "#222",
  },

  subtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    lineHeight: 18,
    color: "#777",
    marginTop: 5,
    marginBottom: 25,
  },

  /* INPUTS */
  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: "#333",
    marginBottom: 7,
  },

  inputContainer: {
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: 14,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 13,
    color: "#222",
  },

  /* BUTTON */
  button: {
    height: 52,
    backgroundColor: "#07532F",
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 8,
  },

  buttonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.white,
  },
});