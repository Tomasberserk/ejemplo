# Configuración con Túneles (ngrok, localtunnel, etc.)

## ¿Por qué usar túneles?

Los túneles exponen de forma pública tu servidor local a Internet. Dado que el sistema `app-attendance` es monolítico (el servidor Express en el puerto `4000` sirve tanto la API como el frontend estático y el portal de estudiantes), **solo requieres abrir un único túnel en el puerto 4000**. Esto permite:
- Que los aprendices escaneen el QR proyectado en clase y accedan al formulario de asistencia desde sus propios celulares conectados a redes móviles 4G/5G.
- Probar el flujo completo sin requerir que el instructor y los aprendices estén en la misma red local Wi-Fi.

---

## Opción 1: ngrok (Recomendado)

### 1. Descarga e Instalación
Descarga ngrok desde [ngrok.com/download](https://ngrok.com/download) o instálalo vía Chocolatey en Windows:
```powershell
choco install ngrok
```

### 2. Iniciar el Túnel
Con el servidor local corriendo (`npm run dev` en puerto 4000), ejecuta el siguiente comando en tu terminal:
```powershell
ngrok http 4000
```

### 3. Obtener la URL Pública
ngrok te proporcionará una URL pública segura (ej. `https://abc1234.ngrok-free.app`). Esta URL redirige directamente a tu servidor Express en `localhost:4000`.

### 4. Configurar la App
1. Abre tu navegador en la laptop y ve a la dirección del túnel: `https://abc1234.ngrok-free.app`.
2. En la parte superior de la página web (Panel de Configuración de API), asegúrate de que el campo URL de API tenga configurada la misma URL del túnel (`https://abc1234.ngrok-free.app`).
3. Inicia sesión como instructor, selecciona tu ficha y crea una sala de asistencia.
4. El código QR proyectado en pantalla se generará apuntando automáticamente a la URL del túnel público, lo que permitirá a los aprendices escanearlo y registrar asistencia desde sus celulares sin problemas.

---

## Opción 2: localtunnel (Gratuito y sin registro)

Si prefieres una alternativa rápida que no requiera crear cuentas ni instalar tokens de autenticación:

### 1. Ejecutar localtunnel
Teniendo Node.js instalado, puedes levantar un túnel temporal directamente desde tu terminal ejecutando:
```powershell
npx localtunnel --port 4000
```

### 2. Acceso
Obtendrás una URL del tipo `https://some-subdomain.localtunnel.me`. Úsala de la misma forma que ngrok configurando el campo superior de API en la SPA.

---

## Solución de Problemas

### 1. El QR redirige a "localhost" en el móvil de los aprendices
* **Causa:** El campo URL de API superior en el panel del instructor de la SPA quedó configurado como `http://localhost:4000` o vacío en el momento de hacer clic en "Crear Sala".
* **Solución:** Cambia la URL en la SPA a la dirección pública del túnel (`https://...ngrok-free.app`), refresca y vuelve a crear la sala.

### 2. Advertencia de seguridad de ngrok (pantalla de confirmación)
* **Causa:** Al abrir por primera vez la URL de ngrok en un dispositivo, ngrok muestra una pantalla de advertencia ("You are about to connect to...").
* **Solución:** El estudiante debe presionar el botón "Visit Site" o "Confirmar" una sola vez para que el navegador móvil pueda realizar peticiones fetch en segundo plano a la API de asistencia.
