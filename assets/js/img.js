// Carga imágenes por nombre: guarda el archivo como assets/img/<nombre>.(webp|jpg|jpeg|png)
// y aparece solo. Mientras no exista, se muestra un marcador "señal pendiente".
const EXT = ['jpg', 'webp', 'jpeg', 'png'];

function tryLoad(base, name, i = 0) {
  return new Promise((resolve, reject) => {
    if (i >= EXT.length) return reject();
    const img = new Image();
    img.onload = () => resolve(img.src);
    img.onerror = () => tryLoad(base, name, i + 1).then(resolve, reject);
    img.src = `${base}${name}.${EXT[i]}`;
  });
}

export function loadImages(root = document, base = 'assets/img/') {
  root.querySelectorAll('[data-img]').forEach(el => {
    const name = el.dataset.img;
    tryLoad(base, name).then(src => {
      el.classList.add('has-img');
      if (el.tagName === 'IMG') { el.src = src; return; }
      let img = el.querySelector(':scope > img');
      if (!img) { img = document.createElement('img'); img.alt = el.dataset.alt || ''; img.decoding = 'async'; el.prepend(img); }
      img.src = src;
    }, () => {
      el.classList.add('no-img');
      if (!el.querySelector(':scope > .img-pending')) {
        const p = document.createElement('span');
        p.className = 'img-pending';
        p.setAttribute('aria-hidden', 'true');
        p.innerHTML = `<b>Señal pendiente</b><span>${name}</span>`;
        el.append(p);
      }
    });
  });
}
