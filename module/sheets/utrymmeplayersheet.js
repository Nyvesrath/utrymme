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
            // -- Ajout : gestion de la liste d'objets de l'onglet Inventaire --
            createItem: UtrymmeActorSheet.#onCreateItem,
            openItem: UtrymmeActorSheet.#onOpenItem,
            deleteItem: UtrymmeActorSheet.#onDeleteItem
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

}


