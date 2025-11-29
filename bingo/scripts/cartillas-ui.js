// Gestión de la interfaz de usuario de cartillas
class CartillasUI {
  static refreshPackageSelect() {
    const sel = document.getElementById('packageSelect');
    const full = StorageManager.loadFull();
    
    sel.innerHTML = '';
    full.packages.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.id + ' (' + new Date(p.createdAt).toLocaleString() + ')';
      sel.appendChild(opt);
    });
  }

  static updateWinnerList() {
    const full = StorageManager.loadFull();
    const listEl = document.getElementById('winnerList');
    
    if (!listEl) return;
    
    const last = full.lastWinner || (full.history && full.history.length ? full.history[full.history.length - 1] : null);
    
    if (!last) {
      listEl.innerHTML = 'No hay ganadores recientes';
      return;
    }
    
    listEl.innerHTML = `<div><strong>${last.packageName || last.packageId}</strong> — Cartilla <strong>${last.cartillaId}</strong><div class="muted">${new Date(last.ts).toLocaleString()} — Patrón: ${last.pattern}</div></div>`;
  }

  static setupEventListeners() {
    document.getElementById('newPackage').addEventListener('click', () => {
      const name = prompt('Nombre del paquete (opcional, dejar vacío para usar timestamp)') || '';
      const full = StorageManager.loadFull();
      const id = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      const pkg = {
        id: id,
        createdAt: CardGenerator.nowISO(),
        cartillas: [],
        patterns: PatternsManager.defaultPatterns(),
        meta: {}
      };
      
      if (name.trim()) pkg.meta.name = name.trim();
      
      full.packages.push(pkg);
      StorageManager.saveFull(full);
      
      const mode = document.getElementById('bingoModeCart') ? document.getElementById('bingoModeCart').value : CardGenerator.getMaxBall();
      const card = CardGenerator.generateBingoCardStandard(pkg.id, '', mode);
      
      this.refreshPackageSelect();
      
      const sel = document.getElementById('packageSelect');
      sel.value = pkg.id;
      CardRenderer.renderTicketList();
      PatternsManager.renderPatternsPanel();
      CardRenderer.showPreview(card.id);
      
      alert('Paquete creado: ' + (pkg.meta && pkg.meta.name ? pkg.meta.name + ' (' + pkg.id + ')' : pkg.id));
    });

    document.getElementById('deletePackage').addEventListener('click', () => {
      const pkgId = document.getElementById('packageSelect').value;
      if (!pkgId) return alert('Selecciona paquete');
      CartillasManager.deletePackage(pkgId);
    });

    document.getElementById('genOne').addEventListener('click', () => {
      const pkgId = document.getElementById('packageSelect').value;
      const name = document.getElementById('cardName').value || '';
      const mode = document.getElementById('bingoModeCart').value;
      if (!pkgId) return alert('Selecciona paquete');
      const newCard = CardGenerator.generateBingoCardStandard(pkgId, name, mode);
      // Re-render list and preview
      CardRenderer.renderTicketList();
      if (newCard) CardRenderer.showPreview(newCard.id);
    });

    document.getElementById('genMany').addEventListener('click', () => {
      const n = parseInt(document.getElementById('manyCount').value) || 1;
      const pkgId = document.getElementById('packageSelect').value;
      const name = document.getElementById('cardName').value || '';
      const mode = document.getElementById('bingoModeCart').value;
      if (!pkgId) return alert('Selecciona paquete');
      const cards = CardGenerator.generateManyCards(n, pkgId, name, mode);
      // Re-render list and preview last generated card
      CardRenderer.renderTicketList();
      if (cards && cards.length) CardRenderer.showPreview(cards[cards.length - 1].id);
    });

    document.getElementById('exportJson').addEventListener('click', ExportManager.exportJson);
    document.getElementById('importJson').addEventListener('click', ExportManager.importJson);

    document.getElementById('downloadSelected').addEventListener('click', () => {
      const sel = document.querySelector('.ticket-item.selected');
      if (!sel) return alert('Selecciona una cartilla');
      const id = sel.dataset.id;
      const full = StorageManager.loadFull();
      let found = null;
      
      for (const p of full.packages) {
        const f = p.cartillas.find(x => x.id === id);
        if (f) {
          found = f;
          break;
        }
      }
      
      if (found) ExportManager.downloadCardImage(found);
    });

    document.getElementById('downloadAll').addEventListener('click', ExportManager.downloadAllStacked);

    document.getElementById('resetMarks').addEventListener('click', () => {
      const pkgId = document.getElementById('packageSelect').value;
      if (!pkgId) return alert('Selecciona paquete');
      if (!confirm('Desmarcar todas las casillas marcadas del paquete seleccionado?')) return;
      
      const full = StorageManager.loadFull();
      const pkg = full.packages.find(p => p.id === pkgId);
      if (!pkg) return;
      
      for (const c of pkg.cartillas || []) {
        c.markedNumbers = [];
      }
      
      StorageManager.saveFull(full);
      CardRenderer.renderTicketList();
      PatternsManager.renderPatternsPanel();
      alert('Marcados reiniciados para paquete ' + pkgId);
    });

    const ticketListEl = document.getElementById('ticketList');
    ticketListEl.addEventListener('click', (e) => {
      const it = e.target.closest('.ticket-item');
      if (!it) return;
      
      Array.from(ticketListEl.querySelectorAll('.ticket-item')).forEach(x => x.classList.remove('selected'));
      it.classList.add('selected');
      CardRenderer.showPreview(it.dataset.id);
    });

    const searchInput = document.getElementById('cardSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => CardRenderer.renderTicketList());
    }

    const packageSelect = document.getElementById('packageSelect');
    if (packageSelect) {
      packageSelect.addEventListener('change', () => {
        CardRenderer.renderTicketList();
        PatternsManager.renderPatternsPanel();
      });
    }
  }

  static setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          CardRenderer.renderTicketList();
          PatternsManager.renderPatternsPanel();
          this.updateWinnerList();
          
          const sel = document.querySelector('.ticket-item.selected');
          if (sel) CardRenderer.showPreview(sel.dataset.id);
        } catch (err) {
          console.warn('storage handling error', err);
        }
      }
    });
  }
}