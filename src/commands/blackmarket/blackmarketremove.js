const shortid = require('shortid')

module.exports = {
	name: 'blackmarketremove',
	aliases: ['bmremove', 'bmrecall', 'bmr'],
	description: 'Remove a listing from the Black Market.',
	long: 'Remove a listing from the Black Market.',
	args: { 'listing ID': 'ID of listing you want to remove.' },
	examples: ['bmremove Jq0cG_YY'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	globalEconomyOnly: true,

	async execute(app, message, { args, prefix, guildInfo }) {
		if (shortid.isValid(args[0])) {
			const listing = await app.bm.getListingInfo(args[0])
			const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), await app.player.getRow(message.author.id))

			if (!listing) {
				message.reply('I could not find a listing with that ID. You can check your listings and their IDs with `bmlistings`')
			}
			else if (listing.sellerId !== message.author.id) {
				message.reply('You do not own that listing! You can check your listings and their IDs with `bmlistings`')
			}
			else if (!await app.itm.hasSpace(itemCt, listing.amount)) {
				message.reply(`❌ **You don't have enough space in your inventory!** (You need **${listing.amount}** open slot${listing.amount > 1 ? 's' : ''}, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`)
			}
			else {
				await app.query(`DELETE FROM blackmarket WHERE listingId = '${listing.listingId}'`)
				await app.itm.addItem(message.author.id, listing.item, listing.amount)
				message.reply(`Successfully removed (\`${listing.listingId}\`) **${listing.amount}x** ${app.itemdata[listing.item].icon}\`${listing.item}\` from the Black Market. You can find them in your inventory.`)
			}
		}
		else {
			message.reply(`I could not find a listing with that ID. You can check your listings and their IDs with \`${prefix}bmlistings\``)
		}
	}
}
