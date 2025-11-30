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
// ui.js - Función corregida para mostrar la vista previa

// Función para mostrar la vista previa de cartilla con el estilo de la tabla principal
function showSearchPreview(card) {
  const previewBox = document.getElementById('searchPreviewBox');
  const searchPreview = document.getElementById('searchPreview');
  
  if (!card) {
    previewBox.innerHTML = '<div class="muted">Resultado: ninguna</div>';
    searchPreview.style.display = 'none';
    return;
  }
  
  // Crear la cuadrícula con el mismo estilo que la tabla principal
  let gridHTML = '<div class="search-preview-grid">';
  
  // Crear encabezados BINGO (mismo estilo rojo que los headers principales)
  const headers = ['B', 'I', 'N', 'G', 'O'];
  headers.forEach(letter => {
    gridHTML += `<div class="search-preview-cell header">${letter}</div>`;
  });
  
  // Crear las celdas con números - CORREGIDO para manejar matriz 5x5
  if (card.numbers && Array.isArray(card.numbers)) {
    // Si es una matriz 5x5 (array de arrays)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        let cellContent = '';
        let cellClass = 'search-preview-cell';
        
        if (row === 2 && col === 2) {
          // Celda central - FREE (mismo estilo dorado que las celdas marcadas)
          cellContent = 'FREE';
          cellClass += ' free';
        } else {
          // Obtener el número de la posición correcta en la matriz
          if (Array.isArray(card.numbers[col])) {
            // Estructura: [[B-col], [I-col], [N-col], [G-col], [O-col]]
            cellContent = card.numbers[col][row] || '';
          } else if (Array.isArray(card.numbers[row])) {
            // Estructura: [[B-row], [I-row], [N-row], [G-row], [O-row]]  
            cellContent = card.numbers[row][col] || '';
          } else {
            // Estructura plana, usar cálculo por filas
            const index = row * 5 + col;
            cellContent = card.numbers[index] || '';
          }
          
          // Verificar si el número está marcado
          if (cellContent && card.markedNumbers && card.markedNumbers.includes(parseInt(cellContent))) {
            cellClass += ' marked';
          }
        }
        
        gridHTML += `<div class="${cellClass}">${cellContent}</div>`;
      }
    }
  }
  
  gridHTML += '</div>';
  
  // Información adicional de la cartilla
  const cardInfo = `
    <div class="card-info">
      <strong>ID:</strong> ${card.id.substring(0, 8)}...<br>
      ${card.name ? `<strong>Nombre:</strong> ${card.name}` : ''}
    </div>
  `;
  
  previewBox.innerHTML = gridHTML + cardInfo;
  searchPreview.style.display = 'block';
}

// Función alternativa más robusta que detecta automáticamente la estructura
function showSearchPreviewRobust(card) {
  const previewBox = document.getElementById('searchPreviewBox');
  const searchPreview = document.getElementById('searchPreview');
  
  if (!card) {
    previewBox.innerHTML = '<div class="muted">Resultado: ninguna</div>';
    searchPreview.style.display = 'none';
    return;
  }
  
  // Debug: ver la estructura de los números
  console.log('Card numbers structure:', card.numbers);
  
  let gridHTML = '<div class="search-preview-grid">';
  
  // Headers BINGO
  const headers = ['B', 'I', 'N', 'G', 'O'];
  headers.forEach(letter => {
    gridHTML += `<div class="search-preview-cell header">${letter}</div>`;
  });
  
  // Determinar la estructura de los números
  let numbersMatrix = [];
  
  if (card.numbers && Array.isArray(card.numbers)) {
    if (card.numbers.length === 5 && card.numbers.every(col => Array.isArray(col) && col.length === 5)) {
      // Estructura: 5 columnas con 5 filas cada una [[B], [I], [N], [G], [O]]
      numbersMatrix = [];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          numbersMatrix.push(card.numbers[col][row]);
        }
      }
    } else if (card.numbers.length === 25) {
      // Estructura plana de 25 elementos
      numbersMatrix = card.numbers;
    } else {
      // Estructura desconocida, intentar aplanar
      numbersMatrix = card.numbers.flat();
    }
  }
  
  // Crear la cuadrícula 5x5
  for (let i = 0; i < 25; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    let cellContent = '';
    let cellClass = 'search-preview-cell';
    
    if (row === 2 && col === 2) {
      // Celda central FREE
      cellContent = 'FREE';
      cellClass += ' free';
    } else if (i < numbersMatrix.length) {
      cellContent = numbersMatrix[i] || '';
      // Verificar si está marcado
      if (cellContent && card.markedNumbers && card.markedNumbers.includes(parseInt(cellContent))) {
        cellClass += ' marked';
      }
    }
    
    gridHTML += `<div class="${cellClass}">${cellContent}</div>`;
  }
  
  gridHTML += '</div>';
  
  const cardInfo = `
    <div class="card-info">
      <strong>ID:</strong> ${card.id.substring(0, 8)}...<br>
      ${card.name ? `<strong>Nombre:</strong> ${card.name}` : ''}
    </div>
  `;
  
  previewBox.innerHTML = gridHTML + cardInfo;
  searchPreview.style.display = 'block';
}

// Configurar funcionalidad de búsqueda - USAR LA VERSIÓN ROBUSTA
UIManager.setupSearchPreviewEvents = function(gameManager) {
  const searchInput = document.getElementById('searchCardInput');
  const toggleButton = document.getElementById('toggleSearchPreview');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchId = this.value.trim();
      if (searchId.length === 0) {
        showSearchPreview(null);
        return;
      }
      
      // Buscar en todos los paquetes
      const full = StorageManager.loadFull();
      let foundCard = null;
      
      for (const pkg of full.packages) {
        foundCard = pkg.cartillas.find(card => 
          card.id.includes(searchId) || 
          (card.name && card.name.toLowerCase().includes(searchId.toLowerCase()))
        );
        if (foundCard) break;
      }
      
      // Usar la versión robusta que detecta automáticamente la estructura
      showSearchPreviewRobust(foundCard);
    });
  }
  
  if (toggleButton) {
    toggleButton.addEventListener('click', function() {
      const previewBox = document.getElementById('searchPreviewBox');
      const isHidden = previewBox.style.display === 'none';
      previewBox.style.display = isHidden ? 'block' : 'none';
      this.textContent = isHidden ? 'Ocultar vista' : 'Mostrar vista';
    });
  }
};