export type EngineId = "ace" | "levo" | "diff";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ProofState = "VERIFIED" | "DOCUMENTED" | "UNPROVEN" | "UNKNOWN";
export type CapabilityState = "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" | "UNKNOWN";

export interface Engine {
  id: EngineId;
  name: string;
  shortName: string;
  color: string;
  runtimeStatus: "BLOCKED" | "WORKING" | "UNKNOWN";
  docStatus: ProofState;
  upstream: string;
  commit: string;
  license: string;
  hardware: string;
  interface: string;
  proofNote: string;
  capabilityCount: { verified: number; total: number };
}

export interface Capability {
  id: string;
  label: string;
  ace: CapabilityState;
  levo: CapabilityState;
  diff: CapabilityState;
  note: string;
}

export interface AuditArea {
  id: string;
  title: string;
  state: ProofState;
  summary: string;
  findingCount: number;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  area: string;
  fileArea: string;
  evidence: string;
  requiredFix: string;
  status: "OPEN" | "BLOCKED" | "FIXED";
}

export interface FixItem {
  id: string;
  priority: Severity;
  fileArea: string;
  problem: string;
  evidence: string;
  requiredFix: string;
}

export const auditMeta = {
  verdict: "NOT READY" as const,
  auditedCommit: "ae0f256",
  auditDate: "Aug 14, 2026",
  evidenceStandard: "An engine is not working until it produces real playable audio.",
  scope: "Repository evidence and upstream documentation; no target-GPU runtime evidence is present.",
};

export const engines: Engine[] = [
  {
    id: "ace",
    name: "ACE-Step 1.5",
    shortName: "ACE",
    color: "#2563EB",
    runtimeStatus: "BLOCKED",
    docStatus: "VERIFIED",
    upstream: "github.com/ace-step/ACE-Step-1.5",
    commit: "6d467e4",
    license: "MIT code and documented model terms",
    hardware: "CUDA, ROCm, MPS, Intel XPU, CPU documented",
    interface: "Native REST and Gradio documented",
    proofNote: "The adapter exists, but no target-runtime audio artifact has been measured.",
    capabilityCount: { verified: 10, total: 14 },
  },
  {
    id: "levo",
    name: "LeVo 2 / SongGeneration 2",
    shortName: "LeVo",
    color: "#7C3AED",
    runtimeStatus: "BLOCKED",
    docStatus: "DOCUMENTED",
    upstream: "github.com/tencent-ailab/SongGeneration",
    commit: "Capture from target clone",
    license: "Repository and weight terms still require capture",
    hardware: "CUDA 11.8+; 22–28 GB documented for v2-large",
    interface: "Native generate.sh and Gradio documented",
    proofNote: "A command adapter is present; exact license and live GPU execution remain unproven.",
    capabilityCount: { verified: 7, total: 14 },
  },
  {
    id: "diff",
    name: "DiffRhythm 2",
    shortName: "Diff",
    color: "#0F766E",
    runtimeStatus: "BLOCKED",
    docStatus: "DOCUMENTED",
    upstream: "github.com/ASLP-lab/DiffRhythm2",
    commit: "7804f82",
    license: "Apache-2.0 code and weights",
    hardware: "GPU and VRAM requirements are not stated upstream",
    interface: "Native inference script documented; no native UI",
    proofNote: "The adapter exists, but espeak-ng, weights, GPU behavior, and real audio are unproven.",
    capabilityCount: { verified: 4, total: 14 },
  },
];

export const capabilities: Capability[] = [
  { id: "song", label: "Full song", ace: "SUPPORTED", levo: "SUPPORTED", diff: "SUPPORTED", note: "All three upstream projects document full-song creation." },
  { id: "lyrics", label: "Lyrics", ace: "SUPPORTED", levo: "SUPPORTED", diff: "SUPPORTED", note: "Each project documents lyric-driven generation." },
  { id: "instrumental", label: "Instrumental", ace: "SUPPORTED", levo: "SUPPORTED", diff: "UNSUPPORTED", note: "DiffRhythm 2 lists instrumental generation as future work." },
  { id: "reference", label: "Reference audio", ace: "SUPPORTED", levo: "SUPPORTED", diff: "SUPPORTED", note: "LeVo consumes a limited prompt-audio segment; verify adapter handling at runtime." },
  { id: "continue", label: "Continue", ace: "SUPPORTED", levo: "UNKNOWN", diff: "UNSUPPORTED", note: "DiffRhythm 2 lists song extension as future work." },
  { id: "remix", label: "Remix / edit", ace: "SUPPORTED", levo: "UNKNOWN", diff: "UNKNOWN", note: "Do not surface controls without upstream and adapter proof." },
  { id: "duration", label: "Duration", ace: "SUPPORTED", levo: "PARTIAL", diff: "UNKNOWN", note: "LeVo provides model-dependent maximum lengths, not a documented direct duration field." },
  { id: "bpm", label: "BPM", ace: "SUPPORTED", levo: "UNKNOWN", diff: "UNKNOWN", note: "Only ACE documents direct BPM control in current evidence." },
  { id: "key", label: "Key", ace: "SUPPORTED", levo: "UNKNOWN", diff: "UNKNOWN", note: "Only ACE documents direct key control in current evidence." },
  { id: "stems", label: "Stems", ace: "SUPPORTED", levo: "PARTIAL", diff: "UNSUPPORTED", note: "LeVo documents separate vocal/accompaniment output rather than a general stem contract." },
  { id: "lrc", label: "LRC", ace: "PARTIAL", levo: "PARTIAL", diff: "PARTIAL", note: "Lyrics and structure are accepted; exported LRC must be verified per adapter." },
  { id: "style", label: "Style prompt", ace: "SUPPORTED", levo: "SUPPORTED", diff: "SUPPORTED", note: "All adapters must preserve upstream-specific input formats." },
  { id: "api", label: "Native API", ace: "SUPPORTED", levo: "UNSUPPORTED", diff: "UNSUPPORTED", note: "ACE documents a REST path; the others document local command interfaces." },
  { id: "ui", label: "Native UI", ace: "SUPPORTED", levo: "SUPPORTED", diff: "UNSUPPORTED", note: "DiffRhythm 2 lists Gradio support as future work." },
];

export const auditAreas: AuditArea[] = [
  { id: "runtime", title: "Runtime acceptance", state: "UNPROVEN", summary: "No real, non-empty playable audio artifact is measured for any engine.", findingCount: 3 },
  { id: "router", title: "AUTO routing", state: "DOCUMENTED", summary: "Repository logic refuses non-ready engines; live readiness is not proven.", findingCount: 1 },
  { id: "projects", title: "Project system", state: "DOCUMENTED", summary: "Immutable generation IDs and directories are present in the claimed fix path.", findingCount: 1 },
  { id: "security", title: "Security", state: "DOCUMENTED", summary: "Audio serving is constrained by recorded project data; threat model still needs test evidence.", findingCount: 2 },
  { id: "hardware", title: "Hardware feasibility", state: "UNPROVEN", summary: "Target GPU, driver, CUDA, RAM, and VRAM evidence have not been captured.", findingCount: 2 },
  { id: "license", title: "License & commercial use", state: "UNPROVEN", summary: "LeVo repository and checkpoint terms require direct capture before product conclusions.", findingCount: 1 },
  { id: "ux", title: "Dashboard UX", state: "UNKNOWN", summary: "Production workflow needs device-level usability and blocked-state validation.", findingCount: 1 },
  { id: "tests", title: "Test coverage", state: "DOCUMENTED", summary: "Repository tests cover logic; GPU runtime and artifact acceptance are still outstanding.", findingCount: 2 },
];

export const findings: Finding[] = [
  {
    id: "f-runtime-gate",
    severity: "CRITICAL",
    title: "No engine has passed the playable-audio acceptance gate",
    area: "Runtime acceptance",
    fileArea: "docs/ENGINE_TEST_RESULTS.md · scripts/runtime-acceptance.ps1",
    evidence: "The repository marks ACE-Step, LeVo, and DiffRhythm as BLOCKED and records no measured output path, byte size, decode result, or playback result.",
    requiredFix: "Run each engine on its target hardware through Octiva; retain command, commit, checkpoint, settings, output hash, byte size, decode proof, and playback result before setting WORKING.",
    status: "BLOCKED",
  },
  {
    id: "f-levo-license",
    severity: "HIGH",
    title: "LeVo commercial-use posture is unresolved",
    area: "License & commercial use",
    fileArea: "docs/ENGINE_MATRIX.md · LeVo target clone and model card",
    evidence: "Repository evidence explicitly defers the LeVo source license and v2 checkpoint terms until they are captured from an actual clone and official weight source.",
    requiredFix: "Capture exact repository LICENSE text, checkpoint license metadata, output-use terms, and attribution obligations; complete legal review before commercial distribution.",
    status: "OPEN",
  },
  {
    id: "f-hardware-proof",
    severity: "HIGH",
    title: "Hardware feasibility is not supported by target-runtime measurements",
    area: "Hardware feasibility",
    fileArea: "docs/ENGINE_MATRIX.md · target GPU evidence",
    evidence: "DiffRhythm 2 does not publish VRAM guidance, while Octiva has no measured target-machine compatibility or performance record for any engine.",
    requiredFix: "Record GPU model, driver, OS, backend, VRAM, RAM, installation outcome, generation time, and peak allocation for every engine/configuration pair.",
    status: "BLOCKED",
  },
  {
    id: "f-router-live",
    severity: "MEDIUM",
    title: "AUTO routing lacks live multi-engine acceptance evidence",
    area: "AUTO routing",
    fileArea: "octiva_api/router.py · tests",
    evidence: "The repository documents readiness guards, but no test result demonstrates behavior with actual online, offline, and capability-mismatched engines.",
    requiredFix: "Add deterministic router matrices plus hardware-backed tests that prove ready selection, zero-ready failure, unsupported-request refusal, and fallback behavior.",
    status: "OPEN",
  },
  {
    id: "f-threat-model",
    severity: "MEDIUM",
    title: "File-serving safety is not proven across deployment threat models",
    area: "Security",
    fileArea: "octiva_api · generation audio serving tests",
    evidence: "The self-audit describes project-bound immutable audio lookup, but independent local-single-user and network/multi-user test evidence is absent.",
    requiredFix: "Test traversal, cross-project access, malformed IDs, stale files, symlink escapes, concurrent deletion, and CORS/network exposure for both stated threat models.",
    status: "OPEN",
  },
];

export const fixQueue: FixItem[] = findings.map((finding) => ({
  id: finding.id,
  priority: finding.severity,
  fileArea: finding.fileArea,
  problem: finding.title,
  evidence: finding.evidence,
  requiredFix: finding.requiredFix,
}));

export const references = [
  { label: "Octiva source snapshot", url: "https://github.com/onlytrafficfans-gif/Octiva-Studios" },
  { label: "ACE-Step 1.5 upstream", url: "https://github.com/ace-step/ACE-Step-1.5" },
  { label: "SongGeneration upstream", url: "https://github.com/tencent-ailab/SongGeneration" },
  { label: "DiffRhythm 2 upstream", url: "https://github.com/ASLP-lab/DiffRhythm2" },
];
