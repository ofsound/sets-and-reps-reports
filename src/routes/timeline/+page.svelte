<script lang="ts">
	import { getExercises } from '../exercises.remote';
	import { resolve } from '$app/paths';
	import {
		buildTimelineRows,
		createTimelineTicks,
		rangeStart,
		STREAK_GAP_DAYS,
		timelinePlotWidth,
		timelinePosition,
		type TimelineRange
	} from '$lib/utils/timelineData';

	type StatusFilter = 'all' | 'current' | 'paused';

	const exercisesQuery = getExercises();
	const exercises = $derived(exercisesQuery.current ?? []);
	const today = new Date();
	const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

	let range = $state<TimelineRange>('all');
	let status = $state<StatusFilter>('all');

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
	const startDate = $derived(rangeStart(range, allHitDates, endDate));
	const rows = $derived(
		buildTimelineRows(
			exercises.filter((exercise) => {
				if (status === 'current') return exercise.isCurrent;
				if (status === 'paused') return !exercise.isCurrent;
				return true;
			}),
			startDate,
			endDate
		)
	);
	const ticks = $derived(createTimelineTicks(startDate, endDate));
	const plotWidth = $derived(timelinePlotWidth(startDate, endDate));
	const totalHits = $derived(rows.reduce((total, row) => total + row.hitDates.length, 0));
	const uniqueWorkoutDays = $derived(
		new Set(rows.flatMap((row) => row.hitDates.map((date) => date.toDateString()))).size
	);
	const activeCount = $derived(exercises.filter((exercise) => exercise.isCurrent).length);

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(date);
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
		<div>
			<p class="eyebrow">Training history</p>
			<h1 id="timeline-title">The long view.</h1>
			<p class="lede">Every exercise, every hit, and every restart—laid out across time.</p>
		</div>

		<div class="summary" aria-label="Timeline summary">
			<div class="summary-item">
				<strong>{totalHits}</strong>
				<span>exercise hits</span>
			</div>
			<div class="summary-item">
				<strong>{uniqueWorkoutDays}</strong>
				<span>workout days</span>
			</div>
			<div class="summary-item">
				<strong>{activeCount}</strong>
				<span>current exercises</span>
			</div>
		</div>
	</section>

	<section class="timeline-card" aria-label="Exercise history timeline">
		<div class="toolbar">
			<div class="control-group" aria-label="Time range">
				<span class="control-label">Range</span>
				{#each [{ value: 'all', label: 'All time' }, { value: '1y', label: '1 year' }, { value: '6m', label: '6 months' }] as option (option.value)}
					<button
						type="button"
						class:active={range === option.value}
						onclick={() => (range = option.value as TimelineRange)}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<div class="control-group" aria-label="Exercise status">
				<span class="control-label">Show</span>
				{#each [{ value: 'all', label: 'All' }, { value: 'current', label: 'Current' }, { value: 'paused', label: 'Paused' }] as option (option.value)}
					<button
						type="button"
						class:active={status === option.value}
						onclick={() => (status = option.value as StatusFilter)}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<div class="legend" aria-label="Timeline legend">
				<span><i class="legend-hit"></i> Workout day</span>
				<span><i class="legend-streak"></i> {STREAK_GAP_DAYS}-day streak</span>
			</div>
		</div>

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
				<h2>No exercises in this view</h2>
				<p>Try another status filter.</p>
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
						<small>{rows.length} shown</small>
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
						<div class="today-line" style:left="{timelinePosition(today, startDate, endDate)}%">
							<span>Today</span>
						</div>
					</div>

					{#each rows as row (row.id)}
						<a
							class="row-label sticky-cell"
							href={resolve('/exercises/[exerciseID]', { exerciseID: row.id })}
						>
							<span class="exercise-name">{row.name}</span>
							<span class="exercise-meta">
								<i class:paused={!row.isCurrent}></i>
								{row.isCurrent ? 'Current' : 'Paused'} · {row.hitDates.length} hits
							</span>
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
									title="{row.name} · {formatDate(hit)}"
									aria-label="{row.name} workout on {formatDate(hit)}"
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

	<p class="definition">
		A streak connects hits that are no more than {STREAK_GAP_DAYS} days apart. Every dot is an actual
		workout day. Paused exercises stay visible so restarts and program changes remain part of the story.
	</p>
</div>

<style>
	:global(body) {
		background: #f3f1eb;
		color: #1c2421;
	}

	.timeline-page {
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	.intro {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 1.75rem;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		color: #64706a;
		font-size: 0.72rem;
		font-weight: 750;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(2.5rem, 6vw, 5.2rem);
		font-weight: 500;
		letter-spacing: -0.055em;
		line-height: 0.95;
	}

	.lede {
		max-width: 42rem;
		margin: 0.8rem 0 0;
		color: #56615c;
		font-size: 1rem;
	}

	.summary {
		display: flex;
		gap: 0.5rem;
	}

	.summary-item {
		min-width: 112px;
		padding: 0.85rem 1rem;
		border: 1px solid #d6d4cc;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.55);
	}

	.summary-item strong,
	.summary-item span {
		display: block;
	}

	.summary-item strong {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.65rem;
		font-weight: 500;
		line-height: 1;
	}

	.summary-item span {
		margin-top: 0.35rem;
		color: #68716d;
		font-size: 0.68rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.timeline-card {
		overflow: hidden;
		border: 1px solid #cfcec6;
		border-radius: 1rem;
		background: #faf9f5;
		box-shadow: 0 18px 55px rgba(37, 44, 40, 0.08);
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		min-height: 66px;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #d9d8d1;
		background: #f5f3ed;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.control-label {
		margin-right: 0.3rem;
		color: #707873;
		font-size: 0.68rem;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.control-group button {
		padding: 0.4rem 0.65rem;
		border: 1px solid transparent;
		border-radius: 999px;
		color: #56605b;
		font-size: 0.75rem;
		font-weight: 650;
		cursor: pointer;
		transition: 140ms ease;
	}

	.control-group button:hover {
		background: #e9e7e0;
		color: #222b27;
	}

	.control-group button.active {
		border-color: #1f5c46;
		background: #1f5c46;
		color: white;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
		color: #68716d;
		font-size: 0.72rem;
	}

	.legend span {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		white-space: nowrap;
	}

	.legend i {
		display: inline-block;
		background: #d37444;
	}

	.legend-hit {
		width: 7px;
		height: 13px;
		border-radius: 999px;
	}

	.legend-streak {
		width: 22px;
		height: 5px;
		border-radius: 999px;
		opacity: 0.32;
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
		border-right: 1px solid #d9d8d1;
		background: #faf9f5;
	}

	.axis-label,
	.axis-plot {
		height: 62px;
		border-bottom: 1px solid #cfcec6;
		background: #f1efe8;
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

	.axis-label small {
		margin-top: 0.25rem;
		color: #838985;
		font-size: 0.65rem;
		font-weight: 550;
		letter-spacing: 0;
		text-transform: none;
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
		border-left: 1px solid #deddd7;
	}

	.axis-tick.major,
	.grid-line.major {
		border-left-color: #bdbeb8;
	}

	.axis-tick span {
		position: absolute;
		top: 1rem;
		left: 0.55rem;
		color: #747b77;
		font-size: 0.67rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.today-line {
		position: absolute;
		top: 0;
		bottom: 0;
		z-index: 3;
		border-left: 1px dashed #1f5c46;
	}

	.today-line span {
		position: absolute;
		top: 2.25rem;
		right: 0.35rem;
		color: #1f5c46;
		font-size: 0.62rem;
		font-weight: 750;
		text-transform: uppercase;
		transform: translateX(-0.15rem);
	}

	.row-label,
	.row-plot {
		height: 66px;
		border-bottom: 1px solid #e4e2dc;
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
		background: #efede6;
	}

	.exercise-name {
		overflow: hidden;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 0.97rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.exercise-meta {
		display: flex;
		align-items: center;
		gap: 0.33rem;
		margin-top: 0.28rem;
		color: #7a817d;
		font-size: 0.66rem;
	}

	.exercise-meta i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #2b765b;
	}

	.exercise-meta i.paused {
		background: #aaa69b;
	}

	.row-plot {
		background-color: #fdfcf9;
		background-image: linear-gradient(90deg, rgba(40, 56, 49, 0.018) 1px, transparent 1px);
		background-size: 24px 100%;
	}

	.row-plot:hover {
		background-color: #f8f6f0;
	}

	.row-plot.row-paused {
		background-color: #f8f7f3;
	}

	.streak-bar {
		position: absolute;
		top: 50%;
		height: 10px;
		border-radius: 999px;
		background: rgba(211, 116, 68, 0.27);
		transform: translateY(-50%);
	}

	.hit-marker {
		position: absolute;
		top: 50%;
		z-index: 2;
		width: 7px;
		height: 20px;
		border: 2px solid #fdfcf9;
		border-radius: 999px;
		background: #c96032;
		box-shadow: 0 1px 2px rgba(75, 40, 23, 0.2);
		transform: translate(-50%, -50%);
		transition:
			width 120ms ease,
			height 120ms ease,
			background 120ms ease;
	}

	.hit-marker:hover,
	.hit-marker:focus-visible {
		width: 10px;
		height: 28px;
		background: #9d431e;
		outline: 2px solid #1f5c46;
		outline-offset: 2px;
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
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.5rem;
	}

	.loading-line {
		display: block;
		width: min(500px, 70%);
		height: 8px;
		margin: 0 auto 1rem;
		border-radius: 99px;
		background: linear-gradient(90deg, #e7e4dc 25%, #d6d3ca 50%, #e7e4dc 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.loading-line.short {
		width: min(340px, 50%);
	}

	.definition {
		max-width: 780px;
		margin: 1rem 0 0;
		color: #737a76;
		font-size: 0.72rem;
		line-height: 1.55;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	@media (max-width: 900px) {
		.intro {
			align-items: flex-start;
			flex-direction: column;
		}

		.summary {
			width: 100%;
		}

		.summary-item {
			flex: 1;
			min-width: 0;
		}

		.toolbar {
			align-items: flex-start;
			flex-wrap: wrap;
			gap: 0.65rem 1.25rem;
		}

		.legend {
			width: 100%;
			margin-left: 0;
		}
	}

	@media (max-width: 560px) {
		.timeline-page {
			padding: 1.3rem 0.65rem 3rem;
		}

		.summary-item {
			padding: 0.7rem;
		}

		.summary-item strong {
			font-size: 1.35rem;
		}

		.summary-item span {
			font-size: 0.57rem;
		}

		.control-group {
			width: 100%;
		}

		.control-group button {
			flex: 1;
		}

		.legend {
			justify-content: space-between;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loading-line {
			animation: none;
		}

		.hit-marker,
		.row-label,
		.control-group button {
			transition: none;
		}
	}
</style>
