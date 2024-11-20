export type Person = {
    id: string;
    name: string;
    gender: 'M' | 'F';
    familyNumber?: number;
    isLeader: boolean;
    isMissing?: boolean;
};

export type GroupSettings = {
    peoplePerGroup: number;
    separateGenders: boolean;
    requireLeader: boolean;
};

export type Group = {
    id: number;
    members: Person[];
};
