const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const general   = require('../methods/general');
const itemdata  = require('../json/completeItemList.json');
const bm_methods = require('../methods/black_market');

module.exports = {
    name: 'blackmarketlistings',
    aliases: ['bmlistings', 'bmlisting'],
    description: 'View your Black Market listings.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const listings = await query(`SELECT * FROM blackmarket WHERE sellerId = ${message.author.id}`);

        if(listings.length <= 10){
            return message.reply(embedPage(0, listings, message));
        }
        let pageNum = 0;
        let maxPage = Math.ceil(listings.length / 10);
        const botMessage = await message.reply(embedPage(pageNum, listings, message));
        await botMessage.react('◀');
        await botMessage.react('▶');
        await botMessage.react('❌');

        const collector = botMessage.createReactionCollector((reaction, user) => user.id === message.author.id && reaction.emoji.name === "◀" || user.id === message.author.id && reaction.emoji.name === "▶" || user.id === message.author.id && reaction.emoji.name === "❌", {time: 30000});
        
        collector.on("collect", reaction => {
            const chosen = reaction.emoji.name;
            if(chosen === "◀"){
                if(pageNum > 0){
                    pageNum -= 1;
                    botMessage.edit(embedPage(pageNum, listings, message));
                }
                reaction.remove(message.author.id);
                //previous page
            }
            else if(chosen === "▶"){
                if(pageNum < maxPage - 1){
                    pageNum += 1;
                    botMessage.edit(embedPage(pageNum, listings, message));
                }
                reaction.remove(message.author.id);
                // Next page
            }
            else if(chosen === "❌"){
                // Stop navigating pages
                collector.stop();
                botMessage.delete();
            }
        });
        collector.on("end", reaction => {
        });
    },
}

function embedPage(pageNum, listings, message){
    let selectedListings = listings.slice(pageNum * 10, (pageNum * 10) + 10)
    const embed = new Discord.RichEmbed()
    .setAuthor(message.author.username + "'s Listings", message.author.avatarURL)
    .setDescription('List more with `bmlist`\nRemove a listing with `bmremove <listing ID>`\n' + bm_methods.createDisplay(selectedListings))
    .setColor(13215302)
    .setFooter(`Page ${pageNum + 1}/${Math.ceil(listings.length/10)}`)

    return embed;
}