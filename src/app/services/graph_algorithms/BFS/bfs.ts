import { Person, FamilyTreeData, PersonWithRelationship } from '../../../../types/interfaces';

/**
 * Breadth-First Search algorithm for family tree traversal
 * 
 * @param rootPerson The starting person for traversal
 * @param maxGenerations Maximum number of generations to traverse
 * @param familyData The complete family tree data
 * @returns Array of persons with their relationships
 */
export const bfs = (
  rootPerson: Person, 
  maxGenerations: number = 3,
  familyData: FamilyTreeData
): PersonWithRelationship[] => {
  if (!rootPerson || !familyData || maxGenerations <= 0) return [];
  
  // Collect family members up to specified number of generations
  const result: PersonWithRelationship[] = [{ ...rootPerson, generation: 0, relationship: 'self' }];
  
  // BFS queue and visited set to prevent cycles
  const queue: Array<{ person: Person, generation: number, direction: 'up' | 'down' | 'both' }> = [
    { person: rootPerson, generation: 0, direction: 'both' }
  ];
  const visited = new Set<string>([rootPerson.id]);
  
  while (queue.length > 0) {
    const { person, generation, direction } = queue.shift()!;
    
    // Process current person based on direction
    if (direction === 'down' || direction === 'both') {
      // Find children
      const children = familyData.people.filter(p => 
        p.father_id === person.id || p.mother_id === person.id
      );
      
      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          const nextGen = generation + 1;
          
          // Only add if within generation limit
          if (Math.abs(nextGen) <= maxGenerations) {
            result.push({ 
              ...child, 
              generation: nextGen,
              relationship: 'child',
              parentId: person.id
            });
            
            // Add to queue for further processing
            queue.push({ 
              person: child, 
              generation: nextGen, 
              direction: 'down' 
            });
          }
        }
      }
    }
    
    if (direction === 'up' || direction === 'both') {
      // Find parents
      const parents: Array<{ person: Person, relationship: 'father' | 'mother' }> = [];
      
      if (person.father_id) {
        const father = familyData.people.find(p => p.id === person.father_id);
        if (father) parents.push({ person: father, relationship: 'father' });
      }
      
      if (person.mother_id) {
        const mother = familyData.people.find(p => p.id === person.mother_id);
        if (mother) parents.push({ person: mother, relationship: 'mother' });
      }
      
      for (const { person: parent, relationship } of parents) {
        if (!visited.has(parent.id)) {
          visited.add(parent.id);
          const nextGen = generation - 1;
          
          // Only add if within generation limit
          if (Math.abs(nextGen) <= maxGenerations) {
            result.push({ 
              ...parent, 
              generation: nextGen,
              relationship,
              childId: person.id
            });
            
            // Add to queue for further processing
            queue.push({ 
              person: parent, 
              generation: nextGen, 
              direction: 'up' 
            });
          }
        }
      }
    }
  }
  
  return result;
};

/**
 * Find siblings of a person
 */
export const findSiblings = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  return familyData.people.filter(p => 
    p.id !== person.id && (
      (person.father_id && p.father_id === person.father_id) ||
      (person.mother_id && p.mother_id === person.mother_id)
    )
  );
};

/**
 * Find children of a person
 */
export const findChildren = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  return familyData.people.filter(p => 
    p.father_id === person.id || p.mother_id === person.id
  );
};

/**
 * Find grandchildren of a person
 */
export const findGrandchildren = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  const children = findChildren(person, familyData);
  const grandchildren: Person[] = [];
  
  children.forEach(child => {
    grandchildren.push(...findChildren(child, familyData));
  });
  
  return grandchildren;
};

/**
 * Find parents of a person
 */
export const findParents = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  const parents: Person[] = [];
  
  if (person.father_id) {
    const father = familyData.people.find(p => p.id === person.father_id);
    if (father) parents.push(father);
  }
  
  if (person.mother_id) {
    const mother = familyData.people.find(p => p.id === person.mother_id);
    if (mother) parents.push(mother);
  }
  
  return parents;
};

/**
 * Find grandparents of a person
 */
export const findGrandparents = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  const parents = findParents(person, familyData);
  const grandparents: Person[] = [];
  
  parents.forEach(parent => {
    grandparents.push(...findParents(parent, familyData));
  });
  
  return grandparents;
};

/**
 * Find cousins of a person
 */
export const findCousins = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  const parents = findParents(person, familyData);
  const cousins: Person[] = [];
  
  parents.forEach(parent => {
    const parentSiblings = findSiblings(parent, familyData);
    parentSiblings.forEach(sibling => {
      cousins.push(...findChildren(sibling, familyData));
    });
  });
  
  return cousins;
};

/**
 * Find aunts and uncles of a person
 */
export const findAuntsAndUncles = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  const parents = findParents(person, familyData);
  const auntsAndUncles: Person[] = [];
  
  parents.forEach(parent => {
    auntsAndUncles.push(...findSiblings(parent, familyData));
  });
  
  return auntsAndUncles;
};

/**
 * Find nephews and nieces of a person
 */
export const findNephewsAndNieces = (person: Person, familyData: FamilyTreeData): Person[] => {
  if (!person || !familyData) return [];
  
  const siblings = findSiblings(person, familyData);
  const nephewsAndNieces: Person[] = [];
  
  siblings.forEach(sibling => {
    nephewsAndNieces.push(...findChildren(sibling, familyData));
  });
  
  return nephewsAndNieces;
};