import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { Colors } from "@/constants/color";

export default function EstablishmentSignup() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = height < 700;
  const isNarrowPhone = width < 360;

  const horizontalPadding = isNarrowPhone ? 12 : 15;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isSmallPhone ? 14 : 20,
            paddingBottom: isSmallPhone ? 20 : 30,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.replace("/consumer/account-type")}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={Colors.primary2}
            />

          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Account</Text>
        </View>

        {/* ===================================================== */}
        {/* BRAND */}
        {/* ===================================================== */}

        <View style={styles.brandContainer}>
          <Text
            style={[
              styles.logo,
              {
                fontSize: isNarrowPhone ? 30 : 34,
              },
            ]}
          >
            RESERVE
          </Text>

          <Text style={styles.brandSubtitle}>
            Food rescue made simple
          </Text>
        </View>

        {/* ===================================================== */}
        {/* CARD */}
        {/* ===================================================== */}

        <View style={styles.card}>

          {/* MAIN TITLE */}

          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.mainTitle,
                {
                  fontSize: isNarrowPhone ? 17 : 19,
                },
              ]}
            >
              FOOD ESTABLISHMENT
            </Text>

            <Text style={styles.mainSubtitle}>
              Register your establishment to list surplus food
              and help reduce food waste.
            </Text>
          </View>

          {/* ================================================= */}
          {/* SECTION 1 */}
          {/* ================================================= */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>1</Text>
            </View>

            <Text style={styles.sectionTitle}>
              Business Details
            </Text>
          </View>

          {/* Establishment Name */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Establishment Name
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="storefront-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="e.g. Nena's Bakeshop"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Physical Address */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Physical Address
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="e.g. Pusok, Lapu-Lapu City"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Contact Person */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Contact Person
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="e.g. Kate Cogtas"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Position */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Position
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="briefcase-outline"
                size={19}
                color={Colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="e.g. Manager"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Phone */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Phone Number
            </Text>

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
              />
            </View>
          </View>

          {/* Email */}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Email Address
            </Text>

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
              />
            </View>
          </View>

          {/* ================================================= */}
          {/* SECTION 2 */}
          {/* ================================================= */}

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>2</Text>
            </View>

            <Text style={styles.sectionTitle}>
              Establishment Type
            </Text>
          </View>

          <Text style={styles.label}>
            Select Establishment Type
          </Text>

          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons
                name="business-outline"
                size={18}
                color={Colors.primary}
              />

              <Text style={styles.dropdownText}>
                -- Select Type --
              </Text>
            </View>

            <Ionicons
              name="chevron-down"
              size={20}
              color={Colors.primary2}
            />
          </TouchableOpacity>

          {/* ================================================= */}
          {/* SECTION 3 */}
          {/* ================================================= */}

          <View style={styles.sectionDivider} />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>3</Text>
            </View>

            <View style={styles.sectionTitleArea}>
              <Text style={styles.sectionTitle}>
                Upload Documents
              </Text>

              <Text style={styles.requiredText}>
                Verification required
              </Text>
            </View>
          </View>

          <Text style={styles.documentDescription}>
            Please upload the following documents for verification.
          </Text>

          {/* BUSINESS PERMIT */}

          <TouchableOpacity
            style={styles.uploadBox}
            activeOpacity={0.7}
          >
            <View style={styles.uploadIconCircle}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={Colors.primary}
              />
            </View>

            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>
                Business Permit
              </Text>

              <Text style={styles.uploadSubtitle}>
                JPG, PNG or PDF
              </Text>

              <Text style={styles.uploadAction}>
                Tap to upload
              </Text>
            </View>

            <Ionicons
              name="cloud-upload-outline"
              size={23}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {/* TIN */}

          <TouchableOpacity
            style={styles.uploadBox}
            activeOpacity={0.7}
          >
            <View style={styles.uploadIconCircle}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={Colors.primary}
              />
            </View>

            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>
                TIN Verification
              </Text>

              <Text style={styles.uploadSubtitle}>
                JPG, PNG or PDF
              </Text>

              <Text style={styles.uploadAction}>
                Tap to upload
              </Text>
            </View>

            <Ionicons
              name="cloud-upload-outline"
              size={23}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {/* DTI / SEC */}

          <TouchableOpacity
            style={styles.uploadBox}
            activeOpacity={0.7}
          >
            <View style={styles.uploadIconCircle}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={Colors.primary}
              />
            </View>

            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>
                DTI / SEC Registration
              </Text>

              <Text style={styles.uploadSubtitle}>
                JPG, PNG or PDF
              </Text>

              <Text style={styles.uploadAction}>
                Tap to upload
              </Text>
            </View>

            <Ionicons
              name="cloud-upload-outline"
              size={23}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {/* SECURITY NOTE */}

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={Colors.primary}
            />

            <Text style={styles.secureText}>
              Files are securely transmitted to the Admin team
              for review.
            </Text>
          </View>

          {/* ================================================= */}
          {/* TERMS */}
          {/* ================================================= */}

          <TouchableOpacity
            style={styles.termsContainer}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              <Ionicons
                name="checkmark"
                size={12}
                color={Colors.white}
              />
            </View>

            <Text style={styles.termsText}>
              I have read and agree to the{" "}
              <Text style={styles.termsLink}>
                Terms of Service
              </Text>{" "}
              for Food Establishments.
            </Text>
          </TouchableOpacity>

          {/* ================================================= */}
          {/* SUBMIT */}
          {/* ================================================= */}

          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={() =>
              router.replace("/establishment/dashboard")
            }
          >
            <Text style={styles.submitText}>
              Submit Application
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={Colors.white}
            />
          </TouchableOpacity>

          <Text style={styles.reviewText}>
            Your application will be reviewed by the RESERVE Admin
            team.
          </Text>

        </View>

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/consumer")}
          >
            <Text style={styles.loginLink}>
              {" "}Log in
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* ======================================================= */
  /* CONTAINER */
  /* ======================================================= */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },

  /* ======================================================= */
  /* HEADER */
  /* ======================================================= */

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingRight: 12,
  },

  backText: {
    fontFamily: "PoppinsMedium",
    fontSize: 12,
    color: Colors.primary2,
    marginLeft: 5,
  },

  headerTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
    marginLeft: 2,
  },

  /* ======================================================= */
  /* BRAND */
  /* ======================================================= */

  brandContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  logo: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 1.5,
  },

  brandSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* ======================================================= */
  /* CARD */
  /* ======================================================= */

  card: {
    width: "100%",
    maxWidth: 500,

    backgroundColor: Colors.white,

    borderRadius: 20,

    paddingHorizontal: 18,
    paddingVertical: 21,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,
  },

  /* ======================================================= */
  /* TITLE */
  /* ======================================================= */

  titleContainer: {
    marginBottom: 20,
  },

  mainTitle: {
    fontFamily: "PoppinsBold",
    color: Colors.primary2,
    letterSpacing: 0.3,
  },

  mainSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 15,
    color: "#777777",
    marginTop: 4,
    maxWidth: 330,
  },

  /* ======================================================= */
  /* SECTION */
  /* ======================================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  sectionNumberText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.white,
  },

  sectionTitleArea: {
    flex: 1,
  },

  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 14,
    color: Colors.primary2,
  },

  requiredText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: "#888888",
    marginTop: 1,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 17,
  },

  /* ======================================================= */
  /* INPUTS */
  /* ======================================================= */

  fieldContainer: {
    width: "100%",
    marginBottom: 12,
  },

  label: {
    fontFamily: "PoppinsMedium",
    fontSize: 10,
    color: "#303030",
    marginBottom: 5,
  },

  inputContainer: {
    width: "100%",
    height: 45,

    backgroundColor: Colors.input,

    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,

    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  inputIcon: {
    marginRight: 9,
  },

  input: {
    flex: 1,
    height: "100%",

    fontFamily: "PoppinsRegular",
    fontSize: 10.5,

    color: Colors.primary2,

    paddingVertical: 0,
  },

  /* ======================================================= */
  /* DROPDOWN */
  /* ======================================================= */

  dropdown: {
    width: "100%",
    height: 45,

    backgroundColor: Colors.input,

    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 12,

    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  dropdownText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: "#999999",
    marginLeft: 9,
  },

  /* ======================================================= */
  /* DOCUMENTS */
  /* ======================================================= */

  documentDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 14,
    color: "#777777",
    marginBottom: 10,
  },

  uploadBox: {
    width: "100%",
    minHeight: 72,

    borderWidth: 1,
    borderColor: "#D5E4DC",

    backgroundColor: "#FAFCFB",

    borderRadius: 11,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 9,

    marginBottom: 9,
  },

  uploadIconCircle: {
    width: 44,
    height: 44,

    borderRadius: 10,

    backgroundColor: "#E7F1EC",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  uploadContent: {
    flex: 1,
    minWidth: 0,
  },

  uploadTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: "#252525",
  },

  uploadSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: "#888888",
    marginTop: 1,
  },

  uploadAction: {
    fontFamily: "PoppinsMedium",
    fontSize: 8.5,
    color: Colors.primary,
    marginTop: 2,
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 2,
    marginBottom: 15,
  },

  secureText: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,

    color: "#777777",

    marginLeft: 6,
  },

  /* ======================================================= */
  /* TERMS */
  /* ======================================================= */

  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 16,
  },

  checkbox: {
    width: 17,
    height: 17,

    borderRadius: 4,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 7,
    marginTop: 1,
  },

  termsText: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 13,

    color: "#666666",
  },

  termsLink: {
    fontFamily: "PoppinsMedium",
    color: Colors.primary,
  },

  /* ======================================================= */
  /* SUBMIT */
  /* ======================================================= */

  submitButton: {
    width: "100%",
    minHeight: 48,

    backgroundColor: Colors.button,

    borderRadius: 11,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    shadowColor: Colors.button,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,

    elevation: 2,
  },

  submitText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.white,
  },

  reviewText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 12,

    color: "#999999",

    textAlign: "center",

    marginTop: 9,
  },

  /* ======================================================= */
  /* LOGIN */
  /* ======================================================= */

  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 16,
  },

  loginText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary2,
  },

  loginLink: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
});