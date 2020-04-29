
module.exports = {
    name: 'donate',
    aliases: ['kofi'],
    description: "Help support the bot!",
    long: "[Help support the development of Lootcord!](https://ko-fi.com/blobfysh)",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const patronCD = await app.cd.getCD(message.author.id, 'patron');

        if(!patronCD){
            return message.channel.createMessage(`**Help support the development of Lootcord!** Donate and get some cool rewards like:
            \n- Reduced global spam cooldown from 3 seconds to 1 second.\n- A ${app.itemdata['kofi_king'].icon}\`kofi_king\` banner to show off your support.\n- A role in the official Discord server.\n- Supporting the development of the bot!
            \n**Your Discord ID:** \`${message.author.id}\`\nhttps://ko-fi.com/blobfysh`);
        }

        const donateEmb = new app.Embed()
        .setAuthor('Thank you!', message.author.avatarURL)
        .addField('Status', 'active 😃')
        .addField('Benefits', '```\n' + patronCD + '```')
        .setColor('#29ABE0')
        message.channel.createMessage(donateEmb);
    },
}