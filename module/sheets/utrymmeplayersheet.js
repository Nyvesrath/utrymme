export default class UtrymmeActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.sheets.ActorSheetV2
){
// Changement ici : Utilisez DEFAULT_OPTIONS (statique)
    static DEFAULT_OPTIONS = {
        classes: ["utrymme", "sheet", "actor"],
        tag: "form", // CRUCIAL pour que le handler fonctionne
        window: {
            resizable: true
        },
        form: {
            handler: UtrymmeActorSheet.#onSubmitForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            rollStat: UtrymmeActorSheet.#onRollStat, // On lie l'action HTML à la fonction JS
            rollSkill: UtrymmeActorSheet.#onRollSkill // On lie l'action HTML à la fonction JS
        }
    };

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
        const system = this.document.system;

        // Forcer la taille de la fenêtre lors du premier rendu
        this.position.width = 1080;
        this.position.height = 720;


        context.system = this.document.system; 
        context.actor = this.document;

        return context;
    }

   
    
    /**
     * Gestionnaire privé pour la sauvegarde des données
     * Cette méthode est appelée automatiquement grâce à l'option 'form.handler'
     */
    static async #onSubmitForm(event, form, formData) {
        // expandObject transforme les clés plates (ex: "system.race") en objet imbriqué
        const updateData = foundry.utils.expandObject(formData.object);

        // 1. On parcourt les stats pour recalculer les bonus
        if (updateData.system?.stats) {
            for (let key in updateData.system.stats) {
                const stat = updateData.system.stats[key];
                if (stat.value !== undefined) {
                    // Ta formule de calcul (ex: (valeur-10)/2 )
                    stat.bonus = Math.floor((stat.value - 10) / 2);
                }

                if (stat.skills){
                    for (let skillKey in stat.skills) {
                        const skill = stat.skills[skillKey];
                        if (skill.bonus_stat !== undefined) {
                            skill.bonus_stat = stat.bonus;
                        }
                        if (skill.bonus_mastery !== undefined || skill.bonus_mastery === null) {
                            skill.bonus_mastery = 0;
                        }
                    }
                }
            }

        }

        // Met à jour l'acteur avec les nouvelles données
        await this.document.update(updateData);
        console.log("Utrymme | Données sauvegardées avec succès", updateData);
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

}


