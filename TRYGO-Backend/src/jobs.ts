import { Agenda } from 'agenda';
import { connectMainDB } from './configuration/db';

// Initialize Agenda with MongoDB connection
const agenda = new Agenda({
    db: { address: process.env.MONGODB_URI || process.env.MONGO_URI || '', collection: 'agendaJobs' },
    processEvery: '30 seconds',
});

// Define job handlers
agenda.define('sendDailyStatistic', async (job: any) => {
    console.log('Running daily statistic job...');
    // Add your job logic here
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

