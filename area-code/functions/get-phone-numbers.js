const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

exports.handler = async function (context, event, callback) {
    const response = new Twilio.Response();

    // Set CORS headers
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.appendHeader('Content-Type', 'application/json');

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return callback(null, response);
    }

    try {
        console.log('📞 Fetching phone numbers from account...');

        // Fetch all phone numbers from the account
        const phoneNumbers = await client.incomingPhoneNumbers.list();

        // Format the phone numbers for the CallerIdSelector
        const formattedNumbers = phoneNumbers.map(number => ({
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName || number.phoneNumber,
            sid: number.sid
        }));

        console.log(`✅ Found ${formattedNumbers.length} phone numbers`);

        response.setBody({
            success: true,
            phoneNumbers: formattedNumbers,
            count: formattedNumbers.length,
            timestamp: new Date().toISOString()
        });

        return callback(null, response);

    } catch (error) {
        console.error('❌ Error fetching phone numbers:', error);

        response.setBody({
            success: false,
            error: 'Failed to fetch phone numbers',
            details: error.message,
            timestamp: new Date().toISOString()
        });

        return callback(null, response);
    }
};
