import { Colors } from "@/constants/color";
import { Slot, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ConsumerBottomNav,
  ConsumerHeader,
  ConsumerShellDirectRenderContext,
  ConsumerTabName,
} from "../components/ConsumerNav";
import CartScreen from "./cart";
import RescueConfirmed from "./claims";
import Homepage from "./homepage";
import Profile from "./profile";

function resolveConsumerTab(pathname: string): ConsumerTabName | null {
  if (!pathname) return null;
  const clean = pathname.toLowerCase();
  if (clean.includes("/consumer/homepage")) return "Home";
  if (clean.includes("/consumer/cart")) return "Cart";
  if (clean.includes("/consumer/claims")) return "Claims";
  if (clean.includes("/consumer/profile")) return "Profile";
  return null;
}

export default function ConsumerLayout() {
  const pathname = usePathname();
  const matchedTab = resolveConsumerTab(pathname);
  const isTabRoute = Boolean(matchedTab);

  const [activeTab, setActiveTab] = useState<ConsumerTabName>(
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
      "consumer_switch_tab",
      (payload: { tab: ConsumerTabName; params?: any }) => {
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
        <ConsumerShellDirectRenderContext.Provider value={true}>
          <View
            style={[styles.shellContainer, !isTabRoute && styles.hidden]}
          >
            <SafeAreaView
              style={styles.safeArea}
              edges={["top", "left", "right"]}
            >
              {/* Persistent Top Header (Hidden on Profile since Profile is full-screen) */}
              <View style={activeTab === "Profile" ? styles.hidden : undefined}>
                <ConsumerHeader isShellHeader />
              </View>

              {/* All 4 Main Tabs Kept Mounted in Memory */}
              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Home" && styles.hidden,
                ]}
              >
                <Homepage />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Cart" && styles.hidden,
                ]}
              >
                <CartScreen />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Claims" && styles.hidden,
                ]}
              >
                <RescueConfirmed />
              </View>

              <View
                style={[
                  styles.tabPane,
                  activeTab !== "Profile" && styles.hidden,
                ]}
              >
                <Profile />
              </View>

              {/* Persistent Flush Bottom Navbar */}
              <ConsumerBottomNav
                activeTab={activeTab}
                isShellNav
                onSelectTab={(nextTab) => setActiveTab(nextTab)}
              />
            </SafeAreaView>
          </View>
        </ConsumerShellDirectRenderContext.Provider>
      )}

      {/* PURE-JS SLOT FOR AUTH & SUB-PAGES (login, signup, notifications, personal-info, privacy, about) */}
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