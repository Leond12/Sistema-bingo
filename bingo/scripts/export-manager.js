// Gestión de exportación e importación
class ExportManager {
  static exportJson() {
    const data = StorageManager.loadFull();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bingo_cartillas_export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  static importJson() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json';
    
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      
      const r = new FileReader();
      r.onload = () => {
        try {
          const parsed = JSON.parse(r.result);
          if (!parsed.packages || !Array.isArray(parsed.packages)) {
            throw new Error('Formato inválido: se esperaba paquetes');
          }
          
          const full = StorageManager.loadFull();
          parsed.packages.forEach(pkg => {
            let id = pkg.id || (new Date().toISOString().replace(/:/g, '-').slice(0, 19));
            while (full.packages.some(p => p.id === id)) {
              id = CardGenerator.makeId(8);
            }
            pkg.id = id;
            pkg.patterns = pkg.patterns || PatternsManager.defaultPatterns();
            full.packages.push(pkg);
          });
          
          StorageManager.saveFull(full);
          CardRenderer.renderTicketList();
          alert('Importado');
        } catch (e) {
          alert('Error importando: ' + e.message);
        }
      };
      r.readAsText(f);
    };
    inp.click();
  }

  static cardToDataURL(card, scale = 3) {
    const cellSize = 30 * scale;
    const padding = 8 * scale;
    const topMargin = 10 * scale;
    const bottomMargin = 30 * scale;
    const w = card.cols * cellSize + padding * 2;
    const h = card.rows * cellSize + padding * 2 + topMargin + bottomMargin;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    
    // CELDA VACÍA ARRIBA DE TODO CON ID EN COSTADO IZQUIERDO
    const emptyCellY = padding;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding + 2, emptyCellY + 2, w - padding * 2 - 4, 18 * scale - 4);
    ctx.strokeStyle = '#ddd';
    ctx.strokeRect(padding + 2, emptyCellY + 2, w - padding * 2 - 4, 18 * scale - 4);
    
    // ID ARRIBA EN COSTADO IZQUIERDO (pequeño)
    ctx.fillStyle = '#666';
    ctx.font = (7 * scale) + 'px sans-serif';
    const idText = 'ID: ' + card.id;
    const idX = padding + 4 * scale;
    const idY = emptyCellY + (18 * scale) / 2 + (2 * scale);
    ctx.fillText(idText, idX, idY);
    
    // HEADERS B-I-N-G-O CENTRADOS
    const headers = ['B', 'I', 'N', 'G', 'O'];
    const headerY = emptyCellY + 18 * scale + (10 * scale);
    
    for (let i = 0; i < headers.length; i++) {
        const hx = padding + i * cellSize;
        
        ctx.fillStyle = '#e0a800';
        ctx.fillRect(hx + 6, headerY, cellSize - 8, 20 * scale);
        ctx.fillStyle = '#fff';
        ctx.font = (12 * scale) + 'px sans-serif';
        const m = ctx.measureText(headers[i]);
        const tx = hx + (cellSize - m.width) / 2;
        const ty = headerY + (20 * scale) / 2 + (2 * scale);
        ctx.fillText(headers[i], tx, ty);
    }
    
    // CELDAS DE NÚMEROS - BORDES NEGROS Y NÚMEROS MÁS GRUESOS/OSCUROS
    const gridStartY = headerY + 16 * scale + (2 * scale);
    
    for (let r = 0; r < card.rows; r++) {
        for (let c = 0; c < card.cols; c++) {
            const x = padding + c * cellSize;
            const y = gridStartY + r * cellSize;
            
            ctx.fillStyle = '#f3f6fb';
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            // BORDES NEGROS - CAMBIO AQUÍ
            ctx.strokeStyle = '#000000'; // Negro puro
            ctx.lineWidth = 1.5 * scale; // Borde más grueso
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            const val = card.numbers[r][c];
            if (val === 'BINGO') {
                // CELDA CENTRAL CON "BINGO" - MÁS GRUESO Y OSCURO
                ctx.fillStyle = '#000000'; // Negro puro
                ctx.font = 'bold ' + (9 * scale) + 'px sans-serif'; // Texto en negrita
                const txt = 'BINGO';
                const metrics = ctx.measureText(txt);
                const tx = x + 1 + (cellSize - 2 - metrics.width) / 2;
                const ty = y + (cellSize + 9 * scale) / 2;
                ctx.fillText(txt, tx, ty);
            } else {
                // NÚMEROS - MÁS GRUESOS Y OSCUROS - CAMBIO AQUÍ
                ctx.fillStyle = '#000000'; // Negro puro en lugar de #111
                ctx.font = 'bold ' + (10 * scale) + 'px sans-serif'; // Texto en negrita y más grande
                const txt = (val === undefined ? '' : String(val));
                const metrics = ctx.measureText(txt);
                const tx = x + 1 + (cellSize - 2 - metrics.width) / 2;
                const ty = y + (cellSize + 10 * scale) / 2;
                ctx.fillText(txt, tx, ty);
            }
        }
    }
    
    return canvas.toDataURL('image/png');
  }

  static downloadCardImage(card) {
    const url = this.cardToDataURL(card);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cartilla_${card.id}.png`;
    a.click();
  }

  static downloadAllStacked() {
    const full = StorageManager.loadFull();
    const all = (full.packages || []).reduce((acc, p) => acc.concat(p.cartillas || []), []);
    
    if (all.length === 0) {
      alert('No hay cartillas');
      return;
    }
    
    const dataURLs = [];
    let loaded = 0;
    
    all.forEach((c, idx) => {
      const d = this.cardToDataURL(c, 2);
      dataURLs[idx] = d;
      loaded++;
      
      if (loaded === all.length) {
        const images = [];
        let count = 0;
        
        dataURLs.forEach(d => {
          const im = new Image();
          im.onload = () => {
            images.push(im);
            count++;
            
            if (count === dataURLs.length) {
              const width = Math.max(...images.map(i => i.width));
              const height = images.reduce((s, i) => s + i.height, 0);
              
              const cv = document.createElement('canvas');
              cv.width = width;
              cv.height = height;
              const ctx = cv.getContext('2d');
              
              ctx.fillStyle = '#fff';
              ctx.fillRect(0, 0, width, height);
              
              let y = 0;
              images.forEach(im => {
                ctx.drawImage(im, 0, y);
                y += im.height;
              });
              
              const a = document.createElement('a');
              a.href = cv.toDataURL('image/png');
              a.download = 'cartillas_combinadas.png';
              a.click();
            }
          };
          im.src = d;
        });
      }
    });
  }
}