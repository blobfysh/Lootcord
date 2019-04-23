
const Discord = require('discord.js');
const config = require('./json/_config.json');
//global.sql = require("sqlite").open("./score.sqlite");
//const DBL = require("dblapi.js");
//global.dbl = new DBL(config.dblToken, {webhookPath: '/dblwebhook', webhookPort: '5000', webhookAuth: config.dblAuth});
const Manager = new Discord.ShardingManager('./index.js',);
Manager.spawn(2); //2 shards

/*
let Client = require('ssh2-sftp-client');
let sftp = new Client();
sftp.connect({
    host: 'thanbot.com',
    port: '22',
    username: 'u know this',
    password: 'TsuperSecret'
}).then(() => {
    return sftp.list('/home/natkam3/thanbot.com/');
}).then((data) => {
    console.log(data);
    sftp.mkdir("/home/natkam3/thanbot.com/NEWFOLDER")
}).catch((err) => {
    console.log(err, 'catch error');
});
*/

/*
function GetPalavra(msg){
    var anagrama = msg
    var palavras = "**Words**"
    var s = palavras.split(",")
    var p = []
    for(X = 0;X< s.length;X++){
        if(s[X].length ==anagrama.length){
            for(Y = 0;Y < anagrama.length;Y++){
                if(s[X].indexOf(anagrama[Y]) != -1){
                    if(Y ==anagrama.length- 1){
                        if(p.indexOf(s[X]) == -1){
                            p.push(s[X])
                        }
                    }
                }
                else{                
                    break
                }
            }
        }
    }
    if(p.join(" ") != " " &&p.join(" ") != "" ){
        message.channel.send(p.join(" "))
    }
}
*/