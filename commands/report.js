const config = require('../json/_config.json');

module.exports = {
    name: 'report',
    aliases: [''],
    description: 'Report another player for breaking the rules.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: true,
    worksWhenInactive: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let userOldID = args[0];
        let messageIn = args.slice(1).join(" ");

        if(message.client.sets.messageSpamCooldown.has(message.author.id)){
            message.reply("You just sent a report! Wait 3 minutes between sending reports.");
        }
        else if(userOldID == undefined){
            message.reply('You need to include a discordtag#1234 and the reason for reporting! `'+prefix+'report <discord#tag> <reason for report>`');
        }
        else if(messageIn == ""){
            message.reply("You forgot to put a message! `"+prefix+"report <discordtag#1234> <reason for report>`");
        }
        else if(/^<?@?!?(\d+)>?$/.test(userOldID) || /^(.*)#([0-9]{4})$/.test(userOldID)){
            const botMessage = await message.reply("Confirm this report? User: " + userOldID);
            await botMessage.react('✅');
            await botMessage.react('❌');
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            try{
                const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    submitReport(message, userOldID, messageIn);

                    message.client.shard.broadcastEval(`this.sets.messageSpamCooldown.add('${message.author.id}');`);
                    setTimeout(() => {
                        message.client.shard.broadcastEval(`this.sets.messageSpamCooldown.delete('${message.author.id}');`);
                    }, 180 * 1000);

                    botMessage.edit("Report successfully sent!");
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time!");
            }
        }
        else{
            message.reply('You must include a valid discordtag#1234 or user ID.');
        }
    },
}

function submitReport(message, user, reason){
    let imageAttached = message.attachments.array();
    let embedFile = 'embed: ';
    let attachURL = '';
    let imageURL = '';

    if(Array.isArray(imageAttached) && imageAttached.length){
        if(imageAttached[0].url.endsWith(".mp4") || imageAttached[0].url.endsWith(".mp3")){
            attachURL = `{name: "File", value: "${imageAttached[0].url}"},`;
            embedFile = `files: [{attachment: "${imageAttached[0].url}"}], embed: `;
        }
        else{
            imageURL = imageAttached[0].url;
        }
    }

    return message.client.shard.broadcastEval(`
        const channel = this.channels.get('${config.modChannel}');

        if(channel){
            channel.send("", {${embedFile} {
                    color: 16734296,
                    thumbnail: {
                        url: "${message.author.avatarURL}",
                    },
                    author: {
                        name: "New Report",
                    },
                    fields: [
                        {
                            name: "Submitted by",
                            value: "${message.author.tag} : ${message.author.id}",
                        },
                        {
                            name: "User",
                            value: "${user}",
                        },
                        {
                            name: "Reason",
                            value: "${reason}",
                        },
                        ${attachURL}
                    ],
                    image: {
                        url: "${imageURL}",
                    },
                    footer: {
                        text: "Respond with t-message ${message.author.id} <message>",
                    },
                }
            });
            true;
        }
        else{
            false;
        }
    `).then(console.log);
}