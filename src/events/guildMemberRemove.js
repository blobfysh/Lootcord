exports.run = async function (guild, member) {
	// / deactivate user
	this.query(`DELETE FROM userguilds WHERE userId = ${member.id} AND guildId = ${guild.id}`)

	if (guild.id === this.config.supportGuildID) {
		this.patreonHandler.checkPatronLeft(member)
	}

	if (await this.cd.getCD(member.id, `activate|${guild.id}`)) {
		// cooldown dodged... >:(
		const guildInfo = await this.common.getGuildInfo(guild.id)
		const serverSideGuildId = guildInfo.serverOnly ? guild.id : undefined
		const userItems = await this.itm.getItemObject(member.id, serverSideGuildId)
		const randomItems = await this.itm.getRandomUserItems(userItems, 1)
		await this.itm.removeItem(member.id, randomItems.amounts, null, serverSideGuildId)

		if (serverSideGuildId) {
			await this.query(`UPDATE server_scores SET deaths = deaths + 1 WHERE userId = ${member.id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await this.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${member.id}`)
		}

		const logEmbed = new this.Embed()
			.setTitle('Cooldown Dodger')
			.addField('Left Guild', `\`\`\`\n${guild.id}\`\`\``)
			.addField('Removed Items', randomItems.items.length ? randomItems.display.join(', ') : 'No items to remove')
			.setColor(16734296)

		const warnEmbed = new this.Embed()
			.setTitle('🤯 What are you doing?!')
			.setDescription('Leaving a server you are activated in to avoid the deactivate cooldown is against the rules!' +
			`\n\n${randomItems.items.length ? `A random item was removed from your inventory:\n${randomItems.display.join(', ')}\n\nand your death count has increased by 1.` : 'Your death count has increased by 1.'}` +
			'\n\nThese rules help keep the game fair for everyone. If you continue to cooldown dodge, you will be banned!')
			.setColor(16734296)
			.setFooter('This is an automated warning. https://lootcord.com/rules')

		// in case member is uncached
		if (member.username) {
			logEmbed.setThumbnail(member.avatarURL)
			logEmbed.setDescription(`${`${member.username}#${member.discriminator}`} ID: \`\`\`\n${member.id}\`\`\``)
		}
		else {
			logEmbed.setDescription(`ID: \`\`\`\n${member.id}\`\`\``)
		}

		if (serverSideGuildId) {
			logEmbed.setFooter('Server-side economy mode was enabled in this server.')
		}

		try {
			await this.common.messageUser(member.id, warnEmbed, { throwErr: true })

			logEmbed.setFooter('✅ User received DM warning.')
		}
		catch (err) {
			logEmbed.addField('Error', `\`\`\`\n${err}\`\`\``)
			logEmbed.setFooter('❌ Unable to DM user.')
		}

		this.messager.messageLogs(logEmbed)
	}
}
