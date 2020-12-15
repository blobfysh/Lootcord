module.exports = {
	name: 'rules',
	aliases: [''],
	description: 'View the rules of Lootcord.',
	long: 'Displays official Lootcord rules.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	execute(app, message, { args, prefix }) {
		const ruleInfo = new app.Embed()
			.setTitle('Official Lootcord Bot Rules')
			.setDescription(`1. **Do NOT exploit bugs.** Bugs, if found, should be reported to the moderators so we can remove it.\n
        2. **Do not use alt or "puppet" accounts.** The use of secondary accounts operated by you to avoid cooldowns, hoard weapons to avoid loss upon death, organize attacks on a target, farm boxes or in any other way considered unfair to others will result in a warning or in later offenses punishment.\n
        3. **Do not leave servers after attacking someone to deactivate your account and avoid counterattacks.** This is known as cooldown dodging, and is automatically reported to moderators on offense.\n
        4. **No kill-farming.** Killing someone then trading items back to the other person in order to gain kill count without consequences.\n
        5. **No handouts.** Giving another player free items/money whether it be through trading, the black market, clans, or kills is not allowed. Doing so will result in a warning or trade ban.\n
        6. **Do not report without reason.** The report command should only be used when you have evidence that someone is breaking these rules. Spamming the report command may result in a temporary or permanent ban.`)
			.setColor('#ADADAD')
			.setFooter('Rules subject to change.')

		message.channel.createMessage(ruleInfo)
	}
}
