import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal, PanResponder, Platform, Pressable, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../services/api';

const SCREEN_HEIGHT = Dimensions.get("window").height;

type ProduceListing = {
  id: number;
  name: string;
  establishment: string;
  price: string;
  originalPrice: string;
  floorPrice: string;
  distance: string;
  time: string;
  image: string;
  urgent: boolean;
  quantity: string;
  weight_per_unit: string; 
  unitFullText: string;
  unitLabel: string; 
  unitId: number;
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

const initialProduceListings: ProduceListing[] = [];

export default function SMEProduceListing() {
  const [foodListings, setFoodListings] = useState<ProduceListing[]>(initialProduceListings);
  const [listingModalVisible, setListingModalVisible] = useState(false);
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

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("Active");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectedListing, setSelectedListing] = useState<ProduceListing | null>(null);
  const [editingListing, setEditingListing] = useState<ProduceListing | null>(null);

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

  const [dateFilterMode, setDateFilterMode] = useState<"All" | "Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("All");
  const [showMainDatePicker, setShowMainDatePicker] = useState(false);
  const [customMainDate, setCustomMainDate] = useState(new Date());

  const [sortMode, setSortMode] = useState<"A-Z" | "Date Posted">("A-Z");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const filterByDateRange = (item: ProduceListing) => {
    if (dateFilterMode === "All") return true;

    const prepDateStr = item.preparationDate;
    if (!prepDateStr || prepDateStr === "Not Set") return false;

    const cleanStr = prepDateStr.replace(/,/g, '').trim();
    const parts = cleanStr.split(' ');
    
    if (parts.length < 3) return false;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.indexOf(parts[0]);
    const dayNum = parseInt(parts[1], 10);
    const yearNum = parseInt(parts[2], 10);

    if (isNaN(monthIndex) || isNaN(dayNum) || isNaN(yearNum)) return false;

    const customYear = customMainDate.getFullYear();
    const customMonth = customMainDate.getMonth();
    const customDay = customMainDate.getDate();

    const now = new Date();

    if (dateFilterMode === "Today") {
      return (
        yearNum === now.getFullYear() &&
        monthIndex === now.getMonth() &&
        dayNum === now.getDate()
      );
    } else if (dateFilterMode === "Last 7 Days" || dateFilterMode === "Last 30 Days") {
      const itemDateObj = new Date(yearNum, monthIndex, dayNum);
      const diffDays = (now.getTime() - itemDateObj.getTime()) / (1000 * 60 * 60 * 24);
      const limit = dateFilterMode === "Last 7 Days" ? 7 : 30;
      return diffDays >= 0 && diffDays <= limit;
    } else if (dateFilterMode === "Custom") {
      return (
        yearNum === customYear &&
        monthIndex === customMonth &&
        dayNum === customDay
      );
    }
    return true;
  };

  const handleSortSelection = (mode: "A-Z" | "Date Posted") => {
    if (sortMode === mode) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortMode(mode);
      setSortDirection("asc");
    }
    setSortDropdownOpen(false);
  };

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    confirmText: "Okay",
    cancelText: "",
    onConfirm: () => {}
  });

  const showAlert = (title: string, message: string, confirmText = "Okay", cancelText = "", onConfirm?: () => void) => {
    setAlertConfig({ 
      visible: true, 
      title, 
      message, 
      confirmText, 
      cancelText, 
      onConfirm: onConfirm || hideAlert 
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const [foodName, setFoodName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const now = new Date();
  const defaultFormattedDate = (now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + 
    now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })).replace(/\u202f/g, ' ');

  const [preparationDate, setPreparationDate] = useState(defaultFormattedDate);
  const [category, setCategory] = useState("Leafy Greens"); 
  const [description, setDescription] = useState("");

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(""); 
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [weightPerUnit, setWeightPerUnit] = useState("0");
  
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [floorPrice, setFloorPrice] = useState("");

  const [storageCondition, setStorageCondition] = useState("Ambient (25°C)"); 
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");
  const [listingStatus, setListingStatus] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [actualDate, setActualDate] = useState(now);

  const formatDateTimeToString = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = months[date.getMonth()];
    const d = date.getDate();
    const y = date.getFullYear();
    
    let hrs = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
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

  const parseExpiryTimestamp = (dateStr: string, timeStr?: string) => {
    try {
      let full = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      full = full.replace(/,/g, '').replace(/\s+/g, ' ').trim(); 
      
      const parts = full.split(' '); 
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[0]);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      let hours = 0;
      let minutes = 0;
      
      if (parts[3]) {
        const timeParts = parts[3].split(':');
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        
        const fullUpper = full.toUpperCase();
        if (fullUpper.includes('PM') && hours < 12) hours += 12;
        if (fullUpper.includes('AM') && hours === 12) hours = 0;
      }

      return new Date(year, monthIndex, day, hours, minutes).getTime();
    } catch (error) {
      return Number.MAX_SAFE_INTEGER; 
    }
  };

  useEffect(() => {
    fetchListings();
    const interval = setInterval(() => {
      fetchListings();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSelectedCategory("All");
  }, [activeTab]);

  const fetchListings = async () => {
    try {
      let donatedProductIds: number[] = [];
      try {
        const donationRes = await api.get('donations/available/');
        donatedProductIds = donationRes.data.map((item: any) => item.product_id);
      } catch (err) {
        console.warn("Could not fetch donations for filtering", err);
      }

      const response = await api.get('listings/establishment/');
      const rawListings = response.data.listings || response.data;
      
      const unDonatedListings = rawListings.filter((item: any) => {
        const listingId = item.prod_id || item.id;
        return !donatedProductIds.includes(listingId);
      });

      const realData = unDonatedListings.map((item: any) => {
        const rawCond = String(item.storage_condition || item.storageCondition || "").toLowerCase();
        let normalizedStorage = "Ambient (25°C)";
        if (rawCond.includes("chilled") || rawCond.includes("4")) {
          normalizedStorage = "Chilled (4°C)";
        }

        const dbUnitId = item.unit || item.unit_id || 2;

        return {
          id: item.prod_id || item.id || Date.now(), 
          name: item.prod_name,
          unitId: dbUnitId,
          unitFullText: getUnitFullText(dbUnitId),
          unitLabel: getUnitLabel(dbUnitId), 
          weight_per_unit: item.weight_per_unit || "0",
          establishment: item.merchant_name || "Market Vendor Portal",
          price: Number(item.price || 0),
          originalPrice: Number(item.original_price || 0),
          floorPrice: Number(item.floor_price || 0),
          distance: "0.5 km", 
          time: item.status === "Draft" ? "Not published" : "Active", 
          image: item.image_path || "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80",
          urgent: false,
          quantity: item.quantity || "0", 
          listingDate: new Date().toLocaleDateString(),
          status: item.status || "Active",
          category: item.category_name || item.category || "Leafy Greens", 
          description: item.prod_desc || "No description provided.",
          preparationDate: item.safely_anchor_time || item.preparation_date || item.prep_date || "Not Set",
          storageCondition: normalizedStorage,
          expiryDate: item.expiry_date || "Not Set", 
          expiryTime: item.expiry_time || "Not Set",
          rescueVoucher: true,
        };
      });

      realData.sort((a: any, b: any) => {
        const timeA = parseExpiryTimestamp(a.expiryDate, a.expiryTime);
        const timeB = parseExpiryTimestamp(b.expiryDate, b.expiryTime);
        return timeA - timeB;
      });

      setFoodListings(realData); 
    } catch (error) {
      console.error("Failed to pull from DB:", error);
    }
  };

  useEffect(() => {
    if (!listingModalVisible) return;
    if (editingListing) return;

    let shelfLifeDays = 3;
    const isAmbient = storageCondition.includes("Ambient");

    if (category === "Leafy Greens") {
      shelfLifeDays = isAmbient ? 2 : 5;
    } else if (category === "Vegetables") {
      shelfLifeDays = isAmbient ? 3 : 6;
    } else if (category === "Fruits") {
      shelfLifeDays = isAmbient ? 4 : 10;
    } else if (category === "Root Crops") {
      shelfLifeDays = isAmbient ? 10 : 20;
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
  }, [preparationDate, storageCondition, category, listingModalVisible, editingListing]);

  const searchVal = searchText.toLowerCase().trim();
  const allActive = foodListings.filter((i) => i.status === "Active");
  const allDrafts = foodListings.filter((i) => i.status === "Draft");
  const allFlagged = foodListings.filter((i) => i.status === "Flagged");

  const getActiveList = () => {
    if (activeTab === "Active") return allActive;
    if (activeTab === "Draft") return allDrafts;
    if (activeTab === "Flagged") return allFlagged;
    return foodListings;
  };

  const currentList = getActiveList();

  const displayedList = currentList.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchVal) ||
      item.category.toLowerCase().includes(searchVal);
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesDateFilter = filterByDateRange(item);
    return matchesSearch && matchesCategory && matchesDateFilter;
  }).sort((a, b) => {
    if (sortMode === "A-Z") {
      const comp = a.name.localeCompare(b.name);
      return sortDirection === "asc" ? comp : -comp;
    } else {
      const timeA = Number(a.id) || 0;
      const timeB = Number(b.id) || 0;
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    }
  });

  const resetForm = () => {
    setFoodName("");
    setImageUri(null);
    setPreparationDate(defaultFormattedDate);
    setActualDate(new Date());
    setDescription("");
    setQuantity("");
    setUnit("");
    setWeightPerUnit("0");
    setOriginalPrice("");
    setDiscountedPrice("");
    setFloorPrice("");
    setCategory("Leafy Greens");
    setCategoryDropdownOpen(false);
    setExpiryDate("");
    setExpiryTime("");
    setListingStatus(true);
    setFormErrors({});
  };

  const openAddListing = () => {
    setEditingListing(null);
    resetForm();
    setListingModalVisible(true); 
  };

  const openEditListing = (item: ProduceListing) => {
    if (item.status === "Flagged") {
      showAlert("Restricted", "Flagged items cannot be edited because they are past or near their expiry threshold.");
      return;
    }
    setEditingListing(item);
    setFoodName(item.name || "");
    setImageUri(item.image || null);
    setUnit(item.unitFullText || "Kilogram (kg)");
    setWeightPerUnit(item.weight_per_unit || "0");
    
    const dbPrepTime = item.preparationDate && item.preparationDate !== "Not Set" ? item.preparationDate : defaultFormattedDate;
    setPreparationDate(dbPrepTime);
    
    const parsedDate = new Date(dbPrepTime);
    if (!isNaN(parsedDate.getTime())) {
      setActualDate(parsedDate);
    } else {
      setActualDate(new Date());
    }

    setCategory(item.category || "Leafy Greens");
    setCategoryDropdownOpen(false);

    setDescription(item.description || "");
    setQuantity(item.quantity ? String(item.quantity) : "");
    
    setOriginalPrice(item.originalPrice ? String(item.originalPrice) : '');
    setDiscountedPrice(item.price ? String(item.price) : '');
    setFloorPrice(item.floorPrice ? String(item.floorPrice) : '');

    setStorageCondition(item.storageCondition);
    setExpiryDate(item.expiryDate || "");
    setExpiryTime(item.expiryTime || "");
    setListingStatus(item.status === "Active");
    setFormErrors({});
    
    setListingModalVisible(true);
  };
  
  const openViewListing = (item: ProduceListing) => {
    setSelectedListing(item);
    setViewModalVisible(true);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert("Permission Needed", "Camera permission is required to snap photos.");
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

  const getUnitLabel = (id: any) => {
    switch (Number(id)) {
      case 1: return "g";
      case 2: return "kg";
      case 3: return "pc";
      case 4: return "pk";
      default: return "kg"; 
    }
  };

  const getUnitFullText = (id: any) => {
    switch (Number(id)) {
      case 1: return "Gram (g)";
      case 2: return "Kilogram (kg)";
      case 3: return "Piece (pc)";
      case 4: return "Pack (pk)";
      default: return "Kilogram (kg)"; 
    }
  };

  const getUnitId = (unitName: string) => {
    switch (unitName) {
      case "Gram (g)": return 1;
      case "Kilogram (kg)": return 2;
      case "Piece (pc)": return 3;
      case "Pack (pk)": return 4;
      default: return 2; 
    }
  };

  const getCategoryId = (catName: string) => {
    switch (catName) {
      case "Leafy Greens": return 5;
      case "Vegetables": return 6;
      case "Fruits": return 7;
      case "Root Crops": return 8;
      default: return 3; 
    }
  };

  const saveListing = async (statusArg?: "Active" | "Draft") => {
    let errors: { [key: string]: string } = {};
    if (!foodName.trim()) errors.foodName = "It requires produce name";
    if (!unit) errors.unit = "It requires selling unit";
    if (!quantity || Number(quantity) <= 0) errors.quantity = "It requires valid quantity";
    
    if ((unit === "Gram (g)" || unit === "Kilogram (kg)") && (!weightPerUnit || Number(weightPerUnit) <= 0)) {
      errors.weightPerUnit = "It requires weight per unit";
    }

    if (!originalPrice || Number(originalPrice) <= 0 || !discountedPrice || Number(discountedPrice) <= 0 || !floorPrice || Number(floorPrice) <= 0) {
      errors.pricing = "Dynamic pricing tiers are required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const finalStatus = statusArg || (listingStatus ? "Active" : "Draft");
      let finalImageUrl = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80";

      if (imageUri && !imageUri.includes("unsplash")) {
        const supabaseUrl = "https://pxyigbutwupyslndoplm.supabase.co"; 
        const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eWlnYnV0d3VweXNsbmRvcGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczOTEzNjcsImV4cCI6MjEwMjk2NzM2N30.r8UjIGq7SiVNPJ87zs_TnHBbRbaVfSk59gmY3jSrdrY"; 
  
        let fileUri = imageUri;
        if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = `file://${fileUri}`;
        }

        const rawExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt; 
        const fileName = `${Date.now()}_produce_photo.${ext}`; 
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

      const payload = {
        prod_name: foodName,
        prod_desc: description,
        quantity: quantity || "0",
        unit: getUnitId(unit),                 
        weight_per_unit: (unit === "Piece (pc)" || unit === "Pack (pk)") ? "0" : (weightPerUnit || "1"),
        price: discountedPrice,
        discounted_price: discountedPrice,
        original_price: originalPrice,
        orig_price: originalPrice,
        floor_price: floorPrice,
        category: getCategoryId(category), 
        pricing_mode: "dynamic",
        merchant: 1, 
        threshold: 1, 
        status: finalStatus,
        preparation_date: preparationDate.replace(/\u202f/g, ' '),
        storage_condition: storageCondition,
        expiry_date: expiryDate,
        expiry_time: expiryTime,
        image_path: finalImageUrl
      };

      if (editingListing) {
        await api.put(`listings/update/${editingListing.id}/`, payload);
      } else {
        await api.post('listings/create/', payload);
      }

      await fetchListings();
      setListingModalVisible(false);
      const wasEditing = !!editingListing;
      setEditingListing(null);
      resetForm();

      showAlert("Success", wasEditing ? "Produce listing updated successfully!" : "Produce listing posted successfully!");
    } catch (error: any) {
      const errDetail = error.response && error.response.data ? JSON.stringify(error.response.data) : error.message;
      showAlert("Save Failed", errDetail || "Could not save produce listing.");
    }
  };

  const confirmRemoveListing = (id: number, name: string) => {
    const target = foodListings.find((item) => item.id === id);
    if (target?.status === "Flagged") {
      showAlert("Restricted", "Flagged items cannot be removed.");
      return;
    }
    showAlert(
      "Remove listing?",
      `Are you sure you want to remove ${name} from your listings?`,
      "Yes, remove",
      "Not now",
      () => executeRemoveListing(id)
    );
  };

  const executeRemoveListing = async (id: number) => {
    try {
      await api.delete(`listings/delete/${id}/`);
      setFoodListings((current) => current.filter((item) => item.id !== id));
      setAlertConfig({ visible: true, title: "Removed", message: "Listing successfully removed.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
    } catch (error) {
      setAlertConfig({ visible: true, title: "Delete Failed", message: "Could not delete listing.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Market Vendor Portal</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={() => router.replace("/establishment/notifications")}>
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace("/establishment/profile")}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Produce Listings</Text>
        </View>

        <TouchableOpacity style={styles.createButton} activeOpacity={0.85} onPress={openAddListing}>
          <View style={styles.createIcon}>
            <Ionicons name="add" size={23} color={Colors.white} />
          </View>
          <View style={styles.createTextContainer}>
            <Text style={styles.createTitle}>Add produce listing</Text>
            <Text style={styles.createSubtitle}>Post surplus fruits & vegetables</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={Colors.white} />
        </TouchableOpacity>

        {/* SORT & FILTER ROW */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, zIndex: 30, position: "relative" }}>
          <View style={{ flex: 1, position: "relative" }}>
            <TouchableOpacity 
              style={styles.filterDropdownBtn} 
              activeOpacity={0.7}
              onPress={() => { setSortDropdownOpen(!sortDropdownOpen); setDateDropdownOpen(false); }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                <Ionicons name="swap-vertical-outline" size={15} color={Colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  Sort: {sortMode} {sortDirection === "asc" ? "↑" : "↓"}
                </Text>
              </View>
              <Ionicons name={sortDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color={Colors.icon} />
            </TouchableOpacity>

            {sortDropdownOpen && (
              <View style={styles.floatingDropdownContainer}>
                <TouchableOpacity
                  style={[styles.inlineDropdownItem, sortMode === "A-Z" && styles.inlineDropdownItemActive]}
                  onPress={() => handleSortSelection("A-Z")}
                >
                  <Text style={[styles.inlineDropdownText, sortMode === "A-Z" && styles.inlineDropdownTextActive]}>A–Z</Text>
                  {sortMode === "A-Z" && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineDropdownItem, sortMode === "Date Posted" && styles.inlineDropdownItemActive]}
                  onPress={() => handleSortSelection("Date Posted")}
                >
                  <Text style={[styles.inlineDropdownText, sortMode === "Date Posted" && styles.inlineDropdownTextActive]}>Date Posted</Text>
                  {sortMode === "Date Posted" && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ flex: 1, position: "relative" }}>
            <TouchableOpacity 
              style={styles.filterDropdownBtn} 
              activeOpacity={0.7}
              onPress={() => { setDateDropdownOpen(!dateDropdownOpen); setSortDropdownOpen(false); }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                <Ionicons name="filter-outline" size={15} color={Colors.primary} />
                <Text style={styles.filterDropdownText} numberOfLines={1}>
                  Filter: {dateFilterMode === "Custom" ? customMainDate.toLocaleDateString() : dateFilterMode}
                </Text>
              </View>
              <Ionicons name={dateDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color={Colors.icon} />
            </TouchableOpacity>

            {dateDropdownOpen && (
              <View style={styles.floatingDropdownContainer}>
                {(["All", "Today", "Last 7 Days", "Last 30 Days", "Custom"] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.inlineDropdownItem, dateFilterMode === mode && styles.inlineDropdownItemActive]}
                    onPress={() => {
                      setDateDropdownOpen(false);
                      if (mode === "Custom") {
                        setShowMainDatePicker(true);
                      } else {
                        setDateFilterMode(mode);
                      }
                    }}
                  >
                    <Text style={[styles.inlineDropdownText, dateFilterMode === mode && styles.inlineDropdownTextActive]}>{mode}</Text>
                    {dateFilterMode === mode && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showMainDatePicker && (
              <DateTimePicker
                value={customMainDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowMainDatePicker(false);
                  if (selectedDate) {
                    setCustomMainDate(selectedDate);
                    setDateFilterMode("Custom");
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TabButton title="All" isActive={activeTab === "All"} count={foodListings.length} onPress={() => setActiveTab("All")} />
          <TabButton title="Active" isActive={activeTab === "Active"} count={allActive.length} onPress={() => setActiveTab("Active")} />
          <TabButton title="Drafts" isActive={activeTab === "Draft"} count={allDrafts.length} onPress={() => setActiveTab("Draft")} />
          <TabButton title="Flagged" isActive={activeTab === "Flagged"} count={allFlagged.length} onPress={() => setActiveTab("Flagged")} />
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search produce..."
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* LISTINGS */}
        <View style={styles.listingsWrapper}>
          {displayedList.length > 0 ? (
            displayedList.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onView={() => openViewListing(item)}
                onEdit={() => openEditListing(item)}
                onRemove={() => confirmRemoveListing(item.id, item.name)}
                onStatusChange={fetchListings}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="leaf-outline" size={25} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No produce listings found</Text>
              <Text style={styles.emptyDescription}>Try another search or add new fruits/vegetables.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid-outline" label="Home" onPress={() => router.replace("/establishment/dashboard")} />
        <BottomNavItem icon="restaurant" label="Listings" active onPress={() => router.replace("/establishment/listing")} />
        <BottomNavItem icon="basket-outline" label="Orders" onPress={() => router.replace("/establishment/orders")} />
        <BottomNavItem icon="cash-outline" label="Earnings" onPress={() => router.replace("/establishment/earnings")} />
        <BottomNavItem icon="heart-outline" label="Donation" onPress={() => router.replace("/establishment/donation")} />
        <BottomNavItem icon="person-outline" label="Impact" onPress={() => router.replace("/establishment/impact")} />
      </View>

      {/* ALERT MODAL */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <View style={styles.alertButtonRow}>
              {alertConfig.cancelText ? (
                <TouchableOpacity style={styles.alertCancelButton} activeOpacity={0.7} onPress={hideAlert}>
                  <Text style={styles.alertCancelButtonText}>{alertConfig.cancelText}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.alertConfirmButton} activeOpacity={0.8} onPress={alertConfig.onConfirm}>
                <Text style={styles.alertConfirmButtonText}>{alertConfig.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD / EDIT PRODUCE MODAL */}
      <Modal visible={listingModalVisible} transparent animationType="none" onRequestClose={closeListingModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeListingModal} />

          <Animated.View style={[styles.listingModal, { transform: [{ translateY: listingTranslateY }] }]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flexShrink: 1 }}>
              
              <View {...listingPanResponder.panHandlers} style={styles.sheetHeader}>
                <View style={styles.dragHandle} />
                <View style={styles.sheetHeaderText}>
                  <Text style={styles.modalTitle}>{editingListing ? "Edit produce listing" : "Add produce listing"}</Text>
                  <Text style={styles.modalSubtitle}>Configure categories, weights, and dynamic discounting.</Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll} nestedScrollEnabled={true}>
                <ModalSection title="Produce details">
                  
                  <InputLabel text="Produce Name" />
                  <TextInput
                    value={foodName}
                    onChangeText={(val) => { setFoodName(val); setFormErrors(prev => ({ ...prev, foodName: "" })); }}
                    placeholder="e.g. Fresh Tomatoes or Pechay Tagalog"
                    placeholderTextColor={Colors.placeholder}
                    style={[styles.input, formErrors.foodName && styles.inputError]}
                  />
                  <ErrorText message={formErrors.foodName} />

                  <InputLabel text="Produce Picture" />
                  <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8} onPress={takePhoto}>
                    {imageUri && !imageUri.includes("unsplash") ? (
                      <Image source={{ uri: imageUri }} style={styles.cameraPreview} />
                    ) : (
                      <View style={styles.cameraPlaceholder}>
                        <Ionicons name="camera" size={24} color={Colors.icon} />
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
                    <Ionicons name={categoryDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={Colors.icon} />
                  </TouchableOpacity>

                  {categoryDropdownOpen && (
                    <View style={styles.inlineDropdownContainer}>
                      {["Leafy Greens", "Vegetables", "Fruits", "Root Crops"].map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.inlineDropdownItem, category === cat && styles.inlineDropdownItemActive]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setCategory(cat);
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.inlineDropdownText, category === cat && styles.inlineDropdownTextActive]}>{cat}</Text>
                          {category === cat && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <InputLabel text="Description" />
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe ripeness, quality, or bundle details..."
                    placeholderTextColor={Colors.placeholder}
                    multiline
                    textAlignVertical="top"
                    style={styles.descriptionInput}
                  />

                  <InputLabel text="Selling Unit" />
                  <TouchableOpacity 
                    style={[styles.selectInput, formErrors.unit && styles.inputError]} 
                    activeOpacity={0.7}
                    onPress={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  >
                    <Text style={[styles.inputText, !unit && { color: Colors.placeholder }]}>
                      {unit || "Select unit (g, kg, piece, pack)..."}
                    </Text>
                    <Ionicons name={unitDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={Colors.icon} />
                  </TouchableOpacity>
                  <ErrorText message={formErrors.unit} />

                  {unitDropdownOpen && (
                    <View style={styles.inlineDropdownContainer}>
                      {["Gram (g)", "Kilogram (kg)", "Piece (pc)", "Pack (pk)"].map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.inlineDropdownItem, unit === u && styles.inlineDropdownItemActive]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setUnit(u);
                            setUnitDropdownOpen(false);
                            setFormErrors(prev => ({ ...prev, unit: "" }));
                            if (u === "Kilogram (kg)") setWeightPerUnit("1.0");
                            if (u === "Gram (g)") setWeightPerUnit("100");
                            if (u === "Piece (pc)" || u === "Pack (pk)") setWeightPerUnit("0");
                          }}
                        >
                          <Text style={[styles.inlineDropdownText, unit === u && styles.inlineDropdownTextActive]}>{u}</Text>
                          {unit === u && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* CONDITIONAL WEIGHT PER UNIT FOR g & kg */}
                  {(unit === "Gram (g)" || unit === "Kilogram (kg)") ? (
                    <View style={styles.twoColumn}>
                      <View style={{ flex: 1 }}>
                        <InputLabel text="Quantity Available" />
                        <TextInput 
                          value={quantity} 
                          onChangeText={(val) => { setQuantity(val); setFormErrors(prev => ({ ...prev, quantity: "" })); }} 
                          keyboardType="numeric" 
                          placeholder="e.g. 10" 
                          placeholderTextColor={Colors.placeholder} 
                          style={[styles.input, formErrors.quantity && styles.inputError]} 
                        />
                        <ErrorText message={formErrors.quantity} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <InputLabel text={unit === "Gram (g)" ? "Weight per unit (g)" : "Weight per unit (kg)"} />
                        <TextInput 
                          value={weightPerUnit} 
                          onChangeText={(val) => { setWeightPerUnit(val); setFormErrors(prev => ({ ...prev, weightPerUnit: "" })); }} 
                          keyboardType="numeric" 
                          placeholder={unit === "Gram (g)" ? "e.g. 500" : "e.g. 0.5"} 
                          placeholderTextColor={Colors.placeholder} 
                          style={[styles.input, formErrors.weightPerUnit && styles.inputError]} 
                        />
                        <ErrorText message={formErrors.weightPerUnit} />
                      </View>
                    </View>
                  ) : (
                    <View>
                      <InputLabel text="Quantity Available" />
                      <TextInput 
                        value={quantity} 
                        onChangeText={(val) => { setQuantity(val); setFormErrors(prev => ({ ...prev, quantity: "" })); }} 
                        keyboardType="numeric" 
                        placeholder="e.g. 15" 
                        placeholderTextColor={Colors.placeholder} 
                        style={[styles.input, formErrors.quantity && styles.inputError]} 
                      />
                      <ErrorText message={formErrors.quantity} />
                    </View>
                  )}

                  {/* DYNAMIC PRICING STRUCTURE ONLY */}
                  <InputLabel text="Dynamic Pricing Structure (Required)" />
                  <View style={styles.twoColumn}>
                    <View style={{ flex: 1 }}>
                      <InputLabel text="Original Price (₱)" />
                      <TextInput
                        value={originalPrice}
                        onChangeText={(val) => { setOriginalPrice(val); setFormErrors(prev => ({ ...prev, pricing: "" })); }}
                        placeholder="e.g. 150.00"
                        keyboardType="numeric"
                        style={[styles.input, formErrors.pricing && styles.inputError]}
                        placeholderTextColor={Colors.placeholder}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <InputLabel text="Discounted Price (₱)" />
                      <TextInput
                        value={discountedPrice}
                        onChangeText={(val) => { setDiscountedPrice(val); setFormErrors(prev => ({ ...prev, pricing: "" })); }}
                        placeholder="e.g. 110.00"
                        keyboardType="numeric"
                        style={[styles.input, formErrors.pricing && styles.inputError]}
                        placeholderTextColor={Colors.placeholder}
                      />
                    </View>
                  </View>

                  <InputLabel text="Floor Price / Minimum (₱)" />
                  <TextInput
                    value={floorPrice}
                    onChangeText={(val) => { setFloorPrice(val); setFormErrors(prev => ({ ...prev, pricing: "" })); }}
                    placeholder="e.g. 50.00"
                    keyboardType="numeric"
                    style={[styles.input, formErrors.pricing && styles.inputError]}
                    placeholderTextColor={Colors.placeholder}
                  />
                  <ErrorText message={formErrors.pricing} />

                  <Text style={styles.expiryDescription}>
                    Prices will automatically markdown hourly from the discounted price down to the floor price.
                  </Text>
                </ModalSection>

                <ModalSection title="Storage & harvest date">
                  <InputLabel text="Harvested / Posted On (Date & Time)" />
                  <View style={styles.twoColumn}>
                    <TouchableOpacity
                      style={[styles.inputWithIcon, { flex: 1 }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setPickerMode("date");
                        setShowPicker(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.inputText} numberOfLines={1}>
                        {preparationDate.includes(',') ? preparationDate.split(',').slice(0, 2).join(',').trim() : preparationDate}
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
                      <Ionicons name="time-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.inputText} numberOfLines={1}>
                        {preparationDate.includes(',') ? preparationDate.split(',').slice(2).join(',').trim() : "10:00 AM"}
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
                    <StorageOption title="Ambient" subtitle="25°C Room Temp" active={storageCondition === "Ambient (25°C)"} onPress={() => setStorageCondition("Ambient (25°C)")} />
                    <StorageOption title="Chilled" subtitle="4°C Refrigerator" active={storageCondition === "Chilled (4°C)"} onPress={() => setStorageCondition("Chilled (4°C)")} />
                  </View>
                </ModalSection>

                <ModalSection title="Expiry (TTT Model Result & Manual Override)">
                  <View style={styles.expiryInfo}>
                    <View style={styles.expiryInfoIcon}>
                      <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.expiryInfoTitle}>Calculated Expiry Date:</Text>
                      <Text style={styles.expiryInfoValue}>{expiryDate}, {expiryTime}</Text>
                      <Text style={styles.expiryInfoDescription}>
                        Based on {category} under {storageCondition} storage.
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
                  <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={() => saveListing("Draft")}>
                    <Text style={styles.cancelButtonText}>Save draft</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.publishButton} activeOpacity={0.85} onPress={() => saveListing("Active")}>
                    <Text style={styles.publishButtonText}>{editingListing ? "Save changes" : "Publish listing"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* VIEW LISTING MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="none" onRequestClose={closeViewModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeViewModal} />

          <Animated.View style={[styles.viewModal, { transform: [{ translateY: viewTranslateY }] }]}>
            <View {...viewPanResponder.panHandlers} style={styles.sheetHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeaderText}>
                <Text style={styles.modalTitle}>Produce details</Text>
                <Text style={styles.modalSubtitle}>Market vendor surplus information</Text>
              </View>
            </View>
            {selectedListing && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewModalContent}>
                <Image source={{ uri: selectedListing.image }} style={styles.viewImage} resizeMode="cover" />
                <View style={styles.viewTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewFoodName}>{selectedListing.name}</Text>
                    <Text style={styles.viewEstablishment}>{selectedListing.establishment}</Text>
                  </View>
                  <StatusPill status={selectedListing.status} />
                </View>

                <LivePricingCard 
                  prepDate={selectedListing.preparationDate}
                  expDate={selectedListing.expiryDate}
                  expTime={selectedListing.expiryTime}
                  initialPrice={selectedListing.originalPrice.toString()}
                  minPrice={selectedListing.floorPrice.toString()}
                />

                <View style={styles.viewPriceBox}>
                  <View>
                    <Text style={styles.viewLabel}>Discounted Price</Text>
                    <Text style={styles.viewPrice}>{selectedListing.price}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Quantity</Text>
                    <Text style={styles.viewValue}>{selectedListing.quantity} {selectedListing.unitLabel}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Category</Text>
                    <Text style={styles.viewValue}>{selectedListing.category}</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Description</Text>
                  <Text style={styles.viewDescription}>{selectedListing.description || "No description provided."}</Text>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Storage & harvest</Text>
                  <DetailRow icon="calendar-outline" label="Harvested / Posted" value={selectedListing.preparationDate} />
                  <DetailRow icon="thermometer-outline" label="Storage condition" value={selectedListing.storageCondition} />
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Expiry</Text>
                  <DetailRow icon="calendar-outline" label="Expiry date" value={selectedListing.expiryDate} />
                  <DetailRow icon="time-outline" label="Expiry time" value={selectedListing.expiryTime} />
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity style={styles.viewCloseButton} activeOpacity={0.8} onPress={closeViewModal}>
                    <Text style={styles.viewCloseButtonText}>Close</Text>
                  </TouchableOpacity>

                  {selectedListing.status !== "Flagged" && (
                    <TouchableOpacity
                      style={styles.viewEditButton}
                      activeOpacity={0.85}
                      onPress={() => {
                        closeViewModal();
                        setTimeout(() => { openEditListing(selectedListing); }, 300);
                      }}
                    >
                      <Ionicons name="create-outline" size={17} color={Colors.white} />
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
function TabButton({ title, isActive, count, onPress }: { title: string; isActive: boolean; count?: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabBtn, isActive && styles.tabBtnActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: string }) {
  let bg = "#E4F0E8";
  let fg = "#1F6B52";
  let label = "Active";

  if (status === "Draft") { bg = "#F4EEDF"; fg = "#A94A3A"; label = "Draft"; } 
  else if (status === "Flagged") { bg = "#FBE4E1"; fg = "#B3261E"; label = "Flagged"; }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: fg }]} />
      <Text style={[styles.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function ListingCard({ item, onView, onEdit, onRemove, onStatusChange }: { item: ProduceListing; onView: () => void; onEdit: () => void; onRemove: () => void; onStatusChange?: () => void; }) {
  const [timeLeft, setTimeLeft] = useState("Calculating...");
  const [livePrice, setLivePrice] = useState(Number(item.price) || 0);
  const [isExpired, setIsExpired] = useState(false);

  const parseSafeDate = (dateStr: string, timeStr?: string) => {
    try {
      let full = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      full = full.replace(/,/g, '').replace(/\s+/g, ' ').trim(); 
      const parts = full.split(' '); 
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[0]);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      let hours = 0, minutes = 0;
      if (parts[3]) {
        const timeParts = parts[3].split(':');
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        const fullUpper = full.toUpperCase();
        if (fullUpper.includes('PM') && hours < 12) hours += 12;
        if (fullUpper.includes('AM') && hours === 12) hours = 0;
      }
      return new Date(year, monthIndex, day, hours, minutes).getTime();
    } catch (error) {
      return new Date().getTime(); 
    }
  };

  useEffect(() => {
    const startTime = parseSafeDate(item.preparationDate);
    const endTime = parseSafeDate(item.expiryDate, item.expiryTime);
    const startP = Number(item.originalPrice) || 0;
    const floorP = Number(item.floorPrice) || 0;

    const totalHours = (endTime - startTime) / (1000 * 60 * 60);
    const totalDrop = startP - floorP;
    const hourlyDropAmount = totalHours > 0 ? (totalDrop / totalHours) : 0;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;
      const secondsRemaining = distance / 1000;

      if (secondsRemaining <= 1830 && item.status === "Active") {
        item.status = "Flagged";
        api.put(`listings/update/${item.id}/`, { status: "Flagged" }).then(() => onStatusChange?.()).catch(console.log);
      }

      if (distance <= 0) {
        setTimeLeft("Time's up");
        setLivePrice(floorP);
        setIsExpired(true);
        if (item.status === "Active") {
          item.status = "Flagged";
          api.put(`listings/update/${item.id}/`, { status: "Flagged" }).then(() => onStatusChange?.()).catch(console.log);
        }
        clearInterval(timer);
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`);

      const hoursPassed = Math.floor((now - startTime) / (1000 * 60 * 60));
      if (hoursPassed > 0) {
        let currentPrice = startP - (hourlyDropAmount * hoursPassed);
        if (currentPrice < floorP) currentPrice = floorP;
        setLivePrice(currentPrice);
      } else {
        setLivePrice(startP);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [item, onStatusChange]);

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
            {item.category} · <Text style={styles.strikethroughPrice}>₱{Number(item.originalPrice || 0).toFixed(2)}</Text> <Text style={styles.currentLivePrice}>₱{livePrice.toFixed(2)}</Text>
          </Text>
          <View style={styles.uiCardBottomRow}>
            <Text style={styles.uiCardQty}>{item.quantity} {item.unitLabel} available</Text>
            {item.status === "Active" && (
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

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string; }) {
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

function BottomNavItem({ icon, label, active, onPress }: { icon: any; label: string; active?: boolean; onPress: () => void; }) {
  return (
    <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]} activeOpacity={active ? 1 : 0.7} onPress={active ? undefined : onPress}>
      <Ionicons name={icon} size={24} color={active ? Colors.primary : Colors.icon} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode; }) {
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

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

function StorageOption({ title, subtitle, active, onPress }: { title: string; subtitle: string; active: boolean; onPress: () => void; }) {
  return (
    <TouchableOpacity style={[styles.storageOption, active && styles.storageOptionActive]} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioInner} />}
      </View>
      <View>
        <Text style={[styles.storageTitle, active && styles.storageTitleActive]}>{title}</Text>
        <Text style={styles.storageSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function LivePricingCard({ prepDate, expDate, expTime, initialPrice, minPrice }: { prepDate: string; expDate: string; expTime: string; initialPrice: string; minPrice: string; }) {
  const [timeLeft, setTimeLeft] = useState("Calculating...");
  const [livePrice, setLivePrice] = useState(Number(initialPrice) || 0);
  const [isExpired, setIsExpired] = useState(false);

  const parseSafeDate = (dateStr: string, timeStr?: string) => {
    try {
      let full = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      full = full.replace(/,/g, '').replace(/\s+/g, ' ').trim(); 
      const parts = full.split(' '); 
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[0]);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      let hours = 0, minutes = 0;
      if (parts[3]) {
        const timeParts = parts[3].split(':');
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        const fullUpper = full.toUpperCase();
        if (fullUpper.includes('PM') && hours < 12) hours += 12;
        if (fullUpper.includes('AM') && hours === 12) hours = 0;
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
    const hourlyDropAmount = totalHours > 0 ? (totalDrop / totalHours) : 0;

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
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`);

      const hoursPassed = Math.floor((now - startTime) / (1000 * 60 * 60));
      if (hoursPassed > 0) {
        let currentPrice = startP - (hourlyDropAmount * hoursPassed);
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
        <Ionicons name="time-outline" size={16} color={isExpired ? "#A94A3A" : Colors.primary1} />
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
  pageHeader: { marginBottom: 17 },
  pageTitle: { fontFamily: "PoppinsBold", fontSize: 26, color: Colors.primary2 },
  createButton: { minHeight: 68, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", marginBottom: 18 },
  createIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center", marginRight: 11 },
  createTextContainer: { flex: 1 },
  createTitle: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.white },
  createSubtitle: { fontFamily: "PoppinsRegular", fontSize: 11, color: "#D8E3DD", marginTop: 1 },
  tabsContainer: { flexDirection: "row", backgroundColor: "#EBEFEB", borderRadius: 12, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, gap: 5 },
  tabBtnActive: { backgroundColor: Colors.white, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabBtnText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary1 },
  tabBtnTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary2 },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#D1D8D4", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  tabBadgeActive: { backgroundColor: Colors.button },
  tabBadgeText: { fontFamily: "PoppinsMedium", fontSize: 9.5, color: Colors.primary2 },
  tabBadgeTextActive: { color: Colors.white },
  searchContainer: { minHeight: 42, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary2, marginLeft: 8, paddingVertical: 9 },
  listingsWrapper: { marginBottom: 25, gap: 12 },
  uiCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden" },
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
  emptyCard: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingVertical: 35, paddingHorizontal: 20, alignItems: "center" },
  emptyIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 9 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1, textAlign: "center", marginTop: 3 },
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
  modalScroll: { paddingHorizontal: 17, paddingTop: 17, paddingBottom: 40 },
  modalSection: { marginBottom: 22 },
  modalSectionTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginBottom: 10 },
  inputLabel: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary2, marginBottom: 5, marginTop: 9 },
  input: { minHeight: 45, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 11, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, borderWidth: 1, borderColor: Colors.border },
  inputError: { borderColor: "#B3261E" },
  errorText: { fontFamily: "PoppinsRegular", fontSize: 11, color: "#B3261E", marginTop: 3, marginBottom: 2 },
  inputWithIcon: { minHeight: 45, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  selectInput: { minHeight: 45, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border },
  inputText: { fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2 },
  descriptionInput: { minHeight: 82, borderRadius: 7, backgroundColor: Colors.input, paddingHorizontal: 11, paddingTop: 10, fontFamily: "PoppinsRegular", fontSize: 13, color: Colors.primary2, borderWidth: 1, borderColor: Colors.border },
  twoColumn: { flexDirection: "row", gap: 9 },
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
  cameraButton: { width: '100%', height: 160, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.input, overflow: 'hidden', marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cameraPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cameraText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.icon },
  liveContainer: { backgroundColor: "#E9EFE9", borderRadius: 9, padding: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.primary },
  timeRow: { flexDirection: "row", alignItems: "center" },
  timeText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1, marginLeft: 6, minWidth: 175, fontVariant: ['tabular-nums'] },
  timeExpired: { color: "#A94A3A", fontFamily: "PoppinsBold" },
  priceRow: { alignItems: "flex-end" },
  priceLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  livePrice: { fontFamily: "PoppinsBold", fontSize: 20, color: Colors.primary },
  floatingDropdownContainer: { 
    position: "absolute", 
    top: 44, 
    left: 0, 
    right: 0, 
    backgroundColor: Colors.white, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    zIndex: 9999, 
    elevation: 10, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    shadowOffset: { width: 0, height: 4 }, 
  },
  filterDropdownBtn: { 
    minHeight: 45, 
    borderRadius: 10, 
    backgroundColor: Colors.white, 
    paddingHorizontal: 12, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    borderWidth: 1, 
    borderColor: Colors.border, 
  },
  filterDropdownText: { 
    fontFamily: "PoppinsMedium", 
    fontSize: 12, 
    color: Colors.primary2, 
  },
  inlineDropdownItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
  },
  inlineDropdownItemActive: { 
    backgroundColor: "#E8EFEA", 
  },
  inlineDropdownText: { 
    fontFamily: "PoppinsRegular", 
    fontSize: 12, 
    color: Colors.primary2, 
  },
  inlineDropdownTextActive: { 
    fontFamily: "PoppinsSemiBold", 
    color: Colors.primary, 
  },
} as any);