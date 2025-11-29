// Integration helpers to provide cartillas preview and ticket list in the index page
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // Utility to copy options from #packageSelectGame to #packageSelect
    const gameSelect = document.getElementById('packageSelectGame');
    const cartSelect = document.getElementById('packageSelect');

    const syncOptions = () => {
      if (!gameSelect || !cartSelect) return;
      cartSelect.innerHTML = '';
      Array.from(gameSelect.options).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.textContent;
        cartSelect.appendChild(opt);
      });
      cartSelect.value = gameSelect.value;
    };

    if (gameSelect && cartSelect) {
      // Initial copy
      syncOptions();

      // Keep them synced
      gameSelect.addEventListener('change', () => {
        syncOptions();
        if (typeof UIManager !== 'undefined') UIManager.updateMetaImage();
        if (typeof CardRenderer !== 'undefined') CardRenderer.renderTicketList();
      });

      // Also observe for option changes (some app code updates options dynamically)
      const obs = new MutationObserver(() => syncOptions());
      obs.observe(gameSelect, { childList: true });

      cartSelect.addEventListener('change', () => {
        if (gameSelect) {
          gameSelect.value = cartSelect.value;
          if (typeof UIManager !== 'undefined') UIManager.updateMetaImage();
        }
        if (typeof CardRenderer !== 'undefined') CardRenderer.renderTicketList();
      });
    }

    // Setup search input for ticket list
    const searchInput = document.getElementById('cardSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (typeof CardRenderer !== 'undefined') CardRenderer.renderTicketList();
      });
    }

    // Ticket list click binds
    const ticketListEl = document.getElementById('ticketList');
    if (ticketListEl) {
      ticketListEl.addEventListener('click', (e) => {
        const it = e.target.closest('.ticket-item');
        if (!it) return;
        Array.from(ticketListEl.querySelectorAll('.ticket-item')).forEach(x => x.classList.remove('selected'));
        it.classList.add('selected');
        if (typeof CardRenderer !== 'undefined') CardRenderer.showPreview(it.dataset.id);
      });
    }

    // Render list initially if CardRenderer is available
    if (typeof CardRenderer !== 'undefined') {
      CardRenderer.renderTicketList();
    }

    // Storage listener (update list/preview on external changes)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        if (typeof CardRenderer !== 'undefined') CardRenderer.renderTicketList();
      }
    });

    // Observe number draw: GameManager updates Storage, but in same window we also want to update the ticket list
    // Try to hook to draw button clicks if GameManager isn't exposing events
    const drawBtn = document.getElementById('drawBtn');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => {
        setTimeout(() => {
          if (typeof CardRenderer !== 'undefined') CardRenderer.renderTicketList();
        }, 200); // small delay to let marking and storage save take place
      });
    }
  });
})();
