import dotenv from 'dotenv';
dotenv.config();

// Global error handlers to prevent crashes
process.on('uncaughtException', (error: Error) => {
    console.error('❌ [UNCAUGHT_EXCEPTION] Fatal error:', error);
    console.error('Stack:', error.stack);
    // In development, log and continue. In production, you might want to exit
    // But even in production, try to keep server running for critical services
    if (process.env.NODE_ENV === 'production') {
        // Give some time for logs to be written
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('❌ [UNHANDLED_REJECTION] Unhandled promise rejection:', reason);
    if (reason instanceof Error) {
        console.error('Stack:', reason.stack);
    }
    // Log but don't exit - allow server to continue running
    // This is critical - many async operations can fail without killing the server
});

import express from 'express';
import { ApolloServer } from '@apollo/server';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectMainDB } from './configuration/db';
// import imageRoutes from './routes/imageRoutes';
// import fileRoutes from './routes/fileRoutes';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expressMiddleware } from '@apollo/server/express4';
import { createServer, Server } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { resolversArray } from './resolvers/_indexResolvers';
import { loadGraphQLFiles } from './utils';
import { config } from './constants/config/env';
import agenda from './jobs';
import { stripeWebhook } from './utils/subscription/stripeWebhook';
import { TgApi } from './managers/tg/TgApi';
import userService from './services/UserService';
import authService from './services/AuthService';
import SentryErrHandler from './errors/sentryErrHandler';
import { sendErrorToTg } from './utils/sendErrorToTg';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import { setupSocketIOServer } from './utils/socketIO/setupSocketIOServer';
import imagesRouter from './routes/images';

const app = express();
const PORT = process.env.PORT || 5001; // Changed from 4000 to avoid conflicts with SEO Agent backend (4100) and macOS ControlCenter (5000)

// Create HTTP server instance (will be assigned in startServer)
let httpServer: Server | null = null;

// Health check endpoint - must respond quickly for Render
// This allows Render to verify the service is up before full initialization
app.get('/health', (_req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.head('/health', (_req, res) => {
    res.status(200).end();
});

// Also support OPTIONS for CORS preflight
app.options('/health', (_req, res) => {
    res.status(200).end();
});

// Root endpoint - some health checks use root path
app.get('/', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ [ROOT_ENDPOINT] GET / - OK`);
    res.status(200).json({ 
        status: 'ok',
        service: 'trygo-main-backend',
        timestamp: timestamp,
        path: req.path || '/'
    });
});

app.head('/', (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ [ROOT_ENDPOINT] HEAD / - OK`);
    res.status(200).end();
});

app.options('/', (_req, res) => {
    res.status(200).end();
});

app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

app.use(bodyParser.json());

// CORS must be set up early, before other middleware
// For production on Render, if CORS origins are empty, allow all origins as fallback
const corsOrigins = config.isCorsEnabled && config.PRODUCTION_PORTS.length > 0 
    ? config.PRODUCTION_PORTS 
    : '*';

const corsOptions = {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-project-id', 'x-hypothesis-id', 'x-user-id'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Detailed CORS logging for debugging
console.log('🌐 [CORS_CONFIG] CORS_ENABLED:', process.env.CORS_ENABLED);
console.log('🌐 [CORS_CONFIG] FRONTEND_URL:', process.env.FRONTEND_URL || '(not set)');
console.log('🌐 [CORS_CONFIG] DEVELOPMENT_FRONTEND_URL:', process.env.DEVELOPMENT_FRONTEND_URL || '(not set)');
console.log('🌐 [CORS_CONFIG] PRODUCTION_FRONTEND_URL:', process.env.PRODUCTION_FRONTEND_URL || '(not set)');
console.log('🌐 [CORS_CONFIG] PRODUCTION_PORTS array:', config.PRODUCTION_PORTS);
console.log('🌐 [CORS_CONFIG] Final CORS origins:', corsOrigins);
if (config.isCorsEnabled && config.PRODUCTION_PORTS.length === 0) {
    console.warn('⚠️  [CORS_CONFIG] CORS_ENABLED=true but no origins configured! Using * as fallback');
}

// Apply CORS middleware early
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

httpServer = createServer(app);

const typeDefs = loadGraphQLFiles();

const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
        Query: { ...resolversArray.Query },
        Mutation: { ...resolversArray.Mutation },
    },
});


// Static file serving for generated images (before GraphQL middleware)
app.use('/media', express.static('./storage'));

const server = new ApolloServer({
    schema,
    formatError: (error) => {
        const formattedError = SentryErrHandler.formatGraphQLError(error);
        sendErrorToTg(formattedError);

        return error;
    },
    plugins: [
        config.isProductionMode
            ? ApolloServerPluginLandingPageProductionDefault({
                  graphRef: 'my-graph-id@my-graph-variant',
                  footer: false,
              })
            : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
        ApolloServerPluginDrainHttpServer({ httpServer: httpServer! })
    ],
});

// Helper function for structured logging
const logStep = (step: string, status: 'start' | 'success' | 'error', details?: string) => {
    const timestamp = new Date().toISOString();
    const emoji = status === 'start' ? '🔄' : status === 'success' ? '✅' : '❌';
    const message = `[${timestamp}] ${emoji} [${step}] ${status.toUpperCase()}${details ? `: ${details}` : ''}`;
    
    if (status === 'error') {
        console.error(message);
    } else {
        console.log(message);
    }
};

async function startServer() {
    const startTime = Date.now();
    
    try {
        logStep('SERVER_STARTUP', 'start', 'Initializing server...');
        
        logStep('APOLLO_SERVER', 'start', 'Starting Apollo Server...');
        try {
            await server.start();
            logStep('APOLLO_SERVER', 'success', 'Apollo Server started');
        } catch (error: any) {
            logStep('APOLLO_SERVER', 'error', `Failed to start: ${error.message}`);
            console.error('Apollo Server startup error:', error);
            throw error; // Apollo Server is critical - fail if it can't start
        }

        logStep('MONGODB_CONNECTION', 'start', 'Connecting to MongoDB...');
        try {
            await connectMainDB();
            logStep('MONGODB_CONNECTION', 'success', 'MongoDB connected');
        } catch (error: any) {
            logStep('MONGODB_CONNECTION', 'error', `Failed to connect: ${error.message}`);
            console.error('MongoDB connection failed:', error);
            // In development, allow server to start even if MongoDB fails (for testing)
            // In production, this should be fatal
            if (process.env.NODE_ENV === 'production') {
                throw error;
            } else {
                console.warn('⚠️  Continuing without MongoDB connection (development mode)');
            }
        }

        logStep('GRAPHQL_MIDDLEWARE', 'start', 'Setting up GraphQL middleware...');
        app.use(
            '/graphql',
            expressMiddleware(server, {
                context: async ({ req }) => {
                    let userId = null;

                    const token = req.headers.authorization
                        ? req.headers.authorization.split(' ')[1]
                        : '';

                    if (token) {
                        userId = authService.getUserIdFromToken(token);
                    }

                    return {
                        token,
                        userId,
                    };
                },
            })
        );
        logStep('GRAPHQL_MIDDLEWARE', 'success', 'GraphQL middleware set up');

        logStep('ROUTES_SETUP', 'start', 'Setting up routes...');
        // Images API routes
        app.use('/api/images', imagesRouter);
        // Clusters REST API routes (from semantics-service)
        const clustersRouter = await import('./routes/clusters');
        app.use('/api/clusters', clustersRouter.default);
        // Website Pages API routes (from website-pages-service)
        const websitePagesRouter = await import('./routes/websitePages');
        app.use('/api/website-pages', websitePagesRouter.default);
        logStep('ROUTES_SETUP', 'success', 'Routes set up');

        // 404 handler for unknown routes (skip health check and root paths)
        app.use((req, res) => {
            const path = req.path || req.url || '/';
            // Don't log health check requests as warnings
            if (path !== '/health' && path !== '/') {
                logStep('404_NOT_FOUND', 'error', `${req.method} ${path || '(empty)'}`);
            }
            res.status(404).json({ 
                error: 'Not Found', 
                path: path,
                method: req.method,
                url: req.url
            });
        });

        logStep('AGENDA_JOBS', 'start', 'Starting Agenda jobs...');
        // Start agenda asynchronously to not block server startup
        agenda.start().then(() => {
            logStep('AGENDA_JOBS', 'success', 'Agenda started');
        }).catch((error) => {
            logStep('AGENDA_JOBS', 'error', `Error: ${error.message}`);
            // Don't block server startup if Agenda fails
        });
        // Don't await - let server start immediately
        logStep('AGENDA_JOBS', 'success', 'Agenda initialization started (non-blocking)');

        // Telegram инициализация опциональна
        if (config.TG_STATISTICS.TOKEN && config.TG_STATISTICS.ENABLED !== 'false') {
            logStep('TELEGRAM_API', 'start', 'Initializing Telegram API...');
            TgApi.initialize();
            await agenda.every('0 0 * * *', 'sendDailyStatistic');
            logStep('TELEGRAM_API', 'success', 'Telegram API initialized');
        } else {
            logStep('TELEGRAM_API', 'success', 'Skipped (not configured)');
        }

        logStep('SOCKET_IO', 'start', 'Setting up Socket.io...');
        try {
            await setupSocketIOServer(httpServer);
            logStep('SOCKET_IO', 'success', 'Socket.io set up');
        } catch (error: any) {
            logStep('SOCKET_IO', 'error', `Failed to setup Socket.io: ${error.message}`);
            console.error('Socket.io setup error:', error);
            // Don't block server startup if Socket.io fails
        }
        
        logStep('HTTP_SERVER', 'start', `Starting HTTP server on port ${PORT}...`);
        if (!httpServer) {
            throw new Error('HTTP server not initialized');
        }
        httpServer.listen(PORT, () => {
            const startupTime = Date.now() - startTime;
            logStep('HTTP_SERVER', 'success', `Server is running on http://localhost:${PORT}`);
            logStep('SERVER_STARTUP', 'success', `Server fully started in ${startupTime}ms`);
            console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📊 Root endpoint: http://localhost:${PORT}/`);
        }).on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                logStep('HTTP_SERVER', 'error', `Port ${PORT} is already in use. Please stop the existing server or use a different port.`);
                console.error(`❌ Port ${PORT} is already in use.`);
                console.error(`💡 Try: lsof -ti:${PORT} | xargs kill -9`);
                console.error(`💡 Or use: ./start-server-safe.sh`);
                console.error(`💡 Or change PORT in .env file`);
            } else {
                logStep('HTTP_SERVER', 'error', `Failed to start server: ${error.message}`);
                console.error('❌ Server error:', error);
                console.error('Error code:', error.code);
                console.error('Error stack:', error.stack);
            }
            // Exit after a delay to allow logs to be written
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });
    } catch (error: any) {
        const startupTime = Date.now() - startTime;
        logStep('SERVER_STARTUP', 'error', `Failed after ${startupTime}ms: ${error.message}`);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
        // Stop accepting new connections
        if (httpServer) {
            httpServer.close(() => {
                console.log('✅ HTTP server closed');
            });
        }
        
        // Stop Agenda jobs
        await agenda.stop();
        console.log('✅ Agenda jobs stopped');
        
        // Close MongoDB connection
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState === 1) {
            await mongoose.default.connection.close();
            console.log('✅ MongoDB connection closed');
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
startServer().catch((error) => {
    console.error('❌ Fatal error during startup:', error);
    if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    // Give time for logs to be written before exiting
    setTimeout(() => {
        process.exit(1);
    }, 2000);
});
