export const games = [
	{
		id: 1,
		title: 'Flappy Laurea',
		subtitle: 'Un salto. Un esame. Un altro caffè.',
		instructions:
			'Tocca per saltare e passa tra gli esami. Ogni passaggio vale un CFU. Il ritmo aumenta col tempo: la linea rossa segna il traguardo. Non toccare i bordi!',
		controls: 'Tocca lo schermo · oppure Spazio',
		goal: 12,
		unit: 'CFU',
		symbol: 'ƒ',
		color: '#9ece6a',
		label: 'RIFLESSI',
		victory: '12 CFU e nessuna intenzione di fermarsi.',
		loss: 'Era solo un appello di prova.'
	},
	{
		id: 2,
		title: 'La corsa alla laurea',
		subtitle: 'La scadenza era ieri. Corri.',
		instructions:
			'Cambia corsia per evitare esami e bug. Raccogli i caffè: valgono 10 punti. Hai tre vite.',
		controls: 'Scorri a destra o sinistra · oppure ← →',
		goal: 180,
		unit: 'PT',
		symbol: '↗',
		color: '#7aa2f7',
		label: 'ULTIMO MINUTO',
		victory: 'Tesi consegnata. Con un margine di 0,001 secondi.',
		loss: 'Tranquillo, la prossima sessione è vicina.'
	},
	{
		id: 3,
		title: 'Taglia la sessione',
		subtitle: 'Basta formule. È ora della torta.',
		instructions:
			'Trascina il dito su torte, cappelli e confetti. Evita i riquadri rossi con esami e codice: costano una vita. Anche un dolce mancato costa una vita.',
		controls: 'Trascina il dito · oppure il mouse premuto',
		goal: 200,
		unit: 'PT',
		symbol: '✳',
		color: '#e0af68',
		label: 'FESTEGGIAMENTI',
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
