exports.command = {
	name: 'balance',
	aliases: ['cash', 'money', 'bal', 'scrap'],
	description: 'Displays your current balance.',
	long: 'Displays your current balance.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)

		message.reply(`You currently have ${app.common.formatNumber(row.money)}`)
	}
}
