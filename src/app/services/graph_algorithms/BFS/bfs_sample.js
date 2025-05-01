/**
 * Classe FamilyTree avec implémentation du BFS standardisé
 */
class FamilyTree {
  constructor(jsonData) {
    this.people = jsonData;
    this.adjacencyList = this.buildAdjacencyList();
    this.nameToIdMap = this.buildNameToIdMap();
  }

  // Construire la liste d'adjacence à partir des données JSON
  buildAdjacencyList() {
    const adjacencyList = {};
    
    // Initialiser la liste d'adjacence pour chaque personne
    this.people.forEach(person => {
      adjacencyList[person.id] = [];
    });
    
    // Ajouter toutes les relations
    this.people.forEach(person => {
      // Ajouter les relations parent-enfant
      if (person.fatherId) {
        adjacencyList[person.id].push({ id: person.fatherId, relationType: 'father' });
        adjacencyList[person.fatherId].push({ id: person.id, relationType: 'child' });
      }
      if (person.motherId) {
        adjacencyList[person.id].push({ id: person.motherId, relationType: 'mother' });
        adjacencyList[person.motherId].push({ id: person.id, relationType: 'child' });
      }
      
      // Ajouter les relations de conjoint
      person.spousesId.forEach(spouseId => {
        // Éviter les doublons en ne l'ajoutant que si l'ID est plus petit 
        // (puisque la relation conjoint-conjoint est déjà bidirectionnelle)
        if (person.id < spouseId) {
          adjacencyList[person.id].push({ id: spouseId, relationType: 'spouse' });
          adjacencyList[spouseId].push({ id: person.id, relationType: 'spouse' });
        }
      });
    });
    
    return adjacencyList;
  }
  
  // Construire une map des noms aux IDs pour les recherches par nom
  buildNameToIdMap() {
    const nameToIdMap = {};
    this.people.forEach(person => {
      nameToIdMap[person.name.toLowerCase()] = person.id;
    });
    return nameToIdMap;
  }
  
  // Trouver l'ID d'une personne par son nom (insensible à la casse)
  getPersonIdByName(name) {
    const lowerCaseName = name.toLowerCase();
    return this.nameToIdMap[lowerCaseName];
  }
  
  // Obtenir une personne par son ID
  getPersonById(id) {
    return this.people.find(person => person.id === id);
  }
  
  // Obtenir une personne par son nom
  getPersonByName(name) {
    const id = this.getPersonIdByName(name);
    return id ? this.getPersonById(id) : null;
  }

  /**
   * Implémentation standardisée du BFS
   * 
   * @param {Object} options - Options pour personnaliser le comportement du BFS
   * @param {Array} options.startNodes - Nœuds de départ (si non spécifié, tous les nœuds seront considérés)
   * @param {Function} options.processNode - Fonction à appeler lors du traitement d'un nœud
   * @param {Function} options.processEdge - Fonction à appeler lors du traitement d'une arête
   * @param {Function} options.shouldVisitNode - Fonction pour déterminer si un nœud doit être visité
   * @param {Function} options.filterEdges - Fonction pour filtrer les arêtes à parcourir
   * @returns {Object} - Résultats du BFS incluant les couleurs, parents, distances et niveaux
   */
  bfs(options = {}) {
    const {
      startNodes = Object.keys(this.adjacencyList),
      processNode = () => {},
      processEdge = () => {},
      shouldVisitNode = () => true,
      filterEdges = () => true
    } = options;
    
    // Initialisation
    const colors = {}; // BLANC = 0, GRIS = 1, NOIR = 2
    const parents = {};
    const distances = {};
    const levels = {};
    
    // Initialiser tous les sommets
    Object.keys(this.adjacencyList).forEach(nodeId => {
      colors[nodeId] = 0; // BLANC
      parents[nodeId] = null;
      distances[nodeId] = Infinity;
      levels[nodeId] = -1;
    });
    
    // Parcourir tous les nœuds de départ
    for (const startNodeId of startNodes) {
      if (colors[startNodeId] === 0 && shouldVisitNode(startNodeId)) { // Si BLANC
        // Initialiser le nœud de départ
        colors[startNodeId] = 1; // GRIS
        distances[startNodeId] = 0;
        levels[startNodeId] = 0;
        
        // File d'attente pour le BFS
        const queue = [startNodeId];
        
        // Tant que la file n'est pas vide
        while (queue.length > 0) {
          const nodeId = queue.shift(); // Retirer le premier élément de la file
          
          // Appeler la fonction de traitement du nœud
          processNode({
            nodeId,
            distance: distances[nodeId],
            level: levels[nodeId],
            parent: parents[nodeId]
          });
          
          // Explorer les arêtes adjacentes
          const filteredEdges = this.adjacencyList[nodeId].filter(filterEdges);
          
          for (const edge of filteredEdges) {
            const neighborId = edge.id;
            
            // Appeler la fonction de traitement d'arête
            processEdge({
              from: nodeId,
              to: neighborId,
              relationType: edge.relationType,
              color: colors[neighborId]
            });
            
            // Si le voisin est blanc et doit être visité
            if (colors[neighborId] === 0 && shouldVisitNode(neighborId, edge)) {
              colors[neighborId] = 1; // GRIS
              parents[neighborId] = nodeId;
              distances[neighborId] = distances[nodeId] + 1;
              levels[neighborId] = levels[nodeId] + 1;
              queue.push(neighborId);
            }
          }
          
          // Marquer comme noir - fini avec ce nœud
          colors[nodeId] = 2; // NOIR
        }
      }
    }
    
    return {
      colors,
      parents,
      distances,
      levels
    };
  }
  
  // 1. Trouver tous les descendants d'une personne
  findDescendants(name) {
    const personId = this.getPersonIdByName(name);
    if (!personId) return { error: `Person named "${name}" not found` };
    
    const descendants = [];
    
    this.bfs({
      startNodes: [personId],
      processNode: ({ nodeId }) => {
        // Ne pas ajouter la personne de départ à ses propres descendants
        if (nodeId !== personId) {
          const person = this.getPersonById(nodeId);
          descendants.push({
            id: nodeId,
            name: person.name
          });
        }
      },
      // Ne visiter que les enfants
      filterEdges: (edge) => edge.relationType === 'child',
      shouldVisitNode: () => true
    });
    
    return descendants;
  }
  
  // 2. Trouver tous les ancêtres d'une personne
  findAncestors(name) {
    const personId = this.getPersonIdByName(name);
    if (!personId) return { error: `Person named "${name}" not found` };
    
    const ancestors = [];
    
    this.bfs({
      startNodes: [personId],
      processNode: ({ nodeId }) => {
        // Ne pas ajouter la personne de départ à ses propres ancêtres
        if (nodeId !== personId) {
          const person = this.getPersonById(nodeId);
          ancestors.push({
            id: nodeId,
            name: person.name
          });
        }
      },
      // Ne visiter que les parents
      filterEdges: (edge) => edge.relationType === 'father' || edge.relationType === 'mother',
      shouldVisitNode: () => true
    });
    
    return ancestors;
  }
  
  // 3. Vérifier si deux personnes sont liées
  areRelated(name1, name2) {
    const personId1 = this.getPersonIdByName(name1);
    const personId2 = this.getPersonIdByName(name2);
    
    if (!personId1 || !personId2) {
      return { 
        related: false, 
        error: `One or both people not found: "${name1}", "${name2}"` 
      };
    }
    
    if (personId1 === personId2) {
      return { related: true, path: [this.getPersonById(personId1).name] };
    }
    
    // Utiliser BFS pour trouver le chemin le plus court
    const { parents } = this.bfs({
      startNodes: [personId1],
      shouldVisitNode: () => true,
      filterEdges: () => true
    });
    
    // Si un chemin est trouvé, le reconstruire
    if (parents[personId2] !== null) {
      const path = [personId2];
      let current = personId2;
      
      while (current !== personId1 && parents[current]) {
        current = parents[current];
        path.unshift(current);
      }
      
      // Convertir les IDs en noms
      const pathNames = path.map(id => this.getPersonById(id).name);
      return { related: true, path: pathNames };
    }
    
    return { related: false, path: [] };
  }
  
  // 4. Trouver le niveau de génération d'une personne par rapport à la racine
  findGenerationLevel(name) {
    const personId = this.getPersonIdByName(name);
    if (!personId) return { error: `Person named "${name}" not found` };
    
    // Trouver les personnes sans parents (racines)
    const roots = this.people
      .filter(person => !person.fatherId && !person.motherId)
      .map(person => person.id);
    
    if (roots.length === 0) {
      return { error: "No root (personnes without parents) found in the family tree" };
    }
    
    // Pour chaque racine, calculer le plus court chemin vers la personne
    let shortestPath = Infinity;
    let rootWithShortestPath = null;
    
    for (const rootId of roots) {
      // Utiliser BFS pour trouver le plus court chemin
      const { distances } = this.bfs({
        startNodes: [rootId],
        // Parcourir uniquement les relations enfant
        filterEdges: (edge) => edge.relationType === 'child'
      });
      
      if (distances[personId] < shortestPath) {
        shortestPath = distances[personId];
        rootWithShortestPath = rootId;
      }
    }
    
    if (rootWithShortestPath === null || shortestPath === Infinity) {
      return { error: `No path found from any root to "${name}"` };
    }
    
    const rootPerson = this.getPersonById(rootWithShortestPath);
    return { 
      level: shortestPath, 
      root: rootPerson.name 
    };
  }
  
  // 5. Trouver l'ancêtre commun le plus proche
  findClosestCommonAncestor(name1, name2) {
    const personId1 = this.getPersonIdByName(name1);
    const personId2 = this.getPersonIdByName(name2);
    
    if (!personId1 || !personId2) {
      return { 
        error: `One or both people not found: "${name1}", "${name2}"` 
      };
    }
    
    // Trouver tous les ancêtres de la première personne avec leurs distances
    const ancestors1 = new Map();
    
    this.bfs({
      startNodes: [personId1],
      processNode: ({ nodeId, distance }) => {
        const person = this.getPersonById(nodeId);
        ancestors1.set(nodeId, { 
          name: person.name, 
          distance
        });
      },
      filterEdges: (edge) => edge.relationType === 'father' || edge.relationType === 'mother'
    });
    
    // Trouver tous les ancêtres de la seconde personne avec leurs distances
    const ancestors2 = new Map();
    
    this.bfs({
      startNodes: [personId2],
      processNode: ({ nodeId, distance }) => {
        const person = this.getPersonById(nodeId);
        ancestors2.set(nodeId, { 
          name: person.name, 
          distance
        });
      },
      filterEdges: (edge) => edge.relationType === 'father' || edge.relationType === 'mother'
    });
    
    // Trouver les ancêtres communs
    const commonAncestors = [];
    ancestors1.forEach((data, id) => {
      if (ancestors2.has(id)) {
        commonAncestors.push({
          id,
          name: data.name,
          totalDistance: data.distance + ancestors2.get(id).distance
        });
      }
    });
    
    if (commonAncestors.length === 0) {
      return { error: `No common ancestor found between "${name1}" and "${name2}"` };
    }
    
    // Trier par distance totale (le plus proche d'abord)
    commonAncestors.sort((a, b) => a.totalDistance - b.totalDistance);
    
    return commonAncestors[0];
  }
  
  // 6. Détecter les incohérences (cycles) dans l'arbre généalogique
  detectInconsistencies() {
    const inconsistencies = [];
    
    // Utiliser BFS pour détecter les cycles dans le graphe
    for (const person of this.people) {
      const visited = new Set();
      const queue = [{ id: person.id, path: [person.id] }];
      
      while (queue.length > 0) {
        const { id: nodeId, path } = queue.shift();
        
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        // Filtrer pour ne considérer que les relations parent
        const parentEdges = this.adjacencyList[nodeId].filter(
          edge => edge.relationType === 'father' || edge.relationType === 'mother'
        );
        
        for (const edge of parentEdges) {
          const parentId = edge.id;
          
          // Si le parent est déjà dans le chemin, c'est un cycle
          if (path.includes(parentId)) {
            const cycle = [...path.slice(path.indexOf(parentId)), parentId];
            const cyclePeople = cycle.map(id => this.getPersonById(id).name);
            
            inconsistencies.push({
              type: "cycle",
              message: `Cycle detected: ${cyclePeople.join(' -> ')}`
            });
          } else {
            // Sinon, continuer la recherche
            queue.push({ id: parentId, path: [...path, parentId] });
          }
        }
      }
    }
    
    // Vérifier les dates (un enfant ne peut pas naître avant ses parents)
    this.people.forEach(person => {
      if (person.fatherId) {
        const father = this.getPersonById(person.fatherId);
        if (father && new Date(person.dateOfBirth) < new Date(father.dateOfBirth)) {
          inconsistencies.push({
            type: "date",
            personId: person.id,
            personName: person.name,
            message: `${person.name} was born before their father ${father.name}`
          });
        }
      }
      
      if (person.motherId) {
        const mother = this.getPersonById(person.motherId);
        if (mother && new Date(person.dateOfBirth) < new Date(mother.dateOfBirth)) {
          inconsistencies.push({
            type: "date",
            personId: person.id,
            personName: person.name,
            message: `${person.name} was born before their mother ${mother.name}`
          });
        }
      }
    });
    
    return inconsistencies;
  }
}

/**
 * Fonction pour charger et analyser un arbre généalogique à partir d'un fichier JSON
 * @param {String} jsonFilePath - Chemin vers le fichier JSON
 * @returns {FamilyTree} - Instance de FamilyTree
 */
function loadFamilyTreeFromJSON(jsonFilePath) {
  try {
    // Dans un environnement Node.js
    if (typeof require !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      return new FamilyTree(jsonData);
    } 
    // Dans un environnement navigateur
    else {
      return fetch(jsonFilePath)
        .then(response => response.json())
        .then(jsonData => new FamilyTree(jsonData))
        .catch(error => {
          console.error("Error loading family tree data:", error);
          return null;
        });
    }
  } catch (error) {
    console.error("Error loading family tree data:", error);
    return null;
  }
}

/**
 * Fonction de démonstration des algorithmes sur l'arbre généalogique
 * @param {String|Object} jsonData - Chemin vers le fichier JSON ou données JSON directes
 */
async function demonstrateFamilyTreeAlgorithms(jsonData) {
  let familyTree;
  
  if (typeof jsonData === 'string') {
    // Si c'est une chaîne, on la traite comme un chemin de fichier
    familyTree = await loadFamilyTreeFromJSON(jsonData);
  } else {
    // Sinon, on considère qu'il s'agit directement des données JSON
    familyTree = new FamilyTree(jsonData);
  }
  
  if (!familyTree) {
    console.error("Failed to load family tree data");
    return;
  }
  
  console.log("1. Descendants of John Smith:");
  console.log(familyTree.findDescendants("John Smith"));
  
  console.log("\n2. Ancestors of Olivia Smith:");
  console.log(familyTree.findAncestors("Olivia Smith"));
  
  console.log("\n3. Are Sarah Wilson and David Smith related?");
  console.log(familyTree.areRelated("Sarah Wilson", "David Smith"));
  
  console.log("\n4. Generation level of James Wilson:");
  console.log(familyTree.findGenerationLevel("James Wilson"));
  
  console.log("\n5. Closest common ancestor of Sarah Wilson and David Smith:");
  console.log(familyTree.findClosestCommonAncestor("Sarah Wilson", "David Smith"));
  
  console.log("\n6. Checking for inconsistencies in the family tree:");
  console.log(familyTree.detectInconsistencies());
}

// Exporter les classes et fonctions
if (typeof module !== 'undefined') {
  module.exports = {
    FamilyTree,
    loadFamilyTreeFromJSON,
    demonstrateFamilyTreeAlgorithms
  };
}
