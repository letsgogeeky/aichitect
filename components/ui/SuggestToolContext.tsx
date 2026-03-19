"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import SuggestToolModal from "./SuggestToolModal";

interface SuggestToolContextValue {
  openSuggest: (prefillName?: string) => void;
}

const SuggestToolContext = createContext<SuggestToolContextValue>({
  openSuggest: () => {},
});

export function useSuggestTool() {
  return useContext(SuggestToolContext);
}

export function SuggestToolProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  const openSuggest = useCallback((name = "") => {
    setPrefill(name);
    setOpen(true);
  }, []);

  return (
    <SuggestToolContext.Provider value={{ openSuggest }}>
      {children}
      {open && <SuggestToolModal prefillName={prefill} onClose={() => setOpen(false)} />}
    </SuggestToolContext.Provider>
  );
}
