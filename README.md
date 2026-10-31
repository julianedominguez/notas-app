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
- Cada dispositivo tiene su propia copia. Para pasar notas entre dispositivos: Menú, "Descargar backup encriptado" en uno y "Restaurar backup encriptado" en el otro.

## Edición

- Cada nota tiene una pestaña con el texto y una pestaña por transcripción, para leer y editar a pantalla completa.
- El texto acepta formato: títulos (T1, T2, T3), negrita, cursiva, tachado, viñetas, listas numeradas, tareas, citas y líneas divisorias. Se guarda como Markdown, así que al copiarlo a un chat mantiene la estructura.
- Atajos al escribir: `# ` título, `## ` subtítulo, `- ` viñeta, `1. ` lista, `[ ] ` tarea, `> ` cita.
- Se puede crear una nota desde un archivo .docx (respeta títulos, listas, negrita y cursiva; las tablas quedan como filas de texto) o pegar desde Google Docs y Word.
- Índice de títulos para saltar dentro de notas largas, tamaño de letra ajustable y modo foco que oculta la lista.
- Las notas que quedan completamente vacías se borran solas al salir de ellas.

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
```

Las instrucciones completas para que una IA ordene textos en este formato están dentro de la app: Menú, "Importar notas desde texto", "Ver instrucciones para la IA".
