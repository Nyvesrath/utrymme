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
        controls: [
            {
                icon: "fas fa-image",
                label: "Sélecteur d'image",
                action: "editImage" // Optionnel, mais propre pour le contrôle
            }
        ],
        form: {
            handler: UtrymmeActorSheet.#onSubmitForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            rollStat: UtrymmeActorSheet.#onRollStat, 
            rollSkill: UtrymmeActorSheet.#onRollSkill,
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

    static updateCalculatedValues(systemData){
        if (!systemData?.stats) return;
        
        if (systemData?.stats) {
            for (let key in systemData.stats) {
                const stat = systemData.stats[key];
                if (stat.value !== undefined) {
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
    }
    
    /**
     * Gestionnaire privé pour la sauvegarde des données
     */
    static async #onSubmitForm(event, form, formData) {
        const updateData = foundry.utils.expandObject(formData.object);

        if (updateData.system) {
            UtrymmeActorSheet.updateCalculatedValues(updateData.system);
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

}


