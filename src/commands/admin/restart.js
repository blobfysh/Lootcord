
module.exports = {
    name: 'restart',
    aliases: [''],
    description: "Restarts a cluster.",
    long: "Restarts a cluster.",
    args: {
        "Cluster ID": "ID of cluster to reboot."
    },
    examples: ["restart 0"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let clusterID = message.args[0];

        if(!clusterID || !parseInt(clusterID)){
            return message.reply('❌ You forgot to include a cluster ID.')
        }

        try{
            message.reply(`Restarting cluster \`${clusterID}\`...`);

            app.restartCluster(parseInt(clusterID));
        }
        catch(err){
            message.reply("Error messaging user:```\n" + err + "```")
        }
    },
}