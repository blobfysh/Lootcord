class CommandHandler {
    constructor(app){
        this.app = app;
        this.spamCooldown = new Set();
        this.prefix = app.config.prefix;
    }

    async handle(message, prefix){
        const args = message.content.slice(this.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = this.app.commands.get(commandName) || this.app.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        // no command was found
        if(!command) return;

        // makes sure command wasn't used in DM's
        else if(!message.channel.guild) return;

        // check if user has spam cooldown
        else if(this.spamCooldown.has(message.author.id)){
            const botMsg = await message.channel.createMessage("⏱ **You're talking too fast, I can't understand! Please slow down...** `2 seconds`");
            setTimeout(() => {
                botMsg.delete();
            }, 2000);

            return;
        }

        // chcek if user is admin before running admin command
        else if(command.category == "admin" && !this.app.sets.adminUsers.has(message.author.id)) return;

        // ignore mod command if user is not a moderator or admin
        else if(command.category == "moderation" && (!this.app.sets.moderators.has(message.author.id) && !this.app.sets.adminUsers.has(message.author.id))) return;

        // execute command
        try{
            command.execute(this.app, this.buildMessage(message, args));

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

    buildMessage(message, args){
        let msg = message;
        msg.args = args;
        msg.reply = function(content){
            return msg.channel.createMessage({content: `<@${msg.author.id}>, ` + content});
        }

        return msg;
    }
}

module.exports = CommandHandler;