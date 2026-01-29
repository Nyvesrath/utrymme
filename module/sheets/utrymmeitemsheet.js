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
        context.config = CONFIG.UTRYMME; // Si vous avez des listes de types/stats


        // Logique pour différencier les types dans un template unique ou dynamique
        context.isWeapon = item.type === "weapon";
        context.isEquipment = item.type === "equipment";
        context.isMisc = item.type === "miscellaneous";

        // Definition des tabs
        context.tabs = this.tabGroups.primary;

        console.log("Utrymme | Item Context:", context);
        return context;
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        console.log("Utrymme | On Render", context, options);
    }
}


/**
Item are a block of text. Depending on their type, they will have different properties

Every Item has a Name, a type, a description, a weight and a value.

The type of item is defined in the template.json file so when it's created.

The different types are :
 - weapon (melee, ranged or magic)
 - equipment (armour, tool, jewelry or magic item)
 - miscellaneous (any other item that does not fit in the previous categories)


Weapons have :
- Weapon type (melee, ranged, magic)
- Roll stat (the stat used to attack with this weapon)
- Damages (dice and bonus)
- Range (for ranged weapons)

Equipment Have :
- Equipment type (armour, tool, jewelry, magic item)
- Armour value (for armour)
- Effect (for tools, jewelry and magic items)
    - Effect type (bonus to stat, bonus to skill, roll a dice, other)

Miscellaneous items have no additional properties and solely exist for description.

*/