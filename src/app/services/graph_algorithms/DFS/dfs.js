/**
 * Classe FamilyTree avec implémentation du DFS standardisé
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
     * Implémentation standardisée du DFS basée sur le pseudocode fourni
     * 
     * @param {Object} options - Options pour personnaliser le comportement du DFS
     * @param {Array} options.startNodes - Nœuds de départ (si non spécifié, tous les nœuds seront considérés)
     * @param {Function} options.processNodeStart - Fonction à appeler au début du traitement d'un nœud
     * @param {Function} options.processNodeEnd - Fonction à appeler à la fin du traitement d'un nœud
     * @param {Function} options.processEdge - Fonction à appeler lors du traitement d'une arête
     * @param {Function} options.shouldVisitNode - Fonction pour déterminer si un nœud doit être visité
     * @param {Function} options.filterEdges - Fonction pour filtrer les arêtes à parcourir
     * @returns {Object} - Résultats du DFS incluant les couleurs, parents, dates de début et de fin
     */
    dfs(options = {}) {
      const {
        startNodes = Object.keys(this.adjacencyList),
        processNodeStart = () => {},
        processNodeEnd = () => {},
        processEdge = () => {},
        shouldVisitNode = () => true,
        filterEdges = () => true
      } = options;
      
      // Initialisation conforme au pseudocode
      const colors = {}; // BLANC = 0, GRIS = 1, NOIR = 2
      const parents = {};
      const discoveryTimes = {};
      const finishTimes = {};
      let date = 0;
      
      // Initialiser tous les sommets
      Object.keys(this.adjacencyList).forEach(nodeId => {
        colors[nodeId] = 0; // BLANC
        parents[nodeId] = null;
      });
      
      // Fonction récursive de visite (VISITER-PP)
      const visit = (nodeId) => {
        colors[nodeId] = 1; // GRIS - nœud découvert
        date += 1;
        discoveryTimes[nodeId] = date;
        
        // Appeler la fonction de traitement au début
        processNodeStart({
          nodeId,
          discoveryTime: date,
          parent: parents[nodeId]
        });
        
        // Explorer les arêtes adjacentes (Adj[u])
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
            parents[neighborId] = nodeId;
            visit(neighborId);
          }
        }
        
        // Marquer comme noir - fini avec ce nœud
        colors[nodeId] = 2; // NOIR
        date += 1;
        finishTimes[nodeId] = date;
        
        // Appeler la fonction de traitement à la fin
        processNodeEnd({
          nodeId,
          discoveryTime: discoveryTimes[nodeId],
          finishTime: date,
          parent: parents[nodeId]
        });
      };
      
      // Parcourir tous les nœuds de départ
      for (const nodeId of startNodes) {
        if (colors[nodeId] === 0 && shouldVisitNode(nodeId)) { // Si BLANC
          visit(nodeId);
        }
      }
      
      return {
        colors,
        parents,
        discoveryTimes,
        finishTimes,
        date
      };
    }
    
    // 1. Trouver tous les descendants d'une personne
    findDescendants(name) {
      const personId = this.getPersonIdByName(name);
      if (!personId) return { error: `Person named "${name}" not found` };
      
      const descendants = [];
      
      this.dfs({
        startNodes: [personId],
        processNodeStart: ({ nodeId }) => {
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
      
      this.dfs({
        startNodes: [personId],
        processNodeStart: ({ nodeId }) => {
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
      
      let found = false;
      const parents = {};
      
      this.dfs({
        startNodes: [personId1],
        processEdge: ({ to }) => {
          if (to === personId2) {
            found = true;
          }
        },
        // Stocker les parents pour pouvoir reconstruire le chemin
        shouldVisitNode: (nodeId, edge) => {
          parents[edge.id] = nodeId;
          return true;
        },
        // Parcourir tous les types de relations
        filterEdges: () => true
      });
      
      // Si un chemin est trouvé, le reconstruire
      if (found) {
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
        const distances = {};
        Object.keys(this.adjacencyList).forEach(id => {
          distances[id] = Infinity;
        });
        distances[rootId] = 0;
        
        // Utiliser un BFS (plus approprié ici que DFS pour trouver le plus court chemin)
        const queue = [rootId];
        const visited = new Set([rootId]);
        
        while (queue.length > 0) {
          const current = queue.shift();
          
          // Parcourir uniquement les relations enfant
          const childEdges = this.adjacencyList[current].filter(edge => edge.relationType === 'child');
          
          for (const edge of childEdges) {
            const childId = edge.id;
            
            if (!visited.has(childId)) {
              visited.add(childId);
              distances[childId] = distances[current] + 1;
              queue.push(childId);
              
              if (childId === personId && distances[childId] < shortestPath) {
                shortestPath = distances[childId];
                rootWithShortestPath = rootId;
              }
            }
          }
        }
      }
      
      if (rootWithShortestPath === null) {
        return { error: `No path found from any root to "${name}"` };
      }
      
      const rootPerson = this.getPersonById(rootWithShortestPath);
      return { 
        level: shortestPath, 
        root: rootPerson.name 
      };
    }
    
    // 5. Trouver l'ancêtre commun le plus ancien
    findOldestCommonAncestor(name1, name2) {
      const personId1 = this.getPersonIdByName(name1);
      const personId2 = this.getPersonIdByName(name2);
      
      if (!personId1 || !personId2) {
        return { 
          error: `One or both people not found: "${name1}", "${name2}"` 
        };
      }
      
      // Trouver tous les ancêtres de la première personne
      const ancestors1 = new Map();
      
      this.dfs({
        startNodes: [personId1],
        processNodeStart: ({ nodeId }) => {
          const person = this.getPersonById(nodeId);
          ancestors1.set(nodeId, { 
            name: person.name, 
            dob: person.dateOfBirth
          });
        },
        filterEdges: (edge) => edge.relationType === 'father' || edge.relationType === 'mother'
      });
      
      // Trouver tous les ancêtres de la seconde personne
      const ancestors2 = new Map();
      
      this.dfs({
        startNodes: [personId2],
        processNodeStart: ({ nodeId }) => {
          const person = this.getPersonById(nodeId);
          ancestors2.set(nodeId, { 
            name: person.name, 
            dob: person.dateOfBirth
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
            dob: data.dateOfBirth
          });
        }
      });
      
      if (commonAncestors.length === 0) {
        return { error: `No common ancestor found between "${name1}" and "${name2}"` };
      }
      
      // Trier par date de naissance (plus ancien d'abord)
      commonAncestors.sort((a, b) => {
        return new Date(a.dob) - new Date(b.dob);
      });
      
      return commonAncestors[0];
    }
    
    // 6. Détecter les incohérences (cycles) dans l'arbre généalogique
    detectInconsistencies() {
      const inconsistencies = [];
      
      // Utiliser DFS pour détecter les cycles dans le graphe
      for (const person of this.people) {
        const recursionStack = new Set();
        
        this.dfs({
          startNodes: [person.id],
          processNodeStart: ({ nodeId }) => {
            recursionStack.add(nodeId);
          },
          processNodeEnd: ({ nodeId }) => {
            recursionStack.delete(nodeId);
          },
          processEdge: ({ from, to, relationType }) => {
            // Si on trouve un nœud qui est déjà dans la pile de récursion 
            // et qui n'est pas le nœud parent direct, c'est un cycle
            if (relationType === 'father' || relationType === 'mother') {
              if (recursionStack.has(to)) {
                const fromPerson = this.getPersonById(from);
                const toPerson = this.getPersonById(to);
                inconsistencies.push({
                  type: "cycle",
                  message: `Cycle detected: ${fromPerson.name} is both an ancestor and descendant of ${toPerson.name}`
                });
              }
            }
          },
          filterEdges: (edge) => edge.relationType === 'father' || edge.relationType === 'mother'
        });
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
    
    console.log("\n5. Oldest common ancestor of Sarah Wilson and David Smith:");
    console.log(familyTree.findOldestCommonAncestor("Sarah Wilson", "David Smith"));
    
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