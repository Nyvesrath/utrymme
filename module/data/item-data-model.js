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

/**
 * 
 *      "weaponType": "melee",
      "meleeWeaponType": "sword",
      "isVersatile": false,
      "isOneHanded": true,
      "attackStat": "strength",
      "attackBonus": 0,
      "damage": "1d6",
      "versatileDamage": "1d6",
      "damageBonus": 0,
      "damageType": "slashing",
      "range": 0
 */


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

export class UtrymmeEquipmentItemModel extends UtrymmeItemModel {
    static defineSchema() {
        // On récupère le schema du parent
        const schema = super.defineSchema();

        const fields = foundry.data.fields;
        
        schema.equipmentType = new fields.StringField({initial: "armour"});

        //Active only if type is armour
        schema.armourInfo= new fields.SchemaField({
            targetDefense: new fields.StringField({initial: "block"}), //Can only be block or dodge
            hasBaseArmour: new fields.BooleanField({initial: true}), //Has Base armour activate or not the armourBaseValue
            armourBaseValue: new fields.NumberField({initial: 0, integer: true}),
            armourStat: new fields.StringField({initial: "constitution"}), //Can only be strength or constitution
            armourBonus: new fields.NumberField({initial: 0, integer: true})
        });

        // effect is a SchemaField that contains type (string), value (number) and target (string)
        schema.effects = new fields.SchemaField({
            type: new fields.StringField({initial: "none"}),
            roll: new fields.StringField({initial: "1d20"}),
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