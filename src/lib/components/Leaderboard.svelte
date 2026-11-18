<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameId } from '$lib/games/catalog';
	type Entry = { name: string; score: number; created: number };
	let { id }: { id: GameId } = $props();
	let entries = $state<Entry[]>([]);
	let loading = $state(true);
	let message = $state('');
	async function load(signal?: AbortSignal) {
		loading = true;
		message = '';
		try {
			const response = await fetch(`/api/scores?game=${id}`, { signal });
			if (!response.ok) throw new Error();
			entries = await response.json();
		} catch {
			if (!signal?.aborted) message = 'La classifica non risponde. Riproviamo?';
		} finally {
			loading = false;
		}
	}
	onMount(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	});
</script>

<section class="leaderboard" aria-label="Classifica pubblica">
	<p class="eyebrow">I PRIMI DELLA CLASSE</p>
	{#if loading}<p role="status">Un attimo, cerco il libretto…</p>
	{:else if message}<p role="alert">{message}</p>
		<button class="button secondary" onclick={() => load()}>Riprova</button>
	{:else if entries.length === 0}<p>Nessun voto sul libretto. Il primo può essere il tuo.</p>
	{:else}
		<ol class="score-list">
			{#each entries as entry, index (`${entry.created}-${index}`)}
				<li>
					<span class="rank">{String(index + 1).padStart(2, '0')}</span><span class="player-name"
						>{entry.name}</span
					><strong>{entry.score}</strong>
				</li>
			{/each}
		</ol>
	{/if}
	<p class="small muted">
		Una classifica per gioco. A parità di punti, chi arriva prima resta davanti.
	</p>
</section>
