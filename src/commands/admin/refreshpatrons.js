module.exports = {
	name: 'refreshpatrons',
	aliases: [''],
	description: 'Remove patrons without patreon donator role.',
	long: 'Remove patrons without patreon donator role.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		try {
			if (message.channel.guild.id !== app.config.supportGuildID) return message.reply('This only works in the support guild!')

			const patrons = await app.query('SELECT * FROM patrons')
			let removed = 0

			for (let i = 0; i < patrons.length; i++) {
				const member = await app.common.fetchMember(message.channel.guild, patrons[i].userId)

				if (patrons[i].tier === 1 && !member.roles.includes(app.config.donatorRoles.tier1Patreon)) {
					app.patreonHandler.lostTier1(patrons[i].userId, `\`${patrons[i].userId}\`'s tier 1 donator perks expried.`)
					removed++
				}
				else if (patrons[i].tier === 2 && !member.roles.includes(app.config.donatorRoles.tier2Patreon)) {
					app.patreonHandler.lostTier2(patrons[i].userId, `\`${patrons[i].userId}\`'s tier 2 donator perks expried.`)
					removed++
				}
				else if (patrons[i].tier === 3 && !member.roles.includes(app.config.donatorRoles.tier3Patreon)) {
					app.patreonHandler.lostTier3(patrons[i].userId, `\`${patrons[i].userId}\`'s tier 3 donator perks expried.`)
					removed++
				}
			}

			message.reply(`Removed **${removed}** expired patrons from DB.`)
		}
		catch (err) {
			message.reply(`Error: \`\`\`\n${err}\`\`\``)
		}
	}
}
