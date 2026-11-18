import { Flappy } from './flappy';
import { Runner } from './runner';
import { Slice } from './slice';
import type { GameId } from './catalog';
import { HEIGHT, type Game } from './types';
export function createGame(id: GameId, height = HEIGHT): Game {
	return id === 1
		? new Flappy(Math.random, height)
		: id === 2
			? new Runner(Math.random, height)
			: new Slice(Math.random, height);
}
