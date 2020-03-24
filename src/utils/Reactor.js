const ReactionHandler = require('eris-reactions');

class Reactor {
    constructor(icons){
        this.icons = icons;
    }

    /**
     * Sends message with question and reactions and waits for response
     * @param {*} userId ID of user to await reaction from
     * @param {string} botMessage Bot message to add reactions to
     * @param {number} time Time in milliseconds to wait
     * @returns {boolean} Whether or not they confirmed
     */
    async getConfirmation(userId, botMessage, time = 30000){
        try{
            await botMessage.addReaction(this.icons.confirm);
            await botMessage.addReaction(this.icons.cancel);
            const reaction = await ReactionHandler.collectReactions(botMessage, (reactorId) => reactorId === userId, {maxMatches: 1, time: time});
        
            if(reaction[0].emoji.name === this.icons.confirm) return true;
            else return false;
        }
        catch(err){
            throw new Error('Ran out of time.');
        }
    }

    /**
     * Creates a message with pages and reactions to control the page
     * @param {*} message Discord message
     * @param {Array<DiscordEmbed>} embeds Array of embeds, each considered a page
     * @param {number} time Time in milliseconds bot listens for reactions
     */
    async paginate(message, embeds, time = 60000){
        let page = 0;
        embeds[0].setFooter(`Page 1/${embeds.length}`)
        const botMessage = await message.channel.createMessage(embeds[0]);
        await botMessage.addReaction('◀️');
        await botMessage.addReaction('▶️');
        await botMessage.addReaction(this.icons.cancel);

        const reactionListener = new ReactionHandler.continuousReactionStream(botMessage, (reactorId) => reactorId === message.author.id, false, {
            time: time
        });

        reactionListener.on('reacted', reaction => {
            if(reaction.emoji.name === '◀️'){
                if(page !== 0){
                    page--;
                    embeds[page].setFooter(`Page ${page + 1}/${embeds.length}`)
                    botMessage.edit(embeds[page]);
                }
                botMessage.removeReaction('◀️', message.author.id);
            }
            else if(reaction.emoji.name === '▶️'){
                if(page !== (embeds.length - 1)){
                    page++;
                    embeds[page].setFooter(`Page ${page + 1}/${embeds.length}`)
                    botMessage.edit(embeds[page]);
                }
                botMessage.removeReaction('▶️', message.author.id)
            }
            else if(reaction.emoji.name === this.icons.cancel){
                reactionListener.stopListening('Cancelled');
                botMessage.delete();
            }
        });
    }
}

module.exports = Reactor;