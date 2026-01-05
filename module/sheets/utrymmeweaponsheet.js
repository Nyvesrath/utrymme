export default class UtrymmeItemSheet extends foundry.appv1.sheets.ItemSheet{
    get template(){
        console.log(`Utrymme | Récupération du fichier html ${this.item.type}-sheet.`);


        return `systems/utrymme/templates/sheets/${this.item.type}-sheet.html`;
    }


    getData(){
        const data = super.getData();
        
        console.log(data);
        
        return data;
    }
}
