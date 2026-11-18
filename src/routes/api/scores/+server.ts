import { error, json } from '@sveltejs/kit';
import { isGameId } from '$lib/games/catalog';
import { scores } from '$lib/server/db';
import { ScoreError } from '$lib/server/scores';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = ({ url }) => {
	const game = Number(url.searchParams.get('game'));
	if (!isGameId(game)) error(400, 'Gioco non valido.');
	return json(scores().list(game), { headers: { 'cache-control': 'no-store' } });
};
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	if (body.length > 1024) error(413, 'Richiesta troppo grande.');
	let data: unknown;
	try {
		data = JSON.parse(body);
	} catch {
		error(400, 'Richiesta non valida.');
	}
	try {
		return json(scores().submit(data));
	} catch (cause) {
		if (cause instanceof ScoreError) error(cause.status, cause.message);
		throw cause;
	}
};
