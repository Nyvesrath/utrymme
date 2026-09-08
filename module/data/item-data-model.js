export default class UtrymmeItemModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({required: true, initial: ""}),
            weight: new fields.NumberField({initial: 0, min: 0}),
            price: new fields.SchemaField({
                copper: new fields.NumberField({initial: 0, integer: true, min: 0}),
                silver: new fields.NumberField({initial: 0, integer: true, min: 0}),
                gold: new fields.NumberField({initial: 0, integer: true, min: 0})
            }),
        };
    }
}

export class UtrymmeWeaponItemModel extends UtrymmeItemModel {
    static defineSchema() {
        const value = super.defineSchema();
        const fields = foundry.data.fields;
        return {
            ...value,
            weaponType: new fields.StringField({initial: "melee"}),
            meleeWeaponType: new fields.StringField({initial: "sword"}),
            isVersatile: new fields.BooleanField({initial: false}),
            isOneHanded: new fields.BooleanField({initial: true}),
            attackStat: new fields.StringField({initial: "strength"}),
            attackBonus: new fields.NumberField({initial: 0}),
            damage: new fields.StringField({initial: "1d6"}),
            versatileDamage: new fields.StringField({initial: "1d6"}),
            damageBonus: new fields.NumberField({initial: 0}),
            versatileDamageBonus: new fields.NumberField({initial: 0}),
            damageType: new fields.StringField({initial: "slashing"}),
            range: new fields.NumberField({initial: 0})
        };
    }
}

/**
 * Un "détail" (buff) d'équipement : cible une stat/compétence/défense/ressource
 * de l'acteur qui porte l'objet, et modifie sa valeur soit en l'écrasant
 * (replace), soit en s'y ajoutant (bonus). La valeur appliquée peut être fixe,
 * ou fixe + modificateur d'une stat au choix (valueType "statScaling") — ce qui
 * permet par exemple un bonus de bloc scalé sur la Constitution du porteur.
 */
function equipmentDetailField() {
    const fields = foundry.data.fields;
    return new fields.SchemaField({
        target: new fields.StringField({ initial: "" }),
        mode: new fields.StringField({ initial: "bonus" }), // "bonus" | "replace"
        valueType: new fields.StringField({ initial: "fixed" }), // "fixed" | "statScaling"
        value: new fields.NumberField({ initial: 0, integer: true }),
        scalingStat: new fields.StringField({ initial: "strength" })
    });
}

export class UtrymmeEquipmentItemModel extends UtrymmeItemModel {
    static defineSchema() {
        const schema = super.defineSchema();
        const fields = foundry.data.fields;

        // Non géré pour l'instant côté fiche perso (pas de bouton "équiper" encore) :
        // reste à true par défaut pour préserver le comportement actuel (un équipement
        // porté par un acteur applique toujours ses effets).
        schema.equipped = new fields.BooleanField({ initial: true });

        schema.details = new fields.ArrayField(equipmentDetailField());

        return schema;
    }
}