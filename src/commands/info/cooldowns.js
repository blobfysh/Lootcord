module.exports = {
	name: 'cooldowns',
	aliases: ['cooldown', 'cd'],
	description: 'Displays all command cooldowns.',
	long: 'Displays cooldowns for all commands and time remaining on your shield if you have one active.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const isDonor = await app.patreonHandler.isPatron(message.author.id)
		const attackCD = await app.cd.getCD(message.author.id, 'attack')
		const healCD = await app.cd.getCD(message.author.id, 'heal')
		const hourlyCD = await app.cd.getCD(message.author.id, 'hourly')
		const dailyCD = await app.cd.getCD(message.author.id, 'daily')
		const weeklyCD = await app.cd.getCD(message.author.id, 'weekly')
		const triviaCD = await app.cd.getCD(message.author.id, 'trivia')
		const scrambleCD = await app.cd.getCD(message.author.id, 'scramble')
		const voteCD = await app.cd.getCD(message.author.id, 'vote')
		const vote2CD = await app.cd.getCD(message.author.id, 'vote2')
		const blackjackCD = await app.cd.getCD(message.author.id, 'blackjack')
		const slotsCD = await app.cd.getCD(message.author.id, 'slots')
		const rouletteCD = await app.cd.getCD(message.author.id, 'roulette')
		const coinflipCD = await app.cd.getCD(message.author.id, 'coinflip')
		const jackpotCD = await app.cd.getCD(message.author.id, 'jackpot')
		const xp_potionCD = await app.cd.getCD(message.author.id, 'xp_potion')
		const armorCD = await app.cd.getCD(message.author.id, 'shield')
		const armor = await app.player.getArmor(message.author.id)
		const passiveShield = await app.cd.getCD(message.author.id, 'passive_shield')

		const hourlyReady = hourlyCD ? `❌ ${hourlyCD}` : '✅ ready'
		const dailyReady = dailyCD ? `❌ ${dailyCD}` : '✅ ready'
		let weeklyReady = '❌ Patreon only'
		const triviaReady = triviaCD ? `❌ ${triviaCD}` : '✅ ready'
		const scrambleReady = scrambleCD ? `❌ ${scrambleCD}` : '✅ ready'
		const attackReady = attackCD ? `❌ ${attackCD}` : '✅ ready'
		const healReady = healCD ? `❌ ${healCD}` : '✅ ready'
		const voteReady = voteCD ? `❌ ${voteCD}` : '✅ ready'
		const vote2Ready = vote2CD ? `❌ ${vote2CD}` : '✅ ready'
		const blackjackReady = blackjackCD ? `❌ ${blackjackCD}` : '✅ ready'
		const slotsReady = slotsCD ? `❌ ${slotsCD}` : '✅ ready'
		const rouletteReady = rouletteCD ? `❌ ${rouletteCD}` : '✅ ready'
		const coinflipReady = coinflipCD ? `❌ ${coinflipCD}` : '✅ ready'
		const jackpotReady = jackpotCD ? `❌ ${jackpotCD}` : '✅ ready'

		if (isDonor && weeklyCD) {
			weeklyReady = `❌ ${weeklyCD}`
		}
		else if (isDonor) {
			weeklyReady = '✅ ready'
		}

		const embedLeader = new app.Embed()
			.setAuthor('Cooldowns', message.author.avatarURL)
			.setColor(13451564)
			.addField('hourly', `\`${hourlyReady}\``, true)
			.addField('daily', `\`${dailyReady}\``, true)
			.addField('weekly', `\`${weeklyReady}\``, true)
			.addField('trivia', `\`${triviaReady}\``, true)
			.addField('scramble', `\`${scrambleReady}\``, true)
			.addField('blackjack', `\`${blackjackReady}\``, true)
			.addField('slots', `\`${slotsReady}\``, true)
			.addField('coinflip', `\`${coinflipReady}\``, true)
			.addField('roulette', `\`${rouletteReady}\``, true)
			.addField('vote', `\`${voteReady}\``, true)
			.addField('vote2', `\`${vote2Ready}\``, true)
			.addField('jackpot', `\`${jackpotReady}\``, true)
			.addField(`Attack (part of \`${prefix}use\`)`, `\`${attackReady}\``, true)
			.addField(`Heal (part of \`${prefix}use\`)`, `\`${healReady}\``, true)

		if (armorCD) {
			embedLeader.addField(armor ? 'Armor Active' : '🛡 Armor Active', armor ? `${app.itemdata[armor].icon}\`${armorCD}\`` : `\`${armorCD}\``, true)
		}
		if (passiveShield) {
			embedLeader.addField('🛡 Passive Shield', `\`${passiveShield}\` [?](https://lootcord.com/faq#what-is-a-passive-shield 'A passive shield is a 24 hour attack shield given to you when you are killed.\n\nThis shield will automatically be removed if you decide to attack someone.')`, true)
		}
		if (xp_potionCD) {
			embedLeader.addField('xp_potion', `\`❌ ${xp_potionCD}\``, true)
		}
		message.channel.createMessage(embedLeader)
	}
}
