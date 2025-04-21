export  interface Person {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    maiden_name?: string | null;
    date_of_birth?: string;
    sex?: 'M' | 'F' | string;
    blood_type?: string;
    nationality?: string;
    ethnicity?: string;
    place_of_birth?: string;
    date_of_death?: string | null;
    is_deceased?: boolean;
    cause_of_death?: string | null;
    height_cm?: number;
    eye_color?: string;
    hair_color?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    occupation?: string;
    education?: string;
    religion?: string;
    notes?: string | null;
    legacy_bucket_id?: string | null;
    father_id?: string | null;
    mother_id?: string | null;
  }

  export interface Relation {
    fromId: string;  // Parent
    toId: string;    // Enfant
    weight: number;  // Degré de parenté (1 pour parent-enfant)
  }

  export interface PartitionResult {
    branches: string[][];          // Liste des IDs par sous-famille
    retainedRelations: Relation[]; // Relations conservées par Kruskal
    stats: {
      totalBranches: number;
      largestBranchSize: number;
    };
  }