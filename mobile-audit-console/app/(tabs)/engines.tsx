import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { SectionTitle, StatusPill } from "@/components/audit-ui";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSystemAudit } from "@/lib/octiva-connection";
import { engineColor, supportedCapabilities, type LiveEngine } from "@/lib/octiva-system";

export default function EnginesScreen() {
  const colors = useColors();
  const { data: audit, isLoading, isError, refetch, isRefetching } = useSystemAudit();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (isLoading) return <Loading label="Reading live engine status…" />;
  if (!audit || isError) return <Unavailable label="Connect Octiva on the System tab to inspect live engine data." />;

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><FlatList data={audit.engines} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} onRefresh={refetch} refreshing={isRefetching} ListHeaderComponent={<View><Text style={[styles.kicker, { color: colors.muted }]}>LIVE ADAPTER + RUNTIME EVIDENCE</Text><Text style={[styles.title, { color: colors.text }]}>Engines</Text><Text style={[styles.intro, { color: colors.muted }]}>Every field below is returned by Octiva’s current System / Audit contract. A live READY state is separate from playable-audio proof.</Text><SectionTitle eyebrow="Tap an engine" title="Evidence records" /></View>} renderItem={({ item }) => <EngineCard engine={item} isOpen={selectedId === item.id} onPress={() => setSelectedId(selectedId === item.id ? null : item.id)} />} /></ScreenContainer>;
}

function EngineCard({ engine, isOpen, onPress }: { engine: LiveEngine; isOpen: boolean; onPress: () => void }) {
  const colors = useColors();
  const color = engineColor(engine.id);
  const capabilities = supportedCapabilities(engine.capabilities);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: isOpen ? color : colors.border }, pressed && styles.pressed]}><View style={styles.cardTop}><View style={[styles.engineMark, { backgroundColor: color }]}><Text style={styles.engineMarkText}>{engine.name.slice(0, 3).toUpperCase()}</Text></View><View style={styles.nameWrap}><Text style={[styles.name, { color: colors.text }]}>{engine.name}</Text><Text style={[styles.sub, { color: colors.muted }]}>{engine.backend ? "Local backend configured" : "Backend path unavailable"}</Text></View><IconSymbol name="chevron.right" color={colors.muted} size={20} /></View><View style={styles.pills}><StatusPill label={engine.state} /><StatusPill label={engine.runtime_evidence.state} /></View>{isOpen ? <View style={[styles.detail, { borderTopColor: colors.border }]}><Detail label="LIVE BLOCKER" value={engine.blocker ?? "No live blocker returned."} /><Detail label="RUNTIME EVIDENCE" value={engine.runtime_evidence.state === "VERIFIED" ? `Verified generation ${engine.runtime_evidence.generation_id ?? "unknown"} · ${engine.runtime_evidence.bytes ?? "unknown"} bytes` : "No verified playable-audio record is currently available."} /><Detail label="CHECKPOINT" value={engine.checkpoint ?? "Unavailable from the current adapter."} /><Detail label="HARDWARE" value={engine.vram_requirement ?? "Unavailable from the current adapter."} /><Text style={[styles.capLabel, { color: colors.muted }]}>LIVE CAPABILITIES</Text><View style={styles.capabilities}>{capabilities.length ? capabilities.map((capability) => <Text key={capability} style={[styles.capability, { color, backgroundColor: `${color}18` }]}>{capability}</Text>) : <Text style={[styles.sub, { color: colors.muted }]}>No capabilities were returned.</Text>}</View></View> : null}</Pressable>;
}

function Detail({ label, value }: { label: string; value: string }) { const colors = useColors(); return <View style={styles.detailItem}><Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text></View>; }
function Loading({ label }: { label: string }) { const colors = useColors(); return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.tint} /><Text style={[styles.loading, { color: colors.muted }]}>{label}</Text></ScreenContainer>; }
function Unavailable({ label }: { label: string }) { const colors = useColors(); return <ScreenContainer className="items-center justify-center px-8"><IconSymbol name="wifi.exclamationmark" size={30} color={colors.warning} /><Text style={[styles.unavailable, { color: colors.text }]}>{label}</Text></ScreenContainer>; }

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 }, kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.85, marginTop: 10 }, title: { fontSize: 31, fontWeight: "800", letterSpacing: -1.05, marginTop: 4 }, intro: { fontSize: 14, lineHeight: 20, marginTop: 8 }, card: { borderRadius: 18, borderWidth: 1, marginBottom: 12, padding: 15 }, cardTop: { alignItems: "center", flexDirection: "row" }, engineMark: { alignItems: "center", borderRadius: 11, height: 42, justifyContent: "center", marginRight: 11, width: 42 }, engineMarkText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, nameWrap: { flex: 1 }, name: { fontSize: 16, fontWeight: "800" }, sub: { fontSize: 12, lineHeight: 17, marginTop: 3 }, pills: { flexDirection: "row", gap: 7, marginLeft: 53, marginTop: 10 }, detail: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 4 }, detailItem: { marginTop: 11 }, detailLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.65 }, detailValue: { fontSize: 12.5, fontWeight: "600", lineHeight: 18, marginTop: 3 }, capLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.65, marginTop: 15 }, capabilities: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }, capability: { borderRadius: 7, fontSize: 11, fontWeight: "700", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 5 }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] }, loading: { fontSize: 14, fontWeight: "700", marginTop: 12 }, unavailable: { fontSize: 15, fontWeight: "700", lineHeight: 22, marginTop: 13, textAlign: "center" },
});
