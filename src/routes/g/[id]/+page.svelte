<script lang="ts">
	import GameShell from '$lib/components/GameShell.svelte';
	let { data } = $props();
</script>

{#key data.id}
	<GameShell id={data.id} />
{/key}
