import { Colors } from "@/constants/color";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ReserveAlertModal,
  ReserveModalState,
} from "../components/CebuRegistrationHelpers";
import {
  ConsumerBottomNav,
  ConsumerHeader,
  switchConsumerTab,
  useIsInsideConsumerShell,
} from "../components/ConsumerNav";

const CART_STORAGE_KEY = "@reserve_cart";

export default function CartScreen() {
  const isInsideShell = useIsInsideConsumerShell();
  if (!isInsideShell) return null;

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedMerchantName, setSelectedMerchantName] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);

  const [modalAlert, setModalAlert] = useState<ReserveModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => setModalAlert({ visible: true, title, message, type });

  useEffect(() => {
    loadCart();
    const cartListener = DeviceEventEmitter.addListener(
      "consumer_cart_updated",
      () => {
        loadCart();
      }
    );
    return () => {
      cartListener.remove();
    };
  }, []);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        setCartItems(parsed);
        if (parsed.length > 0) {
          setSelectedMerchantName((prev) =>
            prev && parsed.some((i: any) => i.establishment === prev)
              ? prev
              : parsed[0].establishment || "Partner Merchant"
          );
        } else {
          setSelectedMerchantName(null);
        }
      } else {
        setCartItems([]);
        setSelectedMerchantName(null);
      }
    } catch (e) {
      console.log("Cart load error:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const updateCartStorage = async (updated: any[]) => {
    setCartItems(updated);
    if (updated.length === 0) {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      setSelectedMerchantName(null);
      DeviceEventEmitter.emit("consumer_cart_updated");
      return;
    }
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    if (
      selectedMerchantName &&
      !updated.some((i) => i.establishment === selectedMerchantName)
    ) {
      setSelectedMerchantName(updated[0]?.establishment || null);
    }
    DeviceEventEmitter.emit("consumer_cart_updated");
  };

  const changeQty = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const maxStock = Number(item.maxStock || item.quantity || 99);
        const nextQty = Math.max(
          1,
          Math.min(maxStock, Number(item.quantity || 1) + delta)
        );
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    updateCartStorage(updated);
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    updateCartStorage(updated);
  };

  const merchantGroups: { [merchantName: string]: any[] } = {};
  cartItems.forEach((item) => {
    const mName = item.establishment || "Partner Establishment";
    if (!merchantGroups[mName]) merchantGroups[mName] = [];
    merchantGroups[mName].push(item);
  });
  const merchantNames = Object.keys(merchantGroups);

  const activeMerchantItems = selectedMerchantName
    ? merchantGroups[selectedMerchantName] || []
    : [];

  const handleProceedToPaymentSummary = () => {
    if (!selectedMerchantName || activeMerchantItems.length === 0) {
      showModal(
        "Select a Merchant",
        "Please tap on a Food Merchant card above to select the items you wish to reserve.",
        "warning"
      );
      return;
    }

    router.push({
      pathname: "/consumer/payment-summary" as any,
      params: { merchant: selectedMerchantName },
    });
  };

  return (
    <View style={styles.container}>
      <ConsumerHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Rescue Cart</Text>
          <Text style={styles.pageSubtitle}>
            Select a merchant establishment below and proceed to your payment
            summary
          </Text>
        </View>

        {merchantNames.length > 0 ? (
          merchantNames.map((mName) => {
            const mItems = merchantGroups[mName];
            const isSelected = selectedMerchantName === mName;

            return (
              <View
                key={mName}
                style={[
                  styles.merchantGroupCard,
                  isSelected && styles.merchantGroupCardActive,
                ]}
              >
                <TouchableOpacity
                  style={styles.merchantHeaderBar}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedMerchantName(isSelected ? null : mName)
                  }
                >
                  <View style={styles.merchantHeaderLeft}>
                    <View
                      style={[
                        styles.merchantRadio,
                        isSelected && styles.merchantRadioActive,
                      ]}
                    >
                      {isSelected && <View style={styles.merchantRadioDot} />}
                    </View>
                    <Ionicons
                      name="storefront-outline"
                      size={18}
                      color={Colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.merchantTitleText} numberOfLines={1}>
                        {mName}
                      </Text>
                      <Text style={styles.merchantSubText}>
                        {mItems.length} listing{mItems.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.selectMerchantBadge}>
                    <Text style={styles.selectMerchantBadgeText}>
                      {isSelected ? "Selected ✓" : "Tap to Select"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                  {mItems.map((item) => (
                    <View key={item.id} style={styles.cartCard}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.productImage}
                      />

                      <View style={styles.productInfo}>
                        <View style={styles.productTopRow}>
                          <View style={styles.productNameContainer}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => removeItem(item.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="#B3261E"
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.productDetail}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#A94A3A"
                          />
                          <Text
                            style={[
                              styles.productDetailText,
                              { color: "#A94A3A", fontFamily: "PoppinsMedium" },
                            ]}
                          >
                            Exp: {item.expiryDate} • {item.expiryTime}
                          </Text>
                        </View>

                        <View style={styles.productBottomRow}>
                          <View>
                            <Text style={styles.currentPrice}>
                              ₱{Number(item.price || 0).toFixed(2)}
                            </Text>
                            {Number(item.originalPrice || 0) >
                              Number(item.price || 0) && (
                              <Text style={styles.oldPrice}>
                                ₱{Number(item.originalPrice).toFixed(2)}
                              </Text>
                            )}
                          </View>

                          <View style={styles.quantityContainer}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => changeQty(item.id, -1)}
                            >
                              <Ionicons
                                name="remove"
                                size={15}
                                color={Colors.primary}
                              />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>
                              {item.quantity}
                            </Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => changeQty(item.id, 1)}
                            >
                              <Ionicons
                                name="add"
                                size={15}
                                color={Colors.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.cartCard,
              {
                flexDirection: "column",
                alignItems: "center",
                paddingVertical: 28,
              },
            ]}
          >
            <Ionicons name="cart-outline" size={32} color={Colors.icon} />
            <Text style={[styles.productName, { marginTop: 8 }]}>
              Your Rescue Cart is empty
            </Text>
            <Text style={styles.establishmentName}>
              Browse the Home feed to rescue discounted surplus food.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => switchConsumerTab("Home")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.addMoreText}>Add more items</Text>
        </TouchableOpacity>

        {merchantNames.length > 0 && (
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              !selectedMerchantName && { opacity: 0.6 },
            ]}
            activeOpacity={0.88}
            onPress={handleProceedToPaymentSummary}
          >
            <Ionicons name="receipt-outline" size={17} color={Colors.white} />
            <Text style={styles.checkoutText} numberOfLines={1}>
              {selectedMerchantName
                ? `Proceed to Payment Summary (${selectedMerchantName})`
                : "Proceed to Payment Summary"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <ReserveAlertModal
        visible={modalAlert.visible}
        title={modalAlert.title}
        message={modalAlert.message}
        type={modalAlert.type}
        onClose={() => setModalAlert((p) => ({ ...p, visible: false }))}
      />

      <ConsumerBottomNav activeTab="Cart" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  titleSection: { marginBottom: 16 },
  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },
  pageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.primary1,
    marginTop: 2,
  },
  merchantGroupCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  merchantGroupCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F9FCFA",
  },
  merchantHeaderBar: {
    backgroundColor: "#E8EFEA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  merchantHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  merchantRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.primary1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  merchantRadioActive: { borderColor: Colors.primary },
  merchantRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.primary,
  },
  merchantTitleText: {
    fontFamily: "PoppinsBold",
    fontSize: 13.5,
    color: Colors.primary2,
  },
  merchantSubText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10.5,
    color: Colors.primary1,
  },
  selectMerchantBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  selectMerchantBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.white,
  },
  cartCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    marginBottom: 10,
  },
  productImage: {
    width: 84,
    height: 90,
    borderRadius: 10,
    backgroundColor: Colors.input,
  },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  productTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  productNameContainer: { flex: 1, paddingRight: 6 },
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
  deleteButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  productDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -15,
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
    marginBottom: 14,
  },
  addMoreText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary,
  },
  checkoutButton: {
    height: 50,
    backgroundColor: Colors.button,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "PoppinsSemiBold",
    fontSize: 12.5,
    color: Colors.white,
  },
  bottomSpace: { height: 16 },
});