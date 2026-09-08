const fields = foundry.data.fields;

/**
 * Construit le schema d'une compétence (bonus lié à la stat + bonus de maîtrise).
 */
function skillField() {
    return new fields.SchemaField({
        bonus_stat: new fields.NumberField({ initial: 0, integer: true }),
        bonus_mastery: new fields.NumberField({ initial: 0, integer: true }),
        total: new fields.NumberField({ initial: 0, integer: true })
    });
}

/**
 * Construit le schema d'une statistique (force, dextérité, ...) et de ses compétences associées.
 * @param {string[]} skillKeys - Clés des compétences rattachées à cette statistique.
 */
function statField(skillKeys = []) {
    return new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, integer: true, min: 0 }),
        bonus: new fields.NumberField({ initial: 0, integer: true }),
        equipment_bonus: new fields.NumberField({ initial: 0, integer: true }),
        skills: new fields.SchemaField(
            Object.fromEntries(skillKeys.map((key) => [key, skillField()]))
        )
    });
}

/**
 * Schema de données commun aux personnages joueurs (type "player").
 */
export default class UtrymmePlayerModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            race: new fields.StringField({ initial: "" }),
            alignment: new fields.StringField({ initial: "" }),
            magic_affinity: new fields.StringField({ initial: "" }),
            level: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
            experience: new fields.NumberField({ initial: 0, integer: true, min: 0 }),

            current_health: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            max_health: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            current_mana: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
            max_mana: new fields.NumberField({ initial: 0, integer: true, min: 0 }),

            stats: new fields.SchemaField({
                strength: statField(["athletics"]),
                dexterity: statField(["acrobatics", "sleight_of_hand", "stealth"]),
                constitution: statField([]),
                intelligence: statField(["arcanes", "history", "investigation", "nature", "religion"]),
                wisdom: statField(["animal_handling", "medecine", "perception", "insight", "survival"]),
                charisma: statField(["intimidation", "persuasion", "performance", "deception"])
            }),

            block: new fields.NumberField({ initial: 0, integer: true }),
            dodge: new fields.NumberField({ initial: 0, integer: true }),
            speed: new fields.StringField({ initial: "" }),
            initiative: new fields.NumberField({ initial: 0, integer: true }),

            money: new fields.SchemaField({
                copper: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
                silver: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
                gold: new fields.NumberField({ initial: 0, integer: true, min: 0 })
            })
        };
    }

    /**
     * Calcule les données dérivées "pures" (qui ne dépendent que des données du personnage
     * lui-même, pas de ses items). Le bonus d'équipement est calculé séparément dans
     * UtrymmeActor#prepareDerivedData, une fois les items disponibles.
     * @override
     */
    prepareDerivedData() {
        for (const stat of Object.values(this.stats)) {
            stat.bonus = Math.floor((stat.value - 10) / 2);

            for (const skill of Object.values(stat.skills)) {
                skill.bonus_stat = stat.bonus;
                skill.total = skill.bonus_stat + skill.bonus_mastery;
            }
        }
    }
}