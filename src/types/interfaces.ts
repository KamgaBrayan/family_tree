// Define these interfaces in a file like 'src/types/family-tree.ts'

// Person interface representing an individual in the family tree
export interface Person {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  maiden_name: string | null;
  date_of_birth: string | null;
  sex: string;
  blood_type: string | null;
  nationality: string | null;
  ethnicity: string | null;
  place_of_birth: string | null;
  date_of_death: string | null;
  is_deceased: boolean;
  cause_of_death: string | null;
  height_cm: number | null;
  eye_color: string | null;
  hair_color: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  education: string | null;
  religion: string | null;
  notes: string | null;
  legacy_bucket_id: string | null;
  father_id: string | null;
  mother_id: string | null;
  profile_image_url?: string; // Optional profile image URL
}

// Family tree data structure
export interface FamilyTreeData {
  people: Person[];
}

export type RelationshipType = 
  | 'self' 
  | 'father' 
  | 'mother' 
  | 'child' 
  | 'sibling' 
  | 'spouse' 
  | 'grandparent' 
  | 'grandchild' 
  | 'cousin' 
  | 'aunt' 
  | 'uncle' 
  | 'niece' 
  | 'nephew'
  | 'extended'
  | 'unknown';


// Interface for person with additional relationship information
export interface PersonWithRelationship extends Person {
  generation?: number;
  relationship?: string;
  parentId?: string;
  childId?: string;
}

// Interface for relationship information
export interface Relationship {
  children: Person[];
  parents: Person[];
  siblings: Person[];
}

export interface RelationshipPath {
  path: string[];
  description: string;
}

// Interface for algorithm results
export interface AlgorithmResult {
  name: string;
  description: string;
  metrics: Record<string, string | number>;
  path?: PersonWithRelationship[];
  clusters?: {
    id: number;
    name: string;
    members: number;
  }[];
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

export interface GenerationsMap {
  [key: string]: PersonWithRelationship[];
}

