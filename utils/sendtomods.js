const config = require('../json/_config.json');
const Discord = require('discord.js');

/*
    idea if this sends multiple messages to user,

    Get index of the first true in the returned array, use that index in another broadcastEval()
    as the shard id to use when sending message to specific user

    message.client.shard.broadcastEval(`
        if(this.shard.id === INDEX) user.send(message);
    `);

    IDEA 2

    -Save the senders shard.id with their message, then have the mods specify the shard id to send messages with when they call the message command.


    
    BETTER IDEA 3

    Client#fetchUser() will make a call to discord api if user is not cached, and will only error when trying to send a DM which can be handled with .catch()
*/

exports.sendToMods = function(message, lang){
    if(message.client.sets.moddedUsers.has(message.author.id)){
        return;
    }
    else if(message.client.sets.messageSpamCooldown.has(message.author.id)){
        return message.author.send("You just sent a message! Wait 3 minutes between sending messages.");
    }

    message.author.send("Send this message to the mods?\n**DO NOT SEND INAPPROPRIATE IMAGES**\n`You can send one message every 3 minutes`").then(botMessage => {
        botMessage.react('✅').then(() => botMessage.react('❌'));
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };
        botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
        .then(collected => {
            const reaction = collected.first();

            if(reaction.emoji.name === '✅'){
                botMessage.delete();

                message.client.shard.broadcastEval(`this.sets.messageSpamCooldown.add('${message.author.id}');`);
                setTimeout(() => {
                    message.client.shard.broadcastEval(`this.sets.messageSpamCooldown.delete('${message.author.id}');`);
                }, 180 * 1000);

                const embedInfo = new Discord.RichEmbed()
                .setTitle(`📨**Your message has been sent to the mods!**`)
                .setAuthor(message.author.tag, message.author.avatarURL)
                .setDescription("We will respond soon!")
                .setColor(0)
                .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/495135804943761418/sucka.png")
                .addBlankField()
                .addField("Website", "https://lootcord.com",true)
                .setFooter("Spamming PM's will get you banned.")
                message.author.send(embedInfo);


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
                        channel.send("<@&${config.modRoleID}>", {${embedFile} {
                                color: 0,
                                thumbnail: {
                                    url: "${message.author.avatarURL}",
                                },
                                author: {
                                    name: "Sent from shard ${message.client.shard.id}",
                                },
                                fields: [
                                    {
                                        name: "📨**New message!**",
                                        value: "${message.content}",
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
            else{
                botMessage.delete();
            }
        }).catch(collected => {
            botMessage.delete();
            message.reply("You didn't react in time!");
        });
    }).catch(error => {
        console.log(error);
    })
}