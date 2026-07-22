import { customAlphabet } from 'nanoid';
import type { ServerBattleRoom } from './roomTypes.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
const generateCode = customAlphabet(CODE_ALPHABET, 5);

const rooms = new Map<string, ServerBattleRoom>();

export function createBattleRoomCode(): string {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  return code;
}

export function saveBattleRoom(room: ServerBattleRoom): void {
  rooms.set(room.code, room);
}

export function getBattleRoom(code: string): ServerBattleRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteBattleRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.questionTimeout) clearTimeout(room.questionTimeout);
  if (room?.attackTimeout) clearTimeout(room.attackTimeout);
  if (room?.revealTimeout) clearTimeout(room.revealTimeout);
  if (room?.hostDisconnectTimeout) clearTimeout(room.hostDisconnectTimeout);
  rooms.delete(code);
}

export function findBattleRoomByPlayerSocket(socketId: string): ServerBattleRoom | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) return room;
    }
  }
  return undefined;
}

export function findBattleRoomByHostSocket(socketId: string): ServerBattleRoom | undefined {
  for (const room of rooms.values()) {
    if (room.hostSocketId === socketId) return room;
  }
  return undefined;
}
