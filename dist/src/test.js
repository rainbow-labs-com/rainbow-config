import path from "path";
import RainbowConfig from "../index.js";
import { URL } from 'url';
(async () => {
    const config = new RainbowConfig();
    const rootDir = path.join(path.dirname(new URL(import.meta.url).pathname), '../../tests/data');
    await config.load(rootDir);
    console.log(config.get('db.main.password'));
})().then().catch(console.log);
//# sourceMappingURL=test.js.map