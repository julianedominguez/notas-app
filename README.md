# TNote (antes notas-app)

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
- Cada dispositivo tiene su propia copia. Para pasar notas entre dispositivos: Google Drive, o el menú de la app (☰), "Descargar backup encriptado" en uno y "Restaurar backup encriptado" en el otro.

## Sesiones

- Un mismo dispositivo puede tener varias sesiones (cuentas), cada una con sus notas, su contraseña y su conexión a Drive (otra cuenta de Google o la misma con otro archivo).
- Se crean desde tu cuenta (el círculo de arriba a la derecha), "Agregar otra cuenta". Al abrir la app, si hay más de una, primero se elige la cuenta y después se entra con su contraseña o con la huella. Si hay una sola, va directo a la contraseña.
- Los nombres de las sesiones quedan a la vista en la pantalla de inicio de ese dispositivo (las notas siguen encriptadas). Las sesiones creadas con versiones anteriores aparecen como "Otra sesión" hasta que se entra una vez.
- Cada sesión queda atada a la cuenta de Google con la que conectó Drive. Si al renovar el acceso se elige otra cuenta, la app lo rechaza.
- Para usar una sesión en otro dispositivo, se crea allá con el mismo nombre y se conecta Drive: encuentra su archivo (`notas-app-<nombre>.txt`) y pide su contraseña. La primera sesión usa `notas-app-vault.txt`, como antes.

## Huella

- Después de entrar con la contraseña, la app ofrece activar la huella para esa cuenta en ese dispositivo (también desde tu cuenta, el círculo de arriba a la derecha). Si se elige "Ahora no", no vuelve a preguntar.
- Usa una llave de acceso del teléfono (WebAuthn con la extensión PRF): al apoyar el dedo, el teléfono entrega un secreto que desencripta una copia de la clave de la bóveda guardada solo en ese dispositivo. Sin la huella esa copia no sirve, y nunca se guarda la contraseña.
- La contraseña sigue siendo la llave principal. Si se cambia (acá, en otro dispositivo o al unir con Drive), la huella se desactiva y se ofrece activarla de nuevo.
- Funciona en Chrome para Android y en iPhone con iOS 18 o posterior; en la PC, con Windows Hello o Touch ID. Si el dispositivo no lo permite, el botón no aparece.
- La llave queda en el administrador de contraseñas del teléfono con el nombre "notas-app · <sesión>".

## Edición

- Cada nota tiene una pestaña con el texto y una pestaña por sección, para leer y editar a pantalla completa.
- Para cambiar el orden de las secciones: toque largo en una pestaña y arrastrarla (con mouse, arrastrar directo). "Nota" queda siempre primera. El orden se guarda en la nota y es el que se usa al copiar o descargar.
- Las secciones son de una categoría: Transcripción o las que definas en el menú de la app (☰), "Categorías de secciones" (por ejemplo Resumen o Comentarios). Todas tienen el mismo formato que la nota. "+ Sección" agrega una pestaña de la categoría que elijas.
- Las transcripciones que estaban en texto plano se abren con cada renglón tal cual. Se guardan con formato recién cuando las editás; hasta entonces se exportan igual que antes.
- Tablas en la nota y en cualquier sección: botón de tabla en la barra de formato. Con el cursor dentro de una tabla, la barra muestra "+ Fila", "+ Columna", "− Fila", "− Columna" y "Quitar tabla". Las tablas anchas se deslizan de costado. Son tablas simples (encabezado, filas y columnas, negrita o cursiva en las celdas): no hay celdas combinadas ni listas dentro de una celda.
- El texto acepta formato: títulos (T1, T2, T3), negrita, cursiva, tachado, viñetas, listas numeradas, tareas, citas y líneas divisorias. Se guarda como Markdown, así que al copiarlo a un chat mantiene la estructura.
- Atajos al escribir: `# ` título, `## ` subtítulo, `- ` viñeta, `1. ` lista, `[ ] ` tarea, `> ` cita.
- Se puede crear una nota desde un archivo .docx (respeta títulos, listas, negrita, cursiva y tablas simples) o pegar desde Google Docs, Word u OneNote. Una tabla con celdas combinadas en vertical o con tablas adentro se pasa a renglones de texto "a | b".
- Índice de títulos para saltar dentro de notas largas, tamaño de letra ajustable y modo foco que oculta la lista.
- En la web y en iPhone la barra de formato queda fija arriba. En Android va abajo, pegada al teclado: aparece solo con el teclado abierto, se desliza de costado y el botón de la derecha la achica a un botón chico (queda recordado).
- La fila de navegación y las pestañas se esconden al bajar o al abrir el teclado, y vuelven al subir.
- Escritura centrada (botón Aa): al tocar o escribir, la pantalla se acomoda para que el cursor quede cerca del medio. Viene activada en el celu.

## Lista de notas

- Arriba, una barra de búsqueda como la de Gmail: ☰ abre el menú de la app, el texto busca en notas y secciones, el ícono de ajustes abre los filtros (etiquetas, año o rango de fechas, notas con cierta sección) y el círculo con la inicial abre tu cuenta.
- Los dos menús laterales se cierran deslizándolos hacia afuera: siguen al dedo, y un gesto rápido alcanza para cerrarlos.
- Menú de la app (☰, o deslizando hacia la derecha sobre la lista): copiar o descargar como texto, nota desde .docx, importar, apariencia, categorías y backups.
- Tu cuenta (el círculo): sincronizar o conectar Drive, bloquear, cambiar de cuenta; seguridad (huella, bloqueo automático de 1 minuto a 1 hora por dispositivo, contraseña); esta cuenta (nombre, desconectar Drive); este dispositivo (agregar otra cuenta). Al final y separado, "Eliminar cuentas o datos…", el único lugar con opciones que borran. El puntito del círculo es el estado de Drive: verde sincronizado, ámbar con cambios sin subir o para reconectar, rojo si falló, gris sin conexión.
- Tirar la lista hacia abajo sincroniza con Drive: el círculo baja con el dedo, gira un momento y se va. Mientras sincroniza, el círculo de la cuenta muestra un aro azul que gira.
- Las notas van separadas por una línea fina, con la fecha corta a la derecha y un rótulo de mes y año que queda pegado arriba al deslizar.
- Botón + abajo a la derecha para una nota nueva. Toque largo en una nota para elegir varias y copiarlas, descargarlas o borrarlas juntas. La barra de selección ocupa el lugar del buscador, así que nada se corre; "Todas" elige solo las notas a la vista (no las de meses plegados).
- Los filtros se abren en una tarjeta debajo del buscador, con "Limpiar filtros" y "Listo".
- Toque largo en cualquier botón: muestra qué hace, sin ejecutarlo.
- La barra de notificaciones toma el color de la pantalla que se está viendo (y se oscurece con un diálogo o un menú abierto).

## Celu

- La fila de navegación se guarda solo cuando el teclado está abierto, y vuelve al cerrarlo.
- El subrayado de errores de ortografía viene apagado en el celu (botón Aa), porque en Android tocar una palabra subrayada abre las sugerencias y cierra el teclado.
- Las notas que quedan completamente vacías se borran solas al salir de ellas, igual que las secciones vacías.


## Apariencia

- Menú de la app (☰), "Tipografía, tamaño de letra y escritura" (o el botón Aa dentro de una nota). Hay ocho letras para elegir, cada una con su vista previa: Clásica, Sistema, Literata, Source Serif, Lora, Inter, Atkinson Hyperlegible y Nunito.
- Las seis últimas vienen con la app en `fonts/` (licencia libre SIL OFL 1.1, ver `fonts/LICENSE-*.txt`). Solo se descarga la que elijas, una vez, y queda guardada para usarla sin conexión.
- La letra, el tamaño, la escritura centrada y el corrector se guardan en cada dispositivo.
## Copiar o descargar como texto

- Desde una nota o desde el menú de la app (☰). Se puede elegir una nota, varias marcándolas en una lista con buscador, todas, las de la búsqueda actual, un año o un rango de fechas.
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

Las instrucciones completas para que una IA ordene textos en este formato están dentro de la app: menú de la app (☰), "Importar notas desde texto", "Ver instrucciones para la IA".
