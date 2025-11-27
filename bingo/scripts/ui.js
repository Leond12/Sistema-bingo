// Gestión de la interfaz de usuario
class UIManager {
  static renderCardPreviewInIndex(card, markedNumbers) {
    const searchPreviewBox = document.getElementById('searchPreviewBox');
    if (!searchPreviewBox) return;
    
    if (!card) {
      searchPreviewBox.innerHTML = '<div class="muted">No encontrado</div>';
      return;
    }
    
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '6px';
    
    // Encabezado
    const header = document.createElement('div');
    header.style.display = 'grid';
    header.style.gridTemplateColumns = 'repeat(5,1fr)';
    header.style.gap = '3px';
    header.style.fontWeight = '700';
    
    for (const h of BINGO_LETTERS) {
      const el = document.createElement('div');
      el.style.background = '#0b2540';
      el.style.color = '#fff';
      el.style.padding = '6px';
      el.style.borderRadius = '6px';
      el.textContent = h;
      header.appendChild(el);
    }
    
    container.appendChild(header);
    
    // Cuadrícula de números
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(5,1fr)';
    grid.style.gap = '6px';
    
    const markedSet = new Set(markedNumbers);
    
    // Preferir card.markedNumbers si existe (persistido)
    if (Array.isArray(card.markedNumbers)) {
      card.markedNumbers.forEach(n => markedSet.add(Number(n)));
    }
    
    for (let r = 0; r < card.rows; r++) {
      for (let c = 0; c < card.cols; c++) {
        const val = card.numbers[r][c];
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.style.background = '#f3f6fb';
        cellEl.style.padding = '6px';
        cellEl.style.borderRadius = '6px';
        
        if (val === 'BINGO') {
          cellEl.style.fontSize = '12px';
          cellEl.style.color = '#333';
          cellEl.style.textTransform = 'lowercase';
          cellEl.textContent = 'bingo';
        } else {
          cellEl.textContent = (val === undefined ? '' : String(val));
          
          if (markedSet.has(Number(val))) {
            cellEl.classList.add('marked');
          }
        }
        
        grid.appendChild(cellEl);
      }
    }
    
    container.appendChild(grid);
    searchPreviewBox.innerHTML = '';
    searchPreviewBox.appendChild(container);
  }

  static refreshPackageSelect() {
    const packageSelect = document.getElementById('packageSelectGame');
    if (!packageSelect) return;
    
    const full = StorageManager.loadFull();
    packageSelect.innerHTML = '';
    
    const optEmpty = document.createElement('option');
    optEmpty.value = '';
    optEmpty.textContent = '-- Ninguno --';
    packageSelect.appendChild(optEmpty);
    
    for (const p of full.packages) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = (p.meta && p.meta.name) ? 
        `${p.meta.name} (${p.cartillas.length} cartillas)` : 
        `${p.id} (${p.cartillas ? p.cartillas.length : 0} cartillas)`;
      packageSelect.appendChild(o);
    }
  }

  static setupSearchPreviewEvents(gameManager) {
    const searchCardInput = document.getElementById('searchCardInput');
    const searchPreview = document.getElementById('searchPreview');
    const toggleSearchPreview = document.getElementById('toggleSearchPreview');
    
    if (searchCardInput) {
      searchCardInput.addEventListener('input', () => {
        const q = (searchCardInput.value || '').trim();
        
        if (!q) {
          if (searchPreview) searchPreview.style.display = 'none';
          return;
        }
        
        const full = StorageManager.loadFull();
        let found = null;
        
        for (const p of full.packages) {
          const c = (p.cartillas || []).find(x => x.id === q);
          if (c) {
            found = c;
            break;
          }
        }
        
        if (found) {
          if (searchPreview) searchPreview.style.display = 'block';
          this.renderCardPreviewInIndex(found, gameManager.boardManager.markedNumbers);
        } else {
          if (searchPreview) searchPreview.style.display = 'block';
          const searchPreviewBox = document.getElementById('searchPreviewBox');
          if (searchPreviewBox) {
            searchPreviewBox.innerHTML = '<div class="muted">Cartilla no encontrada</div>';
          }
        }
      });
    }
    
    if (toggleSearchPreview && searchPreview) {
      toggleSearchPreview.addEventListener('click', () => {
        if (searchPreview.style.display === 'none') {
          searchPreview.style.display = 'block';
        } else {
          searchPreview.style.display = 'none';
        }
      });
    }
  }

  static setupKeyboardSupport(boardManager, gameManager) {
    const boardEl = document.getElementById('board');
    
    boardEl.addEventListener('keydown', (e) => {
      const el = document.activeElement;
      
      if (el && el.classList.contains('cell') && (e.key === 'Enter' || e.key === ' ')) {
        const n = parseInt(el.dataset.num, 10);
        
        if (!boardManager.markedNumbers.has(n)) {
          gameManager.handleManualMark(n);
        }
      }
    });
  }

  static updateMetaImage() {
    const metaImage = document.getElementById('metaImage');
    const packageSelect = document.getElementById('packageSelectGame');
    
    if (!metaImage || !packageSelect) return;
    
    const full = StorageManager.loadFull();
    const selPkgId = packageSelect.value;
    const selPkg = full.packages.find(p => p.id === selPkgId);
    
    if (selPkg && selPkg.meta && selPkg.meta.image) {
      metaImage.innerHTML = `<img src="${selPkg.meta.image}" style="max-width:100%;max-height:100%;object-fit:contain">`;
    } else {
      metaImage.innerHTML = '<span class="muted">Imagen del paquete (si existe)</span>';
    }
  }
}