<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import { doc, onSnapshot } from 'firebase/firestore';
	import { db } from '$lib/firebase-config';

	import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';
	import { transformAttemptsToChartData } from '$lib/utils/chartData';

	import type { ExerciseObject } from '$lib/types/interfaces';

	import * as d3 from 'd3';

	let { data } = $props();

	// Use initial data from load function (for SSR/SEO)
	// svelte-ignore state_referenced_locally
	const initialExercise = data.exercise;
	let exercise = $state<ExerciseObject | null>(initialExercise);
	let loading = $state(!initialExercise);

	// Chart container ref
	let chartContainer: HTMLDivElement | undefined = $state(undefined);

	// Compute chart data from exercise attempts
	const chartData = $derived(exercise ? transformAttemptsToChartData(exercise.attempts) : []);

	onMount(() => {
		const exerciseID = page.params.exerciseID;

		if (!exerciseID) {
			loading = false;
			return;
		}

		// Only set up real-time listener - initial data already loaded from +page.ts
		// This will update the exercise when Firestore data changes
		// It's possible this is overkill, and just a static state is enough.
		const exerciseRef = doc(db, 'exercises', exerciseID);

		const unsubscribe = onSnapshot(exerciseRef, (docSnapshot) => {
			if (docSnapshot.exists()) {
				const exerciseData = docSnapshot.data();
				const exerciseAttempts = firestoreMapAttemptsToArrayAttempts(exerciseData.attempts);

				exercise = {
					id: exerciseData.id || docSnapshot.id,
					name: exerciseData.name,
					attempts: exerciseAttempts,
					order: exerciseData.order,
					isCurrent: exerciseData.isCurrent
				};
			} else {
				exercise = null;
			}
			loading = false;
		});

		return () => unsubscribe();
	});

	// Render chart when chartData or container changes
	$effect(() => {
		if (!chartContainer || !exercise || chartData.length === 0) {
			return;
		}

		// Clear previous chart
		chartContainer.innerHTML = '';

		// Chart dimensions
		const margin = { top: 20, right: 30, bottom: 60, left: 50 };
		const width = chartContainer.clientWidth - margin.left - margin.right;
		const height = 400 - margin.top - margin.bottom;

		// Create SVG
		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Set up scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(chartData, (d: { date: Date; value: number }) => d.date) as [Date, Date])
			.range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(chartData, (d: { date: Date; value: number }) => d.value) || 0])
			.nice()
			.range([height, 0]);

		// Create line generator
		const line = d3
			.line<{ date: Date; value: number }>()
			.x((d: { date: Date; value: number }) => xScale(d.date))
			.y((d: { date: Date; value: number }) => yScale(d.value))
			.curve(d3.curveMonotoneX);

		// Add grid lines
		g.append('g')
			.attr('class', 'grid')
			.attr('transform', `translate(0,${height})`)
			.call(
				d3
					.axisBottom(xScale)
					.tickSize(-height)
					.tickFormat(() => '')
			)
			.selectAll('line')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-dasharray', '3,3');

		g.append('g')
			.attr('class', 'grid')
			.call(
				d3
					.axisLeft(yScale)
					.tickSize(-width)
					.tickFormat(() => '')
			)
			.selectAll('line')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-dasharray', '3,3');

		// Add the line path
		g.append('path')
			.datum(chartData)
			.attr('fill', 'none')
			.attr('stroke', '#3b82f6')
			.attr('stroke-width', 2)
			.attr('d', line);

		// Add circles for data points
		g.selectAll('circle')
			.data(chartData)
			.enter()
			.append('circle')
			.attr('cx', (d: { date: Date; value: number }) => xScale(d.date))
			.attr('cy', (d: { date: Date; value: number }) => yScale(d.value))
			.attr('r', 4)
			.attr('fill', '#3b82f6')
			.attr('stroke', '#fff')
			.attr('stroke-width', 2);

		// Add X axis
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat('%m/%d/%Y')(d as Date)))
			.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)');

		// Add Y axis
		g.append('g').call(d3.axisLeft(yScale));

		// Add axis labels
		// svg
		// 	.append('text')
		// 	.attr('transform', 'rotate(-90)')
		// 	.attr('y', 15)
		// 	.attr('x', 0 - height / 2)
		// 	.style('text-anchor', 'middle')
		// 	.style('font-size', '14px')
		// 	.style('fill', '#374151')
		// 	.text('Composite Value');

		// svg
		// 	.append('text')
		// 	.attr('transform', `translate(${width / 2}, ${height + margin.bottom - 5})`)
		// 	.style('text-anchor', 'middle')
		// 	.style('font-size', '12px')
		// 	.style('fill', '#374151')
		// 	.text('Date');
	});
</script>

{#if loading}
	<p>Loading exercise...</p>
{:else if exercise}
	<div>
		<h1 class="mb-2 text-3xl font-bold">{exercise.name}</h1>
		<!-- <p>Total attempts: {exercise.attempts.length}</p>
		<p>Order: {exercise.order}</p>
		<p>Current: {exercise.isCurrent ? 'Yes' : 'No'}</p> -->

		{#if chartData.length > 0}
			<div class="mt-6">
				<div bind:this={chartContainer} class="w-full overflow-x-auto bg-white p-4 pb-12"></div>
			</div>
		{:else if !loading}
			<div class="mt-6">
				<p class="text-sm text-gray-500">No chart data available</p>
			</div>
		{/if}

		<div class="mt-4">
			<h2 class="mb-2 text-2xl font-semibold">Attempts</h2>
			{#each exercise.attempts as attempt, attemptIndex}
				{#if attempt.length > 0}
					<div class="mb-4 rounded border p-4">
						<h3 class="font-semibold">Attempt {attemptIndex + 1}</h3>
						<p class="ml-4 text-sm text-gray-500">
							Date: {new Date(attempt[0].date)
								.toLocaleString(undefined, {
									month: '2-digit',
									day: '2-digit',
									year: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									hour12: true
								})
								.replace(',', '')
								.replace(
									/(\d{1,2}:\d{2})\s([AP]M)/,
									(_, t, ap) => t.toLowerCase() + ap.toLowerCase()
								)}
						</p>

						{#each attempt as set}
							<div class="ml-4">
								<p>
									{set.reps} x {set.measurement}
									{#if set.notes}
										<span class="text-sm text-gray-600">Notes: {set.notes}</span>
									{/if}
								</p>
								<div class="composite">
									{set.reps * parseInt(set.measurement)}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<p>Exercise not found.</p>
{/if}
