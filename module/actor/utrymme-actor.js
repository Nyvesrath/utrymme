export default class UtrymmeActor extends Actor {



    /** 
     * Save logic in the actor class So the sheet doesn't calculate but only renders
     * 
     * 
     * @override */
    prepareDerivedData() {
        const actorData = this;
        const system = actorData.system;

        if (actorData.type !== 'player') return;

        for (let [key, stat] of Object.entries(system.stats)) {
            
            stat.bonus = Math.floor((stat.value - 10) / 2);

            if (stat.skills) {
                for (let [skillKey, skill] of Object.entries(stat.skills)) {
                    skill.bonus_stat = stat.bonus; 
                                        
                    skill.total = skill.bonus_stat + skill.bonus_mastery;
                }
            }
        }
    }
}