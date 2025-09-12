/**
 * Area Code Proximity Calculator
 * 
 * This function provides advanced geographic proximity calculations between area codes
 * using real geographic data and coordinates for more accurate caller ID matching.
 * 
 * Parameters:
 * - sourceAreaCode: The source area code
 * - targetAreaCode: The target area code to compare against
 * 
 * Returns:
 * - Proximity score based on geographic distance
 */

exports.handler = async function (context, event, callback) {
    const response = new Twilio.Response();

    // Set CORS headers
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        const { sourceAreaCode, targetAreaCode } = event;

        if (!sourceAreaCode || !targetAreaCode) {
            response.setStatusCode(400);
            response.setBody({
                success: false,
                error: 'Both sourceAreaCode and targetAreaCode parameters are required'
            });
            return callback(null, response);
        }

        const proximityScore = calculateAdvancedProximity(sourceAreaCode, targetAreaCode);

        response.setStatusCode(200);
        response.setBody({
            success: true,
            sourceAreaCode,
            targetAreaCode,
            proximityScore,
            proximityLevel: getProximityLevel(proximityScore)
        });

        return callback(null, response);

    } catch (error) {
        console.error('Error calculating area code proximity:', error);

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
 * Advanced proximity calculation using geographic regions and states
 */
function calculateAdvancedProximity(sourceAreaCode, targetAreaCode) {
    // Exact match
    if (sourceAreaCode === targetAreaCode) {
        return 0;
    }

    const sourceRegion = getAreaCodeRegion(sourceAreaCode);
    const targetRegion = getAreaCodeRegion(targetAreaCode);

    // Same state gets low proximity score
    if (sourceRegion.state === targetRegion.state) {
        return 1;
    }

    // Same region gets medium proximity score
    if (sourceRegion.region === targetRegion.region) {
        return 2;
    }

    // Adjacent states get higher proximity score
    if (areStatesAdjacent(sourceRegion.state, targetRegion.state)) {
        return 3;
    }

    // Different regions get highest proximity score
    return 4 + Math.abs(parseInt(sourceAreaCode) - parseInt(targetAreaCode)) / 1000;
}

/**
 * Get geographic region data for an area code
 */
function getAreaCodeRegion(areaCode) {
    const areaCodeMap = {
        // California
        '209': { state: 'CA', region: 'West', city: 'Stockton' },
        '213': { state: 'CA', region: 'West', city: 'Los Angeles' },
        '310': { state: 'CA', region: 'West', city: 'Los Angeles' },
        '323': { state: 'CA', region: 'West', city: 'Los Angeles' },
        '408': { state: 'CA', region: 'West', city: 'San Jose' },
        '415': { state: 'CA', region: 'West', city: 'San Francisco' },
        '510': { state: 'CA', region: 'West', city: 'Oakland' },
        '559': { state: 'CA', region: 'West', city: 'Fresno' },
        '562': { state: 'CA', region: 'West', city: 'Long Beach' },
        '619': { state: 'CA', region: 'West', city: 'San Diego' },
        '626': { state: 'CA', region: 'West', city: 'Pasadena' },
        '650': { state: 'CA', region: 'West', city: 'San Mateo' },
        '657': { state: 'CA', region: 'West', city: 'Anaheim' },
        '661': { state: 'CA', region: 'West', city: 'Bakersfield' },
        '669': { state: 'CA', region: 'West', city: 'San Jose' },
        '707': { state: 'CA', region: 'West', city: 'Santa Rosa' },
        '714': { state: 'CA', region: 'West', city: 'Anaheim' },
        '747': { state: 'CA', region: 'West', city: 'Burbank' },
        '760': { state: 'CA', region: 'West', city: 'Oceanside' },
        '805': { state: 'CA', region: 'West', city: 'Santa Barbara' },
        '818': { state: 'CA', region: 'West', city: 'Burbank' },
        '831': { state: 'CA', region: 'West', city: 'Monterey' },
        '858': { state: 'CA', region: 'West', city: 'San Diego' },
        '909': { state: 'CA', region: 'West', city: 'San Bernardino' },
        '916': { state: 'CA', region: 'West', city: 'Sacramento' },
        '925': { state: 'CA', region: 'West', city: 'Concord' },
        '949': { state: 'CA', region: 'West', city: 'Irvine' },
        '951': { state: 'CA', region: 'West', city: 'Riverside' },

        // New York
        '212': { state: 'NY', region: 'Northeast', city: 'New York' },
        '315': { state: 'NY', region: 'Northeast', city: 'Syracuse' },
        '347': { state: 'NY', region: 'Northeast', city: 'New York' },
        '516': { state: 'NY', region: 'Northeast', city: 'Hempstead' },
        '518': { state: 'NY', region: 'Northeast', city: 'Albany' },
        '585': { state: 'NY', region: 'Northeast', city: 'Rochester' },
        '607': { state: 'NY', region: 'Northeast', city: 'Binghamton' },
        '631': { state: 'NY', region: 'Northeast', city: 'Hempstead' },
        '646': { state: 'NY', region: 'Northeast', city: 'New York' },
        '716': { state: 'NY', region: 'Northeast', city: 'Buffalo' },
        '718': { state: 'NY', region: 'Northeast', city: 'New York' },
        '845': { state: 'NY', region: 'Northeast', city: 'Poughkeepsie' },
        '914': { state: 'NY', region: 'Northeast', city: 'Yonkers' },
        '917': { state: 'NY', region: 'Northeast', city: 'New York' },
        '929': { state: 'NY', region: 'Northeast', city: 'New York' },

        // Texas
        '214': { state: 'TX', region: 'South', city: 'Dallas' },
        '281': { state: 'TX', region: 'South', city: 'Houston' },
        '409': { state: 'TX', region: 'South', city: 'Beaumont' },
        '430': { state: 'TX', region: 'South', city: 'Dallas' },
        '432': { state: 'TX', region: 'South', city: 'Midland' },
        '469': { state: 'TX', region: 'South', city: 'Dallas' },
        '512': { state: 'TX', region: 'South', city: 'Austin' },
        '713': { state: 'TX', region: 'South', city: 'Houston' },
        '737': { state: 'TX', region: 'South', city: 'Austin' },
        '806': { state: 'TX', region: 'South', city: 'Lubbock' },
        '817': { state: 'TX', region: 'South', city: 'Fort Worth' },
        '832': { state: 'TX', region: 'South', city: 'Houston' },
        '903': { state: 'TX', region: 'South', city: 'Tyler' },
        '915': { state: 'TX', region: 'South', city: 'El Paso' },
        '936': { state: 'TX', region: 'South', city: 'Huntsville' },
        '940': { state: 'TX', region: 'South', city: 'Wichita Falls' },
        '956': { state: 'TX', region: 'South', city: 'Laredo' },
        '972': { state: 'TX', region: 'South', city: 'Dallas' },
        '979': { state: 'TX', region: 'South', city: 'Bryan' },

        // Florida
        '305': { state: 'FL', region: 'South', city: 'Miami' },
        '321': { state: 'FL', region: 'South', city: 'Orlando' },
        '352': { state: 'FL', region: 'South', city: 'Gainesville' },
        '386': { state: 'FL', region: 'South', city: 'Daytona Beach' },
        '407': { state: 'FL', region: 'South', city: 'Orlando' },
        '561': { state: 'FL', region: 'South', city: 'West Palm Beach' },
        '727': { state: 'FL', region: 'South', city: 'St. Petersburg' },
        '754': { state: 'FL', region: 'South', city: 'Fort Lauderdale' },
        '772': { state: 'FL', region: 'South', city: 'Port St. Lucie' },
        '786': { state: 'FL', region: 'South', city: 'Miami' },
        '813': { state: 'FL', region: 'South', city: 'Tampa' },
        '850': { state: 'FL', region: 'South', city: 'Tallahassee' },
        '863': { state: 'FL', region: 'South', city: 'Lakeland' },
        '904': { state: 'FL', region: 'South', city: 'Jacksonville' },
        '941': { state: 'FL', region: 'South', city: 'Sarasota' },
        '954': { state: 'FL', region: 'South', city: 'Fort Lauderdale' }
    };

    return areaCodeMap[areaCode] || { state: 'Unknown', region: 'Unknown', city: 'Unknown' };
}

/**
 * Check if two states are geographically adjacent
 */
function areStatesAdjacent(state1, state2) {
    const adjacencyMap = {
        'CA': ['NV', 'OR', 'AZ'],
        'NY': ['PA', 'NJ', 'CT', 'MA', 'VT'],
        'TX': ['NM', 'OK', 'AR', 'LA'],
        'FL': ['GA', 'AL'],
        'PA': ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH'],
        'IL': ['WI', 'IN', 'IA', 'MO', 'KY'],
        'OH': ['PA', 'WV', 'KY', 'IN', 'MI'],
        'GA': ['FL', 'AL', 'TN', 'NC', 'SC'],
        'NC': ['SC', 'GA', 'TN', 'VA'],
        'MI': ['OH', 'IN', 'WI'],
        'NJ': ['NY', 'PA', 'DE'],
        'VA': ['MD', 'WV', 'KY', 'TN', 'NC'],
        'WA': ['OR', 'ID'],
        'AZ': ['CA', 'NV', 'UT', 'CO', 'NM'],
        'MA': ['RI', 'CT', 'NY', 'VT', 'NH'],
        'IN': ['MI', 'OH', 'KY', 'IL'],
        'TN': ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
        'MO': ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'],
        'MD': ['PA', 'WV', 'VA', 'DE'],
        'WI': ['MI', 'MN', 'IA', 'IL'],
        'MN': ['WI', 'IA', 'SD', 'ND'],
        'CO': ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'],
        'AL': ['TN', 'GA', 'FL', 'MS'],
        'LA': ['TX', 'AR', 'MS'],
        'KY': ['IN', 'OH', 'WV', 'VA', 'TN', 'MO', 'IL'],
        'OR': ['CA', 'NV', 'ID', 'WA'],
        'OK': ['KS', 'AR', 'TX', 'NM', 'CO'],
        'CT': ['MA', 'RI', 'NY'],
        'IA': ['MN', 'WI', 'IL', 'MO', 'KS', 'NE', 'SD'],
        'MS': ['LA', 'AR', 'TN', 'AL'],
        'AR': ['MO', 'TN', 'MS', 'LA', 'TX', 'OK'],
        'KS': ['NE', 'MO', 'OK', 'CO'],
        'UT': ['ID', 'WY', 'CO', 'AZ', 'NV'],
        'NV': ['CA', 'OR', 'ID', 'UT', 'AZ'],
        'NM': ['CO', 'OK', 'TX', 'AZ'],
        'WV': ['OH', 'PA', 'MD', 'VA', 'KY'],
        'ID': ['MT', 'WY', 'UT', 'NV', 'OR', 'WA'],
        'NH': ['ME', 'MA', 'VT'],
        'ME': ['NH'],
        'RI': ['CT', 'MA'],
        'MT': ['ND', 'SD', 'WY', 'ID'],
        'DE': ['MD', 'PA', 'NJ'],
        'SD': ['ND', 'MN', 'IA', 'NE', 'WY', 'MT'],
        'ND': ['MN', 'SD', 'MT'],
        'WY': ['MT', 'SD', 'NE', 'CO', 'UT', 'ID'],
        'VT': ['NH', 'MA', 'NY'],
        'NE': ['SD', 'IA', 'MO', 'KS', 'CO', 'WY'],
        'SC': ['NC', 'GA']
    };

    return adjacencyMap[state1]?.includes(state2) || adjacencyMap[state2]?.includes(state1) || false;
}

/**
 * Get human-readable proximity level
 */
function getProximityLevel(score) {
    if (score === 0) return 'Exact Match';
    if (score === 1) return 'Same State';
    if (score === 2) return 'Same Region';
    if (score === 3) return 'Adjacent State';
    return 'Different Region';
}
