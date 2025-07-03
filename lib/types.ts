// src/lib/types.ts
export type BondType = "single" | "double" | "triple";

export interface BondData {
  atom1: string;
  atom2: string;
  type: BondType;
}

export interface AtomData {
  id: string;
  element: string;
  position: [number, number, number];
}

export interface MoleculeData {
  formula: string;
  elements: Record<string, { radius: number; color: string }>;
  atoms: AtomData[];
  bonds: BondData[];
}

// Raw version coming from your fetch or PubChem API:
export interface RawMoleculeData {
  formula: string;
  elements: Record<string, { radius: number; color: string }>;
  atoms: AtomData[];
  bonds: Array<{ atom1: string; atom2: string; type: string }>;
}
