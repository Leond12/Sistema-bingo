// Gestión principal de cartillas
class CartillasManager {
  static toggleWinnerInPackage(packageId, cardId) {
    const full = StorageManager.loadFull();
    const pkg = full.packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const idx = pkg.cartillas.findIndex(x => x.id === cardId);
    if (idx === -1) return;
    
    pkg.cartillas[idx].winner = !pkg.cartillas[idx].winner;
    StorageManager.saveFull(full);
    CardRenderer.renderTicketList();
  }

  static deleteCard(packageId, cardId) {
    const full = StorageManager.loadFull();
    const pkg = full.packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const idx = pkg.cartillas.findIndex(x => x.id === cardId);
    if (idx === -1) return;
    
    pkg.cartillas.splice(idx, 1);
    StorageManager.saveFull(full);
    
    const ticketListEl = document.getElementById('ticketList');
    const sel = ticketListEl.querySelector('.ticket-item.selected');
    if (sel && sel.dataset.id === cardId) sel.classList.remove('selected');
    
    CardRenderer.renderTicketList();
    PatternsManager.renderPatternsPanel();
  }

  static deletePackage(packageId) {
    if (!confirm('¿Borrar el paquete "' + packageId + '"? Esta acción eliminará todas sus cartillas.')) return;
    
    const full = StorageManager.loadFull();
    const idx = full.packages.findIndex(p => p.id === packageId);
    if (idx === -1) return;
    
    full.packages.splice(idx, 1);
    StorageManager.saveFull(full);
    CartillasUI.refreshPackageSelect();
    CardRenderer.renderTicketList();
    PatternsManager.renderPatternsPanel();
    alert('Paquete borrado');
  }

  static renameCard(packageId, cardId) {
    const full = StorageManager.loadFull();
    const pkg = full.packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const card = pkg.cartillas.find(x => x.id === cardId);
    if (!card) return;
    
    const current = card.name || '';
    const n = prompt('Nuevo nombre para la cartilla (vacío = sin nombre)', current);
    if (n === null) return;
    
    card.name = (n.trim() || '');
    StorageManager.saveFull(full);
    CardRenderer.renderTicketList();
    PatternsManager.renderPatternsPanel();
  }
}