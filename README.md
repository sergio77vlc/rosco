# Rosco Multijugador

Juego web multijugador tipo "Pasapalabra" (rosco). Un dispositivo hospeda la partida y la muestra en tiempo real; cada jugador juega desde su propio móvil, uniéndose escaneando un código QR o introduciendo un código de sala.

## Funcionalidades

- Pantalla inicial: **hospedar partida**, **unirse escaneando un QR**, o **jugar en el mismo dispositivo** (modo local, sin red).
- Configuración del anfitrión: número de jugadores (2-6), duración del cronómetro y elección del rosco. Para jugar solo (1 jugador) se usa el modo "Jugar en este dispositivo", no hospedar.
- La partida arranca automáticamente en cuanto se llena el aforo de jugadores, sin esperar a que el anfitrión pulse nada (también se puede empezar antes manualmente).
- Interruptor **"También soy un jugador"** en la configuración de hospedar: si está desactivado (por defecto), el dispositivo que hospeda es solo un panel espectador que muestra todos los roscos en directo, como un marcador de TV. Si se activa, el anfitrión se une también como un jugador más — configura su propio nombre y avatar, y en cuanto empieza la partida su pantalla pasa a mostrar su propio rosco para jugar, igual que el resto.
- Roscos predefinidos: 60 roscos completos (25 pistas cada uno, 1.500 pistas en total). El selector los organiza en dos niveles: primero eliges la **categoría** (cultura general, animales, cine, geografía, ciencia, historia, deportes) y luego el **nivel de dificultad** dentro de ella — 30 roscos de cultura general (10 por nivel) y al menos 5 en cada categoría temática.
- Generación de roscos completos mediante prompt con IA (API de Anthropic/Claude), a partir de un tema y una dificultad.
- **Avatares**: cada jugador elige su avatar de una lista de emojis, o se hace una foto con la cámara del móvil para usarla como avatar. El avatar aparece en el centro de su rosco y junto a su nombre en todas las pantallas.
- Cada jugador juega desde su móvil: ve su rosco (con su avatar en el centro), la pista activa, y puede responder o pasar (pasapalabra). La pantalla de juego está pensada para verse entera de un vistazo en un móvil, sin necesidad de hacer scroll: rueda, turno, aciertos, fallos, cronómetro, pista y botones caben siempre en pantalla.
- Lectura de la pista en voz alta (TTS) con velocidad ajustable y opción de lectura automática al cambiar de letra.
- Respuesta por voz: un botón de micrófono dicta la respuesta directamente al campo de texto (reconocimiento de voz del navegador).
- El anfitrión ve **todos los roscos de todos los jugadores en tiempo real**, en la misma pantalla, con cronómetro y ranking en vivo.
- **Modo local ("Jugar en este dispositivo")**: hasta 6 jugadores se turnan en el mismo móvil o pantalla, sin necesidad de red ni de otros dispositivos. Cada jugador tiene su propio rosco, pero solo uno responde a la vez: si acierta, sigue él; si falla o pasa palabra, el turno pasa automáticamente al siguiente. Un indicador de turno y un marcador con todos los jugadores están siempre visibles en pantalla.
- Resultados finales con ranking (aciertos, fallos y tiempo).

## Arquitectura

Monorepo con npm workspaces:

- `shared/` — tipos TypeScript y lógica compartida (alfabeto del rosco, normalización/validación de respuestas).
- `server/` — Node.js + Express + Socket.IO. Gestiona las salas en memoria, el motor del juego (turnos, pasapalabra, corrección de respuestas, ranking) y la generación de roscos con IA. Sirve también los archivos estáticos del cliente en producción.
- `client/` — React + Vite. Interfaz para el anfitrión (configuración, sala de espera con QR, dashboard en vivo, resultados) y para los jugadores (unirse, escanear QR, jugar el rosco).

Todos los jugadores de una partida juegan el mismo rosco (mismas pistas); cada uno con su propio progreso, lo que permite comparar los roscos en la misma pantalla del anfitrión en tiempo real.

## Requisitos

- Node.js 20+
- (Opcional, para generar roscos con IA) una clave de API de Anthropic

## Instalación

```bash
npm install
```

Esto instala las dependencias de los tres workspaces (`shared`, `server`, `client`).

## Desarrollo

En dos terminales:

```bash
npm run dev:server   # arranca el servidor (Express + Socket.IO) en el puerto 4000
npm run dev:client   # arranca Vite en modo desarrollo (proxy hacia el servidor)
```

Abre `http://localhost:5173` en el navegador.

## Producción / jugar en la misma red local

```bash
npm run build   # compila shared, server y client
npm start        # arranca el servidor en modo producción, sirviendo el cliente compilado
```

Por defecto el servidor escucha en el puerto `4000` (configurable con la variable `PORT`).

Para jugar con varios móviles en la misma red WiFi:

1. Arranca el servidor con `npm start` en el ordenador que hará de anfitrión.
2. Averigua la IP local de ese ordenador (por ejemplo `192.168.1.20`).
3. Abre `http://<IP-LOCAL>:4000` en el navegador del anfitrión y crea la partida.
4. Los jugadores escanean el código QR de la sala de espera (o entran manualmente `http://<IP-LOCAL>:4000/join/<CODIGO>`) desde sus móviles, conectados a la misma red WiFi.

Para desplegarlo en un servidor con dominio público, el QR generado usará automáticamente esa URL pública.

## Desplegar con HTTPS y dominio propio (recomendado)

La cámara (para escanear el QR y para hacer la foto del avatar) y el micrófono (para dictar respuestas) **solo funcionan en HTTPS** — los navegadores los bloquean por completo en HTTP salvo en `localhost`. Si tienes un dominio (por ejemplo comprado en Nominalia) y un VPS, esta es la forma recomendada de servir la app:

### 1. Apunta el dominio al VPS

En el panel de DNS de Nominalia (o donde gestiones el DNS de tu dominio), añade:

| Tipo | Nombre | Valor              |
|------|--------|---------------------|
| A    | @      | `<IP de tu VPS>`    |
| A    | www    | `<IP de tu VPS>`    |

La propagación puede tardar desde minutos hasta un par de horas. Puedes comprobarlo con `dig tudominio.es` o `nslookup tudominio.es`.

### 2. Instala Nginx y Certbot en el VPS

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### 3. Configura Nginx como proxy inverso

Crea `/etc/nginx/sites-available/rosco`:

```nginx
server {
    listen 80;
    server_name tudominio.es www.tudominio.es;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

(Las cabeceras `Upgrade`/`Connection` son imprescindibles para que Socket.IO funcione a través del proxy).

```bash
sudo ln -s /etc/nginx/sites-available/rosco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Pide el certificado HTTPS

```bash
sudo certbot --nginx -d tudominio.es -d www.tudominio.es
```

Certbot modifica automáticamente la configuración de Nginx para servir HTTPS y redirigir HTTP → HTTPS (elige esa opción cuando lo pregunte), y programa la renovación automática del certificado. Puedes comprobar que la renovación funciona con:

```bash
sudo certbot renew --dry-run
```

### 5. Arranca el servidor solo en localhost y con firewall

Como ahora Nginx es quien atiende las peticiones públicas (puertos 80/443), el proceso Node no necesita estar expuesto directamente:

```bash
HOST=127.0.0.1 PORT=4000 pm2 start npm --name rosco -- start
pm2 save
```

```bash
sudo ufw allow 'Nginx Full'   # abre 80 y 443
sudo ufw allow OpenSSH
sudo ufw deny 4000            # si lo tenías abierto directamente, ciérralo
sudo ufw enable
```

### 6. Verifica

Abre `https://tudominio.es` — deberías ver el candado de "conexión segura". A partir de aquí, el QR generado en la sala de espera ya apuntará a esa URL HTTPS automáticamente, y tanto la cámara (escanear QR) como el micrófono (responder por voz) pedirán permiso y funcionarán con normalidad.

## Generación de roscos con IA

Para habilitar la creación de roscos completos a partir de un prompt, define la variable de entorno `ANTHROPIC_API_KEY` en el entorno donde corre `server`:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Si no está configurada, el resto de la aplicación funciona con normalidad; solo la pestaña "Generar con IA" del formulario de configuración de partida mostrará un mensaje explicando que falta la clave, y el anfitrión podrá seguir usando los roscos predefinidos.

Variables de entorno opcionales:

- `PORT` — puerto del servidor (por defecto `4000`).
- `HOST` — interfaz de red en la que escucha (por defecto `0.0.0.0`); usa `127.0.0.1` cuando pongas Nginx delante como proxy inverso.
- `ANTHROPIC_API_KEY` — habilita la generación de roscos por IA.
- `ROSCO_AI_MODEL` — modelo de Anthropic a usar (por defecto `claude-sonnet-5`).

## Estructura del proyecto

```
shared/src/types.ts         Tipos compartidos (Rosco, Room, Player, eventos de Socket.IO...)
shared/src/roscoLetters.ts  Alfabeto del rosco (25 letras) y reglas de "empieza por" / "contiene"
shared/src/answerCheck.ts   Normalización y comparación de respuestas

server/src/roscos/builder.ts        Helper buildRosco() con validación de reglas de letra
server/src/roscos/presets.ts        Junta todos los roscos predefinidos por categoría
server/src/roscos/data/*.ts         Banco de 60 roscos predefinidos, un fichero por categoría/tanda
server/src/ai/generateRosco.ts Generación de roscos con la API de Anthropic
server/src/gameEngine.ts      Motor del juego: turnos, pasapalabra, corrección, ranking
server/src/socketHandlers.ts  Eventos de Socket.IO (host y jugadores)
server/src/rooms.ts           Estado de las salas en memoria

client/src/pages/host/*    Configuración, sala de espera (QR), dashboard en vivo y resultados
client/src/pages/join/*    Escaneo de QR / código manual, sala de espera y pantalla de juego
client/src/pages/local/*   Modo "pasa y juega" en el mismo dispositivo (configuración, turnos, resultados)
client/src/context/LocalGameContext.tsx  Estado del modo local (turnos, progreso por jugador), sin red
client/src/components/RoscoWheel.tsx  Rueda del rosco (SVG), con el avatar del jugador en el centro
client/src/components/RoscoPlayer.tsx Panel de juego compacto (sin scroll) reutilizado por el modo en red y el modo local
client/src/components/RoscoPicker.tsx Selector de rosco en dos niveles: categoría → dificultad (predefinido o IA)
client/src/components/AvatarPicker.tsx Selector de avatar: lista de emojis o foto con la cámara
client/src/components/AvatarView.tsx  Renderiza un avatar (emoji o foto) de forma consistente en toda la app
client/src/hooks/useSpeechSynthesis.ts   Lectura de la pista en voz alta (TTS), velocidad ajustable
client/src/hooks/useSpeechRecognition.ts Dictado de la respuesta por micrófono (STT)
shared/src/roscoProgress.ts  Motor de turnos (avanzar letra, resolver acierto/fallo/pasapalabra), usado por el servidor y por el modo local del cliente
```

## Notas y limitaciones conocidas

- El estado de las partidas vive en memoria del servidor: si el proceso se reinicia, las partidas en curso se pierden.
- El anfitrión debe mantener la pestaña abierta durante toda la partida (no hay reconexión automática de la sesión del anfitrión tras recargar la página).
- Si un jugador se desconecta, su progreso se conserva pero deberá volver a entrar por su cuenta; no hay reconexión automática con la misma sesión.
- La lectura en voz alta y el dictado por micrófono usan las APIs nativas del navegador (Web Speech API), sin coste ni configuración adicional. El reconocimiento de voz solo está disponible en navegadores compatibles (Chrome/Android funcionan bien; Safari/iOS no lo soporta) y, como el acceso al micrófono, requiere que la web se sirva por HTTPS.
- La lectura en voz alta depende de que el sistema operativo/navegador tenga voces de síntesis instaladas. En Linux de escritorio (Chrome/Brave/Chromium) suele no haber ninguna por defecto, y Brave además puede bloquear la lista de voces con su protección "Shields" contra fingerprinting — en ambos casos la app avisa en pantalla si no consigue reproducir audio. En Android e iOS las voces vienen instaladas de serie y funciona sin configuración adicional.
