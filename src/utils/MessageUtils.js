const { Message } = require('eris')

Message.prototype.reply = function(content) {
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
