//const Discord = require('discord.js');
const config = require('../json/_config.json');
const { query } = require('../mysql.js');

const cryptor = require('object-encode');
const encryptKey = config.encryptionAuth;

exports.getinvcode = function(message, userID){
    return query(`SELECT * FROM items 
    INNER JOIN scores
    ON items.userId = scores.userId
    WHERE items.userId = '${userID}'`).then(oldRow => {
        const userRow = oldRow[0];
        var userInvCode = {};
        var userValArray = [];

        Object.keys(userRow).forEach(item => {
            if(userRow[item] !== 0){
                userInvCode[item] = userRow[item];
                userValArray.push(userRow[item]);
            }
        });

        var encoded = cryptor.encode_object(userInvCode, 'base64', encryptKey);

        return {
            invCode: encoded,
            invLength: userValArray.length,
            invArray: userValArray
        }
    }).catch((err) => {
        message.reply("Error getting inventory: ```"+err+"```");
    });
}

exports.decodeCode = function(toDecode){
    return cryptor.decode_object(toDecode, 'base64', encryptKey);
}