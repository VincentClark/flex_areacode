/**
 * Test Function for Area Code Serverless Functions
 * 
 * This function provides a way to test all the area code matching functionality
 * from a single endpoint. Useful for development and debugging.
 * 
 * Parameters:
 * - testType: Type of test to run (full-flow, lookup, proximity, utils, inventory, area-code-match)
 * - destinationNumber: Test destination number
 * - sourceAreaCode: Test source area code
 * - targetAreaCode: Test target area code
 * - areaCode: Area code to find best matching phone number for
 * 
 * Returns:
 * - Test results and function outputs
 */

const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

exports.handler = async function (context, event, callback) {
    const response = new Twilio.Response();

    // Set CORS headers
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.appendHeader('Content-Type', 'application/json'); try {
        const {
            testType = 'full-flow',
            destinationNumber = '+14155551234',
            sourceAreaCode = '415',
            targetAreaCode = '510',
            areaCode = '415'
        } = event;

        console.log(`Running test type: ${testType}`);

        let testResults = {};

        switch (testType) {
            case 'full-flow':
                testResults = await runFullFlowTest(context, destinationNumber);
                break;

            case 'lookup':
                testResults = await runLookupTest(context, targetAreaCode);
                break;

            case 'proximity':
                testResults = runProximityTest(sourceAreaCode, targetAreaCode);
                break;

            case 'utils':
                testResults = runUtilsTest(destinationNumber);
                break;

            case 'inventory':
                testResults = await runInventoryTest(context);
                break;

            case 'area-code-match':
                testResults = await runAreaCodeMatchTest(context, areaCode);
                break;

            default:
                response.setStatusCode(400);
                response.setBody(JSON.stringify({
                    success: false,
                    error: 'Invalid testType. Options: full-flow, lookup, proximity, utils, inventory, area-code-match'
                }));
                return callback(null, response);
        }

        response.setStatusCode(200);
        response.setBody(JSON.stringify({
            success: true,
            testType: testType,
            timestamp: new Date().toISOString(),
            results: testResults
        }));

        return callback(null, response);

    } catch (error) {
        console.error('Error in test function:', error);

        response.setStatusCode(500);
        response.setBody(JSON.stringify({
            success: false,
            error: 'Test execution failed',
            details: error.message
        }));

        return callback(null, response);
    }
};

/**
 * Test the full caller ID assignment flow
 */
async function runFullFlowTest(context, destinationNumber) {
    try {
        const client = context.getTwilioClient();

        // Parse destination number
        const parsed = parsePhoneNumber(destinationNumber, 'US');
        const targetAreaCode = parsed.nationalNumber.substring(0, 3);

        // Get phone number inventory
        const phoneNumbers = await client.incomingPhoneNumbers.list();

        // Score numbers (simplified version of assign-caller-id logic)
        const scoredNumbers = phoneNumbers
            .map(number => {
                try {
                    const phoneNumber = parsePhoneNumber(number.phoneNumber, 'US');
                    const areaCode = phoneNumber.nationalNumber.substring(0, 3);
                    const score = targetAreaCode === areaCode ? 0 : Math.abs(parseInt(targetAreaCode) - parseInt(areaCode));

                    return {
                        phoneNumber: number.phoneNumber,
                        areaCode: areaCode,
                        score: score,
                        matchType: targetAreaCode === areaCode ? 'Exact Match' : 'Proximity Match'
                    };
                } catch (error) {
                    return null;
                }
            })
            .filter(item => item !== null)
            .sort((a, b) => a.score - b.score)
            .slice(0, 5);

        return {
            destinationNumber: destinationNumber,
            targetAreaCode: targetAreaCode,
            inventorySize: phoneNumbers.length,
            recommendations: scoredNumbers,
            topRecommendation: scoredNumbers[0] || null
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Test area code lookup functionality
 */
async function runLookupTest(context, targetAreaCode) {
    try {
        const client = context.getTwilioClient();
        const phoneNumbers = await client.incomingPhoneNumbers.list();

        const matches = phoneNumbers
            .filter(number => {
                try {
                    const parsed = parsePhoneNumber(number.phoneNumber, 'US');
                    const areaCode = parsed.nationalNumber.substring(0, 3);
                    return areaCode === targetAreaCode;
                } catch (error) {
                    return false;
                }
            })
            .map(number => ({
                phoneNumber: number.phoneNumber,
                friendlyName: number.friendlyName
            }));

        return {
            targetAreaCode: targetAreaCode,
            totalInventory: phoneNumbers.length,
            exactMatches: matches.length,
            matches: matches.slice(0, 10) // Limit to 10 for display
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Test proximity calculation
 */
function runProximityTest(sourceAreaCode, targetAreaCode) {
    try {
        // Simple proximity calculation for testing
        const exactMatch = sourceAreaCode === targetAreaCode;
        const numericDistance = Math.abs(parseInt(sourceAreaCode) - parseInt(targetAreaCode));

        let proximityLevel;
        if (exactMatch) proximityLevel = 'Exact Match';
        else if (numericDistance <= 10) proximityLevel = 'Very Close';
        else if (numericDistance <= 50) proximityLevel = 'Close';
        else if (numericDistance <= 100) proximityLevel = 'Moderate';
        else proximityLevel = 'Distant';

        return {
            sourceAreaCode: sourceAreaCode,
            targetAreaCode: targetAreaCode,
            exactMatch: exactMatch,
            numericDistance: numericDistance,
            proximityLevel: proximityLevel,
            score: exactMatch ? 0 : numericDistance
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Test phone number utilities
 */
function runUtilsTest(phoneNumber) {
    try {
        const isValid = isValidPhoneNumber(phoneNumber, 'US');

        if (!isValid) {
            return {
                phoneNumber: phoneNumber,
                isValid: false,
                error: 'Invalid phone number format'
            };
        }

        const parsed = parsePhoneNumber(phoneNumber, 'US');
        const areaCode = parsed.nationalNumber.substring(0, 3);

        return {
            phoneNumber: phoneNumber,
            isValid: true,
            parsed: {
                e164: parsed.format('E.164'),
                national: parsed.format('NATIONAL'),
                international: parsed.format('INTERNATIONAL')
            },
            components: {
                areaCode: areaCode,
                exchange: parsed.nationalNumber.substring(3, 6),
                number: parsed.nationalNumber.substring(6),
                nationalNumber: parsed.nationalNumber
            },
            metadata: {
                country: parsed.country,
                countryCode: parsed.countryCallingCode,
                type: parsed.getType()
            }
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Test phone number inventory analysis
 */
async function runInventoryTest(context) {
    try {
        const client = context.getTwilioClient();
        const phoneNumbers = await client.incomingPhoneNumbers.list();

        // Analyze area code distribution
        const areaCodeCounts = {};
        const stateCounts = {};

        phoneNumbers.forEach(number => {
            try {
                const parsed = parsePhoneNumber(number.phoneNumber, 'US');
                const areaCode = parsed.nationalNumber.substring(0, 3);

                areaCodeCounts[areaCode] = (areaCodeCounts[areaCode] || 0) + 1;

                // Simple state mapping for major area codes
                const stateMap = {
                    '415': 'CA', '510': 'CA', '650': 'CA', '925': 'CA',
                    '212': 'NY', '646': 'NY', '718': 'NY', '917': 'NY',
                    '214': 'TX', '469': 'TX', '972': 'TX', '713': 'TX'
                };

                const state = stateMap[areaCode] || 'Other';
                stateCounts[state] = (stateCounts[state] || 0) + 1;

            } catch (error) {
                // Skip invalid numbers
            }
        });

        // Get top area codes
        const topAreaCodes = Object.entries(areaCodeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([areaCode, count]) => ({ areaCode, count }));

        return {
            totalNumbers: phoneNumbers.length,
            uniqueAreaCodes: Object.keys(areaCodeCounts).length,
            areaCodeDistribution: topAreaCodes,
            stateDistribution: stateCounts,
            sampleNumbers: phoneNumbers.slice(0, 5).map(n => ({
                phoneNumber: n.phoneNumber,
                friendlyName: n.friendlyName
            }))
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Test area code matching - find best phone number for a given area code
 */
async function runAreaCodeMatchTest(context, targetAreaCode) {
    try {
        const client = context.getTwilioClient();
        const phoneNumbers = await client.incomingPhoneNumbers.list();

        if (phoneNumbers.length === 0) {
            return {
                error: 'No phone numbers found in inventory'
            };
        }

        // Validate area code format
        if (!/^\d{3}$/.test(targetAreaCode)) {
            return {
                error: 'Area code must be a 3-digit number'
            };
        }

        console.log(`Finding best match for area code: ${targetAreaCode}`);

        // Enhanced area code data with geographic information
        const areaCodeData = {
            '415': { state: 'CA', region: 'West', city: 'San Francisco', timezone: 'America/Los_Angeles' },
            '510': { state: 'CA', region: 'West', city: 'Oakland', timezone: 'America/Los_Angeles' },
            '650': { state: 'CA', region: 'West', city: 'San Mateo', timezone: 'America/Los_Angeles' },
            '925': { state: 'CA', region: 'West', city: 'Concord', timezone: 'America/Los_Angeles' },
            '626': { state: 'CA', region: 'West', city: 'Pasadena', timezone: 'America/Los_Angeles' },
            '805': { state: 'CA', region: 'West', city: 'Santa Barbara', timezone: 'America/Los_Angeles' },
            '714': { state: 'CA', region: 'West', city: 'Anaheim', timezone: 'America/Los_Angeles' },
            '659': { state: 'CA', region: 'West', city: 'Alabama', timezone: 'America/Los_Angeles' },
            '734': { state: 'MI', region: 'Midwest', city: 'Ann Arbor', timezone: 'America/Detroit' },
            '212': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
            '646': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
            '718': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
            '917': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
            '214': { state: 'TX', region: 'South', city: 'Dallas', timezone: 'America/Chicago' },
            '469': { state: 'TX', region: 'South', city: 'Dallas', timezone: 'America/Chicago' },
            '972': { state: 'TX', region: 'South', city: 'Dallas', timezone: 'America/Chicago' },
            '713': { state: 'TX', region: 'South', city: 'Houston', timezone: 'America/Chicago' }
        };

        const targetRegion = areaCodeData[targetAreaCode] || {
            state: 'Unknown',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown'
        };

        // Score and rank phone numbers
        const scoredNumbers = phoneNumbers
            .map(number => {
                try {
                    const phoneNumber = parsePhoneNumber(number.phoneNumber, 'US');

                    if (!phoneNumber || !phoneNumber.nationalNumber) {
                        return null;
                    }

                    const areaCode = phoneNumber.nationalNumber.substring(0, 3);
                    const candidateRegion = areaCodeData[areaCode] || {
                        state: 'Unknown',
                        region: 'Unknown',
                        city: 'Unknown',
                        timezone: 'Unknown'
                    };

                    // Calculate comprehensive score
                    let score = 0;
                    let matchType = '';

                    if (targetAreaCode === areaCode) {
                        score = 0;
                        matchType = 'Exact Area Code Match';
                    } else if (targetRegion.state === candidateRegion.state) {
                        score = 10;
                        matchType = 'Same State';
                    } else if (targetRegion.region === candidateRegion.region) {
                        score = 20;
                        matchType = 'Same Region';
                    } else {
                        score = 50;
                        matchType = 'Different Region';
                    }

                    // Add numeric distance as tie-breaker
                    const numericDistance = Math.abs(parseInt(targetAreaCode) - parseInt(areaCode));
                    score += numericDistance / 1000;

                    return {
                        phoneNumber: number.phoneNumber,
                        friendlyName: number.friendlyName,
                        areaCode: areaCode,
                        score: score,
                        matchType: matchType,
                        region: candidateRegion,
                        numericDistance: numericDistance,
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
            .filter(item => item !== null)
            .sort((a, b) => a.score - b.score); // Lower score is better

        const bestMatch = scoredNumbers[0];
        const alternatives = scoredNumbers.slice(1, 6); // Top 5 alternatives

        return {
            targetAreaCode: targetAreaCode,
            targetRegion: targetRegion,
            totalInventory: phoneNumbers.length,
            recommendation: bestMatch ? {
                phoneNumber: bestMatch.phoneNumber,
                friendlyName: bestMatch.friendlyName,
                areaCode: bestMatch.areaCode,
                matchType: bestMatch.matchType,
                score: bestMatch.score,
                region: bestMatch.region,
                numericDistance: bestMatch.numericDistance,
                capabilities: bestMatch.capabilities,
                reasoning: getBestMatchReasoning(bestMatch, targetAreaCode, targetRegion)
            } : null,
            alternatives: alternatives.map(alt => ({
                phoneNumber: alt.phoneNumber,
                friendlyName: alt.friendlyName,
                areaCode: alt.areaCode,
                matchType: alt.matchType,
                score: alt.score,
                region: alt.region,
                numericDistance: alt.numericDistance
            })),
            summary: {
                exactMatches: scoredNumbers.filter(n => n.score === 0).length,
                sameStateMatches: scoredNumbers.filter(n => n.matchType === 'Same State').length,
                sameRegionMatches: scoredNumbers.filter(n => n.matchType === 'Same Region').length,
                differentRegionMatches: scoredNumbers.filter(n => n.matchType === 'Different Region').length
            }
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Generate reasoning for why a number was selected as the best match
 */
function getBestMatchReasoning(bestMatch, targetAreaCode, targetRegion) {
    if (bestMatch.score === 0) {
        return `Perfect match! This number has the exact same area code (${targetAreaCode}) as your target.`;
    }

    if (bestMatch.matchType === 'Same State') {
        return `Good match! While not the exact area code, this number is in the same state (${targetRegion.state}) which provides local presence.`;
    }

    if (bestMatch.matchType === 'Same Region') {
        return `Decent match! This number is in the same region (${targetRegion.region}) as your target area code.`;
    }

    return `Best available option. No numbers found in the same state or region, but this has the closest numeric area code (${bestMatch.numericDistance} difference).`;
}
