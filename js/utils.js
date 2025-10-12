export const utils = {
  parseIntSafe(v, d = 0){ const n = parseInt(v,10); return Number.isFinite(n) ? n : d; },
  clamp(v, min, max){ return Math.max(min, Math.min(max, v)); },
  escapeHtml(str = ''){ const d = document.createElement('div'); d.textContent = String(str); return d.innerHTML; },
  throttle(fn, delay){
    let t, last = 0;
    return function(...args){
      const now = Date.now();
      const run = ()=>{ last = now; fn.apply(this, args); };
      clearTimeout(t);
      if (now - last > delay) run(); else t = setTimeout(run, delay - (now - last));
    };
  },
  toISODate(date){
    return new Date(date.getTime() - date.getTimezoneOffset()*60000)
      .toISOString().slice(0,10);
  }
};