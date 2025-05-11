# **Family Tree Kruskal Algorithm Implementation**

This repository implements a family tree analysis system using **Kruskal's algorithm** to identify family branches and relationships through graph theory concepts.

## **Overview**

The system models a family as a graph where:
- **Nodes** represent individuals
- **Edges** represent parent-child relationships
- **Kruskal's algorithm** partitions the tree into meaningful family branches

## **Core Components**

### **1. Data Structures**

#### **`Person` Interface**
```typescript
interface Person {
  id: string;
  first_name: string;
  father_id: string | null;
  mother_id: string | null;
  // ... other fields
}
```

#### **`Relation` Interface**
```typescript
interface Relation {
  fromId: string;  // Parent ID
  toId: string;    // Child ID
  weight: number;  // Relationship strength (1 for parent-child)
}
```

#### **`UnionFind` Class**
Manages connected components with path compression and union by rank:
```typescript
class UnionFind {
  private parent: Record<string, string>;
  private rank: Record<string, number>;

  constructor(elements: string[]);
  find(x: string): string;
  union(x: string, y: string): void;
}
```

### **2. Main Algorithm**

#### **`kruskalFamilyPartition` Function**
```typescript
function kruskalFamilyPartition(persons: Person[]): PartitionResult {
  // 1. Extract relations from parent IDs
  // 2. Run Kruskal's algorithm
  // 3. Return family branches and statistics
}
```

**Output Structure:**
```typescript
interface PartitionResult {
  branches: string[][];          // Array of family branches
  retainedRelations: Relation[];  // Relationships kept in the MST
  stats: {
    totalBranches: number;
    largestBranchSize: number;
  };
}
```

## **Key Features**

### **1. Family Branch Detection**
Identifies distinct family groups by:
- Connecting parent-child relationships
- Merging individuals who share ancestors

**Example Output:**
```json
{
  "branches": [
    ["1", "2", "3"],  // Main family branch
    ["4", "5"]        // Another branch
  ]
}
```

### **2. Relationship Analysis**
- **`findClosestFamily(id)`**: Returns immediate family members (parents/children)
- **`getGenerationalDepth(id)`**: Calculates ancestral depth using DFS

### **3. Data Validation**
Detects:
- Orphaned family members
- Circular relationships (impossible in genealogy)
- Temporal inconsistencies (children born before parents)

## **Usage Example**

```typescript
import { kruskalFamilyPartition } from './family-kruskal';

const persons = [
  { id: "1", first_name: "Grandpa", father_id: null, mother_id: null },
  { id: "2", first_name: "Dad", father_id: "1", mother_id: null },
  { id: "3", first_name: "Child", father_id: "2", mother_id: null }
];

const result = kruskalFamilyPartition(persons);
console.log(result.branches); 
// Output: [ ["1", "2", "3"] ] (Single connected family)
```

## **Comparison with DFS Implementation**

| Feature               | Kruskal Approach          | DFS Approach               |
|-----------------------|--------------------------|---------------------------|
| **Primary Use**       | Branch detection         | Path finding              |
| **Algorithm**         | Minimum Spanning Tree    | Graph traversal           |
| **Output**           | Family clusters          | Ancestor/descendant paths |
| **Complexity**       | O(E log E)               | O(V + E)                  |

## **Extensions**
1. **Visualization**: Use D3.js to render family branches
2. **Relationship Weights**: Custom weights for adoptions/marriages
3. **Import/Export**: JSON/CSV compatibility

