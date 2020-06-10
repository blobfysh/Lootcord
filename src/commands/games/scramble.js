
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
            return message.reply(`You need to wait \`${scrambleCD}\` before playing another game of scramble.`);
        }

        const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), await app.player.getRow(message.author.id));
        let option = message.args[0] ? message.args[0].toLowerCase() : undefined;
        let scrambleJSONlength = Object.keys(app.scramble_words).length
        let chance = Math.floor(Math.random() * scrambleJSONlength); //returns value 0 between 32 (1 of 10)
        let scrambleWord = app.scramble_words[chance].word;  //json data word to scramble
        let scrambleDifficulty = app.scramble_words[chance].difficulty;
        let scrambleHint = app.scramble_words[chance].define;
        let finalWord = scrambleWord.toLowerCase(); //final word to check if user got correct
        let chanceR = Math.random(); //returns 0-9 (10% chance)
        let reward = {};

        if(Math.random() <= .7){
            scrambleHint = app.scramble_words[chance].hint;
        }
        
        if(!option || (option !== 'easy' && option !== 'hard')){
            return message.reply(`You need to choose a difficulty \`${message.prefix}scramble easy/hard\`\nEasy: Hint but less reward\nHard: Better reward, no hint`);
        }
        
        const embedScramble = new app.Embed()
        .setFooter('You have 30 seconds to unscramble this word.')
        
        if(option === "easy"){
            embedScramble.setDescription("**Hint:** " + scrambleHint + "\nWord: ```fix\n" + (shuffleWordNoDupe(scrambleWord))+"```");
            if(scrambleDifficulty == "hard"){
                const hasEnough = await app.itm.hasSpace(itemCt, 2);

                if((chanceR < .5) && hasEnough){
                    reward.display = app.itemdata['item_box'].icon + "`item_box`";
                    reward.item = "item_box";
                    reward.amount = 2;
                }
                else{
                    reward.display = app.common.formatNumber(1250);
                    reward.item = "money";
                    reward.amount = 1250;
                }
            }
            else if(scrambleDifficulty == "medium"){
                const hasEnough = await app.itm.hasSpace(itemCt, 1);
                            
                if((chanceR < .5) && hasEnough){
                    reward.display = app.itemdata['item_box'].icon + "`item_box`";
                    reward.item = "item_box";
                    reward.amount = 1;
                }
                else{
                    reward.display = app.common.formatNumber(950);
                    reward.item = "money";
                    reward.amount = 950;
                }
            }
            else{
                const hasEnough = await app.itm.hasSpace(itemCt, 1);
                            
                if(hasEnough){
                    reward.display = app.itemdata['item_box'].icon + "`item_box`";
                    reward.item = "item_box";
                    reward.amount = 1;
                }
                else{
                    reward.display = app.common.formatNumber(750);
                    reward.item = "money";
                    reward.amount = 750;
                }
            }
        }
        else if(option === "hard"){
            embedScramble.setDescription("Word: ```fix\n" + shuffleWordNoDupe(scrambleWord.toLowerCase())+"```");
            
            if(scrambleDifficulty == "hard"){
                const hasEnough = await app.itm.hasSpace(itemCt, 1);

                if((chanceR < .5) && hasEnough){
                    reward.display = app.itemdata['ultra_box'].icon + "`ultra_box`";
                    reward.item = "ultra_box";
                    reward.amount = 1;
                }
                else{
                    reward.display = app.common.formatNumber(3500);
                    reward.item = "money";
                    reward.amount = 3500;
                }
            }
            else if(scrambleDifficulty == "medium"){
                const hasEnough = await app.itm.hasSpace(itemCt, 2);

                if((chanceR < .5) && hasEnough){
                    reward.display = `2x ${app.itemdata['item_box'].icon}\`item_box\``
                    reward.item = "item_box";
                    reward.amount = 2;
                }
                else{
                    reward.display = app.common.formatNumber(2000);
                    reward.item = "money";
                    reward.amount = 2000;
                }
            }
            else{
                const hasEnough = await app.itm.hasSpace(itemCt, 2);

                if((chanceR < .5) && hasEnough){
                    reward.display = `2x ${app.itemdata['item_box'].icon}\`item_box\``
                    reward.item = "item_box";
                    reward.amount = 2;
                }
                else{
                    reward.display = app.common.formatNumber(1200);
                    reward.item = "money";
                    reward.amount = 1200;
                }
            }
        }

        embedScramble.addField("Reward", reward.display);

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

                    if(reward.item === 'money'){
                        await app.player.addMoney(message.author.id, reward.amount);
                    }
                    else{
                        await app.itm.addItem(message.author.id, reward.item, reward.amount);
                    }
    
                    const embedScramble = new app.Embed()
                    .setTitle("You got it correct!")
                    .addField("Reward", reward.display)
                    .setColor(9043800);

                    message.channel.createMessage(embedScramble);
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