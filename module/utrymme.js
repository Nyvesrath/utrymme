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

// -- NOUVEAU : bouton "Lancer les dégâts" dans les messages de chat d'attaque.
// Un message de chat peut être cliqué bien après la fermeture de toute fenêtre,
// donc ce n'est pas une action de fiche (pas de "this.actor" disponible) : on
// branche un écouteur global sur chaque message de chat rendu.
Hooks.on("renderChatMessageHTML", (message, html) => {
    const button = html.querySelector('[data-action="rollDamage"]');
    if (!button) return;

    button.addEventListener("click", async (event) => {
        event.preventDefault();
        await rollWeaponDamageFromMessage(message);
    });
});

/**
 * Lit les flags "utrymme" du message d'attaque (acteur, arme, à deux mains ou
 * non) pour lancer toutes les lignes de dégâts de l'arme concernée (liste
 * normale ou versatile selon le choix fait dans la fenêtre d'attaque) en un
 * seul message de résultat.
 */
async function rollWeaponDamageFromMessage(message) {
    const flags = message.flags?.utrymme;
    if (!flags) return;

    const actor = game.actors.get(flags.actorId);
    if (!actor) {
        ui.notifications.warn("Utrymme | Personnage introuvable pour ce jet de dégâts.");
        return;
    }

    const item = actor.items.get(flags.itemId);
    if (!item) {
        ui.notifications.warn("Utrymme | Cette arme n'existe plus.");
        return;
    }

    const damageList = flags.twoHanded ? item.system.damages : item.system.versatileDamages;

    const rolls = [];
    const parts = [];

    for (const entry of damageList) {
        const statBonus = actor.system.stats[entry.damageStat]?.bonus ?? 0;
        const roll = new Roll(`${entry.roll} + ${entry.bonus} + ${statBonus}`);
        await roll.evaluate();
        rolls.push(roll);

        const typeLabel = entry.damageType?.trim() ? entry.damageType : "Dégâts";
        const rollHtml = await roll.render();
        parts.push(`<div class="utrymme-damage-part"><strong>${typeLabel}</strong>${rollHtml}</div>`);
    }

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `Dégâts (${flags.twoHanded ? "à deux mains" : "à une main"}) — ${item.name}`,
        content: parts.join(""),
        rolls
    });
}