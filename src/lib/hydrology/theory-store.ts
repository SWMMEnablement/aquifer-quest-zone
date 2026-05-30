// Client-side overrides for the ModuleTheory registry.
// Lets admins edit equations, assumptions, parameter ranges, references, and worked examples
// at runtime without redeploying. Overrides are stored in localStorage and merged on top of
// the compiled-in MODULE_THEORY map.

import { MODULE_THEORY, type ModuleTheory } from "./theory";

const STORAGE_KEY = "ponce-lab:theory-overrides:v1";

export type TheoryOverrides = Record<string, ModuleTheory>;

const safeParse = (raw: string | null): TheoryOverrides => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as TheoryOverrides) : {};
  } catch {
    return {};
  }
};

export const loadOverrides = (): TheoryOverrides => {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
};

const persist = (overrides: TheoryOverrides) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent("theory-overrides-changed"));
};

export const saveOverride = (slug: string, theory: ModuleTheory) => {
  const all = loadOverrides();
  all[slug] = theory;
  persist(all);
};

export const clearOverride = (slug: string) => {
  const all = loadOverrides();
  delete all[slug];
  persist(all);
};

export const clearAllOverrides = () => persist({});

export const exportOverrides = (): string => JSON.stringify(loadOverrides(), null, 2);

export const importOverrides = (json: string): { ok: boolean; error?: string; count?: number } => {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return { ok: false, error: "Root must be an object" };
    persist(parsed as TheoryOverrides);
    return { ok: true, count: Object.keys(parsed).length };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
};

/** Merged view: built-in registry overlaid with any localStorage overrides. */
export const getMergedTheory = (slug: string | undefined): ModuleTheory | null => {
  if (!slug) return null;
  const overrides = loadOverrides();
  return overrides[slug] ?? MODULE_THEORY[slug] ?? null;
};

export const listAllSlugs = (): string[] => {
  const overrides = loadOverrides();
  return Array.from(new Set([...Object.keys(MODULE_THEORY), ...Object.keys(overrides)])).sort();
};

export const isOverridden = (slug: string): boolean => slug in loadOverrides();
