import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   TYPES
===================================================== */

type FoodItem = {
  id: string;
  name: string;
  establishment: string;
  price: number;
  originalPrice: number;
  discount: number;
  quantity: number;
  image: string;
  category: string;
  distance: string;
};

type Establishment = {
  id: string;
  name: string;
  category: string;
  distance: string;
  image: string;
};

/* =====================================================
   MOCK DATA
===================================================== */

const featuredRescues: FoodItem[] = [
  {
    id: "F001",
    name: "Fresh Bread Bundle",
    establishment: "Bread & Co.",
    price: 65,
    originalPrice: 95,
    discount: 32,
    quantity: 5,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
    category: "Bakery",
    distance: "0.8 km",
  },
  {
    id: "F002",
    name: "Chicken Meal",
    establishment: "Good Eats",
    price: 85,
    originalPrice: 120,
    discount: 29,
    quantity: 8,
    image:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=700&q=80",
    category: "Meals",
    distance: "1.2 km",
  },
  {
    id: "F003",
    name: "Creamy Pasta",
    establishment: "Pasta Corner",
    price: 75,
    originalPrice: 110,
    discount: 32,
    quantity: 4,
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=80",
    category: "Pasta",
    distance: "1.5 km",
  },
];

const recommendations: FoodItem[] = [
  {
    id: "F004",
    name: "Assorted Pastries",
    establishment: "Daily Bake",
    price: 55,
    originalPrice: 80,
    discount: 31,
    quantity: 6,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
    category: "Bakery",
    distance: "1.0 km",
  },
  {
    id: "F005",
    name: "Classic Burger",
    establishment: "Burger House",
    price: 70,
    originalPrice: 100,
    discount: 30,
    quantity: 3,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
    category: "Fast Food",
    distance: "1.8 km",
  },
  {
    id: "F006",
    name: "Fresh Salad Bowl",
    establishment: "Green Plate",
    price: 60,
    originalPrice: 90,
    discount: 33,
    quantity: 5,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80",
    category: "Healthy",
    distance: "2.0 km",
  },
];

const establishments: Establishment[] = [
  {
    id: "E001",
    name: "Bread & Co.",
    category: "Bakery",
    distance: "0.8 km",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "E002",
    name: "Good Eats",
    category: "Restaurant",
    distance: "1.2 km",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "E003",
    name: "Pasta Corner",
    category: "Italian",
    distance: "1.5 km",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=80",
  },
];

/* =====================================================
   STORAGE
===================================================== */

const CART_STORAGE_KEY = "@reserve_cart";

/* =====================================================
   COMPONENT
===================================================== */

export default function Homepage() {
  const [searchText, setSearchText] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);

  /* =====================================================
     LOAD CART COUNT
  ===================================================== */

  useEffect(() => {
    loadCart();
  }, []);

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

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = async (food: FoodItem, qty: number) => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

      let cart = storedCart ? JSON.parse(storedCart) : [];

      const existingIndex = cart.findIndex(
        (item: any) => item.id === food.id
      );

      if (existingIndex !== -1) {
        cart[existingIndex].quantity += qty;
      } else {
        cart.push({
          ...food,
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

      Alert.alert(
        "Added to Cart",
        `${food.name} has been added to your cart.`
      );
    } catch (error) {
      console.log("Error adding to cart:", error);
    }
  };

  /* =====================================================
     SEARCH
  ===================================================== */

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

  const filteredFeatured = searchFilter(featuredRescues);
  const filteredRecommendations = searchFilter(recommendations);

  /* =====================================================
     OPEN FOOD
  ===================================================== */

  const openFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
  };

  /* =====================================================
     FOOD CARD
  ===================================================== */

  const FoodCard = ({
    item,
    horizontal = false,
  }: {
    item: FoodItem;
    horizontal?: boolean;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
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
            <Text style={styles.discountText}>
              {item.discount}% OFF
            </Text>
          </View>
        </View>

        <View
          style={
            horizontal
              ? styles.featuredContent
              : styles.foodCardContent
          }
        >
          <Text
            style={styles.foodName}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={styles.establishmentName}
            numberOfLines={1}
          >
            {item.establishment}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.foodPrice}>
              ₱{item.price}
            </Text>

            <Text style={styles.originalPrice}>
              ₱{item.originalPrice}
            </Text>
          </View>

          <View style={styles.foodBottomRow}>
            <View style={styles.distanceRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={Colors.icon}
              />

              <Text style={styles.distanceText}>
                {item.distance}
              </Text>
            </View>

            <Text style={styles.availableText}>
              {item.quantity} left
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* =====================================================
     ESTABLISHMENT CARD
  ===================================================== */

  const EstablishmentCard = ({
    item,
  }: {
    item: Establishment;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.establishmentCard}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.establishmentImage}
        />

        <View style={styles.establishmentInfo}>
          <Text
            style={styles.establishmentNameLarge}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text style={styles.establishmentCategory}>
            {item.category}
          </Text>

          <View style={styles.distanceRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={Colors.icon}
            />

            <Text style={styles.distanceText}>
              {item.distance} away
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.icon}
        />
      </TouchableOpacity>
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <SafeAreaView style={styles.container}>
      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <View>
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
            WELCOME
        ================================================= */}

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome, Sky!
          </Text>

          <Text style={styles.welcomeSubtext}>
            Discover affordable surplus food near you.
          </Text>
        </View>

        {/* =================================================
            SEARCH
        ================================================= */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Colors.icon}
          />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search food or establishments"
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />

          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText("")}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={Colors.icon}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* =================================================
            FEATURED
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Featured Rescues
            </Text>

            <Text style={styles.sectionSubtitle}>
              Great food, lower prices.
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.viewAllText}>
              View all
            </Text>
          </TouchableOpacity>
        </View>

        {filteredFeatured.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {filteredFeatured.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                horizontal
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptySearch}>
            <Ionicons
              name="search-outline"
              size={24}
              color={Colors.icon}
            />

            <Text style={styles.emptySearchText}>
              No food found.
            </Text>
          </View>
        )}

        {/* =================================================
            RECOMMENDATIONS
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Recommended for You
            </Text>

            <Text style={styles.sectionSubtitle}>
              Popular surplus food nearby.
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.viewAllText}>
              View all
            </Text>
          </TouchableOpacity>
        </View>

        {filteredRecommendations.length > 0 ? (
          <View style={styles.foodGrid}>
            {filteredRecommendations.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySearch}>
            <Ionicons
              name="search-outline"
              size={24}
              color={Colors.icon}
            />

            <Text style={styles.emptySearchText}>
              No recommendations found.
            </Text>
          </View>
        )}

        {/* =================================================
            NEARBY ESTABLISHMENTS
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Nearby Establishments
            </Text>

            <Text style={styles.sectionSubtitle}>
              Find surplus food around your area.
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.viewAllText}>
              View all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.establishmentList}>
          {establishments.map((item) => (
            <EstablishmentCard
              key={item.id}
              item={item}
            />
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* =====================================================
          FOOD DETAIL MODAL
      ===================================================== */}

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
                  <Text style={styles.modalTitle}>
                    Food Details
                  </Text>

                  <TouchableOpacity
                    onPress={() => setSelectedFood(null)}
                  >
                    <Ionicons
                      name="close"
                      size={23}
                      color={Colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScroll}
                >
                  <Image
                    source={{
                      uri: selectedFood.image,
                    }}
                    style={styles.modalFoodImage}
                  />

                  <View style={styles.modalDiscountBadge}>
                    <Text style={styles.discountText}>
                      {selectedFood.discount}% OFF
                    </Text>
                  </View>

                  <Text style={styles.modalFoodName}>
                    {selectedFood.name}
                  </Text>

                  <Text style={styles.modalEstablishment}>
                    {selectedFood.establishment}
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoItem}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={Colors.icon}
                      />

                      <Text style={styles.modalInfoText}>
                        {selectedFood.distance}
                      </Text>
                    </View>

                    <View style={styles.modalInfoItem}>
                      <Ionicons
                        name="cube-outline"
                        size={16}
                        color={Colors.icon}
                      />

                      <Text style={styles.modalInfoText}>
                        {selectedFood.quantity} available
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalPriceBox}>
                    <View>
                      <Text style={styles.modalPriceLabel}>
                        Rescue Price
                      </Text>

                      <Text style={styles.modalPrice}>
                        ₱{selectedFood.price}
                      </Text>
                    </View>

                    <Text style={styles.modalOriginalPrice}>
                      ₱{selectedFood.originalPrice}
                    </Text>
                  </View>

                  {/* QUANTITY */}

                  <Text style={styles.quantityLabel}>
                    Quantity
                  </Text>

                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        setQuantity((prev) =>
                          Math.max(1, prev - 1)
                        )
                      }
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>
                      {quantity}
                    </Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        setQuantity((prev) =>
                          Math.min(
                            selectedFood.quantity,
                            prev + 1
                          )
                        )
                      }
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* ADD TO CART */}

                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() =>
                      addToCart(selectedFood, quantity)
                    }
                  >
                    <Ionicons
                      name="cart-outline"
                      size={19}
                      color={Colors.white}
                    />

                    <Text style={styles.addToCartText}>
                      Add to Cart
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <View style={styles.bottomNav}>
        {/* HOME */}

        <TouchableOpacity
          style={[
            styles.navItem,
            styles.navItemActive,
          ]}
          onPress={() =>
            router.replace("/consumer/homepage")
          }
        >
          <Ionicons
            name="home"
            size={21}
            color={Colors.primary}
          />

          <Text
            style={[
              styles.navLabel,
              styles.navLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* SEARCH */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSearchText("")}
        >
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
          style={styles.navItem}
          onPress={() =>
            router.push("/consumer/cart")
          }
        >
          <View style={styles.cartIconWrapper}>
            <Ionicons
              name="cart-outline"
              size={21}
              color={Colors.icon}
            />

            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.navLabel}>
            My Cart
          </Text>
        </TouchableOpacity>

        {/* CLAIMS */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push("/consumer/claims")
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
            router.push("/consumer/profile")
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
    </SafeAreaView>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  /* =====================================================
     CONTAINER
  ===================================================== */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
  },

  /* =====================================================
     HEADER
  ===================================================== */

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
  },

  locationText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 12,
    color: Colors.text,
    marginLeft: 4,
  },

  /* =====================================================
     WELCOME
  ===================================================== */

  welcomeSection: {
    marginBottom: 17,
  },

  welcomeText: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    lineHeight: 30,
    color: Colors.primary2,
  },

  welcomeSubtext: {
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    lineHeight: 17,
    color: Colors.primary1,
    marginTop: 2,
  },

  /* =====================================================
     SEARCH
  ===================================================== */

  searchContainer: {
    height: 45,
    paddingHorizontal: 13,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  searchInput: {
    flex: 1,
    fontFamily: "PoppinsRegular",
    fontSize: 11,
    color: Colors.text,
    marginLeft: 9,
    paddingVertical: 0,
  },

  /* =====================================================
     SECTION HEADER
  ===================================================== */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    lineHeight: 22,
    color: Colors.primary2,
  },

  sectionSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    lineHeight: 14,
    color: Colors.primary1,
    marginTop: 1,
  },

  viewAllText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary,
    marginBottom: 2,
  },

  /* =====================================================
     FEATURED
  ===================================================== */

  featuredScroll: {
    paddingRight: 4,
    paddingBottom: 3,
  },

  featuredCard: {
    width: 225,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
  },

  featuredImageContainer: {
    width: "100%",
    height: 145,
    position: "relative",
  },

  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  featuredContent: {
    padding: 11,
  },

  /* =====================================================
     FOOD CARDS
  ===================================================== */

  foodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  foodCard: {
    width: "48.5%",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },

  foodImageContainer: {
    width: "100%",
    height: 125,
    position: "relative",
  },

  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },

  discountText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 7.5,
    lineHeight: 10,
    color: Colors.white,
  },

  foodCardContent: {
    padding: 10,
  },

  foodName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary2,
  },

  establishmentName: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 12,
    color: Colors.primary1,
    marginTop: 1,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  foodPrice: {
    fontFamily: "PoppinsBold",
    fontSize: 13,
    lineHeight: 17,
    color: Colors.primary,
  },

  originalPrice: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
    marginLeft: 5,
  },

  foodBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
  },

  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  distanceText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: Colors.icon,
    marginLeft: 3,
  },

  availableText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    lineHeight: 11,
    color: Colors.primary1,
  },

  /* =====================================================
     ESTABLISHMENTS
  ===================================================== */

  establishmentList: {
    gap: 9,
  },

  establishmentCard: {
    minHeight: 76,
    padding: 9,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  establishmentImage: {
    width: 58,
    height: 58,
    borderRadius: 8,
    resizeMode: "cover",
  },

  establishmentInfo: {
    flex: 1,
    marginLeft: 10,
  },

  establishmentNameLarge: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary2,
  },

  establishmentCategory: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    lineHeight: 12,
    color: Colors.primary1,
    marginTop: 1,
    marginBottom: 4,
  },

  /* =====================================================
     EMPTY
  ===================================================== */

  emptySearch: {
    height: 100,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  emptySearchText: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.primary1,
    marginTop: 5,
  },

  /* =====================================================
     MODAL
  ===================================================== */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18,55,44,0.50)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "88%",
    overflow: "hidden",
  },

  modalHeader: {
    height: 58,
    paddingHorizontal: 18,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 17,
    color: Colors.primary2,
  },

  modalScroll: {
    padding: 18,
    paddingBottom: 28,
  },

  modalFoodImage: {
    width: "100%",
    height: 210,
    borderRadius: 10,
    resizeMode: "cover",
  },

  modalDiscountBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Colors.primary,
    borderRadius: 5,
    marginTop: 12,
  },

  modalFoodName: {
    fontFamily: "PoppinsBold",
    fontSize: 21,
    lineHeight: 27,
    color: Colors.primary2,
    marginTop: 10,
  },

  modalEstablishment: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    lineHeight: 15,
    color: Colors.primary1,
    marginTop: 2,
  },

  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 18,
  },

  modalInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  modalInfoText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.icon,
    marginLeft: 4,
  },

  modalPriceBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalPriceLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
  },

  modalPrice: {
    fontFamily: "PoppinsBold",
    fontSize: 22,
    lineHeight: 28,
    color: Colors.primary,
    marginTop: 1,
  },

  modalOriginalPrice: {
    fontFamily: "PoppinsRegular",
    fontSize: 10,
    color: Colors.placeholder,
    textDecorationLine: "line-through",
  },

  /* =====================================================
     QUANTITY
  ===================================================== */

  quantityLabel: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary2,
    marginTop: 18,
    marginBottom: 8,
  },

  quantitySelector: {
    height: 42,
    width: 125,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },

  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },

  /* =====================================================
     ADD TO CART
  ===================================================== */

  addToCartButton: {
    height: 46,
    backgroundColor: Colors.button,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  addToCartText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 11,
    color: Colors.white,
    marginLeft: 7,
  },

  /* =====================================================
     BOTTOM NAV
  ===================================================== */

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

  /* =====================================================
     CART BADGE
  ===================================================== */

  cartIconWrapper: {
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  cartBadgeText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 6.5,
    lineHeight: 9,
    color: Colors.white,
  },

  bottomSpacing: {
    height: 15,
  },
});