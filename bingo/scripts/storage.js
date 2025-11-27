// Gestión de almacenamiento local
class StorageManager {
  static loadFull() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { packages: [], history: [] };
      
      const data = JSON.parse(raw);
      
      // Migrar estructura legacy
      if (Array.isArray(data.cartillas)) {
        return {
          packages: [{
            id: 'legacy',
            createdAt: new Date().toISOString(),
            cartillas: data.cartillas,
            patterns: {},
            meta: {}
          }],
          history: data.history || []
        };
      }
      
      return data && data.packages ? data : { packages: [], history: [] };
    } catch (e) {
      return { packages: [], history: [] };
    }
  }

  static saveFull(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  static loadSavedMode() {
    try {
      const el = document.getElementById('bingoMode');
      const saved = localStorage.getItem('bingo_mode');
      if (el && saved) el.value = saved;
    } catch (e) {}
  }

  static saveMode(mode) {
    try {
      localStorage.setItem('bingo_mode', mode);
    } catch (e) {}
  }
}