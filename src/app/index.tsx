import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
        }}
        style={styles.background}
        resizeMode="cover"
      >
        {/* DARK OVERLAY */}
        <View style={styles.overlay} />

        {/* CONTENT */}
        <View style={styles.content}>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>RESERVE</Text>
            <Text style={styles.tagline}>
              Rescue. Reserve. Reduce.
            </Text>
          </View>

          {/* MAIN MESSAGE */}
          <View style={styles.middleContent}>
            <Text style={styles.title}>
              Good food deserves
              {"\n"}
              another chance.
            </Text>

            <Text style={styles.description}>
              Connect with local food establishments and
              rescue quality surplus food at affordable
              prices — while helping reduce food waste.
            </Text>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonContainer}>
            {/* GET STARTED */}
            <TouchableOpacity
              style={styles.getStartedButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push("/consumer/account-type")
              }
            >
              <Text style={styles.getStartedText}>
                GET STARTED
              </Text>

              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* LOG IN */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push("/consumer")
              }
            >
              <Text style={styles.loginText}>
                LOG IN
              </Text>
            </TouchableOpacity>

            {/* VENDOR LINK */}
            <TouchableOpacity
              style={styles.vendorButton}
              activeOpacity={0.7}
              onPress={() =>
                router.push("/establishment/signup")
              }
            >
              <Text style={styles.vendorText}>
                Are you a food establishment?
              </Text>

              <Text style={styles.vendorLink}>
                Register as a Vendor
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07532F",
  },

  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  /* ===================================================
     OVERLAY
  =================================================== */

  overlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.48)",
},

  /* ===================================================
     CONTENT
  =================================================== */

  content: {
    flex: 1,

    paddingHorizontal: 24,
    paddingTop: 65,
    paddingBottom: 35,

    justifyContent: "space-between",
  },

  /* ===================================================
     LOGO
  =================================================== */

  logoContainer: {
    alignItems: "center",
  },

  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 34,

    color: "#FFFFFF",

    letterSpacing: 1.5,
  },

  tagline: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,

    color: "#D8EBDD",

    marginTop: -2,
    letterSpacing: 0.8,
  },

  /* ===================================================
     MAIN MESSAGE
  =================================================== */

  middleContent: {
    marginTop: 60,
    marginBottom: 30,
  },

  title: {
    fontFamily: "PoppinsBold",
    fontSize: 29,

    lineHeight: 37,

    color: "#FFFFFF",

    textAlign: "left",

    marginBottom: 14,
  },

  description: {
    fontFamily: "PoppinsRegular",
    fontSize: 13,

    lineHeight: 21,

    color: "#F5F5F5",

    maxWidth: 340,
  },

  /* ===================================================
     BUTTONS
  =================================================== */

  buttonContainer: {
    width: "100%",
  },

  getStartedButton: {
    width: "100%",
    height: 53,

    borderRadius: 9,

    backgroundColor: "#07532F",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginBottom: 10,

    elevation: 4,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  getStartedText: {
    fontFamily: "PoppinsBold",
    fontSize: 14,

    color: "#FFFFFF",

    marginRight: 8,
  },

  loginButton: {
    width: "100%",
    height: 53,

    borderRadius: 9,

    backgroundColor: "rgba(255,255,255,0.92)",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#FFFFFF",

    marginBottom: 18,
  },

  loginText: {
    fontFamily: "PoppinsBold",
    fontSize: 14,

    color: "#07532F",
  },

  /* ===================================================
     VENDOR
  =================================================== */

  vendorButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  vendorText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,

    color: "#FFFFFF",

    marginBottom: 2,
  },

  vendorLink: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,

    color: "#A8D5BA",

    textDecorationLine: "underline",
  },
});