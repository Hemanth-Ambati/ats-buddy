/* Amplify Params - DO NOT EDIT
   ENV
   REGION
   GEMINI_API_KEY
Amplify Params - DO NOT EDIT */

// ✅ CORRECT: Import the new SDK
const { GoogleGenAI } = require("@google/genai");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    // CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify('Hello from Lambda!'),
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        };
    }

    try {
        // --- 1. Parse Input ---
        let params;
        if (event.arguments) {
            params = event.arguments;
        } else if (event.body) {
            params = JSON.parse(event.body);
        } else {
            params = event;
        }

        const { prompt, schema, temperature } = params;

        // If schema is a string, parse it
        let parsedSchema = schema;
        if (typeof schema === 'string') {
            try {
                parsedSchema = JSON.parse(schema);
            } catch (e) {
                // Ignore, keep as is
            }
        }

        // --- 2. Initialize Client ---
        // ✅ CORRECT: New SDK initialization
        const ai = new GoogleGenAI({ apiKey });

        // --- 3. Prepare Config ---
        // ✅ CORRECT: In new SDK, 'generationConfig' is usually passed as 'config'
        let config = {
            temperature: temperature || 0.4,
        };

        if (parsedSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = parsedSchema;
            config.temperature = temperature || 0.2; // Lower temp for JSON
        }

        // --- 4. Call API ---
        // ✅ CORRECT: Call 'ai.models.generateContent' directly
        // ✅ CORRECT: Use 'contents' instead of 'prompt'
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Check if you have access to 2.5, otherwise stick to 1.5-flash
            contents: prompt,
            config: config
        });

        // --- 5. Extract Text ---
        // ✅ CORRECT: '.text' is a getter property in the new SDK, not a function
        const responseText = result.text;

        // --- 6. Return Response ---
        // For AppSync Direct Resolver (or if arguments are present), return value directly.
        // AppSync events typically have 'info' and 'arguments'. 
        // We check for 'arguments' because we used it earlier to parse params.
        if (event.info || event.arguments) {
            return responseText;
        }

        // For API Gateway
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(responseText),
        };

    } catch (error) {
        console.error("Gemini Proxy Error:", error);

        if (event.info) {
            // Throwing allows AppSync to see the error message in the GraphQL response
            throw new Error("Gemini Proxy Error: " + error.message);
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};