    import Agenda from 'agenda';

import statisticDefinitions from './statisticDefinitions';
import hypothesesPersonProfileDefinitions from './hypothesesPersonProfileDefinitions';

const definitions = [statisticDefinitions, hypothesesPersonProfileDefinitions];

const allDefinitions = (agenda: Agenda) => {
    definitions.forEach((definition) => definition(agenda));
};

export default allDefinitions;
