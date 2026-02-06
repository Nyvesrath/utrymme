import UtrymmeItemSheet from "./sheets/utrymmeitemsheet.js";
import UtrymmeActorSheet from "./sheets/utrymmeplayersheet.js";

import UtrymmeItemModel , { UtrymmeWeaponItemModel, UtrymmeEquipmentItemModel } from "./data/item-data-model.js";

import UtrymmeActor from "./actor/utrymme-actor.js";


Hooks.once("init", () => {
    console.log("Utrymme | Initialisation du système Utrymme");

    const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

    DocumentSheetConfig.unregisterSheet(Item, "core", foundry.applications.sheets.ItemSheetV2);
    DocumentSheetConfig.registerSheet(Item, "utrymme", UtrymmeItemSheet, { makeDefault: true });

    DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.applications.sheets.ActorSheetV2);
    DocumentSheetConfig.registerSheet(Actor, "utrymme", UtrymmeActorSheet, { makeDefault: true });

    CONFIG.Actor.documentClass = UtrymmeActor;

    CONFIG.Item.dataModels = {
        weapon: UtrymmeWeaponItemModel,
        equipment: UtrymmeEquipmentItemModel,
        miscellaneous: UtrymmeItemModel
    };

    CONFIG.UTRYMME = {};
    const actorFields = foundry.utils.getProperty(game.model.Actor, "player.stats");
    CONFIG.UTRYMME.stats = Object.keys(actorFields).reduce((obj, key) => {
        obj[key] = key.capitalize(); 
        return obj;
    }, {});

    CONFIG.UTRYMME.weaponTypes = {
        "melee": "Utrymme.MeleeWeapon",
        "ranged": "Utrymme.RangedWeapon"
    };
})
