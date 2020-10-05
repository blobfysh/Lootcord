const ITEM_TYPES = {
	melee: {
		name: 'Melee Weapons',
		type: 'Melee'
	},
	ranged: {
		name: 'Ranged Weapons',
		type: 'Ranged'
	},
	items: {
		name: 'Items',
		type: 'Item'
	},
	ammo: {
		name: 'Ammo',
		type: 'Ammo'
	},
	materials: {
		name: 'Materials',
		type: 'Material'
	},
	storage: {
		name: 'Storage Containers',
		type: 'Storage'
	},
	banners: {
		name: 'Banners',
		type: 'Banner'
	}
}

const RULES = {
	1: {
		desc: 'Bug exploitation',
		warn_message: 'Exploiting bugs to gain an unfair advantage over other players is not allowed, bugs should be reported to the bug-reports channel in the official Lootcord server.'
	},
	2: {
		desc: 'Alt accounts',
		warn_message: 'Alt abuse violates rule #2, please refrain from using alts to gain an unfair advantage over other players.'
	},
	3: {
		desc: 'Cooldown dodging',
		warn_message: 'Cooldown dodging/leaving servers to avoid the deactivate cooldown is not allowed (rule #3).'
	},
	4: {
		desc: 'Kill-farming',
		warn_message: 'Killing another player and trading items back to avoid loss of items is against rule #4!'
	},
	5: {
		desc: 'Handouts',
		warn_message: 'Trading items/money of large value or giving handouts to other players is not allowed (rule #5), please don\'t give items/money to other players. Thank you.'
	},
	6: {
		desc: 'False reports',
		warn_message: 'Please do not spam or use the report command without valid reason as this distracts the moderation team from real reports (rule #6). Thank you.'
	}
}

module.exports = {
	ITEM_TYPES,
	RULES
}
