/**
 * Response Utility Functions
 * 
 * Helper functions to properly format Twilio Serverless responses
 * with JSON stringification and proper headers.
 */

function createSuccessResponse(response, data, statusCode = 200) {
    response.setStatusCode(statusCode);
    response.appendHeader('Content-Type', 'application/json');
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    response.setBody(JSON.stringify({
        success: true,
        ...data
    }));

    return response;
}

function createErrorResponse(response, error, statusCode = 400, details = null) {
    response.setStatusCode(statusCode);
    response.appendHeader('Content-Type', 'application/json');
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    const errorBody = {
        success: false,
        error: error
    };

    if (details) {
        errorBody.details = details;
    }

    response.setBody(JSON.stringify(errorBody));

    return response;
}

module.exports = {
    createSuccessResponse,
    createErrorResponse
};
