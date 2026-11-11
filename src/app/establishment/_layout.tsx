import { Colors } from "@/constants/color";
import { Slot, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    EstablishmentBottomNav,
    EstablishmentHeader,
    getAppStorage,
    MerchantShellDirectRenderContext,
    MerchantTabName,
} from "../components/EstablishmentNav";
import EstablishmentDashboard from "./dashboard";
import DonationHub from "./donation";
import EstablishmentEarnings from "./earnings";
import EstablishmentImpact from "./impact";
import EstablishmentListing from "./listing";
import SMEProduceListing from "./market_listing";
import EstablishmentOrders from "./orders";
import EstablishmentProfile from "./profile";

function resolveMerchantTab(pathname: string): MerchantTabName | null {
  if (!pathname) return null;
  const clean = pathname.toLowerCase();
  if (clean.includes("/establishment/dashboard")) return "Home";
  if (
    clean.includes("/establishment/market_listing") ||
    clean.includes("/establishment/listing")
  ) {
    return "Listings";
  }
  if (clean.includes("/establishment/orders")) return "Orders";
  if (clean.includes("/establishment/donation")) return "Donation";
  if (clean.includes("/establishment/earnings")) return "Earnings";
  if (clean.includes("/establishment/impact")) return "Impact";
  if (clean.includes("/establishment/profile")) return "Profile";
  return null;
}

export default function EstablishmentLayout() {
  const pathname = usePathname();
  const matchedTab = resolveMerchantTab(pathname);
  const isTabRoute = Boolean(matchedTab);

  const [activeTab, setActiveTab] = useState<MerchantTabName>(
    matchedTab || "Home"
  );
  const [shellMounted, setShellMounted] = useState<boolean>(isTabRoute);
  const [isMarketVendor, setIsMarketVendor] = useState(
    pathname?.toLowerCase().includes("market_listing") || false
  );

  useEffect(() => {
    const checkType = async () => {
      const mType = (await getAppStorage("merch_type")) || "Bakeshop";
      setIsMarketVendor(mType.toLowerCase().includes("market"));
    };
    checkType();

    const profSub = DeviceEventEmitter.addListener(
      "merchant_profile_updated",
      () => {
        checkType();
      }
    );
    return () => profSub.remove();
  }, []);

  useEffect(() => {
    if (matchedTab) {
      setShellMounted(true);
      setActiveTab(matchedTab);
      if (pathname?.toLowerCase().includes("market_listing")) {
        setIsMarketVendor(true);
      }
    }
  }, [matchedTab, pathname]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "merchant_switch_tab",
      (payload: { tab: MerchantTabName }) => {
        if (payload?.tab) {
          setShellMounted(true);
          setActiveTab(payload.tab);
        }
      }
    );
    return () => sub.remove();
  }, []);

  const showShell = shellMounted || isTabRoute;

  return (
    <View style={styles.root}>
      {/* PERSISTENT MULTI-TAB SHELL (STAYS ALIVE IN MEMORY — ZERO RELOADS) */}
      {showShell && (
        <MerchantShellDirectRenderContext.Provider value={true}>
          <View
            style={[styles.shellContainer, !isTabRoute && styles.hidden]}
          >
            <SafeAreaView
              style={styles.safeArea}
              edges={["top", "left", "right"]}
            >
              {/* Persistent Top Header (Hidden on Profile since Profile is full-screen) */}
              <View style={activeTab === "Profile" ? styles.hidden : undefined}>
                <EstablishmentHeader
                  isShellHeader
                  activeTab={activeTab}
                  onSelectTab={(nextTab) => setActiveTab(nextTab)}
                />
              </View>

              {/* All 7 Main Merchant Tabs Kept Mounted in Memory */}
              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Home" && styles.hidden,
                ]}
              >
                <EstablishmentDashboard />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Listings" && styles.hidden,
                ]}
              >
                {isMarketVendor ? (
                  <SMEProduceListing />
                ) : (
                  <EstablishmentListing />
                )}
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Orders" && styles.hidden,
                ]}
              >
                <EstablishmentOrders />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Donation" && styles.hidden,
                ]}
              >
                <DonationHub />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Earnings" && styles.hidden,
                ]}
              >
                <EstablishmentEarnings />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Impact" && styles.hidden,
                ]}
              >
                <EstablishmentImpact />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Profile" && styles.hidden,
                ]}
              >
                <EstablishmentProfile />
              </View>

              {/* Persistent Flush Bottom Navbar */}
              <EstablishmentBottomNav
                activeTab={activeTab}
                isShellNav
                onSelectTab={(nextTab) => setActiveTab(nextTab)}
              />
            </SafeAreaView>
          </View>
        </MerchantShellDirectRenderContext.Provider>
      )}

      {/* PURE-JS SLOT FOR SUB-PAGES (notifications, personal-info, privacy, signup, resubmit-permit) */}
      <View style={isTabRoute ? styles.hidden : styles.stackContainer}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  shellContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabPane: {
    flex: 1,
  },
  stackContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hidden: {
    display: "none",
  },
});