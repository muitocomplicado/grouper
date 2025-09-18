import { writable, get } from 'svelte/store';
import type { Person, GroupSettings, Group } from './types';

// Initialize from localStorage or default values
const storedPeople =
	typeof localStorage !== 'undefined'
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
		if (storedGroups && now - lastSaveTime < 15 * 60000) {
			// 15 minutes
			initialGroups = JSON.parse(storedGroups);
		}
	} catch (e) {
		console.warn('Failed to parse stored groups:', e);
		initialGroups = [];
	}
}

export const groups = writable<Group[]>(initialGroups);
export const isRegenerating = writable<boolean>(false);

// Keep track of initial load
let isInitialLoad = true;

// Subscribe to changes and update localStorage; also clear groups after first change
people.subscribe((value) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('groupPeople', JSON.stringify(value));
	}
	if (!isInitialLoad) {
		groups.set([]);
	}
	isInitialLoad = false;
});

// Subscribe to groups changes and update localStorage with timestamp
groups.subscribe((value) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('groupList', JSON.stringify(value));
		localStorage.setItem('groupListTimestamp', Date.now().toString());
	}
});

function generateGroups(peopleList: Person[], settings: GroupSettings): Group[] {
	const candidates = peopleList.filter((p) => !p.isMissing);
	if (candidates.length === 0) return [];

	let groupId = 1;
	const builtGroups: Group[] = [];

	function shuffle<T>(arr: T[]): T[] {
		return [...arr].sort(() => Math.random() - 0.5);
	}

	function pickCandidateIndex(
		avail: Person[],
		group: Group,
		opts: {
			allowFamilyDiversification: boolean;
			preferNonLeaderWhenHasLeader: boolean;
			targetGender?: 'M' | 'F';
		}
	): number {
		let indices = avail.map((_, i) => i);

		if (opts.targetGender) {
			const byGender = indices.filter((i) => avail[i].gender === opts.targetGender);
			if (byGender.length > 0) indices = byGender;
		}

		if (opts.preferNonLeaderWhenHasLeader) {
			const nonLeader = indices.filter((i) => !avail[i].isLeader);
			if (nonLeader.length > 0) indices = nonLeader;
		}

		if (opts.allowFamilyDiversification) {
			const existingFamilies = new Set<number>();
			for (const m of group.members) {
				if (m.familyNumber !== undefined) existingFamilies.add(m.familyNumber);
			}
			const differentFamily = indices.filter(
				(i) =>
					avail[i].familyNumber === undefined ||
					!existingFamilies.has(avail[i].familyNumber as number)
			);
			if (differentFamily.length > 0) {
				indices = differentFamily;
			} else if (existingFamilies.size > 0) {
				// If we have existing families in the group and no one from different family is available,
				// return -1 to indicate no valid candidate
				return -1;
			}
		}

		return indices.length > 0 ? indices[Math.floor(Math.random() * indices.length)] : -1;
	}

	function fillLocalGroupsRoundRobin(
		avail: Person[],
		localGroups: Group[],
		allowFamilyDiversification: boolean
	): void {
		while (avail.length > 0) {
			const availableGroups = localGroups.filter((g) => g.members.length < settings.peoplePerGroup);
			if (availableGroups.length === 0) break;

			let filledAny = false;
			for (const g of availableGroups) {
				if (avail.length === 0) break;

				let targetGender: 'M' | 'F' | undefined;
				if (!settings.separateGenders) {
					const malesInGroup = g.members.filter((p) => p.gender === 'M').length;
					const femalesInGroup = g.members.filter((p) => p.gender === 'F').length;
					const availM = avail.filter((p) => p.gender === 'M').length;
					const availF = avail.filter((p) => p.gender === 'F').length;

					if (availM > 0 && availF > 0) {
						if (malesInGroup < femalesInGroup) targetGender = 'M';
						else if (femalesInGroup < malesInGroup) targetGender = 'F';
						else targetGender = availM <= availF ? 'M' : 'F';
					} else if (availM > 0) targetGender = 'M';
					else if (availF > 0) targetGender = 'F';
				}

				const idx = pickCandidateIndex(avail, g, {
					allowFamilyDiversification,
					preferNonLeaderWhenHasLeader: settings.requireLeader && g.members.some((m) => m.isLeader),
					targetGender
				});
				if (idx >= 0) {
					g.members.push(avail.splice(idx, 1)[0]);
					filledAny = true;
				}
			}
			if (!filledAny) break;
		}
	}

	function processSingleGender(list: Person[], allowFamilyDiversification: boolean) {
		let avail = shuffle(list);
		if (avail.length === 0) return;

		let leaders = settings.requireLeader ? avail.filter((p) => p.isLeader) : [];
		let groupCount = Math.floor(avail.length / settings.peoplePerGroup);
		if (settings.requireLeader) groupCount = Math.min(groupCount, leaders.length);

		const localGroups: Group[] = [];
		for (let i = 0; i < groupCount; i++) {
			const g: Group = { id: groupId++, members: [] };
			if (settings.requireLeader) {
				const leaderIndex = Math.floor(Math.random() * leaders.length);
				const leader = leaders.splice(leaderIndex, 1)[0];
				avail = avail.filter((p) => p.id !== leader.id);
				g.members.push(leader);
			}
			builtGroups.push(g);
			localGroups.push(g);
		}

		fillLocalGroupsRoundRobin(avail, localGroups, allowFamilyDiversification);

		// First, try to distribute remainders to existing groups (allowing them to exceed peoplePerGroup)
		while (avail.length > 0) {
			let placedSomeone = false;
			const targets = [...localGroups].sort((a, b) => a.members.length - b.members.length);
			if (targets.length === 0) break;

			// Try each person against each group until we find a valid placement
			for (let personIdx = 0; personIdx < avail.length && !placedSomeone; personIdx++) {
				for (const group of targets) {
					const tempAvail = [avail[personIdx]];
					const idx = pickCandidateIndex(tempAvail, group, {
						allowFamilyDiversification,
						preferNonLeaderWhenHasLeader:
							settings.requireLeader && group.members.some((m) => m.isLeader)
					});
					if (idx >= 0) {
						group.members.push(avail.splice(personIdx, 1)[0]);
						placedSomeone = true;
						break;
					}
				}
			}

			if (!placedSomeone) {
				break; // No one can be placed in any existing group
			}
		}

		// Only create new groups for people who couldn't be placed anywhere
		while (avail.length > 0) {
			if (!settings.requireLeader || avail.some((p) => p.isLeader)) {
				const g: Group = { id: groupId++, members: [] };
				if (settings.requireLeader) {
					const li = avail.findIndex((p) => p.isLeader);
					g.members.push(avail.splice(li, 1)[0]);
				}

				// Fill this new group as much as possible
				while (avail.length > 0) {
					const idx = pickCandidateIndex(avail, g, {
						allowFamilyDiversification,
						preferNonLeaderWhenHasLeader:
							settings.requireLeader && g.members.some((m) => m.isLeader)
					});
					if (idx >= 0) {
						g.members.push(avail.splice(idx, 1)[0]);
					} else {
						break; // Can't place anyone else in this group
					}
				}

				if (g.members.length > 0) {
					builtGroups.push(g);
					localGroups.push(g);
				}
			} else {
				// No leaders available but leaders required, can't create more groups
				break;
			}
		}
	}

	function processMixed(list: Person[], allowFamilyDiversification: boolean) {
		let avail = shuffle(list);
		if (avail.length === 0) return;

		let leaders = settings.requireLeader ? avail.filter((p) => p.isLeader) : [];
		let groupCount = Math.floor(avail.length / settings.peoplePerGroup);
		if (settings.requireLeader) groupCount = Math.min(groupCount, leaders.length);

		const localGroups: Group[] = [];
		for (let i = 0; i < groupCount; i++) {
			const g: Group = { id: groupId++, members: [] };
			if (settings.requireLeader) {
				const leaderIndex = Math.floor(Math.random() * leaders.length);
				const leader = leaders.splice(leaderIndex, 1)[0];
				avail = avail.filter((p) => p.id !== leader.id);
				g.members.push(leader);
			}
			builtGroups.push(g);
			localGroups.push(g);
		}

		fillLocalGroupsRoundRobin(avail, localGroups, allowFamilyDiversification);

		// First, try to distribute remainders to existing groups (allowing them to exceed peoplePerGroup)
		while (avail.length > 0) {
			let placedSomeone = false;
			const targets = [...localGroups].sort((a, b) => a.members.length - b.members.length);
			if (targets.length === 0) break;

			// Try each person against each group until we find a valid placement
			for (let personIdx = 0; personIdx < avail.length && !placedSomeone; personIdx++) {
				for (const group of targets) {
					const tempAvail = [avail[personIdx]];
					const idx = pickCandidateIndex(tempAvail, group, {
						allowFamilyDiversification,
						preferNonLeaderWhenHasLeader:
							settings.requireLeader && group.members.some((m) => m.isLeader)
					});
					if (idx >= 0) {
						group.members.push(avail.splice(personIdx, 1)[0]);
						placedSomeone = true;
						break;
					}
				}
			}

			if (!placedSomeone) {
				break; // No one can be placed in any existing group
			}
		}

		// Only create new groups for people who couldn't be placed anywhere
		while (avail.length > 0) {
			if (!settings.requireLeader || avail.some((p) => p.isLeader)) {
				const g: Group = { id: groupId++, members: [] };
				if (settings.requireLeader) {
					const li = avail.findIndex((p) => p.isLeader);
					g.members.push(avail.splice(li, 1)[0]);
				}

				// Fill this new group as much as possible
				const tempLocal = [g];
				fillLocalGroupsRoundRobin(avail, tempLocal, allowFamilyDiversification);

				if (g.members.length > 0) {
					builtGroups.push(g);
					localGroups.push(g);
				}
			} else {
				// No leaders available but leaders required, can't create more groups
				break;
			}
		}
	}

	const byNetwork = settings.groupByNetwork;
	const buckets = new Map<number, Person[]>();
	for (const p of shuffle(candidates)) {
		const key = byNetwork ? (p.familyNumber ?? 0) : -1;
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key)!.push(p);
	}

	for (const [, bucketPeople] of buckets) {
		if (settings.separateGenders) {
			processSingleGender(
				bucketPeople.filter((p) => p.gender === 'M'),
				!byNetwork
			);
			processSingleGender(
				bucketPeople.filter((p) => p.gender === 'F'),
				!byNetwork
			);
		} else {
			processMixed(bucketPeople, !byNetwork);
		}
	}

	return builtGroups;
}

// Function to trigger group generation
export async function regenerateGroups() {
	const currentPeople = get(people);
	const currentSettings = get(groupSettings);

	isRegenerating.set(true);
	groups.set([]);

	// Validate settings
	if (currentPeople.filter((p) => !p.isMissing).length === 0) {
		console.warn('No people available to generate groups');
		return;
	}

	if (
		currentSettings.requireLeader &&
		!currentPeople.filter((p) => !p.isMissing).some((p) => p.isLeader)
	) {
		console.warn('Leaders required but no leaders available');
		return;
	}

	if (currentSettings.peoplePerGroup < 2) {
		console.warn('Groups must have at least 2 people');
		return;
	}

	// Small delay to ensure animations reset
	await new Promise((resolve) => setTimeout(resolve, 50));

	const newGroups = generateGroups(currentPeople, currentSettings);
	groups.set(newGroups);

	if (!newGroups || newGroups.length === 0) {
		isRegenerating.set(false);
	} else {
		setTimeout(() => {
			isRegenerating.set(false);
		}, 400);
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
			if (
				typeof parsed === 'object' &&
				parsed !== null &&
				typeof parsed.peoplePerGroup === 'number' &&
				typeof parsed.separateGenders === 'boolean' &&
				typeof parsed.requireLeader === 'boolean' &&
				typeof parsed.groupByNetwork === 'boolean'
			) {
				storedSettings = parsed;
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored group settings:', e);
	}
}

export const groupSettings = writable<GroupSettings>(
	storedSettings || {
		peoplePerGroup: 3,
		separateGenders: false,
		requireLeader: false,
		groupByNetwork: false
	}
);

// Subscribe to changes and update localStorage
groupSettings.subscribe((value) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('groupSettings', JSON.stringify(value));
	}
});
