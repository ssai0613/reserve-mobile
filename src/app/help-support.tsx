import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../services/api";
import {
    ReserveAlertModal,
    ReserveModalState,
} from "./components/CebuRegistrationHelpers";

const getStorageItem = async (key: string) => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

type FaqItem = {
  role: "All" | "Consumer" | "Merchant" | "FoodBank";
  question: string;
  answer: string;
};

const RESERVE_FAQS: FaqItem[] = [
  {
    role: "All",
    question: "How does RESERVE Cebu's 10km matching radius work?",
    answer:
      "RESERVE uses the Haversine formula to match Consumers and Food Banks with partner Establishments located within a 10-kilometer radius in Cebu City, ensuring surplus food can be picked up fresh before expiry.",
  },
  {
    role: "Consumer",
    question: "How does the 10% reservation downpayment work?",
    answer:
      "When reserving surplus food, you pay a 10% reservation deposit online via Xendit (GCash or Maya) to lock in your claim and generate your QR Voucher. You pay the remaining 90% directly at the store upon pickup.",
  },
  {
    role: "Consumer",
    question: "How can I rate and review a food listing?",
    answer:
      "Once the merchant scans your QR voucher and marks your pickup as Completed, go to 'My Claims', tap on your completed order, and submit a 1–5 star rating and review.",
  },
  {
    role: "Merchant",
    question: "How does real-time Cebu weather affect my listing expiry?",
    answer:
      "RESERVE monitors live ambient temperature in Cebu City via Open-Meteo. Higher temperatures accelerate food spoilage calculations and automatically notify you and adjust safety windows.",
  },
  {
    role: "Merchant",
    question: "How do wallet withdrawals and the 10% Free-Tier fee work?",
    answer:
      "In your Merchant Profile, tap 'Withdraw Funds', choose GCash or Maya, and enter your account details. Free-Tier accounts have a 10% platform commission deducted, while Pro-Tier subscribers enjoy 0% commission.",
  },
  {
    role: "FoodBank",
    question: "How do Food Banks claim donated surplus food?",
    answer:
      "Verified NGO and Food Bank partners can browse zero-cost donation allotments or post a Donation Request. Once claimed, coordinate pickup directly with the establishment before the listed expiry date & time.",
  },
];

const REPORT_CATEGORIES = [
  "Order / Pickup Issue",
  "Food Quality & Safety Concern",
  "Payment / Withdrawal Inquiry",
  "Account & Verification Help",
  "Technical Bug / Other",
];

export default function HelpSupportScreen() {
  const params = useLocalSearchParams();
  const [userRole, setUserRole] = useState<string>(
    (params.role as string) || "Consumer"
  );
  const [userEmail, setUserEmail] = useState<string>("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    (async () => {
      const savedRole = await getStorageItem("user_role");
      const savedEmail = await getStorageItem("user_email");
      if (savedRole) setUserRole(savedRole);
      if (savedEmail) setUserEmail(savedEmail);
    })();
  }, []);

  const visibleFaqs = RESERVE_FAQS.filter(
    (f) => f.role === "All" || f.role.toLowerCase() === userRole.toLowerCase()
  );

  const handleSubmitReport = async () => {
    if (!subject.trim() || !message.trim()) {
      setModalAlert({
        visible: true,
        title: "Missing Report Details",
        message:
          "Please provide both a brief subject and a detailed description of the issue so our Admin team can assist you.",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("accounts/support-report/", {
        role: userRole,
        email: userEmail,
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setReportModalOpen(false);
      setSubject("");
      setMessage("");
      setModalAlert({
        visible: true,
        title: "Report Sent!",
        message:
          res.data?.message ||
          "Your report has been received by the ReServe Admin team. We will follow up via email shortly.",
        type: "success",
      });
    } catch (err: any) {
      setModalAlert({
        visible: true,
        title: "Submission Error",
        message:
          err.response?.data?.error ||
          "Could not submit your support report. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Help & Support Center</Text>
          <Text style={styles.headerSub}>
            FAQs & Direct Assistance for {userRole}s
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Support Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Ionicons name="headset-outline" size={28} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Need Help or Want to Report Something?</Text>
            <Text style={styles.heroDesc}>
              Browse our Frequently Asked Questions below or send a direct report
              to the ReServe Cebu Admin team.
            </Text>
            <TouchableOpacity
              style={styles.reportCtaBtn}
              activeOpacity={0.85}
              onPress={() => setReportModalOpen(true)}
            >
              <Ionicons name="flag-outline" size={15} color={Colors.primary2} />
              <Text style={styles.reportCtaText}>Send a Report / Ask Assistance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions (FAQs)</Text>

        {visibleFaqs.map((faq, idx) => {
          const isOpen = expandedIndex === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.faqCard}
              activeOpacity={0.8}
              onPress={() => setExpandedIndex(isOpen ? null : idx)}
            >
              <View style={styles.faqHeaderRow}>
                <View style={styles.faqBadge}>
                  <Text style={styles.faqBadgeText}>{faq.role}</Text>
                </View>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.primary}
                />
              </View>
              {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Direct Contact Footer */}
        <View style={styles.contactFooter}>
          <Ionicons name="mail-outline" size={18} color={Colors.primary} />
          <Text style={styles.contactFooterText}>
            Official Support Email:{" "}
            <Text style={{ fontFamily: "PoppinsBold", color: Colors.primary2 }}>
              reserve.org.com@gmail.com
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* SEND A REPORT MODAL */}
      <Modal
        visible={reportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit a Support Report</Text>
              <TouchableOpacity onPress={() => setReportModalOpen(false)}>
                <Ionicons name="close" size={20} color={Colors.primary2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 18 }}>
              <Text style={styles.inputLabel}>Select Issue Category *</Text>
              <View style={styles.categoryWrap}>
                {REPORT_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        active && styles.catChipActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          active && styles.catChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Subject / Summary *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Issue with Order #ORD-12 or Listing Quality"
                placeholderTextColor={Colors.placeholder}
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={styles.inputLabel}>Detailed Description *</Text>
              <TextInput
                style={[styles.textInput, { height: 95, textAlignVertical: "top", paddingTop: 10 }]}
                placeholder="Describe what happened, including any merchant or order details..."
                placeholderTextColor={Colors.placeholder}
                multiline
                value={message}
                onChangeText={setMessage}
              />

              <TouchableOpacity
                style={styles.submitReportBtn}
                activeOpacity={0.85}
                onPress={handleSubmitReport}
                disabled={submitting}
              >
                <Ionicons name="send" size={15} color={Colors.white} />
                <Text style={styles.submitReportBtnText}>
                  {submitting ? "SUBMITTING REPORT..." : "Submit Report to Admin"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 16,
    color: Colors.primary2,
  },
  headerSub: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
  },
  scrollContent: {
    padding: 18,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.primary2,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },
  heroIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.white,
  },
  heroDesc: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: "#D5E6DF",
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 12,
  },
  reportCtaBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reportCtaText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
  },
  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary2,
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  faqBadge: {
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  faqBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 8.5,
    color: Colors.primary,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.primary2,
  },
  faqAnswer: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: "#555",
    lineHeight: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F1",
  },
  contactFooter: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#E8EFEA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  contactFooterText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary2,
  },
  inputLabel: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10.5,
    color: Colors.primary2,
    marginBottom: 6,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary2,
  },
  catChipTextActive: {
    color: Colors.white,
  },
  textInput: {
    width: "100%",
    height: 44,
    backgroundColor: Colors.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary2,
    marginBottom: 14,
  },
  submitReportBtn: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  submitReportBtnText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11.5,
    color: Colors.white,
  },
});