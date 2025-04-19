/**
 * Family Tree Relationship Finder using Dijkstra's Algorithm
 *
 * This module finds the shortest relationship path between two individuals
 * in a family tree using Dijkstra's algorithm.
 */

/**
 * Find the shortest relationship path between two people in a family tree
 * @param {Array} people - Array of person objects from the family tree
 * @param {String} startId - ID of the first person
 * @param {String} endId - ID of the second person
 * @returns {Object} Object containing path and relationship description
 */
function findShortestPath(people, startId, endId) {
    // Build the relationship graph from people data
    const graph = buildGraph(people);

    // Create dictionary for quick person lookup
    const peopleDict = {};
    people.forEach(person => {
        peopleDict[person.id] = person;
    });

    // Verify both people exist in the graph
    if (!graph[startId] || !graph[endId]) {
        return {
            path: null,
            relationship: "Relation non trouvée: une ou les deux personnes n'existent pas dans l'arbre généalogique."
        };
    }

    // Initialize data structures for Dijkstra's algorithm
    const distances = {};
    const predecessors = {};
    const unvisited = new Set();

    // Initialize all distances to infinity except the start node
    Object.keys(graph).forEach(id => {
        distances[id] = id === startId ? 0 : Infinity;
        predecessors[id] = null;
        unvisited.add(id);
    });

    // Main Dijkstra algorithm loop
    while (unvisited.size > 0) {
        // Find the unvisited node with minimum distance
        let current = findMinDistanceNode(unvisited, distances);

        // If we've reached the target or there are no more reachable nodes
        if (current === null || current === endId) break;

        // Remove current node from unvisited set
        unvisited.delete(current);

        // Process each neighbor of the current node
        for (const neighbor of graph[current]) {
            // Skip already visited nodes
            if (!unvisited.has(neighbor.id)) continue;

            // Calculate tentative distance (all edges have weight 1)
            const tentativeDistance = distances[current] + 1;

            // If we found a shorter path, update the distance and predecessor
            if (tentativeDistance < distances[neighbor.id]) {
                distances[neighbor.id] = tentativeDistance;
                predecessors[neighbor.id] = current;
            }
        }
    }

    // Reconstruct the path
    const path = reconstructPath(predecessors, startId, endId);

    // If no path was found
    if (!path) {
        return {
            path: null,
            relationship: "Aucune relation trouvée entre ces personnes."
        };
    }

    // Generate the relationship description
    const relationshipDescription = describeRelationship(path, peopleDict);

    return {
        path: path,
        relationship: relationshipDescription
    };
}

/**
 * Build a graph representation of the family tree
 * @param {Array} people - Array of person objects
 * @returns {Object} Adjacency list representation of the family graph
 */
function buildGraph(people) {
    const graph = {};

    // Initialize the graph with empty adjacency lists
    people.forEach(person => {
        graph[person.id] = [];
    });

    // Create bidirectional edges for parent-child relationships
    people.forEach(person => {
        // Add edge from child to father
        if (person.father_id && graph[person.father_id]) {
            graph[person.id].push({ id: person.father_id, relation: "père" });
            graph[person.father_id].push({ id: person.id, relation: "enfant" });
        }

        // Add edge from child to mother
        if (person.mother_id && graph[person.mother_id]) {
            graph[person.id].push({ id: person.mother_id, relation: "mère" });
            graph[person.mother_id].push({ id: person.id, relation: "enfant" });
        }
    });

    return graph;
}

/**
 * Find the node with the minimum distance in the unvisited set
 * @param {Set} unvisited - Set of unvisited node IDs
 * @param {Object} distances - Object mapping node IDs to their current distances
 * @returns {String|null} ID of the node with minimum distance, or null if no reachable nodes
 */
function findMinDistanceNode(unvisited, distances) {
    let minDistance = Infinity;
    let minNode = null;

    for (const id of unvisited) {
        if (distances[id] < minDistance) {
            minDistance = distances[id];
            minNode = id;
        }
    }

    // If minDistance is still Infinity, there are no more reachable nodes
    return minDistance === Infinity ? null : minNode;
}

/**
 * Reconstruct the path from start to end using the predecessors map
 * @param {Object} predecessors - Map of node IDs to their predecessor in the shortest path
 * @param {String} startId - ID of the starting node
 * @param {String} endId - ID of the ending node
 * @returns {Array|null} Array of node IDs in the path, or null if no path exists
 */
function reconstructPath(predecessors, startId, endId) {
    // If no path to the end node
    if (predecessors[endId] === null && startId !== endId) {
        return null;
    }

    // Reconstruct the path by following predecessors backward
    const path = [];
    let current = endId;

    while (current !== null) {
        path.unshift(current);
        current = predecessors[current];
    }

    return path;
}

/**
 * Generate a human-readable description of the relationship
 * @param {Array} path - Array of node IDs in the relationship path
 * @param {Object} peopleDict - Dictionary mapping node IDs to person objects
 * @returns {String} Description of the relationship
 */
function describeRelationship(path, peopleDict) {
    if (path.length <= 1) {
        return "C'est la même personne.";
    }

    // Format the path with person names
    const formattedPath = path.map(id => {
        const person = peopleDict[id];
        return `${person.first_name} ${person.last_name}`;
    }).join(" → ");

    // Determine relationship type based on path length
    let relationshipType = "";

    switch (path.length - 1) {
        case 1:
            relationshipType = "relation directe parent/enfant";
            break;
        case 2:
            relationshipType = "relation grand-parent/petit-enfant ou entre frères et sœurs";
            break;
        case 3:
            relationshipType = "relation arrière-grand-parent/arrière-petit-enfant ou entre cousins";
            break;
        default:
            relationshipType = `relation familiale éloignée (distance ${path.length - 1})`;
    }

    return `${formattedPath} - ${relationshipType}`;
}

/**
 * Get detailed information about each person in the path
 * @param {Array} path - Array of node IDs in the relationship path
 * @param {Array} people - Array of person objects
 * @returns {Array} Array of person objects in the path
 */
function getPathDetails(path, people) {
    const peopleDict = {};
    people.forEach(person => {
        peopleDict[person.id] = person;
    });

    return path.map(id => peopleDict[id]);
}

/**
 * Analyze the specific type of relationship between two people
 * @param {Array} path - Array of node IDs in the relationship path
 * @param {Array} people - Array of person objects
 * @returns {String} Specific relationship type
 */
function analyzeRelationshipType(path, people) {
    // Implementation would detect specific relationships like
    // "grand-père paternel", "cousin germain", etc.
    // This is a placeholder for a more detailed implementation

    if (path.length <= 2) {
        return "relation parent-enfant";
    } else if (path.length === 3) {
        // Could be grandparent or sibling
        return "relation grand-parent ou fratrie";
    } else {
        return `relation familiale complexe (${path.length - 1} liens)`;
    }
}

// Export the functions for use in other modules
module.exports = {
    findShortestPath,
    getPathDetails,
    analyzeRelationshipType
};