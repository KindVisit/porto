// js/filters.js
export const FILTERS = {
  language: 'Any',   // 'Any' | 'PT' | 'EN' | 'ES' | 'FR'
  duration: 'any'    // 'any' | '1h' | '2–3h' | 'half' | 'full'
};

function emit() {
  document.dispatchEvent(
    new CustomEvent('filtersChanged', { detail: { ...FILTERS } })
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const selLang = document.getElementById('language');
  const selDur  = document.getElementById('duration');

  if (selLang) {
    selLang.addEventListener('change', () => {
      FILTERS.language = selLang.value || 'Any';
      emit();
    });
  }
  if (selDur) {
    selDur.addEventListener('change', () => {
      FILTERS.duration = selDur.value || 'any';
      emit();
    });
  }

  // emitir estado inicial para render imediato
  emit();
});
