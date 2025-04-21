import { Person, Relation, PartitionResult } from './types';

export class UnionFind {
    private parent: Record<string, string>; // Dictionnaire qui stocke la racine de chaque élément.
    private rank: Record<string, number>; //rank : Dictionnaire qui stocke la profondeur de l'arbre pour optimiser les fusions.
  
    constructor(elements: string[]) {
      this.parent = {};
      this.rank = {};
  
      elements.forEach(elem => {
        this.parent[elem] = elem;
        this.rank[elem] = 0;
      });
    }
    //Trouver la racine
    find(x: string): string {
      if (this.parent[x] !== x) {
        this.parent[x] = this.find(this.parent[x]);
      }
      return this.parent[x];
    }
  // Méthode union : Fusionner deux ensembles
    union(x: string, y: string): void {
      const xRoot = this.find(x);
      const yRoot = this.find(y);
  
      if (xRoot === yRoot) return;
  
      if (this.rank[xRoot] < this.rank[yRoot]) {
        this.parent[xRoot] = yRoot;
      } else if (this.rank[xRoot] > this.rank[yRoot]) {
        this.parent[yRoot] = xRoot;
      } else {
        this.parent[yRoot] = xRoot;
        this.rank[xRoot]++;
      }
    }
  }


  export function kruskalFamilyPartition(persons: Person[]): PartitionResult {
    // Étape 1: Générer les relations à partir des parents
    const relations: Relation[] = [];
    for (const person of persons) {
      if (person.father_id) {
        relations.push({ 
          fromId: person.father_id, 
          toId: person.id, 
          weight: 1 
        });
      }
      if (person.mother_id) {
        relations.push({ 
          fromId: person.mother_id, 
          toId: person.id, 
          weight: 1 
        });
      }
    }
  
    // Étape 2: Kruskal classique
    relations.sort((a, b) => a.weight - b.weight);
    const uf = new UnionFind(persons.map(p => p.id));
    const retainedRelations: Relation[] = [];
  
    for (const rel of relations) {
      const root1 = uf.find(rel.fromId);
      const root2 = uf.find(rel.toId);
      if (root1 !== root2) {
        uf.union(root1, root2);
        retainedRelations.push(rel);
      }
    }
  
    // Étape 3: Extraire les sous-familles
    const branches = new Map<string, string[]>();
    for (const person of persons) {
      const root = uf.find(person.id);
      if (!branches.has(root)) {
        branches.set(root, []);
      }
      branches.get(root)!.push(person.id);
    }
  
    return {
      branches: Array.from(branches.values()),
      retainedRelations,
      stats: {
        totalBranches: branches.size,
        largestBranchSize: Math.max(...Array.from(branches.values()).map(b => b.length))
      }
    };
  }
  
  // Utils pour trouver la famille proche
  export function findClosestFamily(
    targetId: string, 
    branches: string[][], 
    relations: Relation[]
  ): string[] {
    // Trouver la branche de la personne cible
    const targetBranch = branches.find(b => b.includes(targetId)) || [];
    
    // Filtrer les relations qui concernent cette branche
    const branchRelations = relations.filter(rel => 
      targetBranch.includes(rel.fromId) && targetBranch.includes(rel.toId)
    );
  
    // Retourner la famille immédiate (parents + enfants)
    const immediateFamily = new Set<string>();
    for (const rel of branchRelations) {
      if (rel.fromId === targetId) immediateFamily.add(rel.toId);
      if (rel.toId === targetId) immediateFamily.add(rel.fromId);
    }
  
    return Array.from(immediateFamily);
  }