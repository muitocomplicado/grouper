export function formatGroupsAsText(groups: Group[]): string {
    if (groups.length === 0) return '';

    return groups.map(group => {
        const header = `*${group.id}*`;
        const members = group.members
            .map(member => {
                const parts = [member.name];
                if (member.isLeader) parts.push("[L]");
                return parts.join(' ');
            })
            .join('\n');
        return `${header}\n${members}`;
    }).join('\n\n');
}
