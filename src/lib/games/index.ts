import { Flappy } from './flappy';
import { Runner } from './runner';
import { Slice } from './slice';
import type { GameId } from './catalog';
import type { Game } from './types';
export function createGame(id: GameId): Game {
	return id === 1 ? new Flappy() : id === 2 ? new Runner() : new Slice();
}
