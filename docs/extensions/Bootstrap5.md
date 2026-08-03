# Bootstrap 5 + bootstrap-vue-next

**Paquetes:** `bootstrap@5.3.3` + `bootstrap-vue-next@0.24.14` + `@types/bootstrap@5.2.10`

Bootstrap aporta el sistema de grillas y utilidades CSS secundario. `bootstrap-vue-next` expone esos componentes como componentes Vue reactivos.

**Registro en `main.ts`:**

```typescript
import 'bootstrap/dist/css/bootstrap.min.css'
import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

app.use(createBootstrap())
```

**Uso de componentes en plantillas:**

```vue
<template>
  <BContainer>
    <BRow>
      <BCol cols="12" md="6">
        <BCard title="Inspección" class="shadow-sm">
          <BButton variant="primary">Guardar</BButton>
        </BCard>
      </BCol>
    </BRow>
  </BContainer>
</template>
```
