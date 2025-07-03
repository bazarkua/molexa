// lib/api.ts - Fixed to use fastformula endpoint properly

// Use the same simple approach as the test script
const environments = {
  local: 'http://localhost:3001',
  production: 'https://molexa-api.vercel.app'
};

// Default to production unless explicitly set to local
const BASE_URL = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_LOCAL_API === 'true' 
  ? environments.local 
  : environments.production;

console.log(`🌐 API Base URL: ${BASE_URL}`);

/**
 * Delay function for rate limiting
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Base API call with error handling and retry logic
 */
async function apiCall(endpoint: string, retries = 2): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`API Call: ${url}`);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'moleXa-Frontend/2.0'
        }
      });

      if (response.status === 429) {
        const waitTime = Math.min(2000 * Math.pow(2, attempt), 10000);
        console.log(`Rate limit hit. Waiting ${waitTime}ms before retry ${attempt + 1}/${retries + 1}...`);
        
        if (attempt < retries) {
          await delay(waitTime);
          continue;
        } else {
          throw new Error('Rate limit exceeded. This data may not be available for this compound.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error('Data not available for this compound');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred');
        } else {
          throw new Error(errorData.message || `API Error: ${response.status}`);
        }
      }

      return response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await delay(1000 * (attempt + 1));
    }
  }
}

/**
 * Fetch autocomplete suggestions for a partial molecule name or formula.
 */
export async function fetchAutocomplete(query: string, limit = 10): Promise<string[]> {
  if (!query.trim()) return [];
  
  try {
    const data = await apiCall(`/api/autocomplete/${encodeURIComponent(query)}?limit=${limit}`);
    return data.suggestions || [];
  } catch (error) {
    console.error('Autocomplete fetch failed:', error);
    throw error;
  }
}

/**
 * Search for molecules by name or formula
 * FIXED: Uses fastformula endpoint for formula searches
 */
export async function searchMolecules(query: string, type: 'name' | 'formula' = 'name'): Promise<number[]> {
  try {
    // 🔧 FIX: Map 'formula' to 'fastformula' for PubChem API
    const searchEndpoint = type === 'formula' ? 'fastformula' : 'name';
    console.log(`🔍 Using endpoint: ${searchEndpoint} for search type: ${type}`);
    
    const data = await apiCall(`/api/pubchem/compound/${searchEndpoint}/${encodeURIComponent(query)}/cids/JSON`);
    return data.IdentifierList?.CID || [];
  } catch (error) {
    console.error('Molecule search failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive educational data for a compound
 * FIXED: Uses fastformula for formula searches
 */
export async function fetchEducationalData(identifier: string, type: 'cid' | 'name' | 'formula' | 'fastformula' = 'cid') {
  try {
    // 🔧 FIX: Map formula type to fastformula for educational endpoint
    let searchType = type;
    if (type === 'formula') {
      searchType = 'fastformula';
      console.log(`🔄 Mapped formula search to fastformula for educational data`);
    }
    
    const data = await apiCall(`/api/pubchem/compound/${identifier}/educational?type=${searchType}`, 1);
    return data;
  } catch (error) {
    console.error('Educational data fetch failed:', error);
    throw error;
  }
}

/**
 * Get molecular properties with educational context
 */
export async function fetchMolecularProperties(cid: number) {
  try {
    const properties = [
      'MolecularFormula',
      'MolecularWeight', 
      'HBondDonorCount',
      'HBondAcceptorCount',
      'HeavyAtomCount',
      'XLogP',
      'TPSA'
    ].join(',');
    
    const data = await apiCall(`/api/pubchem/compound/cid/${cid}/property/${properties}/JSON`, 1);
    return data;
  } catch (error) {
    console.error('Properties fetch failed:', error);
    throw error;
  }
}

/**
 * Get safety information for a compound
 */
export async function fetchSafetyData(cid: number, heading?: string) {
  try {
    const params = heading ? `?heading=${encodeURIComponent(heading)}` : '';
    const data = await apiCall(`/api/pugview/compound/${cid}/safety${params}`, 0);
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("Rate limit") || msg.includes("429")) {
        throw new Error("Safety data temporarily unavailable (rate limit)");
      } else if (msg.includes("404") || msg.includes("not available")) {
        throw new Error("Safety data not available for this compound");
      }
    }
    throw error;
  }
}

/**
 * Get 3D structure data (SDF)
 */
export async function fetchStructureData(cid: number): Promise<string> {
  const url = `${BASE_URL}/api/pubchem/compound/cid/${cid}/SDF`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Structure fetch failed: ${response.status}`);
  }
  
  return response.text();
}

/**
 * Get compound synonyms
 */
export async function fetchSynonyms(cid: number) {
  try {
    const data = await apiCall(`/api/pubchem/compound/cid/${cid}/synonyms/JSON`, 0);
    return data.InformationList?.Information?.[0]?.Synonym || [];
  } catch (error) {
    console.error('Synonyms fetch failed:', error);
    return [];
  }
}