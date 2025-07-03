import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RawMoleculeData, MoleculeData, BondType } from './types';

/**
 * Shorthand for combining Tailwind classes with clsx + tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type guard to ensure bond types are one of the allowed literals
 */
export function isBondType(s: string): s is BondType {
  return s === 'single' || s === 'double' || s === 'triple';
}

/**
 * Normalize raw molecule data (with string bond types) into strict MoleculeData
 */
export function normalizeMolecule(raw: RawMoleculeData): MoleculeData {
  return {
    ...raw,
    bonds: raw.bonds.map((bond) => ({
      atom1: bond.atom1,
      atom2: bond.atom2,
      type: isBondType(bond.type) ? bond.type : 'single',
    })),
  };
}
