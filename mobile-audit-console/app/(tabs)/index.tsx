import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Meter, ProofPill, SectionTitle, StatusPill } from "@/components/audit-ui";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { auditAreas, auditMeta, engines, findings } from "@/lib/audit-data";

export default function AuditHomeScreen() {
  const colors = useColors();
  const blockedCount = engines.filter((engine) => engine.runtimeStatus === "BLOCKED").length;
  const openFindings = findings.filter((finding) => finding.status !== "FIXED").length;
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <FlatList
        data={auditAreas.slice(0, 5)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<View><View style={styles.topline}><View><Text style={[styles.kicker, { color: colors.muted }]}>OCTIVA STUDIOS</Text><Text style={[styles.date, { color: colors.muted }]}>Evidence snapshot · {auditMeta.auditDate}</Text></View><View style={[styles.mark, { backgroundColor: colors.tint }]}><IconSymbol name="shield.lefthalf.filled" color="#FFFFFF" size={20} /></View></View><Text style={[styles.title, { color: colors.text }]}>Audit command center</Text><View style={[styles.verdictCard, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}><View style={styles.verdictHead}><View><Text style={styles.verdictEyebrow}>EXECUTIVE VERDICT</Text><Text style={styles.verdictTitle}>{auditMeta.verdict}</Text></View><StatusPill label="BLOCKED" /></View><Text style={styles.verdictCopy}>{auditMeta.evidenceStandard}</Text><Text style={styles.scopeCopy}>{auditMeta.scope}</Text></View><View style={styles.statGrid}><StatCard label="ENGINES BLOCKED" value={String(blockedCount)} color="#B91C1C" /><StatCard label="OPEN FINDINGS" value={String(openFindings)} color="#B45309" /><StatCard label="AUDITED COMMIT" value={auditMeta.auditedCommit} color={colors.tint} compact /></View><SectionTitle eyebrow="Evidence coverage" title="Engine readiness" action={<Pressable accessibilityLabel="View engine verification" onPress={() => router.push("/(tabs)/engines")} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}><Text style={[styles.textActionLabel, { color: colors.tint }]}>View all</Text></Pressable>} /><View style={[styles.enginePanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>{engines.map((engine) => <View key={engine.id} style={styles.engineRow}><View style={[styles.dot, { backgroundColor: engine.color }]} /><View style={styles.engineRowText}><View style={styles.engineLine}><Text style={[styles.engineName, { color: colors.text }]}>{engine.shortName}</Text><Text style={[styles.engineCoverage, { color: colors.muted }]}>{engine.capabilityCount.verified}/{engine.capabilityCount.total} verified</Text></View><Meter color={engine.color} value={(engine.capabilityCount.verified / engine.capabilityCount.total) * 100} /></View><StatusPill label={engine.runtimeStatus} /></View>)}</View><SectionTitle eyebrow="What to inspect" title="Audit areas" /></View>}
        renderItem={({ item }) => <Pressable accessibilityLabel={`Open ${item.title}`} onPress={() => item.id === "router" ? router.push("/(tabs)/findings") : router.push("/(tabs)/fixes")} style={({ pressed }) => [styles.areaRow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={styles.areaCopy}><View style={styles.areaTitleRow}><Text style={[styles.areaTitle, { color: colors.text }]}>{item.title}</Text><ProofPill state={item.state} /></View><Text numberOfLines={2} style={[styles.areaSummary, { color: colors.muted }]}>{item.summary}</Text><Text style={[styles.findingCount, { color: colors.tint }]}>{item.findingCount} linked finding{item.findingCount === 1 ? "" : "s"}</Text></View><IconSymbol name="chevron.right" color={colors.muted} size={20} /></Pressable>}
      />
    </ScreenContainer>
  );
}

function StatCard({ label, value, color, compact }: { label: string; value: string; color: string; compact?: boolean }) {
  const colors = useColors();
  return <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, { color, fontSize: compact ? 17 : 24 }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 },
  topline: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  date: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  mark: { alignItems: "center", borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  title: { fontSize: 31, fontWeight: "800", letterSpacing: -1.05, marginTop: 14 },
  verdictCard: { borderRadius: 19, borderWidth: 1, marginTop: 16, padding: 16 },
  verdictHead: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  verdictEyebrow: { color: "#B91C1C", fontSize: 10, fontWeight: "900", letterSpacing: 0.75 },
  verdictTitle: { color: "#7F1D1D", fontSize: 27, fontWeight: "900", letterSpacing: -0.9, marginTop: 3 },
  verdictCopy: { color: "#7F1D1D", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 12 },
  scopeCopy: { color: "#B45309", fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 7 },
  statGrid: { flexDirection: "row", gap: 8, marginTop: 10 },
  statCard: { borderRadius: 14, borderWidth: 1, flex: 1, minHeight: 82, padding: 10 },
  statLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.45, lineHeight: 11 },
  statValue: { fontWeight: "900", letterSpacing: -0.55, marginTop: 8 },
  textAction: { minHeight: 32, paddingLeft: 10, paddingTop: 7 },
  textActionLabel: { fontSize: 13, fontWeight: "800" },
  enginePanel: { borderRadius: 18, borderWidth: 1, padding: 14 },
  engineRow: { alignItems: "center", flexDirection: "row", gap: 9, marginBottom: 14 },
  dot: { borderRadius: 99, height: 9, width: 9 },
  engineRowText: { flex: 1 },
  engineLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  engineName: { fontSize: 13, fontWeight: "800" },
  engineCoverage: { fontSize: 11, fontWeight: "600" },
  areaRow: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 14 },
  areaCopy: { flex: 1, paddingRight: 8 },
  areaTitleRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  areaTitle: { flex: 1, fontSize: 15, fontWeight: "800" },
  areaSummary: { fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  findingCount: { fontSize: 11, fontWeight: "800", marginTop: 9 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
