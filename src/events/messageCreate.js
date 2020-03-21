const CommandHandler = require('../utils/CommandHandler');

exports.run = function(message){
    if(message.author.bot) return;
    if(!message.content.startsWith(this.config.prefix)) return;

    // bot is not ready to accept commands
    if(!this.isReady) return;

    this.commandHandler.handle(message);
}

async function getPrefix(config){

}