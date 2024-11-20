import { writable, get, derived } from 'svelte/store';
import type { Person, GroupSettings, Group } from './types';

// Initialize from localStorage or default values
const storedPeople = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('groupPeople') || '[]')
    : [];

export const people = writable<Person[]>(storedPeople);

// Initialize groups store
let initialGroups: Group[] = [];

// Only load stored groups if the timestamp is recent (within last minute)
if (typeof localStorage !== 'undefined') {
    try {
        const storedGroups = localStorage.getItem('groupList');
        const lastSaveTime = parseInt(localStorage.getItem('groupListTimestamp') || '0');
        const now = Date.now();
        if (storedGroups && now - lastSaveTime < 15*60000) { // 15 minutes
            initialGroups = JSON.parse(storedGroups);
        }
    } catch (e) {
        console.warn('Failed to parse stored groups:', e);
        initialGroups = [];
    }
}

export const groups = writable<Group[]>(initialGroups);
export const isRegenerating = writable<boolean>(false);

// Subscribe to changes and update localStorage
people.subscribe(value => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('groupPeople', JSON.stringify(value));
    }
});

// Keep track of initial load
let isInitialLoad = true;

// Create a derived store to reset groups when people change
const peopleChangeEffect = derived(people, ($people, set) => {
    if (!isInitialLoad) {
        groups.set([]);
    }
    isInitialLoad = false;
});

// Subscribe to the derived store to make it active
peopleChangeEffect.subscribe(() => {});

// Subscribe to groups changes and update localStorage with timestamp
groups.subscribe(value => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('groupList', JSON.stringify(value));
        localStorage.setItem('groupListTimestamp', Date.now().toString());
    }
});

function generateGroups(peopleList: Person[], settings: GroupSettings): Group[] {
    if (peopleList.length === 0) return [];

    // Start with a completely random shuffle of non-missing people
    let availablePeople = [...peopleList]
        .filter(p => !p.isMissing)
        .sort(() => Math.random() - 0.5);

    if (availablePeople.length === 0) return [];

    const groups: Group[] = [];
    let groupId = 1;

    // If separating genders, calculate groups differently
    let possibleGroups;
    if (settings.separateGenders) {
        const maleGroups = Math.floor(availablePeople.filter(p => p.gender === 'M').length / settings.peoplePerGroup);
        const femaleGroups = Math.floor(availablePeople.filter(p => p.gender === 'F').length / settings.peoplePerGroup);
        possibleGroups = maleGroups + femaleGroups;

        // If leaders are required, check leaders by gender
        if (settings.requireLeader) {
            const malePeopleWithLeaders = availablePeople.filter(p => p.gender === 'M' && p.isLeader).length;
            const femalePeopleWithLeaders = availablePeople.filter(p => p.gender === 'F' && p.isLeader).length;
            possibleGroups = Math.min(possibleGroups, malePeopleWithLeaders + femalePeopleWithLeaders);
        }
    } else {
        // Original logic for mixed groups
        possibleGroups = Math.floor(availablePeople.length / settings.peoplePerGroup);
        if (settings.requireLeader) {
            const availableLeaders = availablePeople.filter(p => p.isLeader).length;
            possibleGroups = Math.min(possibleGroups, availableLeaders);
        }
    }

    // Count total males and females (for mixed groups)
    const totalMales = availablePeople.filter(p => p.gender === 'M').length;
    const totalFemales = availablePeople.filter(p => p.gender === 'F').length;
    const minorityGender: 'M' | 'F' = totalMales <= totalFemales ? 'M' : 'F';

    // Only create groups if we can make at least one full-sized group
    if (possibleGroups > 0) {
        // First phase: Create all groups and add leaders if required
        for (let i = 0; i < possibleGroups; i++) {
            const currentGroup: Person[] = [];

            // If we need a leader, find one first
            if (settings.requireLeader) {
                // If separating genders, try to distribute leaders evenly by gender
                let leaderIndex = -1;
                if (settings.separateGenders) {
                    // Alternate between male and female leaders when possible
                    const targetGender = i % 2 === 0 ? 'M' : 'F';
                    leaderIndex = availablePeople.findIndex(p => p.isLeader && p.gender === targetGender);
                    // If no leader of target gender, try the other gender
                    if (leaderIndex === -1) {
                        leaderIndex = availablePeople.findIndex(p => p.isLeader);
                    }
                } else {
                    leaderIndex = availablePeople.findIndex(p => p.isLeader);
                }

                if (leaderIndex !== -1) {
                    currentGroup.push(availablePeople.splice(leaderIndex, 1)[0]);
                }
            }

            groups.push({ id: groupId++, members: currentGroup });
        }

        // Second phase: Add one person of minority gender to each group
        if (!settings.separateGenders) {
            for (const group of groups) {
                const minorityPersonIndex = availablePeople.findIndex(p => p.gender === minorityGender);
                if (minorityPersonIndex !== -1) {
                    group.members.push(availablePeople.splice(minorityPersonIndex, 1)[0]);
                }
            }
        }

        // Third phase: Fill the remaining spots in each group
        for (const group of groups) {
            while (group.members.length < settings.peoplePerGroup && availablePeople.length > 0) {
                let nextPerson: Person | undefined;

                // If we're not separating genders
                if (!settings.separateGenders) {
                    // Count current genders in the group
                    const malesInGroup = group.members.filter(p => p.gender === 'M').length;
                    const femalesInGroup = group.members.filter(p => p.gender === 'F').length;

                    // Count available genders
                    const availableMales = availablePeople.filter(p => p.gender === 'M');
                    const availableFemales = availablePeople.filter(p => p.gender === 'F');

                    // Determine which gender to prioritize
                    let priorityGender: 'M' | 'F' | null = null;

                    if (availableMales.length > 0 && availableFemales.length > 0) {
                        // If both genders are available, choose the less represented one in the current group
                        if (malesInGroup < femalesInGroup) {
                            priorityGender = 'M';
                        } else if (femalesInGroup < malesInGroup) {
                            priorityGender = 'F';
                        } else {
                            // If equal, prioritize the gender with fewer total people available
                            priorityGender = availableMales.length <= availableFemales.length ? 'M' : 'F';
                        }
                    }

                    const eligiblePeople = availablePeople.filter(p =>
                        // First, try to find someone from a different family
                        !group.members.some(m =>
                            m.familyNumber !== undefined &&
                            m.familyNumber === p.familyNumber
                        ) &&
                        // And of the priority gender if one was determined
                        (priorityGender === null || p.gender === priorityGender)
                    );

                    if (eligiblePeople.length > 0) {
                        const randomIndex = Math.floor(Math.random() * eligiblePeople.length);
                        nextPerson = eligiblePeople[randomIndex];
                    } else {
                        // If no eligible people found, try just different family
                        const differentFamilyPeople = availablePeople.filter(p =>
                            !group.members.some(m =>
                                m.familyNumber !== undefined &&
                                m.familyNumber === p.familyNumber
                            )
                        );

                        if (differentFamilyPeople.length > 0) {
                            const randomIndex = Math.floor(Math.random() * differentFamilyPeople.length);
                            nextPerson = differentFamilyPeople[randomIndex];
                        } else {
                            // Last resort: just pick someone randomly
                            const randomIndex = Math.floor(Math.random() * availablePeople.length);
                            nextPerson = availablePeople[randomIndex];
                        }
                    }
                } else {
                    // If separateGenders is true, determine the target gender for this group
                    let targetGender: 'M' | 'F';
                    if (group.members.length > 0) {
                        // Use existing group members' gender
                        targetGender = group.members[0].gender;
                    } else {
                        // For empty groups, use the gender that has more available people
                        const availableMales = availablePeople.filter(p => p.gender === 'M').length;
                        const availableFemales = availablePeople.filter(p => p.gender === 'F').length;
                        targetGender = availableMales >= availableFemales ? 'M' : 'F';
                    }
                    // First try to find someone from a different family
                    const eligiblePeople = availablePeople.filter(p =>
                        p.gender === targetGender &&
                        !group.members.some(m =>
                            m.familyNumber !== undefined &&
                            m.familyNumber === p.familyNumber
                        )
                    );

                    if (eligiblePeople.length > 0) {
                        const randomIndex = Math.floor(Math.random() * eligiblePeople.length);
                        nextPerson = eligiblePeople[randomIndex];
                    } else {
                        // If no eligible people found, just pick someone of the same gender
                        const sameGenderPeople = availablePeople.filter(p => p.gender === targetGender);
                        if (sameGenderPeople.length > 0) {
                            const randomIndex = Math.floor(Math.random() * sameGenderPeople.length);
                            nextPerson = sameGenderPeople[randomIndex];
                        }
                    }
                }
                if (nextPerson) {
                    group.members.push(nextPerson);
                    availablePeople = availablePeople.filter(p => p.id !== nextPerson!.id);
                } else {
                    break;
                }
            }
        }

        // Handle remaining people
        if (availablePeople.length > 0) {
            // Calculate minimum people needed for a new smaller group
            const minPeopleForNewGroup = Math.ceil(settings.peoplePerGroup / 2) + 1;

            // Check if we have enough people for a new smaller group
            if (availablePeople.length >= minPeopleForNewGroup) {
                if (settings.separateGenders) {
                    // Count remaining people by gender
                    const remainingMales = availablePeople.filter(p => p.gender === 'M').length;
                    const remainingFemales = availablePeople.filter(p => p.gender === 'F').length;

                    // Check if we can form a valid gender group
                    const canFormMaleGroup = remainingMales >= minPeopleForNewGroup;
                    const canFormFemaleGroup = remainingFemales >= minPeopleForNewGroup;

                    if (canFormMaleGroup || canFormFemaleGroup) {
                        const targetGender = canFormMaleGroup ? 'M' : 'F';

                        // If leaders required, check if we have one
                        if (settings.requireLeader) {
                            const hasLeader = availablePeople.some(p =>
                                p.gender === targetGender && p.isLeader
                            );

                            if (!hasLeader) {
                                // Fallback to distributing across existing groups
                                return distributeRemainingPeople();
                            }
                        }

                        // Create new group
                        const newGroup: Group = {
                            id: groupId++,
                            members: []
                        };

                        // Add leader first if required
                        if (settings.requireLeader) {
                            const leaderIndex = availablePeople.findIndex(p =>
                                p.gender === targetGender && p.isLeader
                            );
                            newGroup.members.push(availablePeople.splice(leaderIndex, 1)[0]);
                        }

                        // Add remaining people of the same gender
                        while (availablePeople.length > 0) {
                            const personIndex = availablePeople.findIndex(p =>
                                p.gender === targetGender
                            );
                            if (personIndex === -1) break;
                            newGroup.members.push(availablePeople.splice(personIndex, 1)[0]);
                        }

                        groups.push(newGroup);
                    }
                } else {
                    // For mixed groups
                    if (settings.requireLeader && !availablePeople.some(p => p.isLeader)) {
                        // Fallback if we need a leader but don't have one
                        return distributeRemainingPeople();
                    }

                    // Create new mixed group
                    const newGroup: Group = {
                        id: groupId++,
                        members: []
                    };

                    // Add leader first if required
                    if (settings.requireLeader) {
                        const leaderIndex = availablePeople.findIndex(p => p.isLeader);
                        newGroup.members.push(availablePeople.splice(leaderIndex, 1)[0]);
                    }

                    // Add remaining people maintaining gender balance if possible
                    while (availablePeople.length > 0) {
                        const malesInGroup = newGroup.members.filter(p => p.gender === 'M').length;
                        const femalesInGroup = newGroup.members.filter(p => p.gender === 'F').length;

                        // Try to maintain balance
                        const targetGender = malesInGroup < femalesInGroup ? 'M' : 'F';
                        const personIndex = availablePeople.findIndex(p => p.gender === targetGender);

                        if (personIndex !== -1) {
                            newGroup.members.push(availablePeople.splice(personIndex, 1)[0]);
                        } else {
                            // If we can't find preferred gender, take anyone
                            newGroup.members.push(availablePeople.shift()!);
                        }
                    }

                    groups.push(newGroup);
                }
            }

            // Distribute any remaining people across existing groups
            return distributeRemainingPeople();
        }

        function distributeRemainingPeople() {
            while (availablePeople.length > 0) {
                const nextPerson = availablePeople[0];
                if (settings.separateGenders) {
                    const compatibleGroup = groups.find(g =>
                        g.members.length > 0 && g.members[0].gender === nextPerson.gender
                    );

                    if (compatibleGroup) {
                        compatibleGroup.members.push(availablePeople.shift()!);
                    } else {
                        // If no compatible group, create a new one
                        const newGroup: Group = {
                            id: groupId++,
                            members: [availablePeople.shift()!]
                        };
                        groups.push(newGroup);
                    }
                } else {
                    const sortedGroups = [...groups].sort((a, b) => a.members.length - b.members.length);
                    sortedGroups[0].members.push(availablePeople.shift()!);
                }
            }
            return groups;
        }
    }

    return groups;
}

// Function to trigger group generation
export async function regenerateGroups() {
    const currentPeople = get(people);
    const currentSettings = get(groupSettings);

    isRegenerating.set(true);
    groups.set([]);

    // Validate settings
    if (currentPeople.filter(p => !p.isMissing).length === 0) {
        console.warn('No people available to generate groups');
        return;
    }

    if (currentSettings.requireLeader && !currentPeople.filter(p => !p.isMissing).some(p => p.isLeader)) {
        console.warn('Leaders required but no leaders available');
        return;
    }

    if (currentSettings.peoplePerGroup < 2) {
        console.warn('Groups must have at least 2 people');
        return;
    }

    // Small delay to ensure animations reset
    await new Promise(resolve => setTimeout(resolve, 50));

    const newGroups = generateGroups(currentPeople, currentSettings);
    groups.set(newGroups);

    if (! groups || groups.length === 0) {
      isRegenerating.set(false);
    } else {
      setTimeout(() => { isRegenerating.set(false); }, 400);
    }
}

// Initialize groupSettings from localStorage or defaults
let storedSettings: GroupSettings | null = null;

if (typeof localStorage !== 'undefined') {
    try {
        const rawSettings = localStorage.getItem('groupSettings');
        if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            // Validate the parsed settings have the required properties
            if (typeof parsed === 'object' &&
                parsed !== null &&
                typeof parsed.peoplePerGroup === 'number' &&
                typeof parsed.separateGenders === 'boolean' &&
                typeof parsed.requireLeader === 'boolean') {
                storedSettings = parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to parse stored group settings:', e);
    }
}

export const groupSettings = writable<GroupSettings>(storedSettings || {
    peoplePerGroup: 3,
    separateGenders: false,
    requireLeader: false,
});

// Subscribe to changes and update localStorage
groupSettings.subscribe(value => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('groupSettings', JSON.stringify(value));
    }
});
