exports.command = {
	name: 'balance',
	aliases: ['cash', 'money', 'bal', 'lootcoin'],
	description: 'Displays your current balance.',
	long: 'Displays your current Lootcoin and Scrap balance.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)

		message.reply(`You currently have:\n\nLootcoin: ${app.common.formatNumber(row.money)}\nScrap: ${app.common.formatNumber(row.scrap, false, true)}`)
	}
}
