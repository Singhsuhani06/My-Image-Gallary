/*******************************
 Virtualized carousel + lightbox
 Keeps small DOM size so it works fine with 1000+ images
********************************/

/* ---------- CONFIG ---------- */
// Choose how many visible slides for each breakpoint:
function computeVisibleCount() {
  if (window.innerWidth >= 1200) return 5;
  if (window.innerWidth >= 768) return 3;
  return 1;
}
let visibleCount = computeVisibleCount();
const buffer = 2;          // how many off-screen slides to keep on each side
let startIndex = 0;        // first visible image index
let isAnimating = false;

// ---------- IMAGE SOURCE ----------
// Option A: If your images are named pic1.jpg..picN.jpg inside /images:
//   set totalImages = number you have and uncomment the loop below.
// Option B: Replace the array with exact URLs if names are different.

const totalImages = 20; // <- change to how many images you have (e.g., 1000)
const allImages = [];
for (let i = 1; i <= totalImages; i++) {
  allImages.push(`images/pic${i}.jpg`); // ensure these files exist
}

// Alternatively, replace allImages by a hard-coded array:
// const allImages = ['images/pic1.jpg','images/pic2.jpg', ...];

/* ---------- DOM ---------- */
const viewport = document.getElementById('carousel-viewport');
const track = document.getElementById('carousel-track');
const prevBtn = document.getElementById('prev-carousel');
const nextBtn = document.getElementById('next-carousel');

/* Lightbox elements */
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbClose = document.getElementById('close');
const lbPrev = document.getElementById('prev-lightbox');
const lbNext = document.getElementById('next-lightbox');
let lightboxIndex = null;

/* ---------- Utility ---------- */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function slideWidthPx() { return Math.floor(viewport.clientWidth / visibleCount); }

/* ---------- Render small window of slides ---------- */
function renderSlides() {
  // Which indices will we render in the DOM?
  const renderStart = Math.max(0, startIndex - buffer);
  const renderEnd = Math.min(allImages.length, startIndex + visibleCount + buffer);

  // Clear and build new slides
  track.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = renderStart; i < renderEnd; i++) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.width = `${slideWidthPx()}px`; // fixed width for smooth transition

    const img = document.createElement('img');
    img.dataset.index = i;
    // lazy load only images in DOM
    img.loading = 'lazy';
    img.src = allImages[i];
    img.alt = `Image ${i + 1}`;

    // click opens lightbox
    img.addEventListener('click', () => openLightbox(i));

    slide.appendChild(img);
    fragment.appendChild(slide);
  }

  track.appendChild(fragment);

  // position track so that the visible slides are aligned:
  // translateX = - (startIndex - renderStart) * slideWidth
  const offset = - (startIndex - renderStart) * slideWidthPx();
  track.style.transition = 'none';
  track.style.transform = `translateX(${offset}px)`;

  // update button disabled state
  prevBtn.disabled = startIndex === 0;
  nextBtn.disabled = startIndex >= (allImages.length - visibleCount);
}

/* ---------- Navigation (animated) ---------- */
function goNext() {
  if (isAnimating) return;
  if (startIndex >= allImages.length - visibleCount) return;
  isAnimating = true;

  // Calculate current and target offset
  const renderStart = Math.max(0, startIndex - buffer);
  const currentOffset = - (startIndex - renderStart) * slideWidthPx();
  const targetOffset = currentOffset - slideWidthPx();

  // animate
  track.style.transition = 'transform 320ms ease';
  track.style.transform = `translateX(${targetOffset}px)`;

  track.addEventListener('transitionend', function handler() {
    track.removeEventListener('transitionend', handler);
    startIndex = Math.min(allImages.length - visibleCount, startIndex + 1);
    isAnimating = false;
    renderSlides();
  }, { once: true });
}

function goPrev() {
  if (isAnimating) return;
  if (startIndex <= 0) return;
  isAnimating = true;

  const renderStart = Math.max(0, startIndex - buffer);
  const currentOffset = - (startIndex - renderStart) * slideWidthPx();
  const targetOffset = currentOffset + slideWidthPx();

  track.style.transition = 'transform 320ms ease';
  track.style.transform = `translateX(${targetOffset}px)`;

  track.addEventListener('transitionend', function handler() {
    track.removeEventListener('transitionend', handler);
    startIndex = Math.max(0, startIndex - 1);
    isAnimating = false;
    renderSlides();
  }, { once: true });
}

/* ---------- Lightbox (reuse your existing UI) ---------- */
function openLightbox(index) {
  lightboxIndex = index;
  lbImg.src = allImages[index];
  lightbox.style.display = 'flex';
}
function closeLightbox() {
  lightbox.style.display = 'none';
  lightboxIndex = null;
}
function lbPrevFn() {
  if (lightboxIndex === null) return;
  lightboxIndex = (lightboxIndex - 1 + allImages.length) % allImages.length;
  lbImg.src = allImages[lightboxIndex];
}
function lbNextFn() {
  if (lightboxIndex === null) return;
  lightboxIndex = (lightboxIndex + 1) % allImages.length;
  lbImg.src = allImages[lightboxIndex];
}

/* ---------- Events ---------- */
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', lbPrevFn);
lbNext.addEventListener('click', lbNextFn);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// keyboard navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') goNext();
  if (e.key === 'ArrowLeft') goPrev();
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowUp' && lightboxIndex !== null) lbPrevFn();
  if (e.key === 'ArrowDown' && lightboxIndex !== null) lbNextFn();
});

// on resize recalc visibleCount and rerender (debounced)
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const newVisible = computeVisibleCount();
    if (newVisible !== visibleCount) {
      visibleCount = newVisible;
      // clamp startIndex so last visible fits
      startIndex = clamp(startIndex, 0, Math.max(0, allImages.length - visibleCount));
    }
    renderSlides();
  }, 120);
});

/* ---------- Initialize ---------- */
renderSlides();

/* ---------- Helper: append images later (useful for lazy fetching) ----------
   If you fetch more images later from server, call:
     appendImages([ 'images/pic21.jpg', 'images/pic22.jpg' ]);
   That will add them to allImages and re-enable next button automatically.
*/
function appendImages(urls) {
  allImages.push(...urls);
  renderSlides();
}
