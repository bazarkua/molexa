"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Loader2, Beaker, FlaskConical, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { fetchAutocomplete } from "@/lib/api"
import { toast } from "sonner"

interface EnhancedSearchProps {
  onFetchMolecule: (query: string, mode: string) => void
  className?: string
}

export function EnhancedSearch({ onFetchMolecule, className }: EnhancedSearchProps) {
  const [searchMode, setSearchMode] = useState<"name" | "formula">("name")
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [formulaValid, setFormulaValid] = useState<boolean | null>(null)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Formula validation regex - basic chemical formula pattern
  const formulaPattern = /^[A-Z][a-z]?(\d+)?([A-Z][a-z]?(\d+)?)*$/
  
  // Common formula examples for hints
  const formulaExamples = [
    { formula: "H2O", name: "Water" },
    { formula: "C2H6O", name: "Ethanol" },
    { formula: "C9H8O4", name: "Aspirin" },
    { formula: "C6H12O6", name: "Glucose" },
    { formula: "CH4", name: "Methane" },
    { formula: "C8H10N4O2", name: "Caffeine" }
  ]

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Validate formula format in real-time
  useEffect(() => {
    if (searchMode === 'formula' && query.trim()) {
      const isValid = formulaPattern.test(query.trim())
      setFormulaValid(isValid)
    } else {
      setFormulaValid(null)
    }
  }, [query, searchMode])

  // Fetch autocomplete suggestions with debouncing
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setLoadingSuggestions(true)
    try {
      const results = await fetchAutocomplete(searchQuery, 8)
      setSuggestions(results)
    } catch (error) {
      console.error('Autocomplete error:', error)
      setSuggestions([])
      toast.error('Failed to fetch suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Only fetch suggestions for name mode and if showing suggestions
    if (searchMode === 'name' && showSuggestions) {
      timeoutRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, 300) // 300ms debounce
    }
  }

  // Handle search button click
  const handleSearchClick = async () => {
    if (!query.trim()) {
      toast.error('Please enter a molecule name or formula')
      return
    }

    // Formula validation check
    if (searchMode === 'formula' && !formulaValid) {
      toast.error('Please enter a valid chemical formula (e.g., C2H6O)')
      return
    }

    // If name mode and no suggestions shown yet, show them first
    if (searchMode === 'name' && !showSuggestions && suggestions.length === 0) {
      setShowSuggestions(true)
      await fetchSuggestions(query)
      return
    }

    // Perform actual search
    performSearch()
  }

  // Perform the actual molecule search
  const performSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)
    
    try {
      await onFetchMolecule(query.trim(), searchMode)
      toast.success(`Searching for ${query}...`)
    } catch (error) {
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    
    // Auto-search when suggestion is selected
    setTimeout(() => {
      onFetchMolecule(suggestion, searchMode)
    }, 100)
  }

  // Handle example formula selection
  const handleExampleSelect = (example: { formula: string; name: string }) => {
    setQuery(example.formula)
    setFormulaValid(true)
    
    // Auto-search when example is selected
    setTimeout(() => {
      onFetchMolecule(example.formula, 'formula')
    }, 100)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  // Handle key navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault()
      performSearch()
    }
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as "name" | "formula")}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="name" className="gap-2">
            <Search className="h-4 w-4" />
            Name Search
          </TabsTrigger>
          <TabsTrigger value="formula" className="gap-2">
            <Beaker className="h-4 w-4" />
            Formula Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="name" className="space-y-2">
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter molecule name (e.g., aspirin, caffeine, morphine)"
                  className="h-12 text-lg pr-10"
                />
                {loadingSuggestions && (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                )}
              </div>
              
              <Button
                type="button"
                onClick={handleSearchClick}
                disabled={isSearching || !query.trim()}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {showSuggestions && suggestions.length > 0 ? 'Search' : 'Find'}
                  </>
                )}
              </Button>
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
                {loadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Finding suggestions...
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs text-gray-600 font-medium">
                        Suggestions from PubChem Database
                      </p>
                    </div>
                    <ul className="py-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                          >
                            <FlaskConical className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
                            <span className="text-gray-900 group-hover:text-blue-900">
                              {suggestion}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : query.length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FlaskConical className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No suggestions found for "{query}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different spelling or use formula search</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">Type at least 2 characters to see suggestions</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Click "Find" to see suggestions, then select one or search directly
          </p>
        </TabsContent>

        <TabsContent value="formula" className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter molecular formula (e.g., C9H8O4, C17H19NO3)"
                className={cn(
                  "h-12 text-lg font-mono pr-10",
                  formulaValid === false && "border-red-300 focus:border-red-500",
                  formulaValid === true && "border-green-300 focus:border-green-500"
                )}
              />
              {formulaValid !== null && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {formulaValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSearching || !query.trim() || formulaValid === false}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Beaker className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>

          {/* Formula validation feedback */}
          {formulaValid === false && query.trim() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please use proper chemical formula format. Elements should be capitalized (e.g., C2H6O not c2h6o).
              </AlertDescription>
            </Alert>
          )}

          {/* Formula examples */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Common Examples:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {formulaExamples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleSelect(example)}
                  className="text-left p-2 bg-white rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                  disabled={isSearching}
                >
                  <div className="font-mono text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                    {example.formula}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-600">
                    {example.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Enter exact chemical formula (case sensitive: C, H, N, O, etc.). Now using enhanced FastFormula search!
          </p>
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Powered by{" "}
          <a
            href="https://pubchem.ncbi.nlm.nih.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            PubChem Database
          </a>{" "}
          • Enhanced with educational features • Fixed FastFormula support
        </p>
      </div>
    </div>
  )
}