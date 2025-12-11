import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { ApolloServer } from '@apollo/server';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectMainDB } from './configuration/db';
// import imageRoutes from './routes/imageRoutes';
// import fileRoutes from './routes/fileRoutes';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expressMiddleware } from '@apollo/server/express4';
import { createServer } from 'http';
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
app.get('/', (_req, res) => {
    res.status(200).json({ 
        status: 'ok',
        service: 'trygo-main-backend',
        timestamp: new Date().toISOString()
    });
});

app.head('/', (_req, res) => {
    res.status(200).end();
});

app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

app.use(bodyParser.json());

const httpServer = createServer(app);

const typeDefs = loadGraphQLFiles();

const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
        Query: { ...resolversArray.Query },
        Mutation: { ...resolversArray.Mutation },
    },
});

const corsOptions = {
    origin: config.isCorsEnabled ? config.PRODUCTION_PORTS : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-project-id', 'x-hypothesis-id', 'x-user-id'],
};

if (config.isCorsEnabled) {
    console.log('🌐 CORS enabled for origins:', config.PRODUCTION_PORTS);
    console.log('🌐 CORS_ENABLED:', process.env.CORS_ENABLED);
    console.log('🌐 FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('🌐 DEVELOPMENT_FRONTEND_URL:', process.env.DEVELOPMENT_FRONTEND_URL);
    console.log('🌐 PRODUCTION_FRONTEND_URL:', process.env.PRODUCTION_FRONTEND_URL);
} else {
    console.log('🌐 CORS enabled for all origins (*)');
}

app.use(cors(corsOptions));

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
        ApolloServerPluginDrainHttpServer({ httpServer })
    ],
});

async function startServer() {
    try {
        console.log('🚀 Starting server...');
        
        console.log('📊 Starting Apollo Server...');
        await server.start();
        console.log('✅ Apollo Server started');

        console.log('🔌 Connecting to MongoDB...');
        await connectMainDB();
        console.log('✅ MongoDB connected');

        console.log('📝 Setting up GraphQL middleware...');
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
        console.log('✅ GraphQL middleware set up');

        console.log('🖼️ Setting up routes...');
        // Images API routes
        app.use('/api/images', imagesRouter);
        // Clusters REST API routes (from semantics-service)
        const clustersRouter = await import('./routes/clusters');
        app.use('/api/clusters', clustersRouter.default);
        // Website Pages API routes (from website-pages-service)
        const websitePagesRouter = await import('./routes/websitePages');
        app.use('/api/website-pages', websitePagesRouter.default);
        // AWS routes disabled - not needed
        // app.use('/image', imageRoutes);
        // app.use('/file', fileRoutes);
        console.log('✅ Routes set up');

        // 404 handler for unknown routes (skip health check and root paths)
        app.use((req, res) => {
            // Don't log health check requests as warnings
            if (req.path !== '/health' && req.path !== '/') {
                console.warn(`⚠️  404: ${req.method} ${req.path}`);
            }
            res.status(404).json({ 
                error: 'Not Found', 
                path: req.path,
                method: req.method 
            });
        });

        console.log('⏰ Starting Agenda jobs...');
        // Start agenda asynchronously to not block server startup
        agenda.start().then(() => {
            console.log('✅ Agenda started');
        }).catch((error) => {
            console.error('❌ Error starting Agenda:', error);
            // Don't block server startup if Agenda fails
        });
        // Don't await - let server start immediately
        console.log('✅ Agenda initialization started (non-blocking)');

        // Telegram инициализация опциональна
        if (config.TG_STATISTICS.TOKEN && config.TG_STATISTICS.ENABLED !== 'false') {
            console.log('📱 Initializing Telegram API...');
            TgApi.initialize();
            await agenda.every('0 0 * * *', 'sendDailyStatistic');
            console.log('✅ Telegram API initialized');
        } else {
            console.log('⏭️  Telegram API skipped (not configured)');
        }

        console.log('🔌 Setting up Socket.io...');
        setupSocketIOServer(httpServer);
        console.log('✅ Socket.io set up');
        
        console.log(`🌐 Starting HTTP server on port ${PORT}...`);
        httpServer.listen(PORT, () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
            console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
        });
    } catch (error: any) {
        console.error('❌ Error starting server:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

startServer().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
