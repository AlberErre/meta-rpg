import EventDispatcher from "simple-event-dispatcher";

import ItemGenerator from "common/components/item/ItemGenerator";
import ItemRarity from "common/components/item/ItemRarity";
import characterService from "./CharacterService";
import Slots from "common/components/item/Slots";

export const InventoryWidth = 10;
export const InventoryHeight = 8;

class InventoryService {
	events = new EventDispatcher();
	itemGenerator = new ItemGenerator();

	inventory = {}
	gear = {
		head: null,
		chest: null,
		legs: null,
		feet: null,
		mainHand: null,
		offHand: null,
		hands: null,
		ring: null
	}

	constructor() {
		this.buildMatrix();

		this.gear.mainHand = this.itemGenerator.generate(1, "mainHand", ItemRarity.Common, false);
		this.gear.chest = this.itemGenerator.generate(1, "chest", ItemRarity.Common, false);

		characterService.updateStats(this.gear);
	}

	buildMatrix() {
		const matrix = [];

		for (let i = 0; i < InventoryHeight; i++) {
			const row = [];

			for (let j = 0; j < InventoryWidth; j++) {
				const cell = null;
				row.push(cell);
			}

			matrix.push(row);
		}

		this.inventory = matrix;
	}

	itemDragStart() {
		this.events.dispatch("itemDrag", "start");
	}

	itemDragEnd() {
		this.events.dispatch("itemDrag", "end");
	}

	moveItem(src, dest) {
		if (src.type === "inventory" && dest.type === "inventory") {
			let aux = this.inventory[src.y][src.x];
			this.inventory[src.y][src.x] = this.inventory[dest.y][dest.x];
			this.inventory[dest.y][dest.x] = aux;

			this.events.dispatch("update");
		}

		if (src.type === "gear" && dest.type === "inventory") {
			let srcItem = this.gear[src.slot];
			let destItem = this.inventory[dest.y][dest.x];

			if (destItem === null || (srcItem.slot === destItem.slot)) {
				this.gear[src.slot] = destItem;
				this.inventory[dest.y][dest.x] = srcItem;

				characterService.updateStats(this.gear);
				this.events.dispatch("update");
			}
		}

		if (src.type === "inventory" && dest.type === "gear") {
			let aux = this.inventory[src.y][src.x];

			if (aux.requiredLevel <= characterService.level) {
				this.inventory[src.y][src.x] = this.gear[aux.slot];
				this.gear[aux.slot] = aux;

				characterService.updateStats(this.gear);
				this.events.dispatch("update");
			}
		}

		this.itemDragEnd();
	}

	sellItem(src) {
		let value = 0;

		if (src.type === "inventory") {
			value = this.inventory[src.y][src.x].value;
			this.inventory[src.y][src.x] = null;
		}

		if (src.type === "gear") {
			value = this.gear[src.slot].value;
			this.gear[src.slot] = null;

			characterService.updateStats(this.gear);
		}

		characterService.modifyGold(value);

		this.events.dispatch("update");
		this.itemDragEnd();
	}

	addItem(item) {
		const location = this.hasRoom();

		if (!location) {
			return false;
		}

		this.inventory[location.y][location.x] = item;
		this.events.dispatch("update");

		return true;
	}

	hasRoom() {
		for (let i = 0; i < InventoryHeight; i++) {
			for (let j = 0; j < InventoryWidth; j++) {
				if (this.inventory[i][j] === null) {
					return { x: j, y: i };
				}
			}
		}

		return false;
	}

	compareItem(item) {
		let gearItem = this.gear[item.slot];
		const stats = {
			minDamage: 0,
			maxDamage: 0,
			armor: 0
		};

		if (!gearItem) {
			gearItem = {
				minDamage: 0,
				maxDamage: 0,
				armor: 0,

				bonus: {}
			};

			Object.keys(item.bonus).forEach(key => {
				gearItem.bonus[key] = 0;
			});
		}

		Object.keys(item.bonus).forEach(key => {
			stats[key] = item.bonus[key] - gearItem.bonus[key];
		});

		stats.minDamage += item.minDamage - gearItem.minDamage;
		stats.maxDamage += item.maxDamage - gearItem.maxDamage;
		stats.armor += item.armor - gearItem.armor;

		return stats;
	}

	cheatGiveItems() {
		const itemLevel = characterService.level;

		Slots.forEach((x, i) => {
			this.inventory[0][i] = this.itemGenerator.generate(itemLevel, x);
		});

		this.events.dispatch("update");
		characterService.events.dispatch("update");
	}
}

export default new InventoryService();
