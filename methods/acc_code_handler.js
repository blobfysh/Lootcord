//const Discord = require('discord.js');
const config = require('../json/_config.json');
const { query } = require('../mysql.js');
const general = require('./general');

const cryptor = require('object-encode');
const encryptKey = config.encryptionAuth;

exports.getinvcode = async function(message, userID){
    try{
        const userRow = (await query(`SELECT * FROM scores WHERE userId = '${userID}'`))[0];
        const itemRow = await general.getItemObject(userID);
        const combinedRow = {...userRow, ...itemRow};
        
        var userInvCode = {};
        var userValArray = [];

        Object.keys(combinedRow).forEach(item => {
            if(combinedRow[item] !== 0){
                userInvCode[item] = combinedRow[item];
                userValArray.push(combinedRow[item]);
            }
        });

        var encoded = cryptor.encode_object(userInvCode, 'base64', encryptKey);

        return {
            invCode: encoded,
            invLength: userValArray.length,
            invArray: userValArray
        }
    }
    catch(err){
        message.reply("Error getting inventory: ```"+err+"```");
    }
}

exports.decodeCode = function(toDecode){
    return cryptor.decode_object(toDecode, 'base64', encryptKey);
}