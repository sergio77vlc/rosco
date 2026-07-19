# Rosco Multijugador

Juego web multijugador tipo "Pasapalabra" (rosco). Un dispositivo hospeda la partida y la muestra en tiempo real; cada jugador juega desde su propio móvil, uniéndose escaneando un código QR o introduciendo un código de sala.

## Funcionalidades

- Pantalla inicial: **hospedar partida** o **unirse escaneando un QR**.
- Configuración del anfitrión: número de jugadores (1-6), duración del cronómetro y elección del rosco.
- Roscos predefinidos: 8 roscos completos (25 pistas cada uno) organizados por dificultad (fácil/medio/difícil) y tema (general, animales, cine, geografía, ciencia, historia, deportes, cultura general).
- Generación de roscos completos mediante prompt con IA (API de Anthropic/Claude), a partir de un tema y una dificultad.
- Cada jugador juega desde su móvil: ve su rosco, la pista activa, y puede responder o pasar (pasapalabra).
- Lectura de la pista en voz alta (TTS) con velocidad ajustable y opción de lectura automática al cambiar de letra.
- Respuesta por voz: un botón de micrófono dicta la respuesta directamente al campo de texto (reconocimiento de voz del navegador).
- El anfitrión ve **todos los roscos de todos los jugadores en tiempo real**, en la misma pantalla, con cronómetro y ranking en vivo.
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

## Generación de roscos con IA

Para habilitar la creación de roscos completos a partir de un prompt, define la variable de entorno `ANTHROPIC_API_KEY` en el entorno donde corre `server`:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Si no está configurada, el resto de la aplicación funciona con normalidad; solo la pestaña "Generar con IA" del formulario de configuración de partida mostrará un mensaje explicando que falta la clave, y el anfitrión podrá seguir usando los roscos predefinidos.

Variables de entorno opcionales:

- `PORT` — puerto del servidor (por defecto `4000`).
- `ANTHROPIC_API_KEY` — habilita la generación de roscos por IA.
- `ROSCO_AI_MODEL` — modelo de Anthropic a usar (por defecto `claude-sonnet-5`).

## Estructura del proyecto

```
shared/src/types.ts         Tipos compartidos (Rosco, Room, Player, eventos de Socket.IO...)
shared/src/roscoLetters.ts  Alfabeto del rosco (25 letras) y reglas de "empieza por" / "contiene"
shared/src/answerCheck.ts   Normalización y comparación de respuestas

server/src/roscos/presets.ts  Banco de 8 roscos predefinidos
server/src/ai/generateRosco.ts Generación de roscos con la API de Anthropic
server/src/gameEngine.ts      Motor del juego: turnos, pasapalabra, corrección, ranking
server/src/socketHandlers.ts  Eventos de Socket.IO (host y jugadores)
server/src/rooms.ts           Estado de las salas en memoria

client/src/pages/host/*   Configuración, sala de espera (QR), dashboard en vivo y resultados
client/src/pages/join/*   Escaneo de QR / código manual, sala de espera y pantalla de juego
client/src/components/RoscoWheel.tsx  Rueda del rosco (SVG)
client/src/hooks/useSpeechSynthesis.ts   Lectura de la pista en voz alta (TTS), velocidad ajustable
client/src/hooks/useSpeechRecognition.ts Dictado de la respuesta por micrófono (STT)
```

## Notas y limitaciones conocidas

- El estado de las partidas vive en memoria del servidor: si el proceso se reinicia, las partidas en curso se pierden.
- El anfitrión debe mantener la pestaña abierta durante toda la partida (no hay reconexión automática de la sesión del anfitrión tras recargar la página).
- Si un jugador se desconecta, su progreso se conserva pero deberá volver a entrar por su cuenta; no hay reconexión automática con la misma sesión.
- La lectura en voz alta y el dictado por micrófono usan las APIs nativas del navegador (Web Speech API), sin coste ni configuración adicional. El reconocimiento de voz solo está disponible en navegadores compatibles (Chrome/Android funcionan bien; Safari/iOS no lo soporta) y, como el acceso al micrófono, requiere que la web se sirva por HTTPS.
