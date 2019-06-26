const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const methods = require('../../methods/methods.js');
const Filter = require('bad-words');
const filter = new Filter();
//const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'create',
    aliases: [''],
    description: 'Create a clan.',
    minimumRank: 0,
    requiresClan: false,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        var clanName = args.join(" ");
        const clanRow = (await query(`SELECT * FROM clans WHERE LOWER(name) = ?`, [clanName.toLowerCase()]));

        if(!args.length){
            return message.reply('Please specify a clan tag.');
        }
        else if(scoreRow.clanId !== 0){
            return message.reply('You are already in a clan!');
        }
        else if(!/^[a-zA-Z0-9 ]+$/.test(clanName)){
            return message.reply('Special characters are not supported in clan tags. Supported: Alphanumeric characters and space');
        }
        else if(clanName.length > 20){
            return message.reply(lang.setstatus[0].replace('{0}', clanName.length));
        }
        else if(filter.isProfane(clanName)){
            return message.reply('The clan tag you are trying to use contains innappropiate language. **Vulgar clan tags will not be tolerated.**');
        }
        else if(clanRow.length){
            return message.reply('A clan with that tag already exists!');
        }
        else if(scoreRow.money < 50000){
            return message.reply('You need atleast $50,000 to create a clan! Come back when you\'ve racked up some more money...');
        }
        else{
            message.reply('**📤 Cost: $50,000**\n\nCreate clan with the tag: `' + clanName + '`?').then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(collected => {
                    const reaction = collected.first();
    
                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        message.reply('Success!');
                        createClan(clanName, message.author.id);
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply(lang.errors[3]);
                });
            });
        }
    },
}

async function createClan(clanTag, clanOwner){
    const clanRow = await query(insertClanSQL, [clanTag, clanOwner, (new Date()).getTime()]);
    const clanID = (await query(`SELECT clanId FROM clans WHERE ownerId = ${clanOwner}`))[0].clanId;
    const itemRow = await query(insertItemsSQL, [clanID, 0]);

    query(`UPDATE scores SET clanId = ${clanID} WHERE userId = ${clanOwner}`);
    query(`UPDATE scores SET clanRank = 2 WHERE userId = ${clanOwner}`);
}

const insertClanSQL = `
INSERT IGNORE INTO clans (
    name,
    ownerId,
    money,
    status,
    iconURL,
    clanCreated)
    VALUES (
        ?, ?,
        0, '', '',
        ?
    )
`

const insertItemsSQL = `
INSERT IGNORE INTO items (
    userId,
    item_box,
    rpg,
    rocket, 
    ak47,
    rifle_bullet, 
    rock,
    arrow, 
    fork, 
    club, 
    sword, 
    bow,
    pistol_bullet, 
    glock,
    crossbow, 
    spear,
    thompson, 
    health_pot, 
    ammo_box, 
    javelin, 
    awp, 
    m4a1, 
    spas, 
    medkit, 
    revolver, 
    buckshot,
    blunderbuss, 
    grenade,
    pills, 
    bat,
    baseball, 
    peck_seed, 
    iron_shield, 
    gold_shield, 
    ultra_box, 
    rail_cannon, 
    plasma, 
    fish, 
    50_cal,
    token,
    candycane, 
    gingerbread,
    mittens, 
    stocking,
    snowball, 
    nutcracker,
    screw, 
    steel,
    adhesive,
    fiber_optics,
    module,
    ray_gun,
    golf_club, 
    ultra_ammo, 
    stick,
    xp_potion,
    reroll_scroll, 
    light_pack, 
    canvas_bag, 
    hikers_pack,
    golden_egg, 
    easter_egg, 
    bunny, 
    carrot,
    candy_egg, 
    tnt_egg,
    care_package,
    recruit,
    looter,
    killer,
    hitman,
    cyber_pack,
    supply_signal,
    wood,
    cloth,
    pistol_body,
    smg_body,
    pump_body,
    assault_body,
    rifle_body,
    gunpowder)
    VALUES (
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0
    )
`