// Simple gallery and lightbox for the Projects page
(function(){
  const images = [
    { src: '../images/steam-1.svg', caption: 'Completed model with polished flywheel' },
    { src: '../images/steam-2.svg', caption: 'Close-up of the valve gear and crosshead' },
    { src: '../images/steam-3.svg', caption: 'Assembly stage showing bearings and crank' }
  ];

  const mainImage = document.getElementById('mainImage');
  const thumbs = Array.from(document.querySelectorAll('.thumb'));
  const lb = document.getElementById('projectLightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const openGallery = document.getElementById('openGallery');
  const openGalleryBtn = document.getElementById('openGalleryBtn');

  let current = 0;

  function setMain(index){
    const item = images[index];
    mainImage.src = item.src;
    mainImage.alt = item.caption;
    thumbs.forEach(t => t.classList.remove('active'));
    const t = thumbs.find(x => Number(x.dataset.index) === index);
    if(t) t.classList.add('active');
    current = index;
  }

  thumbs.forEach(t => t.addEventListener('click', () => {
    setMain(Number(t.dataset.index));
  }));

  function openLightbox(index){
    lbImage.src = images[index].src;
    lbImage.alt = images[index].caption;
    lbCaption.textContent = images[index].caption;
    lb.setAttribute('aria-hidden','false');
    lb.style.display = 'flex';
    current = index;
  }

  function closeLightbox(){
    lb.setAttribute('aria-hidden','true');
    lb.style.display = 'none';
    lbImage.src = '';
    lbCaption.textContent = '';
  }

  function next(){
    const idx = (current + 1) % images.length;
    openLightbox(idx);
  }
  function prev(){
    const idx = (current - 1 + images.length) % images.length;
    openLightbox(idx);
  }

  // wire up buttons
  if(openGallery) openGallery.addEventListener('click', () => openLightbox(current));
  if(openGalleryBtn) openGalleryBtn.addEventListener('click', () => openLightbox(current));
  if(lbClose) lbClose.addEventListener('click', closeLightbox);
  if(lbPrev) lbPrev.addEventListener('click', prev);
  if(lbNext) lbNext.addEventListener('click', next);

  // keyboard
  document.addEventListener('keydown', (e) => {
    if(lb.getAttribute('aria-hidden') === 'false'){
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowRight') next();
      if(e.key === 'ArrowLeft') prev();
    }
  });

  // initialize
  setMain(0);
})();
