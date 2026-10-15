import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/color";
import {
  URGENCY_COLORS,
  formatCountdown,
  secondsLeft,
  urgencyOf,
  useNow,
} from "@/constants/foodbankApi";

/* =====================================================
   HEADER (same on every food bank screen)
===================================================== */

export function FoodBankHeader() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.logo}>RESERVE</Text>
        <Text style={styles.headerSubtitle}>Food Bank Portal</Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => router.push("/foodbank/activity")}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/foodbank/profile")}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={16} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =====================================================
   LIVE COUNTDOWN (turns orange, then red, as time runs out)
===================================================== */

export function Countdown({
  expiresAt,
  large = false,
}: {
  expiresAt: string | null;
  large?: boolean;
}) {
  const now = useNow(1000);
  const sec = secondsLeft(expiresAt, now);
  const urgency = urgencyOf(sec);
  const c = URGENCY_COLORS[urgency];

  return (
    <View style={[styles.countdown, { backgroundColor: c.bg }, large && styles.countdownLarge]}>
      <Ionicons name="time-outline" size={large ? 16 : 13} color={c.fg} />
      <Text style={[styles.countdownText, { color: c.fg }, large && styles.countdownTextLarge]}>
        {formatCountdown(sec)}
      </Text>
    </View>
  );
}

/* =====================================================
   FILTER CHIPS
===================================================== */

export type ChipOption = { label: string; count?: number };

export function FilterChips({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption[];
  selected: string;
  onSelect: (label: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
    >
      {options.map((opt) => {
        const active = opt.label === selected;
        return (
          <TouchableOpacity
            key={opt.label}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.label)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            {opt.count !== undefined && (
              <View style={[styles.chipCount, active && styles.chipCountActive]}>
                <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>
                  {opt.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: any;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={Colors.primary1} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyButton} activeOpacity={0.85} onPress={onAction}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* =====================================================
   ERROR BANNER + TOAST
===================================================== */

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={18} color="#B3261E" />
      <Text style={styles.errorBannerText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
          <Text style={styles.errorBannerRetry}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <View style={styles.toast}>
        <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </View>
  );
}

/* =====================================================
   CONFIRM MODAL
===================================================== */

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmCancel}
              activeOpacity={0.8}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.confirmCancelText}>Not now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmOk, destructive && styles.confirmOkDestructive]}
              activeOpacity={0.85}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.confirmOkText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  header: { minHeight: 70, backgroundColor: Colors.background, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logo: { fontFamily: "PoppinsBold", fontSize: 23, lineHeight: 27, color: Colors.primary, letterSpacing: 0.7 },
  headerSubtitle: { fontFamily: "PoppinsRegular", fontSize: 8.5, lineHeight: 12, color: Colors.primary1, marginTop: -1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconButton: { position: "relative", padding: 4 },
  notificationDot: { position: "absolute", width: 7, height: 7, borderRadius: 4, backgroundColor: "#A94A3A", right: 3, top: 2, borderWidth: 1.5, borderColor: Colors.background },
  profileCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },

  countdown: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  countdownLarge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, gap: 6 },
  countdownText: { fontFamily: "PoppinsMedium", fontSize: 11 },
  countdownTextLarge: { fontFamily: "PoppinsSemiBold", fontSize: 14 },

  chipScroll: { flexGrow: 0 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: "PoppinsMedium", fontSize: 11, color: Colors.primary1 },
  chipTextActive: { color: Colors.white },
  chipCount: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center" },
  chipCountActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  chipCountText: { fontFamily: "PoppinsMedium", fontSize: 9, color: Colors.primary },
  chipCountTextActive: { color: Colors.white },

  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 30 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E8EFEA", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontFamily: "PoppinsSemiBold", fontSize: 15, color: Colors.primary2, textAlign: "center" },
  emptyMessage: { fontFamily: "PoppinsRegular", fontSize: 11, lineHeight: 17, color: Colors.primary1, textAlign: "center", marginTop: 4 },
  emptyButton: { marginTop: 16, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, height: 40, alignItems: "center", justifyContent: "center" },
  emptyButtonText: { fontFamily: "PoppinsSemiBold", fontSize: 12, color: Colors.white },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FBE4E1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  errorBannerText: { flex: 1, fontFamily: "PoppinsRegular", fontSize: 11, lineHeight: 16, color: "#8C1D18" },
  errorBannerRetry: { fontFamily: "PoppinsSemiBold", fontSize: 11, color: "#B3261E" },

  toastWrap: { position: "absolute", left: 0, right: 0, bottom: 24, alignItems: "center", zIndex: 50 },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary2, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  toastText: { fontFamily: "PoppinsMedium", fontSize: 12, color: Colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,48,38,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmCard: { width: "100%", maxWidth: 380, backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  confirmTitle: { fontFamily: "PoppinsBold", fontSize: 17, color: Colors.primary2 },
  confirmMessage: { fontFamily: "PoppinsRegular", fontSize: 12, lineHeight: 18, color: Colors.primary1, marginTop: 6 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  confirmCancel: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  confirmCancelText: { fontFamily: "PoppinsMedium", fontSize: 13, color: Colors.primary },
  confirmOk: { flex: 1, height: 44, borderRadius: 10, backgroundColor: Colors.button, alignItems: "center", justifyContent: "center" },
  confirmOkDestructive: { backgroundColor: "#B3261E" },
  confirmOkText: { fontFamily: "PoppinsSemiBold", fontSize: 13, color: Colors.white },
});
