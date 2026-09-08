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
            removeBuffDetail: UtrymmeItemSheet.#onRemoveBuffDetail
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

        //Set up des stats du joueurs
        const actor = item.actor;

        const statKey = item.system.attackStat;
        context.statBonus = actor?.system.stats?.[statKey]?.bonus ?? 0;
        context.statBonusLabel = context.statBonus >= 0 ? `+${context.statBonus}` : context.statBonus;

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
}