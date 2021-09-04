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

	const replyObj = Object.assign({}, content, {
		messageReference: {
			messageID: msg.id
		}
	})

	try {
		const m = await msg.channel.createMessage(replyObj)
		return m
	}
	catch (err) {
		// replied message was deleted, send message without reply:
		if (err.code === 50035) {
			return msg.channel.createMessage(content)
		}
	}
}
