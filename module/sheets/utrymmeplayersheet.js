export default class UtrymmeActorSheet extends ActorSheet{
    get template(){
        console.log(`Utrymme | Récupération du fichier html ${this.actor.type}-sheet.`);


        return `systems/utrymme/templates/sheets/${this.actor.type}-sheet.html`;
    }


    getData(){
        const data = super.getData();
        
        console.log(data);

        return data;
    }
}
