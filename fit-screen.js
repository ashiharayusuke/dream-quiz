(() => {
  const width = 1920, height = 1080;
  const main = document.querySelector('main');
  const question = document.getElementById('question');
  const result = document.getElementById('result');
  let pending = false;
  function fitContent(dialog, selector, top, bottom, contentWidth) {
    if (!dialog.open) return;
    const content = dialog.querySelector(selector);
    content.style.width = contentWidth + 'px';
    content.style.transform = 'none';
    const naturalHeight = Math.max(content.scrollHeight, content.offsetHeight, 1);
    const naturalWidth = Math.max(content.scrollWidth, contentWidth);
    const scale = Math.min(1, (width - 120) / naturalWidth, (height - top - bottom) / naturalHeight);
    content.style.left = ((width - naturalWidth * scale) / 2) + 'px';
    content.style.top = (top + (height - top - bottom - naturalHeight * scale) / 2) + 'px';
    content.style.transform = 'scale(' + scale + ')';
  }
  function fit() {
    pending = false;
    const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
    for (const surface of [main, question, result]) {
      surface.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    }
    fitContent(question, '.question-content', 112, 40, 1760);
    fitContent(result, '#reveal', 48, 48, 1300);
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(fit); }
  }
  const observer = new MutationObserver(schedule);
  for (const dialog of [question, result]) {
    observer.observe(dialog, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['open', 'hidden']});
  }
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  fit();
})();
