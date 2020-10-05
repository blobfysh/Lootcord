class Embed {
	constructor() {
		this.embed = {
			fields: [],
			color: 3092790
		}
	}

	/**
     * Adds a field to the embed
     * @param {string} name Name of field
     * @param {string} value Value of field
     * @param {boolean} inline If field should be inline, defaults false
     */
	addField(name, value, inline = false) {
		if (!name) {
			return this
		}
		else if (this.embed.fields.length > 25) {
			return this
		}
		else if (!value) {
			return false
		}

		this.embed.fields.push({
			name: name.toString().substring(0, 256),
			value: value.toString().substring(0, 1024),
			inline
		})

		return this
	}

	/**
     * Set the title of embed
     * @param {string} title Title to set
     */
	setTitle(title) {
		if (!title) return this

		this.embed.title = title.toString().substring(0, 256)

		return this
	}

	/**
     * Set the URL of embed
     * @param {string} url URL to set
     */
	setURL(url) {
		if (!url) return this

		this.embed.url = url

		return this
	}

	/**
     * Set the description of embed
     * @param {string} desc Description to set
     */
	setDescription(desc) {
		if (!desc) return this

		this.embed.description = desc.toString().substring(0, 2048)

		return this
	}

	/**
     * Set the image of embed
     * @param {string} url URL of image
     */
	setImage(url) {
		if (!url) return this

		this.embed.image = {
			url
		}

		return this
	}

	/**
     * Set the thumbnail of embed
     * @param {string} url URL image for thumbnail
     */
	setThumbnail(url) {
		if (!url) return this

		this.embed.thumbnail = {
			url
		}

		return this
	}

	/**
     * Set the footer text and icon of embed
     * @param {string} text Footer text
     * @param {string} icon URL of icon to set in footer
     */
	setFooter(text, icon) {
		if (!text) return this

		this.embed.footer = {
			text: text.toString().substring(0, 2048),
			icon_url: icon || null
		}

		return this
	}


	setTimestamp(timestamp = new Date()) {
		this.embed.timestamp = timestamp

		return this
	}

	/**
     * Set the author of embed
     * @param {string} name Author name
     * @param {string} icon URL of icon to set
     * @param {string} url URL of author
     */
	setAuthor(name, icon, url) {
		if (!name) return this

		this.embed.author = {
			name: name.toString().substring(0, 256),
			icon_url: icon || null,
			url: url || null
		}

		return this
	}

	/**
     * Sets color. Supports hex colors
     * @param {*} color
     */
	setColor(color) {
		if (!color) return this

		if (typeof color === 'string') {
			color = parseInt(color.replace('#', ''), 16)
		}

		this.embed.color = color

		return this
	}

	/**
     * Adds a blank field to the embed
     * @param {boolean} inline If field should be inline, defaults false
     */
	addBlankField(inline = false) {
		return this.addField('\u200B', '\u200B', inline)
	}
}

module.exports = Embed
