# 🎮 Catálogo de Videojuegos (PS4 / PS5 / Switch)

Proyecto web para visualizar catálogos de videojuegos organizados por consola, con soporte para:

* 📱 Catálogo optimizado para WhatsApp (PDF)
* 🌐 Catálogo web interactivo con buscador, filtros y modal
* 📂 Organización por múltiples catálogos (catalog1, catalog2, etc.)

---

## 🌍 Demo online

Puedes ver el proyecto funcionando aquí:

🔗 https://cmorenot.github.io/catalog

---

## 🚀 Demo local

Ejecuta el servidor desde la raíz del proyecto:

```bash id="bn9aao"
python -m http.server 8000
```

Luego abre:

```id="x0wvba"
http://localhost:8000
```

---

## 🧠 Estructura del proyecto

```id="osw8pl"
PROYECTO/
│
├── index.html                # 🌍 Hub global (selección de consola)
│
├── assets/                   # 🎨 Recursos globales
│   ├── css/
│   ├── js/
│   └── images/
│
├── sony-ps4/
│   ├── index.html            # Selector de catálogos PS4
│   ├── catalog1/
│   ├── catalog2/
│   └── catalogN/
│
├── sony-ps5/
│   └── index.html
│
├── nintendo-switch/
│   └── index.html
│
└── scripts/                  # 🐍 Scripts Python
    ├── generar_catalogo_web.py
    └── generar_pdf_whatsapp.py
```

---

## ⚙️ Funcionalidades

### 🌐 Catálogo Web

* Grid responsive (PC + móvil)
* Scroll infinito (chunks JSON)
* Buscador en tiempo real
* Filtro por géneros
* Modal con:

  * descripción
  * rating
  * metacritic
  * plataformas
  * imagen HD

---

### 📱 Catálogo WhatsApp (PDF)

* Generación automática con Python
* Imágenes optimizadas (bajo peso)
* Diseño en cuadrícula
* Fondo oscuro estilo catálogo

---

### 🧠 Optimización

* Uso de `chunks` para mejorar rendimiento
* Imágenes separadas:

  * `images/` (HD)
  * `optimized_wa/` (ligero)
* JSON indexado

---

## 🐍 Scripts disponibles

### Generar catálogo web

```bash id="ciwfhn"
python generar_catalogo_web.py
```

Genera:

* `index.html`
* `app.js`
* `data/index.json`
* `data/chunks/page_X.json`

---

### Generar catálogo PDF (WhatsApp)

```bash id="wwgdvl"
python generar_pdf_whatsapp.py
```

Salida:

```id="8sk5mr"
catalogo_web/catalogo_whatsapp.pdf
```

---

## 📦 Requisitos

* Python 3.x
* Librerías:

  * reportlab

Instalación:

```bash id="3foage"
pip install reportlab
```

---

## ⚠️ Notas importantes

* Ejecutar siempre el servidor desde la **raíz del proyecto**
* Evitar rutas absolutas (`/`) → usar rutas relativas
* Recomendado no usar espacios en nombres de carpetas

---

## 💡 Roadmap (ideas futuras)

* 🔄 Generación automática de catálogos
* 🌍 Deploy web (Netlify / Vercel)
* 🎮 Soporte para más plataformas (Xbox, PC)
* 🧠 Buscador global entre consolas
* 📊 Estadísticas de juegos

---

## 👨‍💻 Autor

Proyecto desarrollado por Carlos Moreno 🚀

---

## ⭐ Si te sirve...

Dale una estrella al repo 😉

