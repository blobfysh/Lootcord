const { Message } = require('eris')

Message.prototype.reply = function(content) {
	return this.channel.createMessage({ content: `<@${this.author.id}>, ${content}` })
}
