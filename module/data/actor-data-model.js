const fields = foundry.data.fields;

/**
 * Schema d'une compétence.
 * bonus_stat et equipmentBonus sont calculés (lecture seule côté fiche) ;
 * bonus_mastery reste le seul champ éditable par le joueur.
 */
function skillField() {
    return new fields.SchemaField({
        bonus_stat: new fields.NumberField({ initial: 0, integer: true }),
        bonus_mastery: new fields.NumberField({ initial: 0, integer: true }),
        equipmentBonus: new fields.NumberField({ initial: 0, integer: true }),
        total: new fields.NumberField({ initial: 0, integer: true })
    });
}

/**
 * Schema d'une statistique primaire et de ses compétences.
 * equipmentBonus est un compteur en lecture seule : il reflète la part de "value"
 * qui provient d'équipements, à titre d'information pour le joueur.
 */
function statField(skillKeys = []) {
    return new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, integer: true, min: 0 }),
        bonus: new fields.NumberField({ initial: 0, integer: true }),
        equipmentBonus: new fields.NumberField({ initial: 0, integer: true }),
        skills: new fields.SchemaField(
            Object.fromEntries(skillKeys.map((key) => [key, skillField()]))
        )
    });
}

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
            speed: new fields.NumberField({ initial: 9, integer: true, min: 0 }),
            initiative: new fields.NumberField({ initial: 0, integer: true }),

            money: new fields.SchemaField({
                copper: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
                silver: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
                gold: new fields.NumberField({ initial: 0, integer: true, min: 0 })
            })
        };
    }

    /**
     * Liste des chemins "cible" utilisables par les buffs d'équipement, dérivée
     * automatiquement du schema pour les stats/compétences (jamais désynchronisée),
     * complétée par une courte liste écrite à la main pour les champs qui n'ont pas
     * leur place dans "stats" (défenses, vitesse, ressources).
     * Utilisé à la fois pour peupler le <select> du formulaire d'objet et pour
     * appliquer les buffs dans prepareDerivedData.
     */
    static buildBuffTargets() {
        const targets = {};
        const statsFields = this.schema.fields.stats.fields;

        for (const [statKey, statField] of Object.entries(statsFields)) {
            const statLabel = statKey.capitalize();
            targets[`stats.${statKey}.value`] = statLabel;

            const skillFields = statField.fields.skills.fields;
            for (const skillKey of Object.keys(skillFields)) {
                const skillLabel = skillKey.replace(/_/g, " ").capitalize();
                targets[`stats.${statKey}.skills.${skillKey}.equipmentBonus`] = `Compétence : ${skillLabel}`;
            }
        }

        Object.assign(targets, {
            "block": "Bloc",
            "dodge": "Esquive",
            "speed": "Vitesse (m)",
            "max_health": "PV max",
            "max_mana": "Mana max"
        });

        return targets;
    }

    /**
     * Récupère la liste à plat de tous les "détails" (buffs) de tous les équipements
     * actuellement équipés par l'acteur, avec le nom de l'objet source pour le debug/UI.
     */
    #collectEquipmentBuffs() {
        const buffs = [];
        for (const item of this.parent.items) {
            if (item.type !== "equipment") continue;
            if (!item.system.equipped) continue;

            for (const detail of item.system.details) {
                if (!detail.target) continue;
                buffs.push({ ...detail, sourceName: item.name });
            }
        }
        return buffs;
    }

    /**
     * Résout la valeur numérique d'un buff (valeur fixe, ou valeur + modificateur d'une stat).
     */
    #resolveBuffValue(buff) {
        if (buff.valueType === "statScaling") {
            const scalingStat = this.stats[buff.scalingStat];
            return buff.value + (scalingStat?.bonus ?? 0);
        }
        return buff.value;
    }

    /**
     * Applique un lot de buffs (regroupés par "target") sur `this` : les "replace"
     * sont résolus en premier (le dernier de la liste l'emporte en cas de conflit,
     * et le conflit est journalisé pour affichage d'un badge sur la fiche), puis
     * tous les "bonus" s'additionnent par-dessus.
     */
    #applyBuffs(buffs) {
        const byTarget = new Map();
        for (const buff of buffs) {
            if (!byTarget.has(buff.target)) byTarget.set(buff.target, []);
            byTarget.get(buff.target).push(buff);
        }

        for (const [target, targetBuffs] of byTarget.entries()) {
            const replaces = targetBuffs.filter((b) => b.mode === "replace");
            const bonuses = targetBuffs.filter((b) => b.mode === "bonus");

            let baseValue = foundry.utils.getProperty(this, target) ?? 0;

            if (replaces.length > 0) {
                const winner = replaces[replaces.length - 1];
                baseValue = this.#resolveBuffValue(winner);

                if (replaces.length > 1) {
                    this.buffConflicts.push({
                        target,
                        winner: winner.sourceName,
                        conflictingWith: replaces.slice(0, -1).map((b) => b.sourceName)
                    });
                }
            }

            const totalBonus = bonuses.reduce((sum, b) => sum + this.#resolveBuffValue(b), 0);
            foundry.utils.setProperty(this, target, baseValue + totalBonus);
        }
    }

    /** @override */
    prepareDerivedData() {
        this.buffConflicts = [];

        // Reset des compteurs "part d'équipement" avant recalcul
        for (const stat of Object.values(this.stats)) {
            stat.equipmentBonus = 0;
            for (const skill of Object.values(stat.skills)) {
                skill.equipmentBonus = 0;
            }
        }

        const buffs = this.#collectEquipmentBuffs();

        // Passe 1 : les buffs qui touchent la valeur brute d'une stat primaire doivent
        // être appliqués AVANT de calculer les modificateurs (bonus), pour qu'un objet
        // qui augmente la Force influence bien les jets de Force/compétences liées.
        const statValueTargets = new Set(
            Object.keys(this.stats).map((key) => `stats.${key}.value`)
        );
        const statValueBuffs = buffs.filter((b) => statValueTargets.has(b.target));
        const otherBuffs = buffs.filter((b) => !statValueTargets.has(b.target));

        const originalValues = {};
        for (const [key, stat] of Object.entries(this.stats)) {
            originalValues[key] = stat.value;
        }

        this.#applyBuffs(statValueBuffs);

        for (const [key, stat] of Object.entries(this.stats)) {
            stat.equipmentBonus = stat.value - originalValues[key];
            stat.bonus = Math.floor((stat.value - 10) / 2);
        }

        // Passe 2 : tout le reste (défenses, vitesse, ressources, compétences) peut
        // maintenant s'appuyer sur les modificateurs de stats fraîchement calculés
        // (utile pour le valueType "statScaling").
        this.#applyBuffs(otherBuffs);

        // Totaux de compétences (à recalculer après la passe 2, qui alimente equipmentBonus)
        for (const stat of Object.values(this.stats)) {
            for (const skill of Object.values(stat.skills)) {
                skill.bonus_stat = stat.bonus;
                skill.total = skill.bonus_stat + skill.bonus_mastery + skill.equipmentBonus;
            }
        }
    }
}