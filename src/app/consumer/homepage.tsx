import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";

type FoodItem = {
  id: string;
  name: string;
  establishment: string;
  price: number;
  originalPrice: number;
  floorPrice: number;
  discount: number;
  quantity: number;
  unit: string;
  expiryDate: string;
  expiryTime: string;
  storageCondition: string;
  preparationDate: string;
  image: string;
  category: string;
  distance: string;
  expiryTimestamp: number;
};

type Establishment = {
  id: string;
  name: string;
  category: string;
  distance: string;
  image: string;
};

const CART_STORAGE_KEY = "@reserve_cart";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

const parseSafeDate = (dateStr: string, timeStr?: string) => {
  try {
    let full = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    full = full.replace(/,/g, "").replace(/\s+/g, " ").trim();

    const parts = full.split(" ");
    const monthIndex = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ].indexOf(parts[0]);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    let hours = 0;
    let minutes = 0;

    if (parts[3]) {
      const timeParts = parts[3].split(":");
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);

      const fullUpper = full.toUpperCase();
      if (fullUpper.includes("PM") && hours < 12) hours += 12;
      if (fullUpper.includes("AM") && hours === 12) hours = 0;
    }

    return new Date(year, monthIndex, day, hours, minutes).getTime();
  } catch (error) {
    return new Date().getTime();
  }
};

const getLivePricingData = (
  prepDate: string,
  expDate: string,
  expTime: string,
  initialPrice: number,
  minPrice: number
) => {
  const startTime = parseSafeDate(prepDate);
  const endTime = parseSafeDate(expDate, expTime);
  const now = new Date().getTime();
  const distance = endTime - now;

  if (distance <= 0) {
    return {
      timeLeft: "Time's up",
      livePrice: minPrice > 0 ? minPrice : initialPrice,
      isExpired: true,
    };
  }

  const d = Math.floor(distance / (1000 * 60 * 60 * 24));
  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((distance % (1000 * 60)) / 1000);

  const timeLeft = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;

  const totalHours = (endTime - startTime) / (1000 * 60 * 60);
  const totalDrop = initialPrice - minPrice;
  const hourlyDropAmount = totalHours > 0 ? totalDrop / totalHours : 0;
  const hoursPassed = Math.floor((now - startTime) / (1000 * 60 * 60));

  let livePrice = initialPrice;
  if (hoursPassed > 0 && minPrice > 0 && initialPrice > minPrice) {
    livePrice = initialPrice - hourlyDropAmount * hoursPassed;
    if (livePrice < minPrice) livePrice = minPrice;
  }

  return {
    timeLeft,
    livePrice: Math.round(livePrice * 100) / 100,
    isExpired: false,
  };
};

const LiveCountdown = ({
  prepDate,
  expiryDate,
  expiryTime,
  initialPrice,
  floorPrice,
  textStyle,
}: {
  prepDate: string;
  expiryDate: string;
  expiryTime: string;
  initialPrice: number;
  floorPrice: number;
  textStyle?: any;
}) => {
  const [data, setData] = useState(() =>
    getLivePricingData(prepDate, expiryDate, expiryTime, initialPrice, floorPrice)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setData(
        getLivePricingData(prepDate, expiryDate, expiryTime, initialPrice, floorPrice)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [prepDate, expiryDate, expiryTime, initialPrice, floorPrice]);

  return (
    <View style={styles.timerRow}>
      <Ionicons
        name="time-outline"
        size={13}
        color={data.isExpired ? "#B3261E" : Colors.primary}
      />
      <Text
        style={[
          styles.timerText,
          data.isExpired && styles.timerExpiredText,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {data.timeLeft}
      </Text>
    </View>
  );
};

export default function Homepage() {
  const [consumerName, setConsumerName] = useState("Consumer");
  const [consumerCity, setConsumerCity] = useState("Cebu City");
  const [searchText, setSearchText] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);

  const [liveListings, setLiveListings] = useState<FoodItem[]>([]);
  const [dynamicEstablishments, setDynamicEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLivePrice, setModalLivePrice] = useState(0);

  useEffect(() => {
    loadConsumerIdentity();
    loadCart();
    fetchMarketplaceListings();
  }, []);

  const loadConsumerIdentity = async () => {
    try {
      const storedName = await getStorageItem("entity_name");
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      if (storedName) setConsumerName(storedName.split(" ")[0]);

      const res = await api.get(
        `listings/consumer-portal/${storedId}/?email=${encodeURIComponent(storedEmail)}`
      );
      if (res.data?.profile?.full_name) {
        setConsumerName(res.data.profile.full_name.split(" ")[0]);
      }
      if (res.data?.profile?.address) {
        setConsumerCity(res.data.profile.address);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!selectedFood) return;
    const interval = setInterval(() => {
      const res = getLivePricingData(
        selectedFood.preparationDate,
        selectedFood.expiryDate,
        selectedFood.expiryTime,
        selectedFood.price,
        selectedFood.floorPrice
      );
      setModalLivePrice(res.livePrice);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedFood]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const cart = JSON.parse(storedCart);
        const totalItems = cart.reduce(
          (total: number, item: any) => total + (item.quantity || 0),
          0
        );
        setCartCount(totalItems);
      }
    } catch (error) {
      console.log("Error loading cart:", error);
    }
  };

  const fetchMarketplaceListings = async () => {
    try {
      setLoading(true);
      const storedId = (await getStorageItem("profile_id")) || "1";
      const storedEmail = (await getStorageItem("user_email")) || "";
      const response = await api.get(
        `listings/?consumer=${storedId}&email=${encodeURIComponent(storedEmail)}&radius=10`
      );

      const formatted: FoodItem[] = (Array.isArray(response.data) ? response.data : [])
        .filter((item: any) => Number(item.qty_available ?? item.quantity ?? 0) > 0)
        .map((item: any, index: number) => {
          const orig = Number(item.original_price || item.orig_price || 0);
          const current = Number(item.price || item.discounted_price || 0);
          const floor = Number(item.floor_price || 0);
          const discountVal =
            orig > current && orig > 0
              ? Math.round(((orig - current) / orig) * 100)
              : 15;
          const expDateStr = item.expiry_date || "Oct 25, 2026";
          const expTimeStr = item.expiry_time || "11:59 PM";

          return {
            id: String(item.prod_id || item.id || `fallback-${index}`),
            name: item.prod_name || "Surplus Item",
            establishment: item.merchant_name || "Partner Merchant",
            price: current,
            originalPrice: orig > 0 ? orig : current,
            floorPrice: floor,
            discount: discountVal,
            quantity: Number(item.qty_available ?? item.quantity ?? 0),
            unit: item.unit_name || "pcs",
            preparationDate:
              item.safely_anchor_time ||
              item.preparation_date ||
              "Oct 20, 2026, 08:00 AM",
            expiryDate: expDateStr,
            expiryTime: expTimeStr,
            storageCondition: item.storage_condition || "Ambient (25°C)",
            image:
              item.image_path ||
              "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
            category:
              typeof item.category === "string" ? item.category : "Surplus",
            distance: item.distance || "0.8 km",
            expiryTimestamp: parseSafeDate(expDateStr, expTimeStr),
          };
        });

      formatted.sort(
        (a: FoodItem, b: FoodItem) => a.expiryTimestamp - b.expiryTimestamp
      );
      setLiveListings(formatted);

      // Derive unique active Establishments from live listings
      const estMap = new Map<string, Establishment>();
      formatted.forEach((f, idx) => {
        if (!estMap.has(f.establishment)) {
          estMap.set(f.establishment, {
            id: `EST-${idx}`,
            name: f.establishment,
            category: f.category,
            distance: f.distance,
            image: f.image,
          });
        }
      });
      setDynamicEstablishments(Array.from(estMap.values()));
    } catch (error) {
      console.log("Error fetching marketplace listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (food: FoodItem, qty: number) => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let cart = storedCart ? JSON.parse(storedCart) : [];

      const existingIndex = cart.findIndex((item: any) => item.id === food.id);
      const finalCartPrice = modalLivePrice > 0 ? modalLivePrice : food.price;

      if (existingIndex !== -1) {
        cart[existingIndex].quantity = Math.min(
          food.quantity,
          cart[existingIndex].quantity + qty
        );
        cart[existingIndex].price = finalCartPrice;
      } else {
        cart.push({
          ...food,
          price: finalCartPrice,
          maxStock: food.quantity,
          quantity: qty,
        });
      }

      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      const totalItems = cart.reduce(
        (total: number, item: any) => total + (item.quantity || 0),
        0
      );
      setCartCount(totalItems);

      setSelectedFood(null);
      setQuantity(1);

      if (Platform.OS === "web") {
        alert(
          `${food.name} (${qty}x) added to your Rescue Cart at ₱${finalCartPrice.toFixed(2)}!`
        );
      } else {
        Alert.alert(
          "Added to Cart",
          `${food.name} (${qty}x) has been added to your cart at ₱${finalCartPrice.toFixed(2)}!`
        );
      }
    } catch (error) {
      console.log("Error adding to cart:", error);
    }
  };

  const searchFilter = (items: FoodItem[]) => {
    if (!searchText.trim()) return items;
    const search = searchText.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.establishment.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    );
  };

  const filteredListings = searchFilter(liveListings);

  const openFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
    const initialCalc = getLivePricingData(
      food.preparationDate,
      food.expiryDate,
      food.expiryTime,
      food.price,
      food.floorPrice
    );
    setModalLivePrice(initialCalc.livePrice);
  };

  const FoodCard = ({
    item,
    horizontal = false,
  }: {
    item: FoodItem;
    horizontal?: boolean;
  }) => {
    const cardCalc = getLivePricingData(
      item.preparationDate,
      item.expiryDate,
      item.expiryTime,
      item.price,
      item.floorPrice
    );

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={horizontal ? styles.featuredCard : styles.foodCard}
        onPress={() => openFood(item)}
      >
        <View
          style={
            horizontal
              ? styles.featuredImageContainer
              : styles.foodImageContainer
          }
        >
          <Image
            source={{ uri: item.image }}
            style={horizontal ? styles.featuredImage : styles.foodImage}
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}% OFF</Text>
          </View>
        </View>

        <View
          style={horizontal ? styles.featuredContent : styles.foodCardContent}
        >
          <Text style={styles.foodName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.establishmentName} numberOfLines={1}>
            {item.establishment}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.foodPrice}>
              ₱{cardCalc.livePrice.toFixed(2)}
            </Text>
            {item.originalPrice > cardCalc.livePrice && (
              <Text style={styles.originalPrice}>
                ₱{item.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.detailsMetaRow}>
            <LiveCountdown
              prepDate={item.preparationDate}
              expiryDate={item.expiryDate}
              expiryTime={item.expiryTime}
              initialPrice={item.price}
              floorPrice={item.floorPrice}
            />
          </View>

          <View style={styles.foodBottomRow}>
            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={12} color={Colors.icon} />
              <Text style={styles.distanceText}>{item.distance}</Text>
            </View>
            <Text style={styles.availableText}>{item.quantity} left</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EstablishmentCard = ({ item }: { item: Establishment }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.establishmentCard}
        onPress={() => setSearchText(item.name)}
      >
        <Image source={{ uri: item.image }} style={styles.establishmentImage} />
        <View style={styles.establishmentInfo}>
          <Text style={styles.establishmentNameLarge} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.establishmentCategory}>{item.category}</Text>
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={12} color={Colors.icon} />
            <Text style={styles.distanceText}>{item.distance} away</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.icon} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.logoSubtitle}>Consumer Portal</Text>
        </View>
        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={13} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {consumerCity}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {consumerName}!</Text>
          <Text style={styles.welcomeSubtext}>
            Discover affordable surplus food near you.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search food or establishments"
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Rescues</Text>
            <Text style={styles.sectionSubtitle}>Great food, lower prices.</Text>
          </View>
        </View>

        {filteredListings.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {filteredListings.map((item, index) => (
              <FoodCard key={item.id || index} item={item} horizontal />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptySearch}>
            <Ionicons name="search-outline" size={24} color={Colors.icon} />
            <Text style={styles.emptySearchText}>
              {loading ? "Loading listings..." : "No active listings found."}
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <Text style={styles.sectionSubtitle}>
              Popular surplus food nearby.
            </Text>
          </View>
        </View>

        {filteredListings.length > 0 ? (
          <View style={styles.foodGrid}>
            {filteredListings.map((item, index) => (
              <FoodCard key={item.id || index} item={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptySearch}>
            <Ionicons name="search-outline" size={24} color={Colors.icon} />
            <Text style={styles.emptySearchText}>
              {loading
                ? "Loading recommendations..."
                : "No recommendations found."}
            </Text>
          </View>
        )}

        {dynamicEstablishments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Partner Establishments</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap a store to filter its surplus listings.
                </Text>
              </View>
            </View>

            <View style={styles.establishmentList}>
              {dynamicEstablishments.map((item) => (
                <EstablishmentCard key={item.id} item={item} />
              ))}
            </View>
          </>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* FOOD DETAIL MODAL */}
      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFood(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedFood && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Food Details</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedFood(null)}
                  >
                    <Ionicons name="close" size={20} color={Colors.primary2} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScroll}
                >
                  <Image
                    source={{ uri: selectedFood.image }}
                    style={styles.modalFoodImage}
                  />

                  <View style={styles.modalDiscountBadge}>
                    <Text style={styles.discountText}>
                      {selectedFood.discount}% OFF
                    </Text>
                  </View>

                  <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                  <Text style={styles.modalEstablishment}>
                    {selectedFood.establishment}
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoItem}>
                      <Ionicons
                        name="location-outline"
                        size={15}
                        color={Colors.icon}
                      />
                      <Text style={styles.modalInfoText}>
                        {selectedFood.distance}
                      </Text>
                    </View>

                    <View style={styles.modalInfoItem}>
                      <Ionicons
                        name="cube-outline"
                        size={15}
                        color={Colors.icon}
                      />
                      <Text style={styles.modalInfoText}>
                        {selectedFood.quantity} available
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalTimerBox}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={Colors.primary}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.modalTimerLabel}>
                        Expiry Countdown & Deadline
                      </Text>
                      <LiveCountdown
                        prepDate={selectedFood.preparationDate}
                        expiryDate={selectedFood.expiryDate}
                        expiryTime={selectedFood.expiryTime}
                        initialPrice={selectedFood.price}
                        floorPrice={selectedFood.floorPrice}
                        textStyle={{ fontSize: 13, fontFamily: "PoppinsBold" }}
                      />
                      <Text style={styles.modalStorageText}>
                        Storage: {selectedFood.storageCondition} • Due:{" "}
                        {selectedFood.expiryDate} {selectedFood.expiryTime}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalPriceBox}>
                    <View>
                      <Text style={styles.modalPriceLabel}>
                        Live Rescue Price (10% Online Deposit to Reserve)
                      </Text>
                      <Text style={styles.modalPrice}>
                        ₱
                        {(modalLivePrice > 0
                          ? modalLivePrice
                          : selectedFood.price
                        ).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.modalOriginalPrice}>
                      ₱{selectedFood.originalPrice.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        setQuantity((prev) => Math.max(1, prev - 1))
                      }
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        setQuantity((prev) =>
                          Math.min(selectedFood.quantity, prev + 1)
                        )
                      }
                    >
                      <Ionicons name="add" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => addToCart(selectedFood, quantity)}
                  >
                    <Ionicons
                      name="cart-outline"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.addToCartText}>Add to Rescue Cart</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={1}
        >
          <Ionicons name="home" size={22} color={Colors.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/cart")}
        >
          <View style={styles.cartIconWrapper}>
            <Ionicons name="cart-outline" size={22} color={Colors.icon} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.navText}>My Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/claims")}
        >
          <Ionicons name="receipt-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace("/consumer/profile")}
        >
          <Ionicons name="person-outline" size={22} color={Colors.icon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  header: { height: 64, paddingHorizontal: 16, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { fontFamily: "PoppinsBold", fontSize: 22, color: Colors.primary, letterSpacing: 0.5 },
  logoSubtitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: -3 },
  locationPill: { height: 32, maxWidth: 160, paddingHorizontal: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2 },
  welcomeSection: { marginBottom: 16 },
  welcomeText: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  welcomeSubtext: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 2 },
  searchContainer: { height: 46, paddingHorizontal: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, flexDirection: "row", alignItems: "center", marginBottom: 20, elevation: 1 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginLeft: 8, paddingVertical: 0 },
  sectionHeader: { marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 17, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  featuredScroll: { paddingBottom: 4, gap: 12 },
  featuredCard: { width: 230, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden" },
  featuredImageContainer: { width: "100%", height: 140, position: "relative" },
  featuredImage: { width: "100%", height: "100%", resizeMode: "cover" },
  featuredContent: { padding: 12 },
  foodGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  foodCard: { width: "48.5%", backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  foodImageContainer: { width: "100%", height: 125, position: "relative" },
  foodImage: { width: "100%", height: "100%", resizeMode: "cover" },
  discountBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: Colors.primary, borderRadius: 6 },
  discountText: { fontFamily: "PoppinsSemiBold", fontSize: 9, color: Colors.white },
  foodCardContent: { padding: 10 },
  foodName: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  establishmentName: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  foodPrice: { fontFamily: "PoppinsBold", fontSize: 15, color: Colors.primary },
  originalPrice: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, textDecorationLine: "line-through", marginLeft: 6 },
  detailsMetaRow: { marginTop: 4, marginBottom: 2 },
  timerRow: { flexDirection: "row", alignItems: "center" },
  timerText: { fontFamily: "PoppinsMedium", fontSize: 10, color: Colors.primary, marginLeft: 4 },
  timerExpiredText: { color: "#B3261E", fontFamily: "PoppinsBold" },
  foodBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 6 },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distanceText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon },
  availableText: { fontFamily: "PoppinsMedium", fontSize: 10, color: Colors.primary1 },
  establishmentList: { gap: 10 },
  establishmentCard: { padding: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, flexDirection: "row", alignItems: "center" },
  establishmentImage: { width: 56, height: 56, borderRadius: 10, resizeMode: "cover" },
  establishmentInfo: { flex: 1, marginLeft: 12 },
  establishmentNameLarge: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  establishmentCategory: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginTop: 1, marginBottom: 2 },
  emptySearch: { height: 100, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptySearchText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "88%", overflow: "hidden" },
  modalHeader: { height: 56, paddingHorizontal: 16, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  modalCloseButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  modalScroll: { padding: 16, paddingBottom: 24 },
  modalFoodImage: { width: "100%", height: 210, borderRadius: 12, resizeMode: "cover" },
  modalDiscountBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.primary, borderRadius: 6, marginTop: 12 },
  modalFoodName: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary2, marginTop: 8 },
  modalEstablishment: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1 },
  modalInfoRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 16 },
  modalInfoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  modalInfoText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.icon },
  modalTimerBox: { marginTop: 14, padding: 12, backgroundColor: Colors.input, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center" },
  modalTimerLabel: { fontFamily: "PoppinsMedium", fontSize: 10, color: Colors.primary1 },
  modalStorageText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon, marginTop: 2 },
  modalPriceBox: { marginTop: 14, padding: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalPriceLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  modalPrice: { fontFamily: "PoppinsBold", fontSize: 22, color: Colors.primary },
  modalOriginalPrice: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.placeholder, textDecorationLine: "line-through" },
  quantityLabel: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginTop: 16, marginBottom: 6 },
  quantitySelector: { height: 44, width: 130, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 },
  quantityButton: { width: 32, height: 32, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  quantityText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.primary2 },
  addToCartButton: { height: 48, backgroundColor: Colors.button, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20, gap: 6 },
  addToCartText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },
  bottomNav: { height: 84, paddingBottom: 20, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 8, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 4, borderRadius: 8 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.icon, marginTop: 2 },
  navTextActive: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
  cartIconWrapper: { position: "relative" },
  cartBadge: { position: "absolute", top: -6, right: -10, minWidth: 15, height: 15, paddingHorizontal: 3, borderRadius: 7.5, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: Colors.white },
  cartBadgeText: { fontFamily: "PoppinsSemiBold", fontSize: 7, color: Colors.white },
  bottomSpacing: { height: 12 },
});