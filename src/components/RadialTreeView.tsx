'use client'

import React, { useEffect } from 'react';
import { Person, PersonWithRelationship, GenerationsMap } from '../types/interfaces';
import TreeNode from './TreeNode';

interface RadialTreeViewProps {
  familyMembers: PersonWithRelationship[];
  rootPerson: Person | null;
  selectedPerson: Person | null;
  handleSelectPerson: (person: Person) => void;
}

const RadialTreeView: React.FC<RadialTreeViewProps> = ({
  familyMembers,
  rootPerson,
  selectedPerson,
  handleSelectPerson
}) => {
  useEffect(() => {
    console.log('Radial tree component with', familyMembers.length, 'members');
  }, [familyMembers]);
  
  if (!familyMembers.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400 italic">
          No family data to display in radial view.
        </div>
      </div>
    );
  }
  
  // Simple radial tree implementation
  const width = 800;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Filtrer pour n'afficher que les relations pertinentes si une personne est sélectionnée
  const relevantMembers = selectedPerson 
    ? familyMembers.filter(member => 
        // Inclure la personne sélectionnée et ses relations directes
        member.id === selectedPerson.id || 
        member.father_id === selectedPerson.id || 
        member.mother_id === selectedPerson.id ||
        (selectedPerson.father_id && member.id === selectedPerson.father_id) ||
        (selectedPerson.mother_id && member.id === selectedPerson.mother_id)
      )
    : familyMembers;
  
  console.log(`Displaying ${relevantMembers.length} members in radial view`);
  
  // Group by generation for radial layout
  const generationMap: GenerationsMap = {};
  relevantMembers.forEach(member => {
    const gen = member.generation || 0;
    if (!generationMap[gen]) {
      generationMap[gen] = [];
    }
    generationMap[gen].push(member);
  });
  
  const generations = Object.keys(generationMap)
    .map(Number)
    .sort((a, b) => a - b);
  
  // Calculate positions in a radial layout
  const positions: Record<string, { x: number, y: number }> = {};
  const maxRadius = Math.min(width, height) / 2 - 80;
  
  generations.forEach((gen, genIndex) => {
    const members = generationMap[gen];
    const radius = (genIndex + 1) * (maxRadius / (generations.length || 1));
    
    members.forEach((member, memberIndex) => {
      const angle = (memberIndex * 2 * Math.PI) / members.length;
      positions[member.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  });
  
  // Create links - n'utiliser que les membres pertinents
  const links: { source: string, target: string }[] = [];
  relevantMembers.forEach(member => {
    // Vérifier que le père existe dans les membres pertinents
    if (member.father_id && relevantMembers.some(m => m.id === member.father_id)) {
      links.push({ source: member.father_id, target: member.id });
    }
    // Vérifier que la mère existe dans les membres pertinents
    if (member.mother_id && relevantMembers.some(m => m.id === member.mother_id)) {
      links.push({ source: member.mother_id, target: member.id });
    }
  });
  
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Links */}
      {links.map((link, index) => {
        if (!positions[link.source] || !positions[link.target]) return null;
        
        const sourcePos = positions[link.source];
        const targetPos = positions[link.target];
        
        return (
          <line
            key={`link-${index}`}
            x1={sourcePos.x}
            y1={sourcePos.y}
            x2={targetPos.x}
            y2={targetPos.y}
            stroke="#9CA3AF"
            strokeWidth="1"
          />
        );
      })}
      
      {/* Nodes - n'afficher que les membres pertinents */}
      {relevantMembers.map(person => {
        if (!positions[person.id]) return null;
        
        const pos = positions[person.id];
        const isRoot = person.id === rootPerson?.id;
        const isSelected = person.id === selectedPerson?.id;
        
        return (
          <TreeNode
            key={person.id}
            person={person}
            isRoot={isRoot}
            isSelected={isSelected}
            position={pos}
            onClick={() => handleSelectPerson(person)}
          />
        );
      })}
    </svg>
  );
};

export default RadialTreeView;