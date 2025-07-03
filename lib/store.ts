import { create } from "zustand"

interface MoleculeData {
  formula: string
  elements: Record<string, { radius: number; color: string }>
  atoms: Array<{
    id: string
    element: string
    position: [number, number, number]
  }>
  bonds: Array<{
    atom1: string
    atom2: string
    type: "single" | "double" | "triple"  // FIX: Changed from 'string' to literal union
  }>
}

interface MoleculeStore {
  moleculeData: MoleculeData | null
  loading: boolean
  error: string
  generationStep: string
  generationProgress: number
  showLabels: boolean
  

  setMoleculeData: (data: MoleculeData | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  setGenerationStep: (step: string) => void
  setGenerationProgress: (progress: number) => void
  setShowLabels: (show: boolean) => void
  clearMolecule: () => void
}

export const useMoleculeStore = create<MoleculeStore>((set) => ({
  moleculeData: null,
  loading: false,
  error: "",
  generationStep: "",
  generationProgress: 0,
  showLabels: true,

  setMoleculeData: (data) => set({ moleculeData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setGenerationStep: (step) => set({ generationStep: step }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setShowLabels: (show) => set({ showLabels: show }),
  clearMolecule: () =>
    set({
      moleculeData: null,
      error: "",
      generationStep: "",
      generationProgress: 0,
    }),
}))