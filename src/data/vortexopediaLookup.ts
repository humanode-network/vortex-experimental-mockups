import { useMemo } from "react";
import { vortexopediaTerms, VortexopediaTerm } from "@/data/vortexopedia";

const termMap = new Map<string, VortexopediaTerm>(
  vortexopediaTerms.map((t) => [t.id, t]),
);

export const getVortexopediaTerm = (id: string): VortexopediaTerm | undefined =>
  termMap.get(id);

export const hasVortexopediaTerm = (id: string): boolean => termMap.has(id);

export const useVortexopediaTerm = (id: string): VortexopediaTerm | undefined =>
  useMemo(() => termMap.get(id), [id]);
