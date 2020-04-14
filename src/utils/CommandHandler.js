class CommandHandler {
    constructor(app){
        this.app = app;
        this.spamCooldown = new Set();
        this.prefix = app.config.prefix;
    }

    async handle(message){
        const prefix = message.guild ? await this.getPrefix(message.guild.id) : this.prefix;

        if(!message.content.toLowerCase().startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = this.app.commands.get(commandName) || this.app.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        // no command was found
        if(!command) return;

        // makes sure command wasn't used in DM's
        if(!message.guild) return;

        // check if user is banned from bot
        if(await this.app.cd.getCD(message.author.id, 'banned')) return;

        // makes sure bot has all permissions from config (prevents permission-related errors)
        if(!this.botHasPermissions(message)) return;

        // check if user has spam cooldown
        if(this.spamCooldown.has(message.author.id)){
            const botMsg = await message.channel.createMessage("⏱ **You're talking too fast, I can't understand! Please slow down...** `2 seconds`");
            setTimeout(() => {
                botMsg.delete();
            }, 2000);

            return;
        }

        if(this.app.sets.disabledCommands.has(command.name)){
            return message.channel.createMessage('❌ That command has been disabled to prevent issues! Sorry about that...');
        }

        const peckCD = await this.app.cd.getCD(message.author.id, 'peck');

        // check if user is under effects of peck_seed
        if(peckCD && command.category !== "admin" && command.category !== "moderation"){
            const embedChicken = new this.app.Embed()
            .setAuthor(message.author.tag, message.author.avatarURL)
            .setTitle('`you try to type a command but your insatiable appetite for seeds keeps you preoccupied`')
            .setColor(16734296)
            .setFooter(`Your appetite will calm in ${peckCD}.`)

            return message.channel.createMessage(embedChicken);
        }

        // chcek if user is admin before running admin command
        if(command.category == "admin" && !this.app.sets.adminUsers.has(message.author.id)) return;

        // ignore mod command if user is not a moderator or admin
        if(command.category == "moderation" && (!(await this.app.cd.getCD(message.author.id, 'mod')) && !this.app.sets.adminUsers.has(message.author.id))) return;

        const account = await this.app.player.getRow(message.author.id);

        // check if player leveled up
        if(account) await this.app.player.checkLevelXP(message, account);

        // check if command requires an account at all, create new account for player if command requires it.
        if(command.requiresAcc && !(account)) await this.app.player.createAccount(message.author.id, message.guild.id);

        // check if player meets the minimum level required to run the command
        if(command.levelReq && (account.level < command.levelReq)) return message.channel.createMessage('❌ You must be atleast level `' + command.levelReq + '` to use that command!');

        // check if command requires an active account (player would be elligible to be attacked) in the server
        if(command.requiresAcc && command.requiresActive && !(await this.app.player.isActive(message.author.id, message.guild.id))) return message.channel.createMessage(`❌ You need to activate before using that command here! Use \`${prefix}activate\` to activate.`);
        
        // check if user has manage server permission before running guildModsOnly command
        if(command.guildModsOnly && !message.member.permission.has('manageGuild')) return message.channel.createMessage('❌ You need the `Manage Server` permission to use this command!');
        
        // execute command
        try{
            this.app.cache.incr('commands');
            this.app.query(`UPDATE scores SET lastActive = NOW() WHERE userId = ${message.author.id}`);
            command.execute(this.app, this.buildMessage(message, prefix, args));

            // dont add spamCooldown if in debug mode or user is admin
            if(this.app.config.debug || this.app.sets.adminUsers.has(message.author.id)) return;

            // donator reduced spam cooldown
            if(await this.app.cd.getCD(message.author.id, 'patron')){
                this.spamCooldown.add(message.author.id);
                setTimeout(() => {
                    this.spamCooldown.delete(message.author.id);
                }, 1000);// 1 second spam cooldown

                return;
            }

            this.spamCooldown.add(message.author.id);
            setTimeout(() => {
                this.spamCooldown.delete(message.author.id);
            }, 3000);// 3 second spam cooldown
        }
        catch(err){
            console.error(err);
            message.channel.createMessage('Command failed to execute!');
        }
    }

    buildMessage(message, prefix, args){
        let msg = message;
        msg.args = args;
        msg.prefix = prefix;
        msg.sentTime = Date.now();
        msg.reply = function(content){
            return msg.channel.createMessage({content: `<@${msg.author.id}>, ` + content});
        }

        return msg;
    }

    // checks cache for guild prefix on every message sent, reduces call to database for guild prefix
    async getPrefix(guildId){
        let cachePrefix = await this.app.cache.get(`prefix|${guildId}`);
    
        if(!cachePrefix){
            try{
                const prefixRow = (await this.app.query(`SELECT * FROM guildPrefix WHERE guildId = ${guildId}`))[0];
                
                if(prefixRow){
                    await this.app.cache.set(`prefix|${guildId}`, prefixRow.prefix, 43200);
                    return prefixRow.prefix
                }
                else{
                    await this.app.cache.set(`prefix|${guildId}`, this.prefix, 43200);
                    return this.prefix
                }
            }
            catch(err){
                console.log('[CMD] Prefix query failed, MySQL not working?:')
                console.log(err);
                this.cache.incr('mysql_errors');
            }
        }
        else{
            return cachePrefix;
        }
    }

    // check that bot has all permissions specificed in config before running a command.
    botHasPermissions(message){
        let botPerms = message.channel.permissionsOf(this.app.bot.user.id);
        let neededPerms = [];

        for(var perm of this.app.config.requiredPerms){
            if(!botPerms.has(perm)) neededPerms.push(perm);
        }

        if(neededPerms.length) {
            let permsString = neededPerms.map((perm) => neededPerms.length > 1 && neededPerms.indexOf(perm) == (neededPerms.length - 1) ? 'or `' + perm + '`': '`' + perm + '`').join(', ');
            if(!neededPerms.includes("sendMessages")) message.channel.createMessage(`I don't have permission to ${permsString}... Please reinvite me or give me those permissions :(`);
            return false;
        }
        else return true;
    }
}

module.exports = CommandHandler;