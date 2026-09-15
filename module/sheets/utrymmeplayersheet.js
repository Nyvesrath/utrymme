export default class UtrymmeActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.sheets.ActorSheetV2
){
    static DEFAULT_OPTIONS = {
        classes: ["utrymme", "sheet", "actor"],
        tag: "form", // CRUCIAL pour que le handler fonctionne
        window: { resizable: true },
        controls: [
            {
                icon: "fas fa-image",
                label: "Sélecteur d'image",
                action: "editImage" 
            }
        ],
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            rollStat: UtrymmeActorSheet.#onRollStat, 
            rollSkill: UtrymmeActorSheet.#onRollSkill,
            editImage: UtrymmeActorSheet.#onEditImage,
        
            createItem: UtrymmeActorSheet.#onCreateItem,
            openItem: UtrymmeActorSheet.#onOpenItem,
            deleteItem: UtrymmeActorSheet.#onDeleteItem,

            toggleEquip: UtrymmeActorSheet.#onToggleEquip,
            confirmUnequip: UtrymmeActorSheet.#onConfirmUnequip
        }
    };

    /** PARTS definition */
    static PARTS = {
        form: {
            template: "systems/utrymme/templates/sheets/player-sheet.html"
        }
    };

    /** TABS definition */
    static TABS = {
        primary: {
            tabs: [
                { id: "stats", label: "Statistiques", icon: "fas fa-user-chart" },
                { id: "inventory", label: "Inventaire", icon: "fas fa-backpack" },
                { id: "magic", label: "Magie", icon: "fas fa-hat-wizard" }
            ],
            initial: "stats" 
        }
    };

    static TABS_CONFIG = { primary: UtrymmeActorSheet.TABS.primary };

    /** Setting up context  */
    async  _prepareContext(context) {
        console.log(`Utrymme | prepare Context`, context);
        context = await super._prepareContext(context);

        // Definition des tabs
        context.tabs = this.tabGroups.primary; 

        context.system = this.document.system;

        const allItems = this.document.items.contents;
        context.weaponItems = allItems.filter((item) => item.type === "weapon");
        context.equipmentItems = allItems.filter((item) => item.type === "equipment");
        context.miscItems = allItems.filter((item) => item.type === "miscellaneous");

        // utilisé pour désactiver l'input correspondant sur la fiche et afficher
        // le bouton de déséquipement rapide (cadenas).
        const replaced = context.system.replacedTargets ?? {};
        context.locks = {
            block: replaced["block"] ?? null,
            dodge: replaced["dodge"] ?? null,
            speed: replaced["speed"] ?? null,
            max_health: replaced["max_health"] ?? null,
            max_mana: replaced["max_mana"] ?? null,
            stats: {}
        };
        for (const key of Object.keys(context.system.stats)) {
            context.locks.stats[key] = replaced[`stats.${key}.value`] ?? null;
        }


        // Forcer la taille de la fenêtre lors du premier rendu
        this.position.width = 1080;
        this.position.height = 720;

        return context;
    }

    /**
     * Gestionnaire de lancer de dé
     */
    static async #onRollStat(event, target) {
        // 1. Récupérer la stat ciblée via l'attribut data-stat du bouton
        const statKey = target.dataset.stat;
        const statValue = this.document.system.stats[statKey].bonus;

        // 2. Construire la formule (1d20 + la valeur de la stat)
        const formula = `1d20 + ${statValue}`;

        // 3. Créer le jet de dé Foundry
        const roll = new Roll(formula);
        await roll.evaluate();

        // 4. Envoyer le résultat dans le chat
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.document }),
            flavor: `Jet de ${statKey.toUpperCase()}`
        });
    }
    
    /**
     * Gestionnaire de lancer de dé
     */
    static async #onRollSkill(event, target) {
        // Récupération des données depuis les attributs data- du bouton
        const statKey = target.dataset.stat;   // ex: "strength"
        const skillKey = target.dataset.skill; // ex: "athletics"
        
        // Accès aux données de l'acteur
        const skill = this.document.system.stats[statKey].skills[skillKey];

        // Calcul : 1d20 + bonus_stat + bonus_mastery
        const formula = `1d20 + ${skill.bonus_stat} + ${skill.bonus_mastery}`;

        // 3. Créer le jet de dé Foundry
        const roll = new Roll(formula);
        await roll.evaluate();

        // 4. Envoyer le résultat dans le chat
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.document }),
            flavor: `Jet de ${skillKey.toUpperCase()}`
        });
    }

    // Méthode pour ouvrir le sélecteur d'image
    static async #onEditImage(event, target) {
      console.log("Utrymme | EDITING IMAGE");
        const attr = target.dataset.edit || "img";
        const current = foundry.utils.getProperty(this.document, attr);

        // Utilisation du nouveau namespace pour la V13
        const fp = new foundry.applications.apps.FilePicker.implementation({
            type: "image",
            current: current,
            callback: path => {
                this.document.update({ [attr]: path });
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    /**
     * Crée un nouvel objet embarqué sur l'acteur. Le type est lu depuis
     * data-type sur le bouton cliqué (par défaut "miscellaneous"), ce qui
     * permet de réutiliser ce même handler pour les armes/équipements plus tard.
     */
    static async #onCreateItem(event, target) {
        event.preventDefault();

        const type = target.dataset.type ?? "miscellaneous";
        const defaultNames = {
            weapon: "Nouvelle arme",
            equipment: "Nouvel équipement",
            miscellaneous: "Nouvel objet"
        };

        await this.actor.createEmbeddedDocuments("Item", [{
            name: defaultNames[type] ?? "Nouvel objet",
            type,
            img: "icons/svg/item-bag.svg"
        }]);
    }

    /**
     * Ouvre la fiche de l'objet dont l'id est porté par l'attribut
     * data-item-id du conteneur parent de l'élément cliqué.
     */
    static async #onOpenItem(event, target) {
        event.preventDefault();

        const itemId = target.closest("[data-item-id]")?.dataset.itemId;
        const item = this.actor.items.get(itemId);
        item?.sheet.render(true);
    }

    /**
     * Supprime l'objet dont l'id est porté par l'attribut data-item-id
     * du conteneur parent du bouton cliqué.
     */
    static async #onDeleteItem(event, target) {
        event.preventDefault();

        const itemId = target.closest("[data-item-id]")?.dataset.itemId;
        await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }

    /**
     * Surcharge du comportement de dépôt (drag & drop) d'ActorSheetV2 : on
     * crée TOUJOURS une copie indépendante de l'objet déposé sur cet acteur
     * (jamais de déplacement/lien vers l'original, même si l'objet déposé est
     * déjà possédé par cet acteur — dans ce cas, ça crée un doublon plutôt
     * que de déclencher un tri).
     * @override
     */
    async _onDropItem(event, item) {
        if (!this.actor.isOwner) return false;

        const itemData = item.toObject();
        delete itemData._id;

        const [created] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
        return created;
    }

        /**
     * Bascule system.equipped sur l'objet ciblé. Déséquiper est toujours permis.
     * Équiper est bloqué (et une fenêtre listant tous les conflits s'affiche)
     * si un ou plusieurs "détails" en mode Remplacement de cet objet visent une
     * cible déjà remplacée par un autre équipement actuellement porté.
     */
    static async #onToggleEquip(event, target) {
        event.preventDefault();

        const itemId = target.closest("[data-item-id]")?.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        // Déséquiper : jamais de conflit possible, toujours autorisé.
        if (item.system.equipped) {
            await item.update({ "system.equipped": false });
            return;
        }

        // Équiper : on vérifie d'abord les conflits de remplacement contre les
        // autres équipements déjà portés (system.replacedTargets, calculé dans
        // UtrymmePlayerModel#prepareDerivedData).
        const replacedTargets = this.actor.system.replacedTargets ?? {};
        const conflicts = [];

        for (const detail of item.system.details) {
            if (detail.mode !== "replace" || !detail.target) continue;

            const owner = replacedTargets[detail.target];
            if (owner) {
                conflicts.push({
                    targetLabel: CONFIG.UTRYMME.buffTargets[detail.target] ?? detail.target,
                    ownerName: owner.name
                });
            }
        }

        if (conflicts.length > 0) {
            const listHtml = conflicts
                .map((c) => `<li>Conflit sur <strong>${c.targetLabel}</strong> : déjà remplacé par "${c.ownerName}"</li>`)
                .join("");

            await new foundry.applications.api.DialogV2({
                window: { title: "Conflit d'équipement" },
                content: `<p>Impossible d'équiper "${item.name}" :</p><ul>${listHtml}</ul>`,
                buttons: [{ action: "ok", label: "OK", default: true }]
            }).render(true);

            return; // On annule l'équipement.
        }

        await item.update({ "system.equipped": true });
    }

    /**
     * Ouvre une confirmation pour déséquiper l'objet dont l'id est passé via
     * data-item-id sur le bouton cliqué (le petit cadenas affiché à côté d'un
     * champ verrouillé par un remplacement d'équipement).
     */
    static async #onConfirmUnequip(event, target) {
        event.preventDefault();

        const itemId = target.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Déséquiper ?" },
            content: `<p>"${item.name}" remplace cette valeur. Voulez-vous le déséquiper ?</p>`
        });

        if (confirmed) {
            await item.update({ "system.equipped": false });
        }
    }

}


