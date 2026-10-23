<script lang="ts">
	import { tick } from 'svelte';
	import { getExercises } from '../exercises.remote';
	import { resolve } from '$app/paths';
	import type { SetObject } from '$lib/types/interfaces';
	import {
		formatAttemptDate,
		formatAttemptDateDay,
		formatAttemptDateTime
	} from '$lib/utils/dataConversions';
	import {
		buildTimelineRows,
		createTimelineTicks,
		rangeStart,
		timelinePlotWidth,
		timelinePosition
	} from '$lib/utils/timelineData';

	const exercisesQuery = getExercises();
	const exercises = $derived(exercisesQuery.current ?? []);
	const today = new Date();
	const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

	const allHitDates = $derived(
		exercises
			.flatMap((exercise) =>
				exercise.attempts.flatMap((attempt) => {
					const timestamp = attempt[0]?.date;
					return typeof timestamp === 'number' ? [new Date(timestamp)] : [];
				})
			)
			.filter((date) => !Number.isNaN(date.getTime()))
			.sort((a, b) => a.getTime() - b.getTime())
	);
	const startDate = $derived(rangeStart('all', allHitDates, endDate));
	const rows = $derived(buildTimelineRows(exercises, startDate, endDate));
	const ticks = $derived(createTimelineTicks(startDate, endDate));
	const plotWidth = $derived(timelinePlotWidth(startDate, endDate));

	let tooltipVisible = $state(false);
	let tooltipAttempt = $state<SetObject[] | null>(null);
	let tooltipEl: HTMLDivElement | undefined = $state(undefined);
	let tooltipLeft = $state(0);
	let tooltipTop = $state(0);
	let tooltipPositioned = $state(false);

	const TOOLTIP_OFFSET = 10;
	const VIEWPORT_PADDING = 8;

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
	}

	function isSameDay(timestamp: number, date: Date): boolean {
		const attemptDate = new Date(timestamp);
		return (
			attemptDate.getFullYear() === date.getFullYear() &&
			attemptDate.getMonth() === date.getMonth() &&
			attemptDate.getDate() === date.getDate()
		);
	}

	function getAttemptForHit(exerciseId: string, date: Date): SetObject[] {
		const exercise = exercises.find((item) => item.id === exerciseId);
		if (!exercise) return [];

		return exercise.attempts
			.filter((attempt) => attempt[0] && isSameDay(attempt[0].date, date))
			.flat();
	}

	function positionTooltip(anchorX: number, anchorY: number) {
		if (!tooltipEl) return;

		const { width, height } = tooltipEl.getBoundingClientRect();
		const maxLeft = window.innerWidth - width - VIEWPORT_PADDING;
		const maxTop = window.innerHeight - height - VIEWPORT_PADDING;

		let left = anchorX + TOOLTIP_OFFSET;
		if (left + width > window.innerWidth - VIEWPORT_PADDING) {
			left = anchorX - width - TOOLTIP_OFFSET;
		}
		left = Math.max(VIEWPORT_PADDING, Math.min(left, maxLeft));

		let top = anchorY - 30;
		if (top < VIEWPORT_PADDING) {
			top = anchorY + TOOLTIP_OFFSET;
		}
		if (top + height > window.innerHeight - VIEWPORT_PADDING) {
			top = anchorY - height - TOOLTIP_OFFSET;
		}
		top = Math.max(VIEWPORT_PADDING, Math.min(top, maxTop));

		tooltipLeft = left;
		tooltipTop = top;
		tooltipPositioned = true;
	}

	async function showTooltip(anchorX: number, anchorY: number, exerciseId: string, date: Date) {
		const attempt = getAttemptForHit(exerciseId, date);
		if (attempt.length === 0) return;

		tooltipVisible = true;
		tooltipAttempt = attempt;
		tooltipPositioned = false;

		await tick();

		if (tooltipVisible && tooltipAttempt) {
			positionTooltip(anchorX, anchorY);
		}
	}

	function showTooltipFromFocus(event: FocusEvent, exerciseId: string, date: Date) {
		const marker = event.currentTarget as HTMLAnchorElement;
		const rect = marker.getBoundingClientRect();
		void showTooltip(rect.left + rect.width / 2, rect.top, exerciseId, date);
	}

	function hideTooltip() {
		tooltipVisible = false;
		tooltipAttempt = null;
		tooltipPositioned = false;
	}
</script>

<svelte:head>
	<title>Training timeline</title>
	<meta
		name="description"
		content="A complete timeline of exercise sessions, streaks, starts and stops."
	/>
</svelte:head>

<div class="timeline-page">
	<section class="intro" aria-labelledby="timeline-title">
		<h1 id="timeline-title">Timeline</h1>
	</section>

	<section class="timeline-card" aria-label="Exercise history timeline">
		{#if exercisesQuery.loading}
			<div class="loading-state">
				<span class="loading-line"></span>
				<span class="loading-line short"></span>
				<p>Building your timeline…</p>
			</div>
		{:else if exercisesQuery.error}
			<div class="empty-state">
				<h2>Couldn’t load the timeline</h2>
				<p>Refresh the page to try again.</p>
			</div>
		{:else if rows.length === 0}
			<div class="empty-state">
				<h2>No exercise history yet</h2>
				<p>Recorded workouts will appear here.</p>
			</div>
		{:else}
			<div class="timeline-scroll">
				<div
					class="timeline-grid"
					style:--plot-width="{plotWidth}px"
					style:--grid-width="{plotWidth + 230}px"
				>
					<div class="axis-label sticky-cell">
						<span>Exercise</span>
					</div>
					<div class="axis-plot">
						{#each ticks as tick (tick.date.getTime())}
							<div
								class:major={tick.major}
								class="axis-tick"
								style:left="{timelinePosition(tick.date, startDate, endDate)}%"
							>
								<span>{tick.label}</span>
							</div>
						{/each}
						<div
							class="today-line"
							style:left="{timelinePosition(today, startDate, endDate)}%"
						></div>
					</div>

					{#each rows as row (row.id)}
						<a
							class:row-paused={!row.isCurrent}
							class="row-label sticky-cell"
							href={resolve('/exercises/[exerciseID]', { exerciseID: row.id })}
						>
							<span class="exercise-name">{row.name}</span>
						</a>
						<div class:row-paused={!row.isCurrent} class="row-plot">
							{#each ticks as tick (tick.date.getTime())}
								<span
									class:major={tick.major}
									class="grid-line"
									style:left="{timelinePosition(tick.date, startDate, endDate)}%"
								></span>
							{/each}

							{#each row.streaks as streak, index (`${streak.start.getTime()}-${index}`)}
								{#if streak.count > 1}
									<span
										class="streak-bar"
										style:left="{timelinePosition(streak.start, startDate, endDate)}%"
										style:width="{Math.max(
											0.35,
											timelinePosition(streak.end, startDate, endDate) -
												timelinePosition(streak.start, startDate, endDate)
										)}%"
										title="{streak.count} hits from {formatDate(streak.start)} to {formatDate(
											streak.end
										)}"
									></span>
								{/if}
							{/each}

							{#each row.hitDates as hit (hit.getTime())}
								<a
									class="hit-marker"
									href={resolve('/exercises/[exerciseID]', { exerciseID: row.id })}
									style:left="{timelinePosition(hit, startDate, endDate)}%"
									aria-label="{row.name} workout on {formatDate(hit)}"
									onmouseenter={(event) =>
										void showTooltip(event.clientX, event.clientY, row.id, hit)}
									onmousemove={(event) => positionTooltip(event.clientX, event.clientY)}
									onmouseleave={hideTooltip}
									onfocus={(event) => showTooltipFromFocus(event, row.id, hit)}
									onblur={hideTooltip}
								></a>
							{/each}

							<div
								class="today-line row-today"
								style:left="{timelinePosition(today, startDate, endDate)}%"
							></div>

							{#if row.hitDates.length === 0}
								<span class="no-hits">No hits in this range</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>
</div>

{#if tooltipVisible && tooltipAttempt}
	<div
		bind:this={tooltipEl}
		class="tooltip"
		class:tooltip-visible={tooltipPositioned}
		style="left: {tooltipLeft}px; top: {tooltipTop}px;"
	>
		<div class="mb-0.5 text-[15px]">
			{formatAttemptDate(tooltipAttempt[0].date)}
		</div>
		<div class="mb-0.5 text-[13px] text-white/80">
			{formatAttemptDateDay(tooltipAttempt[0].date)}
		</div>
		<div class="mb-2 border-b border-white/20 pb-2 text-xs text-white/70">
			{formatAttemptDateTime(tooltipAttempt[0].date)}
		</div>
		<div class="flex flex-col gap-1">
			{#each tooltipAttempt as set, index (index)}
				<div class="text-[13px] font-semibold text-white/95">
					{set.measurement} × {set.reps}
					{#if set.notes}
						<span class="ml-2 text-[11px] font-normal text-white/60 italic">{set.notes}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background: #ffffff;
		color: #1c2421;
	}

	.timeline-page {
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	.intro {
		margin-bottom: 1.75rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.5rem, 6vw, 5.2rem);
		font-weight: 700;
		letter-spacing: 0;
		line-height: 0.95;
	}

	.timeline-card {
		overflow: hidden;
		border: 1px solid #d1d5db;
		background: #ffffff;
	}

	.timeline-scroll {
		overflow-x: auto;
		overscroll-behavior-inline: contain;
	}

	.timeline-grid {
		display: grid;
		grid-template-columns: 230px minmax(var(--plot-width), 1fr);
		width: max(100%, var(--grid-width));
	}

	.sticky-cell {
		position: sticky;
		left: 0;
		z-index: 5;
		border-right: 1px solid #e5e7eb;
		background: #ffffff;
	}

	.axis-label,
	.axis-plot {
		height: 34px;
		border-bottom: 1px solid #d1d5db;
		background: #ffffff;
	}

	.axis-label {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		flex-direction: column;
		padding: 0 1.1rem;
		color: #303a35;
		font-size: 0.72rem;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.axis-plot,
	.row-plot {
		position: relative;
	}

	.axis-tick,
	.grid-line {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid #e5e7eb;
	}

	.axis-tick.major,
	.grid-line.major {
		border-left-color: #c7cbd1;
	}

	.axis-tick span {
		position: absolute;
		top: 50%;
		left: 0.55rem;
		color: #747b77;
		font-size: 0.67rem;
		font-weight: 600;
		white-space: nowrap;
		transform: translateY(-50%);
	}

	.today-line {
		position: absolute;
		top: 0;
		bottom: 0;
		z-index: 3;
		border-left: 1px dashed #1f5c46;
	}

	.row-label,
	.row-plot {
		height: 34px;
		border-bottom: 1px solid #e5e7eb;
	}

	.row-label {
		display: flex;
		justify-content: center;
		flex-direction: column;
		padding: 0 1.1rem;
		color: inherit;
		text-decoration: none;
		transition: background 140ms ease;
	}

	.row-label:hover {
		background-color: #f3f4f6;
	}

	.exercise-name {
		overflow: hidden;
		font-size: 0.875rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-plot {
		background-color: #ffffff;
		background-image: linear-gradient(90deg, rgba(40, 56, 49, 0.018) 1px, transparent 1px);
		background-size: 24px 100%;
	}

	.row-plot:hover {
		background-color: #f9fafb;
	}

	.row-label.row-paused,
	.row-plot.row-paused {
		background-color: #f9fafb;
		background-image:
			repeating-linear-gradient(
				45deg,
				rgba(100, 116, 139, 0.055) 0,
				rgba(100, 116, 139, 0.055) 1px,
				transparent 1px,
				transparent 7px
			),
			repeating-linear-gradient(
				-45deg,
				rgba(100, 116, 139, 0.055) 0,
				rgba(100, 116, 139, 0.055) 1px,
				transparent 1px,
				transparent 7px
			);
	}

	.streak-bar {
		position: absolute;
		top: 50%;
		height: 7px;
		border-radius: 999px;
		background: rgba(59, 130, 246, 0.24);
		transform: translateY(-50%);
	}

	.hit-marker {
		position: absolute;
		top: 50%;
		z-index: 2;
		width: 8px;
		height: 14px;
		border: 1px solid #ffffff;
		border-radius: 999px;
		background: #3b82f6;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
		transform: translate(-50%, -50%);
		transition: background 120ms ease;
	}

	.hit-marker:hover,
	.hit-marker:focus-visible {
		background: #2563eb;
	}

	.row-paused .streak-bar,
	.row-paused .hit-marker {
		filter: saturate(0.62);
		opacity: 0.72;
	}

	.row-today {
		z-index: 1;
		opacity: 0.38;
	}

	.no-hits {
		position: absolute;
		top: 50%;
		left: 1rem;
		color: #a09f99;
		font-size: 0.7rem;
		font-style: italic;
		transform: translateY(-50%);
	}

	.loading-state,
	.empty-state {
		min-height: 280px;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-state p,
	.empty-state p {
		margin: 0.6rem 0 0;
		color: #767d79;
		font-size: 0.85rem;
	}

	.empty-state h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.loading-line {
		display: block;
		width: min(500px, 70%);
		height: 8px;
		margin: 0 auto 1rem;
		border-radius: 99px;
		background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.loading-line.short {
		width: min(340px, 50%);
	}

	.tooltip {
		position: fixed;
		z-index: 1000;
		min-width: 180px;
		max-width: min(320px, calc(100vw - 16px));
		padding: 12px 14px;
		border-radius: 6px;
		background-color: rgba(15, 23, 42, 0.95);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(4px);
		color: white;
		font-size: 14px;
		pointer-events: none;
		visibility: hidden;
	}

	.tooltip.tooltip-visible {
		visibility: visible;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	@media (max-width: 560px) {
		.timeline-page {
			padding: 1.3rem 0.65rem 3rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-line {
			animation: none;
		}

		.hit-marker,
		.row-label {
			transition: none;
		}
	}
</style>
