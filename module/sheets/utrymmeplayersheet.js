export default class UtrymmeActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.sheets.ActorSheetV2
){
    /** DÉFINITION DES PARTS DU TEMPLATE */
    static PARTS = {
        form: {
            template: "systems/utrymme/templates/sheets/player-sheet.html"
        }
    };

    
    /** CONTEXTE POUR LE TEMPLATE */
    async  _prepareContext(context) {
        console.log(`Utrymme | prepare Context`, context);
        context = await super._prepareContext(context);
        return {
            ...context,
            actor: this.actor,
            system: this.actor.system,
        };
    }

    /** GESTION SAUVEGARDE */
    async _onSubmit(event) {
        event.preventDefault();
        const formData = this._getSubmitData();
        await this.actor.update(formData);
    }
}


