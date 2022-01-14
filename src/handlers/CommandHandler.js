const { PERMISSIONS } = require('../resources/constants')
const { reply } = require('../utils/messageUtils')

class CommandHandler {
	constructor (app) {
		this.app = app
		this.spamCooldown = new Set()
		this.prefix = app.config.prefix
	}

	async handle (message) {
		const prefix = message.channel.guild ? await this.app.common.getPrefix(message.channel.guild.id) : this.prefix

		if (!message.content.toLowerCase().startsWith(prefix)) return

		const args = message.content.slice(prefix.length).split(/ +/)
		const commandName = args.shift().toLowerCase()
		const command = this.app.commands.find(cmd => cmd.name === commandName || (cmd.aliases.length && cmd.aliases.includes(commandName)))

		// no command was found
		if (!command) { return }

		// check if user is banned from bot
		else if (await this.app.cd.getCD(message.author.id, 'banned')) { return }

		// check if user is admin before running admin command
		else if (command.category === 'admin' && !this.app.sets.adminUsers.has(message.author.id)) { return }

		// ignore mod command if user is not a moderator or admin
		else if (command.category === 'moderation' && (!await this.app.cd.getCD(message.author.id, 'mod') && !this.app.sets.adminUsers.has(message.author.id))) { return }

		let guildInfo = {}
		let serverSideGuildId

		if (message.channel.guild) {
			// command was used in guild

			// check if bot should ignore guild entirely
			if (this.app.config.ignoredGuilds.includes(message.channel.guild.id)) { return }

			// global permissions required for all commands, used for level-up message and events
			const globalPerms = this.getNeededPermissions(message, ['sendMessages', 'externalEmojis', 'addReactions', 'embedLinks', 'readMessageHistory'])

			if (globalPerms.neededPerms.length) {
				if (globalPerms.neededPerms.includes('sendMessages')) {
					return
				}

				return message.channel.createMessage(`I don't have permission to ${globalPerms.permsString}... Please reinvite me or give me those permissions 🥺`)
			}

			// check to make sure bot has permissions to run command
			const commandPerms = this.getNeededPermissions(message, command.permissions)

			if (commandPerms.neededPerms.length) {
				return message.channel.createMessage(`I am missing the following permissions to run that command: ${commandPerms.permsString}... Please reinvite me or give me those permissions 🥺`)
			}

			// check if user has manage server permission before running guildModsOnly command
			else if (command.guildModsOnly && !message.member.permissions.has('manageGuild')) {
				return message.channel.createMessage('❌ You need the `Manage Server` permission to use this command!')
			}

			guildInfo = await this.app.common.getGuildInfo(message.channel.guild.id)
			serverSideGuildId = guildInfo.serverOnly ? message.channel.guild.id : undefined

			// check if command can only be used with a server-side economy
			if (command.serverEconomyOnly && !guildInfo.serverOnly) {
				return message.channel.createMessage(`❌ The \`${command.name}\` command requires that server-side economy mode is enabled. You can enable it in your \`serversettings\`.`)
			}
			else if (command.globalEconomyOnly && guildInfo.serverOnly) {
				return message.channel.createMessage(`❌ The \`${command.name}\` command requires that server-side economy mode is disabled.`)
			}

			const isCrateChannel = (await this.app.query('SELECT * FROM locked_crate_channels WHERE channelId = ?', [message.channel.id]))[0]

			if (isCrateChannel) {
				return message.channel.createMessage('❌ Commands cannot be used here.')
			}

			if (Math.random() <= 0.05) this.app.eventHandler.initEvent(message, { prefix, serverSideGuildId, eventPingRole: guildInfo.eventPingRole })
		}
		else if (!command.worksInDMs) {
			// command does not support being run in DMs
			return message.channel.createMessage(`❌ That command does not work in DMs! Try using it in a server.\n\nCommands that work in DMs: ${this.app.commands.filter(cmd => cmd.worksInDMs).map(cmd => `\`${cmd.name}\``).join(', ')}`)
		}

		// check if user has spam cooldown
		if (this.spamCooldown.has(message.author.id)) {
			const botMsg = await message.channel.createMessage('⏱ **You\'re talking too fast, I can\'t understand! Please slow down...** `2 seconds`')
			setTimeout(() => {
				botMsg.delete()
			}, 2000)

			return
		}

		else if (this.app.sets.disabledCommands.has(command.name)) {
			return message.channel.createMessage('❌ That command has been disabled to prevent issues! Sorry about that...')
		}

		const account = await this.app.player.getRow(message.author.id, serverSideGuildId)
		const blindedCD = await this.app.cd.getCD(message.author.id, 'blinded', { serverSideGuildId })

		// check if user is under effects of 40mm_smoke_grenade
		if (blindedCD && command.category !== 'admin' && command.category !== 'moderation') {
			return reply(message, `❌ You are blinded by a ${this.app.itemdata['40mm_smoke_grenade'].icon}\`40mm_smoke_grenade\`! The smoke will clear in \`${blindedCD}\`.`)
		}

		// check if player leveled up
		if (account) await this.checkLevelXP(message, account, guildInfo, serverSideGuildId)

		// check if command requires an account at all, create new account for player if command requires it.
		if (command.requiresAcc && !account) await this.app.player.createAccount(message.author.id, serverSideGuildId)

		// check if player meets the minimum level required to run the command
		if (command.levelReq && ((account ? account.level : 1) < command.levelReq)) { return message.channel.createMessage(`❌ You must be at least level \`${command.levelReq}\` to use that command!`) }

		// check if command requires an active account (player would be elligible to be attacked) in the server
		else if (command.requiresAcc && command.requiresActive && !await this.app.player.isActive(message.author.id, message.channel.guild.id)) { return message.channel.createMessage(`❌ You need to activate before using that command here! Use \`${prefix}activate\` to activate.`) }

		// check if command is patrons only
		else if (command.patronTier1Only && !await this.app.patreonHandler.isPatron(message.author.id) && !this.app.sets.adminUsers.has(message.author.id)) {
			return message.channel.createMessage(`❌ \`${command.name}\` is exclusive for patreon donators. Support Lootcord on patreon to get access: https://www.patreon.com/lootcord`)
		}
		else if (command.patronTier2Only && !await this.app.patreonHandler.isPatron(message.author.id, 2) && !this.app.sets.adminUsers.has(message.author.id)) {
			return message.channel.createMessage(`❌ \`${command.name}\` is exclusive for **Loot Hoarder**+ patreon donators. Support Lootcord on patreon to get access: https://www.patreon.com/lootcord`)
		}

		// execute command
		try {
			this.app.cache.incr('commands')

			if (serverSideGuildId) {
				this.app.query(`UPDATE server_scores SET lastActive = NOW() WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
			}
			else {
				this.app.query(`UPDATE scores SET lastActive = NOW() WHERE userId = ${message.author.id}`)
			}

			await command.execute(this.app, message, {
				args,
				prefix,
				guildInfo,

				// useful property for passing to addItem/addMoney methods so I dont have to do it inside every command
				serverSideGuildId
			})

			if (message.channel.guild) {
				console.log(`${message.author.username}#${message.author.discriminator} (${message.author.id}) ran command: ${command.name} in guild: ${message.channel.guild.name} (${message.channel.guild.id})`)
			}
			else {
				console.log(`${message.author.username}#${message.author.discriminator} (${message.author.id}) ran command: ${command.name} in DMs`)
			}

			// dont add spamCooldown if in debug mode or user is admin
			if (this.app.config.debug || this.app.sets.adminUsers.has(message.author.id)) return

			let spamCD = 2000
			this.spamCooldown.add(message.author.id)
			if (await this.app.patreonHandler.isPatron(message.author.id)) spamCD = 1000

			setTimeout(() => {
				this.spamCooldown.delete(message.author.id)
			}, spamCD)
		}
		catch (err) {
			console.error(err)
			message.channel.createMessage('Command failed to execute!')
		}
	}

	getNeededPermissions (message, requiredPerms) {
		const botPerms = message.channel.permissionsOf(this.app.bot.user.id)
		const neededPerms = []

		for (const perm of requiredPerms) {
			if (!botPerms.has(perm)) {
				neededPerms.push(perm)
			}
		}

		const permsString = neededPerms.map(perm => {
			if (neededPerms.length > 1 && neededPerms.indexOf(perm) === (neededPerms.length - 1)) {
				return `and \`${PERMISSIONS[perm]}\``
			}

			return `\`${PERMISSIONS[perm]}\``
		}).join(', ')

		return { neededPerms, permsString }
	}

	async checkLevelXP (message, row, guildInfo, serverSideGuildId) {
		try {
			const xp = this.app.common.calculateXP(row.points, row.level)

			if (row.points >= xp.totalNeeded) {
				const craftables = Object.keys(this.app.itemdata).filter(item => this.app.itemdata[item].craftedWith !== '' && this.app.itemdata[item].craftedWith.level === row.level + 1)
				let levelItem = ''

				craftables.sort(this.app.itm.sortItemsHighLow.bind(this.app))

				if (serverSideGuildId) {
					// server-side economy
					await this.app.query(`UPDATE server_scores SET points = points + 1, level = level + 1 WHERE userId = ${message.author.id} AND guildId = ${message.channel.guild.id}`)
				}
				else {
					// global economy
					await this.app.query(`UPDATE scores SET points = points + 1, level = level + 1 WHERE userId = ${message.author.id}`)
				}

				if ((row.level + 1) % 5 === 0 && row.level + 1 >= 10) {
					levelItem = `${this.app.itemdata.elite_crate.icon}\`elite_crate\``
					await this.app.itm.addItem(message.author.id, 'elite_crate', 1, serverSideGuildId)
				}
				else if ((row.level + 1) > 15) {
					levelItem = `${this.app.itemdata.supply_signal.icon}\`supply_signal\``
					await this.app.itm.addItem(message.author.id, 'supply_signal', 1, serverSideGuildId)
				}
				else if ((row.level + 1) > 10) {
					levelItem = `2x ${this.app.itemdata.military_crate.icon}\`military_crate\``
					await this.app.itm.addItem(message.author.id, 'military_crate', 2, serverSideGuildId)
				}
				else if ((row.level + 1) > 5) {
					levelItem = `${this.app.itemdata.military_crate.icon}\`military_crate\``
					await this.app.itm.addItem(message.author.id, 'military_crate', 1, serverSideGuildId)
				}
				else {
					levelItem = `1x ${this.app.itemdata.crate.icon}\`crate\``
					await this.app.itm.addItem(message.author.id, 'crate', 1, serverSideGuildId)
				}

				if (row.level + 1 >= 5) {
					await this.app.itm.addBadge(message.author.id, 'loot_goblin', serverSideGuildId)
				}
				if (row.level + 1 >= 10) {
					await this.app.itm.addBadge(message.author.id, 'loot_fiend', serverSideGuildId)
				}
				if (row.level + 1 >= 20) {
					await this.app.itm.addBadge(message.author.id, 'loot_legend', serverSideGuildId)
				}

				try {
					const hasFilePerm = this.getNeededPermissions(message, ['attachFiles'])
					let lvlFile

					// only attach level up image if bot has attachFiles permission
					if (!hasFilePerm.neededPerms.length) {
						const lvlUpImage = await this.app.player.getLevelImage(message.author.avatarURL, row.level + 1)

						lvlFile = {
							file: lvlUpImage,
							name: 'userLvl.jpeg'
						}
					}

					if (guildInfo.levelChan !== undefined && guildInfo.levelChan !== '' && guildInfo.levelChan !== 0) {
						try {
							await this.app.bot.createMessage(guildInfo.levelChan, {
								content: `<@${message.author.id}> leveled up!\n**Reward:** ${levelItem}${craftables.length ? `\n\nYou can now craft the following items:\n${craftables.map(item => `${this.app.itemdata[item].icon}\`${item}\``).join(', ')}` : ''}`
							}, lvlFile)
						}
						catch (err) {
							// level channel not found
							console.warn('Could not find level channel.')
						}
					}
					else {
						message.channel.createMessage({
							content: `<@${message.author.id}> level up!\n**Reward:** ${levelItem}${craftables.length ? `\n\nYou can now craft the following items:\n${craftables.map(item => `${this.app.itemdata[item].icon}\`${item}\``).join(', ')}` : ''}`
						}, lvlFile)
					}
				}
				catch (err) {
					console.log(err)
					// error creating level up image
				}
			}
		}
		catch (err) {
			console.log(err)
		}
	}
}

module.exports = CommandHandler
