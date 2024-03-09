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
import GamePlay from './GamePlay';
import cursors from "./cursors";

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.positionUs = new Set();
    this.positionEnemy = new Set();
    this.teamUs = [];
    this.teamEnemy = [];
    this.permittedMoves = new Set();
    this.permittedAttacks = new Set();
    this.selected = -1;
    this.selectedExpected = -1;
    this.boardSize = gamePlay.boardSize;
    this.currentCharacter = {};
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
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
  }

  onCellClick(index) {
    // TODO: react to click
    if (this.positionEnemy.has(index)) {
      if ((this.selecte >= 0) && (this.permittedAttacks.has(index))) {
        //для следущего пункта задания
      } else if (this.selected >= 0) {
        GamePlay.showError('Враг вне досягаемости');
      } else {
        GamePlay.showError('Нельзя выбрать фигуру врага');
      }
    } else if (this.positionUs.has(index)) {
      if (this.selected >= 0) {
        this.gamePlay.deselectCell(this.selected);
        this.permittedMoves.clear();
        this.permittedAttacks.clear();
      }
      this.selected = index;
      this.gamePlay.selectCell(index);
      let indexCh = Array.from(this.positionUs).indexOf(index);
      this.currentCharacter = this.teamUs.characters[indexCh];
      this.permittedMoves = this.getPermittedArea(this.currentCharacter.moveRange, index);
      this.permittedAttacks = this.getPermittedAttack(this.currentCharacter.attackRange, index);
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    if (this.selectedExpected >= 0) {
      this.gamePlay.deselectCell(this.selectedExpected);
    }
    this.gamePlay.setCursor(cursors.auto);
    let indexCh = Array.from(this.positionUs).concat(Array.from(this.positionEnemy)).indexOf(index);
    if (indexCh != -1) {
      let currentCh = this.teamUs.characters.concat(this.teamEnemy.characters)[indexCh];
      this.gamePlay.showCellTooltip(this.showCellTooltipText(currentCh), index);
      if (this.positionUs.has(index)) {
        this.gamePlay.setCursor(cursors.pointer);
      } else if (this.positionEnemy.has(index)) {
        if (this.permittedAttacks.has(index)) {
          this.gamePlay.setCursor(cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
          this.selectedExpected = index;
        } else {
          this.gamePlay.setCursor(cursors.notallowed)
        }
      }
    } else if (this.permittedMoves.has(index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
      this.selectedExpected = index;
    } else {
      this.gamePlay.setCursor(cursors.notallowed);
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
  }

  getPermittedArea(range, index) {
    const area = new Set();
    let newPos;
    for (let i = 1; i <= range; i += 1) {
        newPos = index - this.boardSize * i; //вниз
        if (this.newPosCorrect(newPos, index, index - this.boardSize * i)) {
          area.add(newPos);
        }
        newPos = index + this.boardSize * i; //вверх
        if (this.newPosCorrect(newPos, index, index + this.boardSize * i)) {
          area.add(newPos);
        }
        newPos = index - i; //лево
        if (this.newPosCorrect(newPos, index, index)) {
          area.add(newPos);
        }
        newPos = index + i; //право
        if (this.newPosCorrect(newPos, index, index)) {
          area.add(newPos);
        }
        newPos = index - this.boardSize * i - i; //левая верхняя
        if (this.newPosCorrect(newPos, index, index - this.boardSize * i)) {
          area.add(newPos);
        }
        newPos = index - this.boardSize * i + i; //правая верхняя
        if (this.newPosCorrect(newPos, index, index - this.boardSize * i)) {
          area.add(newPos);
        }
        newPos = index + this.boardSize * i - i; //левая нижняя
        if (this.newPosCorrect(newPos, index, index + this.boardSize * i)) {
          area.add(newPos);
        }
        newPos = index + this.boardSize * i + i; //правая нижняя
        if (this.newPosCorrect(newPos, index, index + this.boardSize * i)) {
          area.add(newPos);
        }
    }
    return area;
  }

  newPosCorrect(newPos, index, row) {
    if ((newPos >= 0 ) && (newPos < this.boardSize*this.boardSize) && (newPos != index)
    && (newPos >= this.boardSize * Math.floor(row / this.boardSize))
    && (newPos < this.boardSize * (Math.floor(row / this.boardSize)+1))) {
      return true;
    }
    return false;
  }

  getPermittedAttack(range,index) {
    const area = new Set();
    let newPos;
    for (let i = -range; i <= range; i += 1) {
      for (let j = -range; j <= range; j += 1) {
        newPos = index + this.boardSize * i + j;
        if (this.newPosCorrect(newPos, index, index + this.boardSize * i)) {
          area.add(newPos);
        }
      }
    }
    return area;
  }
}
