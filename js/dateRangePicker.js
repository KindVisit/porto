import { utils } from './utils.js'; // you already have utils
import { CONFIG } from './config.js';

(function(){
  const display = document.getElementById('date-range-display');
  const startEl = document.getElementById('date-start');
  const endEl   = document.getElementById('date-end');
  if(!display || !startEl || !endEl) return;

  // ---- helpers
  const pad = n => String(n).padStart(2,'0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fromISO = s => {
    if(!s) return null;
    const [y,m,d] = s.split('-').map(Number);
    if(!y||!m||!d) return null;
    const dt = new Date(y, m-1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };
  const fmtDisplay = d => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;

  // min: today
  const today = new Date();
  today.setHours(0,0,0,0);

  // state
  let viewY = today.getFullYear();
  let viewM = today.getMonth(); // 0-11
  let selStart = fromISO(startEl.value) || null;
  let selEnd   = fromISO(endEl.value)   || null;

  // popover
  const pop = document.createElement('div');
  pop.className = 'drp-popover';
  pop.setAttribute('role','dialog');
  pop.setAttribute('aria-modal','false');
  document.body.appendChild(pop);

  const positionPopover = () => {
    const r = display.getBoundingClientRect();
    pop.style.top = `${window.scrollY + r.bottom + 6}px`;
    pop.style.left = `${window.scrollX + r.left}px`;
  };

  const render = () => {
    // header + nav
    const monthName = (y,m) => new Date(y,m,1).toLocaleString(undefined, { month:'long', year:'numeric' });
    const nextYM = (y,m,delta) => {
      const d = new Date(y, m + delta, 1);
      return [d.getFullYear(), d.getMonth()];
    };

    const [y1,m1] = [viewY, viewM];
    const [y2,m2] = nextYM(viewY, viewM, 1);

    const calHTML = (y,m) => {
      const first = new Date(y,m,1);
      const startDow = (first.getDay()+6)%7; // Mon0..Sun6
      const daysInMonth = new Date(y, m+1, 0).getDate();

      // header
      let html = `<div class="drp-cal"><div class="drp-title">${monthName(y,m)}</div><div class="drp-grid">`;

      // DOW headers
      const dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      html += dows.map(d=>`<div class="drp-dow">${d}</div>`).join('');

      // empty cells before 1st
      for(let i=0;i<startDow;i++) html += `<div></div>`;

      // days
      for(let d=1; d<=daysInMonth; d++){
        const dt = new Date(y,m,d); dt.setHours(0,0,0,0);
        const iso = toISO(dt);

        const disabled = dt < today;
        let cls = 'drp-day';
        if(disabled) cls += ' disabled';

        // range classes
        const inRange = (selStart && selEnd && dt > selStart && dt < selEnd);
        const isStart = (selStart && toISO(selStart) === iso);
        const isEnd   = (selEnd   && toISO(selEnd)   === iso);
        if(inRange) cls += ' in-range';
        if(isStart || isEnd) cls += ' selected';

        html += `<button type="button" class="${cls}" data-iso="${iso}" ${disabled?'disabled':''}>${d}</button>`;
      }
      html += `</div></div>`;
      return html;
    };

    pop.innerHTML = `
      <div class="drp-header">
        <div class="drp-nav">
          <button type="button" class="drp-btn" data-nav="-1" aria-label="Previous month">‹</button>
        </div>
        <div class="spacer"></div>
        <div class="drp-nav">
          <button type="button" class="drp-btn" data-nav="+1" aria-label="Next month">›</button>
        </div>
      </div>
      <div class="drp-calwrap">
        ${calHTML(y1,m1)}
        ${calHTML(y2,m2)}
      </div>
      <div class="drp-footer">
        <button type="button" class="drp-clear">Clear</button>
        <button type="button" class="drp-apply">Apply</button>
      </div>
    `;

    // nav
    pop.querySelectorAll('[data-nav]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const delta = Number(btn.getAttribute('data-nav'));
        const d = new Date(viewY, viewM + delta, 1);
        viewY = d.getFullYear();
        viewM = d.getMonth();
        render();
      });
    });

    // day click (support single-day)
pop.querySelectorAll('.drp-day').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const iso = btn.getAttribute('data-iso');
    const dt = fromISO(iso);

    if (!selStart || (selStart && selEnd)) {
      // start a new range
      selStart = dt;
      selEnd = null;
    } else {
      // we already have a start, set end
      if (dt < selStart) {
        selEnd = selStart;
        selStart = dt;
      } else {
        // allow same day = single-day range
        selEnd = dt;
      }
    }
    render();
  });
});


    // clear/apply
pop.querySelector('.drp-clear').addEventListener('click', ()=>{
  selStart = null; selEnd = null;
  startEl.value = ''; endEl.value = '';
  display.value = '';
  display.dataset.mode = 'empty';     // <-- add this
  display.setAttribute('aria-expanded','false');
  close();
});

pop.querySelector('.drp-apply').addEventListener('click', ()=>{
  if (selStart && !selEnd) selEnd = selStart;

  if (selStart && selEnd) {
    startEl.value = toISO(selStart);
    endEl.value   = toISO(selEnd);

    if (toISO(selStart) === toISO(selEnd)) {
      display.value = `${fmtDisplay(selStart)}`;
      display.dataset.mode = 'empty';   
    } else {
      display.value = `${fmtDisplay(selStart)} – ${fmtDisplay(selEnd)}`;
      display.dataset.mode = 'range';    // <-- add this
    }
  } else {
    startEl.value = '';
    endEl.value = '';
    display.value = '';
    display.dataset.mode = 'empty';      // <-- add this
  }
  display.setAttribute('aria-expanded','false');
  startEl.dispatchEvent(new Event('change', { bubbles:true }));
  endEl.dispatchEvent(new Event('change',   { bubbles:true }));
  close();
});

  };

  const open = () => {
    display.setAttribute('aria-expanded','true');
    render();
    positionPopover();
    pop.classList.add('open');
    // close on outside click / Esc
    setTimeout(()=>{ // defer to avoid immediate close from the opening click
      const onDoc = (e)=>{
        if(!pop.contains(e.target) && e.target !== display){
          close();
        }
      };
      const onEsc = (e)=>{ if(e.key === 'Escape') close(); };
      document.addEventListener('mousedown', onDoc, { once:true });
      document.addEventListener('keydown', onEsc,   { once:true });
    },0);
  };

  const close = () => {
    pop.classList.remove('open');
  };

  // open on click
  display.addEventListener('click', ()=>{
    // sync state from hidden inputs (in case changed elsewhere)
    selStart = fromISO(startEl.value);
    selEnd   = fromISO(endEl.value);
    // initial view: month of start or today
    const base = selStart || today;
    viewY = base.getFullYear();
    viewM = base.getMonth();
    open();
  });

  // also reposition on resize/scroll
  window.addEventListener('resize', positionPopover);
  window.addEventListener('scroll', positionPopover, { passive:true });

// initialize display text if values already set
if (startEl.value && endEl.value){
  const s = fromISO(startEl.value), e = fromISO(endEl.value);
  if (s && e) {
    display.value = (toISO(s) === toISO(e))
      ? `${fmtDisplay(s)}`
      : `${fmtDisplay(s)} – ${fmtDisplay(e)}`;
    display.dataset.mode = (toISO(s) === toISO(e)) ? 'single' : 'range';
  } else {
    display.dataset.mode = 'empty';
  }
} else {
  display.dataset.mode = 'empty';
}
})();
