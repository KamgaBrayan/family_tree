'use client'

import React, { useRef, useEffect } from 'react';
import { Person, PersonWithRelationship, GenerationsMap } from '../types/interfaces';
// import { formatName } from '../Utils/functions';
import TreeNode from './TreeNode';

interface VerticalTreeViewProps {
  familyMembers: PersonWithRelationship[];
  rootPerson: Person | null;
  selectedPerson: Person | null;
  handleSelectPerson: (person: Person) => void;
  zoomLevel: number;
}

const VerticalTreeView: React.FC<VerticalTreeViewProps> = ({
  familyMembers,
  rootPerson,
  selectedPerson,
  handleSelectPerson,
  zoomLevel
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    console.log('Vertical tree component with', familyMembers.length, 'members');
  }, [familyMembers]);

  // Don't check for svgRef.current - it won't be available on first render
  if (!familyMembers.length) {
    console.log('No family members available');
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400 italic">
          No family data to display in vertical view.
        </div>
      </div>
    );
  }
  
  const width = 1000;
  const height = 600;
  const nodeSpacing = 120;
  const levelHeight = 150;
  
  // Group family members by generation
  const generationMap: GenerationsMap = {};
  
  familyMembers.forEach(member => {
    const gen = member.generation || 0;
    if (!generationMap[gen]) {
      generationMap[gen] = [];
    }
    generationMap[gen].push(member);
  });
  
  // Sort generations
  const generations = Object.keys(generationMap)
    .map(Number)
    .sort((a, b) => a - b);
  
  try {
    // Create positions object - was missing this declaration
    const positions: Record<string, { x: number, y: number }> = {};
    
    generations.forEach((gen) => {
      const members = generationMap[gen];
      const totalWidth = members.length * nodeSpacing;
      const startX = (width - totalWidth) / 2 + nodeSpacing / 2;
      
      members.forEach((member, memberIndex) => {
        positions[member.id] = {
          x: startX + memberIndex * nodeSpacing,
          y: height / 2 + (gen * levelHeight) - ((generations.length - 1) * levelHeight / 2)
        };
      });
    });
    
    // Create links between family members
    const links: { source: string, target: string }[] = [];
    
    familyMembers.forEach(member => {
      if (member.father_id && familyMembers.some(m => m.id === member.father_id)) {
        links.push({ source: member.father_id, target: member.id });
      }
      if (member.mother_id && familyMembers.some(m => m.id === member.mother_id)) {
        links.push({ source: member.mother_id, target: member.id });
      }
    });
    
    console.log(`Rendering vertical tree with ${familyMembers.length} members and ${links.length} connections`);
    
    return (
      <div className="w-full h-full overflow-auto">
        <div 
          className="min-w-max min-h-full"
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease'
          }}
        >
          <svg 
            ref={svgRef}
            width="1000" 
            height={height} 
            className="mx-auto"
          >
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
            
            {/* Nodes */}
            {familyMembers.map(person => {
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
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering vertical tree:", error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500 p-4 bg-red-50 rounded">
          <p>Error rendering tree: {(error as Error).message}</p>
        </div>
      </div>
    );
  }
};

export default VerticalTreeView;