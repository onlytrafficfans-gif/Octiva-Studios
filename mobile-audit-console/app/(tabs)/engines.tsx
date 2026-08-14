import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { ProofPill, SectionTitle, StatusPill } from "@/components/audit-ui";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { capabilities, engines, type Engine } from "@/lib/audit-data";

function EngineCard({ engine, isOpen, onPress }: { engine: Engine; isOpen: boolean; onPress: () => void }) {
  const colors = useColors();
  const engineCapabilities = capabilities.filter((capability) => capability[engine.id] === "SUPPORTED");
  return (
    <Pressable
      accessibilityLabel={`View ${engine.name} audit evidence`}
      onPress={onPress}
      style={({ pressed }) => [styles.engineCard, { backgroundColor: colors.surface, borderColor: isOpen ? engine.color : colors.border }, pressed && styles.pressed]}
    >
      <View style={styles.engineHeader}>
        <View style={[styles.engineMark, { backgroundColor: engine.color }]}><Text style={styles.engineMarkText}>{engine.shortName}</Text></View>
        <View style={styles.engineNameWrap}>
          <Text style={[styles.engineName, { color: colors.text }]}>{engine.name}</Text>
          <Text numberOfLines={1} style={[styles.engineSub, { color: colors.muted }]}>{engine.interface}</Text>
        </View>
        <IconSymbol name="chevron.right" color={colors.muted} size={22} />
      </View>
      <View style={styles.statusRow}><StatusPill label={engine.runtimeStatus} /><ProofPill state={engine.docStatus} /></View>
      {isOpen ? (
        <View style={[styles.detailBox, { borderTopColor: colors.border }]}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>Evidence record</Text>
          <Text style={[styles.detailCopy, { color: colors.muted }]}>{engine.proofNote}</Text>
          <View style={styles.factGrid}>
            <Fact label="UPSTREAM" value={engine.upstream} />
            <Fact label="COMMIT" value={engine.commit} />
            <Fact label="LICENSE" value={engine.license} />
            <Fact label="HARDWARE" value={engine.hardware} />
          </View>
          <Text style={[styles.detailTitle, { color: colors.text, marginTop: 16 }]}>Verified capabilities</Text>
          <View style={styles.capabilityWrap}>
            {engineCapabilities.slice(0, 6).map((capability) => <Text key={capability.id} style={[styles.capabilityChip, { color: engine.color, backgroundColor: `${engine.color}18` }]}>{capability.label}</Text>)}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.fact}><Text style={[styles.factLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.factValue, { color: colors.text }]}>{value}</Text></View>;
}

export default function EnginesScreen() {
  const colors = useColors();
  const [selectedId, setSelectedId] = useState<string>("ace");
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <FlatList
        data={engines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={[styles.kicker, { color: colors.muted }]}>UPSTREAM + ADAPTER EVIDENCE</Text>
            <Text style={[styles.title, { color: colors.text }]}>Engine verification</Text>
            <Text style={[styles.intro, { color: colors.muted }]}>Read the proof state, then inspect the capability boundaries before allowing a claim into the product.</Text>
            <SectionTitle eyebrow="Runtime gate" title="All engines remain blocked" />
            <View style={[styles.gateCallout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="exclamationmark.triangle.fill" color="#B91C1C" size={19} />
              <Text style={[styles.gateText, { color: colors.text }]}>Adapter code is not runtime evidence. Each engine needs an artifact that decodes and plays from the target machine.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <EngineCard engine={item} isOpen={item.id === selectedId} onPress={() => setSelectedId(item.id)} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.85, marginTop: 10 },
  title: { fontSize: 31, fontWeight: "800", letterSpacing: -1.05, marginTop: 4 },
  intro: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  gateCallout: { alignItems: "flex-start", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 18, padding: 14 },
  gateText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
  engineCard: { borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: "hidden", padding: 15 },
  engineHeader: { alignItems: "center", flexDirection: "row" },
  engineMark: { alignItems: "center", borderRadius: 11, height: 42, justifyContent: "center", marginRight: 11, width: 42 },
  engineMarkText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  engineNameWrap: { flex: 1 },
  engineName: { fontSize: 16, fontWeight: "800" },
  engineSub: { fontSize: 12, marginTop: 3 },
  statusRow: { flexDirection: "row", gap: 7, marginLeft: 53, marginTop: 10 },
  detailBox: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 14 },
  detailTitle: { fontSize: 13, fontWeight: "800" },
  detailCopy: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  fact: { flexGrow: 1, minWidth: "46%" },
  factLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.65 },
  factValue: { fontSize: 12, fontWeight: "600", lineHeight: 17, marginTop: 3 },
  capabilityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  capabilityChip: { borderRadius: 7, fontSize: 11, fontWeight: "700", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 5 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
