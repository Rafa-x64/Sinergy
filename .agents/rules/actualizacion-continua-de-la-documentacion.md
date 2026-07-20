---
trigger: always_on
---

# Actualización Continua de la Documentación
1. Documentación Síncrona: El código y la documentación deben evolucionar en el mismo commit. Si modificas un endpoint de la API, un payload, o las props de un componente de Vue, estás obligado a actualizar el archivo `.md` correspondiente (como el contrato de la API o el diccionario de componentes) en el mismo paso.
2. Registro de Decisiones Arquitectónicas (ADR): Cuando tomemos una decisión de diseño importante (ej. cambiar el manejador de estado global, elegir un método de encriptación o estructurar la base de datos), debes documentar el "Por qué" se tomó esa decisión, qué alternativas se descartaron y qué trade-offs (compromisos) asumimos.
3. Comentarios en Código Restringidos: Prohibido escribir comentarios que expliquen "qué" hace el código (eso debe ser evidente por los nombres de variables y funciones). Los comentarios solo se usarán para explicar el "por qué" de una lógica inusual, una optimización matemática o un parche temporal (Workaround).