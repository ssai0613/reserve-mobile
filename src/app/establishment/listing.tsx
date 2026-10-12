import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";

/* =====================================================
   FOOD LISTINGS
===================================================== */

const initialFoodListings = [
  {
    id: 1,
    name: "Pan Lamion",
    establishment: "Nena's Bakeshop",
    price: "₱100.00",
    distance: "0.8 km",
    time: "15 minutes left",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
    urgent: true,
    quantity: "20",
    listingDate: "Aug 10, 2026",
    status: "Active",
    category: "Bakery",
    description: "Freshly baked bread available for rescue.",
    preparationDate: "Aug 10, 2026, 10:00 AM",
    storageCondition: "Ambient (25°C)",
    expiryDate: "Aug 12, 2026",
    expiryTime: "18:00",
    rescueVoucher: true,
  },
  {
    id: 2,
    name: "Assorted Bread",
    establishment: "Nena's Bakeshop",
    price: "₱80.00",
    distance: "1.2 km",
    time: "2 hours left",
    image:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=700&q=80",
    urgent: false,
    quantity: "35",
    listingDate: "Aug 10, 2026",
    status: "Active",
    category: "Bakery",
    description: "Assorted freshly baked bread.",
    preparationDate: "Aug 10, 2026, 11:00 AM",
    storageCondition: "Ambient (25°C)",
    expiryDate: "Aug 12, 2026",
    expiryTime: "18:00",
    rescueVoucher: true,
  },
  {
    id: 3,
    name: "Fresh Pastries",
    establishment: "Nena's Bakeshop",
    price: "₱120.00",
    distance: "1.5 km",
    time: "3 hours left",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80",
    urgent: false,
    quantity: "15",
    listingDate: "Aug 10, 2026",
    status: "Active",
    category: "Bakery",
    description: "Fresh pastries prepared earlier today.",
    preparationDate: "Aug 10, 2026, 12:00 PM",
    storageCondition: "Chilled (4°C)",
    expiryDate: "Aug 12, 2026",
    expiryTime: "18:00",
    rescueVoucher: true,
  },
];

/* =====================================================
   TYPES
===================================================== */

type FoodListing = {
  id: number;
  name: string;
  establishment: string;
  price: string;
  distance: string;
  time: string;
  image: string;
  urgent: boolean;
  quantity: string;
  listingDate: string;
  status: string;
  category: string;
  description: string;
  preparationDate: string;
  storageCondition: string;
  expiryDate: string;
  expiryTime: string;
  rescueVoucher: boolean;
};

/* =====================================================
   MAIN LISTING SCREEN
===================================================== */

export default function EstablishmentListing() {
  const [foodListings, setFoodListings] =
    useState<FoodListing[]>(initialFoodListings);

  const [listingModalVisible, setListingModalVisible] =
    useState(false);

  const [viewModalVisible, setViewModalVisible] =
    useState(false);

  const [searchText, setSearchText] = useState("");

  const [selectedFilter, setSelectedFilter] =
    useState("All");

  /* =====================================================
     SELECTED LISTING FOR VIEW / EDIT
  ===================================================== */

  const [selectedListing, setSelectedListing] =
    useState<FoodListing | null>(null);

  const [editingListing, setEditingListing] =
    useState<FoodListing | null>(null);

  /* =====================================================
     MODAL FORM STATES
  ===================================================== */

  const [foodName, setFoodName] = useState("");

  const [preparationDate, setPreparationDate] =
    useState("Aug 10, 2026, 10:00 AM");

  const [category, setCategory] =
    useState("Bakery");

  const [description, setDescription] =
    useState("");

  const [quantity, setQuantity] =
    useState("10");

  const [price, setPrice] =
    useState("₱100");

  const [storageCondition, setStorageCondition] =
    useState("Ambient (25°C)");

  const [expiryDate, setExpiryDate] =
    useState("Aug 12, 2026");

  const [expiryTime, setExpiryTime] =
    useState("18:00");

  const [rescueVoucher, setRescueVoucher] =
    useState(true);

  const [listingStatus, setListingStatus] =
    useState(true);

  /* =====================================================
     FILTER LISTINGS
  ===================================================== */

  const filteredListings = foodListings.filter((item) => {
    const matchesSearch =
      item.name
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      item.establishment
        .toLowerCase()
        .includes(searchText.toLowerCase());

    const matchesFilter =
      selectedFilter === "All" ||
      item.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setFoodName("");
    setPreparationDate("Aug 10, 2026, 10:00 AM");
    setDescription("");
    setQuantity("10");
    setPrice("₱100");
    setCategory("Bakery");
    setStorageCondition("Ambient (25°C)");
    setExpiryDate("Aug 12, 2026");
    setExpiryTime("18:00");
    setRescueVoucher(true);
    setListingStatus(true);
  };

  /* =====================================================
     OPEN ADD LISTING
  ===================================================== */

  const openAddListing = () => {
    setEditingListing(null);
    resetForm();
    setListingModalVisible(true);
  };

  /* =====================================================
     OPEN EDIT LISTING
  ===================================================== */

  const openEditListing = (item: FoodListing) => {
    setEditingListing(item);

    setFoodName(item.name);
    setPreparationDate(
      item.preparationDate || "Aug 10, 2026, 10:00 AM"
    );
    setCategory(item.category);
    setDescription(item.description);
    setQuantity(item.quantity);
    setPrice(item.price);
    setStorageCondition(item.storageCondition);
    setExpiryDate(item.expiryDate);
    setExpiryTime(item.expiryTime);
    setRescueVoucher(item.rescueVoucher);
    setListingStatus(item.status === "Active");

    setListingModalVisible(true);
  };

  /* =====================================================
     OPEN VIEW LISTING
  ===================================================== */

  const openViewListing = (item: FoodListing) => {
    setSelectedListing(item);
    setViewModalVisible(true);
  };

  /* =====================================================
     ADD / UPDATE LISTING
  ===================================================== */

  const saveListing = (status: "Active" | "Draft") => {
    if (!foodName.trim()) {
      return;
    }

    /* ===================================================
       EDIT EXISTING LISTING
    =================================================== */

    if (editingListing) {
      setFoodListings((current) =>
        current.map((item) =>
          item.id === editingListing.id
            ? {
                ...item,
                name: foodName,
                price: price || "₱0",
                quantity: quantity || "0",
                category,
                description,
                preparationDate,
                storageCondition,
                expiryDate,
                expiryTime,
                rescueVoucher,
                status,
                time:
                  status === "Active"
                    ? "24 hours left"
                    : "Not published",
              }
            : item
        )
      );

      setListingModalVisible(false);
      setEditingListing(null);
      resetForm();

      return;
    }

    /* ===================================================
       CREATE NEW LISTING
    =================================================== */

    const newListing: FoodListing = {
      id: Date.now(),
      name: foodName,
      establishment: "Nena's Bakeshop",
      price: price || "₱0",
      distance: "0.5 km",
      time:
        status === "Active"
          ? "24 hours left"
          : "Not published",
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
      urgent: false,
      quantity: quantity || "0",
      listingDate: "Aug 12, 2026",
      status,
      category,
      description,
      preparationDate,
      storageCondition,
      expiryDate,
      expiryTime,
      rescueVoucher,
    };

    setFoodListings((current) => [
      newListing,
      ...current,
    ]);

    setListingModalVisible(false);
    resetForm();
  };

  /* =====================================================
     REMOVE LISTING
  ===================================================== */

  const removeListing = (id: number) => {
    setFoodListings((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  /* =====================================================
     RETURN UI
  ===================================================== */

  return (
    <SafeAreaView style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <View>
          <Text style={styles.logo}>
            RESERVE
          </Text>

          <Text style={styles.headerSubtitle}>
            Establishment Portal
          </Text>
        </View>

        <View style={styles.headerActions}>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/establishment/notifications"
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.primary}
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/establishment/profile"
              )
            }
          >
            <View style={styles.profileCircle}>
              <Ionicons
                name="person"
                size={16}
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>

        </View>

      </View>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* PAGE HEADER */}

        <View style={styles.pageHeader}>

          <Text style={styles.pageTitle}>
            Food listings
          </Text>

        </View>

        {/* ADD LISTING */}

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={openAddListing}
        >

          <View style={styles.createIcon}>
            <Ionicons
              name="add"
              size={23}
              color={Colors.white}
            />
          </View>

          <View style={styles.createTextContainer}>

            <Text style={styles.createTitle}>
              Add food listing
            </Text>

            <Text style={styles.createSubtitle}>
              Post surplus food for consumers
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={Colors.white}
          />

        </TouchableOpacity>

        {/* SEARCH */}

        <View style={styles.searchContainer}>

          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.icon}
          />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search food listings..."
            placeholderTextColor={
              Colors.placeholder
            }
            style={styles.searchInput}
          />

          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText("")}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.icon}
              />
            </TouchableOpacity>
          )}

        </View>

        {/* FILTERS */}

        <View style={styles.filterRow}>

          {["All", "Active", "Draft"].map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.75}
                style={[
                  styles.filterButton,
                  selectedFilter === filter &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedFilter(filter)
                }
              >

                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>

              </TouchableOpacity>
            )
          )}

        </View>

        {/* LISTING HEADER */}

        <View style={styles.sectionHeader}>

          <View>

            <Text style={styles.sectionTitle}>
              Your listings
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredListings.length} listing
              {filteredListings.length !== 1
                ? "s"
                : ""}{" "}
              found
            </Text>

          </View>

        </View>

        {/* LISTINGS */}

        <View style={styles.listingsWrapper}>

          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onView={() =>
                  openViewListing(item)
                }
                onEdit={() =>
                  openEditListing(item)
                }
                onRemove={() =>
                  removeListing(item.id)
                }
              />
            ))
          ) : (
            <View style={styles.emptyCard}>

              <View style={styles.emptyIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={25}
                  color={Colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No listings found
              </Text>

              <Text style={styles.emptyDescription}>
                Try another search or add a new
                food listing.
              </Text>

            </View>
          )}

        </View>

        <View style={{ height: 30 }} />

      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>

        <BottomNavItem
          icon="grid-outline"
          label="Home"
          onPress={() =>
            router.replace(
              "/establishment/dashboard"
            )
          }
        />

        <BottomNavItem
          icon="restaurant"
          label="Listings"
          active
          onPress={() =>
            router.replace(
              "/establishment/listing"
            )
          }
        />

        <BottomNavItem
          icon="basket-outline"
          label="Orders"
          onPress={() =>
            router.push(
              "/establishment/orders"
            )
          }
        />

        <BottomNavItem
          icon="cash-outline"
          label="Earnings"
          onPress={() =>
            router.push(
              "/establishment/earnings"
            )
          }
        />

        <BottomNavItem
          icon="heart-outline"
          label="Donation"
          onPress={() =>
            router.replace(
              "/establishment/donation"
            )
          }
        />

        <BottomNavItem
          icon="person-outline"
          label="Impact"
          onPress={() =>
            router.push(
              "/establishment/impact"
            )
          }
        />

      </View>

      {/* =================================================
          ADD / EDIT LISTING MODAL
      ================================================= */}

      <Modal
        visible={listingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setListingModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.listingModal}>

            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  {editingListing
                    ? "Edit food listing"
                    : "Add food listing"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {editingListing
                    ? "Update the details of your food listing."
                    : "Add details about your surplus food."}
                </Text>

              </View>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={() => {
                  setListingModalVisible(false);
                  setEditingListing(null);
                }}
              >

                <Ionicons
                  name="close"
                  size={22}
                  color={Colors.primary}
                />

              </TouchableOpacity>

            </View>

            {/* MODAL CONTENT */}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalScroll
              }
            >

              {/* FOOD DETAILS */}

              <ModalSection title="Food details">

                <InputLabel text="Food item name" />

                <TextInput
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="e.g. Artisan Sourdough Loaf"
                  placeholderTextColor={
                    Colors.placeholder
                  }
                  style={styles.input}
                />

                <InputLabel text="Food item picture" />

                <TouchableOpacity
                  style={styles.uploadButton}
                  activeOpacity={0.7}
                >

                  <View style={styles.uploadIcon}>

                    <Ionicons
                      name="image-outline"
                      size={22}
                      color={Colors.primary}
                    />

                  </View>

                  <View style={{ flex: 1 }}>

                    <Text style={styles.uploadTitle}>
                      Add food photo
                    </Text>

                    <Text
                      style={styles.uploadSubtitle}
                    >
                      JPG or PNG · Recommended 1:1
                    </Text>

                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.icon}
                  />

                </TouchableOpacity>

                <InputLabel text="Category" />

                <TouchableOpacity
                  style={styles.selectInput}
                  activeOpacity={0.7}
                >

                  <Text style={styles.inputText}>
                    {category}
                  </Text>

                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={Colors.icon}
                  />

                </TouchableOpacity>

                <InputLabel text="Description" />

                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the food item..."
                  placeholderTextColor={
                    Colors.placeholder
                  }
                  multiline
                  textAlignVertical="top"
                  style={styles.descriptionInput}
                />

                <View style={styles.twoColumn}>

                  <View style={{ flex: 1 }}>

                    <InputLabel
                      text="Quantity (kg)"
                    />

                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      style={styles.input}
                    />

                  </View>

                  <View style={{ flex: 1 }}>

                    <InputLabel text="Price" />

                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      style={styles.input}
                    />

                  </View>

                </View>

              </ModalSection>

              {/* STORAGE */}

              <ModalSection
                title="Storage & preparation"
              >

                <InputLabel text="Prepared on" />

                <TextInput
                  value={preparationDate}
                  onChangeText={
                    setPreparationDate
                  }
                  style={styles.input}
                />

                <Text style={styles.helperText}>
                  Enter the date and time the food
                  was prepared.
                </Text>

                <InputLabel
                  text="Storage condition"
                />

                <View style={styles.storageOptions}>

                  <StorageOption
                    title="Ambient"
                    subtitle="25°C"
                    active={
                      storageCondition ===
                      "Ambient (25°C)"
                    }
                    onPress={() =>
                      setStorageCondition(
                        "Ambient (25°C)"
                      )
                    }
                  />

                  <StorageOption
                    title="Chilled"
                    subtitle="4°C"
                    active={
                      storageCondition ===
                      "Chilled (4°C)"
                    }
                    onPress={() =>
                      setStorageCondition(
                        "Chilled (4°C)"
                      )
                    }
                  />

                  <StorageOption
                    title="Frozen"
                    subtitle="-18°C"
                    active={
                      storageCondition ===
                      "Frozen (-18°C)"
                    }
                    onPress={() =>
                      setStorageCondition(
                        "Frozen (-18°C)"
                      )
                    }
                  />

                </View>

              </ModalSection>

              {/* EXPIRY */}

              <ModalSection title="Expiry">

                <Text
                  style={
                    styles.expiryDescription
                  }
                >
                  Set the expected expiry date and
                  time for this listing.
                </Text>

                <View style={styles.expiryInfo}>

                  <View
                    style={
                      styles.expiryInfoIcon
                    }
                  >

                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.primary}
                    />

                  </View>

                  <View style={{ flex: 1 }}>

                    <Text
                      style={
                        styles.expiryInfoTitle
                      }
                    >
                      Suggested expiry
                    </Text>

                    <Text
                      style={
                        styles.expiryInfoValue
                      }
                    >
                      {expiryDate} · {expiryTime}
                    </Text>

                    <Text
                      style={
                        styles.expiryInfoDescription
                      }
                    >
                      Based on preparation time and
                      storage condition.
                    </Text>

                  </View>

                </View>

                <InputLabel text="Manual expiry" />

                <View style={styles.twoColumn}>

                  <View style={{ flex: 1 }}>

                    <Text
                      style={styles.smallLabel}
                    >
                      Date
                    </Text>

                    <TextInput
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      style={styles.input}
                    />

                  </View>

                  <View style={{ width: 105 }}>

                    <Text
                      style={styles.smallLabel}
                    >
                      Time
                    </Text>

                    <TextInput
                      value={expiryTime}
                      onChangeText={setExpiryTime}
                      style={styles.input}
                    />

                  </View>

                </View>

              </ModalSection>

              {/* SETTINGS */}

              <ModalSection
                title="Listing settings"
              >

                <SettingRow
                  title="Rescue voucher required"
                  description="Consumers must present a voucher when claiming."
                  value={rescueVoucher}
                  onValueChange={
                    setRescueVoucher
                  }
                />

                <View
                  style={styles.settingDivider}
                />

                <SettingRow
                  title="Publish listing"
                  description="Make this listing visible to consumers."
                  value={listingStatus}
                  onValueChange={
                    setListingStatus
                  }
                />

              </ModalSection>

              {/* BUTTONS */}

              <View style={styles.modalButtons}>

                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    saveListing("Draft")
                  }
                >

                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Save draft
                  </Text>

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.publishButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    saveListing("Active")
                  }
                >

                  <Text
                    style={
                      styles.publishButtonText
                    }
                  >
                    {editingListing
                      ? "Save changes"
                      : "Publish listing"}
                  </Text>

                </TouchableOpacity>

              </View>

              <View style={{ height: 20 }} />

            </ScrollView>

          </View>

        </View>

      </Modal>

      {/* =================================================
          VIEW LISTING MODAL
      ================================================= */}

      <Modal
        visible={viewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setViewModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.viewModal}>

            {/* VIEW HEADER */}

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Listing details
                </Text>

                <Text style={styles.modalSubtitle}>
                  View food listing information
                </Text>

              </View>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={() =>
                  setViewModalVisible(false)
                }
              >

                <Ionicons
                  name="close"
                  size={22}
                  color={Colors.primary}
                />

              </TouchableOpacity>

            </View>

            {selectedListing && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.viewModalContent
                }
              >

                {/* IMAGE */}

                <Image
                  source={{
                    uri: selectedListing.image,
                  }}
                  style={styles.viewImage}
                  resizeMode="cover"
                />

                {/* NAME + STATUS */}

                <View style={styles.viewTitleRow}>

                  <View style={{ flex: 1 }}>

                    <Text style={styles.viewFoodName}>
                      {selectedListing.name}
                    </Text>

                    <Text
                      style={
                        styles.viewEstablishment
                      }
                    >
                      {selectedListing.establishment}
                    </Text>

                  </View>

                  <View
                    style={[
                      styles.activeBadge,
                      selectedListing.status ===
                        "Draft" &&
                        styles.draftBadge,
                    ]}
                  >

                    <View
                      style={[
                        styles.activeDot,
                        selectedListing.status ===
                          "Draft" &&
                          styles.draftDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.activeText,
                        selectedListing.status ===
                          "Draft" &&
                          styles.draftText,
                      ]}
                    >
                      {selectedListing.status}
                    </Text>

                  </View>

                </View>

                {/* PRICE */}

                <View style={styles.viewPriceBox}>

                  <View>

                    <Text style={styles.viewLabel}>
                      Price
                    </Text>

                    <Text style={styles.viewPrice}>
                      {selectedListing.price}
                    </Text>

                  </View>

                  <View>

                    <Text style={styles.viewLabel}>
                      Quantity
                    </Text>

                    <Text style={styles.viewValue}>
                      {selectedListing.quantity} kg
                    </Text>

                  </View>

                  <View>

                    <Text style={styles.viewLabel}>
                      Category
                    </Text>

                    <Text style={styles.viewValue}>
                      {selectedListing.category}
                    </Text>

                  </View>

                </View>

                {/* DESCRIPTION */}

                <View style={styles.viewSection}>

                  <Text style={styles.viewSectionTitle}>
                    Description
                  </Text>

                  <Text
                    style={styles.viewDescription}
                  >
                    {selectedListing.description ||
                      "No description provided."}
                  </Text>

                </View>

                {/* PREPARATION */}

                <View style={styles.viewSection}>

                  <Text style={styles.viewSectionTitle}>
                    Storage & preparation
                  </Text>

                  <DetailRow
                    icon="calendar-outline"
                    label="Prepared on"
                    value={
                      selectedListing.preparationDate
                    }
                  />

                  <DetailRow
                    icon="thermometer-outline"
                    label="Storage condition"
                    value={
                      selectedListing.storageCondition
                    }
                  />

                </View>

                {/* EXPIRY */}

                <View style={styles.viewSection}>

                  <Text style={styles.viewSectionTitle}>
                    Expiry
                  </Text>

                  <DetailRow
                    icon="calendar-outline"
                    label="Expiry date"
                    value={
                      selectedListing.expiryDate
                    }
                  />

                  <DetailRow
                    icon="time-outline"
                    label="Expiry time"
                    value={
                      selectedListing.expiryTime
                    }
                  />

                </View>

                {/* SETTINGS */}

                <View style={styles.viewSection}>

                  <Text style={styles.viewSectionTitle}>
                    Listing settings
                  </Text>

                  <DetailRow
                    icon="ticket-outline"
                    label="Rescue voucher"
                    value={
                      selectedListing.rescueVoucher
                        ? "Required"
                        : "Not required"
                    }
                  />

                  <DetailRow
                    icon="location-outline"
                    label="Distance"
                    value={
                      selectedListing.distance
                    }
                  />

                  <DetailRow
                    icon="time-outline"
                    label="Time remaining"
                    value={
                      selectedListing.time
                    }
                  />

                </View>

                {/* VIEW ACTIONS */}

                <View style={styles.viewActions}>

                  <TouchableOpacity
                    style={styles.viewCloseButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      setViewModalVisible(false)
                    }
                  >

                    <Text
                      style={
                        styles.viewCloseButtonText
                      }
                    >
                      Close
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewEditButton}
                    activeOpacity={0.85}
                    onPress={() => {
                      setViewModalVisible(false);

                      setTimeout(() => {
                        openEditListing(
                          selectedListing
                        );
                      }, 250);
                    }}
                  >

                    <Ionicons
                      name="create-outline"
                      size={17}
                      color={Colors.white}
                    />

                    <Text
                      style={
                        styles.viewEditButtonText
                      }
                    >
                      Edit listing
                    </Text>

                  </TouchableOpacity>

                </View>

                <View style={{ height: 20 }} />

              </ScrollView>
            )}

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}

/* =====================================================
   LISTING CARD
===================================================== */

function ListingCard({
  item,
  onView,
  onEdit,
  onRemove,
}: {
  item: FoodListing;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.listingCard}>

      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="cover"
      />

      <View style={styles.productInfo}>

        <View style={styles.productHeader}>

          <View style={{ flex: 1 }}>

            <Text
              style={styles.productName}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <Text
              style={
                styles.productEstablishment
              }
            >
              {item.establishment}
            </Text>

          </View>

          <View
            style={[
              styles.activeBadge,
              item.status === "Draft" &&
                styles.draftBadge,
            ]}
          >

            <View
              style={[
                styles.activeDot,
                item.status === "Draft" &&
                  styles.draftDot,
              ]}
            />

            <Text
              style={[
                styles.activeText,
                item.status === "Draft" &&
                  styles.draftText,
              ]}
            >
              {item.status}
            </Text>

          </View>

        </View>

        <View style={styles.productBottom}>

          <View>

            <Text style={styles.price}>
              {item.price}
            </Text>

            <Text
              style={styles.quantityText}
            >
              {item.quantity} kg available
            </Text>

          </View>

          <View style={styles.expiryBlock}>

            <Ionicons
              name="time-outline"
              size={15}
              color={
                item.urgent
                  ? "#A94A3A"
                  : Colors.primary1
              }
            />

            <Text
              style={[
                styles.expiryText,
                item.urgent &&
                  styles.expiryUrgent,
              ]}
            >
              {item.time}
            </Text>

          </View>

        </View>

        {/* CARD ACTIONS */}

        <View style={styles.cardActions}>

          <TouchableOpacity
            style={styles.cardAction}
            activeOpacity={0.7}
            onPress={onView}
          >

            <Ionicons
              name="eye-outline"
              size={17}
              color={Colors.icon}
            />

            <Text
              style={styles.cardActionText}
            >
              View
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardAction}
            activeOpacity={0.7}
            onPress={onEdit}
          >

            <Ionicons
              name="create-outline"
              size={17}
              color={Colors.icon}
            />

            <Text
              style={styles.cardActionText}
            >
              Edit
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardAction}
            activeOpacity={0.7}
            onPress={onRemove}
          >

            <Ionicons
              name="trash-outline"
              size={17}
              color="#A94A3A"
            />

            <Text
              style={[
                styles.cardActionText,
                { color: "#A94A3A" },
              ]}
            >
              Remove
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    </View>
  );
}

/* =====================================================
   DETAIL ROW
===================================================== */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>

      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={16}
          color={Colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>

        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>

      </View>

    </View>
  );
}

/* =====================================================
   BOTTOM NAV ITEM
===================================================== */

function BottomNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active && styles.navItemActive,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >

      <Ionicons
        name={icon}
        size={21}
        color={
          active
            ? Colors.primary
            : Colors.icon
        }
      />

      <Text
        style={[
          styles.navText,
          active && styles.navTextActive,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}

/* =====================================================
   MODAL SECTION
===================================================== */

function ModalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.modalSection}>

      <Text style={styles.modalSectionTitle}>
        {title}
      </Text>

      {children}

    </View>
  );
}

/* =====================================================
   INPUT LABEL
===================================================== */

function InputLabel({
  text,
}: {
  text: string;
}) {
  return (
    <Text style={styles.inputLabel}>
      {text}
    </Text>
  );
}

/* =====================================================
   STORAGE OPTION
===================================================== */

function StorageOption({
  title,
  subtitle,
  active,
  onPress,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.storageOption,
        active &&
          styles.storageOptionActive,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <View
        style={[
          styles.radio,
          active && styles.radioActive,
        ]}
      >

        {active && (
          <View style={styles.radioInner} />
        )}

      </View>

      <View>

        <Text
          style={[
            styles.storageTitle,
            active &&
              styles.storageTitleActive,
          ]}
        >
          {title}
        </Text>

        <Text
          style={styles.storageSubtitle}
        >
          {subtitle}
        </Text>

      </View>

    </TouchableOpacity>
  );
}

/* =====================================================
   SETTING ROW
===================================================== */

function SettingRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>

      <View style={{ flex: 1 }}>

        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text
          style={
            styles.settingDescription
          }
        >
          {description}
        </Text>

      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: Colors.border,
          true: Colors.button,
        }}
        thumbColor={Colors.white}
      />

    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  /* ===================================================
     MAIN
  =================================================== */

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ===================================================
     HEADER
  =================================================== */

  header: {
    minHeight: 70,

    backgroundColor: Colors.background,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  logo: {
    fontFamily: "PoppinsBold",
    fontSize: 23,
    color: Colors.primary,
    letterSpacing: 0.7,
  },

  headerSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    marginTop: -1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  headerIconButton: {
    position: "relative",
    padding: 4,
  },

  notificationDot: {
    position: "absolute",

    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#A94A3A",

    right: 3,
    top: 2,

    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  profileCircle: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ===================================================
     SCROLL
  =================================================== */

  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 20,
  },

  /* ===================================================
     PAGE HEADER
  =================================================== */

  pageHeader: {
    marginBottom: 17,
  },

  pageTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 24,
    color: Colors.primary2,
  },

  /* ===================================================
     CREATE BUTTON
  =================================================== */

  createButton: {
    minHeight: 68,

    backgroundColor: Colors.primary,

    borderRadius: 10,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 18,
  },

  createIcon: {
    width: 39,
    height: 39,

    borderRadius: 20,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  createTextContainer: {
    flex: 1,
  },

  createTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.white,
  },

  createSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: "#D8E3DD",
    marginTop: 1,
  },

  /* ===================================================
     SEARCH
  =================================================== */

  searchContainer: {
    minHeight: 42,

    borderRadius: 8,

    backgroundColor: Colors.white,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 11,

    marginBottom: 10,
  },

  searchInput: {
    flex: 1,

    fontFamily: "PoppinsRegular",
    fontSize: 9.5,

    color: Colors.primary2,

    marginLeft: 8,

    paddingVertical: 7,
  },

  /* ===================================================
     FILTERS
  =================================================== */

  filterRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 20,
  },

  filterButton: {
    minWidth: 63,

    height: 31,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: Colors.border,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,
  },

  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
  },

  filterTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.white,
  },

  /* ===================================================
     SECTION
  =================================================== */

  sectionHeader: {
    marginBottom: 11,
  },

  sectionTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 17,
    color: Colors.primary2,
  },

  sectionSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* ===================================================
     LISTINGS
  =================================================== */

  listingsWrapper: {
    marginBottom: 25,
  },

  listingCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    padding: 10,

    flexDirection: "row",

    marginBottom: 10,
  },

  productImage: {
    width: 92,
    height: 110,

    borderRadius: 8,

    backgroundColor: Colors.input,
  },

  productInfo: {
    flex: 1,
    marginLeft: 11,
  },

  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  productName: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 13,
    color: Colors.primary2,
  },

  productEstablishment: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
    marginTop: 1,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#E7F0E9",

    borderRadius: 10,

    paddingHorizontal: 7,
    paddingVertical: 3,

    marginLeft: 5,
  },

  draftBadge: {
    backgroundColor: "#F4EEDF",
  },

  activeDot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: Colors.button,

    marginRight: 4,
  },

  draftDot: {
    backgroundColor: Colors.accent,
  },

  activeText: {
    fontFamily: "PoppinsMedium",
    fontSize: 7,

    color: Colors.button,
  },

  draftText: {
    color: Colors.accent,
  },

  productBottom: {
    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "flex-end",

    marginTop: 9,
  },

  price: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary,
  },

  quantityText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
    marginTop: 1,
  },

  expiryBlock: {
    flexDirection: "row",
    alignItems: "center",
  },

  expiryText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,
    marginLeft: 3,
  },

  expiryUrgent: {
    color: "#A94A3A",
    fontFamily: "PoppinsMedium",
  },

  cardActions: {
    flexDirection: "row",

    borderTopWidth: 1,
    borderTopColor: Colors.border,

    marginTop: 8,
    paddingTop: 7,

    gap: 15,
  },

  cardAction: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardActionText: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.icon,
    marginLeft: 4,
  },

  /* ===================================================
     EMPTY
  =================================================== */

  emptyCard: {
    backgroundColor: Colors.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingVertical: 35,
    paddingHorizontal: 20,

    alignItems: "center",
  },

  emptyIcon: {
    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#E7EEE9",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 9,
  },

  emptyTitle: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 12,
    color: Colors.primary2,
  },

  emptyDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    textAlign: "center",
    marginTop: 3,
  },

  /* ===================================================
     BOTTOM NAVIGATION
  =================================================== */

  bottomNav: {
    height: 64,

    backgroundColor: Colors.white,

    flexDirection: "row",

    borderTopWidth: 1,
    borderTopColor: Colors.border,

    elevation: 10,

    paddingHorizontal: 2,
  },

  navItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    marginVertical: 5,
    marginHorizontal: 2,

    borderRadius: 7,
  },

  navItemActive: {
    backgroundColor: "#E8EFEA",
  },

  navText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.icon,
    marginTop: 3,
  },

  navTextActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  /* ===================================================
     MODAL
  =================================================== */

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(18,55,44,0.50)",

    justifyContent: "flex-end",
  },

  listingModal: {
    width: "100%",

    maxHeight: "94%",

    backgroundColor: Colors.white,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,

    overflow: "hidden",
  },

  viewModal: {
    width: "100%",

    maxHeight: "90%",

    backgroundColor: Colors.white,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,

    overflow: "hidden",
  },

  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 15,

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

  modalSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  closeButton: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: Colors.border,
  },

  modalScroll: {
    paddingHorizontal: 17,
    paddingTop: 17,
  },

  modalSection: {
    marginBottom: 22,
  },

  modalSectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary2,

    marginBottom: 10,
  },

  inputLabel: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary2,

    marginBottom: 5,
    marginTop: 9,
  },

  input: {
    minHeight: 40,

    borderRadius: 7,

    backgroundColor: Colors.input,

    paddingHorizontal: 11,

    fontFamily: "PoppinsRegular",
    fontSize: 9.5,

    color: Colors.primary2,

    borderWidth: 1,
    borderColor: Colors.border,
  },

  selectInput: {
    minHeight: 40,

    borderRadius: 7,

    backgroundColor: Colors.input,

    paddingHorizontal: 11,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderColor: Colors.border,
  },

  inputText: {
    fontFamily: "PoppinsRegular",
    fontSize: 9.5,
    color: Colors.primary2,
  },

  descriptionInput: {
    minHeight: 82,

    borderRadius: 7,

    backgroundColor: Colors.input,

    paddingHorizontal: 11,
    paddingTop: 10,

    fontFamily: "PoppinsRegular",
    fontSize: 9.5,

    color: Colors.primary2,

    borderWidth: 1,
    borderColor: Colors.border,
  },

  twoColumn: {
    flexDirection: "row",
    gap: 9,
  },

  /* ===================================================
     UPLOAD
  =================================================== */

  uploadButton: {
    minHeight: 62,

    borderRadius: 8,

    backgroundColor: Colors.input,

    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 11,
  },

  uploadIcon: {
    width: 37,
    height: 37,

    borderRadius: 8,

    backgroundColor: "#E3EBE5",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  uploadTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary2,
  },

  uploadSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginTop: 1,
  },

  helperText: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,

    marginTop: 4,
  },

  /* ===================================================
     STORAGE
  =================================================== */

  storageOptions: {
    flexDirection: "row",
    gap: 7,
  },

  storageOption: {
    flex: 1,

    minHeight: 55,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: Colors.border,

    backgroundColor: Colors.white,

    paddingHorizontal: 9,

    flexDirection: "row",
    alignItems: "center",
  },

  storageOptionActive: {
    backgroundColor: "#E7EEE9",

    borderColor: Colors.primary,
  },

  radio: {
    width: 16,
    height: 16,

    borderRadius: 8,

    borderWidth: 1.5,
    borderColor: Colors.icon,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 6,
  },

  radioActive: {
    borderColor: Colors.primary,
  },

  radioInner: {
    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: Colors.primary,
  },

  storageTitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 8.5,
    color: Colors.primary2,
  },

  storageTitleActive: {
    fontFamily: "PoppinsSemiBold",
    color: Colors.primary,
  },

  storageSubtitle: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,
    color: Colors.primary1,
    marginTop: 1,
  },

  /* ===================================================
     EXPIRY
  =================================================== */

  expiryDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,

    color: Colors.primary1,

    lineHeight: 13,

    marginBottom: 9,
  },

  expiryInfo: {
    flexDirection: "row",

    backgroundColor: "#E9EFE9",

    borderRadius: 8,

    padding: 11,

    marginBottom: 8,
  },

  expiryInfoIcon: {
    width: 35,
    height: 35,

    borderRadius: 18,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  expiryInfoTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 8.5,
    color: Colors.primary1,
  },

  expiryInfoValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 10,
    color: Colors.primary2,

    marginTop: 1,
  },

  expiryInfoDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 7,

    color: Colors.primary1,

    marginTop: 2,
  },

  smallLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 8,
    color: Colors.primary1,

    marginBottom: 4,
  },

  /* ===================================================
     SETTINGS
  =================================================== */

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  settingTitle: {
    fontFamily: "PoppinsMedium",
    fontSize: 9.5,
    color: Colors.primary2,
  },

  settingDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,

    marginTop: 2,

    lineHeight: 11,
  },

  settingDivider: {
    height: 1,

    backgroundColor: Colors.border,

    marginVertical: 12,
  },

  /* ===================================================
     BUTTONS
  =================================================== */

  modalButtons: {
    flexDirection: "row",

    gap: 9,

    marginTop: 2,
  },

  cancelButton: {
    flex: 1,

    height: 44,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.white,
  },

  cancelButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.button,
  },

  publishButton: {
    flex: 1,

    height: 44,

    borderRadius: 8,

    backgroundColor: Colors.button,

    alignItems: "center",
    justifyContent: "center",
  },

  publishButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,
    color: Colors.white,
  },

  /* ===================================================
     VIEW MODAL
  =================================================== */

  viewModalContent: {
    paddingHorizontal: 17,
    paddingTop: 17,
  },

  viewImage: {
    width: "100%",
    height: 190,

    borderRadius: 10,

    backgroundColor: Colors.input,

    marginBottom: 14,
  },

  viewTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 15,
  },

  viewFoodName: {
    fontFamily: "PoppinsBold",
    fontSize: 19,
    color: Colors.primary2,
  },

  viewEstablishment: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,
    color: Colors.primary1,
    marginTop: 2,
  },

  viewPriceBox: {
    flexDirection: "row",

    backgroundColor: "#E9EFE9",

    borderRadius: 9,

    padding: 12,

    justifyContent: "space-between",

    marginBottom: 17,
  },

  viewLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,
    color: Colors.primary1,
    marginBottom: 2,
  },

  viewPrice: {
    fontFamily: "PoppinsBold",
    fontSize: 14,
    color: Colors.primary,
  },

  viewValue: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9,
    color: Colors.primary2,
  },

  viewSection: {
    marginBottom: 18,

    borderBottomWidth: 1,
    borderBottomColor: Colors.border,

    paddingBottom: 14,
  },

  viewSectionTitle: {
    fontFamily: "PoppinsBold",
    fontSize: 12,

    color: Colors.primary2,

    marginBottom: 9,
  },

  viewDescription: {
    fontFamily: "PoppinsRegular",
    fontSize: 9,

    color: Colors.primary1,

    lineHeight: 15,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,
  },

  detailIcon: {
    width: 31,
    height: 31,

    borderRadius: 16,

    backgroundColor: "#E8EFEA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  detailLabel: {
    fontFamily: "PoppinsRegular",
    fontSize: 7.5,

    color: Colors.primary1,
  },

  detailValue: {
    fontFamily: "PoppinsMedium",
    fontSize: 9,

    color: Colors.primary2,

    marginTop: 1,
  },

  viewActions: {
    flexDirection: "row",
    gap: 9,

    marginTop: 2,
  },

  viewCloseButton: {
    flex: 1,

    height: 44,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: Colors.border,

    backgroundColor: Colors.white,

    alignItems: "center",
    justifyContent: "center",
  },

  viewCloseButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,

    color: Colors.primary1,
  },

  viewEditButton: {
    flex: 1,

    height: 44,

    borderRadius: 8,

    backgroundColor: Colors.button,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 6,
  },

  viewEditButtonText: {
    fontFamily: "PoppinsSemiBold",
    fontSize: 9.5,

    color: Colors.white,
  },

});