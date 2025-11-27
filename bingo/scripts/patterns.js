// Detección de patrones de ganancia
class PatternDetector {
  static defaultPatterns() {
    return {
      full: { label: 'Full', enabled: true, basePrize: 100, winsCount: 0, incrementPercent: 0, thresholdWins: 1 },
      enX: { label: 'En X', enabled: true, basePrize: 50, winsCount: 0, incrementPercent: 0, thresholdWins: 1 },
      cruz: { label: 'En Cruz', enabled: true, basePrize: 50, winsCount: 0, incrementPercent: 0, thresholdWins: 1 },
      corners: { label: 'Cuatro Esquinas', enabled: true, basePrize: 30, winsCount: 0, incrementPercent: 0, thresholdWins: 1 }
    };
  }

  static checkPatternsForCard(card, markedSet, pkg) {
    const matched = [];
    const patterns = (pkg && pkg.patterns) ? pkg.patterns : this.defaultPatterns();
    const nums = card.numbers || [];

    // Full
    const flat = nums.flat ? nums.flat() : [].concat(...nums);
    const allMarked = flat.every(n => (n === 'BINGO') ? true : markedSet.has(n));
    if (allMarked && patterns.full && patterns.full.enabled) matched.push('full');

    // Esquinas
    if (patterns.corners && patterns.corners.enabled) {
      const r = card.rows || nums.length;
      const c = card.cols || (nums[0] ? nums[0].length : 0);
      
      if (r > 0 && c > 0) {
        const topLeft = nums[0][0];
        const topRight = nums[0][c - 1];
        const bottomLeft = nums[r - 1][0];
        const bottomRight = nums[r - 1][c - 1];
        
        if ([topLeft, topRight, bottomLeft, bottomRight].every(n => 
          (n === 'BINGO') ? true : markedSet.has(n))) {
          matched.push('corners');
        }
      }
    }

    // En X (ambas diagonales)
    if (patterns.enX && patterns.enX.enabled) {
      const r = card.rows || nums.length;
      const c = card.cols || (nums[0] ? nums[0].length : 0);
      
      if (r === c && r > 0) {
        let ok1 = true, ok2 = true;
        
        for (let i = 0; i < r; i++) {
          const a = nums[i][i];
          const b = nums[i][r - 1 - i];
          
          if (!(a === 'BINGO' ? true : markedSet.has(a))) ok1 = false;
          if (!(b === 'BINGO' ? true : markedSet.has(b))) ok2 = false;
        }
        
        if (ok1 && ok2) matched.push('enX');
      }
    }

    // Cruz (fila media + columna media)
    if (patterns.cruz && patterns.cruz.enabled) {
      const r = card.rows || nums.length;
      const c = card.cols || (nums[0] ? nums[0].length : 0);
      
      if (r > 0 && c > 0) {
        const midR = Math.floor(r / 2);
        const midC = Math.floor(c / 2);
        let okRow = true, okCol = true;
        
        for (let j = 0; j < c; j++) {
          if (!(nums[midR][j] === 'BINGO' ? true : markedSet.has(nums[midR][j]))) okRow = false;
        }
        
        for (let i = 0; i < r; i++) {
          if (!(nums[i][midC] === 'BINGO' ? true : markedSet.has(nums[i][midC]))) okCol = false;
        }
        
        if (okRow && okCol) matched.push('cruz');
      }
    }

    return matched.filter((v, i, s) => s.indexOf(v) === i);
  }

  static computePrize(patternObj) {
    if (!patternObj) return 0;
    
    const base = Number(patternObj.basePrize || 0);
    const inc = Number(patternObj.incrementPercent || 0);
    const wins = Number(patternObj.winsCount || 0);
    const thresh = Number(patternObj.thresholdWins || 1);
    
    if (thresh <= 0) return base;
    
    const groups = Math.floor(wins / thresh);
    const extra = (groups * inc) / 100;
    return Math.round(base * (1 + extra));
  }
}