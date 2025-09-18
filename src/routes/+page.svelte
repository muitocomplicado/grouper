<script lang="ts">
	import { slide, fly, fade } from 'svelte/transition';
	import PersonForm from '$lib/components/PersonForm.svelte';
	import PersonList from '$lib/components/PersonList.svelte';
	import GroupSettings from '$lib/components/GroupSettings.svelte';
	import GroupDisplay from '$lib/components/GroupDisplay.svelte';
	import { getFamilyNumberColor } from '$lib/utils/colors';
	import { people } from '$lib/stores';

	import { onMount } from 'svelte';
	let isKeyboardOpen = false;
	let initialWindowHeight: number;

	onMount(() => {
		initialWindowHeight = window.innerHeight;
		const checkKeyboard = () => {
			// If window height is significantly smaller than initial height,
			// keyboard is likely open (using 150px as threshold)
			isKeyboardOpen = window.innerHeight < initialWindowHeight - 150;
		};

		window.addEventListener('resize', checkKeyboard);
		return () => {
			window.removeEventListener('resize', checkKeyboard);
		};
	});

	let personForm: PersonForm;
	let showGroups = false;

	function startGroupGeneration() {
		showGroups = true;
	}
</script>

<div class="h-screen flex flex-col" transition:slide={{ duration: 400, axis: 'y' }}>
	<div class="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
		<!-- Header -->
		<div class="sticky top-0 pt-4 pb-4 z-10 bg-white dark:bg-gray-900">
			{#if !showGroups}
				<div in:fly={{ y: -50, duration: 300 }}>
					<PersonForm
						bind:this={personForm}
						on:personAdded={(event) => personForm?.handlePersonAdded?.(event)}
					/>
				</div>
			{:else}
				<div in:fly={{ y: -50, duration: 300 }}>
					<GroupSettings />
				</div>
			{/if}
		</div>

		<!-- Main Content -->
		<div class="flex-1" in:slide={{ duration: 400 }} out:slide={{ duration: 400 }}>
			<div class="space-y-6">
				{#if !showGroups}
					<div in:fade={{ duration: 400 }}>
						{#if $people.length === 0}
							<div class="text-center text-gray-500 py-8 text-balance">
								Adicione uma pessoa acima com seu respectivo sexo <span
									class="font-mono font-bold text-blue-700 dark:text-blue-500">M</span
								>
								/ <span class="font-mono font-bold text-fuchsia-500">F</span>, indicando se é um
								<span class="font-mono font-bold text-green-600 dark:text-green-300 text-sm"
									>Líder</span
								>
								e se pertence a uma rede
								<span
									class="px-2 py-1 text-xs rounded font-mono invert-0 dark:invert"
									style={`${getFamilyNumberColor(1)}`}>1</span
								>
								<span
									class="px-2 py-1 text-xs rounded font-mono invert-0 dark:invert"
									style={`${getFamilyNumberColor(2)}`}>2</span
								>
								<span
									class="px-2 py-1 text-xs rounded font-mono invert-0 dark:invert"
									style={`${getFamilyNumberColor(3)}`}>3</span
								> que será espalhada nos grupos
							</div>
						{:else}
							<PersonList {personForm} />
						{/if}
					</div>
				{:else}
					<div in:fade={{ duration: 400 }}>
						<GroupDisplay />
					</div>
				{/if}
			</div>
		</div>

		<!-- Footer -->
		{#if !isKeyboardOpen}
			<div class="sticky bottom-0 pt-4 pb-6 bg-white dark:bg-gray-900">
				{#if !showGroups}
					<div in:fly={{ y: 50, duration: 300 }}>
						<button
							on:click={startGroupGeneration}
							class="w-full flex items-center justify-center flex-wrap px-6 py-3 gap-x-4 gap-y-2 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
							disabled={$people.filter((p) => !p.isMissing).length < 2}
						>
							<span>Grupos</span>
							{#if $people.filter((p) => !p.isMissing).length > 0}
								<span
									class="bg-white/20 dark:bg-black/20 px-2 py-1 rounded text-sm whitespace-nowrap"
								>
									{$people.filter((p) => !p.isMissing).length} pessoa{$people.filter(
										(p) => !p.isMissing
									).length > 1
										? 's'
										: ''}
								</span>
							{/if}
						</button>
					</div>
				{:else}
					<div in:fly={{ y: 50, duration: 300 }}>
						<button
							type="button"
							on:click={() => (showGroups = false)}
							class="w-full px-6 py-3 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
						>
							Lista de Pessoas
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
