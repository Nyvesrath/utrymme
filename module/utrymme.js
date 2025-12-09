import UtrymmeItemSheet from "./sheets/utrymmeweaponsheet.js";
import UtrymmeActorSheet from "./sheets/utrymmeplayersheet.js";


Hooks.once("init", () => {
    console.log("Utrymme | Initialisation du système Utrymme");

    const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

    DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
    DocumentSheetConfig.registerSheet(Item, "utrymme", UtrymmeItemSheet, { makeDefault: true });

    DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.applications.sheets.ActorSheet);
    DocumentSheetConfig.registerSheet(Actor, "utrymme", UtrymmeActorSheet, { makeDefault: true });
})
