import UtrymmeItemSheet from "./sheets/utrymmeitemsheet.js";
import UtrymmeActorSheet from "./sheets/utrymmeplayersheet.js";

import UtrymmeItemModel , { UtrymmeWeaponItemModel } from "./data/item-data-model.js";


Hooks.once("init", () => {
    console.log("Utrymme | Initialisation du système Utrymme");

    const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

    DocumentSheetConfig.unregisterSheet(Item, "core", foundry.applications.sheets.ItemSheetV2);
    DocumentSheetConfig.registerSheet(Item, "utrymme", UtrymmeItemSheet, { makeDefault: true });

    DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.applications.sheets.ActorSheetV2);
    DocumentSheetConfig.registerSheet(Actor, "utrymme", UtrymmeActorSheet, { makeDefault: true });

    CONFIG.Item.dataModels = {
        weapon: UtrymmeWeaponItemModel,
        equipment: UtrymmeItemModel,
        miscellaneous: UtrymmeItemModel
    };

})
