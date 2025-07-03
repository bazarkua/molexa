"use client"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { Canvas3D } from "@/components/canvas-3d"
import { Footer } from "@/components/footer"
import { DownloadModal } from "@/components/download-modal"
import { EnhancedSearch } from "@/components/enhanced-search"
import { MolecularInfoPanel } from "@/components/molecular-info-panel"
import { useMoleculeStore } from "@/lib/store"
import { searchMolecules, fetchStructureData, fetchEducationalData } from "@/lib/api"
import { toast } from "sonner"
import { FlaskConical } from "lucide-react"

export default function MoleXa() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const canvasRef = useRef<any>(null)

  // Backend URL configuration
  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://molexa.org' 
    : 'http://localhost:3001';

  const {
    moleculeData,
    loading,
    error,
    generationStep,
    generationProgress,
    setMoleculeData,
    setLoading,
    setError,
    setGenerationStep,
    setGenerationProgress,
    clearMolecule,
  } = useMoleculeStore()

  // Enhanced SDF parsing with better 2D to 3D conversion
  const parseSDF2DTo3D = (sdfData: string, formula: string) => {
    const lines = sdfData.split("\n")
    const countsLine = lines[3]
    const atomCount = Number.parseInt(countsLine.substring(0, 3))
    const bondCount = Number.parseInt(countsLine.substring(3, 6))

    const elementColors = {
      H: "#FFFFFF", C: "#303030", N: "#3050F8", O: "#FF0D0D", S: "#FFFF30",
      P: "#FF8000", F: "#90E050", Cl: "#1FF01F", Br: "#A62929", I: "#940094",
      B: "#FFB5B5", Si: "#F0C8A0", Al: "#BFA6A6", Ca: "#3DFF00", Fe: "#E06633",
      Zn: "#7D80B0", Mg: "#8AFF00", Na: "#AB5CF2", K: "#8F40D4"
    }

    const elementRadii = {
      H: 0.3, C: 0.5, N: 0.45, O: 0.4, S: 0.6, P: 0.55, F: 0.35,
      Cl: 0.5, Br: 0.6, I: 0.7, B: 0.4, Si: 0.6, Al: 0.5,
      Ca: 0.8, Fe: 0.6, Zn: 0.6, Mg: 0.7, Na: 0.9, K: 1.0
    }

    // Parse atoms
    const atoms: any[] = []
    const elements: any = {}
    const elementCounts: any = {}

    for (let i = 0; i < atomCount; i++) {
      const atomLine = lines[4 + i]
      const x = Number.parseFloat(atomLine.substring(0, 10).trim())
      const y = Number.parseFloat(atomLine.substring(10, 20).trim())
      const z = Number.parseFloat(atomLine.substring(20, 30).trim()) || 0
      const element = atomLine.substring(31, 34).trim()

      const count = elementCounts[element] || 0
      elementCounts[element] = count + 1

      const atomId = `${element}-${count + 1}`

      atoms.push({
        id: atomId,
        element: element,
        position: [x, y, z],
        originalIndex: i
      })

      if (!elements[element]) {
        elements[element] = {
          radius: elementRadii[element as keyof typeof elementRadii] || 0.4,
          color: elementColors[element as keyof typeof elementColors] || "#808080",
        }
      }
    }

    // Parse bonds
    const bonds: any[] = []
    const connectivity: Map<number, number[]> = new Map()
    const bondStartLine = 4 + atomCount

    for (let i = 0; i < atomCount; i++) {
      connectivity.set(i, [])
    }

    for (let i = 0; i < bondCount; i++) {
  const bondLine = lines[bondStartLine + i]
  if (!bondLine || bondLine.length < 9) continue

  const atom1Index = Number.parseInt(bondLine.substring(0, 3).trim()) - 1
  const atom2Index = Number.parseInt(bondLine.substring(3, 6).trim()) - 1
  const bondTypeNum = Number.parseInt(bondLine.substring(6, 9).trim())

  // Helper function to ensure proper typing
  const getBondType = (typeNum: number): "single" | "double" | "triple" => {
    switch (typeNum) {
      case 2: return "double"
      case 3: return "triple"
      default: return "single"
    }
  }

  let bondType: "single" | "double" | "triple" = "single"
  if (bondTypeNum === 2) bondType = "double"
  else if (bondTypeNum === 3) bondType = "triple"

  if (atom1Index >= 0 && atom1Index < atoms.length && atom2Index >= 0 && atom2Index < atoms.length) {
    bonds.push({
      atom1: atoms[atom1Index].id,
      atom2: atoms[atom2Index].id,
      type: bondType,
    })

    connectivity.get(atom1Index)?.push(atom2Index)
    connectivity.get(atom2Index)?.push(atom1Index)
  }
}

    // Enhanced 2D to 3D conversion
    const maxZ = Math.max(...atoms.map(atom => Math.abs(atom.position[2])))
    const is2D = maxZ < 0.1

    if (is2D) {
      console.log('Applying enhanced 2D to 3D conversion...')
      
      atoms.forEach((atom, index) => {
        const [x, y] = atom.position
        let z = 0

        const connectedIndices = connectivity.get(index) || []
        const neighbors = connectedIndices.map(i => atoms[i])

        // Apply geometry rules based on hybridization and molecular context
        if (atom.element === 'C') {
          if (neighbors.length === 4) {
            // Tetrahedral geometry with proper angles
            z = (Math.sin(x * 2.1) * Math.cos(y * 1.7)) * 1.2 + (Math.random() - 0.5) * 0.3
          } else if (neighbors.length === 3) {
            // Trigonal planar with slight pyramidalization
            z = Math.sin(x * 1.5 + y * 1.5) * 0.4
          } else if (neighbors.length === 2) {
            // Linear or bent
            z = (index % 2 === 0 ? 0.3 : -0.3) + Math.sin(x + y) * 0.2
          }
        } else if (atom.element === 'N') {
          if (neighbors.length === 3) {
            // Trigonal pyramidal
            z = Math.sin(x * 1.8 + y * 1.3) * 0.8 + 0.3
          } else if (neighbors.length === 2) {
            z = Math.cos(x * 1.4 + y * 2.1) * 0.5
          }
        } else if (atom.element === 'O') {
          if (neighbors.length === 2) {
            // Bent geometry like water
            z = Math.sin(x * 2.3 + y * 1.9) * 0.6
          } else if (neighbors.length === 1) {
            z = Math.cos(x * 1.6 + y * 2.4) * 0.8
          }
        } else if (atom.element === 'H') {
          // Hydrogen follows its bonded atom with offset
          if (neighbors.length === 1) {
            const partner = neighbors[0]
            const partnerZ = partner.position[2] || 0
            z = partnerZ + (Math.random() - 0.5) * 0.8
          }
        } else {
          // Other elements
          z = Math.sin(x * 1.7 + y * 1.4) * 0.6 + (Math.random() - 0.5) * 0.4
        }

        // Add conformational flexibility for rings
        if (neighbors.length >= 2) {
          const ringStrain = Math.sin(index * 0.9) * 0.3
          z += ringStrain
        }

        atom.position[2] = z * 1.4 // Enhanced scaling
      })
    }

    // Apply scaling for better visualization
    const scaleFactor = 1.6
    atoms.forEach(atom => {
      atom.position = atom.position.map((coord: number) => coord * scaleFactor)
      delete atom.originalIndex
    })

    return { formula, elements, atoms, bonds }
  }

  // Enhanced molecule fetching with better error handling and educational data
  const fetchMoleculeData = async (query: string, mode = "name") => {
    setLoading(true)
    setError("")
    setGenerationStep("")
    setGenerationProgress(0)

    try {
      // Step 1: Search for compounds
      setGenerationStep("Searching PubChem database...")
      setGenerationProgress(15)
      
      const searchType = mode === "formula" ? "formula" : "name"
      const cids = await searchMolecules(query, searchType as any)
      
      if (cids.length === 0) {
        throw new Error(`No compounds found for ${mode}: "${query}"`)
      }

      console.log(`Found ${cids.length} compounds:`, cids.slice(0, 5))

      // Step 2: Try to get educational data first (includes enhanced info)
      setGenerationStep("Fetching comprehensive molecular data...")
      setGenerationProgress(35)

      let selectedCID = cids[0]
      let educationalData = null
      
      try {
        educationalData = await fetchEducationalData(query, searchType as any)
        selectedCID = educationalData.cid || cids[0]
        console.log(`Got educational data for CID: ${selectedCID}`)
      } catch (error) {
        console.log('Educational data not available, using basic structure data')
      }

      // Step 3: Get 3D structure
      setGenerationStep("Downloading 3D molecular structure...")
      setGenerationProgress(55)

      const sdfData = await fetchStructureData(selectedCID)
      
      if (sdfData.length < 200 || !sdfData.includes('END')) {
        throw new Error(`Invalid structure data received for CID ${selectedCID}`)
      }

      // Step 4: Parse structure
      setGenerationStep("Converting to 3D model...")
      setGenerationProgress(75)

      // Get the actual molecular formula from the educational data or fetch it separately
      let actualFormula = educationalData?.basic_properties?.MolecularFormula
      
      if (!actualFormula) {
        try {
          // If we don't have the formula from educational data, fetch it directly
          setGenerationStep("Fetching molecular formula...")
          const formulaResponse = await fetch(`${BACKEND_URL}/api/pubchem/compound/cid/${selectedCID}/property/MolecularFormula/JSON`)
          if (formulaResponse.ok) {
            const formulaData = await formulaResponse.json()
            actualFormula = formulaData.PropertyTable?.Properties?.[0]?.MolecularFormula
          }
        } catch (error) {
          console.log('Could not fetch molecular formula, using search term')
        }
      }
      
      const formula = actualFormula || query
      const molecularData = parseSDF2DTo3D(sdfData, formula)
      
      if (!molecularData.atoms || molecularData.atoms.length === 0) {
        throw new Error('No atoms found in molecular structure')
      }

      // Step 5: Enhance with educational data
      setGenerationStep("Enhancing with educational information...")
      setGenerationProgress(90)

      // Add CID and educational context to molecular data
      const enhancedMolecularData = {
        ...molecularData,
        cid: selectedCID,
        educationalData: educationalData,
        searchQuery: query,
        searchMode: mode
      }

      setGenerationStep("Rendering 3D visualization...")
      setGenerationProgress(100)

      setMoleculeData(enhancedMolecularData)
      
      const atomCount = enhancedMolecularData.atoms.length
      const bondCount = enhancedMolecularData.bonds.length
      
      toast.success(
        `Successfully loaded ${formula}! ` +
        `(CID: ${selectedCID}, ${atomCount} atoms, ${bondCount} bonds)`
      )

      console.log(`✅ Molecule loaded: ${formula}, CID: ${selectedCID}`)

    } catch (error: any) {
      console.error("Enhanced fetch error:", error)
      setError(`Failed to load molecule: ${error.message}`)
      toast.error(error.message || "Failed to load molecule")
    } finally {
      setLoading(false)
      setGenerationStep("")
      setGenerationProgress(0)
    }
  }

  const handleDownload = () => {
    if (!moleculeData) {
      toast.error("No molecule to download")
      return
    }
    setDownloadModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header onFetchMolecule={fetchMoleculeData} onDownload={handleDownload} />

      <main className="relative">
        {/* Main visualization area */}
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* 3D Canvas - Full width */}
          <div className="w-full">
            <div className="h-[70vh] relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <Canvas3D ref={canvasRef} />

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Processing Molecular Data</h3>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Step {Math.ceil(generationProgress / 20)}/5</span>
                      </p>

                      <p className="text-gray-700">{generationStep || "Initializing..."}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Molecular Information Panel - Full width below canvas */}
          {moleculeData ? (
            <MolecularInfoPanel 
              moleculeData={moleculeData}
              className="w-full"
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FlaskConical className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">No Molecule Selected</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Search for a molecule below to see detailed information including properties, 
                safety data, and educational context.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Search Section */}
        <section className="bg-white border-t border-gray-200 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-gray-900 mb-4">Explore Molecular Structures</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Search by molecule name to get smart suggestions, or use exact chemical formulas. 
                Enhanced with educational information from PubChem database.
              </p>
            </div>

            <EnhancedSearch 
              onFetchMolecule={fetchMoleculeData}
              className="mb-8"
            />

            {/* Quick examples */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Try these examples:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { name: "Morphine", type: "name" },
                  { name: "C2H6O", type: "formula" },
                  { name: "Caffeine", type: "name" },
                  { name: "Aspirin", type: "name" }
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => fetchMoleculeData(example.name, example.type)}
                    className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors"
                    disabled={loading}
                  >
                    {example.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <DownloadModal
        open={downloadModalOpen}
        onOpenChange={setDownloadModalOpen}
        canvasRef={canvasRef}
        moleculeData={moleculeData}
      />
    </div>
  )
}