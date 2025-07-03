"use client"

import { FlaskConical, Download, RotateCcw, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMoleculeStore } from "@/lib/store"
import Image from "next/image"


interface HeaderProps {
  onFetchMolecule: (query: string, mode: string) => void
  onDownload: () => void
}

const sampleMolecules = [
  { name: "Water", formula: "H2O", category: "Simple" },
  { name: "Caffeine", formula: "C8H10N4O2", category: "Biological" },
  { name: "Aspirin", formula: "C9H8O4", category: "Pharmaceutical" },
  { name: "Benzene", formula: "C6H6", category: "Organic" },
  { name: "Glucose", formula: "C6H12O6", category: "Biological" },
  { name: "Ethanol", formula: "C2H6O", category: "Organic" },
  { name: "Morphine", formula: "C17H19NO3", category: "Pharmaceutical" },
  { name: "Methane", formula: "CH4", category: "Simple" },
]

export function Header({ onFetchMolecule, onDownload }: HeaderProps) {
  const { moleculeData, clearMolecule, showLabels, setShowLabels } = useMoleculeStore()

  const handleSampleSelect = (molecule: { name: string; formula: string }) => {
    onFetchMolecule(molecule.name, "name")
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden">
              <Image
                src="/mox_logo.png"
                alt="moleXa logo"
                width={180}
                height={180}
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-light text-gray-900">moleXa</h1>
              <p className="text-sm text-gray-600">3D Molecular Visualization made simple and easy to use</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Star Button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 transition-all duration-150 bg-transparent hover:bg-gray-50"
              asChild
            >
              <a
                href="https://github.com/bazarkua/molexa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">Star on GitHub</span>
                <span className="sm:hidden">Star</span>
              </a>
            </Button>

            {moleculeData && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLabels(!showLabels)}
                  className="gap-2 transition-all duration-150"
                >
                  <RotateCcw className="h-4 w-4" />
                  Labels {showLabels ? "On" : "Off"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="gap-2 transition-all duration-150 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMolecule}
                  className="transition-all duration-150 bg-transparent"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Sample Molecules Navigation */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Access Molecules</p>
          <div className="flex flex-wrap gap-2">
            {sampleMolecules.map((molecule, idx) => (
              <button
                key={idx}
                onClick={() => handleSampleSelect(molecule)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-150 border border-gray-200 hover:border-blue-200"
              >
                <span className="font-medium">{molecule.name}</span>
                <span className="ml-2 text-xs font-mono text-gray-500">{molecule.formula}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
