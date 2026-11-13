"""
ACTUALIZAR HUBS
===============
Recalcula los números de las portadas (index.html principal y el de cada consola)
leyendo los catálogos que hay en el repositorio:

  data-n="PS4"      -> juegos de toda la consola      data-n="PS4/2" -> juegos del catálogo 2
  data-tb="PS4/2"   -> tamaño total del catálogo      data-tb="NS"   -> tamaño total de la consola
  data-cats="PS4"   -> cuántos catálogos tiene        data-n="ALL" / data-cats="ALL" -> todo junto
  data-pdf="PS4/2"  -> (en un <a>) apunta al PDF que exista en esa carpeta
  data-mb="PS4/2"   -> peso del PDF en MB

Solo cambia lo que está dentro de esas etiquetas; el resto del diseño no se toca.
Uso:  python .tools/actualizar_hubs.py          (desde cualquier sitio)
"""
import glob
import json
import os
import re
import sys
from urllib.parse import quote

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CONSOLAS = {
    "PS4": "Sony - PlayStation 4",
    "PS5": "Sony - PlayStation 5",
    "NS":  "Nintendo - Nintendo Switch",
}

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def miles(n):
    return f"{n:,}".replace(",", " ")


def tb(gb):
    t = f"{gb / 1000:.1f}"
    return (t[:-2] if t.endswith(".0") else t) + " TB"


# =========================
# LEER CATÁLOGOS
# =========================
def leer():
    datos = {}  # "PS4/1" -> {...}; "PS4" -> totales
    for clave, carpeta in CONSOLAS.items():
        total_n, total_gb, cats = 0, 0.0, 0
        for web in sorted(glob.glob(os.path.join(REPO, carpeta, "catalog*", "catalogo_web"))):
            num = re.sub(r"\D", "", os.path.basename(os.path.dirname(web)))
            idx = os.path.join(web, "data", "index.json")
            if not num or not os.path.exists(idx):
                continue
            with open(idx, encoding="utf-8") as f:
                d = json.load(f)
            juegos = d if isinstance(d, list) else d.get("games", [])
            gb = sum(float(g.get("size") or 0) for g in juegos if isinstance(g, dict))
            pdfs = sorted(glob.glob(os.path.join(web, "*.pdf")), key=os.path.getmtime, reverse=True)
            pdf = pdfs[0] if pdfs else None
            datos[f"{clave}/{num}"] = {
                "n": len(juegos), "gb": gb,
                "pdf": f"catalog{num}/catalogo_web/" + quote(os.path.basename(pdf), safe="()-_.") if pdf else None,
                "mb": round(os.path.getsize(pdf) / 1e6) if pdf else None,
            }
            if len(pdfs) > 1:
                print(f"⚠️  {clave} catálogo {num} tiene {len(pdfs)} PDF; uso el más nuevo: {os.path.basename(pdf)}")
            total_n += len(juegos)
            total_gb += gb
            cats += 1
        datos[clave] = {"n": total_n, "gb": total_gb, "cats": cats}
    datos["ALL"] = {
        "n": sum(datos[c]["n"] for c in CONSOLAS),
        "cats": sum(datos[c]["cats"] for c in CONSOLAS),
    }
    return datos


def valor(tipo, clave, datos):
    d = datos.get(clave)
    if d is None:
        return None
    if tipo == "n":
        return miles(d["n"])
    if tipo == "tb":
        return tb(d["gb"]) if "gb" in d else None
    if tipo == "cats":
        return str(d.get("cats")) if "cats" in d else None
    if tipo == "mb":
        return str(d["mb"]) if d.get("mb") is not None else None
    return None


# =========================
# REESCRIBIR HTML
# =========================
RE_TEXTO = re.compile(r'(<(\w+)\b[^>]*\sdata-(n|tb|cats|mb)="([^"]+)"[^>]*>)([^<]*)(</\2>)')
RE_PDF = re.compile(r'<a\b[^>]*\sdata-pdf="([^"]+)"[^>]*>')


def procesar(ruta, datos, avisos):
    with open(ruta, encoding="utf-8", newline="") as f:
        txt = f.read()
    cambios = []

    def sub_texto(m):
        nuevo = valor(m.group(3), m.group(4), datos)
        if nuevo is None:
            avisos.add(f"data-{m.group(3)}=\"{m.group(4)}\" no corresponde a ningún catálogo")
            return m.group(0)
        if nuevo != m.group(5):
            cambios.append(f"{m.group(3)} {m.group(4)}: {m.group(5)} → {nuevo}")
        return m.group(1) + nuevo + m.group(6)

    def sub_pdf(m):
        tag, clave = m.group(0), m.group(1)
        d = datos.get(clave)
        if not d or not d.get("pdf"):
            avisos.add(f"{clave}: no hay PDF en la carpeta")
            return tag
        viejo = re.search(r'\shref="([^"]*)"', tag)
        if viejo and viejo.group(1) != d["pdf"]:
            cambios.append(f"pdf {clave}: {viejo.group(1)} → {d['pdf']}")
        tag = re.sub(r'\shref="[^"]*"', f' href="{d["pdf"]}"', tag)
        tag = re.sub(r'\stitle="Descargar PDF[^"]*"', f' title="Descargar PDF ({d["mb"]} MB)"', tag)
        if not re.search(r'\sdownload\b', tag):
            tag = tag.replace(" href=", " download href=", 1)
        return tag

    txt2 = RE_PDF.sub(sub_pdf, RE_TEXTO.sub(sub_texto, txt))
    if txt2 != txt:
        with open(ruta, "w", encoding="utf-8", newline="") as f:
            f.write(txt2)
    # catálogos sin tarjeta en el hub de su consola
    return cambios, txt2


def main():
    datos = leer()
    avisos = set()
    tocados = []
    hubs = [("index.html", None)] + [(os.path.join(c, "index.html"), k) for k, c in CONSOLAS.items()]

    print("📊 Catálogos encontrados:")
    for k in CONSOLAS:
        partes = [f"{c.split('/')[1]}: {datos[c]['n']}" for c in sorted(datos) if c.startswith(k + "/")]
        print(f"   {k}: {miles(datos[k]['n'])} juegos  ({', '.join(partes)})")
    print(f"   TOTAL: {miles(datos['ALL']['n'])} juegos en {datos['ALL']['cats']} catálogos\n")

    for rel, consola in hubs:
        ruta = os.path.join(REPO, rel)
        if not os.path.exists(ruta):
            continue
        cambios, txt = procesar(ruta, datos, avisos)
        if consola:
            for c in sorted(datos):
                if c.startswith(consola + "/") and f'data-n="{c}"' not in txt and f'data-pdf="{c}"' not in txt:
                    avisos.add(f"{c} existe pero no tiene tarjeta en «{rel}» (hay que añadirla a mano)")
        if cambios:
            tocados.append(rel.replace("\\", "/"))
            print(f"✏️  {rel}")
            for c in cambios:
                print(f"     {c}")

    if not tocados:
        print("✅ Los números ya estaban al día.")
    for a in sorted(avisos):
        print(f"⚠️  {a}")
    return tocados


if __name__ == "__main__":
    main()
