import { error } from '@sveltejs/kit';
import { isGameId } from '$lib/games/catalog';
import type { PageLoad } from './$types';
export const load: PageLoad = ({ params }) => {
	const id = Number(params.id);
	if (!isGameId(id) || params.id !== String(id))
		error(404, 'Questo esame non è nel piano di studi.');
	return { id };
};
