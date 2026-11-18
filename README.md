# Reclamo de Acciones Comerciales

Herramienta para distribuidores con Chess ERP. Detecta los clientes de K+T, Autoservicio, Mayoristas y REF que no están en los listados de las acciones comerciales del book y arma el Excel para reclamar.

Corre dentro del Chess de cada usuario, con su sesión. Solo lee datos y no los envía a ningún lado.

## Archivos

| Archivo | Qué es | ¿Se edita? |
|---|---|---|
| `index.html` | Página pública con el botón para guardar en favoritos | No |
| `config.js` | Códigos "promo compañía" del book del mes | **Sí, cada mes** |
| `rca.js` | La herramienta que se ejecuta en Chess | No |

## Publicar (una sola vez)

1. En GitHub (cuenta DISTRIBUIDORAZUPPA): **New repository** → nombre `reclamo-acciones` → **Public** → Create.
2. **Add file → Upload files** → subí `index.html`, `config.js`, `rca.js` y `README.md` → Commit.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, carpeta `/ (root)` → Save.
4. En 1 o 2 minutos queda en `https://distribuidorazuppa.github.io/reclamo-acciones/`.

Ese es el link para compartir.

## Otras distribuidoras con su propio book

No necesitan GitHub: en el panel dentro de Chess tocan **Subir mi book**, eligen el Excel del book, revisan las familias y guardan. Formatos que lee: "Book Completo" de Cuyo, Central y similares (tipo de acción, código, descripción, canal; si el tipo es ALGOPROMO, la familia se toma de la descripción) y por área (hoja "ACCIONES …": área, tipo de plan, canal, segmento, código compañía, código NO BEES, código BEES, nombre, fechas). Las acciones vencidas se descartan y, si una fila trae varios códigos, se usa el que exista en Chess. Queda guardado en su computadora y reemplaza a los códigos generales. **Usar códigos generales** vuelve a `config.js`.

## Actualizar cuando llega el book nuevo

1. Abrí `config.js` en GitHub → lápiz (Edit).
2. Cambiá los códigos, `book`, `actualizado` y, si hace falta, `nuevoDesde`.
3. Commit. En unos minutos todos los usuarios toman los códigos nuevos con el mismo favorito.

Formato de cada línea: `"308142": "Tier 1"` (código entre comillas, dos puntos, etiqueta). Cuidá las comas entre líneas.
