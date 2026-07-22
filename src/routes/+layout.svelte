<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { getExercises } from './exercises.remote';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { downloadBlob } from '$lib/utils/downloadBlob';

	let { children } = $props();

	// Fetch exercises list for navigation menu using remote function
	const exercisesQuery = getExercises();
	const exercises = $derived(exercisesQuery.current ?? []);
	const timelineActive = $derived(page.url.pathname === '/timeline');

	let exporting = $state(false);
	let exportError = $state<string | null>(null);

	async function exportExercises() {
		exporting = true;
		exportError = null;

		try {
			const response = await fetch('/api/export/exercises');

			if (!response.ok) {
				throw new Error('Export failed');
			}

			const blob = await response.blob();
			const disposition = response.headers.get('Content-Disposition');
			const filenameMatch = disposition?.match(/filename="([^"]+)"/);
			const filename = filenameMatch?.[1] ?? 'exercises-export.json';

			downloadBlob(blob, filename);
		} catch {
			exportError = 'Export failed. Please try again.';
		} finally {
			exporting = false;
		}
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="relative z-10 border-b border-b-stone-200 bg-gray-100 px-4 py-3 md:sticky md:top-0">
	<div class="flex items-start justify-between gap-4">
		<nav class="flex min-w-0 flex-1 flex-wrap gap-2">
			<a
				href={resolve('/timeline')}
				class="flex items-center gap-1.5 rounded px-3 py-1 text-sm font-semibold transition-colors {timelineActive
					? 'bg-emerald-700 text-white hover:bg-emerald-800'
					: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'}"
			>
				<svg aria-hidden="true" viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="none">
					<path
						d="M2 12.5h12M3 10l2.2-2.2 2 1.6L11.5 5 14 6.6"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				Timeline
			</a>
			{#if exercisesQuery.loading}
				<span class="text-sm text-gray-500">Loading exercises...</span>
			{:else if exercisesQuery.error}
				<span class="text-sm text-red-500">Error loading exercises</span>
			{:else}
				{#each exercises as exercise (exercise.id)}
					{@const active = page.url.pathname === `/exercises/${exercise.id}`}
					<a
						href={resolve('/exercises/[exerciseID]', { exerciseID: exercise.id })}
						class="rounded px-3 py-1 text-sm font-medium transition-colors {active
							? 'bg-blue-600 text-white hover:bg-blue-700'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'}"
					>
						{exercise.name}
					</a>
				{/each}
			{/if}
		</nav>

		<div class="flex shrink-0 flex-col items-end gap-1">
			<button
				type="button"
				class="rounded bg-stone-800 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={exporting}
				onclick={exportExercises}
			>
				{exporting ? 'Exporting…' : 'Export'}
			</button>
			{#if exportError}
				<span class="text-xs text-red-600">{exportError}</span>
			{/if}
		</div>
	</div>
</header>

<main class="p-4">
	{@render children()}
</main>
