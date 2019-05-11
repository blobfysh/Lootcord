module.exports = {
    name: 'restartshard',
    aliases: ['botrestart', 'shardrestart'],
    description: 'Admin-only command.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        try{
            await message.reply('Restarting shard `' + args[0] + '`');

            message.client.shard.broadcastEval(`
                if(this.shard.id === ${args[0]}){
                    process.exit();
                    true;
                }
                else{
                    false;
                }
            `).then(array => {
                if(!array.includes(true)){
                    message.reply('Could not find shard with that id.');
                }
            });
        }
        catch(err){
            message.reply("Error:```"+err+"```");
        }
    },
}