import { CONFIG } from './config.js';
import { utils } from './utils.js';

export class HeaderController {
  constructor(){
    this.header = document.querySelector('.site-header');
    if(!this.header) return;

    // sombra ao fazer scroll
    this.onScroll = utils.throttle(()=>{
      this.header.classList.toggle('is-scrolled', window.scrollY > CONFIG.SCROLL_THRESHOLD);
    }, 100);
    window.addEventListener('scroll', this.onScroll);
    this.onScroll();

    // calcular offset dinâmico (header+pill)
    this.setHeaderOffset = () => {
      const h = this.header?.offsetHeight || 0;
      document.documentElement.style.setProperty('--header-offset', `${h}px`);
    };
    this.setHeaderOffset();

    // observar mudanças de tamanho do header
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(()=> this.setHeaderOffset());
      this.ro.observe(this.header);
    }
    window.addEventListener('load', this.setHeaderOffset);
    window.addEventListener('resize', this.setHeaderOffset);
    // ——— Mobile: Hamburger / Drawer (overlay) ———
this.hamburger = document.getElementById('hamburger');
this.drawer    = document.getElementById('mobile-drawer');

const setMenu = (open) => {
  if (!this.hamburger || !this.drawer) return;
  this.hamburger.setAttribute('aria-expanded', String(open));
  this.drawer.classList.toggle('open', open);
  this.drawer.setAttribute('aria-hidden', String(!open));
  document.documentElement.style.overflow = open ? 'hidden' : '';
};

if (this.hamburger && this.drawer){
  // abre/fecha pelo botão
  this.hamburger.addEventListener('click', () => {
    const open = this.hamburger.getAttribute('aria-expanded') !== 'true';
    setMenu(open);
  });

  // fecha ao tocar fora do painel
  this.drawer.addEventListener('click', (e) => {
    if (e.target === this.drawer) setMenu(false);
  });

  // tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
}
  }


  destroy(){
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('load', this.setHeaderOffset);
    window.removeEventListener('resize', this.setHeaderOffset);
    if (this.ro) this.ro.disconnect();
  }
}
