/**
 * Generic Supabase fetch wrapper with mock fallback.
 * Returns the data plus a `mode` flag so the UI can show Live vs Demo state.
 */
export type DataMode = "live" | "mock";

export async function fetchWithFallback<T>(
  fetcher: () => Promise<T>,
  mock: T,
): Promise<{ data: T; mode: DataMode }> {
  try {
    const data = await fetcher();
    if (data == null) return { data: mock, mode: "mock" };
    if (Array.isArray(data) && data.length === 0) return { data: mock, mode: "mock" };
    return { data, mode: "live" };
  } catch (err) {
    console.warn("[data-source] Falling back to mock:", err);
    return { data: mock, mode: "mock" };
  }
}

import { createContext, useContext } from "react";

interface DataModeCtx {
  mode: DataMode;
  setMode: (m: DataMode) => void;
}

export const DataModeContext = createContext<DataModeCtx>({
  mode: "live",
  setMode: () => {},
});

export const useDataMode = () => useContext(DataModeContext);