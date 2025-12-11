import { Agenda } from 'agenda';
import { connectMainDB } from './configuration/db';

// Initialize Agenda with MongoDB connection
const agenda = new Agenda({
    db: { address: process.env.MONGODB_URI || '', collection: 'agendaJobs' },
    processEvery: '30 seconds',
});

// Define job handlers
agenda.define('sendDailyStatistic', async (job: any) => {
    try {
        console.log('Running daily statistic job...');
        // Job logic will be handled by jobs/definitions/statisticDefinitions.ts
        // This is just a placeholder to prevent errors
        await job.touch(); // Keep job alive
    } catch (error: any) {
        console.error('Error in sendDailyStatistic job:', error);
        throw error;
    }
});

// Handle graceful shutdown
const graceful = async () => {
    await agenda.stop();
    console.log('Agenda stopped');
    process.exit(0);
};

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

export default agenda;

