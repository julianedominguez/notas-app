# notas-app

App web personal de notas que funciona sin conexión. Las notas se guardan encriptadas en el dispositivo y nunca pasan por este repositorio ni por ningún servidor.

## Seguridad

- Encriptación AES-GCM de 256 bits con clave derivada de la contraseña (PBKDF2-SHA256, 600.000 iteraciones), usando la Web Crypto API del navegador.
- La contraseña no se guarda en ningún lado. Sin ella las notas no se pueden abrir, y no hay forma de recuperarla.
- Se bloquea sola tras 5 minutos sin uso.
- La política de seguridad de contenido impide que la página se conecte a cualquier otro sitio.
- Este repo solo tiene el código. Es público a propósito: la protección está en la encriptación, no en esconder el código.

## Uso

- Android o PC (Chrome o Edge): abrir la dirección y elegir "Instalar app".
- iPhone (Safari): Compartir, "Agregar a pantalla de inicio". Sin esto, Safari puede borrar los datos de una web que no se usa por una semana.
- Cada dispositivo tiene su propia copia. Para pasar notas entre dispositivos: Google Drive, o Menú, "Descargar backup encriptado" en uno y "Restaurar backup encriptado" en el otro.

## Sesiones

- Un mismo dispositivo puede tener varias sesiones, cada una con sus notas, su contraseña y su conexión a Drive (otra cuenta de Google o la misma con otro archivo).
- Se crean desde Menú, "Crear otra sesión". En la pantalla de bloqueo hay un solo campo: la contraseña que pongas decide qué sesión se abre, y no se muestra cuántas hay.
- Cada sesión queda atada a la cuenta de Google con la que conectó Drive. Si al renovar el acceso se elige otra cuenta, la app lo rechaza.
- Para usar una sesión en otro dispositivo, se crea allá con el mismo nombre y se conecta Drive: encuentra su archivo (`notas-app-<nombre>.txt`) y pide su contraseña. La primera sesión usa `notas-app-vault.txt`, como antes.

## Edición

- Cada nota tiene una pestaña con el texto y una pestaña por sección, para leer y editar a pantalla completa.
- Las secciones son de una categoría: Transcripción (texto plano) o las que definas en Menú, "Categorías de secciones" (por ejemplo Resumen o Comentarios), que tienen el mismo formato que la nota. "+ Sección" agrega una pestaña de la categoría que elijas.
- El texto acepta formato: títulos (T1, T2, T3), negrita, cursiva, tachado, viñetas, listas numeradas, tareas, citas y líneas divisorias. Se guarda como Markdown, así que al copiarlo a un chat mantiene la estructura.
- Atajos al escribir: `# ` título, `## ` subtítulo, `- ` viñeta, `1. ` lista, `[ ] ` tarea, `> ` cita.
- Se puede crear una nota desde un archivo .docx (respeta títulos, listas, negrita y cursiva; las tablas quedan como filas de texto) o pegar desde Google Docs y Word.
- Índice de títulos para saltar dentro de notas largas, tamaño de letra ajustable y modo foco que oculta la lista.
- La barra de formato queda siempre fija arriba. La fila de navegación y las pestañas se esconden al bajar o al abrir el teclado, y vuelven al subir.
- Escritura centrada (botón Aa): al tocar o escribir, la pantalla se acomoda para que el cursor quede cerca del medio. Viene activada en el celu.

## Lista de notas

- Arriba: botón de Drive (verde sincronizado, ámbar con cambios sin subir o para reconectar, rojo si falló, gris sin conectar; un toque sincroniza o conecta), lupa con buscador y filtros (etiquetas, año o rango de fechas, notas con cierta sección) y el menú. "Bloquear ahora" es la primera opción del menú.
- Botón + abajo a la derecha para una nota nueva.
- Toque largo en una nota para elegir varias y copiarlas, descargarlas o borrarlas juntas.
- Toque largo en cualquier botón: muestra qué hace, sin ejecutarlo. En el de Drive dice el estado (Sincronizado, Cambios sin subir, Error al sincronizar, etc.) y qué hacer.
- El nombre chico al lado del ícono es la sesión abierta. Solo aparece si en el dispositivo hay más de una sesión.

## Celu

- La fila de navegación se guarda solo cuando el teclado está abierto, y vuelve al cerrarlo.
- El subrayado de errores de ortografía viene apagado en el celu (botón Aa), porque en Android tocar una palabra subrayada abre las sugerencias y cierra el teclado.
- Las notas que quedan completamente vacías se borran solas al salir de ellas, igual que las secciones vacías.

## Copiar o descargar como texto

- Desde una nota o desde el Menú. Se puede elegir una nota, varias marcándolas en una lista con buscador, todas, las de la búsqueda actual, un año o un rango de fechas.
- También qué partes incluir: el texto de la nota y cada categoría de sección por separado.
- Se copia para pegar en un chat o se descarga como .txt. En los dos casos sale sin encriptar.

## Formato de importación

```
=== NOTA ===
titulo: <título>
fecha: <AAAA-MM-DD o vacío>
etiquetas: <etiqueta1, etiqueta2 o vacío>
--- TEXTO ---
<texto de la nota>
--- TRANSCRIPCION: <nombre opcional> ---
<transcripción completa>
--- SECCION: <categoría>: <nombre opcional> ---
<texto de la sección>
```

Los bloques SECCION crean la categoría si no existe.

Las instrucciones completas para que una IA ordene textos en este formato están dentro de la app: Menú, "Importar notas desde texto", "Ver instrucciones para la IA".
