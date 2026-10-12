import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Responsive screen detection
  const isVeryShortPhone = height < 620;
  const isShortPhone = height < 700;
  const isNarrowPhone = width < 360;

  const horizontalPadding = isNarrowPhone
    ? 16
    : width < 400
    ? 20
    : 28;

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/accounts/login/", {
        user_email: email,
        user_pass: password,
      });

      // Securely store the JWT tokens
      await SecureStore.setItemAsync("access", response.data.access);
      await SecureStore.setItemAsync("refresh", response.data.refresh);
      await SecureStore.setItemAsync("user_role", response.data.role);

      // Navigate based on role
      if (response.data.role === 'Consumer') {
        router.replace("/consumer/homepage");
      } else if (response.data.role === 'Merchant') {
        router.replace("/establishment/dashboard");
      } else {
        router.replace("/foodbank/dashboard");
      }
      
    } catch (error) {
      const err = error as any;
      const errorMessage = err.response?.data?.error || "Failed to log in. Check your credentials.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      <TouchableOpacity
        style={[
          styles.backButton,
          {
            left: horizontalPadding,
            top: isVeryShortPhone ? 10 : isShortPhone ? 14 : 20,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => router.replace("/")}
      >
        <Ionicons
          name="arrow-back"
          size={isVeryShortPhone ? 20 : 22}
          color={Colors.primary2}
        />

        
      </TouchableOpacity>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <View
        style={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,

            paddingTop: isVeryShortPhone
              ? 45
              : isShortPhone
              ? 58
              : 82,
          },
        ]}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <View
          style={[
            styles.logoContainer,
            {
              marginBottom: isVeryShortPhone
                ? 12
                : isShortPhone
                ? 16
                : 24,
            },
          ]}
        >
          <Text
            style={[
              styles.logo,
              {
                fontSize: isNarrowPhone
                  ? 32
                  : width < 400
                  ? 36
                  : 42,
              },
            ]}
          >
            RESERVE
          </Text>

          <View
            style={[
              styles.logoAccent,
              {
                marginTop: isVeryShortPhone ? 3 : 5,
                marginBottom: isVeryShortPhone ? 3 : 5,
              },
            ]}
          />

          <Text
            style={[
              styles.logoSubtitle,
              {
                fontSize: isVeryShortPhone ? 9 : 10,
              },
            ]}
          >
            Food rescue made simple
          </Text>
        </View>

        {/* =================================================
            LOGIN CARD
        ================================================= */}

        <View
          style={[
            styles.card,
            {
              paddingHorizontal: isNarrowPhone
                ? 18
                : width < 400
                ? 22
                : 28,

              paddingVertical: isVeryShortPhone
                ? 15
                : isShortPhone
                ? 19
                : 28,
            },
          ]}
        >
          {/* TITLE */}

          <View
            style={[
              styles.titleContainer,
              {
                marginBottom: isVeryShortPhone
                  ? 15
                  : isShortPhone
                  ? 19
                  : 25,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  fontSize: isVeryShortPhone ? 21 : 24,
                },
              ]}
            >
              LOG IN
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: isVeryShortPhone ? 10 : 11,
                },
              ]}
            >
              Access your RESERVE account
            </Text>
          </View>

          {/* =================================================
              EMAIL
          ================================================= */}

          <View
            style={[
              styles.fieldContainer,
              {
                marginBottom: isVeryShortPhone
                  ? 10
                  : isShortPhone
                  ? 13
                  : 17,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  fontSize: isVeryShortPhone ? 11 : 12,
                },
              ]}
            >
              Email Address
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  height: isVeryShortPhone
                    ? 44
                    : isShortPhone
                    ? 47
                    : 50,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={isVeryShortPhone ? 18 : 20}
                color={Colors.icon}
                style={styles.inputIcon}
              />

              <TextInput
                style={[styles.input, { fontSize: isVeryShortPhone ? 11 : 12 }]}
                placeholder="user@email.com"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                value={email} // <-- ADD THIS
                onChangeText={setEmail} // <-- ADD THIS
              />
            </View>
          </View>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <View
            style={[
              styles.fieldContainer,
              {
                marginBottom: isVeryShortPhone
                  ? 10
                  : isShortPhone
                  ? 13
                  : 17,
              },
            ]}
          >
            <View style={styles.passwordLabelRow}>
              <TextInput
                style={[styles.input, { fontSize: isVeryShortPhone ? 11 : 12 }]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                value={password} // <-- ADD THIS
                onChangeText={setPassword} // <-- ADD THIS
              />

              <TouchableOpacity activeOpacity={0.7}>
                <Text
                  style={[
                    styles.forgotText,
                    {
                      fontSize: isVeryShortPhone ? 9 : 10,
                    },
                  ]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  height: isVeryShortPhone
                    ? 44
                    : isShortPhone
                    ? 47
                    : 50,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={isVeryShortPhone ? 18 : 20}
                color={Colors.icon}
                style={styles.inputIcon}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    fontSize: isVeryShortPhone ? 11 : 12,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.placeholder}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                numberOfLines={1}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="eye-outline"
                  size={isVeryShortPhone ? 18 : 20}
                  color={Colors.icon}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <TouchableOpacity
            style={[styles.loginButton, { height: isVeryShortPhone ? 44 : 47 }]}
            activeOpacity={0.8}
            onPress={handleLogin} // <-- CHANGED THIS FROM router.replace
            disabled={isLoading} // <-- ADD THIS
          >
            <Text style={[styles.loginButtonText, { fontSize: isVeryShortPhone ? 12 : 13 }]}>
              {isLoading ? "LOGGING IN..." : "LOG IN"}
            </Text>
            <Ionicons name="arrow-forward" size={isVeryShortPhone ? 16 : 18} color={Colors.white} />
          </TouchableOpacity>

          {/* =================================================
              DIVIDER
          ================================================= */}

          <View
            style={[
              styles.dividerContainer,
              {
                marginVertical: isVeryShortPhone
                  ? 13
                  : isShortPhone
                  ? 16
                  : 21,
              },
            ]}
          >
            <View style={styles.divider} />

            <Text
              style={[
                styles.dividerText,
                {
                  fontSize: isVeryShortPhone ? 8 : 9,
                },
              ]}
            >
              or continue with
            </Text>

            <View style={styles.divider} />
          </View>

          {/* =================================================
              SOCIAL LOGIN
          ================================================= */}

          <View
            style={[
              styles.socialContainer,
              {
                gap: isVeryShortPhone ? 9 : 13,
              },
            ]}
          >
            {/* GOOGLE */}

            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  width: isVeryShortPhone ? 40 : 46,
                  height: isVeryShortPhone ? 40 : 46,
                  borderRadius: isVeryShortPhone ? 11 : 13,
                },
              ]}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/google.png")}
                style={[
                  styles.googleLogo,
                  {
                    width: isVeryShortPhone ? 19 : 22,
                    height: isVeryShortPhone ? 19 : 22,
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* FACEBOOK */}

            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  width: isVeryShortPhone ? 40 : 46,
                  height: isVeryShortPhone ? 40 : 46,
                  borderRadius: isVeryShortPhone ? 11 : 13,
                },
              ]}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/facebook.png")}
                style={[
                  styles.facebookLogo,
                  {
                    width: isVeryShortPhone ? 22 : 25,
                    height: isVeryShortPhone ? 22 : 25,
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* GITHUB */}

            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  width: isVeryShortPhone ? 40 : 46,
                  height: isVeryShortPhone ? 40 : 46,
                  borderRadius: isVeryShortPhone ? 11 : 13,
                },
              ]}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/github.png")}
                style={[
                  styles.githubLogo,
                  {
                    width: isVeryShortPhone ? 21 : 24,
                    height: isVeryShortPhone ? 21 : 24,
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* =================================================
              SIGN UP
          ================================================= */}

          <View
            style={[
              styles.signupContainer,
              {
                marginTop: isVeryShortPhone
                  ? 13
                  : isShortPhone
                  ? 16
                  : 21,
              },
            ]}
          >
            <Text
              style={[
                styles.signupText,
                {
                  fontSize: isVeryShortPhone ? 9 : 10,
                },
              ]}
            >
              Don't have an account?
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.push("/consumer/account-type")
              }
            >
              <Text
                style={[
                  styles.signupLink,
                  {
                    fontSize: isVeryShortPhone ? 9 : 10,
                  },
                ]}
              >
                {" "}Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================
            BOTTOM BRAND TEXT
        ================================================= */}

        {!isShortPhone && (
          <Text style={styles.bottomText}>
            Save food. Support communities.
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* =======================================================
     BACK BUTTON
  ======================================================= */

  backButton: {
    position: "absolute",
    zIndex: 10,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 7,
    paddingHorizontal: 4,
  },

  backText: {
    fontFamily: "PoppinsMedium",
    color: Colors.primary2,
    marginLeft: 5,
  },

  /* =======================================================
     LOGO
  ======================================================= */

  logoContainer: {
    alignItems: "center",
  },

  logo: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 2,
    textAlign: "center",
  },

  logoAccent: {
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },

  logoSubtitle: {
    fontFamily: "PoppinsRegular",
    color: Colors.primary1,
    letterSpacing: 0.2,
  },

  /* =======================================================
     LOGIN CARD
  ======================================================= */

  card: {
    width: "100%",
    maxWidth: 420,

    backgroundColor: Colors.white,
    borderRadius: 20,

    shadowColor: "#12372C",

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.10,
    shadowRadius: 18,

    elevation: 5,
  },

  /* =======================================================
     TITLE
  ======================================================= */

  titleContainer: {
    alignItems: "center",
  },

  title: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 0.4,
  },

  subtitle: {
    fontFamily: "PoppinsRegular",
    color: Colors.primary1,
    marginTop: 3,
  },

  /* =======================================================
     FIELDS
  ======================================================= */

  fieldContainer: {
    width: "100%",
  },

  label: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
    marginBottom: 7,
  },

  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  forgotText: {
    fontFamily: "PoppinsMedium",
    color: Colors.primary,
    marginBottom: 7,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputWrapper: {
    width: "100%",

    backgroundColor: Colors.input,
    borderRadius: 12,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",
  },

  inputIcon: {
    marginLeft: 14,
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: "100%",

    paddingHorizontal: 0,
    paddingVertical: 0,

    fontFamily: "PoppinsRegular",
    color: Colors.primary2,

    includeFontPadding: false,
  },

  eyeButton: {
    paddingHorizontal: 14,
    height: "100%",

    alignItems: "center",
    justifyContent: "center",
  },

  /* =======================================================
     LOGIN BUTTON
  ======================================================= */

  loginButton: {
    width: "100%",

    backgroundColor: Colors.primary,
    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    shadowColor: Colors.primary,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.18,
    shadowRadius: 7,

    elevation: 3,
  },

  loginButtonText: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.white,
    letterSpacing: 0.3,
  },

  /* =======================================================
     DIVIDER
  ======================================================= */

  dividerContainer: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  dividerText: {
    fontFamily: "PoppinsRegular",
    color: Colors.primary1,
    marginHorizontal: 9,
  },

  /* =======================================================
     SOCIAL BUTTONS
  ======================================================= */

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  socialButton: {
    backgroundColor: Colors.white,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: Colors.border,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 4,

    elevation: 1,
  },

  googleLogo: {
    width: 22,
    height: 22,
  },

  facebookLogo: {
    width: 25,
    height: 25,
  },

  githubLogo: {
    width: 24,
    height: 24,
  },

  /* =======================================================
     SIGN UP
  ======================================================= */

  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  signupText: {
    fontFamily: "PoppinsRegular",
    color: Colors.primary1,
  },

  signupLink: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
    marginLeft: 2,
  },

  /* =======================================================
     BOTTOM TEXT
  ======================================================= */

  bottomText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,

    marginTop: 14,
    marginBottom: 6,

    letterSpacing: 0.2,
  },
});