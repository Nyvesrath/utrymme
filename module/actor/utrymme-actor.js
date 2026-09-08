export default class UtrymmeActor extends Actor {
    // Toute la logique de calcul des stats/buffs d'équipement vit désormais dans
    // UtrymmePlayerModel#prepareDerivedData (module/data/actor-data-model.js).
    // Cette classe reste disponible pour de futures méthodes propres au document
    // (ex : getRollData(), applyDamage()...).
}