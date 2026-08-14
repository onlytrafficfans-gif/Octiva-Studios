import { describe, expect, it } from "vitest";

import { auditAreas, capabilities, engines, findings } from "../lib/audit-data";

describe("Octiva audit data", () => {
  it("keeps each audit engine explicitly blocked until runtime proof exists", () => {
    expect(engines).toHaveLength(3);
    expect(engines.every((engine) => engine.runtimeStatus === "BLOCKED")).toBe(true);
  });

  it("does not overstate unsupported future work as a supported capability", () => {
    const diffInstrumental = capabilities.find((capability) => capability.id === "instrumental");
    const diffContinuation = capabilities.find((capability) => capability.id === "continue");

    expect(diffInstrumental?.diff).toBe("UNSUPPORTED");
    expect(diffContinuation?.diff).toBe("UNSUPPORTED");
  });

  it("retains a critical unresolved runtime acceptance finding", () => {
    expect(findings.some((finding) => finding.severity === "CRITICAL" && finding.status === "BLOCKED")).toBe(true);
    expect(auditAreas.find((area) => area.id === "runtime")?.state).toBe("UNPROVEN");
  });
});
