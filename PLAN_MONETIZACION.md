# Plan: medir, crecer y sacar rendimiento a Regalitos

Estado actual (27 nov 2026): 7 usuarios visibles, 25 regalos, app pública en `regalos.elchuloflaco.org`, sin cuentas reales, sin métricas, sin pagos. Quedan ~4 semanas hasta Navidad: es la única ventana del año en la que el producto tiene demanda natural, así que el plan está ordenado por "qué se puede shipear antes del 20 de diciembre".

---

## 0. Diagnóstico honesto antes de elegir el modelo

Lo que hoy impide monetizar no es la falta de usuarios, son tres cosas:

1. **No hay identidad.** Cualquiera elige "Alex" y sube regalos en su nombre. Sin cuentas no hay retención, ni límites por plan, ni forma de cobrar.
2. **No hay lista compartible.** La app es un mural familiar cerrado. Un invitado no puede ver "la lista de Paola" con un link, que es el caso de uso que hace crecer una wishlist (y el que un comercio pagaría).
3. **No hay analítica.** No sabés si alguien vuelve, cuántos regalos se crean por visita, ni si los enlaces que la gente pega son de una tienda concreta.

Sin resolver eso, cualquier monetización es prematura. Con eso resuelto, hay tres vías reales y una trampa.

---

## 1. Qué medir (semana 1)

Nada de Google Analytics ni píxeles: datos propios, en tu Mongo, y una vista simple.

### Modelo de eventos

Colección `events`, un documento por acción:

```json
{
  "type": "visit | user_selected | gift_created | gift_viewed | comment_added | link_clicked | share_clicked | reservation_created",
  "userId": "…",  "giftId": "…",  "sessionId": "uuid anónimo",
  "meta": { "url": "…", "host": "amazon.es", "source": "home|profile|share" },
  "country": "ES", "device": "mobile|desktop",
  "ts": "2026-11-27T18:00:00Z"
}
```

Reglas: sin IP, sin cookies de terceros, `sessionId` en memoria (se pierde al cerrar pestaña). Se agrega en el backend en las rutas existentes (`/api/gifts`, `/interact`, `/comments`) y con un `POST /api/events` para `visit`, `link_clicked` y `share_clicked`.

### KPIs que importan

| KPI | Por qué |
|---|---|
| WAU (usuarios que vuelven en 7 días) | Es la única señal de que el producto sirve más allá de una tarde |
| Regalos creados / usuario activo | Mide profundidad de uso; < 2 indica que subir cuesta |
| Comentarios y likes / regalo | Mide si hay vida social, que es lo que engancha |
| CTR de enlaces en comentarios | Es tu inventario publicitario real |
| Compras por regalo (cuando exista reserva) | Base para premium y afiliados |
| Retención semana a semana | Decide si invertir en marketing o no |

### Panel

Una página `/admin` (protegida con HTTP Basic o Cloudflare Access) con 6 números: visitas, usuarios activos, regalos, comentarios, clics en enlaces, reservas. Nada más. Se lee en 5 segundos.

**Esfuerzo:** 4–6 h. **Decisión que habilita:** saber si el resto del plan tiene sentido.

---

## 2. Producto mínimo para que haya negocio (semanas 1–2)

Por orden de impacto:

1. **Lista pública por usuario** (`/l/paola`): modo "solo lectura" para abuelos/tíos que no van a crearse cuenta. Es el motor de crecimiento: cada lista compartida trae 3–5 visitas nuevas.
2. **Reserva de regalo** ("ya lo compré"): el comprador lo marca y el dueño no lo ve. Elimina el problema número uno de toda wishlist: regalos repetidos. **Esta es la función por la que alguien pagaría.**
3. **Cuentas ligeras**: magic link por email (sin contraseñas) o Google. Migrar los usuarios actuales manteniendo sus regalos.
4. **Enriquecimiento de enlaces**: al pegar una URL, traer título, imagen y precio (Open Graph). Mejora la ficha y es el prerequisite técnico de los afiliados.
5. **Avisos**: email o WhatsApp cuando alguien comenta o reserva un regalo tuyo.

**Esfuerzo:** 3–5 días. Sin esto, ni afiliados ni premium funcionan.

---

## 3. Vías de monetización, de más viable a menos

### A. Afiliados en los enlaces de regalo — la más rápida

La gente ya pega links de Zara Home, El Corte Inglés, Amazon, Hoka. Se reescriben con tu tag de afiliado y cobrás comisión si compran.

- Programas: Amazon Afiliados (tag ES, 1–4 %), Awin/Tradedoubler (El Corte Inglés, Zara vía Awin, ~3–8 %), AliExpress.
- Requisito legal: avisar que son enlaces de afiliado (una línea al pie).
- **Realidad numérica:** 500 usuarios activos × 3 regalos × 30 % que clickea × 2 % que compra × 40 € de ticket × 4 % = **~14 €/mes**. No es un negocio, es calderilla… salvo que las listas se compartan mucho (más visitas, mismo inventario).

**Veredicto:** implementarlo sí (2 h), pero no planificar en base a esto.

### B. Premium para eventos — la que mejor encaja

Navidad es una vez al año; los cumpleaños, bodas, baby showers y amigo invisible son todo el año. Freemium:

- Gratis: 1 lista, hasta 15 regalos, sin reservas ilimitadas.
- Premium 9,99 €/año (o 1,99 €/evento): listas ilimitadas, reservas, temas, exportar, avisos por WhatsApp, sin marca.
- Cobro con Stripe Checkout (10 min de integración) y un `plan` en el usuario.

**Realidad:** con 300 usuarios y 3 % de conversión son 90 €/año. Otra vez: solo tiene sentido si el producto deja de ser "la app de mi familia" y apunta a eventos.

### C. B2B: wishlist para comercios — la de mayor techo

Una tienda pequeña (juguetería, decoración, óptica) paga 29–79 €/mes por un widget "crea tu lista de deseos" con su catálogo y su marca. Vendes el software, no la audiencia. Requiere: multi-tenant, panel para la tienda, facturación, soporte. **3–6 semanas de trabajo y venta puerta a puerta.**

**Realidad:** 5 tiendas × 49 €/mes = 245 €/mes. Es el único escenario con números interesantes, y es un negocio de ventas, no de código.

### D. La trampa: publicidad display

Con este volumen no cubre ni el café, exige banner de consentimiento (GDPR), empeora la experiencia y espanta a las familias. Descartar hasta tener decenas de miles de visitas/mes.

---

## 4. Plan de 4 semanas (antes de Navidad)

| Semana | Entregable | Criterio de éxito |
|---|---|---|
| 1 (27 nov–4 dic) | Eventos + panel `/admin`; lista pública compartible | Sabés cuántos vuelven y cuántos regalos crean |
| 2 (5–11 dic) | Reserva de regalos + cuentas ligeras + enriquecimiento de links | 1 de cada 3 regalos tiene link de tienda |
| 3 (12–18 dic) | Afiliados activos + avisos por email + política de privacidad y aviso de afiliados | Primer clic afiliado registrado |
| 4 (19–25 dic) | Pulido, rendimiento, y encuesta de 1 pregunta a los usuarios | Saber si lo usarían en cumpleaños |

**Después de Navidad (enero):** con los números en la mano, decidir entre B (premium de eventos) y C (B2B). No antes: sin datos, cualquier elección es una corazonada.

---

## 5. Decisiones que necesito de vos

1. **¿Cuentas reales o seguimos con "elige quién sos"?** Sin cuentas, premium y B2B quedan bloqueados.
2. **¿Español only o multi-idioma?** Cambia el alcance de afiliados (Amazon ES vs. programs internacionales).
3. **¿Cuánto tiempo semanal podés dedicarle?** Si son 2 h, el plan es solo A + analítica; si son 10 h, entramos en B.

---

## 6. Riesgos y deuda técnica a resolver en paralelo

- **Imágenes en base64 dentro de Mongo**: 25 regalos ya ocupan 1,5 MB de dump; con 500 usuarios esto no escala. Mover a disco/S3 y guardar solo la URL. (Necesario antes de crecer.)
- **Sin autenticación**: hoy cualquiera borra regalos ajenos. Con cuentas se resuelve; mientras tanto, límite de escritura por sesión.
- **GDPR**: política de privacidad, base legal para analítica propia (interés legítimo, datos agregados), retención de eventos 12 meses, y consentimiento solo si añadís cookies de terceros.
- **Un solo VPS sin staging**: un error de deploy tumba la app en plena Navidad. Al menos un `docker-compose.staging` o un healthcheck que revierta.
- **Backups**: ya hay cron diario (30 días). Añadir copia semanal fuera del VPS (Backblaze B2 o similar, ~1 €/mes).
