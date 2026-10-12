import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";

export default function AccountType() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isShortPhone = height < 700;

  const horizontalPadding = isSmallPhone ? 14 : 18;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isShortPhone ? 14 : 22,
            paddingBottom: isShortPhone ? 20 : 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/")}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={Colors.primary2}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Account</Text>
        </View>

        {/* =========================
            TITLE
        ========================= */}

        <View
          style={[
            styles.titleContainer,
            {
              marginTop: isShortPhone ? 18 : 28,
              marginBottom: isShortPhone ? 22 : 28,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                fontSize: isSmallPhone ? 21 : 23,
              },
            ]}
          >
            How will you use RESERVE?
          </Text>

        </View>

        {/* =========================
            CONSUMER
        ========================= */}

        <TouchableOpacity
          style={[
            styles.accountCard,
            {
              minHeight: isSmallPhone ? 92 : 100,
              paddingVertical: isSmallPhone ? 13 : 15,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push("/consumer/signup")}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="person-outline"
              size={27}
              color={Colors.primary}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Consumer</Text>

            <Text style={styles.cardDescription}>
              Find and reserve discounted surplus food available near you.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#777777"
          />
        </TouchableOpacity>

        {/* =========================
            FOOD BANK
        ========================= */}

        <TouchableOpacity
          style={[
            styles.accountCard,
            {
              minHeight: isSmallPhone ? 92 : 100,
              paddingVertical: isSmallPhone ? 13 : 15,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push("/foodbank/signup")}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="business-outline"
              size={27}
              color={Colors.primary}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Food Bank</Text>

            <Text style={styles.cardDescription}>
              Receive and manage surplus food available for community
              support.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#777777"
          />
        </TouchableOpacity>

        {/* =========================
            FOOD ESTABLISHMENT
        ========================= */}

        <TouchableOpacity
          style={[
            styles.accountCard,
            {
              minHeight: isSmallPhone ? 92 : 100,
              paddingVertical: isSmallPhone ? 13 : 15,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push("/establishment/signup")}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name="storefront-outline"
              size={27}
              color={Colors.primary}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Food Establishment
            </Text>

            <Text style={styles.cardDescription}>
              List and manage surplus food available for rescue.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#777777"
          />
        </TouchableOpacity>

        {/* =========================
            LOGIN
        ========================= */}

        <View
          style={[
            styles.loginContainer,
            {
              marginTop: isShortPhone ? 16 : 22,
            },
          ]}
        >
          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/consumer")}
          >
            <Text style={styles.loginLink}> Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* =========================
      CONTAINER
  ========================= */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },

  /* =========================
      HEADER
  ========================= */

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: "rgba(255,255,255,0.55)",

    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: Colors.primary2,

    marginLeft: 10,
  },

  /* =========================
      TITLE
  ========================= */

  titleContainer: {
    width: "100%",
    alignItems: "center",
  },

  title: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    textAlign: "center",
  },

  subtitle: {
    fontFamily: "PoppinsRegular",
    color: "#66736C",
    textAlign: "center",

    lineHeight: 17,

    marginTop: 7,
    maxWidth: 300,
  },

  /* =========================
      ACCOUNT CARD
  ========================= */

  accountCard: {
    width: "100%",

    backgroundColor: Colors.white,

    borderRadius: 18,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,

    marginBottom: 13,

    borderWidth: 1,
    borderColor: "#E3E8E5",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  /* =========================
      ICON
  ========================= */

  iconContainer: {
    width: 52,
    height: 52,

    borderRadius: 16,

    backgroundColor: "#E5F0EB",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },

  /* =========================
      CARD CONTENT
  ========================= */

  cardContent: {
    flex: 1,
    paddingRight: 8,
  },

  cardTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,

    color: Colors.primary2,

    marginBottom: 3,
  },

  cardDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,

    lineHeight: 16,

    color: "#727B77",
  },

  /* =========================
      LOGIN
  ========================= */

  loginContainer: {
    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11.5,

    color: "#68716D",
  },

  loginLink: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,

    color: Colors.primary,
  },
});