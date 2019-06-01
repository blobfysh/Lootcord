// Disables the jackpot command to prevent users from losing money when the bot restarts/updates

module.exports = {
    name: 'botlockdown',
    aliases: [''],
    description: 'Admin-only command. Disables some commands.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){

        if(message.client.restartLockdown){
            message.client.shard.broadcastEval(`this.restartLockdown = false`);
            message.reply('Disabled lockdown');
        }
        else{
            message.client.shard.broadcastEval(`this.restartLockdown = true`);
            message.reply('Enabled lockdown');
        }
    },
}