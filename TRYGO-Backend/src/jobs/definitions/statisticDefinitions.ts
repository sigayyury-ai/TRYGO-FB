import Agenda from 'agenda';
import { sendDailyStatistic } from '../../utils/statistic/sendDailyStatistic';

const statisticDefinitions = (agenda: Agenda) => {
    agenda.define('sendDailyStatistic', async () => {
        try {
            await sendDailyStatistic();
        } catch (err) {
            console.error(err);
        }
    });
};

export default statisticDefinitions;
