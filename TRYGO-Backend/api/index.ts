// Vercel Serverless Function adapter for Express + Apollo Server
// This file adapts the Express app to work with Vercel's serverless functions

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectMainDB } from '../src/configuration/db';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expressMiddleware } from '@apollo/server/express4';
import { resolversArray } from '../src/resolvers/_indexResolvers';
import { config } from '../src/constants/config/env';
// Import loadGraphQLFiles with proper path resolution
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import path from 'path';

// Load GraphQL files with absolute path
function loadGraphQLFiles() {
    const graphqlFilesPath = path.join(process.cwd(), 'src/typeDefs');
    const loadedFiles = loadFilesSync(`${graphqlFilesPath}/**/*.graphql`);
    return mergeTypeDefs(loadedFiles);
}
import { stripeWebhook } from '../src/utils/subscription/stripeWebhook';
import authService from '../src/services/AuthService';
import SentryErrHandler from '../src/errors/sentryErrHandler';
import { sendErrorToTg } from '../src/utils/sendErrorToTg';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import imagesRouter from '../src/routes/images';

// Initialize Express app
const app = express();

// CORS configuration for Vercel
const corsOptions = {
    origin: config.isCorsEnabled && config.PRODUCTION_PORTS.length > 0 
        ? config.PRODUCTION_PORTS 
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-project-id', 'x-hypothesis-id', 'x-user-id'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(bodyParser.json());

// Health check endpoints
app.get('/health', (_req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        platform: 'vercel'
    });
});

app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        service: 'trygo-main-backend',
        timestamp: new Date().toISOString(),
        platform: 'vercel',
        path: req.path || '/'
    });
});

// Stripe webhook
app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

// Static file serving for generated images
// Note: In Vercel serverless, static files should be served from a CDN (S3, etc.)
// This is a placeholder - actual storage should be configured via environment variables
// app.use('/media', express.static('./storage'));

// GraphQL setup
const typeDefs = loadGraphQLFiles();
const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
        Query: { ...resolversArray.Query },
        Mutation: { ...resolversArray.Mutation },
    },
});

// Apollo Server instance (will be initialized on first request)
let apolloServer: ApolloServer | null = null;
let isInitialized = false;

async function initializeApolloServer() {
    if (isInitialized && apolloServer) {
        return apolloServer;
    }

    // Connect to MongoDB
    try {
        await connectMainDB();
        console.log('✅ MongoDB connected');
    } catch (error: any) {
        console.error('❌ MongoDB connection failed:', error.message);
        // In production, this should be handled gracefully
    }

    // Create Apollo Server
    apolloServer = new ApolloServer({
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
        ],
    });

    await apolloServer.start();
    
    // Setup GraphQL middleware
    app.use(
        '/graphql',
        expressMiddleware(apolloServer, {
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

    // Setup API routes
    app.use('/api/images', imagesRouter);
    
    // Clusters REST API routes
    const clustersRouter = await import('../src/routes/clusters');
    app.use('/api/clusters', clustersRouter.default);
    
    // Website Pages API routes
    const websitePagesRouter = await import('../src/routes/websitePages');
    app.use('/api/website-pages', websitePagesRouter.default);

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ 
            error: 'Not Found', 
            path: req.path,
            method: req.method
        });
    });

    isInitialized = true;
    return apolloServer;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Initialize Apollo Server on first request
        await initializeApolloServer();
        
        // Convert Vercel request/response to Express format
        return new Promise<void>((resolve, reject) => {
            // Handle the request with Express app
            app(req as any, res as any, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (error: any) {
        console.error('❌ Vercel handler error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: error.message 
        });
    }
}
