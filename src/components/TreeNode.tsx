'use client'

import React from 'react';
import { Person } from '../types/interfaces';
import { formatName } from '../Utils/functions';

interface TreeNodeProps {
  person: Person;
  isRoot: boolean;
  isSelected: boolean;
  position: { x: number, y: number };
  onClick: () => void;
}

/**
 * TreeNode component for rendering a person in the family tree
 * This component is shared between the vertical and radial tree visualizations
 */
const TreeNode: React.FC<TreeNodeProps> = ({
  person,
  isRoot,
  isSelected,
  position,
  onClick
}) => {
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Background circle */}
      <circle
        r={isRoot ? 35 : 30}
        fill={isSelected ? '#4F46E5' : '#F3F4F6'}
        stroke={isRoot ? '#4F46E5' : '#D1D5DB'}
        strokeWidth={isRoot ? 3 : 1}
        className="cursor-pointer transition-all duration-300"
        onClick={onClick}
      />
      
      {/* Gender indicator */}
      <circle
        r={12}
        cy={-15}
        fill={person.sex === 'M' ? '#3B82F6' : person.sex === 'F' ? '#EC4899' : '#9CA3AF'}
      />
      
      {/* Profile image or initials */}
      {person.profile_image_url ? (
        <foreignObject
          width={40}
          height={40}
          x={-20}
          y={-20}
          className="overflow-hidden"
        >
          <div className="w-full h-full rounded-full overflow-hidden">
            <img 
              src={person.profile_image_url}
              alt={formatName(person)}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error and show initials instead
                e.currentTarget.style.display = 'none';
                // The initials will show automatically as they're already in the SVG
              }}
            />
          </div>
        </foreignObject>
      ) : (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isSelected ? 'white' : 'black'}
          fontSize="14"
          fontWeight="bold"
        >
          {person.first_name.charAt(0)}{person.last_name.charAt(0)}
        </text>
      )}
      
      {/* Name label */}
      <text
        y={45}
        textAnchor="middle"
        fill="#4B5563"
        fontSize="12"
      >
        {formatName(person)}
      </text>
    </g>
  );
};

export default TreeNode;