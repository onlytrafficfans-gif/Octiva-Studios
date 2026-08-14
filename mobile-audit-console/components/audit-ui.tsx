import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type Tone = "critical" | "warning" | "positive" | "info" | "neutral";

const toneMap: Record<Tone, { light: string; dark: string; textLight: string; textDark: string }> = {
  critical: { light: "#FEE2E2", dark: "#451A1A", textLight: "#B91C1C", textDark: "#FCA5A5" },
  warning: { light: "#FEF3C7", dark: "#422006", textLight: "#92400E", textDark: "#FCD34D" },
  positive: { light: "#CCFBF1", dark: "#042F2E", textLight: "#0F766E", textDark: "#5EEAD4" },
  info: { light: "#DBEAFE", dark: "#172554", textLight: "#1D4ED8", textDark: "#93C5FD" },
  neutral: { light: "#E2E8F0", dark: "#1E293B", textLight: "#475569", textDark: "#CBD5E1" },
};

export function statusTone(value: string): Tone {
  if (["CRITICAL", "BLOCKED", "NOT READY", "UNSUPPORTED", "OFFLINE", "MISSING_MODEL", "MISSING_DEPENDENCY", "INSUFFICIENT_VRAM", "UNSUPPORTED_HARDWARE"].includes(value)) return "critical";
  if (["HIGH", "UNPROVEN", "UNKNOWN", "PARTIAL", "UNAVAILABLE", "LOADING", "GENERATING"].includes(value)) return "warning";
  if (["VERIFIED", "SUPPORTED", "FIXED", "WORKING", "READY", "RUNTIME_READY", "AVAILABLE"].includes(value)) return "positive";
  if (["DOCUMENTED", "MEDIUM"].includes(value)) return "info";
  return "neutral";
}

export function StatusPill({ label, tone }: { label: string; tone?: Tone }) {
  const colors = useColors();
  const resolvedTone = tone ?? statusTone(label);
  const swatch = toneMap[resolvedTone];
  const isDark = colors.background === "#151718";

  return (
    <View style={[styles.pill, { backgroundColor: isDark ? swatch.dark : swatch.light }]}>
      <Text style={[styles.pillText, { color: isDark ? swatch.textDark : swatch.textLight }]}>{label}</Text>
    </View>
  );
}

export function SeverityPill({ severity }: { severity: Severity }) {
  return <StatusPill label={severity} />;
}

export function ProofPill({ state }: { state: string }) {
  return <StatusPill label={state} />;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionTitleText}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.muted }]}>{eyebrow}</Text> : null}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Meter({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.meterTrack, { backgroundColor: colors.border }]}>
      <View style={[styles.meterFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color ?? colors.tint }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 24,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.55,
  },
  sectionTitle: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 22,
  },
  sectionTitleText: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 3, textTransform: "uppercase" },
  sectionHeading: { fontSize: 19, fontWeight: "800", letterSpacing: -0.25 },
  meterTrack: { borderRadius: 999, height: 6, overflow: "hidden", width: "100%" },
  meterFill: { borderRadius: 999, height: "100%" },
});
