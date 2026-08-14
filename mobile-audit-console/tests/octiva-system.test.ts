import { describe, expect, it } from "vitest";

import { isValidOctivaApiUrl, normalizeOctivaApiUrl, supportedCapabilities } from "../lib/octiva-system";

describe("Octiva live System / Audit client", () => {
  it("normalizes an API base URL without rewriting its host or protocol", () => {
    expect(normalizeOctivaApiUrl(" https://octiva.example/api/ ")).toBe("https://octiva.example/api");
    expect(isValidOctivaApiUrl("https://octiva.example")).toBe(true);
    expect(isValidOctivaApiUrl("octiva.example")).toBe(false);
  });

  it("derives the visible capability list only from live boolean capability flags", () => {
    expect(supportedCapabilities({
      generate_song: true,
      generate_instrumental: false,
      continue_song: false,
      remix_song: false,
      edit_section: false,
      reference_audio: true,
      bpm: false,
      key: true,
      duration: false,
      lyrics: true,
      stems: false,
      lrc: false,
    })).toEqual(["Full song", "Reference audio", "Key", "Lyrics"]);
  });
});
