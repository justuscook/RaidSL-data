import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import IChampion, { ISkill } from './IChampion';
import sharp, { Sharp } from 'sharp';
import IBoss, { IBossSkill } from './IBoss';
import { create } from '../node_modules/ts-node/dist/index';

import * as rtk from '@raid-toolkit/webclient';
import './ws-polyfill.js'

const data = rtk.useRaidToolkitApi(rtk.IStaticDataApi) as rtk.IStaticDataApi;

console.log(await data.getAllData())

const json = JSON.parse(fs.readFileSync('./dist/static_data.json', 'utf-8'));

function getAffinity(num: number) {
    switch (num) {
        case 1: return 'Magic';
        case 2: return 'Force';
        case 3: return 'Spirit';
        case 4: return 'Void';
    }
}

function getScalableBaseStat(num: number): number {
    return Math.round(num / Math.pow(2, 32) * 6.47744703 * 1.70000005);
}

function getBaseStat(num: number): string {
    return Math.round(num / Math.pow(2, 32)).toString();
}

function getFaction(num: number): string {

    switch (num) {
        case 1: return 'Banner Lords';
        case 2: return 'High Elves';
        case 3: return 'Sacred Order';
        case 5: return 'Ogryn Tribes';
        case 6: return 'Lizardmen';
        case 7: return 'Skinwalkers';
        case 8: return 'Orcs';
        case 9: return 'Demonspawn';
        case 10: return 'Undead Hordes';
        case 11: return 'Dark Elves';
        case 12: return 'Knight Revenant';
        case 13: return 'Barbarians';
        case 15: return 'Shadowkin';
        case 16: return 'Dwarves';
    }
}

function getRarity(num: number): string {
    switch (num) {
        case 1: return 'Common';
        case 2: return 'Uncommon';
        case 3: return 'Rare';
        case 4: return 'Epic';
        case 5: return 'Legendary';
    }
}

function getType(num: number): string {
    switch (num) {
        case 0: return 'Attack';
        case 1: return 'Defense';
        case 2: return 'HP';
        case 3: return 'Support';
    }
}
function getMinCD(SkillLevelBonuses): number {
    let sub = 0;
    if (SkillLevelBonuses !== undefined) {
        for (const bonus of SkillLevelBonuses) {
            if (bonus.SkillBonusType === 3)
                sub--;
        }
    }
    return sub;
}

function getBookUpgrades(SkillLevelBonuses): string {
    let text: string = '';
    let ending: string = '%\n';
    let i = 2;
    if (SkillLevelBonuses !== undefined) {
        {
            for (const bonus of SkillLevelBonuses) {
                text += `Level ${i}: `;
                i++;
                switch (bonus.SkillBonusType) {
                    case 0:
                        text += "Damage +";
                        break;
                    case 1:
                        text += "Heal +";
                        break;
                    case 2:
                        text += "Buff/Debuff Chance +";
                        break;
                    case 3:
                        text += "Cooldown -";
                        ending = '\n';
                        break;
                    case 4:
                        text += "Shield +";
                        break;
                }
                if (ending !== '\n') {
                    text += `${Math.round(bonus.Value / Math.pow(2, 32) * 100)}${ending}`
                }
                else {
                    text += `${Math.round(bonus.Value / Math.pow(2, 32))}${ending}`
                }

            }
            return text;
        }

    }
    else return '';
}

function getSkillData(id: number): ISkill | undefined {
    try {
        if (id.toString().includes("6220")) {
            console.log('tst')
        }
        //const slkmdfgn= ''.match()
        const test = json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Description.Key]
        let skill: ISkill = {

            //check description for 'damage' and if it doesnt deal damage, leave based on blank
            desc: "",
            basedOn: '',
            name: "",
            maxcd: json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Cooldown.toString(),
            mincd: (json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Cooldown + getMinCD(json.SkillData.SkillTypes.filter(x => x.Id === id)[0].SkillLevelBonuses)).toString(),
            books: getBookUpgrades(json.SkillData.SkillTypes.filter(x => x.Id === id)[0].SkillLevelBonuses).toString(),
            multiplier: "",
            numBooksToMax: getNumberOfBooks(json.SkillData.SkillTypes.filter(x => x.Id === id)[0].SkillLevelBonuses)
        }
        try {
            skill.desc = json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Description.Key]
                .replace(/<\/color>/g, '')
                .replace(/<color=#......>/g, '');
        }
        catch {
            skill.desc = "Description not present."
        }
        try {
            skill.name = json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Name.Key];
        }
        catch {
            skill.name = "Name not present"
        }
        try {
            skill.multiplier = (json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Description.Key].toLowerCase().match(/attacks ./) !== null) ? json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Effects[0].MultiplierFormula : '';
        }
        catch {
            skill.multiplier = 'Multiplier not found.'
        }
        try {
            skill.basedOn = (json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Description.Key].toLowerCase().match(/attacks ./) !== null) ? getBasedOn(json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Effects[0].MultiplierFormula) : '';
        }
        catch {
            skill.basedOn = "Based on not found."
        }

        if (skill.name === undefined) {
            skill.name = "Name not present"
        }
        if (skill.basedOn === '') {
            skill.multiplier = '';
        }
        return skill;
    }
    catch (e) {
        console.log(id)
        console.log(`${e.message}\n${e.stack}`)
    }
}

function getBossSkillData(id: number): IBossSkill | undefined {
    try {
        let bossSkill: IBossSkill = {
            cd: json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Cooldown.toString(),
            desc: json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Description.Key]
                .replace(/<\/color>/g, '')
                .replace(/<color=#......>/g, ''),
            name: json.StaticDataLocalization[json.SkillData.SkillTypes.filter(x => x.Id === id)[0].Name.Key]
        }
        if (bossSkill.desc === '') {
            return undefined;
        }
        return bossSkill;
    }
    catch (e) {
        console.log(`Boss skill error:\n${e.message}\n${e.stack}`)
    }
}

function getNumberOfBooks(skillBonus): string {
    if (skillBonus !== undefined) {
        return skillBonus.length.toString();
    }
    else return '';
}

function getBasedOn(text: string | undefined): string {
    if (text !== undefined) {
        let newText = text
            .replace('TRG_HP', 'Enemy MAX HP')
            .replace(/DMG_MUL/g, '')
            .replace(/deadAlliesCount/g, '')
            .replace(/HP_PERC/g, '')
            .replace(/DamageSkillUsedInRowCountToTargetWithId/g, '')
            .replace(/targetId/g, '')
            .replace(/REL_TRG_B_HP/g, '')
            .replace(/REL_Enemy MAX HP/g, '')
            .replace(/EnemyTeamAppliedEffectsTotalCountOfKind/g, '')
            .replace(/AoEContinuousDamage_KindId/g, '')
            .replace(/aliveAlliesCount<=aliveEnemiesCount\|\|thereIsBossInCurrentRound/g, '')
            .replace(/TRG_HP/g, '')
            .replace(/DEBUFF_COUNT/g, '')
            .replace(/B_DEF/g, '')
            .replace(/targetIsBoss/g, '')
            .replace(/TRG_B_HP/g, '')
            .replace(/!targetIsBoss/g, '')
            .replace(/AllyTeamAppliedEffectsTotalCountOfKind/g, '')
            .replace(/SKILL_USED_COUNT/g, '')
            .replace(/TRG_/g, '')
            .replace(/STAMINA/g, '')
            .replace(/MAX_/g, '')
            .replace(/EffectsAppliedByProducerWholeBattleCountOfKind/g, '')
            .replace(/Stun_KindId/g, '')
            .replace(/</g, '')
            .replace(/>=/g, '')
            .replace(/!/g, '')
            .replace(/CALCULATED_DMG/g, '')
            .replace(/relationProducerIsBoss/g, '')
            .replace(/BUFF_COUNT/g, '')
            .split(/[0-9+.*\/()-]/g);
        newText = newText.filter(x => x !== '')
        if (newText.length === 0) {
            return '';
        }
        let final: string[] = [];
        newText.forEach((c) => {
            if (!final.includes(c)) {
                final.push(c);
            }
        });
        return `[${final.join('][')}]`;
    }
    else {
        return '';
    }
}
function getAura(champion): string {
    //isAbsolute, all or affinity allies
    if (champion.LeaderSkill !== undefined) {
        let text = '';
        let area = ''
        switch (champion.LeaderSkill.Area) {
            case 1:
                area = 'in Campaign Battles';
                break;
            case 2:
                area = 'in Dungeons';
                break;
            case 3:
                area = 'in Arena Battles';
                break;
            case 4:
                area = '';
                break;
            case 5:
                area = 'in Faction Crypts'
                break;
            case 6:
                area = ''//
                break;
            case 7:
                area = 'in Doom Tower Battles'
                break;
            default:
                area = 'in All Battles';
                break;
        }
        let boost = '';
        switch (champion.LeaderSkill.StatKindId) {
            case 1:
                boost = 'HP';
                break;
            case 2:
                boost = 'ATK';
                break;
            case 3:
                boost = 'DEF';
                break;
            case 4:
                boost = 'SPD'
                break;
            case 5:
                boost = 'RES';
                break;
            case 6:
                boost = 'ACC';
                break;
            case 7:
                boost = 'C. RATE'
                break;
            default:
                break;
        }
        let allies = 'Ally'
        switch (champion.LeaderSkill.Element) {
            case 1:
                allies = `${getAffinity(champion.Element)} Ally`;
                break;
            default:
                allies = 'Ally';
                break;
        }
        let amount = (champion.LeaderSkill.Amount / Math.pow(2, 32));
        if (amount < 1) {
            amount = (amount * 100);
        }
        amount = Math.round(amount);
        return `Increases ${allies} ${boost} ${area} by ${amount}${(boost === 'DEF' || boost === 'ATK' || boost === 'HP' || boost === 'C. RATE') ? '%' : ''}.`
    }
    return ''
}

function getValidIDs(): number[] {
    let arr: number[] = [];
    for (const rarity in json.HeroData.HeroIdsByRarities) {
        for (const id of json.HeroData.HeroIdsByRarities[rarity]) {
            if (rarity !== '1') {
                arr.push(id + 6)
            }
            else arr.push(id)
        }
    }
    return arr;
}

function spaceToDash(text: string): string {
    return text.split(' ').join('_');
}

async function addToAvatarImages(champions: IChampion[]) {
    for (const champ of champions) {
        try {
            let champAv = '';
            let newChampAv = '';
            if (champ.rarity !== 'Common') {
                champAv = `./data/images/avatars/${Number(champ.id) - 6}.png`;
                newChampAv = `./data/images/newAvatars/${Number(champ.id) - 6}.png`;
            }
            else {
                champAv = `./data/images/avatars/${champ.id}.png`;
                newChampAv = `./data/images/newAvatars/${champ.id}.png`;
            }
            if (fs.existsSync(champAv)) {
                const image = await sharp(champAv);
                const aura = getAuraType(champ.aura);
                if (champ.aura !== '') {
                    try {
                        await image.composite([
                            {
                                input: `./data/images/borders/${champ.rarity.toLowerCase()}.png`
                            },
                            {
                                input: `./data/images/affinity/${champ.affinity.toLowerCase()}.png`,
                                left: 10,
                                top: 140
                            },
                            {
                                input: `./data/images/auras/${aura}`,
                                left: 100,
                                top: 1
                            }])
                    }
                    catch { console.log(`Error in aura image`) }
                }
                else {
                    try {
                        await image.composite([{
                            input: `./data/images/borders/${champ.rarity.toLowerCase()}.png`,
                        },
                        {
                            input: `./data/images/affinity/${champ.affinity.toLowerCase()}.png`,
                            left: 10,
                            top: 140
                        }
                        ])
                    }
                    catch { console.log(`Error in basic image`) }
                }
                await image.png()
                    .toFile(newChampAv)
            }
            else {
                //console.log(`Missing champion: ${champ.name} ID: ${champ.id}`)
            }
        }
        catch (e) {
            console.log(`${e.message}\n${e.stack}`)
        }

    }

}


function getAuraType(aura: string): string {
    let image = '';
    if (aura.includes('ACC')) {
        image = 'Accuracy.png'
    }
    if (aura.includes('ATK')) {
        image = 'Attack.png'
    }
    if (aura.includes('HP')) {
        image = 'Health.png'
    }
    if (aura.includes('RES')) {
        image = 'Resistance.png'
    }
    if (aura.includes('DEF')) {
        image = 'Defence.png'
    }
    if (aura.includes('SPD')) {
        image = 'Speed.png'
    }
    if (aura.includes('C. RATE')) {
        image = 'CriticalChance.png'
    }
    return image;
}

async function addToAvatarImagesBosses(bosses: IBoss[]) {
    for (const boss of bosses) {
        const bossImage = await sharp(`./data/images/bosses/${boss.avatar}.png`)
            .resize({ height: 342, width: 254, fit: 'fill' })
            .toBuffer();
        /*
    const affinity = await sharp(`./data/images/affinity/${boss.affinity.toLowerCase()}.png`);
    const meta = await affinity.metadata();
    const affinityImage = await sharp()
        .resize(meta.width * 2, meta.height * 2)
        .toBuffer();*/
        const bossImageFramed = await sharp({
            create: {
                height: 342,
                width: 254,
                background: 'rgba(0,0,0,0)',
                channels: 4
            }
        })
            .composite([
                {
                    input: `./data/images/bosses/boss-frame-template.png`
                },
                {
                    input: bossImage,
                    blend: 'atop'

                }
            ])
            .png()
            .toBuffer()
        await sharp(bossImageFramed)
            .composite([{ input: `./data/images/bosses/boss-frame.png` }])
            .toFile(`./data/images/newBosses/${(boss.avatar)}.png`);

    }
}

async function getBossData() {
    try {
        //when lvl 25 is released
        //const bossIDs = [22096, 22136, 22176, 22216, 22246, 22246, 22296, 22356, 22376, 22396, 22406]
        const bossIDs = [22065, 22125, 22155, 22205, 22255, 22386, 22366, 22486, 22546, 22396, 22406]
        const bosses: IBoss[] = [];
        for (const bossID of bossIDs) {
            for (const data of json.HeroData.HeroTypes) {
                if (bossID === data.Id) {
                    let boss: IBoss = {
                        avatar: data.AvatarName,
                        affinity: getAffinity(data.Element),
                        id: data.Id,
                        key: data.Name.Key,
                        name: [json.StaticDataLocalization[data.Name.Key]] /*
                    acc: getBaseStat(data.BaseStats.Accuracy),
                    atk: getScalableBaseStat(data.BaseStats.Attack).toString(),
                    cdamage: getBaseStat(data.BaseStats.CriticalDamage),
                    crate: getBaseStat(data.BaseStats.CriticalChance),
                    spd: getBaseStat(data.BaseStats.Speed),
                    def: getScalableBaseStat(data.BaseStats.Defence).toString(),
                    hp: (getScalableBaseStat(data.BaseStats.Health) * 15).toString(),
                    res: getBaseStat(data.BaseStats.Resistance),*/
                    }
                    switch (boss.name[0]) {
                        case 'Hellrazor':
                            boss.location = 'Dragon\'s Lair';
                            break;
                        case 'Klyssus':
                            boss.location = 'Ice Golem\'s Peak';
                            break;
                        case 'Fyro':
                            boss.location = 'Fire Knight\'s Castle';
                            break;
                        case 'Skavag':
                            boss.location = 'Spider\'s Den';
                            break;
                        case 'Minotaur':
                            boss.location = 'Minotaur\'s Labyrinth';
                            break;
                        case 'Demon Lord':
                            boss.location = 'Clan Boss';
                            break;
                        case 'Sorath':
                            boss.location = 'Doom Tower';
                            break;
                        case 'Borgoth':
                            boss.location = 'Doom Tower';
                            break;
                        case 'Agreth':
                            boss.location = 'Doom Tower';
                            break;
                        case 'Kuldath':
                            boss.location = 'Doom Tower';
                            break;
                        case 'Grythion':
                            boss.location = 'Doom Tower';
                            break;
                        case 'Iragoth':
                            boss.location = 'Doom Tower';
                            break;

                    }
                    boss.skills = [];
                    for (const skillId of data.SkillTypeIds) {
                        const skillData = getBossSkillData(skillId);
                        if (skillData === undefined
                            || skillData.name.toLowerCase().includes('skill')
                            || skillData.name === skillData.desc
                            || skillData.name === 'Continuous Damage Resistance II'
                            || skillData.name === 'Spider ExtraTurn punisher') continue;
                        boss.skills.push(skillData)
                    }
                    bosses.push(boss)
                }
            }

        }
        console.log(bosses)
        await addToAvatarImagesBosses(bosses);
        fs.writeFileSync('./data/RSL_Boss_Data.json', JSON.stringify(bosses, null, '\t'));
        for (const b of bosses) {
            fs.writeFileSync(`./data/bosses/${spaceToDash(b.name[0])}.json`, JSON.stringify(b, null, '\t'));
        }
    }
    catch (e) {
        console.log(`Boss data error:\n${e.message}\n${e.stack}`)
    }
}

async function skillBorders() {
    const files = fs.readdirSync('./data/images/skills')
    for (const f of files) {
        if (fs.existsSync(`./data/images/newSkills/${f}`)) {
            continue;
        }
        try {
            const blank = await sharp({
                create: {
                    background: 'rgba(0,0,0,0)',
                    channels: 4,
                    height: 140,
                    width: 140
                }
            })
                .png()
                .toBuffer();

            const bigger = await sharp('./data/images/skills/skill_frame.png')
                .resize(140, 140)
                .png()
                .toBuffer();

            if (f.includes('frame') || f.includes('counter')) continue;
            await sharp(blank)
                .composite(
                    [{
                        input: `./data/images/skills/${f}`
                    },
                    {
                        input: bigger
                    }]
                )
                .png()
                .toFile(`./data/images/newSkills/${f}`);
        }
        catch (e) { console.log(`Skill image ${f}:\n${e.message}\n${e.stack}`) }
    }
}
interface IChampsByRarity {
    rares: {
        name: string,
        affinity: string,
        id: number
    }[],
    epics: {
        name: string,
        affinity: string,
        id: number
    }[],
    legendaries: {
        name: string,
        affinity: string,
        id: number
    }[],
    /*,
    uncommon: string[],
    common: string[]*/
}

async function heroIDtoJSON() {
    const champs: IChampion[] = [];
    //const secretChamps: IChampion[] = [];
    //const validIDs = getValidIDs();

    for (const champion of json.HeroData.HeroTypes) {
        /*
                try {
                    let championData: IChampion = {
                        key: champion.Name.Key,
                        name: json.StaticDataLocalization[champion.Name.Key],
                        id: champion.Id,
                        acc: getBaseStat(champion.BaseStats.Accuracy),
                        affinity: getAffinity(champion.Element),
                        atk: getScalableBaseStat(champion.BaseStats.Attack).toString(),
                        cdamage: getBaseStat(champion.BaseStats.CriticalDamage),
                        crate: getBaseStat(champion.BaseStats.CriticalChance),
                        spd: getBaseStat(champion.BaseStats.Speed),
                        def: getScalableBaseStat(champion.BaseStats.Defence).toString(),
                        hp: (getScalableBaseStat(champion.BaseStats.Health) * 15).toString(),
                        cheal: getBaseStat(champion.BaseStats.CriticalHeal),
                        res: getBaseStat(champion.BaseStats.Resistance),
                        faction: getFaction(champion.Fraction),
                        rarity: getRarity(champion.Rarity),
                        type: getType(champion.Role),
                        aura: getAura(champion) || ''
                    }
                    try {
                        let skills: ISkill[] = [];
                        let totalBooks = 0;
                        for (const skillId of champion.SkillTypeIds) {
                            const skillData = getSkillData(skillId);
                            if (skillData.name.toLowerCase().includes('skill')) continue;
                            totalBooks += Number(skillData.numBooksToMax);
                            skills.push(skillData)
                        }
                        championData.totalBooks = totalBooks.toString();
                        championData.skills = skills;
                    }
                    catch { }
                    champs.push(championData);
        
                    //if (championData.name === 'Cataphract') {
                    //console.log(championData.name);
                    //}
                }
                catch (e) {
                    console.log(`Champ data error:\n${e.message}\n${e.stack}`)
                }
                */
        if (champion.Id.toString().lastIndexOf('6') === champion.Id.toString().length - 1) {
            try {
                if (champion.Id.toString() === '6706') {
                    console.log('6700')
                }

                let championData: IChampion = {
                    key: champion.Name.Key,
                    name: json.StaticDataLocalization[champion.Name.Key],
                    id: champion.Id,
                    acc: getBaseStat(champion.BaseStats.Accuracy),
                    affinity: getAffinity(champion.Element),
                    atk: getScalableBaseStat(champion.BaseStats.Attack).toString(),
                    cdamage: getBaseStat(champion.BaseStats.CriticalDamage),
                    crate: getBaseStat(champion.BaseStats.CriticalChance),
                    spd: getBaseStat(champion.BaseStats.Speed),
                    def: getScalableBaseStat(champion.BaseStats.Defence).toString(),
                    hp: (getScalableBaseStat(champion.BaseStats.Health) * 15).toString(),
                    cheal: getBaseStat(champion.BaseStats.CriticalHeal),
                    res: getBaseStat(champion.BaseStats.Resistance),
                    faction: getFaction(champion.Fraction),
                    rarity: getRarity(champion.Rarity),
                    type: getType(champion.Role),
                    aura: getAura(champion) || ''
                }
                let skills: ISkill[] = [];
                let totalBooks = 0;
                for (const skillId of champion.SkillTypeIds) {
                    const skillData = getSkillData(skillId);
                    if (skillData.name.toLowerCase().includes('skill')) continue;
                    totalBooks += Number(skillData.numBooksToMax);
                    skills.push(skillData)
                }
                championData.totalBooks = totalBooks.toString();
                championData.skills = skills;
                champs.push(championData);
            }
            catch (e) { console.log(`${champion.Id}\n${champion.Name.Key}\n${e.message}\n${e.stack}`) }

            //if (championData.name === 'Cataphract') {
            //console.log(championData.name);
            //}
        }


    }
    let champsByRarity: IChampsByRarity = {
        rares: [],
        epics: [],
        legendaries: []
    }
    for (const c of champs) {
        let arr = [];
        let ID = 0;
        if (c.id.toString().lastIndexOf('0') === c.id.toString().length) {
            ID = parseInt(c.id);
        }
        else ID = parseInt(c.id) - 6;
        switch (c.rarity) {

            case 'Rare':
                champsByRarity.rares.push({ name: c.name, affinity: c.affinity, id: ID })
                break;
            case 'Epic':
                champsByRarity.epics.push({ name: c.name, affinity: c.affinity, id: ID })
                break;
            case 'Legendary':
                champsByRarity.legendaries.push({ name: c.name, affinity: c.affinity, id: ID })
                break;
            /*
        case 'Uncommon':
            champsByRarity.uncommon.push(c.name)
            break;
        case 'Common':
            champsByRarity.common.push(c.name)
            break;*/
        }
    }
    fs.writeFileSync('./data/RSL_Champions_Rarity.json', JSON.stringify(champsByRarity, null, '\t'));

    fs.writeFileSync('./data/RSL_Champion_Data.json', JSON.stringify(champs, null, '\t'));
    for (const c of champs) {
        if (fs.existsSync(`./data/champions/${spaceToDash(c.name)}.json`)) {
            continue;
        }
        fs.writeFileSync(`./data/champions/${spaceToDash(c.name)}.json`, JSON.stringify(c, null, '\t'));
    }
    //fs.writeFileSync('./data/Secret_RSL_Champion_Data.json', JSON.stringify(secretChamps, null, '\t'));
    /*for (const c of secretChamps) {
        fs.writeFileSync(`./data/champions/Secret_${spaceToDash(c.name)}.json`, JSON.stringify(c, null, '\t'));
    }*/
    await addToAvatarImages(champs);
}


try {
    //getValidIDs();
    //console.log(test)
    await heroIDtoJSON();
    //await getBossData();
    await skillBorders();
    console.log('done!!')
}
catch (e) {
    console.log(`Catch all error:\n${e.message}\n${e.stack}`)
}



