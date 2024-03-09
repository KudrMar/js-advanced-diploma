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
import GamePlay from '../GamePlay';

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
  const expected = {
    type: 'bowman',
    level: 1,
    health: 100,
    attack: 25,
    attackRange: 2,
    moveRange: 2,
    defence: 25,
   }
  expect(new Bowman(1)).toEqual(expected);
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

test('permittedMoves permittedAttack', () => {
  const GP = new GamePlay();
  const GC = new GameController(GP,"");
  const PermittedArea = GC.getPermittedArea(2, 2)
  let expected = new Set([0, 1, 3, 4, 9, 10, 11, 16, 18, 20]);
  expect(PermittedArea).toEqual(expected);
  const Permittedattack = GC.getPermittedAttack(2, 2)
  expected = new Set([0, 1, 3, 4, 8, 9, 10, 11, 12, 16, 17, 18, 19, 20]);
  expect(Permittedattack).toEqual(expected);
});

