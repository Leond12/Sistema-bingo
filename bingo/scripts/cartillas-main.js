// Inicialización principal de la gestión de cartillas
class CartillasApp {
  constructor() {
    this.init();
  }

  init() {
    // Inicializar UI
    CartillasUI.refreshPackageSelect();
    CartillasUI.setupEventListeners();
    CartillasUI.setupStorageListener();
    
    // Renderizar componentes iniciales
    CardRenderer.renderTicketList();
    PatternsManager.renderPatternsPanel();
    CartillasUI.updateWinnerList();
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new CartillasApp();
});