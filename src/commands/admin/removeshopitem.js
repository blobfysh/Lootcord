module.exports = {
	name: 'removeshopitem',
	aliases: [''],
	description: 'Remove a shop item from the database.',
	long: 'Remove a shop item from the database.',
	args: {
		name: 'Name of game.'
	},
	examples: ['removeshopitem fortnite'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const itemName = args[0]

		try {
			await app.query(`DELETE FROM shopData WHERE itemName = '${itemName}'`)
			message.reply(`Successfully removed \`${itemName}\` from shop database.`)
		}
		catch (err) {
			message.reply(`Error removing item \`removeshopitem <item_name>\`: \`\`\`\n${err}\`\`\``)
		}
	}
}
