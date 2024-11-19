<script lang="ts">
    import { groups, regenerateGroups, people, groupSettings } from '$lib/stores';
</script>

<div class="w-full max-w-lg mx-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
    {#each $groups as group (group.id)}
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 class="text-sm uppercase rounded mb-1 font-bold text-gray-400">{group.id}</h3>
            <ul class="space-y">
                {#each group.members.sort((a, b) => {
                    if (a.isLeader && !b.isLeader) return -1;
                    if (!a.isLeader && b.isLeader) return 1;
                    return a.name.localeCompare(b.name);
                }) as member}
                    <li class="flex items-center gap-2">
                        <div class="flex items-center gap-2">
                            <span class={`font-medium whitespace-nowrap ${member.isLeader ? 'text-green-600 dark:text-green-300' : ''}`}>{member.name}</span>
                            <span class={`font-mono font-bold text-sm ${member.gender === 'M' ? 'text-blue-700' : 'text-fuchsia-500'}`}>
                                {member.gender}
                            </span>
                        </div>
                    </li>
                {/each}
            </ul>
        </div>
    {/each}
    </div>

    {#if $groups.length === 0}
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

