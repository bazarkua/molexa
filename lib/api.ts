// lib/api.ts - Enhanced with cold start handling and retry logic

const environments = {
  local: 'http://localhost:3001',
  production: 'https://molexa-api.vercel.app'
};

const BASE_URL = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_LOCAL_API === 'true' 
  ? environments.local 
  : environments.production;

console.log(`🌐 API Base URL: ${BASE_URL}`);

/**
 * Delay function for rate limiting and retries
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Enhanced API call with cold start handling and improved retry logic
 */
async function apiCall(endpoint: string, retries = 3, isInitialWakeup = false): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`API Call: ${url}${isInitialWakeup ? ' (wake-up call)' : ''}`);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Adjust timeout based on whether this might be a cold start
      const timeoutMs = isInitialWakeup || attempt === 0 ? 35000 : 15000; // 35s for first call, 15s for retries
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'moleXa-Frontend/2.0',
          'Cache-Control': 'no-cache',
          ...(isInitialWakeup && { 'X-Wake-Up': 'true' })
        }
      });

      clearTimeout(timeoutId);

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
          // Server errors might indicate cold start issues
          if (attempt < retries) {
            const retryDelay = Math.min(3000 * Math.pow(1.5, attempt), 10000);
            console.log(`Server error ${response.status}, retrying in ${retryDelay}ms...`);
            await delay(retryDelay);
            continue;
          } else {
            throw new Error('Server error occurred');
          }
        } else {
          throw new Error(errorData.message || `API Error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (isInitialWakeup) {
        console.log('✅ API wake-up successful');
      }
      
      return data;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (isInitialWakeup) {
          console.log(`🕐 API wake-up timed out after ${attempt === 0 ? 35 : 15}s - retrying...`);
        } else {
          console.log(`🕐 Request timed out after ${attempt === 0 ? 35 : 15}s - retrying...`);
        }
        
        if (attempt < retries) {
          const retryDelay = Math.min(2000 * (attempt + 1), 8000);
          await delay(retryDelay);
          continue;
        } else {
          throw new Error('Request timed out - the API may be experiencing cold start delays');
        }
      }
      
      // Other network errors
      if (attempt === retries) {
        throw error;
      }
      
      const retryDelay = Math.min(1000 * (attempt + 1), 5000);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
      await delay(retryDelay);
    }
  }
}

/**
 * Check API health and wake it up if needed
 * This is called from the frontend on page load
 */
export async function checkAndWakeUpAPI(): Promise<{ isAwake: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Checking API health...');
    
    // Use a shorter timeout for the initial health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${BASE_URL}/api/health`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ API is awake (${responseTime}ms)`);
      return { isAwake: true, responseTime };
    } else {
      console.log(`⚠️ API health check failed with status ${response.status}`);
      return { isAwake: false, responseTime, error: `Status ${response.status}` };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('🕐 API health check timed out - likely cold start needed');
      return { isAwake: false, responseTime: 3000, error: 'Timeout - likely cold start' };
    } else {
      console.log('❌ API health check failed:', error);
      return { isAwake: false, responseTime, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * Wake up the API with a longer timeout
 */
export async function wakeUpAPI(): Promise<{ success: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Waking up API...');
    
    const data = await apiCall('/api/health', 2, true); // 2 retries, mark as initial wake-up
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ API wake-up successful after ${responseTime}ms`);
    return { success: true, responseTime };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.log(`❌ API wake-up failed after ${responseTime}ms:`, errorMessage);
    return { success: false, responseTime, error: errorMessage };
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
 * Enhanced with cold start awareness
 */
export async function searchMolecules(query: string, type: 'name' | 'formula' = 'name'): Promise<number[]> {
  try {
    // Map 'formula' to 'fastformula' for PubChem API
    const searchEndpoint = type === 'formula' ? 'fastformula' : 'name';
    console.log(`🔍 Using endpoint: ${searchEndpoint} for search type: ${type}`);
    
    const data = await apiCall(`/api/pubchem/compound/${searchEndpoint}/${encodeURIComponent(query)}/cids/JSON`, 3);
    return data.IdentifierList?.CID || [];
  } catch (error) {
    console.error('Molecule search failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive educational data for a compound
 * Enhanced with retry logic for cold starts
 */
export async function fetchEducationalData(identifier: string, type: 'cid' | 'name' | 'formula' = 'cid') {
  try {
    // Map formula type to fastformula for educational endpoint
    let searchType: 'cid' | 'name' | 'formula' | 'fastformula' = type;
    if (type === 'formula') {
      searchType = 'fastformula';
      console.log(`🔄 Mapped formula search to fastformula for educational data`);
    }
    
    const data = await apiCall(`/api/pubchem/compound/${identifier}/educational?type=${searchType}`, 2);
    return data;
  } catch (error) {
    console.error('Educational data fetch failed:', error);
    throw error;
  }
}

/**
 * Get molecular properties with educational context
 * Enhanced retry logic
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
    
    const data = await apiCall(`/api/pubchem/compound/cid/${cid}/property/${properties}/JSON`, 2);
    return data;
  } catch (error) {
    console.error('Properties fetch failed:', error);
    throw error;
  }
}

/**
 * Get safety information for a compound
 * Enhanced error handling and retry logic
 */
export async function fetchSafetyData(cid: number, heading?: string) {
  try {
    const params = heading ? `?heading=${encodeURIComponent(heading)}` : '';
    const data = await apiCall(`/api/pugview/compound/${cid}/safety${params}`, 1);
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("Rate limit") || msg.includes("429")) {
        throw new Error("Safety data temporarily unavailable (rate limit)");
      } else if (msg.includes("404") || msg.includes("not available")) {
        throw new Error("Safety data not available for this compound");
      } else if (msg.includes("timed out") || msg.includes("cold start")) {
        throw new Error("Safety data request timed out - please try again");
      }
    }
    throw error;
  }
}

/**
 * Get 3D structure data (SDF)
 * Enhanced with timeout handling for large molecules
 */
export async function fetchStructureData(cid: number): Promise<string> {
  try {
    console.log(`📁 Fetching structure data for CID: ${cid}`);
    
    // Structure data can be large, so we use a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    const url = `${BASE_URL}/api/pubchem/compound/cid/${cid}/SDF`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'moleXa-Frontend/2.0',
        'Accept': 'chemical/x-mdl-sdfile,text/plain,*/*'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Structure fetch failed: ${response.status}`);
    }
    
    const data = await response.text();
    console.log(`✅ Structure data received: ${data.length} characters`);
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Structure download timed out - the molecule may be very large');
    }
    console.error('Structure data fetch failed:', error);
    throw error;
  }
}

/**
 * Get compound synonyms
 * Enhanced with retry logic
 */
export async function fetchSynonyms(cid: number) {
  try {
    const data = await apiCall(`/api/pubchem/compound/cid/${cid}/synonyms/JSON`, 1);
    return data.InformationList?.Information?.[0]?.Synonym || [];
  } catch (error) {
    console.error('Synonyms fetch failed:', error);
    return [];
  }
}

/**
 * Test API connectivity with diagnostic information
 * Useful for debugging cold start issues
 */
export async function testAPIConnectivity(): Promise<{
  success: boolean;
  responseTime: number;
  details: string;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${BASE_URL}/api/health`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Connectivity-Test': 'true'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        responseTime,
        details: `API healthy. Service: ${data.service || 'Unknown'}, Version: ${data.version || 'Unknown'}`
      };
    } else {
      return {
        success: false,
        responseTime,
        details: `HTTP ${response.status}: ${response.statusText}`,
        error: `API responded with status ${response.status}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        responseTime: 10000,
        details: 'Request timed out after 10 seconds',
        error: 'Connection timeout - API may be in cold start'
      };
    } else {
      return {
        success: false,
        responseTime,
        details: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown network error'
      };
    }
  }
}