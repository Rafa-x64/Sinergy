---
trigger: always_on
---

# Reglas de Frontend (Vue.js)
1. Armonía Visual y Estética: Debes crear y consumir componentes base de UI (Ej. `BaseButton`, `BaseCard`, `BaseInput`) para asegurar que todas las vistas tengan el mismo estilo. Está prohibido crear estilos aislados por vista que rompan la coherencia del diseño.
2. Responsividad: Utiliza las clases utilitarias y el sistema de grillas de Bootstrap para garantizar un diseño "mobile-first". Todas las vistas deben adaptarse perfectamente a cualquier resolución.
3. Validaciones en Tiempo Real: Todo formulario debe implementar validación en tiempo real en el cliente utilizando la reactividad de Vue (computed properties, watchers o librerías como VeeValidate), mostrando feedback inmediato al usuario antes del envío.
4. Gestión de Estado: Optimiza el renderizado. Evita ciclos infinitos en los watchers o hooks del ciclo de vida. Limpia siempre los event listeners cuando el componente se desmonte para evitar fugas de memoria.