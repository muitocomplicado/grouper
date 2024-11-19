<script lang="ts">
    import { people } from '$lib/stores';
    import type { Person } from '$lib/types';
    import { nanoid } from 'nanoid';

    let editingPerson: Person | null = null;
    let name = '';
    let gender: 'M' | 'F' = 'M';
    let familyNumber: string = '';
    let isLeader = false;
    let hasDuplicate = false;

    $: {
        const trimmedName = name.trim();
        hasDuplicate = trimmedName !== '' && [...$people].some(p =>
            p.name.toLowerCase() === trimmedName.toLowerCase() &&
            p.id !== editingPerson?.id
        );
    }

    // Store previous state before editing
    let previousState = {
        gender: 'M' as 'M' | 'F',
        familyNumber: '',
        isLeader: false
    };

    export function editPerson(person: Person) {
        // Store current state before editing
        previousState = {
            gender,
            familyNumber,
            isLeader
        };

        // Set form to editing state
        editingPerson = person;
        name = person.name;
        gender = person.gender;
        familyNumber = person.familyNumber?.toString() ?? '';
        isLeader = person.isLeader;
    }

    function resetForm() {
        editingPerson = null;
        name = '';
        // Restore previous state
        gender = previousState.gender;
        familyNumber = previousState.familyNumber;
        isLeader = previousState.isLeader;
    }

    function handleSubmit() {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        // Check for duplicate names, excluding the current editing person
        const isDuplicate = [...$people].some(p =>
            p.name.toLowerCase() === trimmedName.toLowerCase() &&
            p.id !== editingPerson?.id
        );

        if (isDuplicate) {
            alert(`Uma pessoa chamada "${trimmedName}" já existe!`);
            return;
        }

        if (editingPerson) {
            // Update existing person
            people.update(p => p.map(person =>
                person.id === editingPerson.id
                    ? {
                        ...person,
                        name: name.trim(),
                        gender,
                        familyNumber: familyNumber && parseInt(familyNumber) > 0 ? parseInt(familyNumber) : undefined,
                        isLeader
                    }
                    : person
            ));
            resetForm();
        } else {
            // Create new person
            const newPerson: Person = {
                id: nanoid(),
                name: name.trim(),
                gender,
                familyNumber: familyNumber && parseInt(familyNumber) > 0 ? parseInt(familyNumber) : undefined,
                isLeader
            };
            people.update(p => [...p, newPerson]);
            name = '';
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="p-4 bg-white rounded-lg shadow">
    <div class="flex items-center gap-2 mb-4">
        <input
            type="text"
            bind:value={name}
            placeholder="Nome"
            class="flex-1 min-w-0 px-3 py-2 border rounded"
        />

        <button
            type="button"
            on:click={() => gender = gender === 'M' ? 'F' : 'M'}
            class={`px-4 py-2 rounded font-medium ${
                gender === 'M'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-fuchsia-100 text-fuchsia-500 hover:bg-fuchsia-200'
            }`}
        >
            <span class="font-mono font-bold">{gender}</span>
        </button>

        <button
            type="button"
            on:click={() => isLeader = !isLeader}
            class={`px-4 py-2 rounded font-medium ${
                isLeader
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
            <span class="font-mono font-bold">{isLeader ? 'L' : '-'}</span>
        </button>

        <input
            type="number"
            bind:value={familyNumber}
            min="0"
            max="99"
            class="w-14 px-2 py-2 border rounded"
            on:input={(e) => {
                const val = parseInt(e.currentTarget.value);
                if (val > 99) e.currentTarget.value = '99';
                if (val < 0) e.currentTarget.value = '0';
                if (val === 0) e.currentTarget.value = '';
            }}
        />
    </div>

    <div class="flex gap-2">
        <button
            type="submit"
            class={`flex-1 px-6 py-3 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed ${
                editingPerson ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={hasDuplicate}
            title={hasDuplicate ? 'Este nome já existe' : ''}
        >
            {editingPerson ? 'Atualizar' : 'Adicionar'}
        </button>

        {#if editingPerson}
            <button
                type="button"
                on:click={resetForm}
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
                Cancelar
            </button>
        {/if}
    </div>
</form>
