<script lang="ts">
    import { groups, regenerateGroups, people, groupSettings, isRegenerating } from '$lib/stores';
    import { fly } from 'svelte/transition';
</script>

<div class="w-full max-w-lg mx-auto">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 pb-2">
    {#each $groups as group (group.id)}
        <div
            class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            in:fly={{ x: 100, duration: 200, delay: group.id * 150 }}
        >
            <h3 class="text-sm uppercase rounded mb-1 font-bold text-gray-400">{group.id}</h3>
            <ul class="space-y">
                {#each group.members.sort((a, b) => {
                    if (a.isLeader && !b.isLeader) return -1;
                    if (!a.isLeader && b.isLeader) return 1;
                    return a.name.localeCompare(b.name);
                }) as member}
                    <li class="flex items-center gap-2">
                        <div class="flex items-center gap-2">
                            <span class={`font-mono font-bold ${member.gender === 'M' ? 'text-blue-700 dark:text-blue-500' : 'text-fuchsia-500'}`}>
                                {member.gender}
                            </span>
                            <span class={`font-medium whitespace-nowrap ${member.isLeader ? 'text-green-600 dark:text-green-300' : ''}`}>{member.name}</span>
                        </div>
                    </li>
                {/each}
            </ul>
        </div>
    {/each}
    </div>

    {#if (!$groups || $groups.length === 0) && !$isRegenerating}
        <div class="text-center text-gray-500 py-8">
            {#if $people.length < 2}
                Pelo menos duas pessoas são necessárias.
            {:else if $groupSettings.requireLeader && !$people.some(p => p.isLeader)}
                Pelo menos um líder é necessário.
            {:else}
                Nenhum grupo gerado.
            {/if}
        </div>
    {/if}
</div>

