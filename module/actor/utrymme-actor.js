import { UtrymmeWeaponItemModel, UtrymmeEquipmentItemModel } from "../data/item-data-model.js";

export default class UtrymmeActor extends Actor {

    /**
     * Les stats de base (value, bonus, total des compétences...) sont déjà calculées
     * dans UtrymmePlayerModel#prepareDerivedData, qui tourne AVANT cette méthode.
     * Ici on ne s'occupe que de ce qui dépend des Items possédés par l'acteur
     * (ex : bonus d'équipement apporté par un bijou ou un objet magique).
     * @override
     */
    prepareDerivedData() {
        if (this.type !== "player") return;

        const system = this.system;

        // Reset des bonus d'équipement avant de les recalculer depuis les items
        for (const stat of Object.values(system.stats)) {
            stat.equipment_bonus = 0;
        }

        for (const item of this.items) {
            if (item.type !== "equipment") continue;

            const { equipmentType, effects } = item.system;

            // Seuls les équipements non-armure (bijoux, objets magiques...) donnent un bonus de stat
            if (equipmentType === "armour" || !effects || effects.type !== "bonus") continue;

            const targetStat = system.stats[effects.target];
            if (targetStat) {
                targetStat.equipment_bonus += effects.value;
            }
        }
    }
}