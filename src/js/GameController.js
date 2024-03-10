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
    this.activeTeam = 'player';
    this.currentLevel = 1;
  }

  init() {
    this.gamePlay.drawUi(this.getThemes().get(this.currentLevel));
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
      if ((this.selected >= 0) && (this.permittedAttacks.has(index))) {
        let currentCh = this.teamUs.characters[Array.from(this.positionUs).indexOf(this.selected)];
        let currentEn = this.teamEnemy.characters[Array.from(this.positionEnemy).indexOf(index)];
        this.gamePlay.deselectCell(this.selected);
        this.attack(currentCh, currentEn, index);
        this.enemyMove();
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
    } else {
      if ((this.selected >= 0) && (this.permittedMoves.has(index))) {
        this.moveCharacter(index, this.selected, 'we')
        this.enemyMove();
      }
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

  redrawPositions() {
    let position = [];
    this.teamUs.characters.forEach((e, i) => position.push(new PositionedCharacter(e, Array.from(this.positionUs)[i])));
    this.teamEnemy.characters.forEach((e, i) => position.push(new PositionedCharacter(e, Array.from(this.positionEnemy)[i])));
    this.gamePlay.redrawPositions(position);
  }

  enemyMove() {
    if (this.positionEnemy.size === 0) {
      return;
    }
    let enemyCh;
    let enemyPos;
    let permittedAttacks
    let targetCh;
    let targetPos;
    let done = false;
    let distance;
    let newPos;
    this.teamEnemy.characters.forEach((en, i) => {
      if (!done) {
      enemyCh = en;
      enemyPos = Array.from(this.positionEnemy)[i];
      permittedAttacks = this.getPermittedAttack(enemyCh.attackRange, enemyPos);
      this.teamUs.characters.forEach((tg, j) => {
        targetPos = Array.from(this.positionUs)[j];
        if (permittedAttacks.has(targetPos) && (!done)) {
          targetCh = tg;
          this.attack(enemyCh, targetCh, targetPos);
          done = true;
        }
      })
      }
    })

    let arrOfPriority = [];
    this.teamEnemy.characters.forEach((en, i) => {
      enemyCh = en;
      enemyPos = Array.from(this.positionEnemy)[i];
      this.teamUs.characters.forEach((tg, j) => {
        targetPos = Array.from(this.positionUs)[j];
        distance = (Math.abs(this.getColumn(enemyPos) - this.getColumn(targetPos)) + Math.abs(this.getRow(enemyPos) - this.getRow(targetPos)))/(enemyCh.moveRange + enemyCh.attackRange + enemyCh.attack);
        arrOfPriority.push({i,j, distance});
      })
    })

    arrOfPriority.sort((a, b) => a.distance - b.distance);
    enemyCh = this.teamEnemy.characters[arrOfPriority[0].i];
    enemyPos = Array.from(this.positionEnemy)[arrOfPriority[0].i];
    targetPos = Array.from(this.positionUs)[arrOfPriority[0].j];
    let rowEn = this.getRow(enemyPos);
    let rowtg = this.getRow(targetPos);
    let maxI;
    if ((rowEn < rowtg) && (!done)) {
      if (rowEn + enemyPos.moveRange < rowtg) {
        maxI =  enemyCh.moveRange;
      } else {maxI = rowtg - rowEn};
      while (maxI >= 0){
        newPos = enemyPos + maxI * this.boardSize;
        let indexCh = Array.from(this.positionUs).concat(Array.from(this.positionEnemy)).indexOf(newPos);
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy'); 
          done = true;
        }
        maxI--;
      }
    } else if ((rowEn > rowtg) && (!done)) {
      if (rowEn + enemyPos.moveRange < rowtg) {
        maxI =  -enemyCh.moveRange;
      } else {maxI = - rowtg + rowEn};
      while (maxI >= 0){
        newPos = enemyPos - maxI * this.boardSize;
        let indexCh = Array.from(this.positionUs).concat(Array.from(this.positionEnemy)).indexOf(newPos);
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy'); 
          done = true;
        }
        maxI--;
      }
    }  
    
    let colEn = this.getColumn(enemyPos);
    let coltg = this.getColumn(targetPos);
    let maxJ;
    if ((colEn < coltg) && (!done)) {
      if (colEn + enemyPos.moveRange < coltg) {
        maxI =  enemyCh.moveRange;
      } else {maxJ = colEn - colEn};
      while (maxJ >= 0){
        newPos = enemyPos + maxJ;
        let indexCh = Array.from(this.positionUs).concat(Array.from(this.positionEnemy)).indexOf(newPos);
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy'); 
          done = true;
        }
        maxJ--;
      }
    } else if ((colEn > coltg) && (!done)) {
      if (colEn + enemyPos.moveRange < coltg) {
        maxJ =  -enemyCh.moveRange;
      } else {maxJ = - coltg + colEn};
      while (maxJ >= 0){
        newPos = enemyPos - maxJ;
        let indexCh = Array.from(this.positionUs).concat(Array.from(this.positionEnemy)).indexOf(newPos);
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy'); 
          done = true;
        }
        maxJ--;
      }
    }



  }

  attack(currentCh, currentEn, index) {
    let damage = Math.max(currentCh.attack - currentEn.defence, currentCh.attack * 0.1);
    this.gamePlay.showDamage(index, damage);
    currentEn.health = Math.max(currentEn.health - damage, 0);
    if (currentEn.health === 0) {
      if (this.positionUs.has(index)) {
        let indexCh = Array.from(this.positionUs).indexOf(index);
        this.teamUs.characters.splice(indexCh, 1);
        this.positionUs.delete(index)
      } else {
        let indexCh = Array.from(this.positionEnemy).indexOf(index);
        this.teamEnemy.characters.splice(indexCh, 1);
        this.positionEnemy.delete(index)       
      }
      this.levelUp();
     }
    this.redrawPositions();
  }

  getRow(index) {
    return Math.floor(index / this.boardSize);
  }

  getColumn(index) {
    return index % this.boardSize;
  }

  moveCharacter(index, oldPos = -1, type) {
    if (type === 'enemy') {
      let positionEnemy = Array.from(this.positionEnemy);
      positionEnemy[positionEnemy.indexOf(oldPos)] = index;
      this.positionEnemy = new Set(positionEnemy);
      this.redrawPositions();
    } else {
      let positionUs = Array.from(this.positionUs);
      positionUs[positionUs.indexOf(this.selected)] = index;
      this.positionUs = new Set(positionUs);
      this.gamePlay.deselectCell(this.selected);
      this.gamePlay.deselectCell(index);
      this.permittedMoves.clear();
      this.permittedAttacks.clear();
      this.redrawPositions();
    }
  }

  levelUp() {
    if (this.positionUs.size === 0) {
      GamePlay.showMessage('Поражение!');
    }
    if ((this.positionEnemy.size === 0)) {
      if (this.currentLevel < 4) {
        this.currentLevel += 1;
        let position = [];
        this.positionUs.clear();
        this.teamUs.characters.forEach((e) => {
          position.push(new PositionedCharacter(e, this.getPosition(1)));
          e.attack = Math.round(Math.max(e.attack, e.attack * (80 + e.health) / 100));
          e.defence = Math.round(Math.max(e.defence, e.defence * (80 + e.health) / 100));
          e.health = Math.min(e.health + 80, 100);
          e.level += 1;
        });      
        this.teamEnemy = generateTeam([Daemon, Undead, Vampire], this.currentLevel, 3);
        this.teamEnemy.characters.forEach((e) => position.push(new PositionedCharacter(e, this.getPosition(2))));
        this.gamePlay.redrawPositions(position);
        
        this.gamePlay.drawUi(this.getThemes().get(this.currentLevel));
      } else {
        GamePlay.showMessage('Победа!');
      }
    }
  }

  getThemes() {
    let map = new Map();
    map.set(1, themes.prairie); 
    map.set(2, themes.desert); 
    map.set(3, themes.arctic); 
    map.set(4, themes.mountain); 
    return map;  
  }
}

