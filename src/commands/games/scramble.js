
module.exports = {
    name: 'scramble',
    aliases: [''],
    description: 'Unscramble a random word!',
    long: 'Unscramble a random word for a reward! Rewards vary depending on difficulty you choose, and the difficulty of the word.',
    args: {"difficulty": "easy or hard"},
    examples: ["scramble easy"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const scrambleCD = await app.cd.getCD(message.author.id, 'scramble');

        if(scrambleCD){
            return message.reply(`You need to wait  \`${scrambleCD}\`  before using this command again`);
        }

        let option = message.args[0] ? message.args[0].toLowerCase() : undefined;
        let scrambleJSONlength = Object.keys(app.scramble_words).length
        let chance = Math.floor(Math.random() * scrambleJSONlength); //returns value 0 between 32 (1 of 10)
        let scrambleWord = app.scramble_words[chance].word;  //json data word to scramble
        let scrambleDifficulty = app.scramble_words[chance].difficulty;
        let scrambleHint = app.scramble_words[chance].define;
        if(Math.random() <= .7){
            scrambleHint = app.scramble_words[chance].hint;
        }
        let finalWord = scrambleWord.toLowerCase(); //final word to check if user got correct
        let isHardMode = false;
        
        if(!option){
            return message.reply(`You need to choose a difficulty \`${message.prefix}scramble easy/hard\`\nEasy: Hint but less reward\nHard: Better reward, no hint`);
        }
        else if(option !== 'easy' && option !== 'hard'){
            return message.reply(`You need to choose a difficulty \`${message.prefix}scramble easy/hard\`\nEasy: Hint but less reward\nHard: Better reward, no hint`);
        }
        
        const embedScramble = new app.Embed()
        .setFooter('You have 30 seconds to unscramble this word.')
        
        if(option === "easy"){
            embedScramble.setDescription("**Hint:** " + scrambleHint + "\nWord: ```fix\n" + (shuffleWordNoDupe(scrambleWord))+"```");
        }
        else if(option === "hard"){
            embedScramble.setDescription("Word: ```fix\n" + shuffleWordNoDupe(scrambleWord.toLowerCase())+"```");
            isHardMode = true;
        }

        if(scrambleDifficulty == "hard"){
            embedScramble.setColor(16734296);
        }
        else if(scrambleDifficulty == "medium"){
            embedScramble.setColor(15531864);
        }
        else{
            embedScramble.setColor(9043800);
        }

        try{
            app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => {
                return m.author.id === message.author.id
            }, { time: 30000 });

            await app.cd.setCD(message.author.id, 'scramble', app.config.cooldowns.scramble * 1000);

            message.channel.createMessage(embedScramble);

            const collector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;
            
            collector.on('collect', async m => {
                if(m.content.toLowerCase() == finalWord){
                    app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                    
                    if(isHardMode){
                        if(scrambleDifficulty =="hard"){
                            const hasEnough = await app.itm.hasSpace(message.author.id, 1);

                            if((chance < scrambleJSONlength/4) && hasEnough){
                                await app.itm.addItem(message.author.id, 'ultra_box', 1);
                                message.channel.createMessage(scrambleWinMsg(app, `${app.itemdata['ultra_box'].icon}\`ultra_box\``));
                            }
                            else{
                                await app.player.addMoney(message.author.id, 1700);
                                message.channel.createMessage(scrambleWinMsg(app, app.common.formatNumber(1700)));
                            }
                        }
                        else if(scrambleDifficulty == "medium"){
                            const hasEnough = await app.itm.hasSpace(message.author.id, 1);

                            if((chance < scrambleJSONlength/3) && hasEnough){
                                rewardItem = "2x item_box";
                                await app.itm.addItem(message.author.id, 'item_box', 2);
                                message.channel.createMessage(scrambleWinMsg(app, `2x ${app.itemdata['item_box'].icon}\`item_box\``));
                            }
                            else{
                                await app.player.addMoney(message.author.id, 1100);
                                message.channel.createMessage(scrambleWinMsg(app, app.common.formatNumber(1100)));
                            }
                        }
                        else{
                            const hasEnough = await app.itm.hasSpace(message.author.id, 2);

                            if((chance < scrambleJSONlength/3) && hasEnough){
                                await app.itm.addItem(message.author.id, 'item_box', 2);
                                message.channel.createMessage(scrambleWinMsg(app, `2x ${app.itemdata['item_box'].icon}\`item_box\``));
                            }
                            else{
                                await app.player.addMoney(message.author.id, 800);
                                message.channel.createMessage(scrambleWinMsg(app, app.common.formatNumber(800)));
                            }
                        }
                    }
                    else{
                        if(scrambleDifficulty =="hard"){
                            const hasEnough = await app.itm.hasSpace(message.author.id, 2);

                            if((chance > scrambleJSONlength/2) && hasEnough){
                                await app.itm.addItem(message.author.id, 'item_box', 2);
                                message.channel.createMessage(scrambleWinMsg(app, `2x ${app.itemdata['item_box'].icon}\`item_box\``));
                            }
                            else{
                                await app.player.addMoney(message.author.id, 650);
                                message.channel.createMessage(scrambleWinMsg(app, app.common.formatNumber(650)));
                            }
                        }
                        else if(scrambleDifficulty == "medium"){
                            const hasEnough = await app.itm.hasSpace(message.author.id, 1);
                            
                            if((chance > scrambleJSONlength/2) && hasEnough){
                                await app.itm.addItem(message.author.id, 'item_box', 1);
                                message.channel.createMessage(scrambleWinMsg(app, `${app.itemdata['item_box'].icon}\`item_box\``));
                            }
                            else{
                                await app.player.addMoney(message.author.id, 400);
                                message.channel.createMessage(scrambleWinMsg(app, app.common.formatNumber(400)));
                            }
                        }
                        else{
                            const hasEnough = await app.itm.hasSpace(message.author.id, 1);
                            
                            if(hasEnough){
                                await app.itm.addItem(message.author.id, 'item_box', 1);
                                message.channel.createMessage(scrambleWinMsg(app, `${app.itemdata['item_box'].icon}\`item_box\``));
                            }
                            else{
                                await app.player.addMoney(message.author.id, 250);
                                message.channel.createMessage(scrambleWinMsg(app, app.common.formatNumber(250)));
                            }
                        }
                    }
                }
            });

            collector.on('end', reason => {
                if(reason === 'time'){
                    const embedScramble = new app.Embed()
                    .setTitle("You didn't get it in time!")
                    .setDescription("The word was : ```\n" + scrambleWord + "```")
                    .setColor(16734296);
                    message.channel.createMessage(embedScramble);
                }
            });
        }
        catch(err){
            message.reply('❌ You already have a command waiting for your input! If you believe this is the bot\'s fault, join our support discord! `discord`');
        }
    },
}

function shuffle(word){
    var shuffledWord = '';
    word = word.split('');
    while (word.length > 0) {
        shuffledWord +=  word.splice(word.length * Math.random() << 0, 1);
    }
    return shuffledWord;
}

function shuffleWordNoDupe(word){
    var shuffled = shuffle(word);

    while(shuffled == word){
        shuffled = shuffle(word);
    }

    return shuffled
}

function scrambleWinMsg(app, itemReward){
    const embedScramble = new app.Embed()
    .setTitle("You got it correct!")
    .addField("Reward", itemReward)
    .setColor(9043800);
    return embedScramble;
}