"use client"

import type React from "react"

import { useState } from "react"
import { Search, ChevronDown, ChevronRight, Beaker, Atom } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFetchMolecule: (query: string, mode: string) => void
}

const sampleMolecules = {
  Simple: [
    { name: "Water", formula: "H2O" },
    { name: "Methane", formula: "CH4" },
    { name: "Ammonia", formula: "NH3" },
    { name: "Carbon Dioxide", formula: "CO2" },
  ],
  Organic: [
    { name: "Ethanol", formula: "C2H6O" },
    { name: "Benzene", formula: "C6H6" },
    { name: "Acetone", formula: "C3H6O" },
    { name: "Methanol", formula: "CH4O" },
  ],
  Biological: [
    { name: "Glucose", formula: "C6H12O6" },
    { name: "Caffeine", formula: "C8H10N4O2" },
    { name: "Aspirin", formula: "C9H8O4" },
    { name: "Cholesterol", formula: "C27H46O" },
  ],
  Pharmaceutical: [
    { name: "Morphine", formula: "C17H19NO3" },
    { name: "Ibuprofen", formula: "C13H18O2" },
    { name: "Penicillin", formula: "C16H18N2O4S" },
    { name: "Dopamine", formula: "C8H11NO2" },
  ],
}

export function Sidebar({ open, onOpenChange, onFetchMolecule }: SidebarProps) {
  const [searchMode, setSearchMode] = useState<"name" | "formula">("name")
  const [moleculeName, setMoleculeName] = useState("")
  const [moleculeFormula, setMoleculeFormula] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Simple"])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const query = searchMode === "name" ? moleculeName.trim() : moleculeFormula.trim()
    if (query) {
      onFetchMolecule(query, searchMode)
    }
  }

  const handleSampleSelect = (molecule: { name: string; formula: string }) => {
    setMoleculeName(molecule.name)
    setMoleculeFormula(molecule.formula)
    onFetchMolecule(molecule.name, "name")
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => onOpenChange(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Search Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Search Method</Label>
                <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as "name" | "formula")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="name" className="gap-2">
                      <Search className="h-4 w-4" />
                      Name
                    </TabsTrigger>
                    <TabsTrigger value="formula" className="gap-2">
                      <Beaker className="h-4 w-4" />
                      Formula
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="name" className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        value={moleculeName}
                        onChange={(e) => setMoleculeName(e.target.value)}
                        placeholder="Enter molecule name..."
                        className="w-full"
                      />
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                        disabled={!moleculeName.trim()}
                      >
                        Visualize
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="formula" className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        value={moleculeFormula}
                        onChange={(e) => setMoleculeFormula(e.target.value)}
                        placeholder="Enter molecular formula..."
                        className="w-full font-mono"
                      />
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                        disabled={!moleculeFormula.trim()}
                      >
                        Visualize
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Sample Molecules */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <Label className="text-sm font-medium text-gray-700 mb-4 block">Sample Molecules</Label>

              <div className="space-y-2">
                {Object.entries(sampleMolecules).map(([category, molecules]) => (
                  <Collapsible
                    key={category}
                    open={expandedCategories.includes(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-700">{category}</span>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-1 mt-2">
                      {molecules.map((molecule, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSampleSelect(molecule)}
                          className="w-full p-3 text-left rounded-lg hover:bg-blue-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Atom className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                              <span className="font-medium text-gray-700 group-hover:text-blue-700">
                                {molecule.name}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {molecule.formula}
                            </span>
                          </div>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
