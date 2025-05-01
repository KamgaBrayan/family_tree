'use client'

import React from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

interface TreeControlsProps {
  viewMode: 'tree' | 'radial';
  setViewMode: (mode: 'tree' | 'radial') => void;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  maxGenerations: number;
  setMaxGenerations: (generations: number) => void;
}

const TreeControls: React.FC<TreeControlsProps> = ({
  viewMode,
  setViewMode,
  showDetails,
  setShowDetails,
  zoomLevel,
  setZoomLevel,
  maxGenerations,
  setMaxGenerations
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex space-x-2">
        <button 
          className={`px-3 py-1 rounded-md text-sm ${viewMode === 'tree' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setViewMode('tree')}
        >
          Tree
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm ${viewMode === 'radial' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => setViewMode('radial')}
        >
          Radial
        </button>
      </div>
      
      {/* Details toggle */}
      <button 
        className="p-1 rounded-md hover:bg-gray-100"
        onClick={() => setShowDetails(!showDetails)}
        title={showDetails ? "Hide details" : "Show details"}
      >
        {showDetails ? (
          <EyeOff size={18} className="text-gray-600" />
        ) : (
          <Eye size={18} className="text-gray-600" />
        )}
      </button>
      
      {/* Zoom controls */}
      <div className="flex items-center space-x-2">
        <button 
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
          title="Zoom out"
        >
          <ChevronDown size={18} className="text-gray-600" />
        </button>
        <span className="text-sm text-gray-600">{Math.round(zoomLevel * 100)}%</span>
        <button 
          className="p-1 rounded-md hover:bg-gray-100"
          onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
          title="Zoom in"
        >
          <ChevronUp size={18} className="text-gray-600" />
        </button>
      </div>
      
      {/* Generation depth */}
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-2">Generations:</span>
        <select 
          className="border border-gray-300 rounded-md text-sm px-2 py-1"
          value={maxGenerations}
          onChange={(e) => setMaxGenerations(parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TreeControls;