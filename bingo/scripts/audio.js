// Gestión de efectos de sonido
class AudioManager {
  static playNumberSound(num) {
    try {
      const base = './sonidos/' + num;
      let audio = new Audio(base + '.mp3');
      
      audio.play().catch(() => {
        try {
          const audio2 = new Audio(base + '.ogg');
          audio2.play().catch(() => console.warn('No se pudo reproducir sonido', num));
        } catch (e) {
          console.warn('Error al reproducir sonido', e);
        }
      });
    } catch (e) {
      console.warn('Error al iniciar audio', e);
    }
  }
}