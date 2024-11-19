<script lang="ts">
    import { people } from '$lib/stores';
    import type { Person } from '$lib/types';
    import { getFamilyNumberColor } from '$lib/utils/colors';

    function removePerson(id: string) {
        people.update(p => p.filter(person => person.id !== id));
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
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return a.name.localeCompare(b.name);
    }) as person (person.id)}
        <div
            role="button"
            tabindex="0"
            class="w-full text-left flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-800 rounded shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            on:click={() => handlePersonClick(person)}
            on:keydown={(e) => e.key === 'Enter' && handlePersonClick(person)}
            aria-label={`Edit ${person.name}'s information`}
        >
            <div class="flex-1 flex items-center gap-3">
                <span class={`font-mono font-bold ${person.gender === 'M' ? 'text-blue-700 dark:text-blue-500' : 'text-fuchsia-500'}`}>
                    {person.gender}
                </span>

                <span class={`font-medium whitespace-nowrap ${person.isLeader ? 'text-green-600 dark:text-green-300' : ''}`}>{person.name}</span>
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
                on:click|stopPropagation={() => removePerson(person.id)}
                class="ml-4 text-red-600 hover:text-black dark:hover:text-white rounded"
                aria-label={`Remove ${person.name}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    {/each}
</div>
