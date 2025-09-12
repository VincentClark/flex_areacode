/**
 * Caller ID Assignment Function
 * 
 * This is the main function that Flex will call to get the optimal caller ID
 * for a given destination phone number. It combines area code lookup and
 * proximity algorithms to return the best matching phone number.
 * 
 * Parameters:
 * - destinationNumber: The phone number being called (e.g., "+14155551234")
 * - preferences: Optional preferences object
 *   - prioritizeExactMatch: boolean (default: true)
 *   - requireSameState: boolean (default: false)
 *   - maxResults: number (default: 5)
 * 
 * Returns:
 * - Recommended caller ID phone number and alternatives
 */

const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  
  // Set CORS headers
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { 
      destinationNumber, 
      prioritizeExactMatch = true,
      requireSameState = false,
      maxResults = 5 
    } = event;
    
    // Validate required parameters
    if (!destinationNumber) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'destinationNumber parameter is required'
      });
      return callback(null, response);
    }

    // Validate and parse the destination number
    if (!isValidPhoneNumber(destinationNumber, 'US')) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'Invalid phone number format'
      });
      return callback(null, response);
    }

    const parsedNumber = parsePhoneNumber(destinationNumber, 'US');
    const targetAreaCode = parsedNumber.nationalNumber.substring(0, 3);
    
    console.log(`Finding caller ID for destination: ${destinationNumber}, area code: ${targetAreaCode}`);

    // Initialize Twilio client
    const client = context.getTwilioClient();
    
    // Get all available phone numbers
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    
    if (phoneNumbers.length === 0) {
      response.setStatusCode(404);
      response.setBody({
        success: false,
        error: 'No phone numbers found in inventory'
      });
      return callback(null, response);
    }

    console.log(`Analyzing ${phoneNumbers.length} phone numbers in inventory`);
    
    // Score and rank phone numbers
    const scoredNumbers = phoneNumbers
      .map(number => {
        try {
          const phoneNumber = parsePhoneNumber(number.phoneNumber, 'US');
          
          if (!phoneNumber || !phoneNumber.nationalNumber) {
            return null;
          }
          
          const areaCode = phoneNumber.nationalNumber.substring(0, 3);
          const region = getAreaCodeRegion(areaCode);
          const targetRegion = getAreaCodeRegion(targetAreaCode);
          
          // Calculate comprehensive score
          const score = calculateComprehensiveScore(
            targetAreaCode, 
            areaCode, 
            targetRegion, 
            region,
            prioritizeExactMatch,
            requireSameState
          );
          
          // Skip if doesn't meet state requirement
          if (requireSameState && region.state !== targetRegion.state) {
            return null;
          }
          
          return {
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName,
            areaCode: areaCode,
            region: region,
            score: score,
            matchType: getMatchType(targetAreaCode, areaCode, targetRegion, region),
            capabilities: {
              voice: number.capabilities.voice,
              sms: number.capabilities.sms,
              mms: number.capabilities.mms
            }
          };
        } catch (error) {
          console.error(`Error processing number ${number.phoneNumber}:`, error);
          return null;
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => a.score - b.score) // Lower score is better
      .slice(0, parseInt(maxResults));

    if (scoredNumbers.length === 0) {
      response.setStatusCode(404);
      response.setBody({
        success: false,
        error: 'No suitable caller ID numbers found matching criteria'
      });
      return callback(null, response);
    }

    // Prepare response
    const recommendation = scoredNumbers[0];
    const alternatives = scoredNumbers.slice(1);
    
    console.log(`Recommending ${recommendation.phoneNumber} (${recommendation.matchType})`);
    
    response.setStatusCode(200);
    response.setBody({
      success: true,
      destinationNumber: destinationNumber,
      targetAreaCode: targetAreaCode,
      recommendation: {
        phoneNumber: recommendation.phoneNumber,
        friendlyName: recommendation.friendlyName,
        areaCode: recommendation.areaCode,
        matchType: recommendation.matchType,
        score: recommendation.score,
        region: recommendation.region,
        capabilities: recommendation.capabilities
      },
      alternatives: alternatives.map(alt => ({
        phoneNumber: alt.phoneNumber,
        friendlyName: alt.friendlyName,
        areaCode: alt.areaCode,
        matchType: alt.matchType,
        score: alt.score,
        region: alt.region
      })),
      metadata: {
        totalCandidates: phoneNumbers.length,
        evaluatedCandidates: scoredNumbers.length,
        preferences: {
          prioritizeExactMatch,
          requireSameState,
          maxResults
        }
      }
    });
    
    return callback(null, response);
    
  } catch (error) {
    console.error('Error in caller ID assignment:', error);
    
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
    
    return callback(null, response);
  }
};

/**
 * Calculate comprehensive scoring for caller ID selection
 */
function calculateComprehensiveScore(targetAreaCode, candidateAreaCode, targetRegion, candidateRegion, prioritizeExactMatch, requireSameState) {
  let score = 0;
  
  // Exact area code match (best score)
  if (targetAreaCode === candidateAreaCode) {
    return prioritizeExactMatch ? 0 : 1;
  }
  
  // Same state
  if (targetRegion.state === candidateRegion.state) {
    score += 10;
  }
  
  // Same region
  else if (targetRegion.region === candidateRegion.region) {
    score += 20;
  }
  
  // Adjacent states
  else if (areStatesAdjacent(targetRegion.state, candidateRegion.state)) {
    score += 30;
  }
  
  // Different regions
  else {
    score += 50;
  }
  
  // Add numeric distance as tie-breaker
  const numericDistance = Math.abs(parseInt(targetAreaCode) - parseInt(candidateAreaCode));
  score += numericDistance / 1000; // Normalize to small decimal
  
  return score;
}

/**
 * Get human-readable match type
 */
function getMatchType(targetAreaCode, candidateAreaCode, targetRegion, candidateRegion) {
  if (targetAreaCode === candidateAreaCode) {
    return 'Exact Area Code Match';
  }
  
  if (targetRegion.state === candidateRegion.state) {
    return 'Same State';
  }
  
  if (targetRegion.region === candidateRegion.region) {
    return 'Same Region';
  }
  
  if (areStatesAdjacent(targetRegion.state, candidateRegion.state)) {
    return 'Adjacent State';
  }
  
  return 'Different Region';
}

/**
 * Get geographic region data for an area code
 * (Simplified version - import from area-code-proximity.js in production)
 */
function getAreaCodeRegion(areaCode) {
  const areaCodeMap = {
    // Major area codes (abbreviated for this function)
    '415': { state: 'CA', region: 'West', city: 'San Francisco' },
    '510': { state: 'CA', region: 'West', city: 'Oakland' },
    '650': { state: 'CA', region: 'West', city: 'San Mateo' },
    '925': { state: 'CA', region: 'West', city: 'Concord' },
    '212': { state: 'NY', region: 'Northeast', city: 'New York' },
    '646': { state: 'NY', region: 'Northeast', city: 'New York' },
    '718': { state: 'NY', region: 'Northeast', city: 'New York' },
    '917': { state: 'NY', region: 'Northeast', city: 'New York' },
    '214': { state: 'TX', region: 'South', city: 'Dallas' },
    '469': { state: 'TX', region: 'South', city: 'Dallas' },
    '972': { state: 'TX', region: 'South', city: 'Dallas' },
    '713': { state: 'TX', region: 'South', city: 'Houston' },
    '281': { state: 'TX', region: 'South', city: 'Houston' },
    '832': { state: 'TX', region: 'South', city: 'Houston' }
  };
  
  return areaCodeMap[areaCode] || { state: 'Unknown', region: 'Unknown', city: 'Unknown' };
}

/**
 * Check if two states are geographically adjacent (simplified)
 */
function areStatesAdjacent(state1, state2) {
  const adjacencyMap = {
    'CA': ['NV', 'OR', 'AZ'],
    'NY': ['PA', 'NJ', 'CT', 'MA', 'VT'],
    'TX': ['NM', 'OK', 'AR', 'LA'],
    'FL': ['GA', 'AL']
  };
  
  return adjacencyMap[state1]?.includes(state2) || adjacencyMap[state2]?.includes(state1) || false;
}
