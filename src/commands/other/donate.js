
module.exports = {
    name: 'donate',
    aliases: ['patreon'],
    description: "Help support the bot!",
    long: "[Help support the development of Lootcord and get some cool rewards!](https://www.patreon.com/lootcord)",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        if(!await app.patreonHandler.isPatron(message.author.id)){
            return message.channel.createMessage(`**Help support the development of Lootcord!** Become a patron and get some cool rewards like:
            \n- **Access to the bounty system.** Take down powerful bounties that spawn randomly in a channel of your choice (you can see this in action on the official server).\n- **Reduced global spam cooldown** from 3 seconds to 1 second.\n- An animated ${app.itemdata['patron'].icon}\`patron\` banner to show off your support.\n- A role in the official Discord server.\n- Supporting the development of the bot!
            \nhttps://www.patreon.com/lootcord`);
        }

        const spawnsInfo = await app.mysql.select('spawnChannels', 'userId', message.author.id, true);
        let activeBountyChannels = [];

        for(let i = 0; i < spawnsInfo.length; i++){
            activeBountyChannels.push(`${i + 1}. <#${spawnsInfo[i].channelId}>`);
        }

        const donateEmb = new app.Embed()
        .setAuthor('Thank you!', message.author.avatarURL)
        .addField('Patron Status', 'active 😃')
        .addField('Active Bounty Channels (' + activeBountyChannels.length + ')', activeBountyChannels.join('\n') || 'None')
        .addField('How do I claim my weekly reward?', 'Use `' + message.prefix + 'weekly` to claim your ' + app.itemdata['care_package'].icon + '`care_package` every week!')
        .addField('How do I use the bounty system?', 'Spawn bounties in a channel using the `enablebounty` command.'
        + '\n\nTo stop all active bounty spawns use `disablebounty`.'
        + '\n\nOnce a bounty has spawned, you or anyone in the server can use the `bounty` command to view the bounty and fight it!'
        + '\n\n*Bounties spawn every 8 - 12 hours, they will then stay until defeated or until their time runs out.*')
        .setColor('#f96854')
        message.channel.createMessage(donateEmb);
    },
}