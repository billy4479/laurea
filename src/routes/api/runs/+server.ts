import { error, json } from '@sveltejs/kit';
import { isGameId } from '$lib/games/catalog';
import { allowStart, scores } from '$lib/server/db';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const body = await request.text();
	if (body.length > 128) error(413, 'Richiesta troppo grande.');
	let data;
	try {
		data = JSON.parse(body);
	} catch {
		error(400, 'Richiesta non valida.');
	}
	if (!data || !isGameId(data.game)) error(400, 'Gioco non valido.');
	if (!allowStart(getClientAddress())) error(429, 'Troppe partite. Riprova più tardi.');
	return json({ token: scores().start(data.game) });
};
