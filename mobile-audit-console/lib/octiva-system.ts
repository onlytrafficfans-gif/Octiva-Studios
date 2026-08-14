export type EngineState = "READY" | "LOADING" | "GENERATING" | "OFFLINE" | "MISSING_MODEL" | "MISSING_DEPENDENCY" | "INSUFFICIENT_VRAM" | "UNSUPPORTED_HARDWARE" | "BLOCKED";
export type EvidenceState = "VERIFIED" | "BLOCKED" | "UNPROVEN";
export type Verdict = "RUNTIME_READY" | "NOT_READY";

export interface EngineCapabilities {
  generate_song: boolean;
  generate_instrumental: boolean;
  continue_song: boolean;
  remix_song: boolean;
  edit_section: boolean;
  reference_audio: boolean;
  bpm: boolean;
  key: boolean;
  duration: boolean;
  lyrics: boolean;
  stems: boolean;
  lrc: boolean;
}

export interface RuntimeEvidence {
  state: EvidenceState;
  reported_at?: string | null;
  generation_id?: string;
  bytes?: number;
  elapsed_seconds?: number;
}

export interface LiveEngine {
  id: string;
  name: string;
  state: EngineState;
  version?: string | null;
  checkpoint?: string | null;
  backend?: string | null;
  vram_requirement?: string | null;
  capabilities: EngineCapabilities;
  blocker?: string | null;
  runtime_evidence: RuntimeEvidence;
}

export interface LiveFinding {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  area: string;
  title: string;
  evidence: string;
  required_fix: string;
}

export interface SystemAudit {
  schema_version: string;
  generated_at: string;
  verdict: Verdict;
  build: { state: "AVAILABLE" | "UNAVAILABLE"; commit: string | null };
  runtime: {
    acceptance_report: "AVAILABLE" | "UNAVAILABLE";
    active_generation: { state: "AVAILABLE" | "UNAVAILABLE"; reason?: string | null };
  };
  summary: {
    engine_count: number;
    ready_engine_count: number;
    verified_runtime_count: number;
    project_count: number;
    generation_count: number;
  };
  engines: LiveEngine[];
  findings: LiveFinding[];
}

export class OctivaApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "OctivaApiError";
  }
}

export function normalizeOctivaApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function isValidOctivaApiUrl(value: string): boolean {
  try {
    const url = new URL(normalizeOctivaApiUrl(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function fetchSystemAudit(apiBaseUrl: string): Promise<SystemAudit> {
  const baseUrl = normalizeOctivaApiUrl(apiBaseUrl);
  if (!isValidOctivaApiUrl(baseUrl)) {
    throw new OctivaApiError("Enter a complete Octiva API URL, including https:// or http://.");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/system/audit`);
  } catch {
    throw new OctivaApiError("Could not reach the configured Octiva API. Check the URL, network path, and server availability.");
  }

  if (!response.ok) {
    throw new OctivaApiError(`Octiva returned ${response.status} while loading System / Audit.`, response.status);
  }

  const payload = await response.json();
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.engines) || !payload.summary) {
    throw new OctivaApiError("The Octiva API returned an unsupported System / Audit response.");
  }
  return payload as SystemAudit;
}

const capabilityLabels: Partial<Record<keyof EngineCapabilities, string>> = {
  generate_song: "Full song",
  generate_instrumental: "Instrumental",
  continue_song: "Continue",
  remix_song: "Remix",
  edit_section: "Section edit",
  reference_audio: "Reference audio",
  bpm: "BPM",
  key: "Key",
  duration: "Duration",
  lyrics: "Lyrics",
  stems: "Stems",
  lrc: "LRC",
};

export function supportedCapabilities(capabilities: EngineCapabilities): string[] {
  return (Object.keys(capabilityLabels) as Array<keyof EngineCapabilities>)
    .filter((key) => capabilities[key])
    .map((key) => capabilityLabels[key] ?? key);
}

export function engineColor(engineId: string): string {
  if (engineId.includes("ace")) return "#2563EB";
  if (engineId.includes("levo")) return "#7C3AED";
  return "#0F766E";
}
