import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

export default function CartScreen() {
  // =====================================================
  // MOCK CART DATA
  // =====================================================

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
    <View style={styles.container}>

      {/* =================================================
          HEADER — SAME AS HOMEPAGE / LISTING
      ================================================= */}

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>RESERVE</Text>

          <Text style={styles.logoSubtitle}>
            Consumer Portal
          </Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.icon}
          />

          <Text style={styles.locationText}>
            Lapu-Lapu City
          </Text>
        </View>
      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>
            Rescue Cart
          </Text>

          <Text style={styles.pageSubtitle}>
            Review your selected rescue items before checkout.
          </Text>
        </View>

        {/* =================================================
            CART ITEM
        ================================================= */}

        <View style={styles.cartCard}>

          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
            }}
            style={styles.productImage}
          />

          <View style={styles.productInfo}>

            {/* PRODUCT HEADER */}

            <View style={styles.productTopRow}>

              <View style={styles.productNameContainer}>
                <Text style={styles.productName}>
                  Pan Lamion
                </Text>

                <Text style={styles.establishmentName}>
                  Nena's Bakery
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#A94A3A"
                />
              </TouchableOpacity>

            </View>

            {/* LOCATION */}

            <View style={styles.productDetail}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.icon}
              />

              <Text style={styles.productDetailText}>
                Pusok, Lapu-Lapu
              </Text>
            </View>

            {/* PICKUP */}

            <View style={styles.productDetail}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.icon}
              />

              <Text style={styles.productDetailText}>
                Pickup until 4:30 PM
              </Text>
            </View>

            {/* PRICE + QUANTITY */}

            <View style={styles.productBottomRow}>

              <View>
                <Text style={styles.currentPrice}>
                  ₱{itemPrice.toFixed(2)}
                </Text>

                <Text style={styles.oldPrice}>
                  ₱{originalPrice.toFixed(2)}
                </Text>
              </View>

              {/* QUANTITY */}

              <View style={styles.quantityContainer}>

                <TouchableOpacity
                  style={styles.quantityButton}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                <Text style={styles.quantityText}>
                  {quantity}
                </Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

              </View>

            </View>

          </View>

        </View>

        {/* =================================================
            ADD MORE ITEMS
        ================================================= */}

        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() =>
            router.replace("/consumer/homepage")
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={Colors.primary}
          />

          <Text style={styles.addMoreText}>
            Add more items
          </Text>
        </TouchableOpacity>

        {/* =================================================
            PICKUP NOTICE
        ================================================= */}

        <View style={styles.noticeCard}>

          <View style={styles.noticeIconContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.noticeContent}>

            <Text style={styles.noticeTitle}>
              Pickup Reminder
            </Text>

            <Text style={styles.noticeText}>
              Please arrive at{" "}
              <Text style={styles.noticeBold}>
                Nena's Bakery (Pusok, Lapu-Lapu)
              </Text>{" "}
              not later than{" "}
              <Text style={styles.noticeBold}>
                4:30 PM
              </Text>
              .
            </Text>

          </View>

        </View>

        {/* =================================================
            PAYMENT METHOD
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <Text style={styles.requiredText}>
            Required
          </Text>

        </View>

        <View style={styles.paymentCard}>

          {/* GCASH */}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              styles.paymentOptionActive,
            ]}
          >

            <View style={styles.paymentLeft}>

              <View style={styles.paymentIconContainer}>
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>

              <Text
                style={[
                  styles.paymentText,
                  styles.paymentTextActive,
                ]}
              >
                GCash
              </Text>

            </View>

            <View style={styles.radioActive}>
              <View style={styles.radioDot} />
            </View>

          </TouchableOpacity>

          {/* PAYMAYA */}

          <TouchableOpacity style={styles.paymentOption}>

            <View style={styles.paymentLeft}>

              <View style={styles.paymentIconContainer}>
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={Colors.icon}
                />
              </View>

              <Text style={styles.paymentText}>
                PayMaya
              </Text>

            </View>

            <View style={styles.radio} />

          </TouchableOpacity>

          {/* GOOGLE PAY */}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              styles.paymentOptionLast,
            ]}
          >

            <View style={styles.paymentLeft}>

              <View style={styles.paymentIconContainer}>
                <Ionicons
                  name="logo-google"
                  size={18}
                  color={Colors.icon}
                />
              </View>

              <Text style={styles.paymentText}>
                Google Pay
              </Text>

            </View>

            <View style={styles.radio} />

          </TouchableOpacity>

        </View>

        {/* =================================================
            VOUCHER
        ================================================= */}

        <TouchableOpacity style={styles.voucherCard}>

          <View style={styles.voucherLeft}>

            <View style={styles.voucherIcon}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={Colors.primary}
              />
            </View>

            <View>
              <Text style={styles.voucherTitle}>
                Have a voucher?
              </Text>

              <Text style={styles.voucherSubtitle}>
                Apply a discount code
              </Text>
            </View>

          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.icon}
          />

        </TouchableOpacity>

        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Order Summary
        </Text>

        <View style={styles.summaryCard}>

          {/* SUBTOTAL */}

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>

            <Text style={styles.summaryValue}>
              ₱{subtotal.toFixed(2)}
            </Text>

          </View>

          {/* ORIGINAL TOTAL */}

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Original Total
            </Text>

            <Text style={styles.originalTotal}>
              ₱{originalTotal.toFixed(2)}
            </Text>

          </View>

          {/* DOWNPAYMENT */}

          <View style={styles.summaryRow}>

            <View style={styles.summaryLabelRow}>

              <Text style={styles.summaryLabel}>
                Downpayment Fee
              </Text>

              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeText}>
                  10%
                </Text>
              </View>

            </View>

            <Text style={styles.summaryValue}>
              ₱{downpaymentFee.toFixed(2)}
            </Text>

          </View>

          {/* SAVINGS */}

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Total Savings
            </Text>

            <Text style={styles.savingsText}>
              -₱{totalSavings.toFixed(2)}
            </Text>

          </View>

          <View style={styles.divider} />

          {/* GRAND TOTAL */}

          <View style={styles.grandTotalRow}>

            <View>

              <Text style={styles.grandTotalLabel}>
                Grand Total
              </Text>

              <Text style={styles.grandTotalSubtext}>
                Payable amount
              </Text>

            </View>

            <Text style={styles.grandTotal}>
              ₱{grandTotal.toFixed(2)}
            </Text>

          </View>

        </View>

        {/* =================================================
            CHECKOUT
        ================================================= */}

        <TouchableOpacity style={styles.checkoutButton}>

          <Ionicons
            name="lock-closed-outline"
            size={17}
            color={Colors.white}
          />

          <Text style={styles.checkoutText}>
            Proceed to Checkout
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color={Colors.white}
          />

        </TouchableOpacity>

        <Text style={styles.secureText}>
          Secure checkout • Your payment information is protected
        </Text>

        <View style={styles.bottomSpace} />

      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION — SAME AS HOMEPAGE
      ================================================= */}

      <View style={styles.bottomNav}>

        {/* HOME */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace("/consumer/homepage")
          }
        >
          <Ionicons
            name="home-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            Home
          </Text>
        </TouchableOpacity>

        {/* SEARCH */}

        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="search-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            Search
          </Text>
        </TouchableOpacity>

        {/* CART */}

        <TouchableOpacity
          style={[
            styles.navItem,
            styles.navItemActive,
          ]}
        >
          <Ionicons
            name="cart"
            size={21}
            color={Colors.primary}
          />

          <Text
            style={[
              styles.navLabel,
              styles.navLabelActive,
            ]}
          >
            My Cart
          </Text>
        </TouchableOpacity>

        {/* CLAIMS */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace("/consumer/claims")
          }
        >
          <Ionicons
            name="receipt-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            My Claims
          </Text>
        </TouchableOpacity>

        {/* PROFILE */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace("/consumer/profile")
          }
        >
          <Ionicons
            name="person-circle-outline"
            size={21}
            color={Colors.icon}
          />

          <Text style={styles.navLabel}>
            Profile
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  // =======================================================
  // MAIN
  // =======================================================

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // =======================================================
  // HEADER — STANDARDIZED
  // =======================================================

  header: {
    height: 70,
    paddingHorizontal: 18,
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
    fontSize: 23,
    lineHeight: 26,
    color: Colors.primary,
    letterSpacing: 0.4,
  },

  logoSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 11,
    color: Colors.primary1,
    marginTop: -1,
  },

  locationPill: {
    height: 30,
    paddingHorizontal: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  locationText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 12,
    color: Colors.text,
    marginLeft: 4,
  },

  // =======================================================
  // SCROLL
  // =======================================================

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
  },

  // =======================================================
  // TITLE
  // =======================================================

  titleSection: {
    marginBottom: 18,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 29,
    color: Colors.primary2,
  },

  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
    marginTop: 2,
  },

  // =======================================================
  // CART CARD
  // =======================================================

  cartCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    marginBottom: 11,
  },

  productImage: {
    width: 105,
    height: 125,
    borderRadius: 8,
    backgroundColor: Colors.input,
  },

  productInfo: {
    flex: 1,
    marginLeft: 11,
  },

  productTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  productNameContainer: {
    flex: 1,
    paddingRight: 5,
  },

  productName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primary2,
  },

  establishmentName: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 13,
    color: Colors.primary1,
    marginTop: 1,
  },

  deleteButton: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  productDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  productDetailText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 12,
    color: Colors.placeholder,
    marginLeft: 4,
  },

  productBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 10,
  },

  currentPrice: {
    fontFamily: "PoppinsBold",
    fontSize: 15,
    lineHeight: 19,
    color: Colors.primary,
  },

  oldPrice: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 11,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
    marginTop: -1,
  },

  // =======================================================
  // QUANTITY
  // =======================================================

  quantityContainer: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 7,
    overflow: "hidden",
  },

  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: Colors.input,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    minWidth: 29,
    textAlign: "center",
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 13,
    color: Colors.primary2,
  },

  // =======================================================
  // ADD MORE
  // =======================================================

  addMoreButton: {
    height: 42,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  addMoreText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 13,
    color: Colors.primary,
    marginLeft: 6,
  },

  // =======================================================
  // NOTICE
  // =======================================================

  noticeCard: {
    backgroundColor: "#EEF3EF",
    borderWidth: 1,
    borderColor: "#D3DED6",
    borderRadius: 10,
    padding: 11,
    flexDirection: "row",
    marginBottom: 20,
  },

  noticeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0EAE3",
    alignItems: "center",
    justifyContent: "center",
  },

  noticeContent: {
    flex: 1,
    marginLeft: 9,
  },

  noticeTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary2,
    marginBottom: 2,
  },

  noticeText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 14,
    color: Colors.primary1,
  },

  noticeBold: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary2,
  },

  // =======================================================
  // SECTION HEADER
  // =======================================================

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },

  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    lineHeight: 18,
    color: Colors.primary2,
    marginBottom: 9,
  },

  requiredText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 12,
    color: Colors.primary1,
  },

  // =======================================================
  // PAYMENT
  // =======================================================

  paymentCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },

  paymentOption: {
    minHeight: 56,
    paddingHorizontal: 12,
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
    backgroundColor: "#F7FAF7",
  },

  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary1,
    marginLeft: 10,
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

  // =======================================================
  // VOUCHER
  // =======================================================

  voucherCard: {
    minHeight: 58,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  voucherLeft: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary2,
    marginLeft: 10,
  },

  voucherSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 11,
    color: Colors.placeholder,
    marginLeft: 10,
    marginTop: 1,
  },

  // =======================================================
  // SUMMARY
  // =======================================================

  summaryCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 13,
    color: Colors.primary1,
  },

  summaryValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.primary2,
  },

  originalTotal: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    lineHeight: 13,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
  },

  savingsText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    lineHeight: 13,
    color: Colors.primary,
  },

  feeBadge: {
    backgroundColor: "#E7F0E9",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },

  feeBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 7.5,
    lineHeight: 10,
    color: Colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 1,
    marginBottom: 13,
  },

  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  grandTotalLabel: {
    fontFamily: "PoppinsBold",
    fontSize: 13,
    lineHeight: 17,
    color: Colors.primary2,
  },

  grandTotalSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 11,
    color: Colors.placeholder,
    marginTop: 1,
  },

  grandTotal: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    lineHeight: 24,
    color: Colors.primary,
  },

  // =======================================================
  // CHECKOUT
  // =======================================================

  checkoutButton: {
    height: 50,
    backgroundColor: Colors.button,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  checkoutText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    lineHeight: 15,
    color: Colors.white,
  },

  secureText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 12,
    color: Colors.placeholder,
    textAlign: "center",
    marginTop: 8,
  },

  bottomSpace: {
    height: 20,
  },

  // =======================================================
  // BOTTOM NAVIGATION — STANDARDIZED
  // =======================================================

  bottomNav: {
    height: 64,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: -2,
    },
  },

  navItem: {
    height: 48,
    minWidth: 62,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  navItemActive: {
    backgroundColor: "#E8EFEA",
  },

  navLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    lineHeight: 11,
    color: Colors.icon,
    marginTop: 3,
  },

  navLabelActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

});