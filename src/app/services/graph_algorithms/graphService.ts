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

  // Map pour stocker la génération de chaque personne
  const generationMap = new Map<string, number>();
  // Map pour stocker la relation de chaque personne
  const relationshipMap = new Map<string, string>();
  // Ensemble pour suivre les personnes visitées
  const visited = new Set<string>();
  // File pour le BFS
  const queue: { person: Person; generation: number }[] = [];
  // Résultat final
  const result: PersonWithRelationship[] = [];

  // Ajouter la personne racine
  queue.push({ person: rootPerson, generation: 0 });
  generationMap.set(rootPerson.id, 0);
  relationshipMap.set(rootPerson.id, 'self');
  visited.add(rootPerson.id);

  // Parcours BFS
  while (queue.length > 0) {
    const { person, generation } = queue.shift()!;

    // Si on a atteint le nombre maximum de générations, on s'arrête pour cette branche
    if (Math.abs(generation) > maxGenerations) continue;

    // Ajouter la personne au résultat
    const personWithRelation: PersonWithRelationship = {
      ...person,
      generation,
      relationship: relationshipMap.get(person.id) || 'unknown'
    };
    result.push(personWithRelation);

    // Explorer les parents
    if (person.father_id) {
      const father = familyData.people.find(p => p.id === person.father_id);
      if (father && !visited.has(father.id)) {
        queue.push({ person: father, generation: generation - 1 });
        generationMap.set(father.id, generation - 1);
        relationshipMap.set(father.id, generation === 0 ? 'father' : 'ancestor');
        visited.add(father.id);
      }
    }

    if (person.mother_id) {
      const mother = familyData.people.find(p => p.id === person.mother_id);
      if (mother && !visited.has(mother.id)) {
        queue.push({ person: mother, generation: generation - 1 });
        generationMap.set(mother.id, generation - 1);
        relationshipMap.set(mother.id, generation === 0 ? 'mother' : 'ancestor');
        visited.add(mother.id);
      }
    }

    // Explorer les enfants
    const children = familyData.people.filter(
      p => p.father_id === person.id || p.mother_id === person.id
    );
    
    for (const child of children) {
      if (!visited.has(child.id)) {
        queue.push({ person: child, generation: generation + 1 });
        generationMap.set(child.id, generation + 1);
        relationshipMap.set(child.id, generation === 0 ? 'child' : 'descendant');
        visited.add(child.id);
      }
    }

    // Explorer les frères et sœurs (uniquement pour la personne racine ou ses descendants directs)
    if (generation >= 0 && (person.father_id || person.mother_id)) {
      const siblings = familyData.people.filter(
        p => p.id !== person.id && 
          ((person.father_id && p.father_id === person.father_id) || 
           (person.mother_id && p.mother_id === person.mother_id))
      );
      
      for (const sibling of siblings) {
        if (!visited.has(sibling.id)) {
          queue.push({ person: sibling, generation });
          generationMap.set(sibling.id, generation);
          relationshipMap.set(sibling.id, 'sibling');
          visited.add(sibling.id);
        }
      }
    }
  }

  return result;
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
