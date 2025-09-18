<style>
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-1rem);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-slide-down {
        animation: slideDown 0.2s ease-out forwards;
    }
</style>

<script lang="ts">
    import { onMount } from 'svelte';
    import { people } from '$lib/stores';
    import type { Person } from '$lib/types';
    import { nanoid } from 'nanoid';

    function capitalizeWords(str: string): string {
        return str.replace(/(?:^|\s)\S/g, letter => letter.toUpperCase());
    }

    function getNextFamilyNumber(currentPeople: Person[]): number {
        const usedNumbers = currentPeople
            .map(p => p.familyNumber || 0)
            .filter(n => n > 0);

        if (usedNumbers.length === 0) return 1;

        return Math.max(...usedNumbers) + 1;
    }

    let nameInput: HTMLInputElement;

    let editingPerson: Person | null = null;
    let name = '';
    let gender: 'M' | 'F' = 'M';
    let familyNumber: string = '';
    let isLeader = false;
    let hasDuplicate = false;
    let formActive = false;

    $: {
        const trimmedName = name.trim();
        hasDuplicate = trimmedName !== '' && [...$people].some(p =>
            p.name.toLowerCase() === trimmedName.toLowerCase() &&
            p.id !== editingPerson?.id
        );
        // Keep form active if there's content or we're editing
        formActive = editingPerson !== null || trimmedName !== '';
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
        // isMissing status is preserved in the person object and doesn't need form controls

        // Focus the name input after a short delay to ensure the DOM is ready
        setTimeout(() => {
            nameInput?.focus();
        }, 0);
    }

    export function resetForm() {
        editingPerson = null;
        name = '';
        // Restore previous state
        gender = previousState.gender;
        familyNumber = previousState.familyNumber;
        isLeader = previousState.isLeader;
        nameInput?.blur();
    }


    function handleFamilyNumberInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/[^0-9]/g, '');
        const numValue = parseInt(value) || 0;
        if (numValue > 99) {
            familyNumber = '99';
        } else if (numValue === 0) {
            familyNumber = '';
        } else {
            familyNumber = numValue.toString();
        }
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
                person.id === editingPerson?.id
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
                isLeader,
                isMissing: false
            };
            people.update(p => [...p, newPerson]);

            // Use RAF to ensure DOM is updated
            requestAnimationFrame(() => {
                const element = document.querySelector(`[data-person-id="${newPerson.id}"]`);
                if (!element) return;

                const headerOffset = 100;
                const padding = 20;

                const elementRect = element.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.pageYOffset;
                const targetPosition = absoluteElementTop - headerOffset - padding;

                // Smooth but quick scroll
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Wait for scroll to finish before flashing
                let scrollTimeout: number;
                const checkScrollEnd = () => {
                    if (scrollTimeout) {
                        clearTimeout(scrollTimeout);
                    }
                    scrollTimeout = setTimeout(() => {
                        // Add flash effect class after scroll completes
                        element.classList.add('flash-highlight');
                        // Remove class after animation
                        setTimeout(() => {
                            element.classList.remove('flash-highlight');
                        }, 500);
                    }, 100); // Small buffer after scroll ends
                };

                // Listen for scroll end
                const scrollListener = () => checkScrollEnd();
                window.addEventListener('scroll', scrollListener, { passive: true });

                // Cleanup listener after animation
                setTimeout(() => {
                    window.removeEventListener('scroll', scrollListener);
                }, 1000); // Ensure cleanup after everything is done
            });
            name = '';
            nameInput?.focus();
        }
    }

    // Handle escape key
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && editingPerson) {
            resetForm();
        }
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

<form on:submit|preventDefault={handleSubmit} class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="flex items-center gap-2">
        <input
            type="text"
            bind:value={name}
            on:input={(e) => {
                const input = e.target as HTMLInputElement;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                name = capitalizeWords(input.value);
                // Restore cursor position
                setTimeout(() => {
                    input.setSelectionRange(start, end);
                }, 0);
            }}
            bind:this={nameInput}
            placeholder="Nome"
            autocomplete="off"
            autocapitalize="sentences"
            spellcheck="false"
            class="flex-1 min-w-0 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <button
            type="button"
            on:click={() => gender = gender === 'M' ? 'F' : 'M'}
            class={`px-4 py-2 rounded font-medium ${
                gender === 'M'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                : 'bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-500 dark:text-fuchsia-300 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800'
            }`}
        >
            <span class="font-mono font-bold">{gender}</span>
        </button>

        <button
            type="button"
            on:click={() => isLeader = !isLeader}
            class={`px-4 py-2 rounded font-medium ${
                isLeader
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
            <span class="font-mono font-bold">{isLeader ? 'L' : '*'}</span>
        </button>

        <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            bind:value={familyNumber}
            on:input={handleFamilyNumberInput}
            on:click={(e) => {
                if (!familyNumber) {
                    familyNumber = getNextFamilyNumber($people).toString();
                } else {
                    familyNumber = '';
                }
            }}
            autocomplete="off"
            class="w-12 px-2 py-2 border rounded text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
    </div>

    {#if formActive}
        <div class="flex gap-2 mt-4 animate-slide-down">
            <button
                type="submit"
                class={`flex-1 px-6 py-3 text-white rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed font-bold ${
                    editingPerson ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={hasDuplicate}
                title={hasDuplicate ? 'Este nome já existe' : ''}
            >
                {editingPerson ? 'Atualizar' : 'Adicionar'}
            </button>

            <button
                type="button"
                on:click={resetForm}
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 font-bold"
            >
                Cancelar
            </button>
        </div>
    {/if}
</form>
