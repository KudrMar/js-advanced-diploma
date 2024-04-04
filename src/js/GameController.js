import { generateTeam } from './generators';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import PositionedCharacter from './PositionedCharacter';
import GamePlay from './GamePlay';
import cursors from "./cursors";
import GameState from './GameState';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.positionUs = new Set();
    this.positionEnemy = new Set();
    this.permittedMoves = new Set();
    this.permittedAttacks = new Set();
    this.selected = -1;
    this.selectedExpected = -1;
    this.boardSize = gamePlay.boardSize;
    this.currentCharacter = {};
    this.blockedBoard = false;
    this.hits = 0;
    this.gameState = new GameState;
    this.gameState.maxScore = 0;
  }

  init() {

    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.newGame();
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.newGame.bind(this));
    this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
    this.gamePlay.addLoadGameListener(this.loadGame.bind(this));

  }

  onCellClick(index) {
    // TODO: react to click
    if (this.blockedBoard) return;
    if (this.getPos(this.enemyTeam, index) >= 0) {
      if ((this.selected >= 0) && (this.permittedAttacks.has(index))) {
        let currentCh = this.ourTeam[this.getPos(this.ourTeam, this.selected)].character;
        let currentEn = this.enemyTeam[this.getPos(this.enemyTeam, index)].character;
        this.attack(currentCh, currentEn, index)
          .then(() => {
            this.enemyMove();
          });
      } else if (this.selected >= 0) {
        GamePlay.showError('Враг вне досягаемости');
      } else {
        GamePlay.showError('Нельзя выбрать фигуру врага');
      }
    } else if (this.getPos(this.ourTeam, index) >= 0) {
      if (this.selected >= 0) {
        this.gamePlay.deselectCell(this.selected);
        this.permittedMoves.clear();
        this.permittedAttacks.clear();
      }
      this.selected = index;
      this.gamePlay.selectCell(index);
      let indexCh = this.getPos(this.ourTeam, index);
      this.currentCharacter = this.ourTeam[indexCh].character;
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
    let indexCh = this.getPos(this.ourTeam.concat(this.enemyTeam), index);
    if (indexCh != -1) {
      let currentCh = this.ourTeam.concat(this.enemyTeam)[indexCh].character;
      this.gamePlay.showCellTooltip(this.showCellTooltipText(currentCh), index);
      if (this.getPos(this.ourTeam, index) >= 0) {
        this.gamePlay.setCursor(cursors.pointer);
      } else if (this.getPos(this.enemyTeam, index) >= 0) {
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
      while (this.positionUs.size === startLength) {
        pos = Math.floor(Math.random() * this.boardSize * 2);
        pos = Math.floor(pos / 2) * this.boardSize + (pos % 2);
        this.positionUs.add(pos);
      }
    } else {
      startLength = this.positionEnemy.size;
      while (this.positionEnemy.size === startLength) {
        pos = Math.floor(Math.random() * this.boardSize * 2);
        pos = (Math.floor(pos / 2) + 1) * this.boardSize - 1 - (pos % 2);
        this.positionEnemy.add(pos);
      }
    }
    return pos;
  }

  showCellTooltipText(currentCh) {
    return '\u{1F396}' + currentCh.level + '\u{2694}' + currentCh.attack + '\u{1F6E1}' + currentCh.defence + '\u{2764}' + currentCh.health;
  }


  getPermittedArea(range, index) {
    const area = new Set();
    let newPos;

    for (let i = 1; i <= range; i += 1) {
      for (let j = -1; j <= 1; j += 2) {
        newPos = index - this.boardSize * i * j; // вниз/вверх
        if (this.newPosCorrect(newPos, index, index - this.boardSize * i * j)) {
          area.add(newPos);
        }

        newPos = index + i * j; // лево/право
        if (this.newPosCorrect(newPos, index, index + i * j)) {
          area.add(newPos);
        }

        newPos = index - this.boardSize * i + i * j; // левая верхняя/правая верхняя
        if (this.newPosCorrect(newPos, index, index - this.boardSize * i)) {
          area.add(newPos);
        }

        newPos = index + this.boardSize * i + i * j; // левая нижняя/правая нижняя
        if (this.newPosCorrect(newPos, index, index + this.boardSize * i)) {
          area.add(newPos);
        }
      }
    }

    return area;
  }


  newPosCorrect(newPos, index, row) {
    if ((newPos >= 0) && (newPos < this.boardSize * this.boardSize) && (newPos != index)
      && (newPos >= this.boardSize * Math.floor(row / this.boardSize))
      && (newPos < this.boardSize * (Math.floor(row / this.boardSize) + 1))) {
      return true;
    }
    return false;
  }

  getPermittedAttack(range, index) {
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

  enemyMove() {
    if ((this.enemyTeam.length === 0) || (this.ourTeam.length === 0)) {
      return;
    }
    let enemyCh;
    let enemyPos;
    let permittedAttacks
    let targetPos;
    let done = false;
    let distance;
    let newPos;
    this.enemyTeam.forEach((en) => {
      if (!done) {
        permittedAttacks = this.getPermittedAttack(en.character.attackRange, en.position);
        this.ourTeam.forEach((tg) => {
          if (permittedAttacks.has(tg.position) && (!done)) {
            this.attack(en.character, tg.character, tg.position, en.position);
            done = true;
          }
        })
      }
    })

    if (done) return;

    let arrOfPriority = [];
    this.enemyTeam.forEach((en) => {
      enemyCh = en.character;
      this.ourTeam.forEach((tg) => {
        distance = (Math.abs(this.getColumn(en.position) - this.getColumn(tg.position)) + Math.abs(this.getRow(en.position) - this.getRow(tg.position))) / (enemyCh.moveRange + enemyCh.attackRange + enemyCh.attack);
        arrOfPriority.push({ en, tg, distance });
      })
    })

    arrOfPriority.sort((a, b) => a.distance - b.distance);

    enemyCh = arrOfPriority[0].en.character;
    enemyPos = arrOfPriority[0].en.position;
    targetPos = arrOfPriority[0].tg.position;
    let rowEn = this.getRow(enemyPos);
    let rowtg = this.getRow(targetPos);
    let maxI;
    if ((rowEn < rowtg) && (!done)) {
      if (rowEn + enemyCh.moveRange < rowtg) {
        maxI = enemyCh.moveRange;
      } else maxI = rowtg - rowEn;
      while (maxI >= 0) {
        newPos = enemyPos + maxI * this.boardSize;
        let indexCh = this.getPos(this.ourTeam.concat(this.enemyTeam), (newPos));
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy');
          done = true;
        }
        maxI--;
      }
    } else if ((rowEn > rowtg) && (!done)) {
      if (rowEn - enemyCh.moveRange > rowtg) {
        maxI = enemyCh.moveRange;
      } else maxI = - rowtg + rowEn;
      while (maxI >= 0) {
        newPos = enemyPos - maxI * this.boardSize;
        let indexCh = this.getPos(this.ourTeam.concat(this.enemyTeam), (newPos));
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
      if (colEn + enemyCh.moveRange < coltg) {
        maxI = enemyCh.moveRange;
      } else maxJ = colEn - colEn;
      while (maxJ >= 0) {
        newPos = enemyPos + maxJ;
        let indexCh = this.getPos(this.ourTeam.concat(this.enemyTeam), (newPos));
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy');
          done = true;
        }
        maxJ--;
      }
    } else if ((colEn > coltg) && (!done)) {
      if (colEn - enemyCh.moveRange > coltg) {
        maxJ = enemyCh.moveRange;
      } else maxJ = - coltg + colEn;
      while (maxJ >= 0) {
        newPos = enemyPos - maxJ;
        let indexCh = this.getPos(this.ourTeam.concat(this.enemyTeam), (newPos));
        if ((indexCh === -1) && (!done)) {
          this.moveCharacter(newPos, enemyPos, 'enemy');
          return;
        }
        maxJ--;
      }
    }
  }

  attack(currentCh, currentEn, index, attackerIndex = -1) {
    return new Promise((resolve) => {
    let damage = Math.max(currentCh.attack - currentEn.defence, currentCh.attack * 0.1);
    if (this.getPos(this.enemyTeam, index) >= 0) {
      this.hits += damage;
    }
    else if (this.getPos(this.ourTeam, index) >= 0) {
      this.gamePlay.selectCell(attackerIndex, 'red');
    }
    this.gamePlay.showDamage(index, damage).then(() => {
      currentEn.health = Math.max(currentEn.health - damage, 0);
      if (currentEn.health === 0) {
        if (this.getPos(this.ourTeam, index) >= 0) {
          let indexCh = this.getPos(this.ourTeam, index);
          this.ourTeam.splice(indexCh, 1);
          if (this.selected === index) {
            this.gamePlay.deselectCell(index);
            this.selected = -1;
            this.permittedMoves.clear();
            this.permittedAttacks.clear();
            if (this.selectedExpected != -1) {
              this.gamePlay.deselectCell(this.selectedExpected);
              this.selectedExpected = -1;
            }
          }
        } else {
          let indexCh = this.getPos(this.enemyTeam, index);
          this.enemyTeam.splice(indexCh, 1);
        }
        this.levelUp();
      }
      if (attackerIndex != -1) {
        this.gamePlay.deselectCell(attackerIndex);
      }
      this.gamePlay.redrawPositions([...this.ourTeam, ...this.enemyTeam]);
      resolve();
    });
  });
  }

  getRow(index) {
    return Math.floor(index / this.boardSize);
  }

  getColumn(index) {
    return index % this.boardSize;
  }

  moveCharacter(index, oldPos = -1, type) {
    if (type === 'enemy') {
      new Promise((resolve) => {
        this.blockedBoard = true;
        setTimeout(() => {
          this.gamePlay.selectCell(oldPos, "red");
          setTimeout(() => {
            this.gamePlay.selectCell(index, "red");
            setTimeout(() => {
              this.enemyTeam[this.getPos(this.enemyTeam, oldPos)].position = index;
              this.gamePlay.redrawPositions([...this.ourTeam, ...this.enemyTeam]);
              resolve();
            }, 300);
          }, 300);
        }, 300);
      }).then(() => {
        this.gamePlay.deselectCell(oldPos);
        this.gamePlay.deselectCell(index);
        this.blockedBoard = false;
      });
    } else {
      this.ourTeam[this.getPos(this.ourTeam, this.selected)].position = index;
      this.gamePlay.deselectCell(this.selected);
      this.selected = index;
      this.gamePlay.selectCell(this.selected);
      this.permittedMoves = this.getPermittedArea(this.ourTeam[this.getPos(this.ourTeam, this.selected)].character.moveRange, index);
      this.permittedAttacks = this.getPermittedAttack(this.ourTeam[this.getPos(this.ourTeam, this.selected)].character.attackRange, index);
      this.selectedExpected = -1;
      this.gamePlay.redrawPositions([...this.ourTeam, ...this.enemyTeam]);
    }
  }

  levelUp() {
    if (this.ourTeam.length === 0) {
      GamePlay.showMessage('Поражение! Количество очков ' + this.hits);
      this.blockedBoard = true;
    }
    if ((this.enemyTeam.length === 0)) {
      if (this.currentLevel < 4) {
        this.currentLevel += 1;
        this.positionEnemy.clear();
        this.positionUs.clear();
        this.ourTeam.forEach((e) => {
          e.character.attack = Math.round(Math.max(e.character.attack, e.character.attack * (80 + e.character.health) / 100));
          e.character.defence = Math.round(Math.max(e.character.defence, e.character.defence * (80 + e.character.health) / 100));
          e.character.health = Math.min(e.character.health + 80, 100);
          e.character.level += 1;
        });
        let enemyTeam = generateTeam([Daemon, Undead, Vampire], this.currentLevel, 3);
        enemyTeam.characters.forEach((e) => this.enemyTeam.push(new PositionedCharacter(e, this.getPosition(2))));
        this.gamePlay.redrawPositions([...this.ourTeam, ...this.enemyTeam]);
        this.gamePlay.drawUi(this.geThemes(this.currentLevel));
      } else {
        GamePlay.showMessage('Победа! Количество очков ' + this.hits);
        this.blockedBoard = true;
      }
    }
  }

  geThemes(level) {
    switch (level) {
      case 2: return 'desert';
      case 3: return 'arctic';
      case 4: return 'mountain';
      default: return 'prairie';
    }
  }

  getPos(arr, index) {
    return arr.findIndex((e) => e.position === index);
  }

  newGame() {
    this.gameState.maxScore = Math.max(this.gameState.maxScore, this.hits);
    this.currentLevel = 1;
    this.gamePlay.drawUi(this.geThemes(this.currentLevel));
    const ourTeam = generateTeam([Bowman, Swordsman, Magician], 1, 1);
    this.ourTeam = [];
    ourTeam.characters.forEach((e) => this.ourTeam.push(new PositionedCharacter(e, this.getPosition(1))));
    const enemyTeam = generateTeam([Daemon, Undead, Vampire], 1, 1);
    this.enemyTeam = [];
    enemyTeam.characters.forEach((e) => this.enemyTeam.push(new PositionedCharacter(e, this.getPosition(2))));
    this.gamePlay.redrawPositions([...this.ourTeam, ...this.enemyTeam]);
    this.blockedBoard = false;
    this.hits = 0;
    if (this.gameState.maxScore != 0) {
      GamePlay.showMessage('Максимальное количество очков ' + this.gameState.maxScore);
    }
  }

  saveGame() {
    const currentGameState = {
      hits: this.hits,
      maxScore: this.gameState.maxScore,
      level: this.currentLevel,
      ourTeam: this.ourTeam,
      enemyTeam: this.enemyTeam
    };
    this.stateService.save(currentGameState);
    GamePlay.showMessage('Игра сохранена!');
  }

  loadGame() {
    try {
      const loadGameState = this.stateService.load();
      if (loadGameState) {
        this.hits = loadGameState.hits;
        this.currentLevel = loadGameState.level;
        this.ourTeam = loadGameState.ourTeam;
        this.enemyTeam = loadGameState.enemyTeam;
        this.gameState.maxScore = loadGameState.maxScore;
        this.gamePlay.drawUi(this.geThemes(this.currentLevel));
        this.gamePlay.redrawPositions([...this.ourTeam, ...this.enemyTeam]);
        this.blockedBoard = false;
        GamePlay.showMessage('Игра загружена!');
      }
    } catch (err) {
      GamePlay.showError(err);
      this.newGame();
    }
  }
}

