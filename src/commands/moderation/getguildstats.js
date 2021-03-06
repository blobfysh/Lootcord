const Eris = require('eris')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'getguildstats',
	aliases: ['getguildinfo', 'guildstats'],
	description: 'Shows statistics about a server.',
	long: 'Shows statistics about a server.',
	args: {
		'Guild ID': 'ID of guild to check.',
		'-fetchall': '**OPTIONAL** Fetches all members of the guild.'
	},
	examples: ['getguildstats 454163538055790604', 'getguildstats 454163538055790604 -fetchall'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const guildID = args[0]
		const fetchAll = args[1]

		if (!guildID) {
			return reply(message, '❌ You forgot to include a guild ID.')
		}

		try {
			if (await app.cd.getCD(guildID, 'guildbanned')) return reply(message, '❌ That guild has been banned from using the bot.')

			let fetchedGuildInfo = await app.common.fetchGuild(guildID)

			if (!fetchedGuildInfo) return reply(message, '❌ I am not in a guild with that ID.')

			if (fetchAll && fetchAll.toLowerCase() === '-fetchall') {
				await app.ipc.broadcast('fetchAllMembers', { guildId: guildID })

				await new Promise(res => setTimeout(res, 1000))

				fetchedGuildInfo = await app.common.fetchGuild(guildID)
			}

			const guildRow = await app.common.getGuildInfo(guildID)
			const prefixRow = (await app.query(`SELECT * FROM guildprefix WHERE guildId ="${guildID}"`))[0]
			const activeRows = await app.query('SELECT * FROM userguilds WHERE guildId = ?', [guildID])
			const guildCreated = codeWrap(`${new Date(Math.floor((guildID / 4194304) + 1420070400000)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(Math.floor((guildID / 4194304) + 1420070400000)).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix')
			const joinedGuild = codeWrap(`${new Date(fetchedGuildInfo.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(fetchedGuildInfo.joinedAt).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix')
			const cachedChannels = fetchedGuildInfo.channels instanceof Map ? fetchedGuildInfo.channels : createCollection(fetchedGuildInfo.channels)
			const cachedMembers = fetchedGuildInfo.members instanceof Map ? fetchedGuildInfo.members : createCollection(fetchedGuildInfo.members)
			const owner = await app.common.fetchUser(fetchedGuildInfo.ownerID, { cacheIPC: false })

			const killFeedChan = cachedChannels.get(guildRow.killChan) ? `${cachedChannels.get(guildRow.killChan).name} (ID: \`${guildRow.killChan}\`)` : 'None set'
			const levelChan = cachedChannels.get(guildRow.levelChan) ? `${cachedChannels.get(guildRow.levelChan).name} (ID: \`${guildRow.levelChan}\`)` : 'None set'
			const attackMode = guildRow.randomOnly ? 'Random only' : 'Selectable'
			const serverSideMode = guildRow.serverOnly ? 'Enabled' : 'Disabled (global)'

			const statEmbed = new app.Embed()
				.setColor(13451564)
				.setAuthor(`${fetchedGuildInfo.name}`)
				.setDescription('Only a max of 15 members/channels will be shown due to length limitations.')
				.addField('Guild Created', guildCreated, true)
				.addField('Lootcord Joined', joinedGuild, true)
				.setDescription(`**Owner**: ${owner.username}#${owner.discriminator} (ID: \`${fetchedGuildInfo.ownerID}\`)
				**Member Count**: ${fetchedGuildInfo.memberCount}
				**Prefix**: ${prefixRow ? prefixRow.prefix : app.config.prefix}
				**Killfeed**: ${killFeedChan}
				**Levelling Channel**: ${levelChan}
				**Attack Mode**: ${attackMode}
				**Server-side Economy**: ${serverSideMode}`)
				.addField(`Channels - ${cachedChannels.size}`, cachedChannels.filter(chan => chan.type !== 4).map(chan => `${getChannelType(app.icons, chan, guildID)} ${chan.name} (ID: \`${chan.id}\`)`).slice(0, 10).join('\n') || 'None')
				.addField(`Cached Members - ${cachedMembers.size}`, codeWrap(cachedMembers.filter(user => !user.user.bot).map(user => `${user.user.username}#${user.user.discriminator} (${user.user.id})`).slice(0, 15).join('\n') || 'None (cached bots are not shown)', ''))
				.addField(`Activated Players - ${activeRows.length}`, codeWrap(activeRows.map(row => row.userId).slice(0, 15).join('\n') || 'None', ''))

			if (fetchedGuildInfo.icon) statEmbed.setThumbnail(app.bot._formatImage(`/icons/${guildID}/${fetchedGuildInfo.icon}`))

			await message.channel.createMessage(statEmbed)
		}
		catch (err) {
			console.log(err)
			await reply(message, `Error:\`\`\`${err}\`\`\``)
		}
	}
}

function getChannelType (icons, chan, guildID) {
	const permissions = chan.permissionOverwrites instanceof Map ? chan.permissionOverwrites.get(guildID) : new Map(Object.entries(chan.permissionOverwrites)).get(guildID)

	if (chan.type === 0n && permissions && permissions.deny & (1 << 10)) {
		return icons.locked_text_channel
	}
	else if (chan.type === 0) {
		return icons.text_channel
	}
	else if (chan.type === 2) {
		return icons.voice_channel
	}

	return ''
}

function codeWrap (input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}

function createCollection (object) {
	const collection = new Eris.Collection()

	for (const item of Object.keys(object)) {
		collection.set(item, object[item])
	}

	return collection
}
