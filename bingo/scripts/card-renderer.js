// Renderizado de cartillas en la UI
class CardRenderer {
  static escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static renderTicketList() {
    const ticketListEl = document.getElementById('ticketList');
    const storage = StorageManager.loadFull();
    const selPkgId = document.getElementById('packageSelect').value;
    const pkg = storage.packages.find(p => p.id === selPkgId);

    ticketListEl.innerHTML = '';

    if (!pkg) {
      ticketListEl.innerHTML = '<div class="muted">Selecciona o crea un paquete.</div>';
      return;
    }

    if (!pkg.cartillas || pkg.cartillas.length === 0) {
      ticketListEl.innerHTML = '<div class="muted">No hay cartillas en este paquete.</div>';
      return;
    }

    const qEl = document.getElementById('cardSearch');
    const q = (qEl && qEl.value) ? qEl.value.trim().toLowerCase() : '';

    pkg.cartillas.forEach(c => {
      if (q) {
        const idm = String(c.id || '').toLowerCase();
        const nam = String(c.name || '').toLowerCase();
        if (idm.indexOf(q) === -1 && nam.indexOf(q) === -1) return;
      }

      const it = document.createElement('div');
      it.className = 'ticket-item';
      if (c.winner) it.classList.add('winner');
      it.dataset.id = c.id;

      const mini = document.createElement('div');
      mini.className = 'mini';

      const headerLetters = ['B', 'I', 'N', 'G', 'O'];
      const miniHeader = document.createElement('div');
      miniHeader.style.display = 'grid';
      miniHeader.style.gridTemplateColumns = 'repeat(5,18px)';
      miniHeader.style.gap = '3px';
      miniHeader.style.marginBottom = '4px';

      headerLetters.forEach(l => {
        const h = document.createElement('div');
        h.style.fontSize = '10px';
        h.style.textAlign = 'center';
        h.textContent = l;
        miniHeader.appendChild(h);
      });

      it.appendChild(miniHeader);

      for (let r = 0; r < c.rows; r++) {
        for (let co = 0; co < c.cols; co++) {
          const mc = document.createElement('div');
          mc.className = 'mini-cell';
          const val = c.numbers[r][co];
          
          if (val === 'BINGO') {
            mc.textContent = 'bingo';
            mc.style.fontSize = '9px';
          } else {
            mc.textContent = (val === undefined ? '' : val);
          }

          if (Array.isArray(c.markedNumbers) && c.markedNumbers.indexOf(val) !== -1) {
            mc.classList.add('marked');
          }
          mini.appendChild(mc);
        }
      }

      const nameHtml = c.name ? `<div style="font-weight:600">${this.escapeHtml(c.name)}</div>` : '';
      it.innerHTML += `<div style="display:flex;gap:8px;align-items:center"><div><strong>${c.id}</strong><div class="muted">${nameHtml}${new Date(c.createdAt).toLocaleString()}</div></div></div><div style="display:flex;gap:6px;align-items:center"></div>`;

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '6px';

      const viewBtn = document.createElement('button');
      viewBtn.textContent = 'Ver';
      viewBtn.addEventListener('click', () => this.showPreview(c.id));

      const renameBtn = document.createElement('button');
      renameBtn.textContent = 'Renombrar';
      renameBtn.addEventListener('click', () => {
        CartillasManager.renameCard(pkg.id, c.id);
      });

      const useBtn = document.createElement('button');
      useBtn.textContent = 'Usar';
      useBtn.addEventListener('click', () => {
        CartillasManager.toggleWinnerInPackage(pkg.id, c.id);
        this.renderTicketList();
      });

      const dlBtn = document.createElement('button');
      dlBtn.textContent = 'PNG';
      dlBtn.addEventListener('click', () => ExportManager.downloadCardImage(c));

      controls.appendChild(viewBtn);
      controls.appendChild(renameBtn);
      controls.appendChild(useBtn);
      controls.appendChild(dlBtn);

      it.appendChild(mini);
      it.appendChild(controls);
      ticketListEl.appendChild(it);
    });
  }

  static showPreview(id) {
    const full = StorageManager.loadFull();
    let found = null;
    let parentPkg = null;

    for (const p of full.packages) {
      const f = p.cartillas.find(x => x.id === id);
      if (f) {
        found = f;
        parentPkg = p;
        break;
      }
    }

    const c = found;
    const previewEl = document.getElementById('preview');

    if (!c) {
      previewEl.innerHTML = '<div class="muted">No encontrado</div>';
      return;
    }

    const nameLine = c.name ? `<div style="margin-bottom:6px"><strong>Nombre:</strong> ${this.escapeHtml(c.name)}</div>` : '';
    let html = `<h3>${c.id}</h3>${nameLine}<div class="muted">Creada: ${new Date(c.createdAt).toLocaleString()}</div><div style="margin-top:8px;display:flex;flex-direction:column;gap:6px"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;text-align:center;font-weight:700">`;

    const headers = ['B', 'I', 'N', 'G', 'O'];
    headers.forEach(h => html += `<div style="background:#0b2540;color:#fff;padding:6px;border-radius:6px">${h}</div>`);

    html += `</div><div class="ticket-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">`;

    for (let r = 0; r < c.rows; r++) {
      for (let co = 0; co < c.cols; co++) {
        const val = c.numbers[r][co];
        if (val === 'BINGO') {
          const marked = Array.isArray(c.markedNumbers) && c.markedNumbers.indexOf('BINGO') !== -1;
          html += `<div class="ticket-cell${marked ? ' marked' : ''}" style="font-size:12px;color:#333;text-transform:lowercase">bingo</div>`;
        } else {
          const marked = Array.isArray(c.markedNumbers) && c.markedNumbers.indexOf(val) !== -1;
          html += `<div class="ticket-cell${marked ? ' marked' : ''}">${val === undefined ? '' : this.escapeHtml(String(val))}</div>`;
        }
      }
    }

    html += '</div></div>';
    html += `<div style="margin-top:8px;display:flex;gap:8px"><button id="markWinner">Marcar ganadora</button><button id="dlCard">Descargar PNG</button><button id="editName">Editar nombre</button><button id="delCard" style="background:#e53935">Borrar cartilla</button></div>`;

    previewEl.innerHTML = html;

    document.getElementById('markWinner').addEventListener('click', () => {
      CartillasManager.toggleWinnerInPackage(parentPkg.id, c.id);
      this.showPreview(c.id);
    });

    document.getElementById('dlCard').addEventListener('click', () => ExportManager.downloadCardImage(c));
    document.getElementById('editName').addEventListener('click', () => {
      CartillasManager.renameCard(parentPkg.id, c.id);
      this.showPreview(c.id);
    });

    document.getElementById('delCard').addEventListener('click', () => {
      if (confirm('¿Borrar la cartilla ' + c.id + ' del paquete ' + parentPkg.id + '?')) {
        CartillasManager.deleteCard(parentPkg.id, c.id);
        previewEl.innerHTML = '<div class="muted">Selecciona una cartilla para ver detalles</div>';
      }
    });
  }
}