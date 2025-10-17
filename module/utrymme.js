import UtrymmeItemSheet from "./sheets/utrymmeweaponsheet.js";
import UtrymmeActorSheet from "./sheets/utrymmeplayersheet.js";


Hooks.once("init", () => {
    console.log("Utrymme | Initialisation du système Utrymme");


    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("utrymme", UtrymmeItemSheet, { makeDefault: true });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("utrymme", UtrymmeActorSheet, { makeDefault: true });
})
