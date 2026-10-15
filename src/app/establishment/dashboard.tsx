import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/* =====================================================
    MAIN DASHBOARD
===================================================== */

export default function EstablishmentDashboard() {
  /* ===================================================
     LISTINGS STATE (Connected to Database)
  =================================================== */

  const [foodListings, setFoodListings] = useState<any[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);

  //NOTIFICATIONS/ACTIVITY
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch notifications on load
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("listings/notifications/");
      setNotifications(response.data.notifications || response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  /* =====================================================
     SAFE DATE PARSER
  ===================================================== */

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

  /* =====================================================
     UNIT HELPERS
  ===================================================== */

  const getUnitLabel = (id: any) => {
    switch (Number(id)) {
      case 3: return "pc";
      case 4: return "pk";
      default: return "pc"; 
    }
  };

  const getUnitFullText = (id: any) => {
    switch (Number(id)) {
      case 3: return "Piece (pc)";
      case 4: return "Pack (pk)";
      default: return "Piece (pc)"; 
    }
  };

  const getUnitId = (unitName: string) => {
    switch (unitName) {
      case "Piece (pc)": return 3;
      case "Pack (pk)": return 4;
      default: return 3; 
    }
  };

  const getCategoryId = (catName: string) => {
    switch (catName) {
      case "Bread": return 1;
      case "Pastry": return 2;
      case "Cake": return 3;
      case "Custom/Others": return 4;
      default: return 1;
    }
  };

  /* =====================================================
     FETCH REAL LISTINGS ON LOAD & SORT BY PRIORITY
  ===================================================== */

  useEffect(() => {
    fetchListings();
  }, []);

 const fetchListings = async () => {
    try {
      const response = await api.get("listings/establishment/");
      const rawListings = response.data.listings || response.data;

      if (response.data.flagged_count !== undefined) {
        setFlaggedCount(response.data.flagged_count);
      }

      const realData = rawListings.map((item: any) => {
        const rawCond = String(
          item.storage_condition ||
            item.storageCondition ||
            item.posted_temp ||
            ""
        ).toLowerCase();

        let normalizedStorage = "Ambient (25°C)";
        if (rawCond.includes("chilled") || rawCond.includes("4")) {
          normalizedStorage = "Chilled (4°C)";
        }

        const dbUnitId = item.unit || item.unit_id || 3;
        const expDateStr = item.expiry_date || "Not Set";
        const expTimeStr = item.expiry_time || "Not Set";

        return {
          id: item.prod_id || item.id || Date.now(),
          name: item.prod_name,
          establishment: item.merchant_name || "Nena's Bakeshop",
          price: Number(item.price || 0),
          originalPrice: Number(item.original_price || 0),
          floorPrice: Number(item.floor_price || 0),
          distance: "0.5 km",
          time: item.status === "Draft" ? "Not published" : "Active",
          image:
            item.image_path ||
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
          urgent: false,
          
          unitId: dbUnitId,
          unitFullText: getUnitFullText(dbUnitId),
          unitLabel: getUnitLabel(dbUnitId), 
          weight_per_unit: "0",
          quantity: item.quantity || "0", 

          listingDate: new Date().toLocaleDateString(),
          status: item.status || "Active",
          category: item.category_name || item.category || "Bread",
          secondaryClassification: item.secondary_classification || "Plain",
          pricingMode: item.pricing_mode || "dynamic",
          description: item.prod_desc || "No description provided.",
          preparationDate:
            item.safely_anchor_time ||
            item.preparation_date ||
            item.prep_date ||
            "Not Set",
          storageCondition: normalizedStorage,
          expiryDate: expDateStr,
          expiryTime: expTimeStr,
          rescueVoucher: true,
          expiryTimestamp: parseSafeDate(expDateStr, expTimeStr),
        };
      });

      const flaggedItems = realData.filter((i: any) => i.status === "Flagged");
      setFlaggedCount(flaggedItems.length);

      realData.sort((a: any, b: any) => a.expiryTimestamp - b.expiryTimestamp);

      setFoodListings(realData);
    } catch (error) {
      console.error("Failed to pull from DB:", error);
    }
  };

  /* ===================================================
     MODAL & EDIT STATES
  =================================================== */

  const [listingModalVisible, setListingModalVisible] = useState(false);

  const listingTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (listingModalVisible) {
      listingTranslateY.setValue(SCREEN_HEIGHT);
      Animated.spring(listingTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start();
    }
  }, [listingModalVisible]);

  const closeListingModal = () => {
    Animated.timing(listingTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setListingModalVisible(false);
      setEditingListing(null);
    });
  };

  const listingPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) listingTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.8) {
          Animated.timing(listingTranslateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setListingModalVisible(false);
            setEditingListing(null);
          });
        } else {
          Animated.spring(listingTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const viewTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (viewModalVisible) {
      viewTranslateY.setValue(SCREEN_HEIGHT);
      Animated.spring(viewTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start();
    }
  }, [viewModalVisible]);

  const closeViewModal = () => {
    Animated.timing(viewTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setViewModalVisible(false);
    });
  };

  const viewPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) viewTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.8) {
          Animated.timing(viewTranslateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setViewModalVisible(false));
        } else {
          Animated.spring(viewTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [editingListing, setEditingListing] = useState<any>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  /* ===================================================
     FORM STATES (BAKERY OPTIMIZED)
  =================================================== */

  const now = new Date();
  const defaultFormattedDate =
    now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    ", " +
    now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const [foodName, setFoodName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [preparationDate, setPreparationDate] = useState(defaultFormattedDate);
  const [category, setCategory] = useState("Bread");
  const [secondaryClass, setSecondaryClass] = useState("Plain");
  const [description, setDescription] = useState("");
  
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(""); 
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  
  // Pricing Mode
  const [pricingMode, setPricingMode] = useState<"fixed" | "dynamic">("fixed");
  const [normalPrice, setNormalPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [floorPrice, setFloorPrice] = useState("");

  const [storageCondition, setStorageCondition] = useState("Ambient (25°C)");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");
  const [rescueVoucher, setRescueVoucher] = useState(true);
  const [listingStatus, setListingStatus] = useState(true);

  /* =====================================================
     CALENDAR & TIME PICKER STATES
  ===================================================== */
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [actualDate, setActualDate] = useState(now);

  const formatDateTimeToString = (date: Date) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const m = months[date.getMonth()];
    const d = date.getDate();
    const y = date.getFullYear();

    let hrs = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, "0");
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;

    return `${m} ${d}, ${y}, ${hrs}:${mins} ${ampm}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }
    const currentDate = selectedDate || actualDate;
    if (pickerMode === "date") {
      actualDate.setFullYear(currentDate.getFullYear());
      actualDate.setMonth(currentDate.getMonth());
      actualDate.setDate(currentDate.getDate());
    } else {
      actualDate.setHours(currentDate.getHours());
      actualDate.setMinutes(currentDate.getMinutes());
    }
    setActualDate(new Date(actualDate));
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    setPreparationDate(formatDateTimeToString(actualDate));
  };

  /* =====================================================
     TTT EXPIRY PREVIEW CALCULATOR (DATE & TIME)
  ===================================================== */
  useEffect(() => {
    if (!listingModalVisible) return;
    if (editingListing) return;

    let shelfLifeDays = 3;
    const isAmbient = storageCondition.includes("Ambient");

    if (secondaryClass === "Plain") {
      shelfLifeDays = isAmbient ? 3 : 7;
    } else if (secondaryClass === "Sweet") {
      shelfLifeDays = isAmbient ? 2 : 5;
    } else if (secondaryClass === "Egg-Based") {
      shelfLifeDays = isAmbient ? 1 : 3;
    }

    let baseDate = new Date();
    try {
      const cleanStr = preparationDate.replace(/,/g, '').trim();
      const parts = cleanStr.split(' ');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.indexOf(parts[0]);
      const dayNum = parseInt(parts[1], 10);
      const yearNum = parseInt(parts[2], 10);

      if (!isNaN(monthIndex) && !isNaN(dayNum) && !isNaN(yearNum)) {
        baseDate = new Date(yearNum, monthIndex, dayNum);
        
        if (parts[3] && parts[4]) {
          const timeParts = parts[3].split(':');
          let hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          const ampm = parts[4].toUpperCase();

          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;

          baseDate.setHours(hours, minutes, 0);
        }
      }
    } catch (e) {
      baseDate = new Date();
    }

    baseDate.setDate(baseDate.getDate() + shelfLifeDays);
    setExpiryDate(baseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setExpiryTime(baseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
  }, [preparationDate, storageCondition, secondaryClass, listingModalVisible, editingListing]);

  /* =====================================================
     RESET FORM
  ===================================================== */
  const resetForm = () => {
    setFoodName("");
    setImageUri(null);
    setPreparationDate(defaultFormattedDate);
    setActualDate(new Date());
    setDescription("");
    setQuantity("");
    setUnit("");
    setPricingMode("fixed");
    setNormalPrice("");
    setOriginalPrice("");
    setDiscountedPrice("");
    setFloorPrice("");
    setCategory("Bread");
    setSecondaryClass("Plain");
    setCategoryDropdownOpen(false);
    setExpiryDate("");
    setExpiryTime("");
    setRescueVoucher(true);
    setListingStatus(true);
  };

  const openAddListing = () => {
    setEditingListing(null);
    resetForm();
    setListingModalVisible(true);
  };

  const openViewListing = (item: any) => {
    setSelectedListing(item);
    setViewModalVisible(true);
  };

  const openEditListing = (item: any) => {
    if (item.status === "Flagged") {
      alert("Flagged items cannot be edited because they are past or near their expiry threshold.");
      return;
    }
    setEditingListing(item);
    setFoodName(item.name || "");
    setImageUri(item.image || null);
    setUnit(item.unitFullText || "Piece (pc)");

    const dbPrepTime =
      item.preparationDate && item.preparationDate !== "Not Set"
        ? item.preparationDate
        : defaultFormattedDate;
    setPreparationDate(dbPrepTime);

    const parsedDate = new Date(dbPrepTime);
    if (!isNaN(parsedDate.getTime())) {
      setActualDate(parsedDate);
    } else {
      setActualDate(new Date());
    }

    setCategory(item.category || "Bread");
    setSecondaryClass(item.secondaryClassification || "Plain");
    setCategoryDropdownOpen(false);

    setDescription(item.description || "");
    setQuantity(item.quantity ? String(item.quantity) : "");
    
    const mode = item.pricingMode || (item.originalPrice && item.floorPrice && item.originalPrice !== 0 ? "dynamic" : "fixed");
    setPricingMode(mode as "fixed" | "dynamic");

    if (mode === "fixed") {
      setNormalPrice(item.price ? String(item.price) : '');
      setOriginalPrice('');
      setDiscountedPrice('');
      setFloorPrice('');
    } else {
      setOriginalPrice(item.originalPrice ? String(item.originalPrice) : '');
      setDiscountedPrice(item.price ? String(item.price) : '');
      setFloorPrice(item.floorPrice ? String(item.floorPrice) : '');
      setNormalPrice('');
    }

    setStorageCondition(item.storageCondition);
    setExpiryDate(item.expiryDate || "");
    setExpiryTime(item.expiryTime || "");
    setRescueVoucher(true);
    setListingStatus(item.status === "Active");

    setListingModalVisible(true);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required to snap photos of surplus items.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const saveListing = async (statusArg?: "Active" | "Draft") => {
    if (!foodName.trim()) {
      alert("Please enter a food item name.");
      return;
    }
    if (!unit) {
      alert("Please select a Selling Unit.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      alert("Please enter a valid Quantity.");
      return;
    }

    if (pricingMode === "fixed") {
      if (!normalPrice || Number(normalPrice) <= 0) {
        alert("Please enter a normal retail price.");
        return;
      }
    } else {
      if (!originalPrice || Number(originalPrice) <= 0 || !discountedPrice || Number(discountedPrice) <= 0 || !floorPrice || Number(floorPrice) <= 0) {
        alert("Please fill in Original, Discounted, and Floor prices correctly.");
        return;
      }
    }

    try {
      const finalStatus = statusArg || (listingStatus ? "Active" : "Draft");
      let finalImageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80";
      
      if (imageUri && !imageUri.includes("unsplash")) {
        const supabaseUrl = "https://pxyigbutwupyslndoplm.supabase.co"; 
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWlnYnV0d3VweXNsbmRvcGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczOTEzNjcsImV4cCI6MjEwMjk2NzM2N30.r8UjIGq7SiVNPJ87zs_TnHBbRbaVfSk59gmY3jSrdrY"; 
  
        let fileUri = imageUri;
        if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = `file://${fileUri}`;
        }

        const rawExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt; 
        const fileName = `${Date.now()}_photo.${ext}`; 
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

        try {
          const base64Data = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/food-images/${fileName}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': contentType,
              'x-upsert': 'true',
            },
            body: decode(base64Data),
          });

          if (uploadRes.ok) {
            finalImageUrl = `${supabaseUrl}/storage/v1/object/public/food-images/${fileName}`;
          }
        } catch (uploadErr) {
          console.error("Error processing image upload:", uploadErr);
        }
      }

      const finalPrice = pricingMode === "fixed" ? normalPrice : discountedPrice;
      const finalOrigPrice = pricingMode === "fixed" ? normalPrice : originalPrice;
      const finalFloorPrice = pricingMode === "fixed" ? normalPrice : floorPrice;

      const payload = {
        prod_name: foodName,
        prod_desc: description,
        quantity: quantity || "0",
        unit: getUnitId(unit),                 
        weight_per_unit: "0",
        price: finalPrice,
        discounted_price: finalPrice,
        original_price: finalOrigPrice,
        orig_price: finalOrigPrice,
        floor_price: finalFloorPrice,
        category: getCategoryId(category),
        secondary_classification: secondaryClass,
        pricing_mode: pricingMode,
        merchant: 1,
        threshold: 1,
        status: finalStatus,
        preparation_date: preparationDate.replace(/\u202f/g, ' '),
        storage_condition: storageCondition,
        expiry_date: expiryDate,
        expiry_time: expiryTime,
        image_path: finalImageUrl,
      };

      if (editingListing) {
        await api.put(`listings/update/${editingListing.id}/`, payload);
      } else {
        await api.post("listings/create/", payload);
      }

      await fetchListings();
      setListingModalVisible(false);
      setEditingListing(null);
      resetForm();
    } catch (error: any) {
      console.error("Dashboard Save Error:", error);
      alert("Error saving listing.");
    }
  };

  const removeListing = async (id: number) => {
    const target = foodListings.find((item: any) => item.id === id);
    if (target?.status === "Flagged") {
      alert("Flagged items cannot be removed.");
      return;
    }
    try {
      await api.delete(`listings/delete/${id}/`);
      setFoodListings((currentListings) =>
        currentListings.filter((item) => item.id !== id)
      );
      setViewModalVisible(false);
      setSelectedListing(null);
    } catch (error) {
      console.error("Dashboard Delete Error:", error);
      alert("Error removing listing.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />

      {/* =================================================
          HEADER
      ===================================================== */}

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Establishment Portal</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => router.replace("/establishment/notifications")}
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
            onPress={() => router.replace("/establishment/profile")}
          >
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================
          MAIN CONTENT
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* WELCOME */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Good afternoon,</Text>
          <Text style={styles.establishmentTitle}>Nena's Bakeshop</Text>
        </View>

        {/* OVERVIEW */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="leaf-outline"
            label="Food rescued"
            value="100,000"
            unit="kg"
          />
          <StatCard
            icon="restaurant-outline"
            label="Active listings"
            value={
              String(
                foodListings.filter((item) => item.status === "Active").length
              )
            }
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value="1,284"
          />
          <StatCard
            icon="alert-circle-outline"
            label="Flagged"
            value={String(flaggedCount)}
            warning
          />
        </View>

        {/* QUICK ACTION */}
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={openAddListing}
        >
          <View style={styles.createIcon}>
            <Ionicons name="add" size={23} color={Colors.white} />
          </View>
          <View style={styles.createTextContainer}>
            <Text style={styles.createTitle}>Add food listing</Text>
            <Text style={styles.createSubtitle}>
              Post surplus food for consumers
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={Colors.white} />
        </TouchableOpacity>

        {/* CURRENT LISTINGS */}
        <View style={styles.sectionHeaderWithAction}>
          <View>
            <Text style={styles.sectionTitle}>Current listings</Text>
            <Text style={styles.sectionSubtitle}>Food currently available</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/establishment/listing")}
          >
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listingsWrapper}>
          {foodListings.slice(0, 3).map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              onView={() => openViewListing(item)}
              onEdit={() => openEditListing(item)}
              onRemove={() => removeListing(item.id)}
            />
          ))}
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.sectionHeaderWithAction}>
          <View>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionSubtitle}>
              Latest updates from your account
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/establishment/notifications")}
          >
            <Text style={styles.viewAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {notifications.length > 0 ? (
            notifications.slice(0, 4).map((notif, index) => (
              <ActivityItem
                key={notif.id || index}
                icon={notif.icon || "time-outline"}
                title={notif.title || "Notification"}
                description={notif.message || notif.description}
                date={notif.created_at || notif.date || "Recently"}
                last={index === Math.min(notifications.length, 4) - 1}
              />
            ))
          ) : (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1 }}>
                No recent activity found.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView> 

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="grid"
          label="Home"
          active
          onPress={() => router.replace("/establishment/dashboard")}
        />
        <BottomNavItem
          icon="restaurant-outline"
          label="Listings"
          onPress={() => router.push("/establishment/listing")}
        />
        <BottomNavItem
          icon="basket-outline"
          label="Orders"
          onPress={() => router.push("/establishment/orders")}
        />
        <BottomNavItem
          icon="cash-outline"
          label="Earnings"
          onPress={() => router.push("/establishment/earnings")}
        />
        <BottomNavItem
          icon="heart-outline"
          label="Donation"
          onPress={() => router.replace("/establishment/donation")}
        />
        <BottomNavItem
          icon="person-outline"
          label="Impact"
          onPress={() => router.replace("/establishment/impact")}
        />
      </View>

      {/* =================================================
          ADD / EDIT LISTING MODAL (BAKERY OPTIMIZED)
      ===================================================== */}

      <Modal
        visible={listingModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeListingModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeListingModal} />

          <Animated.View
            style={[styles.listingModal, { transform: [{ translateY: listingTranslateY }] }]}
          >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flexShrink: 1 }}
          >
            <View {...listingPanResponder.panHandlers} style={styles.sheetHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeaderText}>
                <Text style={styles.modalTitle}>
                  {editingListing ? "Edit bakery listing" : "Add bakery listing"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Configure categories, composition, and pricing structure.
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              nestedScrollEnabled={true}
            >
              <ModalSection title="Food details">
                <InputLabel text="Food item name" />
                <TextInput
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="e.g. Ube Ensaymada or Sourdough Loaf"
                  placeholderTextColor={Colors.placeholder}
                  style={styles.input}
                />

                <InputLabel text="Food Item Picture" />
                <TouchableOpacity
                  style={styles.cameraButton}
                  activeOpacity={0.8}
                  onPress={takePhoto}
                >
                  {imageUri && !imageUri.includes("unsplash") ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.cameraPreview}
                    />
                  ) : (
                    <View style={styles.cameraPlaceholder}>
                      <Ionicons name="camera" size={32} color={Colors.icon} />
                      <Text style={styles.cameraText}>Tap to take a photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* PRIMARY CATEGORIES */}
                <InputLabel text="Primary Category" />
                <TouchableOpacity
                  style={styles.selectInput}
                  activeOpacity={0.7}
                  onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <Text style={styles.inputText}>{category}</Text>
                  <Ionicons
                    name={categoryDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={Colors.icon}
                  />
                </TouchableOpacity>

                {categoryDropdownOpen && (
                  <View style={styles.inlineDropdownContainer}>
                    {["Bread", "Pastry", "Cake", "Custom/Others"].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.inlineDropdownItem,
                          category === cat && styles.inlineDropdownItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setCategory(cat);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.inlineDropdownText, category === cat && styles.inlineDropdownTextActive]}>
                          {cat}
                        </Text>
                        {category === cat && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* SECONDARY CLASSIFICATION */}
                <InputLabel text="Secondary Classification (Composition)" />
                <View style={{ flexDirection: "row", gap: 7, marginBottom: 8 }}>
                  {(['Plain', 'Sweet', 'Egg-Based'] as const).map((sec) => (
                    <TouchableOpacity
                      key={sec}
                      style={[
                        styles.storageOption, 
                        secondaryClass === sec && styles.storageOptionActive,
                        { minHeight: 40, justifyContent: 'center', alignItems: 'center' }
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setSecondaryClass(sec)}
                    >
                      <Text style={[styles.storageTitle, secondaryClass === sec && styles.storageTitleActive]}>
                        {sec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <InputLabel text="Description" />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the baked item..."
                  placeholderTextColor={Colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  style={styles.descriptionInput}
                />

                <InputLabel text="Selling Unit" />
                <TouchableOpacity 
                  style={styles.selectInput} 
                  activeOpacity={0.7}
                  onPress={() => setUnitDropdownOpen(!unitDropdownOpen)}
                >
                  <Text style={[styles.inputText, !unit && { color: Colors.placeholder }]}>
                    {unit || "Select unit (piece, pack)..."}
                  </Text>
                  <Ionicons name={unitDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={Colors.icon} />
                </TouchableOpacity>

                {unitDropdownOpen && (
                  <View style={styles.inlineDropdownContainer}>
                    {["Piece (pc)", "Pack (pk)"].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.inlineDropdownItem, unit === u && styles.inlineDropdownItemActive]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setUnit(u);
                          setUnitDropdownOpen(false);
                        }}
                      >
                        <Text style={[styles.inlineDropdownText, unit === u && styles.inlineDropdownTextActive]}>
                          {u}
                        </Text>
                        {unit === u && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <InputLabel text="Quantity Available" />
                <TextInput 
                  value={quantity} 
                  onChangeText={setQuantity} 
                  keyboardType="numeric" 
                  placeholder="e.g. 25" 
                  placeholderTextColor={Colors.placeholder} 
                  style={styles.input} 
                />

                {/* PROFESSIONAL PRICING TOGGLE SWITCH */}
                <InputLabel text="Pricing Structure" />
                <View style={styles.pricingToggleContainer}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.storageTitleActive}>Enable Dynamic Discounting</Text>
                    <Text style={styles.storageSubtitle}>Automatically drop price over time based on TTT model</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#D1D5DB", true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor="#D1D5DB"
                    onValueChange={(val) => setPricingMode(val ? "dynamic" : "fixed")}
                    value={pricingMode === "dynamic"}
                  />
                </View>

                {/* CONDITIONAL PRICING FIELDS */}
                {pricingMode === "fixed" ? (
                  <View>
                    <InputLabel text="Retail Price (₱)" />
                    <TextInput
                      value={normalPrice}
                      onChangeText={setNormalPrice}
                      placeholder="e.g. 50.00"
                      keyboardType="numeric"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                    />
                  </View>
                ) : (
                  <View>
                    <View style={styles.twoColumn}>
                      <View style={{ flex: 1 }}>
                        <InputLabel text="Original Price (₱)" />
                        <TextInput
                          value={originalPrice}
                          onChangeText={setOriginalPrice}
                          placeholder="e.g. 120.00"
                          keyboardType="numeric"
                          style={styles.input}
                          placeholderTextColor={Colors.placeholder}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <InputLabel text="Discounted Price (₱)" />
                        <TextInput
                          value={discountedPrice}
                          onChangeText={setDiscountedPrice}
                          placeholder="e.g. 90.00"
                          keyboardType="numeric"
                          style={styles.input}
                          placeholderTextColor={Colors.placeholder}
                        />
                      </View>
                    </View>

                    <InputLabel text="Floor Price / Minimum (₱)" />
                    <TextInput
                      value={floorPrice}
                      onChangeText={setFloorPrice}
                      placeholder="e.g. 40.00"
                      keyboardType="numeric"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                    />

                    <Text style={styles.expiryDescription}>
                      Price will automatically markdown hourly starting from your Discounted Price down to your Floor Price.
                    </Text>
                  </View>
                )}
              </ModalSection>

              <ModalSection title="Storage & preparation">
                <InputLabel text="Date Baked (Prepared on)" />
                <View style={styles.twoColumn}>
                  <TouchableOpacity
                    style={[styles.inputWithIcon, { flex: 1 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPickerMode("date");
                      setShowPicker(true);
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={Colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.inputText} numberOfLines={1}>
                      {preparationDate.includes(",")
                        ? preparationDate.split(",").slice(0, 2).join(",").trim()
                        : preparationDate}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.inputWithIcon, { width: 115 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPickerMode("time");
                      setShowPicker(true);
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.inputText} numberOfLines={1}>
                      {preparationDate.includes(",")
                        ? preparationDate.split(",").slice(2).join(",").trim()
                        : "10:00 AM"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showPicker && (
                  <DateTimePicker
                    value={actualDate}
                    mode={pickerMode}
                    is24Hour={false}
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <InputLabel text="Storage Condition (Ambient & Chilled Only)" />
                <View style={styles.storageOptions}>
                  <StorageOption
                    title="Ambient"
                    subtitle="25°C Room Temp"
                    active={storageCondition === "Ambient (25°C)"}
                    onPress={() => setStorageCondition("Ambient (25°C)")}
                  />
                  <StorageOption
                    title="Chilled"
                    subtitle="4°C Refrigerator"
                    active={storageCondition === "Chilled (4°C)"}
                    onPress={() => setStorageCondition("Chilled (4°C)")}
                  />
                </View>
              </ModalSection>

              <ModalSection title="Expiry (TTT Model Result & Manual Override)">
                <View style={styles.expiryInfo}>
                  <View style={styles.expiryInfoIcon}>
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expiryInfoTitle}>
                      Calculated Expiry Date:
                    </Text>
                    <Text style={styles.expiryInfoValue}>
                      {expiryDate}, {expiryTime}
                    </Text>
                    <Text style={styles.expiryInfoDescription}>
                      Based on {secondaryClass} composition under {storageCondition} storage.
                    </Text>
                  </View>
                </View>

                <InputLabel text="Manual Expiry Input (Optional Override)" />
                <View style={styles.twoColumn}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Expiry Date</Text>
                    <TextInput
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      placeholder="e.g. Oct 17, 2026"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                    />
                  </View>
                  <View style={{ width: 115 }}>
                    <Text style={styles.smallLabel}>Expiry Time</Text>
                    <TextInput
                      value={expiryTime}
                      onChangeText={setExpiryTime}
                      placeholder="e.g. 11:59 PM"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                    />
                  </View>
                </View>
              </ModalSection>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => saveListing("Draft")}
                >
                  <Text style={styles.cancelButtonText}>Save draft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.publishButton}
                  activeOpacity={0.85}
                  onPress={() => saveListing("Active")}
                >
                  <Text style={styles.publishButtonText}>
                    {editingListing ? "Save changes" : "Publish listing"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* VIEW LISTING MODAL */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeViewModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeViewModal} />

          <Animated.View
            style={[styles.viewModal, { transform: [{ translateY: viewTranslateY }] }]}
          >
            <View {...viewPanResponder.panHandlers} style={styles.sheetHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeaderText}>
                <Text style={styles.modalTitle}>Listing details</Text>
                <Text style={styles.modalSubtitle}>
                  Bakery surplus information
                </Text>
              </View>
            </View>
            {selectedListing && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.viewModalContent}
              >
                <Image
                  source={{ uri: selectedListing.image }}
                  style={styles.viewImage}
                  resizeMode="cover"
                />
                <View style={styles.viewTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewFoodName}>
                      {selectedListing.name}
                    </Text>
                    <Text style={styles.viewEstablishment}>
                      {selectedListing.establishment}
                    </Text>
                  </View>
                  <StatusPill status={selectedListing.status} />
                </View>

                {selectedListing.pricingMode === "dynamic" && (
                  <LivePricingCard
                    prepDate={selectedListing.preparationDate}
                    expDate={selectedListing.expiryDate}
                    expTime={selectedListing.expiryTime}
                    initialPrice={String(selectedListing.originalPrice)}
                    minPrice={String(selectedListing.floorPrice)}
                  />
                )}

                <View style={styles.viewPriceBox}>
                  <View>
                    <Text style={styles.viewLabel}>{selectedListing.pricingMode === "fixed" ? "Normal Price" : "Discounted Price"}</Text>
                    <Text style={styles.viewPrice}>₱{selectedListing.price}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Quantity</Text>
                    <Text style={styles.viewValue}>
                      {selectedListing.quantity} {selectedListing.unitLabel}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Category</Text>
                    <Text style={styles.viewValue}>
                      {selectedListing.category} ({selectedListing.secondaryClassification})
                    </Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Description</Text>
                  <Text style={styles.viewDescription}>
                    {selectedListing.description || "No description provided."}
                  </Text>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>
                    Storage & preparation
                  </Text>
                  <DetailRow
                    icon="calendar-outline"
                    label="Date Baked"
                    value={selectedListing.preparationDate}
                  />
                  <DetailRow
                    icon="thermometer-outline"
                    label="Storage condition"
                    value={selectedListing.storageCondition}
                  />
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Expiry</Text>
                  <DetailRow
                    icon="calendar-outline"
                    label="Expiry date"
                    value={selectedListing.expiryDate}
                  />
                  <DetailRow
                    icon="time-outline"
                    label="Expiry time"
                    value={selectedListing.expiryTime}
                  />
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity
                    style={styles.viewCloseButton}
                    activeOpacity={0.8}
                    onPress={closeViewModal}
                  >
                    <Text style={styles.viewCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                  {selectedListing.status !== "Flagged" && (
                    <TouchableOpacity
                      style={styles.viewEditButton}
                      activeOpacity={0.85}
                      onPress={() => {
                        closeViewModal();
                        setTimeout(() => {
                          openEditListing(selectedListing);
                        }, 300);
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={Colors.white}
                      />
                      <Text style={styles.viewEditButtonText}>Edit listing</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =====================================================
    SUB-COMPONENTS
===================================================== */

function StatusPill({ status }: { status: string }) {
  let bg = "#E4F0E8";
  let fg = "#1F6B52";
  let label = "Active";

  if (status === "Draft") { 
    bg = "#F4EEDF"; 
    fg = "#A94A3A"; 
    label = "Draft"; 
  } else if (status === "Flagged" || status === "Expired") {
    bg = "#FBE4E1";
    fg = "#B3261E";
    label = status === "Expired" ? "Expired" : "Flagged";
  } else if (status !== "Active") { 
    label = status; 
  }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: fg }]} />
      <Text style={[styles.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function ListingCard({
  item,
  onView,
  onEdit,
  onRemove,
}: {
  item: any;
  onView: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("Calculating...");
  const [livePrice, setLivePrice] = useState(Number(item.price) || 0);
  const [isExpired, setIsExpired] = useState(false);

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

  useEffect(() => {
    if (item.pricingMode === "fixed") return;

    const startTime = parseSafeDate(item.preparationDate);
    const endTime = parseSafeDate(item.expiryDate, item.expiryTime);

    const startP = Number(item.originalPrice) || 0;
    const floorP = Number(item.floorPrice) || 0;

    const totalHours = (endTime - startTime) / (1000 * 60 * 60);
    const totalDrop = startP - floorP;
    const hourlyDropAmount = totalHours > 0 ? totalDrop / totalHours : 0;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        setTimeLeft("Time's up");
        setLivePrice(floorP);
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }

      const hoursPassed = Math.floor((now - startTime) / (1000 * 60 * 60));

      if (hoursPassed > 0) {
        let currentPrice = startP - hourlyDropAmount * hoursPassed;
        if (currentPrice < floorP) currentPrice = floorP;
        setLivePrice(currentPrice);
      } else {
        setLivePrice(startP);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [item]);

  return (
    <View style={styles.uiCard}>
      <View style={styles.uiCardTop}>
        <Image source={{ uri: item.image }} style={styles.uiImage} resizeMode="cover" />

        <View style={styles.uiCardDetails}>
          <View style={styles.uiCardHeaderRow}>
            <Text style={styles.uiCardTitle} numberOfLines={1}>{item.name}</Text>
            <StatusPill status={item.status} />
          </View>
          
          <Text style={styles.uiCardSubtitle} numberOfLines={1}>
            {item.category} ({item.secondaryClassification}) · {item.pricingMode === "fixed" ? (
              <Text style={styles.currentLivePrice}>₱{Number(item.price).toFixed(2)}</Text>
            ) : (
              <>
                <Text style={styles.strikethroughPrice}>₱{Number(item.originalPrice).toFixed(2)}</Text> <Text style={styles.currentLivePrice}>₱{livePrice.toFixed(2)}</Text>
              </>
            )}
          </Text>
          
          <View style={styles.uiCardBottomRow}>
            <Text style={styles.uiCardQty}>{item.quantity} {item.unitLabel} available</Text>
            {item.status === "Active" && item.pricingMode === "dynamic" && (
              <View style={[styles.expiryTag, isExpired && styles.expiryTagExpired]}>
                <Ionicons name="time-outline" size={12} color={isExpired ? "#B3261E" : Colors.primary1} />
                <Text style={[styles.expiryText, isExpired && styles.expiryTextExpired]}>{timeLeft}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.uiCardActions}>
        <TouchableOpacity style={styles.uiActionBtn} onPress={onView}>
          <Ionicons name="eye-outline" size={16} color={Colors.primary1} />
          <Text style={styles.uiActionBtnText}>View</Text>
        </TouchableOpacity>

        {item.status !== "Flagged" && (
          <>
            <TouchableOpacity style={styles.uiActionBtn} onPress={onEdit}>
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
              <Text style={[styles.uiActionBtnText, { color: Colors.primary }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uiActionBtn} onPress={onRemove}>
              <Ionicons name="close-circle-outline" size={16} color="#B3261E" />
              <Text style={[styles.uiActionBtnText, { color: "#B3261E" }]}>Remove</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function LivePricingCard({
  prepDate,
  expDate,
  expTime,
  initialPrice,
  minPrice,
}: {
  prepDate: string;
  expDate: string;
  expTime: string;
  initialPrice: string;
  minPrice: string;
}) {
  const [timeLeft, setTimeLeft] = useState("Calculating...");
  const [livePrice, setLivePrice] = useState(Number(initialPrice) || 0);
  const [isExpired, setIsExpired] = useState(false);

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

  useEffect(() => {
    const startTime = parseSafeDate(prepDate);
    const endTime = parseSafeDate(expDate, expTime);
    const startP = Number(initialPrice) || 0;
    const floorP = Number(minPrice) || 0;
    const totalHours = (endTime - startTime) / (1000 * 60 * 60);
    const totalDrop = startP - floorP;
    const hourlyDropAmount = totalHours > 0 ? totalDrop / totalHours : 0;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        setTimeLeft("Expired");
        setLivePrice(floorP);
        setIsExpired(true);
        clearInterval(timer);
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }

      const hoursPassed = Math.floor((now - startTime) / (1000 * 60 * 60));

      if (hoursPassed > 0) {
        let currentPrice = startP - hourlyDropAmount * hoursPassed;
        if (currentPrice < floorP) currentPrice = floorP;
        setLivePrice(currentPrice);
      } else {
        setLivePrice(startP);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [prepDate, expDate, expTime, initialPrice, minPrice]);

  return (
    <View style={styles.liveContainer}>
      <View style={styles.timeRow}>
        <Ionicons
          name="time-outline"
          size={16}
          color={isExpired ? "#A94A3A" : Colors.primary1}
        />
        <Text style={[styles.timeText, isExpired && styles.timeExpired]}>
          {isExpired ? "Time's up" : `Expires in: ${timeLeft}`}
        </Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Live Price</Text>
        <Text style={styles.livePrice}>₱{livePrice.toFixed(2)}</Text>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  warning,
}: {
  icon: any;
  label: string;
  value: string;
  unit?: string;
  warning?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View
          style={[styles.statIcon, warning && styles.statIconWarning]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={warning ? "#A94A3A" : Colors.primary}
          />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statValueRow}>
        <Text style={[styles.statNumber, warning && styles.statNumberWarning]}>
          {value}
        </Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  date,
  last,
}: {
  icon: any;
  title: string;
  description: string;
  date: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.activityItem, last && styles.activityItemLast]}>
      <View style={styles.activityIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDescription}>{description}</Text>
      </View>
      <Text style={styles.activityDate}>{date}</Text>
    </View>
  );
}

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
      style={[styles.navItem, active && styles.navItemActive]}
      activeOpacity={active ? 1 : 0.7}
      onPress={active ? undefined : onPress}
    >
      <Ionicons
        name={icon}
        size={24}
        color={active ? Colors.primary : Colors.icon}
      />
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ModalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.modalSection}>
      <Text style={styles.modalSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InputLabel({ text }: { text: string; }) {
  return <Text style={styles.inputLabel}>{text}</Text>;
}

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
      style={[styles.storageOption, active && styles.storageOptionActive]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioInner} />}
      </View>
      <View>
        <Text style={[styles.storageTitle, active && styles.storageTitleActive]}>
          {title}
        </Text>
        <Text style={styles.storageSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

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
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

/* =====================================================
    STYLES
===================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { minHeight: 70, backgroundColor: Colors.background, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logo: { fontFamily: "PoppinsBold", fontSize: 26, color: Colors.primary, letterSpacing: 0.7 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: -2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 15 },
  headerIconButton: { position: "relative", padding: 4 },
  notificationDot: { position: "absolute", width: 7, height: 7, borderRadius: 4, backgroundColor: "#A94A3A", right: 3, top: 2, borderWidth: 1.5, borderColor: Colors.background },
  profileCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 17, paddingTop: 20, paddingBottom: 20 },
  welcomeSection: { marginBottom: 18 },
  welcomeText: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary1 },
  establishmentTitle: { fontFamily: "PoppinsBold", fontSize: 26, color: Colors.primary2, marginTop: 1 },
  createButton: { minHeight: 68, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", marginBottom: 25 },
  createIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginRight: 11 },
  createTextContainer: { flex: 1 },
  createTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.white },
  createSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: "#D8E3DD", marginTop: 1 },
  sectionHeader: { marginBottom: 11 },
  sectionHeaderWithAction: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 11, marginTop: 3 },
  sectionTitle: { fontFamily: "PoppinsSemiBold", fontSize: 19, color: Colors.primary2 },
  sectionSubtitle: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary1, marginTop: 1 },
  viewAll: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.button, marginBottom: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 25 },
  statCard: { width: "48.5%", backgroundColor: Colors.white, borderRadius: 9, borderWidth: 1, borderColor: Colors.border, padding: 12, minHeight: 92, marginBottom: 9 },
  statTop: { flexDirection: "row", alignItems: "center" },
  statIcon: { width: 29, height: 29, borderRadius: 8, backgroundColor: "#E5EDE7", alignItems: "center", justifyContent: "center", marginRight: 7 },
  statIconWarning: { backgroundColor: "#F3E5DE" },
  statLabel: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, flex: 1 },
  statValueRow: { flexDirection: "row", alignItems: "baseline", marginTop: 7 },
  statNumber: { fontFamily: "PoppinsBold", fontSize: 24, color: Colors.primary2 },
  statNumberWarning: { color: "#A94A3A" },
  statUnit: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginLeft: 3 },
  listingsWrapper: { marginBottom: 25 },
  uiCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  uiCardTop: { flexDirection: "row", padding: 12, gap: 12 },
  uiImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.input },
  uiCardDetails: { flex: 1, justifyContent: "space-between" },
  uiCardHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  uiCardTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  uiCardSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 1 },
  strikethroughPrice: { textDecorationLine: "line-through", color: Colors.placeholder },
  currentLivePrice: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  uiCardBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  uiCardQty: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary2 },
  expiryTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F3F5F4", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  expiryTagExpired: { backgroundColor: "#FBE4E1" },
  expiryText: { fontFamily: "PoppinsMedium", fontSize: 10, color: Colors.primary1 },
  expiryTextExpired: { color: "#B3261E" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusPillText: { fontFamily: "PoppinsMedium", fontSize: 10 },
  uiCardActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, padding: 10, gap: 16 },
  uiActionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  uiActionBtnText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  activityCard: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12 },
  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityItemLast: { borderBottomWidth: 0 },
  activityIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginRight: 9 },
  activityContent: { flex: 1 },
  activityTitle: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary2 },
  activityDescription: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 1 },
  activityDate: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.placeholder, marginLeft: 6 },
  bottomNav: { height: 90, paddingBottom: 25, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 10, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 5, marginHorizontal: 2, borderRadius: 7 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.icon, marginTop: 4 },
  navTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.50)", justifyContent: "flex-end" },
  listingModal: { width: "100%", maxHeight: "94%", backgroundColor: Colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  viewModal: { width: "100%", maxHeight: "90%", backgroundColor: Colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  sheetHeader: { backgroundColor: Colors.background, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#C9CEC9", alignSelf: "center", marginTop: 10, marginBottom: 10 },
  sheetHeaderText: { paddingHorizontal: 18 },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  modalSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1, marginTop: 1 },
  modalScroll: { paddingHorizontal: 17, paddingTop: 17 },
  modalSection: { marginBottom: 22 },
  modalSectionTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginBottom: 10 },
  inputLabel: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary2, marginBottom: 5, marginTop: 9 },
  input: { minHeight: 45, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 11, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, borderWidth: 1, borderColor: Colors.border },
  inputWithIcon: { minHeight: 45, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  selectInput: { minHeight: 45, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border },
  inputText: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2 },
  descriptionInput: { minHeight: 82, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 11, paddingTop: 10, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, borderWidth: 1, borderColor: Colors.border },
  twoColumn: { flexDirection: "row", gap: 9 },
  inlineDropdownContainer: { backgroundColor: Colors.white, borderRadius: 7, borderWidth: 1, borderColor: Colors.border, marginTop: 4, marginBottom: 10, zIndex: 999, elevation: 5 },
  inlineDropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  inlineDropdownItemActive: { backgroundColor: "#E8EFEA" },
  inlineDropdownText: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2 },
  inlineDropdownTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary },
  storageOptions: { flexDirection: "row", gap: 7 },
  storageOption: { flex: 1, minHeight: 55, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, paddingHorizontal: 9, flexDirection: "row", alignItems: "center" },
  storageOptionActive: { backgroundColor: "#E7EEE9", borderColor: Colors.primary },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.icon, alignItems: "center", justifyContent: "center", marginRight: 6 },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  storageTitle: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary2 },
  storageTitleActive: { fontFamily: "PoppinsSemiBold", fontSize: 10, color: Colors.primary },
  storageSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9, color: Colors.primary1, marginTop: 1 },
  expiryDescription: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, lineHeight: 14, marginBottom: 9 },
  expiryInfo: { flexDirection: "row", backgroundColor: "#E9EFE9", borderRadius: 8, padding: 11, marginBottom: 8 },
  expiryInfoIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", marginRight: 9 },
  expiryInfoTitle: { fontFamily: "PoppinsMedium", fontSize: 10, color: Colors.primary1 },
  expiryInfoValue: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary2, marginTop: 1 },
  expiryInfoDescription: { fontFamily: "PoppinsRegular", fontSize: 9, color: Colors.primary1, marginTop: 2 },
  smallLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginBottom: 4 },
  modalButtons: { flexDirection: "row", gap: 9, marginTop: 2 },
  cancelButton: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: Colors.button, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white },
  cancelButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.button },
  publishButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  publishButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.white },
  viewModalContent: { paddingHorizontal: 17, paddingTop: 17 },
  viewImage: { width: "100%", height: 190, borderRadius: 10, backgroundColor: Colors.input, marginBottom: 14 },
  viewTitleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 15 },
  viewFoodName: { fontFamily: "PoppinsBold", fontSize: 19, color: Colors.primary2 },
  viewEstablishment: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 2 },
  viewPriceBox: { flexDirection: "row", backgroundColor: "#E9EFE9", borderRadius: 9, padding: 12, justifyContent: "space-between", marginBottom: 17 },
  viewLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginBottom: 2 },
  viewPrice: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary },
  viewValue: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  viewSection: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 14 },
  viewSectionTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginBottom: 9 },
  viewDescription: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, lineHeight: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  detailIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 9 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2, marginTop: 1 },
  viewActions: { flexDirection: "row", gap: 9, marginTop: 2 },
  viewCloseButton: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  viewCloseButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary1 },
  viewEditButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  viewEditButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.white },
  cameraButton: { width: '100%', height: 160, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.input, overflow: 'hidden' },
  cameraPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.icon, marginTop: 8 },
  liveContainer: { backgroundColor: "#E9EFE9", borderRadius: 9, padding: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.primary },
  timeRow: { flexDirection: "row", alignItems: "center" },
  timeText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1, marginLeft: 6, minWidth: 175, fontVariant: ['tabular-nums'] },
  timeExpired: { color: "#A94A3A", fontFamily: "PoppinsBold" },
  priceRow: { alignItems: "flex-end" },
  priceLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  livePrice: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary },
  pricingToggleContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.input, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, marginTop: 6 },
} as any);