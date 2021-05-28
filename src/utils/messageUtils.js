// eslint-disable-next-line no-unused-vars
const { Message, MessageContent } = require('eris')

/**
 * Replies to a message.
 * @param {Message} msg Message to reply to
 * @param {MessageContent} content Message content
 */
exports.reply = async (msg, content) => {
	if (typeof content === 'string') {
		content = {
			content
		}
	}

	Object.assign(content, {
		messageReference: {
			messageID: msg.id
		}
	})

	return msg.channel.createMessage(content)
}
