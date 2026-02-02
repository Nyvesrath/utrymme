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
            attackStat: new fields.StringField({initial: "strength"}),
            damage: new fields.StringField({initial: "1d6"}),
            damageBonus: new fields.NumberField({initial: 0}),
            range: new fields.NumberField({initial: 0}),

        };
    }
}

export class UtrymmeEquipmentItemModel extends UtrymmeItemModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        // On récupère le schema du parent
        const schema = super.defineSchema();
        
        // On ajoute les champs spécifiques
        schema.equipmentType = new fields.StringField({initial: "armour"});
        schema.armorValue = new fields.NumberField({initial: 0, integer: true});
        
        // Pour l'effet, c'est un objet, donc SchemaField
        schema.effect = new fields.SchemaField({
             type: new fields.StringField({initial: "none"}),
             value: new fields.NumberField({initial: 0}),
             target: new fields.StringField({initial: ""})
        });

        return schema;
    }
}


/*
weaponType: new fields.StringField({initial: "melee"}),
attackStat: new fields.StringField({initial: "strength"}),
damage: new fields.StringField({initial: "1d6"}),
damageBonus: new fields.NumberField({initial: 0}),
range: new fields.NumberField({initial: 0}),

            
            
            equipmentType: new fields.StringField({initial: "armour"}),
            armorValue: new fields.NumberField({initial: 0})

*/