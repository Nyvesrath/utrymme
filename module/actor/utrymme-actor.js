import { UtrymmeWeaponItemModel, UtrymmeEquipmentItemModel } from "../data/item-data-model.js";

export default class UtrymmeActor extends Actor {



    /** 
     * Save logic in the actor class So the sheet doesn't calculate but only renders
     * 
     * 
     * @override */
    prepareDerivedData() {
        const actorData = this;
        const system = actorData.system;

        if (actorData.type !== 'player') return;

        for (let [key, stat] of Object.entries(system.stats)) {
            
            stat.bonus = Math.floor((stat.value - 10) / 2);
            stat.equipment_bonus = 0;

            if (stat.skills) {
                for (let [skillKey, skill] of Object.entries(stat.skills)) {
                    skill.bonus_stat = stat.bonus; 

                    skill.total = skill.bonus_stat + skill.bonus_mastery;
                }
            }
        }

        // 1. Création de l'item de test
        const tempItem = new Item({
            name: "test",
            type: "equipment",
            system: {
                equipmentType: "jewelry",
                effect: { type: "bonus", value: 5, target: "strength" }
            }
        }, { parent: this });

        // 2. Copie de la liste actuelle et ajout de l'item (pour éviter l'erreur Read-Only)
        this.items.set("temp-id", tempItem);

        console.log("Utrymme | actorData.items:", actorData.items);
        if (actorData.items) {
            for (let item of actorData.items) {
                if (item.type !== "equipment") continue;

                const itemData = item.system;

                if (itemData.equipmentType !== "armour" && itemData.effect?.value) {
                    
                    const targetStat = itemData.effect.target; // ex: "constitution"

                    console.log("Utrymme | Target Stat from item effect:", targetStat);
                    
                    // Si la stat existe bien sur le joueur
                    if (system.stats[targetStat]) {
                        system.stats[targetStat].equipment_bonus += itemData.effect.value;
                    }
                }
            }
        }
    }
}