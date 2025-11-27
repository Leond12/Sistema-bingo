// Gestión de patrones de premios
class PatternsManager {
  static defaultPatterns() {
    return {
      full: { name: 'Cartón Lleno', enabled: true, prize: 100, winsCount: 0, incrementPercent: 0, thresholdWins: 0 },
      enX: { name: 'En X', enabled: true, prize: 50, winsCount: 0, incrementPercent: 0, thresholdWins: 0 },
      cruz: { name: 'En Cruz', enabled: true, prize: 40, winsCount: 0, incrementPercent: 0, thresholdWins: 0 },
      corners: { name: 'Cuatro Esquinas', enabled: true, prize: 25, winsCount: 0, incrementPercent: 0, thresholdWins: 0 }
    };
  }

  static renderPatternsPanel() {
    const panel = document.getElementById('patternsPanel');
    const sel = document.getElementById('packageSelect').value;

    if (!sel) {
      panel.innerHTML = 'Selecciona un paquete para editar patrones.';
      return;
    }

    const full = StorageManager.loadFull();
    const pkg = full.packages.find(p => p.id === sel);

    if (!pkg) {
      panel.innerHTML = 'Paquete no encontrado';
      return;
    }

    const patterns = pkg.patterns || this.defaultPatterns();
    pkg.patterns = patterns;

    const fullAll = StorageManager.loadFull();
    let optionsHtml = '';

    fullAll.packages.forEach(pp => {
      const txt = (pp.meta && pp.meta.name) ? pp.meta.name + ' (' + pp.id + ')' : pp.id;
      const selAttr = (pp.id === sel) ? ' selected' : '';
      optionsHtml += `<option value="${pp.id}"${selAttr}>${txt}</option>`;
    });

    let html = '';
    html += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><label>Paquete: <select id="pkgNameSelect" style="width:220px">${optionsHtml}</select></label><button id="savePkgName">Renombrar</button></div>`;
    html += '<div style="display:flex;flex-direction:column;gap:8px">';

    Object.keys(patterns).forEach(key => {
      const p = patterns[key];
      html += `<div style="display:flex;gap:8px;align-items:center;border:1px solid #eee;padding:8px;border-radius:6px"><label><input type="checkbox" data-key="${key}" class="pat-enabled" ${p.enabled ? 'checked' : ''}> <strong>${p.name || key}</strong></label><label>Premio: <input type="number" data-key="${key}" class="pat-prize" value="${p.prize || 0}" style="width:100px"></label><label>% Incremento: <input type="number" data-key="${key}" class="pat-inc" value="${p.incrementPercent || 0}" style="width:80px"></label><label>Umbral (wins): <input type="number" data-key="${key}" class="pat-thresh" value="${p.thresholdWins || 0}" style="width:80px"></label></div>`;
    });

    html += '</div>';
    panel.innerHTML = html;

    this.wirePatternsEvents(sel);
  }

  static wirePatternsEvents(sel) {
    const selEl = document.getElementById('pkgNameSelect');
    selEl && selEl.addEventListener('change', (e) => {
      document.getElementById('packageSelect').value = e.target.value;
      CardRenderer.renderTicketList();
      this.renderPatternsPanel();
    });

    const saveNameBtn = document.getElementById('savePkgName');
    saveNameBtn && saveNameBtn.addEventListener('click', () => {
      const chosen = document.getElementById('pkgNameSelect').value || sel;
      const fullNow = StorageManager.loadFull();
      const pkgNow = fullNow.packages.find(p => p.id === chosen);

      if (!pkgNow) return;

      const newName = prompt('Nuevo nombre para el paquete (vacío = sin nombre)', (pkgNow.meta && pkgNow.meta.name) ? pkgNow.meta.name : '') || '';
      pkgNow.meta = pkgNow.meta || {};
      pkgNow.meta.name = newName.trim() || '';
      StorageManager.saveFull(fullNow);
      CartillasUI.refreshPackageSelect();
      CardRenderer.renderTicketList();
      this.renderPatternsPanel();
      alert('Nombre de paquete guardado');
    });

    const panel = document.getElementById('patternsPanel');
    panel.querySelectorAll('.pat-enabled').forEach(ch => ch.addEventListener('change', (e) => {
      const k = e.target.dataset.key;
      const fullNow = StorageManager.loadFull();
      const pkgNow = fullNow.packages.find(p => p.id === sel);
      if (!pkgNow) return;
      pkgNow.patterns = pkgNow.patterns || this.defaultPatterns();
      pkgNow.patterns[k].enabled = e.target.checked;
      StorageManager.saveFull(fullNow);
    }));

    panel.querySelectorAll('.pat-prize').forEach(inp => inp.addEventListener('change', (e) => {
      const k = e.target.dataset.key;
      const v = Number(e.target.value) || 0;
      const fullNow = StorageManager.loadFull();
      const pkgNow = fullNow.packages.find(p => p.id === sel);
      if (!pkgNow) return;
      pkgNow.patterns = pkgNow.patterns || this.defaultPatterns();
      pkgNow.patterns[k].prize = v;
      StorageManager.saveFull(fullNow);
    }));

    panel.querySelectorAll('.pat-inc').forEach(inp => inp.addEventListener('change', (e) => {
      const k = e.target.dataset.key;
      const v = Number(e.target.value) || 0;
      const fullNow = StorageManager.loadFull();
      const pkgNow = fullNow.packages.find(p => p.id === sel);
      if (!pkgNow) return;
      pkgNow.patterns = pkgNow.patterns || this.defaultPatterns();
      pkgNow.patterns[k].incrementPercent = v;
      StorageManager.saveFull(fullNow);
    }));

    panel.querySelectorAll('.pat-thresh').forEach(inp => inp.addEventListener('change', (e) => {
      const k = e.target.dataset.key;
      const v = Number(e.target.value) || 0;
      const fullNow = StorageManager.loadFull();
      const pkgNow = fullNow.packages.find(p => p.id === sel);
      if (!pkgNow) return;
      pkgNow.patterns = pkgNow.patterns || this.defaultPatterns();
      pkgNow.patterns[k].thresholdWins = v;
      StorageManager.saveFull(fullNow);
    }));
  }
}