// Lógica principal del juego
class GameManager {
  constructor(boardManager, animationManager) {
    this.boardManager = boardManager;
    this.animationManager = animationManager;
    
    this.activePackageId = null;
    this.cardMarks = {}; // cardId -> Set of numbers marked in that card
    this.cardNotifiedPatterns = {}; // cardId -> Set of patternKeys already notified
    
    this.drawBtn = document.getElementById('drawBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.statusEl = document.getElementById('status');
    this.lastNumberBox = document.getElementById('lastNumberBox');
  }

  setStatus(s) {
    this.statusEl.textContent = 'Estado: ' + s;
  }

  obtainNumber() {
    if (this.animationManager.animating) return;
    
    const full = StorageManager.loadFull();
    
    // Buscar números disponibles, priorizando cartillas ganadoras
    let available = this.getAvailableNumbersFromWinners(full);
    
    if (available.length === 0) {
      available = this.boardManager.getAvailableNumbers();
    }
    
    if (available.length === 0) {
      alert('Todos los números han sido marcados. Reinicie para comenzar de nuevo.');
      return;
    }

    const target = available[Math.floor(Math.random() * available.length)];
    
    this.animationManager.animateToTarget(target, () => {
      this.finalizeNumberDraw(target);
    });
    
    this.drawBtn.disabled = true;
    this.setStatus('animando...');
  }

  getAvailableNumbersFromWinners(full) {
    const anyWinner = this.findWinnerCard(full);
    if (!anyWinner) return [];
    
    const flat = anyWinner.numbers.flat();
    const available = [];
    
    for (const n of flat) {
      if (!this.boardManager.markedNumbers.has(n)) {
        available.push(n);
      }
    }
    
    return available;
  }

  findWinnerCard(full) {
    for (const p of full.packages || []) {
      for (const c of (p.cartillas || [])) {
        if (c.winner) return c;
      }
    }
    return null;
  }

  finalizeNumberDraw(target) {
    this.boardManager.markNumber(target);
    
    // Actualizar marcas por cartilla para el paquete activo
    if (this.activePackageId) {
      this.updateCardMarksForActivePackage(target);
    }
    
    // Persistir último número y actualizar UI
    this.persistLastNumber(target);
    
    // Actualizar vista previa si hay una cartilla en búsqueda
    this.updateSearchPreview();
    
    this.drawBtn.disabled = false;
    this.setStatus('listo — número: ' + target);
  }

  updateCardMarksForActivePackage(target) {
    const fullNow = StorageManager.loadFull();
    const pkg = fullNow.packages.find(x => x.id === this.activePackageId);
    
    if (!pkg) return;
    
    for (const c of (pkg.cartillas || [])) {
      const flat = c.numbers.flat ? c.numbers.flat() : [].concat(...(c.numbers || []));
      
      if (flat.indexOf(target) !== -1) {
        this.cardMarks[c.id] = this.cardMarks[c.id] || new Set();
        this.cardMarks[c.id].add(target);
        
        // Persistir para que cartillas.html vea los cambios
        c.markedNumbers = Array.from(this.cardMarks[c.id]);
        
        // Verificar patrones
        const matched = PatternDetector.checkPatternsForCard(c, this.cardMarks[c.id], pkg);
        if (matched.length) {
          for (const key of matched) {
            this.handleWin(pkg, c, key);
          }
        }
      }
    }
    
    StorageManager.saveFull(fullNow);
  }

  persistLastNumber(target) {
    try {
      const fullAll = StorageManager.loadFull();
      fullAll.lastNumber = target;
      StorageManager.saveFull(fullAll);
      
      if (this.lastNumberBox) {
        this.lastNumberBox.textContent = target;
      }
    } catch (e) {}
  }

  updateSearchPreview() {
    try {
      const searchCardInput = document.getElementById('searchCardInput');
      const searchPreview = document.getElementById('searchPreview');
      
      if (searchCardInput && searchCardInput.value && searchPreview && searchPreview.style.display !== 'none') {
        const q = (searchCardInput.value || '').trim();
        if (q) {
          const fullNow = StorageManager.loadFull();
          let found = null;
          
          for (const p of fullNow.packages || []) {
            const c = (p.cartillas || []).find(x => x.id === q);
            if (c) {
              found = c;
              break;
            }
          }
          
          if (found) {
            UIManager.renderCardPreviewInIndex(found, this.boardManager.markedNumbers);
          }
        }
      }
    } catch (e) {}
  }

  handleWin(pkg, card, patternKey) {
    const full = StorageManager.loadFull();
    const pkgRef = full.packages.find(p => p.id === pkg.id);
    
    if (!pkgRef) return;
    
    const patterns = pkgRef.patterns || PatternDetector.defaultPatterns();
    const pat = patterns[patternKey];
    
    this.cardNotifiedPatterns[card.id] = this.cardNotifiedPatterns[card.id] || new Set();
    
    if (this.cardNotifiedPatterns[card.id].has(patternKey)) return; // Ya notificado
    
    this.cardNotifiedPatterns[card.id].add(patternKey);
    
    // Calcular premio e incrementar victorias
    const prize = PatternDetector.computePrize(pat);
    
    // Registrar en historial
    full.history = full.history || [];
    const entry = {
      ts: new Date().toISOString(),
      packageId: pkgRef.id,
      packageName: (pkgRef.meta && pkgRef.meta.name) || pkgRef.id,
      cartillaId: card.id,
      pattern: patternKey,
      prize
    };
    
    full.history.push(entry);
    
    // Actualizar contador de victorias para el patrón
    if (!pkgRef.patterns) pkgRef.patterns = patterns;
    if (!pkgRef.patterns[patternKey]) {
      pkgRef.patterns[patternKey] = { label: patternKey, basePrize: prize, winsCount: 0 };
    }
    
    pkgRef.patterns[patternKey].winsCount = (pkgRef.patterns[patternKey].winsCount || 0) + 1;
    StorageManager.saveFull(full);
    
    // Persistir último ganador para que la página de gestión lo muestre
    try {
      full.lastWinner = entry;
      StorageManager.saveFull(full);
    } catch (e) {}
  }

  resetBoard() {
    if (!confirm('¿Reiniciar los números marcados?')) return;
    
    this.boardManager.clearMarkedNumbers();
    this.cardMarks = {};
    this.cardNotifiedPatterns = {};
    this.setStatus('reiniciado');
    
    // Limpiar marcas persistentes en el paquete activo y último número
    const full = StorageManager.loadFull();
    
    if (this.activePackageId) {
      const pkg = full.packages.find(p => p.id === this.activePackageId);
      if (pkg) {
        for (const c of (pkg.cartillas || [])) {
          c.markedNumbers = [];
        }
      }
    }
    
    try {
      full.lastNumber = null;
      StorageManager.saveFull(full);
    } catch (e) {}
    
    if (this.lastNumberBox) {
      this.lastNumberBox.textContent = '';
    }
    
    // Actualizar vista previa (limpiar marcas) si hay una cartilla en búsqueda
    this.updateSearchPreviewAfterReset();
  }

  updateSearchPreviewAfterReset() {
    try {
      const searchCardInput = document.getElementById('searchCardInput');
      
      if (searchCardInput && searchCardInput.value) {
        const q = (searchCardInput.value || '').trim();
        const fullNow = StorageManager.loadFull();
        let found = null;
        
        for (const p of fullNow.packages || []) {
          const c = (p.cartillas || []).find(x => x.id === q);
          if (c) {
            found = c;
            break;
          }
        }
        
        const searchPreview = document.getElementById('searchPreview');
        
        if (found) {
          UIManager.renderCardPreviewInIndex(found, this.boardManager.markedNumbers);
        } else {
          if (searchPreview) searchPreview.style.display = 'none';
        }
      }
    } catch (e) {}
  }

  handleManualMark(number) {
    if (confirm('Marcar manualmente el número ' + number + '?')) {
      this.boardManager.markNumber(number);
      
      // Actualizar marcas del paquete activo
      if (this.activePackageId) {
        const full = StorageManager.loadFull();
        const pkg = full.packages.find(x => x.id === this.activePackageId);
        
        if (pkg) {
          for (const c of (pkg.cartillas || [])) {
            const flat = c.numbers.flat ? c.numbers.flat() : [].concat(...(c.numbers || []));
            
            if (flat.indexOf(number) !== -1) {
              this.cardMarks[c.id] = this.cardMarks[c.id] || new Set();
              this.cardMarks[c.id].add(number);
              c.markedNumbers = Array.from(this.cardMarks[c.id]);
              
              const matched = PatternDetector.checkPatternsForCard(c, this.cardMarks[c.id], pkg);
              if (matched.length) {
                for (const k of matched) {
                  this.handleWin(pkg, c, k);
                }
              }
            }
          }
          
          StorageManager.saveFull(full);
        }
      }
      
      this.setStatus('marcado manual: ' + number);
    }
  }
}