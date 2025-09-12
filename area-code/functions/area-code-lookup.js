/**
 * Area Code Lookup Function
 * 
 * This function queries the Twilio phone number inventory to find numbers
 * that match or are closest to a given area code for optimal caller ID selection.
 * 
 * Parameters:
 * - targetAreaCode: The area code to find matches for (e.g., "415")
 * - limit: Maximum number of results to return (default: 10)
 * 
 * Returns:
 * - Array of phone numbers with their area codes and proximity scores
 */

const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  
  // Set CORS headers
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { targetAreaCode, limit = 10 } = event;
    
    // Validate input
    if (!targetAreaCode) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'targetAreaCode parameter is required'
      });
      return callback(null, response);
    }

    // Validate area code format (3 digits)
    if (!/^\d{3}$/.test(targetAreaCode)) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'targetAreaCode must be a 3-digit area code'
      });
      return callback(null, response);
    }

    // Initialize Twilio client
    const client = context.getTwilioClient();
    
    console.log(`Looking up phone numbers for area code: ${targetAreaCode}`);
    
    // Fetch all phone numbers from account
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    
    console.log(`Found ${phoneNumbers.length} total phone numbers in inventory`);
    
    // Filter and score phone numbers by area code proximity
    const scoredNumbers = phoneNumbers
      .map(number => {
        try {
          // Parse the phone number to extract area code
          const phoneNumber = parsePhoneNumber(number.phoneNumber, 'US');
          
          if (!phoneNumber || !phoneNumber.nationalNumber) {
            return null;
          }
          
          // Extract area code (first 3 digits of national number)
          const nationalNumber = phoneNumber.nationalNumber;
          const areaCode = nationalNumber.substring(0, 3);
          
          // Calculate proximity score (0 = exact match, higher = further away)
          const proximityScore = calculateAreaCodeProximity(targetAreaCode, areaCode);
          
          return {
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName,
            areaCode: areaCode,
            proximityScore: proximityScore,
            capabilities: {
              voice: number.capabilities.voice,
              sms: number.capabilities.sms,
              mms: number.capabilities.mms
            }
          };
        } catch (error) {
          console.error(`Error parsing phone number ${number.phoneNumber}:`, error);
          return null;
        }
      })
      .filter(item => item !== null) // Remove invalid numbers
      .sort((a, b) => a.proximityScore - b.proximityScore) // Sort by best match first
      .slice(0, parseInt(limit)); // Limit results
    
    console.log(`Returning ${scoredNumbers.length} matched numbers`);
    
    response.setStatusCode(200);
    response.setBody({
      success: true,
      targetAreaCode: targetAreaCode,
      results: scoredNumbers,
      totalFound: scoredNumbers.length
    });
    
    return callback(null, response);
    
  } catch (error) {
    console.error('Error in area code lookup:', error);
    
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
 * Calculate proximity score between two area codes
 * This is a simplified algorithm - in production you might want to use
 * actual geographic data or more sophisticated matching
 */
function calculateAreaCodeProximity(targetAreaCode, candidateAreaCode) {
  // Exact match gets score of 0 (best)
  if (targetAreaCode === candidateAreaCode) {
    return 0;
  }
  
  // Calculate numeric distance as a simple proximity measure
  const targetNum = parseInt(targetAreaCode);
  const candidateNum = parseInt(candidateAreaCode);
  const numericDistance = Math.abs(targetNum - candidateNum);
  
  // Return normalized score (smaller is better)
  return numericDistance;
}
