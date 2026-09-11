export default class UtrymmeItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.sheets.ItemSheetV2
) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["utrymme", "sheet", "item"],
        tag: "form",
        window: {
            resizable: true,
            controls: []
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            addBuffDetail: UtrymmeItemSheet.#onAddBuffDetail,
            removeBuffDetail: UtrymmeItemSheet.#onRemoveBuffDetail,
            addDamageEntry: UtrymmeItemSheet.#onAddDamageEntry,
            removeDamageEntry: UtrymmeItemSheet.#onRemoveDamageEntry
        }
    };

    /** @override */
    static PARTS = {
        form: {
            // Cette fonction remplace votre "get template()" de manière plus propre en V2
            template: "systems/utrymme/templates/sheets/item-sheet.html"
        }
    };

    /** TABS definition */
    static TABS = {
        primary: {
            tabs: [
                { id: "description", label: "Description" },
                { id: "details", label: "Details" }
            ],
            initial: "description" 
        }
    };

    static TABS_CONFIG = { primary: UtrymmeItemSheet.TABS.primary };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const item = this.document;


        // On enrichit le contexte pour le template
        context.system = item.system;
        context.item = item;
        context.config = CONFIG.UTRYMME;

        // Garde-fou : évite un crash de rendu si une clé de config attendue par le
        // template (buffTargets/buffModes/buffValueTypes) n'a pas pu être générée.
        context.config.buffTargets ??= {};
        context.config.buffModes ??= {};
        context.config.buffValueTypes ??= {};


        // Logique pour différencier les types dans un template unique ou dynamique
        context.isWeapon = item.type === "weapon";
        context.isEquipment = item.type === "equipment";
        context.isMisc = item.type === "miscellaneous";

        // Definition des tabs
        context.tabs = this.tabGroups.primary;

        console.log("Utrymme | Item Context:", context);
        return context;
    }

    /**
     * Ajoute un nouveau "détail" (buff) vide à la fin de la liste de l'équipement.
     */
    static async #onAddBuffDetail(event, target) {
        event.preventDefault();

        const details = foundry.utils.deepClone(this.document.system.details ?? []);
        details.push({
            target: "",
            mode: "bonus",
            valueType: "fixed",
            value: 0,
            scalingStat: "strength"
        });

        await this.document.update({ "system.details": details });
    }

    /**
     * Retire le détail dont l'index est passé via data-index sur le bouton cliqué.
     */
    static async #onRemoveBuffDetail(event, target) {
        event.preventDefault();

        const index = Number(target.dataset.index);
        const details = foundry.utils.deepClone(this.document.system.details ?? []);
        details.splice(index, 1);

        await this.document.update({ "system.details": details });
    }

     /**
     * Ajoute une ligne de dégâts vide (valeurs de base) à la liste ciblée
     * (system.damages OU system.versatileDamages, selon data-list du bouton).
     */
    static async #onAddDamageEntry(event, target) {
        event.preventDefault();

        const listKey = target.dataset.list;
        const list = foundry.utils.deepClone(this.document.system[listKey] ?? []);
        list.push({ roll: "1d6", bonus: 0, damageStat: "strength", damageType: "" });

        await this.document.update({ [`system.${listKey}`]: list });
    }

    /**
     * Retire la ligne de dégâts à l'index donné. Si c'était la dernière ligne de
     * la liste, elle est réinitialisée aux valeurs de base plutôt que supprimée :
     * il y a toujours au moins une ligne de dégâts.
     */
    static async #onRemoveDamageEntry(event, target) {
        event.preventDefault();

        const listKey = target.dataset.list;
        const index = Number(target.dataset.index);
        const list = foundry.utils.deepClone(this.document.system[listKey] ?? []);

        list.splice(index, 1);

        if (list.length === 0) {
            list.push({ roll: "1d6", bonus: 0, damageStat: "strength", damageType: "" });
        }

        await this.document.update({ [`system.${listKey}`]: list });
    }
}