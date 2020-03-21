class CommandHandler {
    constructor(app){
        this.app = app;
        this.spamCooldown = new Set();
        this.prefix = app.config.prefix;
    }

    async handle(message){
        const prefix = message.channel.guild ? await this.getPrefix(message.channel.guild.id) : this.prefix;

        if(!message.content.toLowerCase().startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = this.app.commands.get(commandName) || this.app.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        // no command was found
        if(!command) return;

        // makes sure command wasn't used in DM's
        if(!message.channel.guild) return;

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

        // chcek if user is admin before running admin command
        if(command.category == "admin" && !this.app.sets.adminUsers.has(message.author.id)) return;

        // ignore mod command if user is not a moderator or admin
        if(command.category == "moderation" && (!this.app.sets.moderators.has(message.author.id) && !this.app.sets.adminUsers.has(message.author.id))) return;

        // check if command requires an account at all. 
        //TODO make this automatic by creating account here
        if(command.requiresAcc && !(await this.app.player.hasAccount(message.author.id))) return message.channel.createMessage(`❌ You need an account to use that command. Use \`${prefix}play\` to make one!`);

        // check if command requires an active account (player would be elligible to be attacked) in the server
        if(command.requiresAcc && command.requiresActive && !(await this.app.player.isActive(message.author.id, message.channel.guild.id))) return message.channel.createMessage(`❌ You need to activate before using that command here! Use \`${prefix}play\` to activate.`);
        
        // check if user has manage server permission before running guildModsOnly command
        if(command.guildModsOnly && !message.member.permission.has('manageGuild')) return message.channel.createMessage('❌ You need the `Manage Server` permission to use this command!');
        
        // execute command
        try{
            command.execute(this.app, this.buildMessage(message, prefix, args));

            // dont add spamCooldown if in debug mode or user is admin
            if(this.app.config.debug || this.app.sets.adminUsers.has(message.author.id)) return;

            this.spamCooldown.add(message.author.id);
            setTimeout(() => {
                this.spamCooldown.delete(message.author.id);
            }, 3000);//3 second spam cooldown
        }
        catch(err){
            console.error(require('util').inspect(err));
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