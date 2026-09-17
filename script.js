const header = document.querySelector('.site-header');
const year = document.querySelector('#year');
const dialog = document.querySelector('#documentDialog');
const openDocument = document.querySelector('[data-open-document]');
const closeDocument = document.querySelector('[data-close-document]');
const offerPopup = document.querySelector('#offerPopup');
const offerButton = document.querySelector('[data-offer-telegram]');
const offerCloseButtons = document.querySelectorAll('[data-close-offer]');
const offerStorageKey = 'technomir-welcome-offer-seen-v1';
let previousFocus = null;

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
if (year) year.textContent = String(new Date().getFullYear());

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

openDocument?.addEventListener('click', () => dialog?.showModal());
closeDocument?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) dialog.close();
});

const rememberOffer = () => {
  try { sessionStorage.setItem(offerStorageKey, '1'); } catch (_) { /* Storage may be disabled. */ }
};

const closeOffer = () => {
  if (!offerPopup || offerPopup.hidden) return;
  rememberOffer();
  offerPopup.classList.remove('is-open');
  offerPopup.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('offer-popup-open');
  window.setTimeout(() => { offerPopup.hidden = true; }, 330);
  previousFocus?.focus?.();
};

const openOffer = () => {
  if (!offerPopup) return;
  previousFocus = document.activeElement;
  offerPopup.hidden = false;
  offerPopup.setAttribute('aria-hidden', 'false');
  document.body.classList.add('offer-popup-open');
  requestAnimationFrame(() => offerPopup.classList.add('is-open'));
  window.setTimeout(() => offerButton?.focus(), 380);
};

let offerWasSeen = false;
try { offerWasSeen = sessionStorage.getItem(offerStorageKey) === '1'; } catch (_) { /* Show the offer when storage is unavailable. */ }

if (!offerWasSeen) {
  window.addEventListener('load', () => window.setTimeout(openOffer, 650), { once: true });
}

offerCloseButtons.forEach((button) => button.addEventListener('click', closeOffer));
offerButton?.addEventListener('click', closeOffer);

offerPopup?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeOffer();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...offerPopup.querySelectorAll('a[href], button:not([disabled])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelectorAll('[data-product-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  const thumb = carousel.querySelector('[data-carousel-thumb]');
  const cards = [...carousel.querySelectorAll('.product-card')];
  if (!track || !previous || !next || !thumb || !cards.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animationFrame = 0;

  const updateCarousel = () => {
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    const position = Math.min(maximum, Math.max(0, track.scrollLeft));
    const visibleRatio = Math.min(1, track.clientWidth / track.scrollWidth);
    const thumbWidth = Math.max(20, visibleRatio * 100);
    const thumbLeft = maximum > 0 ? (position / maximum) * (100 - thumbWidth) : 0;

    previous.disabled = position <= 2;
    next.disabled = position >= maximum - 2;
    thumb.style.width = `${thumbWidth}%`;
    thumb.style.left = `${thumbLeft}%`;
    animationFrame = 0;
  };

  const queueUpdate = () => {
    if (animationFrame) return;
    animationFrame = requestAnimationFrame(updateCarousel);
  };

  const move = (direction) => {
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    track.scrollBy({ left: step * direction, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', queueUpdate, { passive: true });
  track.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });

  if ('ResizeObserver' in window) new ResizeObserver(queueUpdate).observe(track);
  else window.addEventListener('resize', queueUpdate, { passive: true });
  updateCarousel();
});
