const cluster = require('cluster')
const Sharder = require('eris-sharder').Master

const config = require('./config')
const cache = require('./utils/cache')
const MySQL = require('./utils/MySQL')
const Server = require('./api/Server')
const ListUpdater = require('./handlers/BotListUpdater')
const listUpdater = new ListUpdater(cache, config)
const mysql = new MySQL(config)

const sharder = new Sharder(`Bot ${config.botToken}`, '/src/app.js', {
	name: 'Lootcord',
	stats: true,
	statsInterval: 60 * 1000,
	debug: config.debug,
	clusters: 5,
	// shards: 1,
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
		messageLimit: 10,
		disableEveryone: true,
		defaultImageFormat: 'png',
		defaultImageSize: 256,
		restMode: true,
		intents: [
			'guilds',
			'guildMembers',
			'guildMessages',
			'guildMessageReactions',
			'directMessages'
		],
		requestTimeout: 35000
	}
})

sharder.on('stats', stats => {
	cache.set('stats', JSON.stringify(stats))
})

if (cluster.isMaster) {
	const server = new Server(sharder, mysql, cache, config)

	listUpdater.start()
	server.launch()
}
