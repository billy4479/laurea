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
		subtitle: 'La scadenza era ieri. Corri.',
		instructions:
			'Ogni swipe cambia una sola corsia. Evita esami, bug e formule: hai una sola vita. Raccogli i caffè da +10 punti e attraversa il traguardo rosso. La corsa accelera col tempo.',
		controls: 'Swipe a destra o sinistra · oppure ← → sulla tastiera',
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
			'Trascina il dito su torte, cappelli e confetti. Ogni oggetto buono lasciato cadere costa una vita. Evita gli oggetti rossi: tagliarli costa una vita, lasciarli cadere no. I lanci accelerano col tempo.',
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
