exports.command = {
	name: 'cooldowns',
	aliases: ['cooldown', 'cd'],
	description: 'Displays all command cooldowns.',
	long: 'Displays cooldowns for all commands and time remaining on your shield if you have one active.',
	args: {
		'@user/discord#tag': 'User\'s cooldowns to check.'
	},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const memberArg = app.parse.members(message, args)[0]

		// no member found in ArgParser
		if (!memberArg) {
			// player was trying to search someone
			if (args.length) {
				message.reply('❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID')
				return
			}

			await message.channel.createMessage(await getCooldowns(app, message.author, serverSideGuildId, prefix))
		}
		else {
			await message.channel.createMessage(await getCooldowns(app, memberArg, serverSideGuildId, prefix))
		}
	}
}

const getCooldowns = exports.getCooldowns = async function getCooldowns (app, user, serverSideGuildId, prefix) {
	const isDonor = await app.patreonHandler.isPatron(user.id)

	const cds = {
		attack: await app.cd.getCD(user.id, 'attack', { serverSideGuildId }) || '✅ ready',
		heal: await app.cd.getCD(user.id, 'heal', { serverSideGuildId }) || '✅ ready',
		hourly: await app.cd.getCD(user.id, 'hourly', { serverSideGuildId }) || '✅ ready',
		daily: await app.cd.getCD(user.id, 'daily', { serverSideGuildId }) || '✅ ready',
		weekly: await app.cd.getCD(user.id, 'weekly', { serverSideGuildId }) || '✅ ready',
		trivia: await app.cd.getCD(user.id, 'trivia', { serverSideGuildId }) || '✅ ready',
		scramble: await app.cd.getCD(user.id, 'scramble', { serverSideGuildId }) || '✅ ready',
		vote: await app.cd.getCD(user.id, 'vote') || '✅ ready',
		vote2: await app.cd.getCD(user.id, 'vote2') || '✅ ready',
		blackjack: await app.cd.getCD(user.id, 'blackjack', { serverSideGuildId }) || '✅ ready',
		slots: await app.cd.getCD(user.id, 'slots', { serverSideGuildId }) || '✅ ready',
		roulette: await app.cd.getCD(user.id, 'roulette', { serverSideGuildId }) || '✅ ready',
		coinflip: await app.cd.getCD(user.id, 'coinflip', { serverSideGuildId }) || '✅ ready',
		jackpot: await app.cd.getCD(user.id, 'jackpot', { serverSideGuildId }) || '✅ ready',
		armor: await app.cd.getCD(user.id, 'shield', { serverSideGuildId }),
		passiveShield: await app.cd.getCD(user.id, 'passive_shield', { serverSideGuildId })
	}

	const cdEmbed = new app.Embed()
		.setAuthor(`${user.username}#${user.discriminator}'s Cooldowns`, app.common.getAvatar(user))
		.setColor(13451564)
		.addField('farm', `\`${cds.hourly}\``, true)
		.addField('daily', `\`${cds.daily}\``, true)
		.addField('weekly', isDonor ? `\`${cds.weekly}\`` : '❌ Patreon only', true)
		.addField('trivia', `\`${cds.trivia}\``, true)
		.addField('scramble', `\`${cds.scramble}\``, true)
		.addField('blackjack', `\`${cds.blackjack}\``, true)
		.addField('slots', `\`${cds.slots}\``, true)
		.addField('coinflip', `\`${cds.coinflip}\``, true)
		.addField('roulette', `\`${cds.roulette}\``, true)
		.addField('vote', `\`${cds.vote}\``, true)
		.addField('vote2', `\`${cds.vote2}\``, true)
		.addField('jackpot', `\`${cds.jackpot}\``, true)
		.addField(`Attack (part of \`${prefix}use\`)`, `\`${cds.attack}\``, true)
		.addField(`Heal (part of \`${prefix}use\`)`, `\`${cds.heal}\``, true)

	if (cds.armor) {
		const armor = await app.player.getArmor(user.id, serverSideGuildId)

		cdEmbed.addField(armor ? 'Armor Active' : '🛡 Armor Active', armor ? `${app.itemdata[armor].icon}\`${cds.armor}\`` : `\`${cds.armor}\``, true)
	}
	if (cds.passiveShield) {
		cdEmbed.addField('🛡 Passive Shield', `\`${cds.passiveShield}\` [?](https://lootcord.com/faq#what-is-a-passive-shield 'A passive shield is a 24 hour attack shield given to you when you are killed.\n\nThis shield will automatically be removed if you decide to attack someone.')`, true)
	}

	return cdEmbed
}
