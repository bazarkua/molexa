"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Atom, 
  FlaskConical, 
  Shield, 
  Pill,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Info
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  fetchEducationalData, 
  fetchMolecularProperties, 
  fetchSafetyData, 
  fetchSynonyms 
} from "@/lib/api"
import { toast } from "sonner"

interface MolecularInfoPanelProps {
  moleculeData: any
  className?: string
}

interface EnhancedMolecularData {
  basicProperties?: any
  educationalContext?: any
  safetyData?: any
  synonyms?: string[]
  educationalData?: any
}

export function MolecularInfoPanel({ moleculeData, className }: MolecularInfoPanelProps) {
  const [enhancedData, setEnhancedData] = useState<EnhancedMolecularData>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic"])

  useEffect(() => {
    if (moleculeData?.cid) {
      loadEnhancedData(moleculeData.cid)
    }
  }, [moleculeData])

  const formatChemicalFormula = (formula: string) => {
    if (!formula) return ""
    
    // Convert numbers to subscripts
    return formula.replace(/(\d+)/g, (match) => {
      const subscripts = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
      }
      return match.split('').map(digit => subscripts[digit as keyof typeof subscripts] || digit).join('')
    })
  }

  const formatMolecularWeight = (weight: any) => {
    if (weight === undefined || weight === null || isNaN(Number(weight))) {
      return "N/A"
    }
    const numWeight = Number(weight)
    return `${numWeight.toFixed(2)} g/mol`
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const loadEnhancedData = async (cid: number) => {
    setLoading(true)
    console.log(`Loading enhanced data for CID: ${cid}`)
    
    try {
      // Load multiple data sources in parallel
      const [properties, synonyms, educationalData] = await Promise.allSettled([
        fetchMolecularProperties(cid),
        fetchSynonyms(cid),
        fetchEducationalData(cid.toString(), 'cid')
      ])

      const newData: EnhancedMolecularData = {}

      if (properties.status === 'fulfilled') {
        console.log('Properties data:', properties.value)
        newData.basicProperties = properties.value.PropertyTable?.Properties?.[0]
        newData.educationalContext = properties.value.educational_context
      } else {
        console.error('Properties fetch failed:', properties.reason)
      }

      if (synonyms.status === 'fulfilled') {
        console.log('Synonyms count:', synonyms.value?.length || 0)
        newData.synonyms = synonyms.value?.slice(0, 8) // Limit to first 8 synonyms
      } else {
        console.error('Synonyms fetch failed:', synonyms.reason)
      }

      if (educationalData.status === 'fulfilled') {
        console.log('Educational data:', educationalData.value)
        newData.educationalData = educationalData.value
      } else {
        console.error('Educational data fetch failed:', educationalData.reason)
      }

      // Try to load safety data (optional)
      try {
        const safety = await fetchSafetyData(cid, 'Toxicity')
        newData.safetyData = safety
        console.log('Safety data loaded successfully')
      } catch (error) {
        console.log('Safety data not available for this compound:', error)
      }

      console.log('Final enhanced data:', newData)
      setEnhancedData(newData)
    } catch (error) {
      console.error('Failed to load enhanced data:', error)
      toast.error('Failed to load additional molecular information')
    } finally {
      setLoading(false)
    }
  }

  const getPropertyDescription = (property: string, value: any) => {
    const descriptions: Record<string, string> = {
      XLogP: "Lipophilicity measure. Values 1-3 are ideal for drug-like compounds.",
      TPSA: "Topological Polar Surface Area. Values <140 Ų indicate good oral bioavailability.",
      HBondDonorCount: "Number of hydrogen bond donors. ≤5 preferred for drug-like molecules.",
      HBondAcceptorCount: "Number of hydrogen bond acceptors. ≤10 preferred for drug-like molecules.",
      HeavyAtomCount: "Total non-hydrogen atoms in the molecule."
    }
    return descriptions[property] || ""
  }

  if (!moleculeData) return null

  return (
    <div className={className}>
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Atom className="h-6 w-6 text-blue-600" />
              Molecular Information
            </CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
              <TabsTrigger value="properties" className="text-sm">Properties</TabsTrigger>
              <TabsTrigger value="safety" className="text-sm">Safety</TabsTrigger>
              <TabsTrigger value="educational" className="text-sm">Learn</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              {/* Basic Molecular Info */}
              <Collapsible 
                open={expandedSections.includes("basic")}
                onOpenChange={() => toggleSection("basic")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-lg">Basic Information</span>
                  </div>
                  {expandedSections.includes("basic") ? 
                    <ChevronUp className="h-5 w-5" /> : 
                    <ChevronDown className="h-5 w-5" />
                  }
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-700 block mb-1">Formula:</span>
                      <div className="font-mono text-xl text-blue-600 font-bold">
                        {formatChemicalFormula(
                          enhancedData.basicProperties?.MolecularFormula || 
                          moleculeData.formula || 
                          'Loading...'
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-700 block mb-1">CID:</span>
                      <div className="font-mono text-blue-600 text-lg">
                        {moleculeData.cid || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-700 block mb-1">Atoms:</span>
                      <div className="text-gray-900 text-lg font-semibold">{moleculeData.atoms?.length || 0}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="font-medium text-gray-700 block mb-1">Bonds:</span>
                      <div className="text-gray-900 text-lg font-semibold">{moleculeData.bonds?.length || 0}</div>
                    </div>
                  </div>
                  
                  {enhancedData.basicProperties?.MolecularWeight && (
                    <div className="mt-4 pt-3 border-t border-gray-200 bg-white p-3 rounded">
                      <span className="font-medium text-gray-700 block mb-1">Molecular Weight:</span>
                      <div className="text-xl font-bold text-gray-900">
                        {formatMolecularWeight(enhancedData.basicProperties.MolecularWeight)}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

  

              {/* Element Composition */}
              {moleculeData.elements && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Atom className="h-5 w-5" />
                    Element Composition
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Object.entries(moleculeData.elements).map(([element, info]: [string, any]) => {
                      const count = moleculeData.atoms?.filter((atom: any) => atom.element === element).length || 0
                      return (
                        <div 
                          key={element}
                          className="flex items-center gap-2 p-2 bg-white rounded border"
                        >
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="font-mono font-semibold">{element}</span>
                          <span className="text-sm text-gray-500">×{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Synonyms */}
              {enhancedData.synonyms && enhancedData.synonyms.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Alternative Names</h4>
                  <div className="flex flex-wrap gap-2">
                    {enhancedData.synonyms.slice(0, 8).map((synonym, index) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                        {synonym}
                      </Badge>
                    ))}
                    {enhancedData.synonyms.length > 8 && (
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        +{enhancedData.synonyms.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="properties" className="space-y-4 mt-6">
              {enhancedData.basicProperties ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'XLogP', 'TPSA', 'HBondDonorCount', 
                    'HBondAcceptorCount', 'HeavyAtomCount'
                  ].map(property => {
                    const value = enhancedData.basicProperties[property]
                    if (value === undefined || value === null) return null
                    
                    return (
                      <div key={property} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-700 text-lg">{property}:</span>
                          <span className="font-bold text-gray-900 text-xl">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {getPropertyDescription(property, value)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                  <p className="text-lg">Loading molecular properties...</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Info className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No molecular properties available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Some compounds may not have detailed property data
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="safety" className="space-y-4 mt-6">
              {enhancedData.safetyData ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 text-lg">Safety Information Available</span>
                  </div>
                  <p className="text-yellow-700 mb-4">
                    Safety and toxicity data found for this compound. Always consult official safety data sheets 
                    and follow institutional safety protocols.
                  </p>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                    onClick={() => window.open(`https://pubchem.ncbi.nlm.nih.gov/compound/${moleculeData.cid}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Detailed Safety Information
                  </Button>
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                  <p className="text-lg">Loading safety information...</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No safety data available</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    Safety information is not available for all compounds. For laboratory use, 
                    always consult official safety data sheets (SDS) and follow proper safety protocols.
                  </p>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="mt-4"
                    onClick={() => window.open(`https://pubchem.ncbi.nlm.nih.gov/compound/${moleculeData.cid}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Check PubChem for More Info
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="educational" className="space-y-4 mt-6">
              {enhancedData.educationalData ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 text-lg">Educational Context</h4>
                    <div className="space-y-3">
                      {enhancedData.educationalData.educational_sections && (
                        <div>
                          <p className="text-sm text-blue-700 mb-2">Available Educational Topics:</p>
                          <div className="flex flex-wrap gap-2">
                            {enhancedData.educationalData.educational_sections.map((section: string, index: number) => (
                              <Badge key={index} variant="outline" className="border-blue-300 text-blue-800">
                                {section}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {enhancedData.educationalData.image_urls && (
                        <div>
                          <p className="text-sm text-blue-700 mb-2">Available Visualizations:</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Badge variant="secondary">2D Structure</Badge>
                            <Badge variant="secondary">3D Model</Badge>
                            <Badge variant="secondary">Large Format</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="default"
                      onClick={() => window.open(`https://pubchem.ncbi.nlm.nih.gov/compound/${moleculeData.cid}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Full PubChem Entry
                    </Button>
                    
                    {enhancedData.educationalData.image_urls?.['2d_structure'] && (
                      <Button 
                        variant="outline" 
                        size="default"
                        onClick={() => window.open(enhancedData.educationalData.image_urls['2d_structure'], '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        2D Structure Image
                      </Button>
                    )}
                  </div>
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
                  <p className="text-lg">Loading educational content...</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Limited educational content available</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                    Additional educational information may be available on the full PubChem page.
                  </p>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="mt-4"
                    onClick={() => window.open(`https://pubchem.ncbi.nlm.nih.gov/compound/${moleculeData.cid}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Explore on PubChem
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}