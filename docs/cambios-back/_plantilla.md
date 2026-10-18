# CB-NNN: <título corto>

| Campo | Valor |
|-------|-------|
| **Criticidad** | 🔴 **ALTA** (todo cambio en el back) |
| **Estado** | ⏳ Pendiente de autorización · ✅ Autorizado · 🚀 Aplicado · ↩️ Revertido · ❌ Rechazado |
| **Solicitado por** | <persona o agente> · <fecha> |
| **Feature / HU** | `specs/NNN-…` · HU__ |
| **Migración** | `supabase/migrations/<timestamp>_cb_nnn_<titulo>.sql` |

## Motivo

<!-- Qué necesidad de la spec o de la HU lo exige y por qué no se resuelve en el front. -->

## Cambio propuesto (SQL exacto)

```sql
-- …
```

## Impacto

<!-- Tablas, roles y pantallas afectadas; efecto sobre los datos existentes y sobre producción (Netlify). -->

## Riesgos

<!-- Qué podría salir mal (seguridad, datos, disponibilidad). -->

## Reversión (SQL exacto)

```sql
-- …
```

## Pruebas

- [ ] Probado en Supabase local (`supabase start` + `db reset`), si aplica
- [ ] Verificación posterior (consulta de solo lectura o prueba en la app):

## ✅ Check de autorización (obligatorio antes de ejecutar)

- [ ] **Autorizado por**: ______________________ · **Fecha**: __________ · **Medio** (chat/PR): ________

> Sin esta casilla marcada por una persona responsable del back, **no se ejecuta**.

## Ejecución

- **Aplicado por**: ________ · **Fecha**: ________ · **Comando/medio**: ________
- **Resultado**:
- [ ] `docs/supabase-esquema-actual.md` actualizado
- [ ] `npm run gen:types` ejecutado
- [ ] Specs afectadas actualizadas
- [ ] `CHANGELOG.md` con `[CRITICIDAD ALTA]`
