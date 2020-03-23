
module.exports = {
    name: 'report',
    aliases: [''],
    description: "Report another player for breaking the rules.",
    long: "Report another player to the mods. Supports image attachments.",
    args: {"discord#tag": "The tag of the user you're reporting or their user ID.", "reason": "The reason for reporting them."},
    examples: ["report blobfysh#4679 Looked at me funny"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let userOldID = message.args[0];
        let messageIn = message.args.slice(1).join(" ");
        let reportCD = await app.cd.getCD(message.author.id, 'report');

        if(reportCD){
            message.reply(`You just sent a report! Wait \`${reportCD}\` before sending another.`);
        }
        else if(userOldID == undefined){
            message.reply('You need to include a discordtag#1234 and the reason for reporting! `' + message.prefix + 'report <discord#tag> <reason for report>`');
        }
        else if(messageIn == ""){
            message.reply("You forgot to put a message! `" + message.prefix + "report <discordtag#1234> <reason for report>`");
        }
        else if(/^<?@?!?(\d+)>?$/.test(userOldID) || /^(.*)#([0-9]{4})$/.test(userOldID)){
            const botMessage = await message.reply("Confirm this report? " + userOldID);
            
            try{
                let confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    let imageAttached = message.attachments;

                    const reportEmbed = new app.Embed()
                    .setAuthor("New Report")
                    .setThumbnail(message.author.avatarURL)
                    .addField("Submitted by", `${message.author.tag}\n(${message.author.id})`)
                    .addField("User", userOldID)
                    .addField("Reason", messageIn)
                    .setFooter(`Respond with t-message ${message.author.id} <message>`)
                    .setColor(16734296)
                    
                    if(Array.isArray(imageAttached) && imageAttached.length){
                        if(imageAttached[0].url.endsWith(".mp4") || imageAttached[0].url.endsWith(".mp3")){
                            reportEmbed.addField("File", imageAttached[0].url)
                        }
                        else{
                            reportEmbed.setImage(imageAttached[0].url);
                        }
                    }

                    app.messager.messageMods({embed: reportEmbed.embed}, { ping: true });

                    app.cd.setCD(message.author.id, 'report', 300 * 1000);

                    botMessage.edit("Report successfully sent!");
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                console.log(require('util').inspect(err));
                botMessage.edit("You didn't react in time!");
            }
        }
        else{
            message.reply('You must include a valid discordtag#1234 or user ID.');
        }
    },
}