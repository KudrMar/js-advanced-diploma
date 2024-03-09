import {calcTileType} from '../utils.js';
import Character from '../Character';
import Bowman from '../characters/Bowman';
import Swordsman from '../characters/Swordsman';
import Magician from '../characters/Magician';
import Vampire from '../characters/Vampire';
import Undead from '../characters/Undead';
import Daemon from '../characters/Daemon';
import {generateTeam} from '../generators';
import GameController from '../GameController';

const boardSize = 8;

test('calcTileType top-left', () => {
  expect(calcTileType(0, boardSize)).toBe('top-left');
});

test('calcTileType top', () => {
  expect(calcTileType(boardSize - 2, boardSize)).toBe('top');
});

test('calcTileType top-right', () => {
  expect(calcTileType(boardSize - 1, boardSize)).toBe('top-right');
});

test('calcTileType bottom-left', () => {
  expect(calcTileType(boardSize * boardSize - boardSize, boardSize)).toBe('bottom-left');
});

test('calcTileType bottom-right', () => {
  expect(calcTileType(boardSize * boardSize - 1, boardSize)).toBe('bottom-right');
});

test('calcTileType left', () => {
  expect(calcTileType(boardSize * 2, boardSize)).toBe('left');
});

test('calcTileType right', () => {
  expect(calcTileType(boardSize * 2 - 1, boardSize)).toBe('right');
});

test('calcTileType bottom', () => {
  expect(calcTileType(boardSize * boardSize - 2, boardSize)).toBe('bottom');
});

test('calcTileType center', () => {
  expect(calcTileType(boardSize * 3 - 3, boardSize)).toBe('center');
});

test('new Character error', () => {
  expect(() => new Character(3)).toThrow(
    'Запрещено создавать объекты класса через new Character'
  );
});

test('new extends Character not error', () => {
  expect(() => new Bowman(3)).not.toThrow();
  expect(() => new Swordsman(3)).not.toThrow();
  expect(() => new Magician(3)).not.toThrow();
  expect(() => new Vampire(3)).not.toThrow();
  expect(() => new Undead(3)).not.toThrow();
  expect(() => new Daemon(3)).not.toThrow();
});

test('characteristics of Character', () => {
  const comparison = {
    type: 'bowman',
    level: 1,
    health: 100,
    attack: 25,
    defence: 25,
   }
  expect(new Bowman(1)).toEqual(comparison);
});

test('Character', () => {
  const team = generateTeam([Bowman, Swordsman, Magician], 9, 3);
  expect(team.characters.length).toEqual(3);
});

test('toolTipTemplate', () => {
  const expected = '\u{1F396}1\u{2694}25\u{1F6E1}25\u{2764}100';
  const GC = new GameController("","");
  expect(GC.showCellTooltipText(new Bowman(1))).toBe(expected);
});

/*import {Team} from "../../js/Team.js";
import {Character} from "../../js/Character.js";
import { Zombie } from "../../js/Zombie.js";
import {ErrorRepository} from "../../js/ErrorRepository.js";*/

/*const teamAdd = new Team();
const characterAdd = new Character("Vasia","Bowman");
teamAdd.add(characterAdd);
test('Team add new character', () => {
  expect(teamAdd.members).toContain(characterAdd);
});

test('Team add character double choice', () => {
  expect(() => teamAdd.add(characterAdd)).toThrow("Этот персонаж уже выбран!")
});

const character = new Character("Vasia", "Bowman");
const character2 = new Character("Vasia", "Bowman");
const character3 = new Character("Petya", "Bowman");
test('addAll several characters', () => {
  const team = new Team();
  team.addAll(character, character2, character3);
  const setOfCh = new Set();
  setOfCh.add(character);
  setOfCh.add(character2);
  setOfCh.add(character3);
  expect(team.members).toEqual(setOfCh);
});

test('toArray charactersArray', () => {
  const team = new Team();
  team.addAll(character, character2, character3);
  const arrayOfCh = new Array();
  arrayOfCh.push(character,character2,character3);
  expect(team.toArray()).toEqual(arrayOfCh);
});

const errorItem = new ErrorRepository();
errorItem.errors.set(1 , "Ошибка с типом 1");
test('ErrorRepository code is present', () => {
  expect(errorItem.translate(1)).toBe(
    "Ошибка с типом 1"
  );
});

test('ErrorRepository code is absent', () => {
  expect(errorItem.translate(2)).toBe(
    "Unknown error"
  );
});


const zombieLevelUp = new Zombie("Вася");
zombieLevelUp.levelUp();
test('Zombie levelUp', () => {

  const comparison = {
       "attack": 48,
       "defence": 12,
       "health": 100,
        "level": 2,
        "name": "Вася",
       "type": "Zombie",
      }

  expect(zombieLevelUp).toEqual(comparison);
});


const zombieDamage = new Zombie("Вася");
zombieDamage.damage(10);
test('Zombie damage', () => {

  const comparison = {
       "attack": 40,
       "defence": 10,
       "health": 91,
        "level": 1,
        "name": "Вася",
       "type": "Zombie",
      }

  expect(zombieDamage).toEqual(comparison);
});


test('name exception', () => {
  expect(() => new Zombie("В")).toThrow(
    "Имя должно быть от 2 до 10 символов!"
  );
});

test('type exception', () => {
  expect(() => new Character("Вася")).toThrow(
    "Недопустимый тип персонажа!"
  );
});

const zombieLevelUpForDead = new Zombie("Вася");
zombieLevelUpForDead.health = 0;
test('Zombie levelUp for dead', () => {
  expect(() => zombieLevelUpForDead.levelUp()).toThrow(
    "Нельзя повысить левел умершего!"
  );
});*/



