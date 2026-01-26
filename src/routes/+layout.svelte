<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getExercises } from './exercises.remote';

	let { children } = $props();

	// Fetch exercises list for navigation menu using remote function
	const exercisesQuery = getExercises();
	const exercises = $derived(exercisesQuery.current ?? []);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="mb-6 border-b bg-gray-100 px-4 py-3">
	<div class="mb-3 flex items-center justify-between">
		<a
			href="/"
			class="rounded bg-sky-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
		>
			Home
		</a>
	</div>
	<nav class="flex flex-wrap gap-2">
		{#if exercisesQuery.loading}
			<span class="text-sm text-gray-500">Loading exercises...</span>
		{:else if exercisesQuery.error}
			<span class="text-sm text-red-500">Error loading exercises</span>
		{:else}
			{#each exercises as exercise (exercise.id)}
				<a
					href="/exercises/{exercise.id}"
					class="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 hover:text-gray-900"
				>
					{exercise.name}
				</a>
			{/each}
		{/if}
	</nav>
</header>

{@render children()}
