'use client'

import React from 'react';
import { Users } from 'lucide-react';
import { Person } from '../types/interfaces';
import SearchBar from './SearchBar';
import TreeControls from './TreeControls';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Person[];
  handleSelectPerson: (person: Person) => void;
  viewMode: 'tree' | 'radial';
  setViewMode: (mode: 'tree' | 'radial') => void;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  maxGenerations: number;
  setMaxGenerations: (generations: number) => void;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  handleSelectPerson,
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
    <header className="bg-white shadow-sm p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Users size={24} className="text-indigo-600 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">Interactive Family Tree</h1>
        </div>
        
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          handleSelectPerson={handleSelectPerson}
        />
        
        <TreeControls 
          viewMode={viewMode}
          setViewMode={setViewMode}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          maxGenerations={maxGenerations}
          setMaxGenerations={setMaxGenerations}
        />
      </div>
    </header>
  );
};

export default Header;