import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'undead');
    this.attack = 40;
    this.defence = 10;
  }
}