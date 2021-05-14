exports.command = {
	name: 'beg',
	aliases: [],
	description: 'Beg for some scrap.',
	long: 'Are you broke? Lose all your scrap from gambling? Only one solution: go bug people for some scrap.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const begCD = await app.cd.getCD(message.author.id, 'beg', { serverSideGuildId })

		if (begCD) {
			return message.reply(`${app.icons.banditguard} You must really be struggling, but you should wait \`${begCD}\` before begging for more scrap.`)
		}

		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const { itemCt } = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id, serverSideGuildId), row)
		if (row.money >= 500) {
			return message.reply(`${app.icons.bruhface} Bruh, you have **${app.common.formatNumber(row.money)}** scrap. You don't need to beg.`)
		}
		else if (itemCt >= 2) {
			return message.reply(`${app.icons.banditguard} What?? You have **${itemCt}** perfectly good items, just sell them if you want scrap.`)
		}
		else if (row.clanId !== 0) {
			return message.reply(`${app.icons.banditguard} Aren't you in a clan? Why don't you go beg them for stuff >:(`)
		}

		console.log(`${message.author.username} (${message.author.id}) is begging for scrap`)
		const randAmt = Math.floor((Math.random() * (1000 - 500 + 1)) + 500)
		await message.reply(`${app.icons.banditguard} dang ur broke lol. Take this **${app.common.formatNumber(randAmt)}** scrap and get outta my face.`)

		await app.player.addMoney(message.author.id, randAmt, serverSideGuildId)
		await app.cd.setCD(message.author.id, 'beg', 60 * 1000, { serverSideGuildId })
	}
}
