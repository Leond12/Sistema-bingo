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
    const cellSize = 40 * scale;
    const padding = 10 * scale;
    const w = card.cols * cellSize + padding * 2;
    const h = card.rows * cellSize + padding * 2 + 40 * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.font = (18 * scale) + 'px sans-serif';
    
    const headers = ['B', 'I', 'N', 'G', 'O'];
    for (let i = 0; i < headers.length; i++) {
      const hx = padding + i * cellSize;
      ctx.fillStyle = '#0b2540';
      ctx.fillRect(hx + 2, padding - (14 * scale), cellSize - 4, 20 * scale);
      ctx.fillStyle = '#fff';
      ctx.font = (14 * scale) + 'px sans-serif';
      const m = ctx.measureText(headers[i]);
      ctx.fillText(headers[i], hx + (cellSize - m.width) / 2, padding + (6 * scale));
    }
    
    ctx.fillStyle = '#111';
    ctx.font = (14 * scale) + 'px sans-serif';
    ctx.fillText('ID: ' + card.id, padding, (padding + cellSize * card.rows + 26 * scale));
    
    for (let r = 0; r < card.rows; r++) {
      for (let c = 0; c < card.cols; c++) {
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        ctx.fillStyle = '#f3f6fb';
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        
        const val = card.numbers[r][c];
        if (val === 'BINGO') {
          ctx.fillStyle = '#444';
          ctx.font = (12 * scale) + 'px sans-serif';
          const txt = 'bingo';
          const metrics = ctx.measureText(txt);
          const tx = x + 2 + (cellSize - 4 - metrics.width) / 2;
          const ty = y + (cellSize + 12 * scale) / 2 - 6 * scale;
          ctx.fillText(txt, tx, ty);
        } else {
          ctx.fillStyle = '#111';
          ctx.font = (14 * scale) + 'px sans-serif';
          const txt = (val === undefined ? '' : String(val));
          const metrics = ctx.measureText(txt);
          const tx = x + 2 + (cellSize - 4 - metrics.width) / 2;
          const ty = y + (cellSize + 14 * scale) / 2 - 6 * scale;
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