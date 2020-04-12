
module.exports = {
    name: 'craftitems',
    aliases: ['recycleitems', 'recycleitem', 'craftitem'],
    description: 'Shows what an item can craft.',
    long: 'View what an item can craft and what it recycles from.',
    args: {"item": "Item to search."},
    examples: ["craftitems gunpowder"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    execute(app, message){
        let itemSearched = app.parse.items(message.args)[0];

        if(!itemSearched){
            return message.reply(`That item isn't in my database! Use \`${message.prefix}items\` to see a full list`)
        }
        
        let craftItems = [];
        let recycledFrom = [];

        Object.keys(app.itemdata).forEach(item => {
            if(app.itemdata[item].craftedWith !== ''){
                for(let i = 0; i < app.itemdata[item].craftedWith.materials.length; i++){
                    if(app.itemdata[item].craftedWith.materials[i].split('|')[0] == itemSearched){
                        craftItems.push(app.itemdata[item].icon + ' ' + item);
                    }
                }
            }
            
            if(app.itemdata[item].recyclesTo.length == undefined){
                for(var i = 0; i < app.itemdata[item].recyclesTo.materials.length; i++){
                    if(app.itemdata[item].recyclesTo.materials[i].split('|')[0] == itemSearched){
                        recycledFrom.push(app.itemdata[item].icon + ' ' + item);
                    }
                }
            }
        });

        const infoEmbed = new app.Embed()
        .setTitle(app.itemdata[itemSearched].icon + ' ' + itemSearched + ' Info')
        .setColor(14202368)
        .setFooter('Looking for more general item info? Use ' + message.prefix + 'item <item>')
        if(craftItems.length > 0){
            infoEmbed.addField('🔩 Used to craft', craftItems.join('\n'), true)
        }
        if(recycledFrom.length > 0){
            infoEmbed.addField('♻ Recycled from', recycledFrom.join('\n'), true)
        }
        else if(craftItems.length == 0){
            infoEmbed.setDescription('This item cannot be used to craft and is not recycled from any other items.')
        }
        
        message.channel.createMessage(infoEmbed);
    },
}