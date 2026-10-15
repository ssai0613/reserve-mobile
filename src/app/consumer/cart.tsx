import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/color";

export default function CartScreen() {
  const itemPrice = 100;
  const originalPrice = 150;
  const downpaymentRate = 0.1;
  const quantity = 1;

  const subtotal = itemPrice * quantity;
  const originalTotal = originalPrice * quantity;
  const downpaymentFee = subtotal * downpaymentRate;
  const totalSavings = originalTotal - subtotal;
  const grandTotal = subtotal;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.logoSubtitle}>Consumer Portal</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={13} color={Colors.primary} />
          <Text style={styles.locationText}>Lapu-Lapu City</Text>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Rescue Cart</Text>
          <Text style={styles.pageSubtitle}>Review your selected rescue items before checkout.</Text>
        </View>

        {/* CART ITEM */}
        <View style={styles.cartCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
            }}
            style={styles.productImage}
          />

          <View style={styles.productInfo}>
            <View style={styles.productTopRow}>
              <View style={styles.productNameContainer}>
                <Text style={styles.productName} numberOfLines={1}>Pan Lamion</Text>
                <Text style={styles.establishmentName} numberOfLines={1}>Nena's Bakery</Text>
              </View>

              <TouchableOpacity style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color="#B3261E" />
              </TouchableOpacity>
            </View>

            <View style={styles.productDetail}>
              <Ionicons name="location-outline" size={12} color={Colors.icon} />
              <Text style={styles.productDetailText}>Pusok, Lapu-Lapu</Text>
            </View>

            <View style={styles.productDetail}>
              <Ionicons name="time-outline" size={12} color={Colors.icon} />
              <Text style={styles.productDetailText}>Pickup until 4:30 PM</Text>
            </View>

            <View style={styles.productBottomRow}>
              <View>
                <Text style={styles.currentPrice}>₱{itemPrice.toFixed(2)}</Text>
                <Text style={styles.oldPrice}>₱{originalPrice.toFixed(2)}</Text>
              </View>

              <View style={styles.quantityContainer}>
                <TouchableOpacity style={styles.quantityButton}>
                  <Ionicons name="remove" size={15} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity style={styles.quantityButton}>
                  <Ionicons name="add" size={15} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ADD MORE ITEMS */}
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => router.replace("/consumer/homepage")}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addMoreText}>Add more items</Text>
        </TouchableOpacity>

        {/* PICKUP NOTICE */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconContainer}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Pickup Reminder</Text>
            <Text style={styles.noticeText}>
              Please arrive at <Text style={styles.noticeBold}>Nena's Bakery (Pusok, Lapu-Lapu)</Text> not later than <Text style={styles.noticeBold}>4:30 PM</Text>.
            </Text>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.requiredText}>Required</Text>
        </View>

        <View style={styles.paymentCard}>
          <TouchableOpacity style={[styles.paymentOption, styles.paymentOptionActive]} activeOpacity={0.88}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.paymentText, styles.paymentTextActive]}>GCash</Text>
            </View>
            <View style={styles.radioActive}>
              <View style={styles.radioDot} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} activeOpacity={0.88}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="card-outline" size={18} color={Colors.icon} />
              </View>
              <Text style={styles.paymentText}>PayMaya</Text>
            </View>
            <View style={styles.radio} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.paymentOption, styles.paymentOptionLast]} activeOpacity={0.88}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="logo-google" size={18} color={Colors.icon} />
              </View>
              <Text style={styles.paymentText}>Google Pay</Text>
            </View>
            <View style={styles.radio} />
          </TouchableOpacity>
        </View>

        {/* VOUCHER */}
        <TouchableOpacity style={styles.voucherCard} activeOpacity={0.88}>
          <View style={styles.voucherLeft}>
            <View style={styles.voucherIcon}>
              <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.voucherTitle}>Have a voucher?</Text>
              <Text style={styles.voucherSubtitle}>Apply a discount code</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
        </TouchableOpacity>

        {/* ORDER SUMMARY */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Original Total</Text>
            <Text style={styles.originalTotal}>₱{originalTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryLabel}>Downpayment Fee</Text>
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>10%</Text>
              </View>
            </View>
            <Text style={styles.summaryValue}>₱{downpaymentFee.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Savings</Text>
            <Text style={styles.savingsText}>-₱{totalSavings.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalSubtext}>Payable amount</Text>
            </View>
            <Text style={styles.grandTotal}>₱{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* CHECKOUT */}
        <TouchableOpacity style={styles.checkoutButton} activeOpacity={0.88}>
          <Ionicons name="lock-closed-outline" size={16} color={Colors.white} />
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.secureText}>Secure checkout • Your payment information is protected</Text>
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* BOTTOM NAVIGATION — MATCHED TO HOMEPAGE */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/consumer/homepage")}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={1}>
          <Ionicons name="cart" size={22} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/consumer/claims")}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/consumer/profile")}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    justifyContent: "center",
  },
  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: -3,
  },
  locationPill: {
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },
  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
    marginTop: 2,
  },
  cartCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    marginBottom: 12,
  },
  productImage: {
    width: 90,
    height: 110,
    borderRadius: 10,
    backgroundColor: Colors.input,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  productNameContainer: {
    flex: 1,
    paddingRight: 6,
  },
  productName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
  },
  establishmentName: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: 1,
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  productDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  productDetailText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.icon,
  },
  productBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  currentPrice: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary,
  },
  oldPrice: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
  },
  quantityContainer: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    width: 30,
    height: 32,
    backgroundColor: Colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 28,
    textAlign: "center",
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
  addMoreButton: {
    height: 46,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  addMoreText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary,
  },
  noticeCard: {
    backgroundColor: "#E8EFEA",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  noticeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary2,
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    lineHeight: 16,
  },
  noticeBold: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 15,
    color: Colors.primary2,
    marginBottom: 6,
  },
  requiredText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  paymentOption: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentOptionLast: {
    borderBottomWidth: 0,
  },
  paymentOptionActive: {
    backgroundColor: "#F7FBF8",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentText: {
    fontFamily: "PoppinsRegular",
    fontSize: 12,
    color: Colors.primary1,
  },
  paymentTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  radioActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  voucherCard: {
    height: 56,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  voucherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voucherIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },
  voucherSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    marginTop: 1,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
  },
  summaryValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  originalTotal: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
  },
  savingsText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.primary,
  },
  feeBadge: {
    backgroundColor: "#E7F0E9",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  feeBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grandTotalLabel: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    color: Colors.primary2,
  },
  grandTotalSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.placeholder,
  },
  grandTotal: {
    fontFamily: "PoppinsBold",
    fontSize: 20,
    color: Colors.primary,
  },
  checkoutButton: {
    height: 48,
    backgroundColor: Colors.button,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  checkoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.white,
  },
  secureText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 8,
  },
  bottomSpace: {
    height: 16,
  },
  bottomNav: {
    height: 84,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    paddingHorizontal: 2,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: "#E8EFEA",
  },
  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.icon,
    marginTop: 2,
  },
  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary,
  },
});