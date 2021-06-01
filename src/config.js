exports.debug = process.env.NODE_ENV !== 'production'

exports.prefix = 't-'

// IDs of users that have admin privileges.
exports.adminUsers = ['168958344361541633', '246828746789617665', '221087115893669889']

exports.botToken = process.env.BOT_TOKEN

exports.discoinToken = process.env.DISCOIN_TOKEN

exports.nflToken = process.env.NOFLYLIST_TOKEN

// secret for requests to api
exports.apiAuth = process.env.API_AUTH
exports.serverPort = process.env.API_PORT || 5000

// ID of the bots main guild, used for handling patreon roles and the 2x reward on daily command
exports.supportGuildID = process.env.BOT_GUILD

// ID of channel where certain moderation commands have to be run
exports.modChannel = process.env.BOT_MODERATION_CHANNEL

// ID of role to ping mods
exports.modRoleID = process.env.MOD_ROLE_ID

// ID of channel where bot will send scrap deals
exports.scrapDealsChannel = process.env.SCRAP_DEALS_CHANNEL

// ID of channel the bot will host a challenge where people have to guess a 4 digit code for a prize
exports.codeEventChannel = process.env.CODE_EVENT_CHANNEL

// The amount of inventory slots with no backpack
exports.baseInvSlots = 15

// Information used to connect to SQL database
exports.sql = {
	host: process.env.MYSQL_HOSTNAME,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE
}

// Config for connecting to redis
exports.redis = {
	host: process.env.REDIS_HOSTNAME,
	password: process.env.REDIS_PASSWORD
}

// Discord webhook to send logs to
exports.logWebhook = {
	id: process.env.LOGS_WEBHOOK_ID,
	token: process.env.LOGS_WEBHOOK_TOKEN
}

// IDs of guilds the bot will ignore (not respond)
exports.ignoredGuilds = ['264445053596991498', '374071874222686211', '446425626988249089']

exports.donatorRoles = {
	kofi: process.env.KOFI_ROLE_ID,
	tier1Patreon: process.env.TIER1_PATREON_ROLE_ID,
	tier2Patreon: process.env.TIER2_PATREON_ROLE_ID,
	tier3Patreon: process.env.TIER3_PATREON_ROLE_ID,
	tier4Patreon: process.env.TIER4_PATREON_ROLE_ID
}

exports.patreon = {
	campaignId: process.env.PATREON_CAMPAIGN_ID,
	creatorToken: process.env.PATREON_CREATOR_TOKEN,

	// users that should bypass the automatic patreon role removal,
	// useful if you want someone to have a patreon role even though they aren't subbed to your patreon
	userRoleRemovalExceptions: ['168958344361541633']
}

// Bot lists to post stats to
exports.botLists = [
	{
		url: 'https://top.gg/api/bots/493316754689359874/stats',
		token: process.env.TOPGG_API_TOKEN
	},
	{
		url: 'https://discord.bots.gg/api/v1/bots/493316754689359874/stats',
		token: process.env.BOTSGG_API_TOKEN
	},
	{
		url: 'https://botsfordiscord.com/api/bot/493316754689359874',
		token: process.env.BFD_API_TOKEN
	},
	{
		url: 'https://discordbotlist.com/api/v1/bots/493316754689359874/stats',
		token: process.env.DBL_API_TOKEN
	}
]

/**
 * IDs of guilds where the bot will give a role to players that activate their account
 * this requires the manage roles permission
 */
exports.activeRoleGuilds = {
	'497302646521069568': {
		activeRoleID: '585640212047069185'
	}
}

// cooldowns in seconds for some commands
exports.cooldowns = {
	hourly: 3600,
	daily: 86400,
	blackjack: 180,
	coinflip: 180,
	scramble: 900,
	trivia: 600,
	roulette: 180,
	slots: 180,
	jackpot: 300,
	weekly: 86400 * 7,
	server_side_toggle: 86400 * 3
}
