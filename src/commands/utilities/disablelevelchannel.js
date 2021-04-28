exports.command = {
	name: 'disablelevelchannel',
	aliases: ['disablelevelchan'],
	description: 'Disables the dedicated channel for level-up messages.',
	long: 'Removes the level channel from the server, will cause the bot to default back to replying when users level up.\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: true,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: true,

	async execute(app, message, { args, prefix, guildInfo }) {
		await app.query(`UPDATE guildinfo SET levelChan = 0 WHERE guildId = "${message.channel.guild.id}"`)

		message.reply('✅ Disabled level channel for this server!')
	}
}
