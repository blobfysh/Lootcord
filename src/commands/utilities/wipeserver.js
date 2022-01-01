const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

const resetData = {
	money: 100,
	clanId: 0,
	badge: '"none"',
	inv_slots: 0,
	health: 100,
	maxHealth: 100,
	bleed: 0,
	burn: 0,
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

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const botMessage = await reply(message, {
			content: 'Are you sure you want to wipe and deactivate everyone in the server? Cooldowns will remain unaffected. Limited event items will remain unaffected (such as halloween items).',
			components: BUTTONS.confirmation
		})

		try {
			const result = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (result.customID === 'confirmed') {
				const specialBanners = Object.keys(app.itemdata).filter(i => app.itemdata[i].isSpecial && app.itemdata[i].category === 'Banner')
				const specialStorage = Object.keys(app.itemdata).filter(i => app.itemdata[i].isSpecial && app.itemdata[i].category === 'Storage')
				const specialItems = Object.keys(app.itemdata).filter(i => app.itemdata[i].isSpecial)

				// server-side economies
				await app.query(`UPDATE server_scores SET ${Object.keys(resetData).map(key => `${key} = ${resetData[key]}`).join(', ')} WHERE guildId = ?`, [serverSideGuildId])
				await app.query(`UPDATE server_scores SET banner = 'recruit' WHERE guildId = ? AND banner NOT IN (${specialBanners.map(i => `'${i}'`).join(', ')})`, [serverSideGuildId])
				await app.query(`UPDATE server_scores SET backpack = 'none' WHERE guildId = ? AND backpack NOT IN (${specialStorage.map(i => `'${i}'`).join(', ')})`, [serverSideGuildId])
				await app.query(`DELETE FROM server_user_items WHERE guildId = ? AND item NOT IN (${specialItems.map(i => `'${i}'`).join(', ')})`, [serverSideGuildId])
				await app.query('DELETE FROM server_stats WHERE guildId = ?', [serverSideGuildId])
				await app.query('DELETE FROM server_badges WHERE guildId = ?', [serverSideGuildId])
				await app.query('DELETE FROM userguilds WHERE guildId = ?', [serverSideGuildId])


				const clans = await app.query('SELECT * FROM server_clans WHERE guildId = ?', [serverSideGuildId])

				for (const clan of clans) {
					await app.query('DELETE FROM server_clan_items WHERE id = ?', [clan.clanId])
					await app.query('DELETE FROM server_clan_logs WHERE clanId = ?', [clan.clanId])
				}

				await app.query('DELETE FROM server_clans WHERE guildId = ?', [serverSideGuildId])

				await result.respond({
					content: '✅ Server data has been wiped!',
					components: []
				})
			}
			else {
				await botMessage.delete()
			}
		}
		catch (err) {
			console.log(err)

			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
