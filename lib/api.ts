// lib/api.ts - Fixed to match working test script pattern

// Use the same simple approach as the test script
const environments = {
  local: 'http://localhost:3001',
  production: 'https://molexa.org'
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
 * Uses the same pattern as the working test script
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
        // Rate limit hit - wait longer before retry
        const waitTime = Math.min(2000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
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
        
        // Handle specific error cases
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
        throw error; // Last attempt failed
      }
      
      // Wait before retry for non-rate-limit errors
      await delay(1000 * (attempt + 1));
    }
  }
}

/**
 * Fetch autocomplete suggestions for a partial molecule name or formula.
 * Matches test script: /api/autocomplete/{query}?limit={limit}
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
 * Matches test script: /api/pubchem/compound/{type}/{query}/cids/JSON
 */
export async function searchMolecules(query: string, type: 'name' | 'formula' = 'name'): Promise<number[]> {
  try {
    const data = await apiCall(`/api/pubchem/compound/${type}/${encodeURIComponent(query)}/cids/JSON`);
    return data.IdentifierList?.CID || [];
  } catch (error) {
    console.error('Molecule search failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive educational data for a compound
 * Matches test script: /api/pubchem/compound/{identifier}/educational?type={type}
 */
export async function fetchEducationalData(identifier: string, type: 'cid' | 'name' | 'formula' = 'cid') {
  try {
    const data = await apiCall(`/api/pubchem/compound/${identifier}/educational?type=${type}`, 1); // Only 1 retry for educational data
    return data;
  } catch (error) {
    console.error('Educational data fetch failed:', error);
    throw error;
  }
}

/**
 * Get molecular properties with educational context
 * Matches test script pattern: /api/pubchem/compound/cid/{cid}/property/{properties}/JSON
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
 * Get safety information for a compound (many compounds don't have this)
 * Matches test script: /api/pugview/compound/{cid}/safety?heading={heading}
 */
export async function fetchSafetyData(cid: number, heading?: string) {
  try {
    const params = heading ? `?heading=${encodeURIComponent(heading)}` : '';
    const data = await apiCall(`/api/pugview/compound/${cid}/safety${params}`, 0); // No retries for safety data
    return data;
  } catch (error) {
    // Safety data is often not available, so we handle this gracefully
    if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
      throw new Error('Safety data temporarily unavailable (rate limit)');
    } else if (error.message?.includes('404') || error.message?.includes('not available')) {
      throw new Error('Safety data not available for this compound');
    }
    throw error;
  }
}

/**
 * Get 3D structure data (SDF)
 * Matches test script pattern: /api/pubchem/compound/cid/{cid}/SDF
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
 * Get compound synonyms (often causes rate limits, so handle gracefully)
 * Matches test script pattern: /api/pubchem/compound/cid/{cid}/synonyms/JSON
 */
export async function fetchSynonyms(cid: number) {
  try {
    const data = await apiCall(`/api/pubchem/compound/cid/${cid}/synonyms/JSON`, 0); // No retries for synonyms
    return data.InformationList?.Information?.[0]?.Synonym || [];
  } catch (error) {
    console.error('Synonyms fetch failed:', error);
    // Synonyms are nice-to-have, so we fail silently
    return [];
  }
}