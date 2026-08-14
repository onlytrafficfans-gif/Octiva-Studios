import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { Meter, SectionTitle, StatusPill } from "@/components/audit-ui";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useOctivaConnection, useSystemAudit } from "@/lib/octiva-connection";
import { engineColor, isValidOctivaApiUrl } from "@/lib/octiva-system";

export default function SystemAuditScreen() {
  const colors = useColors();
  const { apiBaseUrl, isLoaded, saveApiBaseUrl } = useOctivaConnection();
  const auditQuery = useSystemAudit();
  const [draftUrl, setDraftUrl] = useState(apiBaseUrl);

  useEffect(() => setDraftUrl(apiBaseUrl), [apiBaseUrl]);

  if (!isLoaded) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.tint} /><Text style={[styles.loadingText, { color: colors.muted }]}>Preparing System / Audit…</Text></ScreenContainer>;
  }

  if (!apiBaseUrl || auditQuery.isError) {
    return (
      <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
        <ConnectionPanel
          draftUrl={draftUrl}
          setDraftUrl={setDraftUrl}
          onConnect={() => saveApiBaseUrl(draftUrl)}
          isInvalid={Boolean(draftUrl) && !isValidOctivaApiUrl(draftUrl)}
          error={auditQuery.isError ? auditQuery.error.message : undefined}
        />
      </ScreenContainer>
    );
  }

  if (auditQuery.isLoading || !auditQuery.data) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.tint} /><Text style={[styles.loadingText, { color: colors.muted }]}>Reading live Octiva evidence…</Text></ScreenContainer>;
  }

  const audit = auditQuery.data;
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <FlatList
        data={audit.engines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={auditQuery.refetch}
        refreshing={auditQuery.isRefetching}
        ListHeaderComponent={
          <View>
            <View style={styles.topline}>
              <View><Text style={[styles.kicker, { color: colors.muted }]}>OCTIVA STUDIOS</Text><Text style={[styles.date, { color: colors.muted }]}>Live System / Audit</Text></View>
              <Pressable accessibilityLabel="Refresh live Octiva status" onPress={() => auditQuery.refetch()} style={({ pressed }) => [styles.refresh, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><IconSymbol name="arrow.clockwise" color={colors.tint} size={19} /></Pressable>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>System / Audit</Text>
            <View style={[styles.verdictCard, { backgroundColor: audit.verdict === "RUNTIME_READY" ? "#ECFDF5" : "#FEF2F2", borderColor: audit.verdict === "RUNTIME_READY" ? "#A7F3D0" : "#FECACA" }]}>
              <View style={styles.verdictHead}><View><Text style={[styles.verdictEyebrow, { color: audit.verdict === "RUNTIME_READY" ? "#0F766E" : "#B91C1C" }]}>LIVE EXECUTIVE VERDICT</Text><Text style={[styles.verdictTitle, { color: audit.verdict === "RUNTIME_READY" ? "#065F46" : "#7F1D1D" }]}>{audit.verdict === "RUNTIME_READY" ? "RUNTIME READY" : "NOT READY"}</Text></View><StatusPill label={audit.runtime.acceptance_report} tone={audit.runtime.acceptance_report === "AVAILABLE" ? "positive" : "warning"} /></View>
              <Text style={[styles.verdictCopy, { color: audit.verdict === "RUNTIME_READY" ? "#065F46" : "#7F1D1D" }]}>A READY adapter and a verified playable-audio record are both required before the system can report runtime readiness.</Text>
              <Text style={[styles.scopeCopy, { color: colors.muted }]}>Updated {new Date(audit.generated_at).toLocaleString()} · API v{audit.schema_version}</Text>
            </View>
            <View style={styles.statGrid}>
              <StatCard label="READY ENGINES" value={`${audit.summary.ready_engine_count}/${audit.summary.engine_count}`} color={colors.tint} />
              <StatCard label="VERIFIED AUDIO" value={`${audit.summary.verified_runtime_count}/${audit.summary.engine_count}`} color="#0F766E" />
              <StatCard label="PROJECTS" value={String(audit.summary.project_count)} color="#7C3AED" />
            </View>
            <View style={[styles.telemetryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="waveform.path.ecg" color={colors.tint} size={19} /><View style={styles.telemetryCopy}><Text style={[styles.telemetryTitle, { color: colors.text }]}>Generation telemetry</Text><Text style={[styles.telemetryText, { color: colors.muted }]}>{audit.runtime.active_generation.state === "UNAVAILABLE" ? "Unavailable — the current synchronous backend does not publish in-progress telemetry." : "Live active-generation telemetry is available."}</Text></View></View>
            <SectionTitle eyebrow="Live adapter check + runtime evidence" title="Engines" action={<Pressable accessibilityLabel="Open engine details" onPress={() => router.push("/(tabs)/engines")} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}><Text style={[styles.textActionLabel, { color: colors.tint }]}>Details</Text></Pressable>} />
          </View>
        }
        renderItem={({ item }) => {
          const color = engineColor(item.id);
          const isVerified = item.runtime_evidence.state === "VERIFIED";
          return <Pressable accessibilityLabel={`Open ${item.name} details`} onPress={() => router.push("/(tabs)/engines")} style={({ pressed }) => [styles.engineRow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.dot, { backgroundColor: color }]} /><View style={styles.engineRowText}><View style={styles.engineLine}><Text style={[styles.engineName, { color: colors.text }]}>{item.name}</Text><StatusPill label={item.state} /></View><Text numberOfLines={1} style={[styles.engineEvidence, { color: colors.muted }]}>{isVerified ? `Verified audio record · ${item.runtime_evidence.bytes ?? "unknown"} bytes` : item.blocker ?? "No playable-audio acceptance record."}</Text><Meter color={isVerified ? "#0F766E" : color} value={isVerified ? 100 : item.state === "READY" ? 50 : 0} /></View></Pressable>;
        }}
        ListFooterComponent={<View><SectionTitle eyebrow="Live remediation" title="Current findings" action={<Pressable accessibilityLabel="Open live findings" onPress={() => router.push("/(tabs)/findings")} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}><Text style={[styles.textActionLabel, { color: colors.tint }]}>View all</Text></Pressable>} /><Pressable onPress={() => router.push("/(tabs)/findings")} style={({ pressed }) => [styles.findingLink, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.findingLinkTitle, { color: colors.text }]}>{audit.findings.length} evidence-led finding{audit.findings.length === 1 ? "" : "s"}</Text><Text style={[styles.findingLinkCopy, { color: colors.muted }]}>Derived from the current adapter state and measured runtime evidence.</Text><IconSymbol name="chevron.right" color={colors.muted} size={20} /></Pressable></View>}
      />
    </ScreenContainer>
  );
}

function ConnectionPanel({ draftUrl, setDraftUrl, onConnect, isInvalid, error }: { draftUrl: string; setDraftUrl: (value: string) => void; onConnect: () => void; isInvalid: boolean; error?: string }) {
  const colors = useColors();
  return <View style={styles.connectionWrap}><View style={[styles.connectionIcon, { backgroundColor: "#DBEAFE" }]}><IconSymbol name="link" color={colors.tint} size={28} /></View><Text style={[styles.connectionTitle, { color: colors.text }]}>{error ? "Octiva is not reachable" : "Connect Octiva"}</Text><Text style={[styles.connectionCopy, { color: colors.muted }]}>{error ?? "Enter the reachable URL for the Octiva FastAPI service. The companion only reads live status; it does not infer or fabricate runtime results."}</Text><Text style={[styles.inputLabel, { color: colors.muted }]}>OCTIVA API BASE URL</Text><TextInput accessibilityLabel="Octiva API base URL" autoCapitalize="none" autoCorrect={false} keyboardType="url" onChangeText={setDraftUrl} placeholder="https://octiva.example" placeholderTextColor={colors.muted} value={draftUrl} style={[styles.input, { backgroundColor: colors.surface, borderColor: isInvalid ? "#B91C1C" : colors.border, color: colors.text }]} /><Text style={[styles.inputHelp, { color: isInvalid ? "#B91C1C" : colors.muted }]}>{isInvalid ? "Use a complete URL starting with https:// or http://." : "Expected endpoint: /api/system/audit"}</Text><Pressable disabled={!draftUrl || isInvalid} onPress={onConnect} style={({ pressed }) => [styles.connectButton, { backgroundColor: colors.tint }, (!draftUrl || isInvalid) && styles.disabled, pressed && styles.pressed]}><Text style={styles.connectLabel}>Connect live system</Text></Pressable><View style={[styles.connectionNote, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="shield.lefthalf.filled" color="#0F766E" size={18} /><Text style={[styles.connectionNoteCopy, { color: colors.muted }]}>When the API does not publish a field, the companion shows **Unavailable** or **Unproven** rather than using a static snapshot.</Text></View></View>;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, { color }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 },
  loadingText: { fontSize: 14, fontWeight: "700", marginTop: 12 },
  topline: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  date: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  refresh: { alignItems: "center", borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  title: { fontSize: 31, fontWeight: "800", letterSpacing: -1.05, marginTop: 14 },
  verdictCard: { borderRadius: 19, borderWidth: 1, marginTop: 16, padding: 16 },
  verdictHead: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  verdictEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.75 },
  verdictTitle: { fontSize: 27, fontWeight: "900", letterSpacing: -0.9, marginTop: 3 },
  verdictCopy: { fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 12 },
  scopeCopy: { fontSize: 11, fontWeight: "600", lineHeight: 17, marginTop: 8 },
  statGrid: { flexDirection: "row", gap: 8, marginTop: 10 },
  statCard: { borderRadius: 14, borderWidth: 1, flex: 1, minHeight: 78, padding: 10 },
  statLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.45, lineHeight: 11 },
  statValue: { fontSize: 21, fontWeight: "900", letterSpacing: -0.55, marginTop: 8 },
  telemetryRow: { alignItems: "flex-start", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 10, padding: 13 },
  telemetryCopy: { flex: 1 },
  telemetryTitle: { fontSize: 13, fontWeight: "800" },
  telemetryText: { fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 3 },
  textAction: { minHeight: 32, paddingLeft: 10, paddingTop: 7 },
  textActionLabel: { fontSize: 13, fontWeight: "800" },
  engineRow: { alignItems: "flex-start", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 9, marginBottom: 10, padding: 14 },
  dot: { borderRadius: 99, height: 9, marginTop: 5, width: 9 },
  engineRowText: { flex: 1 },
  engineLine: { alignItems: "flex-start", flexDirection: "row", gap: 7, justifyContent: "space-between" },
  engineName: { flex: 1, fontSize: 14, fontWeight: "800", paddingTop: 3 },
  engineEvidence: { fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 5 },
  findingLink: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 14 },
  findingLinkTitle: { flex: 1, fontSize: 15, fontWeight: "800" },
  findingLinkCopy: { fontSize: 12, lineHeight: 18, marginTop: 4, position: "absolute", left: 14, right: 46, top: 39 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  connectionWrap: { flex: 1, justifyContent: "center", paddingBottom: 70 },
  connectionIcon: { alignItems: "center", alignSelf: "flex-start", borderRadius: 17, height: 58, justifyContent: "center", width: 58 },
  connectionTitle: { fontSize: 29, fontWeight: "800", letterSpacing: -0.9, marginTop: 18 },
  connectionCopy: { fontSize: 14, fontWeight: "600", lineHeight: 21, marginTop: 8 },
  inputLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.65, marginTop: 22 },
  input: { borderRadius: 13, borderWidth: 1, fontSize: 14, fontWeight: "600", height: 50, marginTop: 7, paddingHorizontal: 13 },
  inputHelp: { fontSize: 11, fontWeight: "600", lineHeight: 16, marginTop: 5 },
  connectButton: { alignItems: "center", borderRadius: 13, justifyContent: "center", marginTop: 17, minHeight: 50 },
  connectLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  connectionNote: { alignItems: "flex-start", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 18, padding: 12 },
  connectionNoteCopy: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 18 },
});
