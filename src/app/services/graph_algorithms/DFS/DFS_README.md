# Family Tree DFS Implementation

This repository contains an implementation of a family tree management system using Depth-First Search (DFS) algorithm as the core traversal mechanism. The implementation allows analyzing family relationships through graph theory.

## Overview

The system represents a family tree as a graph where:
- People are nodes
- Relationships (parent-child, spouse) are edges
- A standardized DFS algorithm enables various relationship queries

## Core Components

### `FamilyTree` Class

The main class that provides family tree representation and traversal.

**Input:**
- JSON data containing people with the following structure:
  ```javascript
  {
    id: String,
    name: String,
    dateOfBirth: String,
    fatherId: String | null,
    motherId: String | null,
    spousesId: String[]
  }
  ```

**Internal Data Structures:**
- `adjacencyList`: Maps person IDs to their relationships
- `nameToIdMap`: Maps names to IDs for quick lookup

### DFS Algorithm Implementation

The core DFS algorithm follows a standardized implementation with customizable behavior.

**Input Parameters:**
```javascript
dfs({
  startNodes,              // Array of node IDs to start DFS from
  processNodeStart,        // Function called when visiting a node
  processNodeEnd,          // Function called after processing a node
  processEdge,             // Function called when traversing an edge
  shouldVisitNode,         // Function determining if a node should be visited
  filterEdges              // Function to filter which edges to follow
})
```

**Output:**
```javascript
{
  colors,          // Node status: 0 (white/unvisited), 1 (gray/in-progress), 2 (black/completed)
  parents,         // Maps nodes to their parent in the DFS tree
  discoveryTimes,  // Discovery timestamps for each node
  finishTimes,     // Completion timestamps for each node
  date             // Final timestamp counter
}
```

## Queries and Operations

The implementation uses the customizable DFS to implement various family tree queries:

### 1. Find Descendants

**Function:** `findDescendants(name)`

Finds all descendants of a named person by following only child relationships during DFS traversal.

### 2. Find Ancestors

**Function:** `findAncestors(name)`

Finds all ancestors of a named person by following only parent relationships during DFS traversal.

### 3. Check Relationship

**Function:** `areRelated(name1, name2)`

Determines if two people are related and finds a path between them using DFS, considering all relationship types.

### 4. Find Generation Level

**Function:** `findGenerationLevel(name)`

Calculates the generation level of a person relative to a root ancestor using BFS for shortest path calculation.

### 5. Find Oldest Common Ancestor

**Function:** `findOldestCommonAncestor(name1, name2)`

Identifies the oldest common ancestor between two people by finding the intersection of their ancestor sets and sorting by date of birth.

### 6. Detect Inconsistencies

**Function:** `detectInconsistencies()`

Checks for logical problems in the family tree:
- Cycles in the parent-child relationships (impossible in real genealogy)
- Temporal inconsistencies (children born before parents)

## Utility Functions

- `loadFamilyTreeFromJSON(jsonFilePath)`: Loads family data from a JSON file
- `demonstrateFamilyTreeAlgorithms(jsonData)`: Demonstrates all operations using sample data

## Usage Example

```javascript
const familyData = [...]; // Your JSON family tree data
const familyTree = new FamilyTree(familyData);

// Find all descendants of John Smith
const descendants = familyTree.findDescendants("John Smith");

// Check if two people are related
const relationInfo = familyTree.areRelated("Sarah Wilson", "David Smith");
```

The system is designed to be flexible, allowing for complex relationship queries through customization of the core DFS algorithm.