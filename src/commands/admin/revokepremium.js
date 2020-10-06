module.exports = {
	name: 'revokepremium',
	aliases: [''],
	description: 'Revokes user Lootcord premium.',
	long: 'Revokes user Lootcord premium.',
	args: {
		'User ID': 'ID of user to revoke premium perks from.'
	},
	examples: ['revokepremium 168958344361541633'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const userID = args[0]

		if (!userID) {
			return message.reply('❌ You forgot to include a user ID.')
		}

		const patronCD = await app.cd.getCD(userID, 'patron')

		if (!patronCD) {
			return message.reply('❌ User is not a donator.')
		}

		await app.cache.del(`patron|${userID}`)
		await app.query(`DELETE FROM cooldown WHERE userId = '${userID}' AND type = 'patron'`)
		await app.query(`DELETE FROM user_items WHERE userId = '${userID}' AND item = 'kofi_king'`)
		await app.query(`UPDATE scores SET banner = 'none' WHERE userId = '${userID}' AND banner = 'kofi_king'`)
		app.ipc.broadcast('removeKofiRole', { guildId: app.config.supportGuildID, userId: userID })

		try {
			const donateEmbed = new app.Embed()
				.setTitle('Perks Ended')
				.setThumbnail('https://pbs.twimg.com/profile_images/1207570720034701314/dTLz6VR2_400x400.jpg')
				.setColor('#29ABE0')
				.setDescription(`\`${userID}\`'s donator perks expried.`)

			app.messager.messageLogs(donateEmbed)
		}
		catch (err) {
			console.warn(err)
		}

		message.reply('✅ Successfully revoked donator perks.')
	}
}
