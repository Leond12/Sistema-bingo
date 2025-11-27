// Inicialización principal de la aplicación
class BingoApp {
  constructor() {
    this.boardManager = new BoardManager();
    this.animationManager = new AnimationManager(this.boardManager);
    this.gameManager = new GameManager(this.boardManager, this.animationManager);
    
    this.init();
  }

  init() {
    // Cargar configuración guardada
    StorageManager.loadSavedMode();
    
    // Construir tablero y UI inicial
    this.boardManager.buildBoard();
    this.boardManager.updateMarkedVisuals();
    this.gameManager.setStatus('listo');
    
    // Configurar selects de paquetes
    UIManager.refreshPackageSelect();
    
    // Configurar eventos de búsqueda
    UIManager.setupSearchPreviewEvents(this.gameManager);
    
    // Configurar soporte de teclado
    UIManager.setupKeyboardSupport(this.boardManager, this.gameManager);
    
    // Configurar eventos de elementos de UI
    this.setupEventListeners();
    
    // Cargar último número al iniciar
    this.loadLastNumber();
    
    // Exponer para debugging
    this.exposeForDebugging();
    
    // Escuchar cambios de almacenamiento
    this.setupStorageListener();
  }

  setupEventListeners() {
    const drawBtn = document.getElementById('drawBtn');
    const resetBtn = document.getElementById('resetBtn');
    const activateBtn = document.getElementById('activatePackage');
    const bingoModeEl = document.getElementById('bingoMode');
    const packageSelect = document.getElementById('packageSelectGame');
    
    drawBtn.addEventListener('click', () => this.gameManager.obtainNumber());
    resetBtn.addEventListener('click', () => this.gameManager.resetBoard());
    activateBtn.addEventListener('click', () => this.activatePackage());
    
    if (bingoModeEl) {
      bingoModeEl.addEventListener('change', () => {
        try {
          StorageManager.saveMode(bingoModeEl.value);
          this.boardManager.buildBoard();
          this.boardManager.clearMarkedNumbers();
          this.gameManager.cardMarks = {};
          this.gameManager.cardNotifiedPatterns = {};
          this.boardManager.updateMarkedVisuals();
          this.gameManager.setStatus('modo cambiado: ' + this.boardManager.getBoardSize());
        } catch (e) {
          console.warn(e);
        }
      });
    }
    
    if (packageSelect) {
      packageSelect.addEventListener('change', () => {
        UIManager.updateMetaImage();
      });
    }
  }

  activatePackage() {
    const packageSelect = document.getElementById('packageSelectGame');
    const activePkgInfo = document.getElementById('activePkgInfo');
    
    if (!packageSelect || !activePkgInfo) return;
    
    const id = packageSelect.value;
    
    if (!id) {
      this.gameManager.activePackageId = null;
      activePkgInfo.textContent = 'Paquete activo: ninguno';
      this.gameManager.setStatus('paquete desactivado');
      return;
    }
    
    const full = StorageManager.loadFull();
    const pkg = full.packages.find(x => x.id === id);
    
    if (!pkg) {
      alert('Paquete no encontrado');
      return;
    }
    
    this.gameManager.activePackageId = id;
    
    // Construir cardMarks desde markedNumbers actuales
    this.gameManager.cardMarks = {};
    this.gameManager.cardNotifiedPatterns = {};
    
    for (const c of (pkg.cartillas || [])) {
      const flat = c.numbers.flat ? c.numbers.flat() : [].concat(...(c.numbers || []));
      const s = new Set();
      
      for (const n of flat) {
        if (this.boardManager.markedNumbers.has(n)) {
          s.add(n);
        }
      }
      
      this.gameManager.cardMarks[c.id] = s;
      this.gameManager.cardNotifiedPatterns[c.id] = new Set();
    }
    
    activePkgInfo.textContent = 'Paquete activo: ' + ((pkg.meta && pkg.meta.name) ? pkg.meta.name : id);
    this.gameManager.setStatus('paquete activado: ' + id);
  }

  loadLastNumber() {
    try {
      const initFull = StorageManager.loadFull();
      const lastNumberBox = document.getElementById('lastNumberBox');
      
      if (initFull && initFull.lastNumber && lastNumberBox) {
        lastNumberBox.textContent = initFull.lastNumber;
      }
    } catch (e) {}
  }

  exposeForDebugging() {
    window.BingoLocal = {
      getMarked: () => Array.from(this.boardManager.markedNumbers),
      loadFull: StorageManager.loadFull,
      saveFull: StorageManager.saveFull
    };
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          const fullNow = StorageManager.loadFull();
          UIManager.refreshPackageSelect();
          
          if (this.gameManager.activePackageId) {
            this.activatePackage();
          }
          
          // Actualizar caja de último número desde valor persistido
          const last = fullNow.lastNumber;
          const lastNumberBox = document.getElementById('lastNumberBox');
          
          if (lastNumberBox) {
            lastNumberBox.textContent = last || '';
          }
          
          // Actualizar imagen meta en el centro
          UIManager.updateMetaImage();
        } catch (err) {
          console.warn('Error al aplicar cambios de storage', err);
        }
      }
    });
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new BingoApp();
});