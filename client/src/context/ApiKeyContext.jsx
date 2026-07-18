import { createContext, useContext, useState } from "react";

const ApiKeyContext = createContext(null);

export function ApiKeyProvider({ children }) {
  // Deliberately React state only — never localStorage/sessionStorage.
  // Clears on refresh, which is the right tradeoff for a visitor-typed key:
  // no persistence footprint, nothing to accidentally leave behind.
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("gemini");

  const value = {
    apiKey,
    setApiKey,
    provider,
    setProvider,
    hasKey: apiKey.trim().length > 0,
  };

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within an ApiKeyProvider");
  return ctx;
}
