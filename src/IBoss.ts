export default interface IBoss{
    name: string[],
    key: string,
    id: string,
    affinity: string,
    location?: string,
    skills?: IBossSkill[]
    hp?: string,
    def?: string,
    atk?: string,
    spd?: string,
    crate?: string,
    cdamage?: string,
    acc?: string,
    res?: string,
    avatar: string
}

export interface IBossSkill{
    name: string,
    cd: string,
    desc: string,
    //basedOn: string,
    //multiplier?:string
}

