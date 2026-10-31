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
