import { TgApi } from './TgApi';

class TgManager {
    start(): void {
        TgApi.initialize();
    }
}

const tgManager = new TgManager();
export default tgManager;
