import UtrymmeItemSheet from "./sheets/utrymmeitemsheet.js";
import UtrymmeActorSheet from "./sheets/utrymmeplayersheet.js";

import UtrymmeItemModel, { UtrymmeWeaponItemModel, UtrymmeEquipmentItemModel } from "./data/item-data-model.js";
import UtrymmePlayerModel from "./data/actor-data-model.js";

import UtrymmeActor from "./actor/utrymme-actor.js";


Hooks.once("init", () => {
    console.log("Utrymme | Initialisation du système Utrymme");

    const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

    DocumentSheetConfig.unregisterSheet(Item, "core", foundry.applications.sheets.ItemSheetV2);
    DocumentSheetConfig.registerSheet(Item, "utrymme", UtrymmeItemSheet, { makeDefault: true });

    DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.applications.sheets.ActorSheetV2);
    DocumentSheetConfig.registerSheet(Actor, "utrymme", UtrymmeActorSheet, { makeDefault: true });

    CONFIG.Actor.documentClass = UtrymmeActor;

    CONFIG.Actor.dataModels = {
        player: UtrymmePlayerModel
        // "enemy" n'a pas encore de DataModel : à créer quand ce type sera implémenté.
    };

    CONFIG.Item.dataModels = {
        weapon: UtrymmeWeaponItemModel,
        equipment: UtrymmeEquipmentItemModel,
        miscellaneous: UtrymmeItemModel
    };

    CONFIG.UTRYMME = {};

    // On lit les clés de stats directement depuis le schema du DataModel,
    // plus besoin de passer par l'API legacy game.model.Actor.
    const statsFields = UtrymmePlayerModel.schema.fields.stats.fields;
    CONFIG.UTRYMME.stats = Object.keys(statsFields).reduce((obj, key) => {
        obj[key] = key.capitalize();
        return obj;
    }, {});

    CONFIG.UTRYMME.weaponTypes = {
        "melee": "Utrymme.MeleeWeapon",
        "ranged": "Utrymme.RangedWeapon"
    };

    CONFIG.UTRYMME.targetDefenses = {
        "block": "Utrymme.Block",
        "dodge": "Utrymme.Dodge"
    };

    // Cibles disponibles pour les "détails" (buffs) d'équipement : dérivées du
    // schema (stats + compétences) + complétées à la main (défenses, ressources...).
    // Voir UtrymmePlayerModel.buildBuffTargets().
    try {
        CONFIG.UTRYMME.buffTargets = UtrymmePlayerModel.buildBuffTargets();
    } catch (err) {
        console.error("Utrymme | Échec de buildBuffTargets() :", err);
        CONFIG.UTRYMME.buffTargets = {};
    }

    CONFIG.UTRYMME.buffModes = {
        "bonus": "Bonus (+/-)",
        "replace": "Remplacement"
    };

    CONFIG.UTRYMME.buffValueTypes = {
        "fixed": "Valeur fixe",
        "statScaling": "Valeur + modificateur d'une stat"
    };
})