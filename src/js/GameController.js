//import GamePlay from './GamePlay';
import themes from './themes';
import {generateTeam} from './generators';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import PositionedCharacter from './PositionedCharacter';
export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.positionUs = new Set();
    this.positionEnemy = new Set();
    this.teamUs = [];
    this.teamEnemy = [];
    this.boardSize = gamePlay.boardSize;
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    let position = [];
    this.teamUs = generateTeam([Bowman, Swordsman, Magician], 1, 3);
    this.teamUs.characters.forEach((e) => position.push(new PositionedCharacter(e, this.getPosition(1))));
    this.teamEnemy = generateTeam([Daemon, Undead, Vampire], 1, 3);
    this.teamEnemy.characters.forEach((e) => position.push(new PositionedCharacter(e, this.getPosition(2))));
    this.gamePlay.redrawPositions(position);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    let indexCh = Array.from(this.positionUs).concat(Array.from(this.positionEnemy)).indexOf(index);
    if (indexCh != -1) {
      let currentCh = this.teamUs.characters.concat(this.teamEnemy.characters)[indexCh];
      this.gamePlay.showCellTooltip(this.showCellTooltipText(currentCh) , index);
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
  }

  getPosition(whoseTeam) {
    let pos;
    let startLength;
    if (whoseTeam === 1) {
      startLength = this.positionUs.size;
      while (this.positionUs.size === startLength){
        pos = Math.floor(Math.random() * this.boardSize*2);
        pos = Math.floor(pos / 2) * this.boardSize + (pos % 2);
        this.positionUs.add(pos);
      }
    } else {
       startLength = this.positionEnemy.size;
       while (this.positionEnemy.size === startLength){
        pos = Math.floor(Math.random() * this.boardSize*2);
        pos = (Math.floor(pos / 2) + 1) * this.boardSize - 1 - (pos % 2);
        this.positionEnemy.add(pos);
       }
    }
    return pos;
  }

  showCellTooltipText(currentCh) {
    return '\u{1F396}' + currentCh.level + '\u{2694}' + currentCh.attack + '\u{1F6E1}' + currentCh.defence +'\u{2764}' + currentCh.health;
  } export
}
