const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const config = require('../../json/_config.json');

module.exports = {
    name: 'message',
    aliases: [''],
    description: 'Sends a message to a user.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        var userNameID = args[0];
        
        var messageIn = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(messageIn == ""){
                message.reply("You forgot to put a message! `"+prefix+"message (ID) (MESSAGE)`");
            }
            else{
                let imageAttached = message.attachments.array();

                const userMsg = new Discord.RichEmbed()
                .setAuthor(`📨New message!📨`)
                .setTitle("**" + message.author.tag + "** has messaged you :")
                .setThumbnail(message.author.avatarURL)
                .setDescription(messageIn)
                .setColor(16777215)
                .addBlankField()
                .setFooter("https://lootcord.com | Only moderators can send you messages.")

                if(Array.isArray(imageAttached) && imageAttached.length){
                    userMsg.setImage(imageAttached[0].url);
                }

                try{
                    const messageUser = await message.client.fetchUser(userNameID);
                    
                    if(Array.isArray(imageAttached) && imageAttached.length && imageAttached[0].url.endsWith(".mp4") || Array.isArray(imageAttached) && imageAttached.length && imageAttached[0].url.endsWith(".mp3")){
                        messageUser.send("**Included attachment:**", {embed : userMsg, files: [{attachment: imageAttached[0].url}]});
                    }
                    else{
                        messageUser.send(userMsg);
                    }
                    message.reply("📨Message sent to `"+messageUser.tag+"`!");
                }
                catch(err){
                    message.reply("**Error sending message:**```"+err+"```")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your messaage. `"+prefix+"message (ID) (MESSAGE)`");
        }
    },
}