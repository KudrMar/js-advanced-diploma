import Character from '../Character';

export default class Bowman extends Character {
  constructor(level) {
    super(level, 'magician');
    this.attack = 10;
    this.defence = 40;
    this.attackRange = 4;
    this.moveRange = 1;
  }
}