module.exports = {
	name: 'trickortreat',
	aliases: ['halloween', 'spooky'],
	description: '🎃 Claim a spooky gift every day!',
	long: '🎃 Claim a spooky gift every day throughout October!',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const dailyCD = await app.cd.getCD(message.author.id, 'trickortreat')

		if (dailyCD) {
			return message.reply(`You can claim your next trick-or-treat in \`${dailyCD}\`.`)
		}

		const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), await app.player.getRow(message.author.id))
		const hasEnough = await app.itm.hasSpace(itemCt, 1)
		if (!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** (You need **1** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)

		await app.cd.setCD(message.author.id, 'trickortreat', app.config.cooldowns.daily * 1000)

		await app.itm.addItem(message.author.id, 'small_loot_bag', 1)
		message.reply(`Here's a ${app.itemdata.small_loot_bag.icon}\`small_loot_bag\`!\n\nYou can open it (\`${prefix}use small_loot_bag\`) OR combine **10** to craft a ${app.itemdata.medium_loot_bag.icon}\`medium_loot_bag\`.`)
	}
}
