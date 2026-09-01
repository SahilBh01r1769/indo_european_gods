import { resetJourney } from './state.js';

function goHome({replace=false}={}) {
  resetJourney();
  const homeHash = '#discover';
  if (replace) {
    history.replaceState(null, '', `${location.pathname}${location.search}${homeHash}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (location.hash === homeHash || !location.hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = homeHash;
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function installHomeNavigation() {
  const nav = document.querySelector('.main-nav');
  const brand = document.querySelector('.brand');
  if (!nav || !brand) {
    requestAnimationFrame(installHomeNavigation);
    return;
  }

  if (!nav.querySelector('[data-nav="home"]')) {
    const home = document.createElement('a');
    home.href = '#discover';
    home.dataset.nav = 'home';
    home.className = 'home-nav-link';
    home.textContent = 'Home';
    nav.prepend(home);
    home.addEventListener('click', event => {
      event.preventDefault();
      goHome();
    });
  }

  brand.addEventListener('click', event => {
    event.preventDefault();
    goHome();
  });
}

// A fresh load is always a fresh exhibition. No previous journey is restored.
goHome({ replace: true });
installHomeNavigation();
