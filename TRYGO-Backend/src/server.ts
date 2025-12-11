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

app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

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
};

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

        console.log('⏰ Starting Agenda jobs...');
        await agenda.start();
        console.log('✅ Agenda started');

        console.log('📱 Initializing Telegram API...');
        TgApi.initialize();
        await agenda.every('0 0 * * *', 'sendDailyStatistic');
        console.log('✅ Telegram API initialized');

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
