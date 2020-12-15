const Eris = require('eris')

module.exports = {
	name: 'getguildstats',
	aliases: ['getguildinfo', 'guildstats'],
	description: 'Shows statistics about a server.',
	long: 'Shows statistics about a server.',
	args: {
		'Guild ID': 'ID of guild to check.',
		'-fetchall': '**OPTIONAL** Fetches all members of the guild.'
	},
	examples: ['getguildstats 454163538055790604', 'getguildstats 454163538055790604 -fetchall'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const guildID = args[0]
		const fetchAll = args[1]

		if (!guildID) {
			return message.reply('❌ You forgot to include a guild ID.')
		}

		try {
			if (await app.cd.getCD(guildID, 'guildbanned')) return message.reply('❌ That guild has been banned from using the bot.')

			let guildInfo = await app.common.fetchGuild(guildID)

			if (!guildInfo) return message.reply('❌ I am not in a guild with that ID.')

			if (fetchAll && fetchAll.toLowerCase() === '-fetchall') {
				await app.ipc.broadcast('fetchAllMembers', { guildId: guildID })

				await new Promise(res => setTimeout(res, 1000))

				guildInfo = await app.common.fetchGuild(guildID)
			}

			const guildRow = await app.common.getGuildInfo(guildID)
			const prefixRow = (await app.query(`SELECT * FROM guildPrefix WHERE guildId ="${guildID}"`))[0]
			const activeRows = await app.query('SELECT * FROM userGuilds WHERE guildId = ?', [guildID])
			const guildCreated = codeWrap(`${new Date(Math.floor((guildID / 4194304) + 1420070400000)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(Math.floor((guildID / 4194304) + 1420070400000)).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix')
			const joinedGuild = codeWrap(`${new Date(guildInfo.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' })}\n${new Date(guildInfo.joinedAt).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} (EST)`, 'fix')
			const cachedChannels = guildInfo.channels instanceof Map ? guildInfo.channels : createCollection(guildInfo.channels)
			const cachedMembers = guildInfo.members instanceof Map ? guildInfo.members : createCollection(guildInfo.members)
			const owner = await app.common.fetchUser(guildInfo.ownerID, { cacheIPC: false })

			const killFeedChan = cachedChannels.get(guildRow.killChan) ? `${cachedChannels.get(guildRow.killChan).name} (ID: \`${guildRow.killChan}\`)` : 'None set'
			const levelChan = cachedChannels.get(guildRow.levelChan) ? `${cachedChannels.get(guildRow.levelChan).name} (ID: \`${guildRow.levelChan}\`)` : 'None set'
			const attackMode = guildRow.randomOnly ? 'Random only' : 'Selectable'

			const statEmbed = new app.Embed()
				.setColor('#ADADAD')
				.setAuthor(`${guildInfo.name}`)
				.setDescription('Only a max of 15 members/channels will be shown due to length limitations.')
				.addField('Guild Created', guildCreated, true)
				.addField('Lootcord Joined', joinedGuild, true)
				.setDescription(`**Owner**: ${owner.username}#${owner.discriminator} (ID: \`${guildInfo.ownerID}\`)
            **Member Count**: ${guildInfo.memberCount}
            **Prefix**: ${prefixRow ? prefixRow.prefix : app.config.prefix}
            **Killfeed**: ${killFeedChan}
            **Levelling Channel**: ${levelChan}
            **Attack Mode**: ${attackMode}`)
				.addField(`Channels - ${cachedChannels.size}`, cachedChannels.filter(chan => chan.type !== 4).map(chan => `${getChannelType(app.icons, chan, guildID)} ${chan.name} (ID: \`${chan.id}\`)`).slice(0, 10).join('\n') || 'None')
				.addField(`Cached Members - ${cachedMembers.size}`, codeWrap(cachedMembers.filter(user => !user.user.bot).map(user => `${user.user.username}#${user.user.discriminator} (${user.user.id})`).slice(0, 15).join('\n') || 'None (cached bots are not shown)', ''))
				.addField(`Activated Players - ${activeRows.length}`, codeWrap(activeRows.map(row => row.userId).slice(0, 15).join('\n') || 'None', ''))

			if (guildInfo.icon) statEmbed.setThumbnail(app.bot._formatImage(`/icons/${guildID}/${guildInfo.icon}`))

			message.channel.createMessage(statEmbed)
		}
		catch (err) {
			console.log(err)
			message.reply(`Error:\`\`\`${err}\`\`\``)
		}
	}
}

function getChannelType(icons, chan, guildID) {
	const permissions = chan.permissionOverwrites instanceof Map ? chan.permissionOverwrites.get(guildID) : new Map(Object.entries(chan.permissionOverwrites)).get(guildID)

	if (chan.type === 0 && permissions && permissions.deny & (1 << 10)) {
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

function codeWrap(input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}

function createCollection(object) {
	const collection = new Eris.Collection()

	for (const item of Object.keys(object)) {
		collection.set(item, object[item])
	}

	return collection
}
