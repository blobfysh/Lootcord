const items = {
	ranged: require('../src/resources/items/ranged'),
	melee: require('../src/resources/items/melee'),
	items: require('../src/resources/items/items'),
	ammo: require('../src/resources/items/ammo'),
	materials: require('../src/resources/items/materials'),
	storage: require('../src/resources/items/storage'),
	banners: require('../src/resources/items/banners')
}

const itemNames = []
const itemAliases = []

for (const type in items) {
	itemNames.push(...Object.keys(items[type]))

	Object.keys(items[type]).forEach(item => itemAliases.push(...items[type][item].aliases))
}

describe('items', () => {
	test('item list contains no duplicate names', () => {
		const duplicates = itemNames.filter((a, i, arr) => a && arr.indexOf(a) !== i)

		expect(duplicates.length ? `Found items with ${duplicates.length > 1 ? 'names' : 'name'} ${duplicates.join(', ')} multiple times.` : '').toEqual('')
	})
	test('item list contains no duplicate aliases', () => {
		const aliasDuplicates = itemAliases.filter((a, i, arr) => a && arr.indexOf(a) !== i)

		expect(aliasDuplicates.length ? `Found the ${aliasDuplicates.length > 1 ? 'aliases' : 'alias'} ${aliasDuplicates.join(', ')} multiple times.` : '').toEqual('')
	})
	test('item names are not found as an alias', () => {
		const aliases = []

		for (const item of itemNames) {
			if (itemAliases.includes(item)) {
				aliases.push(item)
			}
		}

		expect(aliases.length ? `Cannot have ${aliases.length > 1 ? 'aliases' : 'alias'} that is already declared as item name: ${aliases.join(', ')}` : '').toEqual('')
	})
})
