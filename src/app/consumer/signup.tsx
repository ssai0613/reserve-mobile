import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { api } from "../../../services/api";

export default function ConsumerSignup() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortPhone = height < 700;

  const horizontalPadding = isSmallPhone ? 12 : 16;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const handleSignup = async () => {
    // Basic validation
    if (!email || !password || !fullName) {
      alert("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!isAgreed) {
      alert("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    try {
      // Send the request to your Django registration endpoint
      const response = await api.post("register/", {
        user_email: email,
        user_pass: password,
        user_role: "Consumer",
        full_name: fullName, 
        phone_number: phone
      });

      alert("Account created successfully! Please log in.");
      // Send the user to the login screen we just wired up
      router.replace("/consumer");
      
    } catch (error) {
      const err = error as any;
      // Example of cleaner error parsing (adjust based on your Django response format)
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'object' && errorData !== null 
        ? Object.values(errorData).flat().join('\n') 
        : "Registration failed.";
        
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isShortPhone ? 12 : 18,
            paddingBottom: isShortPhone ? 18 : 28,
          },
        ]}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/consumer/account-type")}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={Colors.primary2}
            />

            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* =====================================================
            BRAND
        ===================================================== */}

        <View style={styles.brandContainer}>
          <Text
            style={[
              styles.logo,
              {
                fontSize: isSmallPhone ? 30 : 34,
              },
            ]}
          >
            RESERVE
          </Text>

          <View style={styles.logoLine} />

          <Text style={styles.brandSubtitle}>
            Food rescue made simple
          </Text>
        </View>

        {/* =====================================================
            MAIN CARD
        ===================================================== */}

        <View
          style={[
            styles.card,
            {
              paddingHorizontal: isSmallPhone ? 17 : 20,
              paddingTop: isShortPhone ? 18 : 22,
              paddingBottom: isShortPhone ? 18 : 22,
            },
          ]}
        >
          {/* TITLE */}

          <Text style={styles.title}>Create your account</Text>

          <Text style={styles.subtitle}>
            Join RESERVE and discover affordable surplus food
            available near you.
          </Text>

          {/* =================================================
              FULL NAME
          ================================================= */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="e.g. Sky Cogtas"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* =================================================
              EMAIL
          ================================================= */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email Address</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="e.g. user@email.com"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* =================================================
              PHONE
          ================================================= */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Phone Number</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="+639##-###-####"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Confirm Password</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* =================================================
              TERMS
          ================================================= */}

          <TouchableOpacity
            style={styles.termsContainer}
            activeOpacity={0.7}
            onPress={() => setIsAgreed(!isAgreed)}
          >
            <View style={[styles.checkbox, !isAgreed && { backgroundColor: Colors.input }]}>
              {isAgreed && (
                <Ionicons
                  name="checkmark"
                  size={11}
                  color={Colors.white}
                />
              )}
            </View>

            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.termsLink}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text style={styles.termsLink}>
                Privacy Policy
              </Text>
              .
            </Text>
          </TouchableOpacity>

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.8}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.submitText}>
              {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>

          {/* =================================================
              LOGIN
          ================================================= */}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Link href="/consumer" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.loginLink}>
                  {" "}Log in
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },

  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    width: "100%",
    maxWidth: 500,
    marginBottom: 8,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingRight: 10,
  },

  backText: {
    fontFamily: "PoppinsMedium",
    fontSize: 13,
    color: Colors.primary2,
    marginLeft: 5,
  },

  /* ==========================================================
     BRAND
  ========================================================== */

  brandContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  logo: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 1.5,
  },

  logoLine: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.button,
    marginTop: 5,
    marginBottom: 5,
  },

  brandSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
  },

  /* ==========================================================
     CARD
  ========================================================== */

  card: {
    width: "100%",
    maxWidth: 440,

    backgroundColor: Colors.white,

    borderRadius: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,

    elevation: 4,
  },

  /* ==========================================================
     TITLE
  ========================================================== */

  title: {
    fontFamily: "PoppinsBold",
    fontSize: 21,
    color: Colors.primary2,
    marginBottom: 4,
  },

  subtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    lineHeight: 16,
    color: Colors.primary1,
    marginBottom: 20,
  },

  /* ==========================================================
     INPUT FIELDS
  ========================================================== */

  fieldContainer: {
    width: "100%",
    marginBottom: 13,
  },

  label: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
    marginBottom: 6,
  },

  inputContainer: {
    width: "100%",
    height: 46,

    backgroundColor: Colors.input,

    borderRadius: 11,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,
  },

  inputIcon: {
    marginRight: 9,
    flexShrink: 0,
  },

  input: {
    flex: 1,
    minWidth: 0,

    height: "100%",

    paddingVertical: 0,
    paddingHorizontal: 0,

    fontFamily: "PoppinsRegular",
    fontSize: 11.5,
    color: Colors.primary2,
  },

  /* ==========================================================
     TERMS
  ========================================================== */

  termsContainer: {
    width: "100%",

    flexDirection: "row",
    alignItems: "flex-start",

    marginTop: 3,
    marginBottom: 18,
  },

  checkbox: {
    width: 16,
    height: 16,

    borderRadius: 4,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 8,
    marginTop: 1,
  },

  termsText: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,

    color: Colors.primary1,
  },

  termsLink: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  /* ==========================================================
     BUTTON
  ========================================================== */

  submitButton: {
    width: "100%",
    height: 47,

    backgroundColor: Colors.button,

    borderRadius: 11,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,

    elevation: 3,
  },

  submitText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.white,
    marginRight: 8,
  },

  /* ==========================================================
     LOGIN
  ========================================================== */

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    marginTop: 17,
  },

  loginText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
  },

  loginLink: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.button,
  },
});