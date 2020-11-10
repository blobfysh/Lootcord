exports.run = async function({ vote, type }) {
	const voteCD = await this.cd.getCD(vote.user, type === 'topgg' ? 'vote' : 'vote2')

	if (voteCD) {
		console.log(`[VOTE] Received a vote but ignored it due to user having vote cooldown: ${vote.user}`)
		return
	}

	let account = await this.player.getRow(vote.user)
	if (!account) {
		await this.player.createAccount(vote.user)

		account = await this.player.getRow(vote.user)
	}

	let itemReward
	if ((account.voteCounter + 1) % 6 === 0) {
		itemReward = `✨ You received a ${this.itemdata.supply_signal.icon}\`supply_signal\` for voting 6 days in a row! 😃`
		await this.itm.addItem(vote.user, 'supply_signal', 1)
	}
	else {
		itemReward = `📦 You received 1x ${this.itemdata.military_crate.icon}\`military_crate\`!`
		await this.itm.addItem(vote.user, 'military_crate', 1)
	}

	// add vote cooldown
	if (type === 'topgg') {
		await this.cd.setCD(vote.user, 'vote', 43200 * 1000)
	}
	else if (type === 'bfd') {
		const midnight = new Date(new Date().setUTCHours(24, 0, 0, 0))
		await this.cd.setCD(vote.user, 'vote2', midnight - Date.now())
	}

	await this.query(`UPDATE scores SET voteCounter = voteCounter + 1 WHERE userId = ${vote.user}`)

	this.common.messageUser(vote.user, {
		content: `**Thanks for voting!**\n${itemReward}`,
		embed: getCounterEmbed(this, account.voteCounter + 1).embed
	})
}

function getCounterEmbed(app, counterVal) {
	let rewardString = ''
	const counterDayVal = counterVal % 6 === 0 ? 6 : counterVal % 6

	for (let i = 0; i < 5; i++) {
		// Iterate 5 times
		if (counterDayVal >= i + 1) {
			rewardString += `☑ Day ${i + 1}: \`military_crate\`\n`
		}
		else {
			rewardString += `❌ Day ${i + 1}: \`military_crate\`\n`
		}
	}

	if (counterVal % 6 === 0) {
		rewardString += '✨ Day 6: `supply_signal`'
	}
	else {
		rewardString += '❌ Day 6: `supply_signal`'
	}

	const embed = new app.Embed()
		.setTitle('Voting rewards!')
		.setDescription(rewardString)
		.setFooter('Vote 6 days in a row to receive a supply_signal!')
		.setColor(9043800)

	return embed
}
