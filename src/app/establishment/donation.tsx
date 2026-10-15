import { Colors } from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../../services/api";

const SCREEN_HEIGHT = Dimensions.get("window").height;

/* =====================================================
   TYPES
===================================================== */

type DonationRequest = {
  id: string;
  donation_req_id: number;
  requester: string;
  type: string;
  quantity: string;
  urgency: string;
  date: string;
  createdAt: string;
  status: string;
};

type PostedDonationItem = {
  id: string;
  donation_id: number;
  name: string;
  quantity: string;
  category: string;
  status: string;
  datePosted: string;
  claimedBy?: string;
  image: string;
  expires_at?: string | null;
};

type ListingItem = {
  id: number;
  name: string;
  quantity: string;
  category: string;
  price: string;
  image: string;
};

/* =====================================================
   EXPIRY HELPER
===================================================== */

function getExpiryDisplay(expiresAt?: string | null) {
  if (!expiresAt) return { text: "No expiry", expired: false };
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { text: "Expired", expired: true };
  const hrs = Math.floor(ms / (1000 * 60 * 60));
  if (hrs > 48) return { text: `${Math.floor(hrs / 24)}d left`, expired: false };
  if (hrs > 0) return { text: `${hrs}h left`, expired: false };
  const mins = Math.floor(ms / (1000 * 60));
  return { text: `${mins}m left`, expired: false };
}

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return 0;
  try {
    let full = dateStr.replace(/,/g, '').replace(/\u202f/g, ' ').replace(/\s+/g, ' ').trim(); 
    const parts = full.split(' '); 
    
    if (parts.length < 3) return new Date(dateStr).getTime();

    const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[0]);
    if (monthIndex === -1) return new Date(dateStr).getTime();
    
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
    return new Date(dateStr).getTime(); 
  }
};

// Same rule as the listings: 30 minutes (1830 seconds) or less before the expiry
// time, the food is automatically Flagged (this also covers anything already expired).
const FLAG_THRESHOLD_MS = 1830 * 1000;

function isFlagTime(expiresAt?: string | null) {
  if (!expiresAt) return false;
  let end = parseSafeDate(expiresAt);
  if (!end || isNaN(end)) end = new Date(expiresAt).getTime();
  if (!end || isNaN(end)) return false;
  return end - Date.now() <= FLAG_THRESHOLD_MS;
}

/* =====================================================
   BOTTOM SHEET HOOK: SLIDE-UP + PULL-DOWN-TO-CLOSE
===================================================== */
function useBottomSheet(visible: boolean, setVisible: (v: boolean) => void) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Slide the sheet up whenever it opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 14,
      }).start();
    }
  }, [visible]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy); // only allow dragging down
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.8) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setVisible(false));
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  return { translateY, close, panHandlers: panResponder.panHandlers };
}

/* =====================================================
   MAIN DONATION SCREEN
===================================================== */

export default function DonationHub() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Active Donations");
  const [historyFilter, setHistoryFilter] = useState("Requested"); // "Requested" | "Claimed" | "Cancelled" | "Flagged"

  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [merchantListings, setMerchantListings] = useState<ListingItem[]>([]);
  const [postedDonations, setPostedDonations] = useState<PostedDonationItem[]>([]);

  // Re-check every 30s so donations hitting the 30-minute mark move to Flagged live
  const [, setFlagTick] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setFlagTick((n) => n + 1), 30000);
    return () => clearInterval(tick);
  }, []);

/* =====================================================
    SORT & FILTER
===================================================== */
  const [dateFilterMode, setDateFilterMode] = useState<"All" | "Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("All");
  const [showMainDatePicker, setShowMainDatePicker] = useState(false);
  const [customMainDate, setCustomMainDate] = useState(new Date());

  const [sortMode, setSortMode] = useState<"A-Z" | "Date Posted">("A-Z");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const filterByDateRange = (
    item: PostedDonationItem | DonationRequest
  ) => {
    if (dateFilterMode === "All") return true;

    const rawDate =
      "createdAt" in item
        ? item.createdAt
        : item.datePosted;

    if (!rawDate || rawDate === "Not Set") return false;

    const itemDate = new Date(rawDate);

    if (isNaN(itemDate.getTime())) return false;

    const itemDay = new Date(
      itemDate.getFullYear(),
      itemDate.getMonth(),
      itemDate.getDate()
    ).getTime();

    const now = new Date();
    const todayDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    if (dateFilterMode === "Today") {
      return itemDay === todayDay;
    }

    if (
      dateFilterMode === "Last 7 Days" ||
      dateFilterMode === "Last 30 Days"
    ) {
      const diffDays =
        (todayDay - itemDay) / (1000 * 60 * 60 * 24);

      const limit =
        dateFilterMode === "Last 7 Days" ? 7 : 30;

      return diffDays >= 0 && diffDays <= limit;
    }

    if (dateFilterMode === "Custom") {
      const customDay = new Date(
        customMainDate.getFullYear(),
        customMainDate.getMonth(),
        customMainDate.getDate()
      ).getTime();

      return itemDay === customDay;
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

  /* =====================================================
     MODAL STATES
  ===================================================== */
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [selectedPostedItem, setSelectedPostedItem] = useState<PostedDonationItem | null>(null);
  const [viewPostedModalVisible, setViewPostedModalVisible] = useState(false);

  // Bottom-sheet behaviour for the two detail modals
  const viewSheet = useBottomSheet(viewModalVisible, setViewModalVisible);
  const postedSheet = useBottomSheet(viewPostedModalVisible, setViewPostedModalVisible);
  
  const [editItemQty, setEditItemQty] = useState("");
  const [selectListingModalVisible, setSelectListingModalVisible] = useState(false);

  /* =====================================================
     CUSTOM CONFIRMATION / ALERT UI ENGINE
  ===================================================== */
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

  useEffect(() => {
    fetchDonationData();
  }, []);

  const fetchDonationData = async () => {
    try {
      const activeRes = await api.get("donations/available/");
      const listingsRes = await api.get("listings/");

      const listingsMap: Record<string, any> = {};
      listingsRes.data.forEach((l: any) => {
        const id = l.prod_id || l.id;
        listingsMap[id] = l;
      });

      const formattedActive = activeRes.data.map((item: any) => {
        const origListing = listingsMap[item.product_id] || {};
        
        const expDate = item.expiry_date || origListing.expiry_date || "";
        const expTime = item.expiry_time || origListing.expiry_time || "";
        let realExpiry = item.expires_at || origListing.expires_at || null;
        
        if (!realExpiry && expDate) {
          realExpiry = `${expDate} ${expTime}`.trim();
        }

        const rawCreated = item.created_at || origListing.created_at || item.date || new Date();
        const parsedDate = new Date(rawCreated);
        const formattedDateStr = !isNaN(parsedDate.getTime()) 
          ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return {
          id: `POST00${item.donation_id}`,
          donation_id: item.donation_id,
          name: item.food_name || item.item_name || origListing.prod_name || "Surplus Bundle",
          quantity: String(item.qty_donated || 0),
          category: item.food_type || item.category || origListing.category_name || "Surplus",
          status: item.status === "Active" ? "Available" : (item.status || "Available"),
          datePosted: formattedDateStr, // Fixed real date instead of hardcoded "Today"
          claimedBy: item.food_bank_name || item.claimed_by || "Partner Food Bank", 
          image: item.image_path || origListing.image_path || "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
          expires_at: realExpiry, 
        };
      });
      setPostedDonations(formattedActive);

      const donatedProductIds = activeRes.data.map((item: any) => item.listing); 
      
      const formattedListings = listingsRes.data
        .filter((l: any) => !donatedProductIds.includes(l.commerce_id || l.listing_id || l.id)) 
        .map((l: any, index: number) => ({
          id: l.commerce_id || l.listing_id || l.id || l.prod_id || index.toString(),
          commerce_id: l.commerce_id || l.listing_id || l.id, 
          name: l.prod_name,
          quantity: String(l.quantity || "0"),
          category: l.category_name || l.category || "Bakery",
          price: `₱${l.price || '0.00'}`,
          image: l.image_path || "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
        }));
      setMerchantListings(formattedListings);

      const wishlistRes = await api.get("donations/requests/");
      const formattedRequests = wishlistRes.data.map((req: any) => {
      const rawCreatedAt = req.created_at || "";

        return {
          id: `REQ00${req.donation_req_id}`,
          donation_req_id: req.donation_req_id,
          requester: req.merchant_name || "Partner Food Bank",
          type: req.food_type || "Custom Request",
          quantity: String(req.qty_needed),
          urgency: "Standard",
          date: rawCreatedAt
          ? new Date(rawCreatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Not Set",
          createdAt: rawCreatedAt,
          status: req.status || "Active",
        };
      });
      setRequests(formattedRequests);

    } catch (error) {
      console.error("Failed to load live database data:", error);
    }
  };

  /* =====================================================
     FILTERING & TABS LOGIC
  ===================================================== */
  const searchVal = search.toLowerCase().trim();

  // "Available" + 30 minutes (or less) before expiry, or already expired  =>  "Flagged"
  const donations = postedDonations.map((i) =>
    i.status === "Available" && isFlagTime(i.expires_at) ? { ...i, status: "Flagged" } : i
  );

  const allActive = donations.filter((i) => i.status === "Available");
  const allClaims = donations.filter((i) => i.status === "Claimed by Food Bank" || i.status === "Claimed");
  const allWishlists = requests.filter((r) => r.status === "Active");
  
  const postedHistory = donations.filter((i) => i.status === "Fulfilled" || i.status === "Completed" || i.status === "Cancelled" || i.status === "Flagged");
  const requestHistory = requests.filter((r) => r.status === "Fulfilled" || r.status === "Cancelled");

  const getActiveList = () => {
    if (activeTab === "Active Donations") return allActive;
    if (activeTab === "Claims") return allClaims;
    if (activeTab === "Wishlists") return allWishlists;
    
    const allHistory = [...postedHistory, ...requestHistory];
    return allHistory.filter((item: any) => {
      if (historyFilter === "Requested") return item.type !== undefined; 
      if (historyFilter === "Claimed") return item.type === undefined && item.status !== "Cancelled" && item.status !== "Flagged";
      if (historyFilter === "Cancelled") return item.status === "Cancelled";
      if (historyFilter === "Flagged") return item.status === "Flagged";
      return true;
    });
  };

  const currentList = getActiveList();

  const displayedList = currentList.filter((item: any) => {
    const itemName = String(item.name || item.requester || item.type || "").toLowerCase();
    const itemCat = String(item.category || item.type || "").toLowerCase();
    
    const matchesSearch = itemName.includes(searchVal) || itemCat.includes(searchVal);
    const matchesDateFilter = filterByDateRange(item);
    
    return matchesSearch && matchesDateFilter;
  }).sort((a: any, b: any) => {
    if (sortMode === "A-Z") {
      const nameA = String(a.name || a.requester || a.type || "").toLowerCase();
      const nameB = String(b.name || b.requester || b.type || "").toLowerCase();
      const comp = nameA.localeCompare(nameB);
      return sortDirection === "asc" ? comp : -comp;
    } else {
      const timeA = Number(a.donation_id || a.donation_req_id) || new Date(a.date || a.datePosted || 0).getTime() || 0;
      const timeB = Number(b.donation_id || b.donation_req_id) || new Date(b.date || b.datePosted || 0).getTime() || 0;
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    }
  });

  /* =====================================================
     ACTIONS WITH CONFIRMATION MODAL
  ===================================================== */
  const handleViewRequest = (request: DonationRequest) => {
    setSelectedRequest(request);
    setViewModalVisible(true);
  };

  const handleViewPostedItem = (item: PostedDonationItem) => {
    setSelectedPostedItem(item);
    setEditItemQty(item.quantity);
    setViewPostedModalVisible(true);
  };

  const handleApprovePostedClaim = (item: PostedDonationItem) => {
    setViewPostedModalVisible(false);
    setTimeout(() => {
      showAlert(
        "Accept this claim?",
        `Approve the claim for ${item.quantity} of ${item.name}?`,
        "Yes, accept",
        "Not now",
        async () => {
          try {
            await api.patch(`donations/respond/${item.donation_id}/`, {
              action: "received"
            });
            
            setPostedDonations(postedDonations.map((p) => (p.id === item.id ? { ...p, status: "Fulfilled" } : p)));
            setAlertConfig({ visible: true, title: "Claim Approved", message: `Successfully approved claim for ${item.name}! Moved to History.`, confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
          } catch (error) {
            setAlertConfig({ visible: true, title: "Error", message: "Could not approve the claim in the database.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
          }
        }
      );
    }, 300);
  };

  const handleApproveCustomRequest = async (request: DonationRequest) => {
    setViewModalVisible(false);
    setTimeout(() => {
      showAlert(
        "Fulfill this request?",
        `Fulfill the request of ${request.quantity} ${request.type} for ${request.requester}?`,
        "Yes, fulfill",
        "Not now",
        async () => {
          try {
            await api.patch("donations/requests/", {
              donation_req_id: request.donation_req_id,
              status: "Fulfilled"
            });
            setRequests(requests.map((r) => (r.id === request.id ? { ...r, status: "Fulfilled" } : r)));
            setAlertConfig({ visible: true, title: "Request Fulfilled", message: "Request fulfilled successfully!", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
          } catch (error) {
            setAlertConfig({ visible: true, title: "Network Error", message: "Could not update the database. Please try again.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
          }
        }
      );
    }, 300);
  };

  const handleSelectListingForDonation = async (listing: ListingItem) => {
    setSelectListingModalVisible(false);
    setTimeout(() => {
      showAlert(
        "Post this donation?",
        `Post ${listing.quantity} of ${listing.name} from your inventory?`,
        "Yes, post",
        "Not now",
        async () => {
          try {
            await api.post("donations/available/", {
              listing: (listing as any).commerce_id || listing.id, 
              qty_donated: Number(listing.quantity),
              merchant: 1, 
              status: "Active"
            });
            fetchDonationData();
            setAlertConfig({ visible: true, title: "Donation Posted", message: "Item successfully posted for donation!", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
          } catch (error: any) {
            setAlertConfig({ visible: true, title: "Post Failed", message: "Could not save donation to the database.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
          }
        }
      );
    }, 300);
  };

  const handleSaveEditPostedItem = () => {
    if (!selectedPostedItem) return;
    setViewPostedModalVisible(false);
    setTimeout(() => {
      showAlert(
        "Save changes?",
        `Update available quantity to ${editItemQty}?`,
        "Yes, save",
        "Not now",
        () => {
          setPostedDonations(postedDonations.map((item) => item.id === selectedPostedItem.id ? { ...item, quantity: editItemQty } : item));
          setAlertConfig({ visible: true, title: "Updated", message: "Donation quantity updated successfully!", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
        }
      );
    }, 300);
  };

  const handleDeletePostedItem = async (id: string) => {
    const item = postedDonations.find(p => p.id === id);
    setViewPostedModalVisible(false);
    setTimeout(() => {
      showAlert(
        "Cancel this donation?",
        `Remove ${item?.quantity} of ${item?.name} from active donations?`,
        "Yes, cancel",
        "Not now",
        async () => {
            try {
              await api.patch("donations/requests/", {
                donation_req_id: item?.donation_id,
                status: "Cancelled"
              });
              
              setPostedDonations(postedDonations.map((p) => p.id === id ? { ...p, status: "Cancelled" } : p));
              setAlertConfig({ visible: true, title: "Cancelled", message: "Donation item has been cancelled.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
            } catch (error) {
              setAlertConfig({ visible: true, title: "Error", message: "Could not cancel the donation in the database.", confirmText: "Okay", cancelText: "", onConfirm: hideAlert });
            }
          }
      );
    }, 300);
  };

  const handleIncrementQty = () => setEditItemQty(String(parseInt(editItemQty || "0", 10) + 1));
  const handleDecrementQty = () => {
    if (parseInt(editItemQty || "0", 10) > 1) setEditItemQty(String(parseInt(editItemQty || "0", 10) - 1));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ animation: "none", gestureEnabled: false }} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>RESERVE</Text>
          <Text style={styles.headerSubtitle}>Establishment Portal</Text>
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
          <Text style={styles.pageTitle}>Donation Hub</Text>
        </View>

        {/* POST BUTTON */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.85} onPress={() => setSelectListingModalVisible(true)}>
          <View style={styles.createIcon}>
            <Ionicons name="add" size={23} color={Colors.white} />
          </View>
          <View style={styles.createTextContainer}>
            <Text style={styles.createTitle}>Post available donation</Text>
            <Text style={styles.createSubtitle}>Select from inventory for food banks to choose</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={Colors.white} />
        </TouchableOpacity>

        {/* SORT & FILTER ROW */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, zIndex: 30, position: "relative" }}>
          
          {/* SORT DROPDOWN */}
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
                  <Text style={[styles.inlineDropdownText, sortMode === "A-Z" && styles.inlineDropdownTextActive]}>
                    A–Z {sortMode === "A-Z" ? (sortDirection === "asc" ? "(Asc)" : "(Desc)") : ""}
                  </Text>
                  {sortMode === "A-Z" && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inlineDropdownItem, sortMode === "Date Posted" && styles.inlineDropdownItemActive]}
                  onPress={() => handleSortSelection("Date Posted")}
                >
                  <Text style={[styles.inlineDropdownText, sortMode === "Date Posted" && styles.inlineDropdownTextActive]}>
                    Date Posted {sortMode === "Date Posted" ? (sortDirection === "asc" ? "(Oldest)" : "(Newest)") : ""}
                  </Text>
                  {sortMode === "Date Posted" && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* FILTER BY DATE DROPDOWN */}
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
                    <Text style={[styles.inlineDropdownText, dateFilterMode === mode && styles.inlineDropdownTextActive]}>
                      {mode}
                    </Text>
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
                onChange={(event: any, selectedDate?: Date) => {
                  setShowMainDatePicker(false);
                  if (event.type === "dismissed") return;
                  if (selectedDate) {
                    setCustomMainDate(selectedDate);
                    setDateFilterMode("Custom");
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* UNIFIED TABS */}
        <View style={styles.tabsContainer}>
          <TabButton title="Available" isActive={activeTab === "Active Donations"} count={allActive.length} onPress={() => setActiveTab("Active Donations")} />
          <TabButton title="Claims" isActive={activeTab === "Claims"} count={allClaims.length} onPress={() => setActiveTab("Claims")} />
          <TabButton title="Requests" isActive={activeTab === "Wishlists"} count={allWishlists.length} onPress={() => setActiveTab("Wishlists")} />
          <TabButton title="History" isActive={activeTab === "History"} onPress={() => setActiveTab("History")} />
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.icon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search food or merchant..."
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* 4 OPTIONS IN HISTORY */}
        {activeTab === "History" && (
          <View style={styles.historySubTabs}>
            <TouchableOpacity 
              style={[styles.historySubTab, historyFilter === "Requested" && styles.historySubTabActive]} 
              onPress={() => setHistoryFilter("Requested")}
            >
              <Text style={[styles.historySubTabText, historyFilter === "Requested" && styles.historySubTabTextActive]}>Requested</Text>
            </TouchableOpacity>
            
            {/* NEW CLAIMED BUTTON */}
            <TouchableOpacity 
              style={[styles.historySubTab, historyFilter === "Claimed" && styles.historySubTabActive]} 
              onPress={() => setHistoryFilter("Claimed")}
            >
              <Text style={[styles.historySubTabText, historyFilter === "Claimed" && styles.historySubTabTextActive]}>Claimed</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.historySubTab, historyFilter === "Cancelled" && styles.historySubTabActive]} 
              onPress={() => setHistoryFilter("Cancelled")}
            >
              <Text style={[styles.historySubTabText, historyFilter === "Cancelled" && styles.historySubTabTextActive]}>Cancelled</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.historySubTab, historyFilter === "Flagged" && styles.historySubTabActive]} 
              onPress={() => setHistoryFilter("Flagged")}
            >
              <Text style={[styles.historySubTabText, historyFilter === "Flagged" && styles.historySubTabTextActive]}>Flagged</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LISTINGS */}
        <View style={styles.listingsWrapper}>
          {displayedList.length > 0 ? (
            displayedList.map((item: any) => (
              <DonationItemCard 
                key={item.id} 
                item={item} 
                onView={() => item.type !== undefined ? handleViewRequest(item) : handleViewPostedItem(item)}
                onApprove={() => item.type !== undefined ? handleApproveCustomRequest(item) : handleApprovePostedClaim(item)}
                onRemove={() => handleDeletePostedItem(item.id)}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="gift-outline" size={25} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nothing matches</Text>
              <Text style={styles.emptyDescription}>Try a different tab or filter.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <BottomNavItem icon="grid-outline" label="Home" onPress={() => router.replace("/establishment/dashboard")} />
        <BottomNavItem icon="restaurant-outline" label="Listings" onPress={() => router.replace("/establishment/listing")} />
        <BottomNavItem icon="basket-outline" label="Orders" onPress={() => router.replace("/establishment/orders")} />
        <BottomNavItem icon="cash-outline" label="Earnings" onPress={() => router.replace("/establishment/earnings")} />
        <BottomNavItem icon="heart" label="Donation" active onPress={() => router.replace("/establishment/donation")} />
        <BottomNavItem icon="person-outline" label="Impact" onPress={() => router.replace("/establishment/impact")} />
      </View>

      {/* =================================================
          CUSTOM CONFIRMATION / ALERT MODAL
      ===================================================== */}
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

      {/* MODALS */}
      <Modal visible={selectListingModalVisible} transparent animationType="slide" onRequestClose={() => setSelectListingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.listingModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Post available donation</Text>
                <Text style={styles.modalSubtitle}>Choose items from your inventory</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} activeOpacity={0.7} onPress={() => setSelectListingModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {merchantListings.length > 0 ? (
                merchantListings.map((listing) => (
                  <View key={listing.id} style={[styles.listingCardLegacy, { marginBottom: 12 }]}>
                    <View style={styles.productInfoLegacy}>
                      <View style={styles.productHeaderLegacy}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productNameLegacy} numberOfLines={1}>{listing.name}</Text>
                          <Text style={styles.productEstablishmentLegacy}>{listing.category} · {listing.price}</Text>
                        </View>
                      </View>
                      <View style={styles.productBottomLegacy}>
                        <Text style={styles.quantityTextLegacy}>Available Quantity: {listing.quantity}</Text>
                      </View>
                      <View style={[styles.cardActionsLegacy, { justifyContent: 'flex-end' }]}>
                        <TouchableOpacity
                          style={[styles.publishButton, { minHeight: 34, paddingHorizontal: 16 }]}
                          activeOpacity={0.8}
                          onPress={() => handleSelectListingForDonation(listing)}
                        >
                          <Text style={[styles.publishButtonText, { fontSize: 11 }]}>Post for donation</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No food listings found</Text>
                  <Text style={styles.emptyDescription}>Please add items to your active listings first.</Text>
                </View>
              )}
              <View style={{ height: 25 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* VIEW REQUEST MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="none" onRequestClose={viewSheet.close}>
        <View style={styles.modalOverlay}>
          {/* Tap the dimmed area above the sheet to close */}
          <Pressable style={StyleSheet.absoluteFill} onPress={viewSheet.close} />

          <Animated.View style={[styles.viewModal, { transform: [{ translateY: viewSheet.translateY }] }]}>
            {/* Drag handle + header (pull this area down to close) */}
            <View {...viewSheet.panHandlers} style={styles.sheetHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeaderText}>
                <Text style={styles.modalTitle}>Food bank wishlist review</Text>
                <Text style={styles.modalSubtitle}>Fulfill custom request</Text>
              </View>
            </View>
            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewModalContent}>
                <View style={styles.viewPriceBox}>
                  <View>
                    <Text style={styles.viewLabel}>Requested Qty</Text>
                    <Text style={styles.viewPrice}>{selectedRequest.quantity}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Urgency</Text>
                    <Text style={styles.viewValue}>{selectedRequest.urgency}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Status</Text>
                    <Text style={styles.viewValue}>{selectedRequest.status}</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Request Details</Text>
                  <DetailRow icon="business-outline" label="Food Bank Partner" value={selectedRequest.requester} />
                  <DetailRow icon="cube-outline" label="Custom Requirement" value={selectedRequest.type} />
                  <DetailRow icon="calendar-outline" label="Date Posted" value={selectedRequest.date} />
                </View>

                <View style={styles.viewActions}>
                  <TouchableOpacity style={styles.viewCloseButton} activeOpacity={0.8} onPress={viewSheet.close}>
                    <Text style={styles.viewCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                  {selectedRequest.status !== "Fulfilled" && selectedRequest.status !== "Cancelled" && (
                    <TouchableOpacity
                      style={styles.viewEditButton}
                      activeOpacity={0.85}
                      onPress={() => handleApproveCustomRequest(selectedRequest)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={17} color={Colors.white} />
                      <Text style={styles.viewEditButtonText}>Fulfill Request</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* VIEW POSTED MODAL (WITH STEPPER RESTORED) */}
      <Modal visible={viewPostedModalVisible} transparent animationType="none" onRequestClose={postedSheet.close}>
        <View style={styles.modalOverlay}>
          {/* Tap the dimmed area above the sheet to close */}
          <Pressable style={StyleSheet.absoluteFill} onPress={postedSheet.close} />

          <Animated.View style={[styles.viewModal, { transform: [{ translateY: postedSheet.translateY }] }]}>
            {/* Drag handle + header (pull this area down to close) */}
            <View {...postedSheet.panHandlers} style={styles.sheetHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeaderText}>
                <Text style={styles.modalTitle}>Donation item details</Text>
                <Text style={styles.modalSubtitle}>Manage your listed item</Text>
              </View>
            </View>
            {selectedPostedItem && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewModalContent}>
                <Image source={{ uri: selectedPostedItem.image }} style={styles.viewImage} resizeMode="cover" />
                
                <View style={styles.viewPriceBox}>
                  <View>
                    <Text style={styles.viewLabel}>Quantity Available</Text>
                    {selectedPostedItem.status === "Available" ? (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity onPress={handleDecrementQty} style={styles.stepperBtn}>
                          <Text style={styles.stepperBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{editItemQty}</Text>
                        <TouchableOpacity onPress={handleIncrementQty} style={styles.stepperBtn}>
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.viewPrice}>{selectedPostedItem.quantity}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Category</Text>
                    <Text style={styles.viewValue}>{selectedPostedItem.category}</Text>
                  </View>
                  <View>
                    <Text style={styles.viewLabel}>Status</Text>
                    <Text style={styles.viewValue}>{selectedPostedItem.status}</Text>
                  </View>
                </View>

                <View style={styles.viewSection}>
                  <Text style={styles.viewSectionTitle}>Item Information</Text>
                  <DetailRow icon="cube-outline" label="Item Name" value={selectedPostedItem.name} />
                  <DetailRow icon="calendar-outline" label="Date Posted" value={selectedPostedItem.datePosted} />
                </View>

                <View style={styles.viewActions}>
                  {selectedPostedItem.status === "Available" && (
                    <TouchableOpacity 
                      style={[styles.viewCloseButton, { backgroundColor: '#FEE2E2', borderColor: '#FEE2E2' }]} 
                      activeOpacity={0.8} 
                      onPress={() => handleDeletePostedItem(selectedPostedItem.id)}
                    >
                      <Text style={[styles.viewCloseButtonText, { color: '#991B1B' }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedPostedItem.status === "Available" && (
                    <TouchableOpacity
                      style={styles.viewEditButton}
                      activeOpacity={0.85}
                      onPress={handleSaveEditPostedItem}
                    >
                      <Text style={styles.viewEditButtonText}>Save changes</Text>
                    </TouchableOpacity>
                  )}

                  {(selectedPostedItem.status === "Claimed by Food Bank" || selectedPostedItem.status === "Claimed") && (
                    <TouchableOpacity
                      style={styles.viewEditButton}
                      activeOpacity={0.85}
                      onPress={() => handleApprovePostedClaim(selectedPostedItem)}
                    >
                      <Text style={styles.viewEditButtonText}>Approve Claim</Text>
                    </TouchableOpacity>
                  )}

                  {selectedPostedItem.status !== "Available" && selectedPostedItem.status !== "Claimed by Food Bank" && selectedPostedItem.status !== "Claimed" && (
                    <TouchableOpacity style={styles.viewCloseButton} activeOpacity={0.8} onPress={postedSheet.close}>
                      <Text style={styles.viewCloseButtonText}>Close</Text>
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

function DonationItemCard({ item, onView, onApprove, onRemove }: any) {
  const isRequest = item.type !== undefined;
  const [timeLeft, setTimeLeft] = useState("Calculating...");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (isRequest || !item.expires_at) return;
    
    let endTime = parseSafeDate(item.expires_at);
    if (!endTime || isNaN(endTime)) {
        endTime = new Date(item.expires_at).getTime();
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const dist = endTime - now;
      
      if (dist <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        clearInterval(timer);
        return;
      }
      
      const d = Math.floor(dist / (1000 * 60 * 60 * 24));
      const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((dist % (1000 * 60)) / 1000);
      
      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [item, isRequest]);

  return (
    <View style={styles.uiCard}>
      <View style={styles.uiCardTop}>
        {isRequest ? (
          <View style={[styles.uiImage, styles.uiImagePlaceholder]}>
            <Ionicons name="heart-outline" size={32} color={Colors.primary} />
          </View>
        ) : (
          <Image source={{ uri: item.image }} style={styles.uiImage} resizeMode="cover" />
        )}

        <View style={styles.uiCardDetails}>
          <View style={styles.uiCardHeaderRow}>
            <Text style={styles.uiCardTitle} numberOfLines={1}>{isRequest ? item.type : item.name}</Text>
            <StatusPill status={isRequest ? item.status : (item.status === "Available" ? "Available" : item.status)} />
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <Text style={[styles.uiCardSubtitle, { marginTop: 0, flex: 1 }]} numberOfLines={1}>
              {isRequest 
                ? `Req by: ${item.requester}` 
                : (item.status === "Claimed by Food Bank" || item.status === "Claimed") 
                  ? `Claimed by: ${item.claimedBy}` 
                  : item.category}
            </Text>
            
            {!isRequest && item.status === "Available" && (
              <View style={[styles.expiryTag, isExpired && styles.expiryTagExpired]}>
                <Ionicons name="time-outline" size={12} color={isExpired ? "#B3261E" : Colors.primary1} />
                <Text style={[styles.expiryText, isExpired && styles.expiryTextExpired]}>{timeLeft}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.uiCardBottomRow}>
            <Text style={styles.uiCardQty}>{item.quantity} {isRequest ? "requested" : "available"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.uiCardActions}>
        <TouchableOpacity style={styles.uiActionBtn} onPress={onView}>
          <Ionicons name="eye-outline" size={16} color={Colors.primary1} />
          <Text style={styles.uiActionBtnText}>View</Text>
        </TouchableOpacity>

        {!isRequest && item.status === "Available" && (
          <TouchableOpacity style={styles.uiActionBtn} onPress={onRemove}>
            <Ionicons name="close-circle-outline" size={16} color="#B3261E" />
            <Text style={[styles.uiActionBtnText, { color: "#B3261E" }]}>Cancel</Text>
          </TouchableOpacity>
        )}

        {!isRequest && (item.status === "Claimed by Food Bank" || item.status === "Claimed") && (
          <TouchableOpacity style={styles.uiActionBtn} onPress={onApprove}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
            <Text style={[styles.uiActionBtnText, { color: Colors.primary }]}>Approve Claim</Text>
          </TouchableOpacity>
        )}

        {isRequest && item.status === "Active" && (
          <TouchableOpacity style={styles.uiActionBtn} onPress={onApprove}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
            <Text style={[styles.uiActionBtnText, { color: Colors.primary }]}>Fulfill</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

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
  let label = "Available";

  if (status === "Cancelled") { bg = "#FCEFD9"; fg = "#A94A3A"; label = "Cancelled"; }
  else if (status === "Claimed by Food Bank" || status === "Claimed") { bg = "#FCEFD9"; fg = "#8A5A00"; label = "Claimed"; }
  else if (status === "Fulfilled" || status === "Completed") { bg = "#EEF1EE"; fg = "#4F695D"; label = "Completed"; }
  else if (status === "Flagged") { bg = "#FBE4E1"; fg = "#B3261E"; label = "Flagged"; }
  else if (status !== "Available" && status !== "Active") { label = status; }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: fg }]} />
      <Text style={[styles.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
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

function BottomNavItem({ icon, label, active, onPress }: { icon: any; label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.navItem, active && styles.navItemActive]} activeOpacity={active ? 1 : 0.7} onPress={active ? undefined : onPress}>
      <Ionicons name={icon} size={24} color={active ? Colors.primary : Colors.icon} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
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

  historySubTabs: { flexDirection: "row", gap: 10, marginBottom: 16 },
  historySubTab: { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center" },
  historySubTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  historySubTabText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.primary1 },
  historySubTabTextActive: { color: Colors.white },

  listingsWrapper: { gap: 12 },
  uiCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, overflow: "hidden" },
  uiCardTop: { flexDirection: "row", padding: 12, gap: 12 },
  uiImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.input },
  uiImagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9EFE9" },
  uiCardDetails: { flex: 1, justifyContent: "space-between" },
  uiCardHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  uiCardTitle: { flex: 1, fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  uiCardSubtitle: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 1 },
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
  emptyIcon: { width: 45, height: 45, borderRadius: 22, backgroundColor: "#E7EEE9", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  emptyDescription: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1, textAlign: "center", marginTop: 3 },

  bottomNav: { height: 90, paddingBottom: 25, backgroundColor: Colors.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, elevation: 10, paddingHorizontal: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", marginVertical: 5, marginHorizontal: 2, borderRadius: 7 },
  navItemActive: { backgroundColor: "#E8EFEA" },
  navText: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.icon, marginTop: 4 },
  navTextActive: { fontFamily: "PoppinsSemiBold", color: Colors.primary },

  modalOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.50)", justifyContent: "flex-end" },
  viewModal: { width: "100%", maxHeight: "90%", backgroundColor: Colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  sheetHeader: { backgroundColor: Colors.background, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#C9CEC9", alignSelf: "center", marginTop: 10, marginBottom: 10 },
  sheetHeaderText: { paddingHorizontal: 18 },
  modalHeader: { paddingHorizontal: 18, paddingVertical: 15, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  modalSubtitle: { fontFamily: "PoppinsRegular", fontSize: 9.5, color: Colors.primary1, marginTop: 1 },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  
  viewModalContent: { paddingHorizontal: 17, paddingTop: 17 },
  viewImage: { width: "100%", height: 190, borderRadius: 10, backgroundColor: Colors.input, marginBottom: 14 },
  viewPriceBox: { flexDirection: "row", backgroundColor: "#E9EFE9", borderRadius: 9, padding: 12, justifyContent: "space-between", marginBottom: 17 },
  viewLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1, marginBottom: 2 },
  viewPrice: { fontFamily: "PoppinsBold", fontSize: 16, color: Colors.primary },
  viewValue: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.primary2 },
  
  viewSection: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 14 },
  viewSectionTitle: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2, marginBottom: 9 },
  
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  detailIcon: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginRight: 9 },
  detailLabel: { fontFamily: "PoppinsRegular", fontSize: 10, color: Colors.primary1 },
  detailValue: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary2, marginTop: 1 },
  
  viewActions: { flexDirection: "row", gap: 9, marginTop: 2 },
  viewCloseButton: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  viewCloseButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary1 },
  viewEditButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: Colors.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  viewEditButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.white },

  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, marginTop: 4, justifyContent: 'space-between', width: 85, borderWidth: 1, borderColor: Colors.border },
  stepperBtn: { paddingHorizontal: 4 },
  stepperBtnText: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  stepperValue: { fontFamily: "PoppinsBold", fontSize: 14, color: Colors.primary2 },

  listingCardLegacy: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 10, flexDirection: "row" },
  productInfoLegacy: { flex: 1, marginLeft: 11 },
  productHeaderLegacy: { flexDirection: "row", alignItems: "flex-start" },
  productNameLegacy: { fontFamily: "PoppinsSemiBold", fontSize: 16, color: Colors.primary2 },
  productEstablishmentLegacy: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginTop: 1 },
  productBottomLegacy: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 9 },
  quantityTextLegacy: { fontFamily: "PoppinsRegular", fontSize: 11, color: Colors.primary1, marginTop: 2 },
  cardActionsLegacy: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 7, gap: 15 },

  modalButtons: { flexDirection: "row", gap: 9, marginTop: 2 },
  cancelButton: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.primary1 },
  publishButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  publishButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: Colors.white },
  listingModal: { width: "100%", maxHeight: "94%", backgroundColor: Colors.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  modalScroll: { paddingHorizontal: 17, paddingTop: 17 },

  alertOverlay: { flex: 1, backgroundColor: "rgba(18,55,44,0.65)", justifyContent: "center", alignItems: "center", padding: 24 },
  alertCard: { width: "100%", maxWidth: 320, backgroundColor: Colors.white, borderRadius: 16, padding: 24, elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  alertTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2, marginBottom: 8, textAlign: "left", width: "100%" },
  alertMessage: { fontFamily: "PoppinsRegular", fontSize: 12, color: Colors.primary1, marginBottom: 24, lineHeight: 18, textAlign: "left", width: "100%" },
  alertButtonRow: { flexDirection: "row", gap: 12, width: "100%" },
  alertCancelButton: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  alertCancelButtonText: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary1 },
  alertConfirmButton: { flex: 1, height: 44, borderRadius: 8, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  alertConfirmButtonText: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.white },

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
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterDropdownText: {
    fontFamily: "PoppinsMedium",
    fontSize: 11,
    color: Colors.primary2,
  },
  inlineDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
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
});