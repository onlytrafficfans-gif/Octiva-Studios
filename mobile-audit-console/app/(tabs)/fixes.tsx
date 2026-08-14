import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { SeverityPill, StatusPill } from "@/components/audit-ui";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { fixQueue, type FixItem } from "@/lib/audit-data";

export default function FixesScreen() {
  const colors = useColors();
  const [activeFix, setActiveFix] = useState<FixItem | null>(null);
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <FlatList
        data={fixQueue}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<View><Text style={[styles.kicker, { color: colors.muted }]}>ENGINEER HANDOFF</Text><Text style={[styles.title, { color: colors.text }]}>Fix queue</Text><Text style={[styles.intro, { color: colors.muted }]}>One deliverable per row: a reproducible problem statement, source evidence, and a specific remediation requirement.</Text><View style={[styles.callout, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="checkmark.seal.fill" color={colors.tint} size={19} /><Text style={[styles.calloutCopy, { color: colors.text }]}>Use this view to hand off work without converting open assumptions into completed claims.</Text></View></View>}
        renderItem={({ item, index }) => <Pressable accessibilityLabel={`Open fix ${index + 1}: ${item.problem}`} onPress={() => setActiveFix(item)} style={({ pressed }) => [styles.fixRow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={styles.rowStart}><Text style={[styles.rowNumber, { color: colors.muted }]}>{String(index + 1).padStart(2, "0")}</Text><View style={styles.rowCopy}><SeverityPill severity={item.priority} /><Text style={[styles.problem, { color: colors.text }]}>{item.problem}</Text><Text numberOfLines={1} style={[styles.fileArea, { color: colors.muted }]}>{item.fileArea}</Text></View></View><IconSymbol name="chevron.right" color={colors.muted} size={20} /></Pressable>}
      />
      <FixDetail fix={activeFix} close={() => setActiveFix(null)} />
    </ScreenContainer>
  );
}

function FixDetail({ fix, close }: { fix: FixItem | null; close: () => void }) {
  const colors = useColors();
  if (!fix) return null;
  return <Modal animationType="slide" transparent visible onRequestClose={close}><View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: colors.background }]}><View style={styles.modalHandle} /><View style={styles.modalTop}><StatusPill label="REMEDIATION" tone="info" /><Pressable accessibilityLabel="Close fix detail" onPress={close} style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}><IconSymbol name="xmark" size={18} color={colors.text} /></Pressable></View><Text style={[styles.modalTitle, { color: colors.text }]}>{fix.problem}</Text><Text style={[styles.label, { color: colors.muted }]}>PRIORITY</Text><SeverityPill severity={fix.priority} /><Text style={[styles.label, { color: colors.muted }]}>FILE / AREA</Text><Text style={[styles.value, { color: colors.text }]}>{fix.fileArea}</Text><Text style={[styles.label, { color: colors.muted }]}>EVIDENCE</Text><Text style={[styles.value, { color: colors.text }]}>{fix.evidence}</Text><View style={styles.fixBlock}><Text style={styles.fixLabel}>REQUIRED FIX</Text><Text style={styles.fixValue}>{fix.requiredFix}</Text></View></View></View></Modal>;
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 104 },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 0.85, marginTop: 10 },
  title: { fontSize: 31, fontWeight: "800", letterSpacing: -1.05, marginTop: 4 },
  intro: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  callout: { alignItems: "flex-start", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 20, marginTop: 17, padding: 14 },
  calloutCopy: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  fixRow: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 10, padding: 14 },
  rowStart: { flex: 1, flexDirection: "row" },
  rowNumber: { fontSize: 11, fontWeight: "900", letterSpacing: 0.7, marginRight: 12, paddingTop: 3 },
  rowCopy: { flex: 1 },
  problem: { fontSize: 15, fontWeight: "800", lineHeight: 20, marginTop: 7, paddingRight: 7 },
  fileArea: { fontSize: 11, fontWeight: "600", marginTop: 5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  modalBackdrop: { backgroundColor: "rgba(9, 15, 28, 0.42)", flex: 1, justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, minHeight: "66%", padding: 20, paddingBottom: 36 },
  modalHandle: { alignSelf: "center", backgroundColor: "#CBD5E1", borderRadius: 99, height: 4, marginBottom: 17, width: 38 },
  modalTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  closeButton: { alignItems: "center", borderRadius: 99, height: 36, justifyContent: "center", width: 36 },
  modalTitle: { fontSize: 23, fontWeight: "800", letterSpacing: -0.55, lineHeight: 29, marginBottom: 18, marginTop: 16 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7, marginTop: 15, marginBottom: 5 },
  value: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  fixBlock: { backgroundColor: "#DBEAFE", borderRadius: 15, marginTop: 19, padding: 14 },
  fixLabel: { color: "#1D4ED8", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  fixValue: { color: "#1E3A8A", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 5 },
});
