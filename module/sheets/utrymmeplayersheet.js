export default class UtrymmeActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.sheets.ActorSheetV2
){
    /** Override default Option */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
        template: "systems/utrymme/templates/sheets/player-sheet.html",
        width: 600,
        height: 600
        });
    }

    /** PARTS definition */
    static PARTS = {
        form: {
            template: "systems/utrymme/templates/sheets/player-sheet.html"
        }
    };

    
    /** Setting up context  */
    async  _prepareContext(context) {
        console.log(`Utrymme | prepare Context`, context);
        context = await super._prepareContext(context);
        return {
            ...context,
            actor: this.actor,
            system: this.actor.system,
        };
    }
}


