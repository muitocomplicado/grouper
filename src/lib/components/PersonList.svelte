<script lang="ts">
	import { people } from '$lib/stores';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import type { Person } from '$lib/types';
	import { getFamilyNumberColor } from '$lib/utils/colors';

	function removePerson(id: string) {
		people.update((p) => p.filter((person) => person.id !== id));
		if (personForm) {
			personForm.resetForm();
		}
	}

	function toggleMissing(id: string, element: HTMLElement) {
		people.update((p) =>
			p.map((person) => (person.id === id ? { ...person, isMissing: !person.isMissing } : person))
		);
		if (personForm) {
			personForm.resetForm();
		}
	}

	import type PersonForm from './PersonForm.svelte';
	export let personForm: PersonForm | undefined;

	function handlePersonClick(person: Person) {
		if (personForm) {
			personForm.editPerson(person);
		}
	}
</script>

<div class="space-y-1 pb-2">
	{#each [...$people].sort((a, b) => {
		// Sort missing people to the bottom
		if (a.isMissing && !b.isMissing) return 1;
		if (!a.isMissing && b.isMissing) return -1;
		// Then sort by leader status
		if (a.isLeader && !b.isLeader) return -1;
		if (!a.isLeader && b.isLeader) return 1;
		// Finally sort by name
		return a.name.localeCompare(b.name);
	}) as person (person.id)}
		<div
			role="button"
			tabindex="0"
			data-person-id={person.id}
			class="w-full text-left flex items-center justify-between py-2 pl-4 pr-2 bg-white dark:bg-gray-800 rounded shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
			class:opacity-40={person.isMissing}
			class:hover:opacity-100={person.isMissing}
			animate:flip={{ duration: 300 }}
			out:scale|local={{ duration: 200, start: 0.95, opacity: 0 }}
			on:click={() => handlePersonClick(person)}
			on:keydown={(e) => e.key === 'Enter' && handlePersonClick(person)}
			aria-label={`Edit ${person.name}'s information`}
		>
			<div class="flex-1 flex items-center gap-3">
				<span
					class={`font-mono font-bold ${person.gender === 'M' ? 'text-blue-700 dark:text-blue-500' : 'text-fuchsia-500'}`}
				>
					{person.gender}
				</span>

				<span
					class={`font-medium whitespace-nowrap ${person.isLeader ? 'text-green-600 dark:text-green-300' : ''}`}
					>{person.name}</span
				>
			</div>

			{#if person.familyNumber !== undefined && person.familyNumber > 0}
				<span
					class="px-2 py-1 text-xs rounded font-mono mr-2 invert-0 dark:invert"
					style={`${getFamilyNumberColor(person.familyNumber)}`}
				>
					{person.familyNumber}
				</span>
			{/if}

			<button
				type="button"
				on:click|stopPropagation={(e) => toggleMissing(person.id, e.currentTarget)}
				on:touchend|stopPropagation|preventDefault={(e) =>
					toggleMissing(person.id, e.currentTarget)}
				class="ml-4 p-2 text-gray-400 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600"
				aria-label={`Mark ${person.name} as ${person.isMissing ? 'present' : 'missing'}`}
			>
				{#if person.isMissing}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</button>
			<button
				type="button"
				on:click|stopPropagation={() => removePerson(person.id)}
				on:touchend|stopPropagation|preventDefault={() => removePerson(person.id)}
				class="ml-2 p-2 text-red-600 hover:text-black dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600"
				aria-label={`Remove ${person.name}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	.flash-highlight {
		animation: flashHighlight 0.5s ease-out;
	}

	@keyframes flashHighlight {
		0% {
			position: relative;
		}
		50% {
			position: relative;
		}
		0%,
		50% {
			box-shadow: inset 0 0 0 2000px rgba(255, 255, 255, 0.3);
		}
		100% {
			box-shadow: inset 0 0 0 2000px rgba(255, 255, 255, 0);
		}
	}
</style>
