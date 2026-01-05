export default class UtrymmeActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.sheets.ActorSheetV2
){
// Changement ici : Utilisez DEFAULT_OPTIONS (statique)
    static DEFAULT_OPTIONS = {
        classes: ["utrymme", "sheet", "actor"],
        tag: "form", // CRUCIAL pour que le handler fonctionne
        window: {
            resizable: true,
            width: 600,
            height: 600
        },
        form: {
            handler: UtrymmeActorSheet.#onSubmitForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    /** PARTS definition */
    static PARTS = {
        form: {
            template: "systems/utrymme/templates/sheets/player-sheet.html"
        }
    };

    /**
     * Gestionnaire privé pour la sauvegarde des données
     * Cette méthode est appelée automatiquement grâce à l'option 'form.handler'
     */
    static async #onSubmitForm(event, form, formData) {
        console.log("Utrymme | SAVING");
        // expandObject transforme les clés plates (ex: "system.race") en objet imbriqué
        const updateData = foundry.utils.expandObject(formData.object);
        
        // Met à jour l'acteur avec les nouvelles données
        await this.document.update(updateData);
        console.log("Utrymme | Données sauvegardées avec succès", updateData);
    }
    
    /** Setting up context  */
    async  _prepareContext(context) {
        console.log(`Utrymme | prepare Context`, context);
        context = await super._prepareContext(context);

        context.system = this.document.system; 
        context.actor = this.document;

        return context;
    }
}


