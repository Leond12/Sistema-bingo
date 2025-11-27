# Bingo local (sin servidor)

Pequeña app de Bingo para uso local (archivo HTML). Contiene dos páginas:

- `index.html` — Juego / tablero (obtener número, activar paquete, notificaciones de ganador).
- `cartillas.html` — Gestión de cartillas y paquetes; generación, import/export JSON, descarga PNG, configuración de patrones y premios.

Cómo usar

1. Abrir `cartillas.html` en el navegador (doble clic sobre el archivo).
2. Crear un nuevo paquete con "Nuevo Paquete".
3. Generar cartillas en el paquete con "Generar en paquete" o "Generar N".
4. En la sección "Patrones y premios" puedes configurar cada patrón (activar/desactivar, premio base, % incremento, umbral de wins).
5. Abrir `index.html` en otra ventana/pestaña del mismo navegador.
6. En `index.html` seleccionar el paquete y hacer clic en "Activar paquete" antes de comenzar.
7. Usar "Obtener número" para sacar números; si una cartilla cumple un patrón configurado verás un modal con la información del ganador y el premio.

Características

- Datos persistidos en `localStorage` bajo la clave `bingo_cartillas_v1`.
- Soporta migración desde el formato antiguo (lista plana de `cartillas`) hacia el nuevo formato con `packages`.
- Exportar/Importar JSON de paquetes.
- Descarga de cartilla individual en PNG y combinada de todas las cartillas.
- Configuración en vivo: los cambios en `cartillas.html` se guardan en `localStorage` y `index.html` los detecta automáticamente (si ambas páginas están abiertas en el mismo origen).

Notas

- Para recibir notificaciones en tiempo real, abre `index.html` y `cartillas.html` en el mismo navegador (diferentes pestañas/ventanas). El evento `storage` se usa para propagar cambios.
- La app está pensada para uso local (sin servidor). Algunas funciones del navegador como `File`/`Blob` funcionan bien desde `file://` en la mayoría de navegadores modernos.

Si quieres, puedo:
- Añadir la visualización del historial de ganadores en `index.html`.
- Añadir sonido o toasts para las notificaciones de ganador.
- Añadir export de historial a CSV/JSON.

