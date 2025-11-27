// Generación de cartillas de bingo
class CardGenerator {
  static makeId(len = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }

  static nowISO() {
    return new Date().toISOString();
  }

  static range(a, b) {
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  static getMaxBall() {
    try {
      const el = document.getElementById('bingoModeCart');
      return Number(el && el.value) || 90;
    } catch (e) {
      return 90;
    }
  }

  static generateBingoCardStandard(packageId, name, mode) {
    const full = StorageManager.loadFull();
    const pkg = full.packages.find(p => p.id === packageId);
    if (!pkg) {
      alert('Paquete no encontrado');
      return null;
    }

    const maxBall = Number(mode) || this.getMaxBall();
    let cols = [];

    if (maxBall === 75) {
      cols = [
        this.range(1, 15),
        this.range(16, 30),
        this.range(31, 45),
        this.range(46, 60),
        this.range(61, 75)
      ];
    } else {
      const perCol = Math.ceil(maxBall / 5);
      for (let c = 0; c < 5; c++) {
        const start = c * perCol + 1;
        const end = Math.min((c + 1) * perCol, maxBall);
        cols.push(this.range(start, end));
      }
    }

    const pick = (arr, n) => {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, n);
    };

    const colNums = [];
    for (let ci = 0; ci < 5; ci++) {
      const sel = pick(cols[ci], Math.min(5, cols[ci].length));
      while (sel.length < 5) sel.push(undefined);
      colNums.push(sel);
    }

    const matrix = [];
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < 5; c++) {
        row.push(colNums[c][r]);
      }
      matrix.push(row);
    }

    if (matrix[2] && typeof matrix[2][2] !== 'undefined') {
      matrix[2][2] = 'BINGO';
    }

    let id;
    do {
      id = this.makeId(8);
    } while (pkg.cartillas.some(x => x.id === id));

    const card = {
      id: id,
      createdAt: this.nowISO(),
      rows: 5,
      cols: 5,
      numbers: matrix,
      markedNumbers: [],
      winner: false,
      name: name ? String(name).trim() : ''
    };

    pkg.cartillas.push(card);
    StorageManager.saveFull(full);
    return card;
  }

  static generateManyCards(n, packageId, baseName, mode) {
    baseName = baseName ? String(baseName).trim() : '';
    const cards = [];

    for (let i = 0; i < n; i++) {
      let name = '';
      if (baseName) {
        name = (n === 1) ? baseName : (i === 0 ? baseName : (baseName + '-' + (i + 1)));
      }
      const card = this.generateBingoCardStandard(packageId, name, mode);
      if (card) cards.push(card);
    }

    return cards;
  }
}