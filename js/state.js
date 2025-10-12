import { CONFIG } from './config.js';
import { utils } from './utils.js';

export class FormStateManager {
  constructor(){ this.state = this.load() || this.defaults(); }
  defaults(){ return { location: CONFIG.DEFAULT_LOCATION, dateStart:'', dateEnd:'', adults:CONFIG.DEFAULT_ADULTS, children:CONFIG.DEFAULT_CHILDREN, childAges:[] }; }
  load(){
    try { const raw = localStorage.getItem(CONFIG.STORAGE_KEY); if(!raw) return null; return this.validate(JSON.parse(raw)); }
    catch { return null; }
  }
  validate(data){
    if(!data || typeof data!=='object') return null;
    return {
      location: data.location || CONFIG.DEFAULT_LOCATION,
      dateStart: data.dateStart || '',
      dateEnd:   data.dateEnd   || '',
      adults:    utils.clamp(utils.parseIntSafe(data.adults, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99),
      children:  utils.clamp(utils.parseIntSafe(data.children, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10),
      childAges: Array.isArray(data.childAges) ? data.childAges : []
    };
  }
  save(updates = {}){ this.state = { ...this.state, ...updates }; localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.state)); return this.get(); }
  get(){ return { ...this.state }; }
}