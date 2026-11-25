(() => {
    'use strict';
    const filters = document.querySelector('[data-project-filters]');
    const cards = [...document.querySelectorAll('#proyectos .project-card[data-category]')];
    if (!filters || !cards.length) return;
    const count = document.querySelector('[data-project-count]');
    filters.addEventListener('click', event => {
        const button = event.target.closest('button[data-filter]');
        if (!button) return;
        const selected = button.dataset.filter;
        filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        let visible = 0;
        cards.forEach(card => { card.hidden = selected !== 'Todos' && card.dataset.category !== selected; if (!card.hidden) visible++; });
        if (count) count.textContent = `${visible} de ${cards.length} proyectos visibles`;
    });
})();
