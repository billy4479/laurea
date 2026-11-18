export const games = [
	{
		id: 1,
		title: 'Flappy Laurea',
		subtitle: '',
		instructions: '',
		controls: '',
		goal: 12,
		unit: 'CFU',
		symbol: 'ƒ',
		color: '#9ece6a',
		label: '',
		victory: '12 CFU e nessuna intenzione di fermarsi.',
		loss: 'Era solo un appello di prova.'
	},
	{
		id: 2,
		title: 'La corsa alla laurea',
		subtitle: '',
		instructions: '',
		controls: '',
		goal: 180,
		unit: 'PT',
		symbol: '↗',
		color: '#7aa2f7',
		label: '',
		victory: 'Tesi consegnata. Con un margine di 0,001 secondi.',
		loss: 'Tranquillo, la prossima sessione è vicina.'
	},
	{
		id: 3,
		title: 'Taglia e laurea',
		subtitle: '',
		instructions: '',
		controls: '',
		goal: 200,
		unit: 'PT',
		symbol: '✳',
		color: '#e0af68',
		label: '',
		victory: 'La sessione è finita. La torta, per fortuna, no.',
		loss: 'C’era un esame dentro la torta.'
	}
] as const;
export type GameId = 1 | 2 | 3;
export function isGameId(value: number): value is GameId {
	return value === 1 || value === 2 || value === 3;
}
export function gameInfo(id: GameId) {
	return games[id - 1];
}
