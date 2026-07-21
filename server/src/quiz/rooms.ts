import { customAlphabet } from 'nanoid';
import type { ServerQuizRoom } from './roomTypes.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones
const generateCode = customAlphabet(CODE_ALPHABET, 5);

const rooms = new Map<string, ServerQuizRoom>();

export function createQuizRoomCode(): string {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }
  return code;
}

export function saveQuizRoom(room: ServerQuizRoom): void {
  rooms.set(room.code, room);
}

export function getQuizRoom(code: string): ServerQuizRoom | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteQuizRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.questionTimeout) clearTimeout(room.questionTimeout);
  if (room?.revealTimeout) clearTimeout(room.revealTimeout);
  if (room?.hostDisconnectTimeout) clearTimeout(room.hostDisconnectTimeout);
  rooms.delete(code);
}

export function findQuizRoomByPlayerSocket(socketId: string): ServerQuizRoom | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.socketId === socketId) return room;
    }
  }
  return undefined;
}

export function findQuizRoomByHostSocket(socketId: string): ServerQuizRoom | undefined {
  for (const room of rooms.values()) {
    if (room.hostSocketId === socketId) return room;
  }
  return undefined;
}
