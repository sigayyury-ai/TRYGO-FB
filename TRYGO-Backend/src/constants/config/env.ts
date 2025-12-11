export const config = {
    isProduction: process.env.NODE_ENV === 'production',

    isProductionMode: process.env.PRODUCTION_MODE === 'true',

    isCorsEnabled: process.env.CORS_ENABLED === 'true',

    PRODUCTION_PORTS: [
        process.env.DEVELOPMENT_FRONTEND_URL!,
        process.env.PRODUCTION_FRONTEND_URL!,
    ],

    MAIL_TRAP: {
        apiKey: process.env.MAILT_API_KEY || '',
        emailAddress: process.env.MAILT_EMAIL_ADDRESS || '',
        fromName: process.env.MAILT_FROM_NAME || '',
    },

    BOUNCER_CHECK_API_KEY: process.env.BOUNCER_CHECK_API_KEY || '',

    GOOGLE_AUTH_CLIENT_ID: process.env.GOOGLE_AUTH_CLIENT_ID!,
    GOOGLE_AUTH_CLIENT_SECRET: process.env.GOOGLE_AUTH_CLIENT_SECRET!,

    // AWS отключен - не нужен пока
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    AWS_REGION: process.env.AWS_REGION || '',
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    STRIPE_STARTER_MONTHLY_PRICE_ID: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

    // Telegram отключен - не нужен пока
    TG_STATISTICS: {
        CHAT_ID: process.env.TG_CHAT_ID_STATISTICS || '',
        ERROR_CHAT_ID: process.env.TG_CHAT_ID_ERROR || '',
        TOKEN: process.env.TG_TOKEN_STATISTICS || '',
        ENABLED: process.env.TG_ENABLED || 'false',
    },

    IMAGE_CONFIG: {
        provider: (process.env.IMAGE_PROVIDER || "gemini") as "gemini",
        geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-generate-001",
        geminiApiBaseUrl: process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
        publicUrl: (process.env.PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:5001").replace(/\/$/, ""),
        storageRoot: process.env.STORAGE_ROOT || "./storage"
    },

    // SEO Agent configuration (integrated from backend service)
    SEO_AGENT: {
        openAiApiKey: process.env.OPENAI_API_KEY,
        openAiModel: process.env.OPENAI_MODEL || "gpt-4o",
        geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
        googleApiKey: process.env.GOOGLE_API_KEY,
        wordpressBaseUrl: process.env.WORDPRESS_BASE_URL,
        wordpressUsername: process.env.WORDPRESS_USERNAME,
        wordpressAppPassword: process.env.WORDPRESS_APP_PASSWORD
        // websitePagesServiceUrl removed - service integrated into TRYGO-Backend
    },
};
