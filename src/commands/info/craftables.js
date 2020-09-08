const { ITEM_TYPES } = require('../../resources/constants');

module.exports = {
    name: 'craftables',
    aliases: ['craftable'],
    description: 'Shows all items you can currently craft.',
    long: 'Shows all items you can currently craft using the items in your inventory.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const userItems = await app.itm.getItemObject(message.author.id);
        const itemsSorted = Object.keys(app.itemdata).sort(app.itm.sortItemsHighLow.bind(app));
        const craftableItems = itemsSorted.filter(item => app.itemdata[item].craftedWith !== "" && app.itemdata[item].craftedWith.level <= row.level);
        let craftables = [];

        for(let i = 0; i < craftableItems.length; i++){
            if(canCraft(craftableItems[i])){
                craftables.push(craftableItems[i] + '|' + maxCraft(craftableItems[i]));
            }
        }

        for(let i = 0; i < craftables.length; i++){
            let itemAmount = craftables[i].split('|');
            craftables[i] = itemAmount[1] + 'x ' + app.itemdata[itemAmount[0]].icon + '`' + itemAmount[0] + '`';
        }

        function canCraft(item){
            let data = app.itemdata[item];

            for(let i = 0; i < data.craftedWith.materials.length; i++){
                let matName = data.craftedWith.materials[i].split('|')[0];
                let matAmnt = data.craftedWith.materials[i].split('|')[1];

                if(userItems[matName] === undefined || userItems[matName] < matAmnt) return false;
            }

            return true;
        }

        function maxCraft(item){
            let data = app.itemdata[item];
            let max = [];

            for(let i = 0; i < data.craftedWith.materials.length; i++){
                let matName = data.craftedWith.materials[i].split('|')[0];
                let matAmnt = data.craftedWith.materials[i].split('|')[1];

                max.push(Math.floor(userItems[matName] / matAmnt));
            }

            return max.sort((a, b) => a - b)[0];
        }

        let meleeWeapons = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Melee');
        let rangedWeapons = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ranged');
        let items = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Item');
        let ammo = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ammo');
        let material = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Material');
        let storage = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Storage');
        let banners = craftableItems.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Banner');
        
        const craftableEmb = new app.Embed()
        .setTitle('Craftables')
        .setDescription('**Items you are a high enough level to craft:**' + (craftableItems.length ? '' : '\nNothing, you should level up more!'))
        .setColor(13451564)

        craftableEmb.addField(ITEM_TYPES['ranged'].name, rangedWeapons.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
        craftableEmb.addField(ITEM_TYPES['melee'].name, meleeWeapons.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
        craftableEmb.addField(ITEM_TYPES['items'].name, items.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
        craftableEmb.addField(ITEM_TYPES['ammo'].name, ammo.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
        craftableEmb.addField(ITEM_TYPES['materials'].name, material.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
        craftableEmb.addField(ITEM_TYPES['storage'].name, storage.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
        craftableEmb.addField(ITEM_TYPES['banners'].name, banners.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)

        craftableEmb.addField('\u200b' ,'**These are the items you can craft right now:**\n' + (craftables.length ? craftables.join('\n') : 'You don\'t have the materials to craft anything right now!'))

        message.channel.createMessage(craftableEmb);
    },
}