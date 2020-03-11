module.exports = {
    name: 'togglecommand',
    aliases: [''],
    description: 'Admin-only command. Enable/disable specific commands.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        if(message.client.sets.disabledCommands.has(args[0])){
            message.client.shard.broadcastEval(`this.sets.disabledCommands.delete('${args[0]}')`);
            
            message.reply('Successfully enabled the `' + args[0] + '` command.');
        }
        else{
            message.client.shard.broadcastEval(`this.sets.disabledCommands.add('${args[0]}')`);
            
            message.reply('Successfully disabled the `' + args[0] + '` command.');
        }
    },
}