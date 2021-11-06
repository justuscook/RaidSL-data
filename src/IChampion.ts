export default interface IChampion{
    name: string,
    key: string,
    id: string,
    hp: string,
    def: string,
    atk: string,
    spd: string,
    crate: string,
    cdamage: string,
    acc: string,
    res: string,
    faction: string,
    affinity: string,
    type: string,
    rarity: string,
    aura?: string,
    cheal: string,
    skills?: ISkill[],
    totalBooks?: string
}

export interface ISkill{
    name: string,
    mincd?: string,
    maxcd: string,
    desc: string,
    books?: string,
    numBooksToMax?: string,
    basedOn: string,
    multiplier?:string
}

