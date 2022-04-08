exports.command = {
	name: 'rules',
	aliases: [],
	description: 'View the rules of Lootcord.',
	long: 'Displays official Lootcord rules.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	execute (app, message, { args, prefix, guildInfo }) {
		const rules = [
			'**Do NOT exploit bugs.** Bugs, if found, should be reported to the moderators so we can remove it.',
			'**Do not use alt or "puppet" accounts.** The use of secondary accounts to avoid cooldowns, hoard weapons to avoid loss upon death, organize attacks on a target, farm boxes or in any other way considered unfair to others will result in a warning or in later offenses punishment. This includes using a friends account as a risk-free storage.',
			'**Do not leave servers you have just activated in to avoid the deactivate cooldown.** This is known as cooldown dodging, and is automatically reported to moderators on offense.',
			'**No kill-farming.** No kill-farming. Do not kill someone on purpose so that they can receive a passive shield (to protect them from being attacked by other players) or trade back their items in order to increase your kills. Depending on the severity, your inventory may be wiped.',
			'**Do not report without reason.** The report command should only be used when you have evidence that someone is breaking these rules. Spamming the report command may result in a temporary or permanent ban.'
		]

		const ruleInfo = new app.Embed()
			.setTitle('Official Lootcord Bot Rules')
			.setDescription(rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n\n'))
			.setColor(13451564)
			.setFooter('Rules subject to change.')

		message.channel.createMessage(ruleInfo)
	}
}
