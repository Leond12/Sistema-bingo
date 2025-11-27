// Gestión de animaciones
class AnimationManager {
  constructor(boardManager) {
    this.boardManager = boardManager;
    this.animating = false;
    this.lastAnimatedIndex = 0;
  }

  animateToTarget(target, onComplete) {
    if (this.animating) return;
    
    const animationsEnabled = document.getElementById('animToggle').checked;
    
    if (!animationsEnabled) {
      onComplete();
      return;
    }

    this.animating = true;
    const max = this.boardManager.getBoardSize();
    
    // Determinar posición inicial
    let startIndex = (this.lastAnimatedIndex && this.lastAnimatedIndex >= 1 && this.lastAnimatedIndex <= max) ? 
      this.lastAnimatedIndex : 0;
    
    // Calcular pasos para llegar al objetivo
    const offset = (target - startIndex + max) % max;
    const initial = startIndex === 0 ? 1 : ((startIndex % max) + 1);
    const totalSteps = offset === 0 ? 1 : offset;
    
    let stepsDone = 0;
    let last = null;
    let currentIndex = initial - 1;

    const interval = setInterval(() => {
      // Remover animación anterior
      if (last) {
        last.classList.remove('pulse');
        COLOR_CLASSES.forEach(c => last.classList.remove(c));
      }
      
      // Avanzar
      currentIndex = (currentIndex % max) + 1;
      const el = this.boardManager.cells[currentIndex];
      stepsDone++;
      
      if (el && !el.classList.contains('marked')) {
        el.classList.add('pulse');
        const colorClass = COLOR_CLASSES[stepsDone % COLOR_CLASSES.length];
        el.classList.add(colorClass);
        last = el;
      } else {
        last = null;
      }

      if (stepsDone >= totalSteps) {
        clearInterval(interval);
        
        if (last) {
          last.classList.remove('pulse');
          COLOR_CLASSES.forEach(c => last.classList.remove(c));
        }
        
        const finalEl = this.boardManager.cells[target];
        if (finalEl) {
          finalEl.classList.add('marked');
          finalEl.setAttribute('data-marked', 'true');
        }
        
        try {
          AudioManager.playNumberSound(target);
        } catch (e) {}
        
        this.lastAnimatedIndex = target;
        this.animating = false;
        onComplete();
      }
    }, ANIMATION_INTERVAL);
  }
}