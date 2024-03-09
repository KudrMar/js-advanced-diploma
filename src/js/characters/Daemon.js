import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'daemon');
    this.attack = 10;
    this.defence = 10;
    this.attackRange = 4;
    this.moveRange = 1;
  }
}