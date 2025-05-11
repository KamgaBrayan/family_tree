# Family Tree Dijkstra Implementation

This repository contains an implementation of a family tree relationship finder using Dijkstra's algorithm as the core pathfinding mechanism. The implementation allows discovering the shortest relationship path between any two individuals in a family tree.

## Overview

The system represents a family tree as a weighted graph where:
- People are nodes
- Relationships (parent-child) are bidirectional edges
- Dijkstra's algorithm finds the shortest relationship path
- Relationship descriptions are automatically generated based on path length

## Core Components

### `FamilyTreePathfinder` Class

The main class that provides family relationship pathfinding capabilities.

**Input:**
- JSON data containing people with the following structure:
  ```javascript
  {
    id: String,
    first_name: String,
    last_name: String,
    father_id: String | null,
    mother_id: String | null
    // Additional biographical information
  }
  ```

**Internal Data Structures:**
- `graph`: Maps person IDs to their direct relationships
- `peopleDict`: Maps IDs to complete person objects for quick lookup

### Dijkstra Algorithm Implementation

The core algorithm follows a standardized implementation with specific adaptations for family relationships.

**Input Parameters:**
```javascript
findShortestPath({
  startId,           // ID of the starting person
  endId,             // ID of the target person
  people             // Array of person objects
})
```

**Output:**
```javascript
{
  path,              // Array of IDs representing the shortest path
  relationship       // Human-readable description of the relationship
}
```

## Algorithm Details

### Graph Construction

The algorithm first builds a bidirectional graph from the family data:
- Each person becomes a node with their ID as the key
- Parent-child relationships are represented as edges in both directions
- Each edge has a weight of 1 (representing one direct relationship step)

```javascript
function buildGraph(people) {
  const graph = {};
  
  // Initialize nodes
  people.forEach(person => {
    graph[person.id] = [];
  });
  
  // Add parent-child relationships bidirectionally
  people.forEach(person => {
    if (person.father_id) {
      graph[person.id].push({ id: person.father_id, relation: "père" });
      graph[person.father_id].push({ id: person.id, relation: "enfant" });
    }
    
    if (person.mother_id) {
      graph[person.id].push({ id: person.mother_id, relation: "mère" });
      graph[person.mother_id].push({ id: person.id, relation: "enfant" });
    }
  });
  
  return graph;
}
```

### Shortest Path Discovery

The implementation uses Dijkstra's algorithm with the following components:
- Distance tracking for each node
- Predecessor tracking to reconstruct the path
- Priority queue implementation using a basic set with minimum distance selection

Key algorithm steps:
1. Initialize all distances to infinity except start node (distance 0)
2. Process nodes in order of increasing distance
3. For each node, examine all neighbors and update their distances if a shorter path is found
4. Continue until target node is reached or all reachable nodes are processed
5. Reconstruct path using predecessor references

### Relationship Description

The algorithm generates human-readable relationship descriptions based on:
- Path length (distance between individuals)
- Relationship type classification

```javascript
function describeRelationship(path, people) {
  // Determine relationship type based on path length
  switch (path.length - 1) {
    case 1: return "relation directe parent/enfant";
    case 2: return "relation grand-parent/petit-enfant ou entre frères et sœurs";
    case 3: return "relation arrière-grand-parent/arrière-petit-enfant ou entre cousins";
    default: return `relation familiale éloignée (distance ${path.length - 1})`;
  }
}
```

## Queries and Operations

The implementation provides several key operations:

### 1. Find Shortest Relationship Path

**Function:** `findShortestPath(people, startId, endId)`

Finds the shortest relationship path between two people identified by their IDs.

### 2. Get Path Details

**Function:** `getPathDetails(path, people)`

Provides detailed information about each person in the relationship path.

### 3. Analyze Relationship Type

**Function:** `analyzeRelationshipType(path, people)`

Determines the specific type of familial relationship based on the path structure.

## Performance Characteristics

- **Time Complexity**: O((V + E) log V) where V is the number of people and E is the number of relationships
- **Space Complexity**: O(V) for storing distances, predecessors, and the priority queue

## Usage Example

```javascript
const { findShortestPath } = require('./dijkstra');
const familyData = require('./family-data.json').people;

// Find relationship between two people
const result = findShortestPath(
  familyData,
  '0437c60c-a05d-41ba-9857-489af66bcd9c',  // Polly Flores
  'dfe47f4a-5d58-4101-91ce-bde7f13d081e'   // Demetrius Flores
);

console.log(result.path);          // Array of IDs in the path
console.log(result.relationship);  // "Polly Flores -> Demetrius Flores - relation directe parent/enfant"
```

## Advantages of Dijkstra for Family Trees

1. **Finds Optimal Paths**: Guarantees the shortest relationship path between any two individuals
2. **Handles Complex Structures**: Works with any family structure including multiple marriages and complex relationships
3. **Efficient Processing**: Prioritizes exploring closer relationships first
4. **Relationship Description**: Automatically classifies and describes the relationship type

The system is designed to be flexible, allowing for relationship discovery across complex family structures while providing human-readable descriptions of the connections found.