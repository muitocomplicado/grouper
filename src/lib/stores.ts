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
    const lastSaveTime = parseInt(localStorage.getItem('groupListTimestamp') || '0');
    const now = Date.now();
    if (now - lastSaveTime < 15*60000) { // 15 minutes
        initialGroups = JSON.parse(localStorage.getItem('groupList') || '[]');
    }
}

export const groups = writable<Group[]>(initialGroups);

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

    // Start with a completely random shuffle of people
    let availablePeople = [...peopleList].sort(() => Math.random() - 0.5);

    const groups: Group[] = [];
    let groupId = 1;

    // If separating genders, calculate groups differently
    let possibleGroups;
    if (settings.separateGenders) {
        const maleGroups = Math.floor(peopleList.filter(p => p.gender === 'M').length / settings.peoplePerGroup);
        const femaleGroups = Math.floor(peopleList.filter(p => p.gender === 'F').length / settings.peoplePerGroup);
        possibleGroups = maleGroups + femaleGroups;

        // If leaders are required, check leaders by gender
        if (settings.requireLeader) {
            const malePeopleWithLeaders = peopleList.filter(p => p.gender === 'M' && p.isLeader).length;
            const femalePeopleWithLeaders = peopleList.filter(p => p.gender === 'F' && p.isLeader).length;
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
    const totalMales = peopleList.filter(p => p.gender === 'M').length;
    const totalFemales = peopleList.filter(p => p.gender === 'F').length;
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
                }
            }
        }

        // Distribute remaining people across existing groups
        let groupIndex = 0;
        while (availablePeople.length > 0) {
            if (settings.separateGenders) {
                // Find the next compatible group for this person's gender
                const person = availablePeople[0];

                // Find all compatible groups and their sizes
                let smallestCompatibleGroup: number = -1;
                let smallestGroupSize = Number.MAX_VALUE;

                for (let i = 0; i < groups.length; i++) {
                    if (groups[i].members[0]?.gender === person.gender) {
                        if (groups[i].members.length < smallestGroupSize) {
                            smallestGroupSize = groups[i].members.length;
                            smallestCompatibleGroup = i;
                        }
                    }
                }

                if (smallestCompatibleGroup !== -1) {
                    // Add to the smallest compatible group
                    groups[smallestCompatibleGroup].members.push(availablePeople.shift()!);
                } else {
                    // If no compatible group found, create a new one
                    groups.push({
                        id: groupId++,
                        members: [availablePeople.shift()!]
                    });
                }
            } else {
                // For mixed groups, distribute evenly
                groups[groupIndex].members.push(availablePeople.shift()!);
                groupIndex = (groupIndex + 1) % groups.length;
            }
        }
    }

    return groups;
}

// Function to trigger group generation
export function regenerateGroups() {
    const currentPeople = get(people);
    const currentSettings = get(groupSettings);

    // Validate settings
    if (currentPeople.length === 0) {
        console.warn('No people available to generate groups');
        groups.set([]);
        return;
    }

    if (currentSettings.requireLeader && !currentPeople.some(p => p.isLeader)) {
        console.warn('Leaders required but no leaders available');
        groups.set([]);
        return;
    }

    if (currentSettings.peoplePerGroup < 2) {
        console.warn('Groups must have at least 2 people');
        groups.set([]);
        return;
    }

    const newGroups = generateGroups(currentPeople, currentSettings);
    groups.set(newGroups);
}

// Initialize groupSettings from localStorage or defaults
const storedSettings = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('groupSettings') || 'null')
    : null;

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
