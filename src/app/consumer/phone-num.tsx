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

export default function PhoneNumber() {
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
          Phone Number
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>

        <Text style={styles.title}>
          Update your phone number
        </Text>

        <Text style={styles.subtitle}>
          Add or update your phone number to keep your
          account information up to date.
        </Text>

        {/* CURRENT PHONE */}
        <View style={styles.currentContainer}>
          <Text style={styles.currentLabel}>
            Current Phone Number
          </Text>

          <View style={styles.currentRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.primary}
            />

            <Text style={styles.currentNumber}>
              +63 9XX XXX XXXX
            </Text>
          </View>
        </View>

        {/* NEW PHONE NUMBER */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            New Phone Number
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="+63 9XX XXX XXXX"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* UPDATE BUTTON */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            UPDATE NUMBER
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

  /* CURRENT NUMBER */
  currentContainer: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },

  currentLabel: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: "#777",
    marginBottom: 6,
  },

  currentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  currentNumber: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: "#222",
    marginLeft: 10,
  },

  /* INPUT */
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