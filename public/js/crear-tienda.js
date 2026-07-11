document.getElementById('formCrearTienda').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('formError');
  errorEl.textContent = '';

  const body = {
    nombre: document.getElementById('nombre').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim(),
    categoria: document.getElementById('categoria').value,
    descripcion: document.getElementById('descripcion').value.trim(),
    password: document.getElementById('password').value
  };

  try {
    const res = await fetch('/api/tiendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'No se pudo crear la tienda';
      return;
    }
    localStorage.setItem(`token_${data.tienda.slug}`, data.token);
    window.location.href = `/admin/${data.tienda.slug}`;
  } catch {
    errorEl.textContent = 'Error de conexión, intenta de nuevo';
  }
});
