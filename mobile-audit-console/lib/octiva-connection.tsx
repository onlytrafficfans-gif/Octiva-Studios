import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSystemAudit, normalizeOctivaApiUrl } from "@/lib/octiva-system";

const STORAGE_KEY = "octiva-system-api-url";

interface OctivaConnectionContextValue {
  apiBaseUrl: string;
  isLoaded: boolean;
  saveApiBaseUrl: (value: string) => Promise<void>;
}

const OctivaConnectionContext = createContext<OctivaConnectionContextValue | null>(null);

export function OctivaConnectionProvider({ children }: PropsWithChildren) {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setApiBaseUrl(stored ?? ""))
      .finally(() => setIsLoaded(true));
  }, []);

  const saveApiBaseUrl = useCallback(async (value: string) => {
    const normalized = normalizeOctivaApiUrl(value);
    setApiBaseUrl(normalized);
    if (normalized) {
      await AsyncStorage.setItem(STORAGE_KEY, normalized);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(() => ({ apiBaseUrl, isLoaded, saveApiBaseUrl }), [apiBaseUrl, isLoaded, saveApiBaseUrl]);
  return <OctivaConnectionContext.Provider value={value}>{children}</OctivaConnectionContext.Provider>;
}

export function useOctivaConnection() {
  const context = useContext(OctivaConnectionContext);
  if (!context) throw new Error("useOctivaConnection must be used inside OctivaConnectionProvider.");
  return context;
}

export function useSystemAudit() {
  const { apiBaseUrl, isLoaded } = useOctivaConnection();
  return useQuery({
    queryKey: ["octiva-system-audit", apiBaseUrl],
    queryFn: () => fetchSystemAudit(apiBaseUrl),
    enabled: isLoaded && Boolean(apiBaseUrl),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}
