import { Colors } from "@/constants/color";
import { Slot, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FoodBankBottomNav,
  FoodBankHeader,
  FoodBankShellDirectRenderContext,
  FoodBankTabName,
} from "../components/FoodBankNav";
import FoodBankDashboard from "./dashboard";
import FoodBankDonationsScreen from "./donations";
import FoodBankPartnersScreen from "./partners";
import FoodBankProfile from "./profile";
import FoodBankRequestsScreen from "./requests";

function resolveFoodBankTab(pathname: string): FoodBankTabName | null {
  if (!pathname) return null;
  const clean = pathname.toLowerCase();
  if (clean.includes("/foodbank/dashboard")) return "Home";
  if (clean.includes("/foodbank/requests")) return "Requests";
  if (clean.includes("/foodbank/donations")) return "Donations";
  if (clean.includes("/foodbank/partners")) return "Partners";
  if (clean.includes("/foodbank/profile")) return "Profile";
  return null;
}

export default function FoodBankLayout() {
  const pathname = usePathname();
  const matchedTab = resolveFoodBankTab(pathname);
  const isTabRoute = Boolean(matchedTab);

  const [activeTab, setActiveTab] = useState<FoodBankTabName>(
    matchedTab || "Home"
  );
  const [shellMounted, setShellMounted] = useState<boolean>(isTabRoute);

  useEffect(() => {
    if (matchedTab) {
      setShellMounted(true);
      setActiveTab(matchedTab);
    }
  }, [matchedTab]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "fb_switch_tab",
      (payload: { tab: FoodBankTabName }) => {
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
        <FoodBankShellDirectRenderContext.Provider value={true}>
          <View
            style={[styles.shellContainer, !isTabRoute && styles.hidden]}
          >
            <SafeAreaView
              style={styles.safeArea}
              edges={["top", "left", "right"]}
            >
              {/* Persistent Top Header (Hidden on Profile since Profile is full-screen) */}
              <View style={activeTab === "Profile" ? styles.hidden : undefined}>
                <FoodBankHeader
                  isShellHeader
                  activeTab={activeTab}
                  onSelectTab={(nextTab) => setActiveTab(nextTab)}
                />
              </View>

              {/* All 5 Main Food Bank Tabs Kept Mounted in Memory */}
              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Home" && styles.hidden,
                ]}
              >
                <FoodBankDashboard />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Requests" && styles.hidden,
                ]}
              >
                <FoodBankRequestsScreen />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Donations" && styles.hidden,
                ]}
              >
                <FoodBankDonationsScreen />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Partners" && styles.hidden,
                ]}
              >
                <FoodBankPartnersScreen />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Profile" && styles.hidden,
                ]}
              >
                <FoodBankProfile />
              </View>

              {/* Persistent Flush Bottom Navbar */}
              <FoodBankBottomNav
                activeTab={activeTab}
                isShellNav
                onSelectTab={(nextTab) => setActiveTab(nextTab)}
              />
            </SafeAreaView>
          </View>
        </FoodBankShellDirectRenderContext.Provider>
      )}

      {/* PURE-JS SLOT FOR SUB-PAGES (notifications, personal-info, privacy, signup) */}
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