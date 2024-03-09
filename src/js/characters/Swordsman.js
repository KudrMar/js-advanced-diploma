import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'swordsman');
    this.attack = 40;
    this.defence = 10;
  }
}