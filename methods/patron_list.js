const Discord   = require('discord.js');
const methods   = require('./methods.js');
const { query } = require('../mysql.js');

exports.list_patrons = async function(client){
    const tier1Patrons = await query('SELECT userId FROM patrons WHERE tier = 1');
    const tier2Patrons = await query('SELECT userId FROM patrons WHERE tier = 2');
    const tier3Patrons = await query('SELECT userId FROM patrons WHERE tier = 3');

    var tier1s = [];
    var tier2s = [];
    var tier3s = [];

    var patronJSON = {
        tier1  : {}, 
        tier2  : {}, 
        tier3  : {}
    };

    for(var key in tier1Patrons){
        try{
            var userInfo = await client.fetchUser(tier1Patrons[key].userId);
            tier1s.push(userInfo.tag + " | " + tier1Patrons[key].userId);

            patronJSON.tier1[userInfo.tag] = {
                data: '',
                avatar: userInfo.avatarURL
            };
        }
        catch(err){
            
        }
    }
    for(var key in tier2Patrons){
        try{
            var userInfo = await client.fetchUser(tier2Patrons[key].userId);
            tier2s.push(userInfo.tag + " | " + tier2Patrons[key].userId);

            patronJSON.tier2[userInfo.tag] = {
                data: '',
                avatar: userInfo.avatarURL
            };
        }
        catch(err){
            
        }
    }
    for(var key in tier3Patrons){
        try{
            var userInfo = await client.fetchUser(tier3Patrons[key].userId);
            tier3s.push(userInfo.tag + " | " + tier3Patrons[key].userId);

            patronJSON.tier3[userInfo.tag] = {
                data: '',
                avatar: userInfo.avatarURL
            };
        }
        catch(err){
            
        }
    }

    return {
        tier1s     : tier1s,
        tier2s     : tier2s,
        tier3s     : tier3s,
        patronJSON : patronJSON
    }
}