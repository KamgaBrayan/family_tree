import { Person, FamilyTreeData, PersonWithRelationship } from '../../../types/interfaces';

/**
 * Utilise l'algorithme BFS pour trouver les membres de la famille liés à une personne
 * @param rootPerson La personne racine
 * @param maxGenerations Nombre maximum de générations à explorer
 * @param familyData Données complètes de l'arbre familial
 * @returns Liste des personnes liées avec leurs relations
 */
export function bfs(
  rootPerson: Person,
  maxGenerations: number,
  familyData: FamilyTreeData
): PersonWithRelationship[] {
  if (!rootPerson || !familyData) return [];

  // Résultat final
  const result: PersonWithRelationship[] = [];
  // Ensemble pour suivre les personnes déjà ajoutées
  const added = new Set<string>();
  // Liste des IDs de personnes qui ont une relation directe avec la personne sélectionnée
  const relatedIds = new Set<string>();

  // 1. Ajouter la personne sélectionnée
  const personWithRelation: PersonWithRelationship = {
    ...rootPerson,
    generation: 0,
    relationship: 'self'
  };
  result.push(personWithRelation);
  added.add(rootPerson.id);
  relatedIds.add(rootPerson.id);

  // 2. Ajouter les parents
  if (rootPerson.father_id) {
    const father = familyData.people.find(p => p.id === rootPerson.father_id);
    if (father && !added.has(father.id)) {
      result.push({
        ...father,
        generation: -1,
        relationship: 'father',
        childId: rootPerson.id
      });
      added.add(father.id);
      relatedIds.add(father.id);
    }
  }

  if (rootPerson.mother_id) {
    const mother = familyData.people.find(p => p.id === rootPerson.mother_id);
    if (mother && !added.has(mother.id)) {
      result.push({
        ...mother,
        generation: -1,
        relationship: 'mother',
        childId: rootPerson.id
      });
      added.add(mother.id);
      relatedIds.add(mother.id);
    }
  }

  // 3. Ajouter les enfants
  const children = familyData.people.filter(
    p => p.father_id === rootPerson.id || p.mother_id === rootPerson.id
  );
  
  for (const child of children) {
    if (!added.has(child.id)) {
      result.push({
        ...child,
        generation: 1,
        relationship: 'child',
        parentId: rootPerson.id
      });
      added.add(child.id);
      relatedIds.add(child.id);
    }
  }

  // 4. Ajouter les frères et sœurs (enfants des parents)
  if (rootPerson.father_id || rootPerson.mother_id) {
    const siblings = familyData.people.filter(
      p => p.id !== rootPerson.id && 
        ((rootPerson.father_id && p.father_id === rootPerson.father_id) || 
         (rootPerson.mother_id && p.mother_id === rootPerson.mother_id))
    );
    
    for (const sibling of siblings) {
      if (!added.has(sibling.id)) {
        result.push({
          ...sibling,
          generation: 0,
          relationship: 'sibling'
        });
        added.add(sibling.id);
        relatedIds.add(sibling.id);
      }
    }
  }

  // 5. Trouver et ajouter le conjoint si disponible
  const findSpouse = () => {
    // Chercher parmi les personnes qui ont des enfants en commun avec la personne sélectionnée
    const potentialSpouses = new Set<string>();
    
    // Pour chaque enfant, ajouter l'autre parent comme conjoint potentiel
    for (const child of children) {
      if (child.father_id === rootPerson.id && child.mother_id) {
        potentialSpouses.add(child.mother_id);
      } else if (child.mother_id === rootPerson.id && child.father_id) {
        potentialSpouses.add(child.father_id);
      }
    }
    
    // Ajouter les conjoints trouvés
    for (const spouseId of potentialSpouses) {
      const spouse = familyData.people.find(p => p.id === spouseId);
      if (spouse && !added.has(spouse.id)) {
        result.push({
          ...spouse,
          generation: 0,
          relationship: 'spouse',
          spouse_id: rootPerson.id
        });
        // Ajouter la référence du conjoint à la personne sélectionnée
        personWithRelation.spouse_id = spouse.id;
        added.add(spouse.id);
        relatedIds.add(spouse.id);
      }
    }
  };
  
  findSpouse();

  // Filtrer le résultat pour ne garder que les personnes directement liées à la personne sélectionnée
  return result.filter(person => relatedIds.has(person.id));
}

/**
 * Trouve le chemin le plus court entre deux personnes en utilisant l'algorithme de Dijkstra
 * @param person1 Première personne
 * @param person2 Deuxième personne
 * @param familyData Données complètes de l'arbre familial
 * @returns Chemin le plus court entre les deux personnes
 */
export function findRelationshipPath(
  person1: Person,
  person2: Person,
  familyData: FamilyTreeData
): PersonWithRelationship[] {
  if (!person1 || !person2 || !familyData) return [];
  if (person1.id === person2.id) return [{ ...person1, relationship: 'self' }];

  // Implémentation simplifiée de Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const unvisited = new Set<string>();

  // Initialiser les distances
  familyData.people.forEach(person => {
    distances.set(person.id, Infinity);
    unvisited.add(person.id);
  });
  distances.set(person1.id, 0);

  while (unvisited.size > 0) {
    // Trouver le nœud non visité avec la plus petite distance
    let currentId = '';
    let minDistance = Infinity;
    
    for (const id of unvisited) {
      const distance = distances.get(id) || Infinity;
      if (distance < minDistance) {
        minDistance = distance;
        currentId = id;
      }
    }

    // Si on a atteint la destination ou s'il n'y a plus de chemin
    if (currentId === person2.id || minDistance === Infinity) break;
    
    // Marquer comme visité
    unvisited.delete(currentId);
    
    // Trouver les voisins
    const current = familyData.people.find(p => p.id === currentId)!;
    const neighbors: string[] = [];
    
    // Parents
    if (current.father_id) neighbors.push(current.father_id);
    if (current.mother_id) neighbors.push(current.mother_id);
    
    // Enfants
    const children = familyData.people.filter(
      p => p.father_id === current.id || p.mother_id === current.id
    );
    children.forEach(child => neighbors.push(child.id));
    
    // Frères et sœurs
    if (current.father_id || current.mother_id) {
      const siblings = familyData.people.filter(
        p => p.id !== current.id && 
          ((current.father_id && p.father_id === current.father_id) || 
           (current.mother_id && p.mother_id === current.mother_id))
      );
      siblings.forEach(sibling => neighbors.push(sibling.id));
    }
    
    // Mettre à jour les distances
    for (const neighborId of neighbors) {
      if (!unvisited.has(neighborId)) continue;
      
      const newDistance = (distances.get(currentId) || 0) + 1;
      if (newDistance < (distances.get(neighborId) || Infinity)) {
        distances.set(neighborId, newDistance);
        previous.set(neighborId, currentId);
      }
    }
  }
  
  // Reconstruire le chemin
  const path: string[] = [];
  let currentId = person2.id;
  
  while (currentId && currentId !== person1.id) {
    path.unshift(currentId);
    currentId = previous.get(currentId) || '';
  }
  path.unshift(person1.id);
  
  // Convertir les IDs en personnes avec relations
  return path.map(id => {
    const person = familyData.people.find(p => p.id === id)!;
    let relationship = 'unknown';
    
    if (id === person1.id) relationship = 'self';
    else if (id === person2.id) relationship = 'target';
    else {
      // Déterminer la relation basée sur la position dans le chemin
      const index = path.indexOf(id);
      const prevId = path[index - 1];
      const prevPerson = familyData.people.find(p => p.id === prevId)!;
      
      if (person.father_id === prevId) relationship = 'child';
      else if (person.mother_id === prevId) relationship = 'child';
      else if (prevPerson.father_id === id) relationship = 'parent';
      else if (prevPerson.mother_id === id) relationship = 'parent';
      else relationship = 'relative';
    }
    
    return { ...person, relationship };
  });
}
