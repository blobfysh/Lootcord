// eslint-disable-next-line no-unused-vars
const { Message, MessageContent } = require('eris')

Message.prototype.reply = function (content) {
	if (typeof content === 'string') {
		content = {
			content
		}
	}

	Object.assign(content, {
		message_reference: {
			message_id: this.id
		},
		allowedMentions: {
			replied_user: true
		}
	})

	return this.channel.createMessage(content)
}

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
		messageReferenceID: msg.id
	})

	return msg.channel.createMessage(content)
}
