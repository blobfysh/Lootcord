exports.command = {
	name: 'toggleservereconomy',
	aliases: [],
	description: 'Toggles server-side economy mode. All items/money will be isolated to the current server.',
	long: 'Toggles server-side economy mode. All items/money will be isolated to the current server.\nThis command has a 3 day cooldown because it deactivates everyone in the server.\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: true,

	async execute(app, message, { args, prefix, guildInfo }) {
		const activatedUsers = await app.query('SELECT userId FROM userguilds WHERE guildId = ?', [message.channel.guild.id])
		const monsterSpawn = await app.mysql.select('spawns', 'guildId', message.channel.guild.id)
		const toggleCD = await app.cd.getCD(message.channel.guild.id, 'serversidetoggle')

		if (toggleCD) {
			return message.reply(`You must wait \`${toggleCD}\` before toggling server-side economy mode. This is because the command deactivates everyone in the server and would be abused if we didn't have this cooldown.`)
		}
		else if (monsterSpawn) {
			return message.reply('❌ You cannot toggle server-side economy while there is an enemy spawned. Try again after the enemy has been killed or leaves.')
		}

		if (Object.keys(app.config.activeRoleGuilds).includes(message.channel.guild.id)) {
			try {
				for (const user of activatedUsers) {
					const member = await app.common.fetchMember(message.channel.guild, user.userId)
					await member.removeRole(app.config.activeRoleGuilds[message.channel.guild.id].activeRoleID)
				}
			}
			catch (err) {
				console.warn('Failed to remove active role.')
			}
		}

		await app.cd.setCD(message.channel.guild.id, 'serversidetoggle', app.config.cooldowns.server_side_toggle * 1000)

		// deactivate all users in guild to prevent issues with some commands (the bot assumes activated users have an account but switching from global to server-side means nobody will have an account)
		await app.query('DELETE FROM userguilds WHERE guildId = ?', [message.channel.guild.id])

		if (guildInfo.serverOnly === 0) {
			await app.query(`UPDATE guildinfo SET serverOnly = 1 WHERE guildId = "${message.channel.guild.id}"`)

			message.reply('✅ Server-side economy is now enabled!')
		}
		else {
			await app.query(`UPDATE guildinfo SET serverOnly = 0 WHERE guildId = "${message.channel.guild.id}"`)

			message.reply('✅ Server-side economy is now disabled!')
		}
	}
}
