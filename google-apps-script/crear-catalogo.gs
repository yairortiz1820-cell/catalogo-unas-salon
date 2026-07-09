// ============================================================
// CATÁLOGO JOYAS ESMERALDAS — Google Apps Script
// Versión: 1.0
//
// INSTRUCCIONES PARA USAR:
// 1. Abre script.google.com e inicia sesión con tu cuenta Google
// 2. Crea un proyecto nuevo (botón "Nuevo proyecto")
// 3. Borra todo el código que aparece y pega este archivo completo
// 4. Edita los valores en la sección CONFIGURACIÓN (abajo)
// 5. En el menú desplegable junto al botón "Ejecutar", selecciona: crearCatalogo
// 6. Haz clic en el botón azul "Ejecutar"
// 7. Acepta los permisos que pide Google (es seguro, es tu propio script)
// 8. Espera 1-3 minutos mientras crea las diapositivas
// 9. ¡Listo! La presentación aparece en tu Google Drive
// ============================================================


// ============================================================
// CONFIGURACIÓN — Edita estos valores antes de ejecutar
// ============================================================

var NOMBRE_NEGOCIO = "Joyas Esmeraldas";
var WHATSAPP       = "+57 300 123 4567";   // Tu número real con código de país
var EMAIL          = "joyas@ejemplo.com";  // Tu correo real
var INSTAGRAM      = "@joyas_esmeraldas";  // Tu usuario de Instagram
var CIUDAD         = "Colombia";

// URL base donde están las imágenes (tu dominio de Vercel o el tuyo propio)
// No pongas "/" al final
var BASE_URL = "https://catalogo-unas-salon.vercel.app/joyas";


// ============================================================
// DATOS DEL CATÁLOGO
// Puedes editar nombres, descripciones y precios aquí.
// ============================================================

var JOYAS = [
  {
    archivo: "80cd5d93-23436.jpg",
    nombre:  "Anillo Solitario con Halo de Esmeralda",
    desc:    "Plata de ley · Halo de diamantes · Esmeralda redonda central",
    precio:  "$ 280.000 COP",
    cat:     "Anillos"
  },
  {
    archivo: "e231a8fb-23443.jpg",
    nombre:  "Conjunto Floral — Aretes + Dije",
    desc:    "Plata 925 · Diseño de flor · Esmeralda central · Set completo",
    precio:  "$ 195.000 COP",
    cat:     "Conjuntos"
  },
  {
    archivo: "26726db6-23438.jpg",
    nombre:  "Pulsera Triple Estación con Esmeraldas",
    desc:    "Plata 925 · 3 estaciones · Esmeraldas y diamantes",
    precio:  "$ 245.000 COP",
    cat:     "Pulseras"
  },
  {
    archivo: "511f312e-23425.jpg",
    nombre:  "Aretes Lazo en Plata 925",
    desc:    "Plata 925 · Diseño moño/lazo · Esmeralda incrustada",
    precio:  "$ 125.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "cebbce1a-23408.jpg",
    nombre:  "Anillo Gota Chevron Oro 18K",
    desc:    "Oro 18K · Esmeralda pera · Diseño chevron moderno",
    precio:  "$ 320.000 COP",
    cat:     "Anillos"
  },
  {
    archivo: "8a969cee-23405.jpg",
    nombre:  "Anillo Gota Chevron Oro 18K — Vista Perfil",
    desc:    "Oro 18K · Misma pieza vista de perfil · Esmeralda pera",
    precio:  "$ 320.000 COP",
    cat:     "Anillos"
  },
  {
    archivo: "451d06e2-23422.jpg",
    nombre:  "Dije Minimalista Baguette Oro 18K",
    desc:    "Oro 18K · Esmeralda baguette · Diseño minimalista",
    precio:  "$ 175.000 COP",
    cat:     "Dijes"
  },
  {
    archivo: "c5b83988-23424.jpg",
    nombre:  "Aretes Corazón Calado Plata 925",
    desc:    "Plata 925 · Corazón calado · Esmeralda central",
    precio:  "$ 145.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "d7fa7672-23419.jpg",
    nombre:  "Aretes Corazón Abierto con Diamantes",
    desc:    "Plata 925 · Corazón abierto · Esmeralda + diamantes",
    precio:  "$ 165.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "2cfbd043-23411.jpg",
    nombre:  "Aretes Flor Tejida Plata 925",
    desc:    "Plata 925 · Flor tejida artesanal · Esmeralda central",
    precio:  "$ 135.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "e70f5179-23409.jpg",
    nombre:  "Aretes Corona Plata 925",
    desc:    "Plata 925 · Diseño corona · Presentación en caja de regalo",
    precio:  "$ 130.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "a9bd3158-23407.jpg",
    nombre:  "Conjunto Halo — Aretes + Dije",
    desc:    "Plata 925 · Diseño halo · Set aretes y colgante incluidos",
    precio:  "$ 215.000 COP",
    cat:     "Conjuntos"
  },
  {
    archivo: "84625bde-23417.jpg",
    nombre:  "Aretes Corona — Edición Clásica",
    desc:    "Plata 925 · Diseño corona · Presentación en caja negra de lujo",
    precio:  "$ 130.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "2c5530dc-23403.jpg",
    nombre:  "Aretes Solitario Oro 18K — 2 Tamaños",
    desc:    "Oro 18K · Esmeralda redonda · Disponible en tamaño pequeño y mediano",
    precio:  "$ 185.000 COP",
    cat:     "Aretes"
  },
  {
    archivo: "d9fadf81-23399.jpg",
    nombre:  "Colección de Dijes Oro 18K",
    desc:    "Oro 18K · Múltiples formas · Esmeraldas colombianas · Consulta disponibilidad",
    precio:  "$ 155.000 COP",
    cat:     "Dijes"
  }
];


// ============================================================
// COLORES DEL TEMA (valores entre 0 y 1)
// Puedes ajustarlos si quieres cambiar la paleta de colores.
// ============================================================

var C_FONDO    = { r: 0.039, g: 0.059, b: 0.039 }; // #0A0F0A — verde muy oscuro
var C_VERDE    = { r: 0.322, g: 0.718, b: 0.533 }; // #52B788 — esmeralda
var C_VD_OSC   = { r: 0.176, g: 0.416, b: 0.310 }; // #2D6A4F — verde oscuro
var C_ORO      = { r: 0.788, g: 0.659, b: 0.298 }; // #C9A84C — dorado
var C_TEXTO    = { r: 0.910, g: 0.961, b: 0.914 }; // #E8F5E9 — blanco suave
var C_GRIS     = { r: 0.620, g: 0.720, b: 0.630 }; // gris claro


// ============================================================
// FUNCIÓN PRINCIPAL
// Esta es la función que debes ejecutar.
// ============================================================

function crearCatalogo() {
  Logger.log("Iniciando creación del catálogo...");

  // Crear la presentación
  var pres = SlidesApp.create(NOMBRE_NEGOCIO + " — Catálogo de Joyas");

  // Eliminar la diapositiva vacía inicial
  pres.getSlides()[0].remove();

  // Dimensiones de la presentación
  var W = pres.getPageWidth();
  var H = pres.getPageHeight();

  // 1. Portada
  crearPortada(pres, W, H);
  Logger.log("Portada creada.");

  // 2. Una diapositiva por joya
  for (var i = 0; i < JOYAS.length; i++) {
    crearDiapositivaJoya(pres, JOYAS[i], i + 1, W, H);
    Logger.log("Joya " + (i + 1) + "/" + JOYAS.length + ": " + JOYAS[i].nombre);
    Utilities.sleep(200); // Pequeña pausa para no saturar la API
  }

  // 3. Diapositiva de contacto final
  crearContacto(pres, W, H);
  Logger.log("Diapositiva de contacto creada.");

  // Mostrar URL de la presentación creada
  var url = pres.getUrl();
  Logger.log("==============================================");
  Logger.log("CATÁLOGO LISTO: " + url);
  Logger.log("==============================================");

  // Mostrar mensaje emergente con la URL
  Browser.msgBox(
    "✅ Catálogo creado exitosamente",
    "Tu catálogo de " + JOYAS.length + " piezas está listo.\n\nURL:\n" + url +
    "\n\nPara compartirlo:\n1. Abre la presentación\n2. Clic en 'Compartir'\n3. 'Cualquier persona con el enlace'\n4. Copia el enlace",
    Browser.Buttons.OK
  );
}


// ============================================================
// PORTADA
// ============================================================

function crearPortada(pres, W, H) {
  var slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(C_FONDO.r, C_FONDO.g, C_FONDO.b);

  // Líneas decorativas horizontales
  addLine(slide, W * 0.05, H * 0.08, W * 0.95, H * 0.08, C_VERDE, 1.2);
  addLine(slide, W * 0.05, H * 0.92, W * 0.95, H * 0.92, C_VERDE, 1.2);
  // Líneas secundarias
  addLine(slide, W * 0.05, H * 0.10, W * 0.95, H * 0.10, C_VD_OSC, 0.5);
  addLine(slide, W * 0.05, H * 0.90, W * 0.95, H * 0.90, C_VD_OSC, 0.5);

  // Etiqueta superior
  addText(slide, "COLECCIÓN EXCLUSIVA · ESMERALDAS COLOMBIANAS",
    W * 0.05, H * 0.26, W * 0.9, 28,
    9, true, false, C_VERDE, SlidesApp.ParagraphAlignment.CENTER);

  // Título principal
  addText(slide, NOMBRE_NEGOCIO,
    W * 0.05, H * 0.33, W * 0.9, H * 0.22,
    52, true, false, C_TEXTO, SlidesApp.ParagraphAlignment.CENTER);

  // Subtítulo en cursiva dorada
  addText(slide, "Piezas artesanales en plata 925 y oro 18K",
    W * 0.1, H * 0.57, W * 0.8, 38,
    14, false, true, C_ORO, SlidesApp.ParagraphAlignment.CENTER);

  // Número de piezas
  addText(slide, JOYAS.length + " piezas disponibles",
    W * 0.3, H * 0.67, W * 0.4, 28,
    10, false, false, C_GRIS, SlidesApp.ParagraphAlignment.CENTER);

  // Contacto
  addText(slide, "📱 " + WHATSAPP + "   ·   " + CIUDAD,
    W * 0.1, H * 0.79, W * 0.8, 28,
    10, false, false, C_GRIS, SlidesApp.ParagraphAlignment.CENTER);
}


// ============================================================
// DIAPOSITIVA DE JOYA
// ============================================================

function crearDiapositivaJoya(pres, joya, num, W, H) {
  var slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(C_FONDO.r, C_FONDO.g, C_FONDO.b);

  // ── Imagen a la izquierda (58% del ancho, altura completa) ──
  var imgUrl = BASE_URL + "/" + joya.archivo;
  try {
    var blob = UrlFetchApp.fetch(imgUrl).getBlob();
    var img = slide.insertImage(blob);
    img.setLeft(0).setTop(0).setWidth(W * 0.58).setHeight(H);
  } catch (e) {
    Logger.log("No se pudo cargar imagen: " + imgUrl + " — " + e.message);
    // Placeholder verde si no carga la imagen
    var rect = slide.insertShape(SlidesApp.ShapeType.RECTANGLE);
    rect.setLeft(0).setTop(0).setWidth(W * 0.58).setHeight(H);
    rect.getFill().setSolidFill(C_VD_OSC.r, C_VD_OSC.g, C_VD_OSC.b);
    addText(slide, "📷 " + joya.archivo,
      W * 0.02, H * 0.45, W * 0.54, 40,
      10, false, false, C_GRIS, SlidesApp.ParagraphAlignment.CENTER);
  }

  // Línea separadora vertical
  addLine(slide, W * 0.61, H * 0.08, W * 0.61, H * 0.92, C_VERDE, 0.8);

  // ── Columna derecha: información ──

  // Marca de agua / nombre
  addText(slide, NOMBRE_NEGOCIO,
    W * 0.63, H * 0.04, W * 0.34, 22,
    8, false, false, C_VD_OSC, SlidesApp.ParagraphAlignment.LEFT);

  // Número e ítem y categoría
  addText(slide, "#" + pad(num) + "  ·  " + joya.cat.toUpperCase(),
    W * 0.63, H * 0.11, W * 0.34, 22,
    8, true, false, C_VERDE, SlidesApp.ParagraphAlignment.LEFT);

  // Nombre de la joya
  addText(slide, joya.nombre,
    W * 0.63, H * 0.19, W * 0.34, H * 0.25,
    18, true, false, C_TEXTO, SlidesApp.ParagraphAlignment.LEFT);

  // Descripción / materiales
  addText(slide, joya.desc,
    W * 0.63, H * 0.46, W * 0.34, H * 0.20,
    11, false, false, C_GRIS, SlidesApp.ParagraphAlignment.LEFT);

  // Precio grande y dorado
  addText(slide, joya.precio,
    W * 0.63, H * 0.68, W * 0.34, 42,
    20, true, false, C_ORO, SlidesApp.ParagraphAlignment.LEFT);

  // Etiqueta "precio aproximado"
  addText(slide, "Precio aproximado · negociable",
    W * 0.63, H * 0.77, W * 0.34, 20,
    8, false, false, C_GRIS, SlidesApp.ParagraphAlignment.LEFT);

  // Línea separadora horizontal inferior
  addLine(slide, W * 0.63, H * 0.83, W * 0.97, H * 0.83, C_VD_OSC, 0.5);

  // WhatsApp al pie
  addText(slide, "💬 " + WHATSAPP,
    W * 0.63, H * 0.86, W * 0.34, 24,
    10, false, false, C_VERDE, SlidesApp.ParagraphAlignment.LEFT);
}


// ============================================================
// DIAPOSITIVA DE CONTACTO FINAL
// ============================================================

function crearContacto(pres, W, H) {
  var slide = pres.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.getBackground().setSolidFill(0.025, 0.040, 0.025);

  // Líneas decorativas
  addLine(slide, W * 0.05, H * 0.08, W * 0.95, H * 0.08, C_VERDE, 1.2);
  addLine(slide, W * 0.05, H * 0.92, W * 0.95, H * 0.92, C_VERDE, 1.2);

  // Encabezado
  addText(slide, "¿TE ENAMORASTE DE ALGUNA PIEZA?",
    W * 0.05, H * 0.17, W * 0.9, 28,
    10, true, false, C_VERDE, SlidesApp.ParagraphAlignment.CENTER);

  // CTA
  addText(slide, "Contáctanos ahora",
    W * 0.05, H * 0.25, W * 0.9, H * 0.17,
    40, true, false, C_TEXTO, SlidesApp.ParagraphAlignment.CENTER);

  // Datos de contacto
  var datos = [
    "📱  WhatsApp: " + WHATSAPP,
    "📧  Email: " + EMAIL,
    "📸  Instagram: " + INSTAGRAM,
    "🌎  " + CIUDAD
  ];
  for (var i = 0; i < datos.length; i++) {
    addText(slide, datos[i],
      W * 0.2, H * 0.46 + i * 0.09 * H, W * 0.6, 28,
      12, false, false, C_GRIS, SlidesApp.ParagraphAlignment.CENTER);
  }

  // Nota de precios
  addText(slide, "Todos los precios son aproximados y negociables. Envíos a todo Colombia.",
    W * 0.1, H * 0.84, W * 0.8, 36,
    9, false, true, C_VD_OSC, SlidesApp.ParagraphAlignment.CENTER);
}


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function addText(slide, texto, left, top, width, height, size, bold, italic, color, align) {
  var box = slide.insertTextBox(texto, left, top, width, height);
  var style = box.getText().getTextStyle();
  style.setFontSize(size).setBold(bold).setItalic(italic);
  style.setForegroundColor(color.r, color.g, color.b);
  box.getText().getParagraphStyle().setParagraphAlignment(align);
  box.getFill().setTransparent();
  box.getBorder().setTransparent();
  return box;
}

function addLine(slide, x1, y1, x2, y2, color, weight) {
  var line = slide.insertLine(SlidesApp.LineCategory.STRAIGHT, x1, y1, x2, y2);
  line.getLineFill().setSolidFill(color.r, color.g, color.b);
  line.setWeight(weight);
  return line;
}

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
