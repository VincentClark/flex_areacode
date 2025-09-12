/**
 * Phone Number Utilities
 * 
 * Utility functions for phone number validation, formatting, and processing
 * used across the area code matching serverless functions.
 * 
 * Parameters:
 * - phoneNumber: Phone number to process
 * - action: The utility action to perform (validate, format, extract-area-code, normalize)
 * - format: Output format for formatting (e164, national, international)
 * 
 * Returns:
 * - Processed phone number data or validation results
 */

const { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode } = require('libphonenumber-js');

exports.handler = async function (context, event, callback) {
    const response = new Twilio.Response();

    // Set CORS headers
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

    try {
        const { phoneNumber, action = 'validate', format = 'e164' } = event;

        if (!phoneNumber) {
            response.setStatusCode(400);
            response.setBody(JSON.stringify({
                success: false,
                error: 'phoneNumber parameter is required'
            }));
            return callback(null, response);
        }

        let result = {};

        switch (action) {
            case 'validate':
                result = validatePhoneNumber(phoneNumber);
                break;

            case 'format':
                result = formatPhoneNumber(phoneNumber, format);
                break;

            case 'extract-area-code':
                result = extractAreaCode(phoneNumber);
                break;

            case 'normalize':
                result = normalizePhoneNumber(phoneNumber);
                break;

            case 'analyze':
                result = analyzePhoneNumber(phoneNumber);
                break;

            default:
                response.setStatusCode(400);
                response.setBody(JSON.stringify({
                    success: false,
                    error: 'Invalid action. Supported actions: validate, format, extract-area-code, normalize, analyze'
                }));
                return callback(null, response);
        }

        response.setStatusCode(200);
        response.setBody(JSON.stringify({
            success: true,
            action: action,
            input: phoneNumber,
            result: result
        }));

        return callback(null, response);

    } catch (error) {
        console.error('Error in phone number utilities:', error);

        response.setStatusCode(500);
        response.setBody(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }));

        return callback(null, response);
    }
};

/**
 * Validate a phone number
 */
function validatePhoneNumber(phoneNumber) {
    try {
        const isValid = isValidPhoneNumber(phoneNumber, 'US');

        if (!isValid) {
            return {
                isValid: false,
                error: 'Invalid phone number format'
            };
        }

        const parsed = parsePhoneNumber(phoneNumber, 'US');

        return {
            isValid: true,
            isPossible: parsed.isPossible(),
            isValid: parsed.isValid(),
            country: parsed.country,
            countryCode: parsed.countryCallingCode,
            nationalNumber: parsed.nationalNumber,
            type: parsed.getType()
        };

    } catch (error) {
        return {
            isValid: false,
            error: error.message
        };
    }
}

/**
 * Format a phone number in different formats
 */
function formatPhoneNumber(phoneNumber, format) {
    try {
        const parsed = parsePhoneNumber(phoneNumber, 'US');

        if (!parsed.isValid()) {
            return {
                error: 'Invalid phone number - cannot format'
            };
        }

        let formatted;

        switch (format.toLowerCase()) {
            case 'e164':
                formatted = parsed.format('E.164');
                break;

            case 'national':
                formatted = parsed.format('NATIONAL');
                break;

            case 'international':
                formatted = parsed.format('INTERNATIONAL');
                break;

            case 'rfc3966':
                formatted = parsed.format('RFC3966');
                break;

            default:
                formatted = parsed.format('E.164');
        }

        return {
            original: phoneNumber,
            formatted: formatted,
            format: format,
            nationalNumber: parsed.nationalNumber,
            countryCode: parsed.countryCallingCode
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Extract area code from a phone number
 */
function extractAreaCode(phoneNumber) {
    try {
        const parsed = parsePhoneNumber(phoneNumber, 'US');

        if (!parsed.isValid()) {
            return {
                error: 'Invalid phone number - cannot extract area code'
            };
        }

        const nationalNumber = parsed.nationalNumber;
        const areaCode = nationalNumber.substring(0, 3);

        return {
            areaCode: areaCode,
            exchange: nationalNumber.substring(3, 6),
            number: nationalNumber.substring(6),
            fullNational: nationalNumber,
            formatted: `(${areaCode}) ${nationalNumber.substring(3, 6)}-${nationalNumber.substring(6)}`
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Normalize a phone number to a consistent format
 */
function normalizePhoneNumber(phoneNumber) {
    try {
        // Remove all non-digit characters first
        const digitsOnly = phoneNumber.replace(/\D/g, '');

        // Handle different input formats
        let normalizedInput = phoneNumber;

        if (digitsOnly.length === 10) {
            // US number without country code
            normalizedInput = `+1${digitsOnly}`;
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
            // US number with country code but no +
            normalizedInput = `+${digitsOnly}`;
        } else if (!phoneNumber.startsWith('+')) {
            // Add + if missing
            normalizedInput = `+${digitsOnly}`;
        }

        const parsed = parsePhoneNumber(normalizedInput, 'US');

        if (!parsed.isValid()) {
            return {
                error: 'Cannot normalize invalid phone number'
            };
        }

        return {
            original: phoneNumber,
            normalized: parsed.format('E.164'),
            national: parsed.format('NATIONAL'),
            international: parsed.format('INTERNATIONAL'),
            nationalNumber: parsed.nationalNumber,
            countryCode: parsed.countryCallingCode
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Comprehensive phone number analysis
 */
function analyzePhoneNumber(phoneNumber) {
    try {
        const validation = validatePhoneNumber(phoneNumber);

        if (!validation.isValid) {
            return validation;
        }

        const parsed = parsePhoneNumber(phoneNumber, 'US');
        const areaCodeInfo = extractAreaCode(phoneNumber);
        const formatting = formatPhoneNumber(phoneNumber, 'e164');

        return {
            validation: validation,
            formatting: {
                e164: parsed.format('E.164'),
                national: parsed.format('NATIONAL'),
                international: parsed.format('INTERNATIONAL'),
                rfc3966: parsed.format('RFC3966')
            },
            components: areaCodeInfo,
            metadata: {
                country: parsed.country,
                countryCode: parsed.countryCallingCode,
                type: parsed.getType(),
                isPossible: parsed.isPossible(),
                isValid: parsed.isValid(),
                uri: parsed.getURI()
            },
            geographic: getGeographicInfo(areaCodeInfo.areaCode)
        };

    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Get geographic information for an area code
 */
function getGeographicInfo(areaCode) {
    const areaCodeData = {
        '415': { state: 'CA', region: 'West', city: 'San Francisco', timezone: 'America/Los_Angeles' },
        '510': { state: 'CA', region: 'West', city: 'Oakland', timezone: 'America/Los_Angeles' },
        '650': { state: 'CA', region: 'West', city: 'San Mateo', timezone: 'America/Los_Angeles' },
        '925': { state: 'CA', region: 'West', city: 'Concord', timezone: 'America/Los_Angeles' },
        '212': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
        '646': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
        '718': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
        '917': { state: 'NY', region: 'Northeast', city: 'New York', timezone: 'America/New_York' },
        '214': { state: 'TX', region: 'South', city: 'Dallas', timezone: 'America/Chicago' },
        '469': { state: 'TX', region: 'South', city: 'Dallas', timezone: 'America/Chicago' },
        '972': { state: 'TX', region: 'South', city: 'Dallas', timezone: 'America/Chicago' },
        '713': { state: 'TX', region: 'South', city: 'Houston', timezone: 'America/Chicago' },
        '281': { state: 'TX', region: 'South', city: 'Houston', timezone: 'America/Chicago' },
        '832': { state: 'TX', region: 'South', city: 'Houston', timezone: 'America/Chicago' }
    };

    return areaCodeData[areaCode] || {
        state: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown'
    };
}
