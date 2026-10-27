/* ============================================================
   RECLAMO DE ACCIONES COMERCIALES — CÓDIGOS DEL MES
   Editá solo este archivo cuando llegue el book nuevo.
   - nuevoDesde: fecha de alta desde la cual un cliente cuenta como "nuevo" (AAAA-MM-DD).
   - obligatorias: familias que definen el estado del cliente.
   - fam: para cada canal (K+T, AS, MAY, REF) y familia, los códigos "promo compañía" del book
     con la etiqueta que se muestra ("código": "etiqueta").
     Si un canal no tiene una familia, no se le exige (aparece como "—").
   Book de referencia: 2026.10 Book y Acciones CUYO
   ============================================================ */
window.__RCA_CFG = {
  "actualizado": "2026-10-27",
  "book": "Cuyo — octubre 2026",
  "nuevoDesde": "2026-05-01",
  "familias": ["CORE", "LATONES", "DROP", "PREMIUM", "RED BULL", "VALUE"],
  "obligatorias": ["CORE", "LATONES", "DROP"],
  "fam": {
    "K+T": {
      "CORE":     { "308142": "Tier 1", "308144": "Tier 2", "318208": "Tier 3" },
      "LATONES":  { "320211": "Escala 1", "307924": "Escala 2" },
      "DROP":     { "320570": "Drop bajo", "320567": "Drop alto" },
      "RED BULL": { "312869": "Drop RB", "319598": "RB listado" },
      "VALUE":    { "320235": "Lata P1-P4", "326393": "Litro P1-P4" }
    },
    "AS": {
      "CORE":     { "308162": "Tier 1", "308229": "Tier 2", "318210": "Tier 3" },
      "LATONES":  { "307926": "Escala 1", "307927": "Escala 2" },
      "DROP":     { "320570": "Drop bajo", "320567": "Drop alto" },
      "RED BULL": { "312847": "Drop RB", "319599": "RB listado" },
      "VALUE":    { "320236": "Lata P1-P4", "326394": "Litro P1-P4" }
    },
    "MAY": {
      "CORE":     { "317960": "Dinámica Core", "327871": "Core coop distri" },
      "LATONES":  { "327803": "Adicional latones" },
      "DROP":     { "280670": "Drop MS", "280733": "Drop TOP" },
      "RED BULL": { "306723": "Drop RB MAY" },
      "VALUE":    { "317961": "Lata", "317962": "Latón", "318860": "Litro" }
    },
    "REF": {
      "CORE":     { "308129": "REF BASE Core" },
      "LATONES":  { "308130": "REF BASE Latones" },
      "PREMIUM":  { "308131": "SA/AO/PAT", "307252": "Corona 330", "320048": "SA PG 330", "320051": "SA PG 473" }
    }
  }
};
