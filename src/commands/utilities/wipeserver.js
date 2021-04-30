const resetData = {
	money: 100,
	scrap: 500,
	backpack: '"none"',
	badge: '"none"',
	inv_slots: 0,
	health: 100,
	maxHealth: 100,
	bleed: 0,
	burn: 0,
	power: 5,
	banner: '"recruit"',
	scaledDamage: 1.00,
	luck: 0,
	used_stats: 0,
	level: 1,
	points: 0,
	kills: 0,
	deaths: 0
}

exports.command = {
	name: 'wipeserver',
	aliases: [],
	description: 'Used by server moderators to wipe all players in the server. Can only be used if server-side economy mode is enabled.',
	long: 'Used by server moderators to wipe all players in the server.\nCan only be used if server-side economy mode is enabled.\n\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	serverEconomyOnly: true,
	guildModsOnly: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const botMessage = await message.reply('Are you sure you want to wipe everyone in the server? Cooldowns will remain unaffected.')

		try {
			const result = await app.react.getConfirmation(message.author.id, botMessage, 15000)

			if (result) {
				// server-side economies
				await app.query(`UPDATE server_scores SET ${Object.keys(resetData).map(key => `${key} = ${resetData[key]}`).join(', ')} WHERE guildId = ?`, [serverSideGuildId])
				await app.query('DELETE FROM server_user_items WHERE guildId = ?', [serverSideGuildId])
				await app.query('DELETE FROM server_stats WHERE guildId = ?', [serverSideGuildId])
				await app.query('DELETE FROM server_badges WHERE guildId = ?', [serverSideGuildId])

				await botMessage.edit('✅ Server data has been wiped!')
			}
			else {
				await botMessage.delete()
			}
		}
		catch (err) {
			await botMessage.edit('You didn\'t react in time!')
		}
	}
}
