"use client"

import type React from "react"

import { useState } from "react"
import { Search, Beaker } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchSectionProps {
  onFetchMolecule: (query: string, mode: string) => void
}

export function SearchSection({ onFetchMolecule }: SearchSectionProps) {
  const [searchMode, setSearchMode] = useState<"name" | "formula">("name")
  const [moleculeName, setMoleculeName] = useState("")
  const [moleculeFormula, setMoleculeFormula] = useState("")

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const query = searchMode === "name" ? moleculeName.trim() : moleculeFormula.trim()
    if (query) {
      onFetchMolecule(query, searchMode)
    }
  }

  return (
    <section className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-900 mb-3">Search Molecules</h2>
          <p className="text-gray-600">Search by molecule name or chemical formula to explore 3D structures</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as "name" | "formula")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="name" className="gap-2">
                <Search className="h-4 w-4" />
                Name Search
              </TabsTrigger>
              <TabsTrigger value="formula" className="gap-2">
                <Beaker className="h-4 w-4" />
                Formula Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="name">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <Input
                  value={moleculeName}
                  onChange={(e) => setMoleculeName(e.target.value)}
                  placeholder="Enter molecule name (e.g., aspirin, caffeine, glucose)"
                  className="flex-1 h-12 text-lg"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="px-8 bg-blue-600 hover:bg-blue-700"
                  disabled={!moleculeName.trim()}
                >
                  Visualize
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="formula">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <Input
                  value={moleculeFormula}
                  onChange={(e) => setMoleculeFormula(e.target.value)}
                  placeholder="Enter molecular formula (e.g., C9H8O4, C6H12O6)"
                  className="flex-1 h-12 text-lg font-mono"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="px-8 bg-blue-600 hover:bg-blue-700"
                  disabled={!moleculeFormula.trim()}
                >
                  Visualize
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Powered by{" "}
              <a
                href="https://pubchem.ncbi.nlm.nih.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                PubChem Database
              </a>{" "}
              • For educational purposes
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
