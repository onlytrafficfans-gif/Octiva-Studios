import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { SectionTitle, SeverityPill, StatusPill } from "@/components/audit-ui";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { findings, type Finding, type Severity } from "@/lib/audit-data";

type Filter = "ALL" | Severity;
const filters: Filter[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function FindingsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const filteredFindings = useMemo(() => findings.filter((finding) => filter === "ALL" || finding.severity === filter), [filter]);

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <FlatList
        data={filteredFindings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={[styles.kicker, { color: colors.muted }]}>RED-TEAM REGISTER</Text>
            <Text style={[styles.title, { color: colors.text }]}>Findings</Text>
            <Text style={[styles.intro, { color: colors.muted }]}>A finding stays open until the referenced evidence directly demonstrates the required state.</Text>
            <View style={styles.filters}>
              {filters.map((item) => {
                const selected = filter === item;
                return <Pressable key={item} onPress={() => setFilter(item)} style={({ pressed }) => [styles.filter, { backgroundColor: selected ? colors.tint : colors.surface, borderColor: selected ? colors.tint : colors.border }, pressed && styles.pressed]}><Text style={[styles.filterText, { color: selected ? "#FFFFFF" : colors.text }]}>{item}</Text></Pressable>;
              })}
            </View>
            <SectionTitle eyebrow={`${filteredFindings.length} visible`} title="Prioritized evidence gaps" />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityLabel={`Open ${item.title}`} onPress={() => setActiveFinding(item)} style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={styles.rowTop}><SeverityPill severity={item.severity} /><StatusPill label={item.status} /><IconSymbol name="chevron.right" color={colors.muted} size={20} /></View>
            <Text style={[styles.findingTitle, { color: colors.text }]}>{item.title}</Text>
            <Text numberOfLines={2} style={[styles.findingSummary, { color: colors.muted }]}>{item.evidence}</Text>
            <Text style={[styles.area, { color: colors.tint }]}>{item.area}</Text>
          </Pressable>
        )}
      />
      <FindingDetail finding={activeFinding} close={() => setActiveFinding(null)} />
    </ScreenContainer>
  );
}

function FindingDetail({ finding, close }: { finding: Finding | null; close: () => void }) {
  const colors = useColors();
  if (!finding) return null;
  return (
    <Modal animationType="slide" transparent visible onRequestClose={close}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}> 
          <View style={styles.modalHandle} />
          <View style={styles.modalTop}><SeverityPill severity={finding.severity} /><Pressable accessibilityLabel="Close finding detail" onPress={close} style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}><IconSymbol name="xmark" size={18} color={colors.text} /></Pressable></View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{finding.title}</Text>
          <DetailBlock label="FILE / AREA" value={finding.fileArea} />
          <DetailBlock label="EVIDENCE" value={finding.evidence} />
          <View style={[styles.requiredFix, { backgroundColor: "#DBEAFE" }]}><Text style={styles.fixLabel}>REQUIRED FIX</Text><Text style={styles.fixCopy}>{finding.requiredFix}</Text></View>
        </View>
      </View>
    </Modal>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.detailBlock}><Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.85, marginTop: 10 },
  title: { fontSize: 31, fontWeight: "800", letterSpacing: -1.05, marginTop: 4 },
  intro: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 17 },
  filter: { borderRadius: 999, borderWidth: 1, minHeight: 34, paddingHorizontal: 11, paddingVertical: 8 },
  filterText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  row: { borderRadius: 18, borderWidth: 1, marginBottom: 10, padding: 14 },
  rowTop: { alignItems: "center", flexDirection: "row", gap: 6 },
  findingTitle: { fontSize: 15, fontWeight: "800", lineHeight: 21, marginTop: 11, paddingRight: 12 },
  findingSummary: { fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  area: { fontSize: 11, fontWeight: "800", marginTop: 10 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  modalBackdrop: { backgroundColor: "rgba(9, 15, 28, 0.42)", flex: 1, justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, minHeight: "60%", padding: 20, paddingBottom: 36 },
  modalHandle: { alignSelf: "center", backgroundColor: "#CBD5E1", borderRadius: 99, height: 4, marginBottom: 17, width: 38 },
  modalTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  closeButton: { alignItems: "center", borderRadius: 99, height: 36, justifyContent: "center", width: 36 },
  modalTitle: { fontSize: 23, fontWeight: "800", letterSpacing: -0.55, lineHeight: 29, marginTop: 16 },
  detailBlock: { marginTop: 18 },
  detailLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  detailValue: { fontSize: 14, fontWeight: "600", lineHeight: 20, marginTop: 5 },
  requiredFix: { borderRadius: 15, marginTop: 20, padding: 14 },
  fixLabel: { color: "#1D4ED8", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  fixCopy: { color: "#1E3A8A", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 5 },
});
