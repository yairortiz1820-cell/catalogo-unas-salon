const RESERVADOS = new Set(['admin', 'api', 'crear-tienda', 'tienda', 'home', 'uploads', 'public']);

function slugify(texto) {
  return texto
    .toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function sufijoRandom() {
  return Math.random().toString(36).slice(2, 6);
}

async function generarSlugUnico(nombre, TiendaModel) {
  const base = slugify(nombre) || 'tienda';
  let candidato = base;
  let intentos = 0;

  while (intentos < 5) {
    const reservado = RESERVADOS.has(candidato);
    const existe = !reservado && await TiendaModel.findOne({ slug: candidato });
    if (!reservado && !existe) return candidato;
    candidato = `${base}-${sufijoRandom()}`;
    intentos++;
  }
  return `${base}-${Date.now()}`;
}

module.exports = { slugify, generarSlugUnico, RESERVADOS };
