import { useEffect, useRef } from 'react';
import { getSocket } from '../socket';
import { clearSession, loadSession } from '../utils/session';

interface AckResponse {
  ok: boolean;
  reason?: string;
  [key: string]: unknown;
}

interface UseRoomReconnectOptions {
  code: string | undefined;
  prefix: string;
  hostReconnectEvent: string;
  playerReconnectEvent: string;
  emitWithAck: <T extends AckResponse>(event: string, payload: unknown) => Promise<T>;
  setPlayerId: (id: string | null) => void;
  onPlayerReconnectFailed?: () => void;
}

/**
 * Reengancha automáticamente la sesión guardada (anfitrión y/o jugador) al montar la página
 * y cada vez que el socket vuelve a conectar (recarga de la página o corte de red breve):
 * sin esto, un simple parpadeo de red dejaría el socket nuevo sin asociar a su jugador/sala.
 */
export function useRoomReconnect({
  code,
  prefix,
  hostReconnectEvent,
  playerReconnectEvent,
  emitWithAck,
  setPlayerId,
  onPlayerReconnectFailed,
}: UseRoomReconnectOptions): void {
  // Ref para no tener que re-suscribirse al evento 'connect' cada vez que el componente
  // llamante pase un callback nuevo (p. ej. una arrow function inline en cada render).
  const failedRef = useRef(onPlayerReconnectFailed);
  failedRef.current = onPlayerReconnectFailed;

  useEffect(() => {
    if (!code) return;

    async function attempt() {
      const session = loadSession(prefix, code!);
      if (!session) return;
      // Se intenta también el reenganche de anfitrión aunque la página no sea la del
      // dashboard: si el anfitrión juega también como jugador, puede recargar estando en
      // su propia pantalla de juego y aun así necesita recuperar ambos roles.
      if (session.hostToken) {
        emitWithAck(hostReconnectEvent, { code, hostToken: session.hostToken }).catch(() => {});
      }
      if (session.playerId) {
        try {
          const res = await emitWithAck<{ ok: true; playerId: string }>(playerReconnectEvent, {
            code,
            playerId: session.playerId,
          });
          setPlayerId(res.playerId);
        } catch {
          clearSession(prefix, code!);
          failedRef.current?.();
        }
      }
    }

    attempt();
    const socket = getSocket();
    socket.on('connect', attempt);
    return () => {
      socket.off('connect', attempt);
    };
  }, [code, prefix, hostReconnectEvent, playerReconnectEvent, emitWithAck, setPlayerId]);
}
