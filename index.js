const config    = require('./src/resources/config/config');
const cache     = require('./src/utils/cache');
const LoopTasks = require('./handlers/LoopTasks');

const Sharder = require('eris-sharder').Master;

const sharder = new Sharder('Bot ' + config.botToken, '/src/app.js', {
    name: 'Lootcord ' + require('./package').version,
    stats: true,
    statsInterval: 120 * 1000,
    debug: config.debug,
    clusters: 2,
    shards: 2,
    clientOptions: {
        disableEvents: {
            GUILD_BAN_ADD: true,
            GUILD_BAN_REMOVE: true,
            MESSAGE_DELETE: true,
            MESSAGE_DELETE_BULK: true,
            MESSAGE_UPDATE: true,
            TYPING_START: true,
            VOICE_STATE_UPDATE: true
        },
        messageLimit: 30,
        disableEveryone: true,
        defaultImageFormat: 'png',
        defaultImageSize: 256,
        restMode: true
    }
});

sharder.on('stats', stats => {
    console.log('stored');
    cache.set('stats', JSON.stringify(stats));
});

const loopTasks = new LoopTasks(cache, config);

loopTasks.start();