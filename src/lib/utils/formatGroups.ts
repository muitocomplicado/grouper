export function formatGroupsAsText(groups: Group[]): string {
    if (groups.length === 0) return '';

    return "_GRUPOS_\n\n" + groups.map(group => {
        const header = `*${group.id}*`;
        const members = group.members
            .map(member => { return `${member.isLeader ? '*' + member.name + '*' : member.name}`; })
            .join('\n');
        return `${header}\n${members}`;
    }).join('\n\n');
}
