import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutReserve() {
  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* STATUS-BAR-SAFE HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/consumer/profile" as any);
          }}
        >
          <Ionicons name="close-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>About RESERVE</Text>
          <Text style={styles.headerSubtitle}>
            Learn more about the RESERVE platform
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.logoText}>RESERVE</Text>
          <Text style={styles.tagline}>
            Enabling Budget-Friendly{"\n"}Surplus Food Pickups
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.cardTitle}>About RESERVE</Text>
          </View>

          <Text style={styles.bodyText}>
            RESERVE is a food rescue platform designed to connect consumers with
            discounted surplus food from local food establishments.
          </Text>

          <Text style={[styles.bodyText, styles.lastBodyText]}>
            Through location-based matching, RESERVE helps consumers discover
            and reserve available surplus food while giving good food another
            chance instead of going to waste.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How It Works</Text>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Discover</Text>
            <Text style={styles.stepText}>
              Find available surplus food near your location.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Reserve</Text>
            <Text style={styles.stepText}>
              Select an available food item and make your reservation.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pay</Text>
            <Text style={styles.stepText}>
              Pay the required digital downpayment to secure your reservation.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Rescue</Text>
            <Text style={styles.stepText}>
              Receive your QR Rescue Voucher and pick up your reserved food at
              the establishment.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Our Purpose</Text>

        <View style={styles.impactCard}>
          <View style={styles.impactItem}>
            <View style={styles.impactIcon}>
              <Ionicons
                name="trash-bin-outline"
                size={21}
                color={Colors.primary}
              />
            </View>
            <View style={styles.impactContent}>
              <Text style={styles.impactTitle}>Reduce Food Waste</Text>
              <Text style={styles.impactText}>
                Help prevent safe surplus food from being unnecessarily
                discarded.
              </Text>
            </View>
          </View>

          <View style={styles.impactItem}>
            <View style={styles.impactIcon}>
              <Ionicons
                name="pricetag-outline"
                size={21}
                color={Colors.primary}
              />
            </View>
            <View style={styles.impactContent}>
              <Text style={styles.impactTitle}>Affordable Meals</Text>
              <Text style={styles.impactText}>
                Make surplus food more accessible through discounted purchases.
              </Text>
            </View>
          </View>

          <View style={[styles.impactItem, styles.lastImpactItem]}>
            <View style={styles.impactIcon}>
              <Ionicons
                name="people-outline"
                size={21}
                color={Colors.primary}
              />
            </View>
            <View style={styles.impactContent}>
              <Text style={styles.impactTitle}>Community Support</Text>
              <Text style={styles.impactText}>
                Connect consumers and food establishments through a food rescue
                system.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Project Information</Text>

        <View style={styles.projectCard}>
          <Text style={styles.projectTitle}>RESERVE</Text>
          <Text style={styles.projectSubtitle}>
            Enabling Budget-Friendly Surplus Food Pickups Through Geolocation
            Matching
          </Text>

          <View style={styles.divider} />

          <View style={styles.projectRow}>
            <Ionicons name="school-outline" size={18} color={Colors.primary} />
            <Text style={styles.projectText}>
              Bachelor of Science in Information Technology
            </Text>
          </View>

          <View style={styles.projectRow}>
            <Ionicons
              name="business-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.projectText}>
              Cebu Technological University – Main Campus
            </Text>
          </View>

          <View style={styles.projectRow}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.projectText}>Capstone Project</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Developed By</Text>

        <View style={styles.teamCard}>
          <View style={styles.teamMember}>
            <View style={styles.memberIcon}>
              <Ionicons
                name="person-outline"
                size={21}
                color={Colors.primary}
              />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Justine Kate M. Cogtas</Text>
              <Text style={styles.memberRole}>Researcher / Developer</Text>
            </View>
          </View>

          <View style={styles.teamMember}>
            <View style={styles.memberIcon}>
              <Ionicons
                name="person-outline"
                size={21}
                color={Colors.primary}
              />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Cyrus Vince S. Lingo</Text>
              <Text style={styles.memberRole}>Researcher / Developer</Text>
            </View>
          </View>

          <View style={[styles.teamMember, styles.lastTeamMember]}>
            <View style={styles.memberIcon}>
              <Ionicons
                name="person-outline"
                size={21}
                color={Colors.primary}
              />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Jahnea Erika N. Segovia</Text>
              <Text style={styles.memberRole}>Researcher / Developer</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLogo}>RESERVE</Text>
          <Text style={styles.footerText}>
            Giving surplus food another chance.
          </Text>
          <Text style={styles.version}>Version 1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: { marginLeft: 11, flex: 1 },
  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary1,
    marginTop: -1,
  },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 40 },
  logoSection: { alignItems: "center", marginBottom: 22 },
  logoCircle: {
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
  logoText: {
    fontFamily: "PoppinsBold",
    fontSize: 25,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  tagline: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 3,
  },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
  },
  bodyText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    lineHeight: 16,
    color: Colors.primary1,
    marginBottom: 9,
  },
  lastBodyText: { marginBottom: 0 },
  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
    marginBottom: 10,
    marginTop: 3,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
  },
  stepNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  stepNumberText: {
    fontFamily: "PoppinsBold",
    fontSize: 13,
    color: Colors.white,
  },
  stepContent: { flex: 1 },
  stepTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
    marginBottom: 2,
  },
  stepText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
  },
  impactCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 22,
  },
  impactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastImpactItem: { borderBottomWidth: 0 },
  impactIcon: {
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
  impactContent: { flex: 1 },
  impactTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
    marginBottom: 2,
  },
  impactText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
  },
  projectCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 15,
    marginBottom: 22,
  },
  projectTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 18,
    color: Colors.primary,
    textAlign: "center",
  },
  projectSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 13,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  projectText: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginLeft: 9,
  },
  teamCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 22,
  },
  teamMember: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastTeamMember: { borderBottomWidth: 0 },
  memberIcon: {
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
  memberInfo: { flex: 1 },
  memberName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
  },
  memberRole: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.placeholder,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: 3,
    paddingBottom: 10,
  },
  footerLogo: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.primary,
    letterSpacing: 0.7,
  },
  footerText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    marginTop: 2,
  },
  version: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.placeholder,
    marginTop: 5,
  },
});