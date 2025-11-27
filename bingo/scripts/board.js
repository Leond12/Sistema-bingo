// Gestión del tablero de bingo
class BoardManager {
  constructor() {
    this.cells = [];
    this.markedNumbers = new Set();
    this.boardEl = document.getElementById('board');
  }

  getBoardSize() {
    try {
      const el = document.getElementById('bingoMode');
      const v = Number(el && el.value) || DEFAULT_BOARD_SIZE;
      return v;
    } catch (e) {
      return DEFAULT_BOARD_SIZE;
    }
  }

  getColumnsForMode(mode) {
    const m = Number(mode) || DEFAULT_BOARD_SIZE;
    
    if (m === 75) {
      return [
        this.range(1, 15),
        this.range(16, 30),
        this.range(31, 45),
        this.range(46, 60),
        this.range(61, 75)
      ];
    }
    
    // Para 90 bolas, distribuir equitativamente en 5 columnas
    const perCol = Math.ceil(90 / 5);
    const cols = [];
    for (let c = 0; c < 5; c++) {
      const start = c * perCol + 1;
      const end = Math.min((c + 1) * perCol, 90);
      cols.push(this.range(start, end));
    }
    return cols;
  }

  range(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  buildBoard() {
    const size = this.getBoardSize();
    const mode = size;
    
    this.boardEl.innerHTML = '';
    this.cells = [];

    // Encabezados B I N G O
    for (const letter of BINGO_LETTERS) {
      const h = document.createElement('div');
      h.className = 'header';
      h.textContent = letter;
      this.boardEl.appendChild(h);
    }

    const cols = this.getColumnsForMode(mode);
    const maxRows = Math.max(...cols.map(c => c.length));

    // Construir en orden de columnas
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < 5; col++) {
        const colArr = cols[col];
        const num = colArr[row];
        const d = document.createElement('div');
        d.className = 'cell';
        
        if (num !== undefined) {
          d.tabIndex = 0;
          d.dataset.num = num;
          d.textContent = num;
          this.cells[num] = d;
        } else {
          d.textContent = '';
          d.setAttribute('aria-hidden', 'true');
        }
        
        this.boardEl.appendChild(d);
      }
    }

    const title = document.getElementById('boardTitle');
    title.textContent = `Tablero BINGO (${size} bolas)`;
    this.boardEl.setAttribute('aria-label', `Tablero BINGO de ${size} números`);
  }

  updateMarkedVisuals() {
    const size = this.getBoardSize();
    for (let i = 1; i <= size; i++) {
      const el = this.cells[i];
      if (!el) continue;
      
      if (this.markedNumbers.has(i)) {
        el.classList.add('marked');
        el.setAttribute('data-marked', 'true');
      } else {
        el.classList.remove('marked');
        el.removeAttribute('data-marked');
      }
    }
  }

  markNumber(number) {
    this.markedNumbers.add(number);
    this.updateMarkedVisuals();
  }

  clearMarkedNumbers() {
    this.markedNumbers.clear();
    this.updateMarkedVisuals();
  }

  getAvailableNumbers() {
    const size = this.getBoardSize();
    const available = [];
    
    for (let i = 1; i <= size; i++) {
      if (!this.markedNumbers.has(i)) {
        available.push(i);
      }
    }
    
    return available;
  }
}