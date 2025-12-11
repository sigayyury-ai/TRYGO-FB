import Agenda from 'agenda';
import allDefinitions from './definitions';

// establised a connection to our mongoDB database.
const connectionOpts = {
    db: { address: process.env.MONGO_URI!, collection: 'agendaJobs' },
};

const agenda = new Agenda(connectionOpts);

agenda
    .on('ready', () => console.log('Agenda started!'))
    .on('error', () => console.log('Agenda connection error!'));

allDefinitions(agenda);
// logs all registered jobs
console.log({ jobs: agenda._definitions });

export default agenda;
