import { CONFIG } from './config.js';
import { utils } from './utils.js';
import { FormStateManager } from './state.js';

export class PilotFormController {
  constructor(){
    this.form = document.getElementById('pilot-form'); if(!this.form) return;
    this.summaryBtn = document.getElementById('form-min');
    this.closeBtn   = document.getElementById('pill-close');
    this.el = {
      location:  document.getElementById('location'),
      dateStart: document.getElementById('date-start'),
      dateEnd:   document.getElementById('date-end'),
      adults:    document.getElementById('adults'),
      children:  document.getElementById('children'),
      agesWrap:  document.getElementById('children-ages')
    };
    // --- Mobile: abrir/fechar formulário pelo resumo
    if (this.summaryBtn){
      this.summaryBtn.addEventListener('click', () => {
    const expanded = this.summaryBtn.getAttribute('aria-expanded') === 'true';
    this.setCollapsed(expanded);           // se estava expandido, colapsa; se estava colapsado, expande
  });
    }

if (this.closeBtn){
  this.closeBtn.addEventListener('click', () => this.setCollapsed(true));
}

// Atualiza o resumo sempre que algo muda
this.form.addEventListener('input', () => this.updateSummary());
document.addEventListener('filtersChanged', () => this.updateSummary());

// Inicializa o resumo com o estado persistido, e mantém o form aberto por defeito
this.updateSummary();
this.setCollapsed(false);

    if(!Object.values(this.el).every(Boolean)) return console.error('Missing form elements');
    this.state = new FormStateManager();
    this.init();
  }
  init(){
    // load values
    const s = this.state.get();
    this.el.location.value  = s.location;
    this.el.dateStart.value = s.dateStart;
    this.el.dateEnd.value   = s.dateEnd;
    this.el.adults.value    = s.adults;
    this.el.children.value  = s.children;
    this.renderAges(s.children, s.childAges);

    // dynamic min dates (today) & end >= start
      const t = new Date();
      const minISO = utils.toISODate(t);
      this.el.dateStart.min = minISO;
      this.el.dateEnd.min   = minISO;

      this.el.dateStart.addEventListener('change', ()=>{
        const from = this.el.dateStart.value;
        this.el.dateEnd.min = from || minISO;
        if (from && this.el.dateEnd.value && this.el.dateEnd.value < from) {
          this.el.dateEnd.value = from;
            }
        this.persist();
      });


    // listeners
     ['location','dateStart','dateEnd','adults'].forEach(k=>{
      this.el[k].addEventListener('change', ()=>this.onField(k));
     });

  // After picking the start date, jump to end date if empty (nice UX for the new range control)
  this.el.dateStart.addEventListener('change', ()=>{
    // keep your existing min-sync logic from init()
    if (!this.el.dateEnd.value) this.el.dateEnd.focus();
  });

  this.el.children.addEventListener('input', ()=>this.onChildren());
  this.el.agesWrap.addEventListener('input', e=>{
    if(e.target.matches('input[data-age-index]')) this.onAge(e.target);
  });

  // allow Enter key to submit from any input inside the pill
  this.form.addEventListener('submit', e=>this.onSubmit(e));

  // (optional) submit on Enter from number/date/select while preventing accidental submit when ages are incomplete
  this.form.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') {
      // let the form submit handler validate ages/dates
    }
  });
}

setCollapsed(collapsed){
  // Só estiliza; CSS mobile controla a visibilidade
  this.form.classList.toggle('is-collapsed', collapsed);
  if (this.summaryBtn) this.summaryBtn.setAttribute('aria-expanded', String(!collapsed));
}

formatParty(){
  const a = utils.parseIntSafe(this.el.adults.value, 1);
  const c = utils.parseIntSafe(this.el.children.value, 0);
  return c > 0 ? `${a}A · ${c}C` : `${a}A`;
}

formatDates(){
  const ds = (document.getElementById('date-range-display')?.value || '').trim();
  if (ds) return ds;
  const s = (this.el.dateStart.value || '').trim();
  const e = (this.el.dateEnd.value || '').trim();
  if (s && e) return `${s} – ${e}`;
  return 'Select dates';
}

updateSummary(){
  if (!this.summaryBtn) return;
  const txt = `${this.formatDates()} · ${this.formatParty()}`;
  const el  = this.summaryBtn.querySelector('.txt');
  if (el) el.textContent = txt;
}


onField(field){
  const el = this.el[field];
  let value = el.value;
  if(field === 'adults'){
    value = utils.clamp(utils.parseIntSafe(value, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99);
    el.value = value;
  }
  this.state.save({ [field]: value });
}

onChildren(){
  const n = utils.clamp(utils.parseIntSafe(this.el.children.value, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10);
  this.el.children.value = n;
  this.renderAges(n);
  this.persist();
}

onAge(input){
  const age = utils.clamp(utils.parseIntSafe(input.value, CONFIG.MIN_CHILD_AGE), CONFIG.MIN_CHILD_AGE, CONFIG.MAX_CHILD_AGE);
  input.value = age;
  this.persist();
}

onSubmit(e){
  e.preventDefault();

  const start = this.el.dateStart.value;
  const end   = this.el.dateEnd.value;

  // Dates validation for the single date-range control
  if (start && end && end < start) {
    alert('End date must be the same day or after the start date.');
    this.el.dateEnd.focus();
    return;
  }

  const kids = utils.parseIntSafe(this.el.children.value, 0);
  if (kids > 0) {
    const ageInputs = this.el.agesWrap.querySelectorAll('input[data-age-index]');
    if (ageInputs.length !== kids) { alert('Please provide age for each child.'); return; }
    for (const inp of ageInputs) {
      const v = inp.value.trim(), n = Number(v);
      if (v === '' || !Number.isFinite(n) || n < CONFIG.MIN_CHILD_AGE || n > CONFIG.MAX_CHILD_AGE) {
        alert('Please enter a valid age for each child.');
        inp.focus();
        return;
      }
    }
  }

  const final = this.persist();
  console.log('Filters applied:', final);
  this.form.dispatchEvent(new CustomEvent('filtersApplied', { detail: final }));
  this.setCollapsed(true);   // no mobile, reduz ao resumo depois de aplicar
  document.dispatchEvent(new CustomEvent('filtersChanged', { detail: {} }));
    this.setCollapsed(true);  // reduz ao resumo no mobile depois de aplicar
}


  persist(){
    return this.state.save({
      location: this.el.location.value || CONFIG.DEFAULT_LOCATION,
      dateStart: this.el.dateStart.value || '',
      dateEnd:   this.el.dateEnd.value   || '',
      adults:    utils.clamp(utils.parseIntSafe(this.el.adults.value, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99),
      children:  utils.clamp(utils.parseIntSafe(this.el.children.value, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10),
      childAges: this.collectAges()
    });
  }
  renderAges(count, existing = []) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const age = Number.isFinite(existing[i]) ? existing[i] : '';
    const inputId = `child-age-${i+1}`;

    const field = document.createElement('div');
    field.className = 'age-field';

    const label = document.createElement('label');
    label.className = 'lbl';
    label.setAttribute('for', inputId);
    label.textContent = `Age ${i+1}`;

    const input = document.createElement('input');
    input.type = 'number';
    input.id = inputId;
    input.name = inputId;              // helps a11y/autofill
    input.min = CONFIG.MIN_CHILD_AGE;
    input.max = CONFIG.MAX_CHILD_AGE;
    input.step = '1';
    input.autocomplete = 'off';
    input.dataset.ageIndex = i;
    input.required = true;             // mandatory when children > 0
    input.value = age;

    field.append(label, input);
    frag.append(field);
  }
  this.el.agesWrap.innerHTML = '';
  this.el.agesWrap.append(frag);
}

  collectAges(){
    return Array.from(this.el.agesWrap.querySelectorAll('input[data-age-index]')).map(inp=>{
      const v = utils.parseIntSafe(inp.value, ''); return v === '' ? '' : utils.clamp(v, CONFIG.MIN_CHILD_AGE, CONFIG.MAX_CHILD_AGE);
    });
  }
}