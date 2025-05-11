'use client'

import React from 'react';
import { Search, User } from 'lucide-react';
import { Person } from '../types/interfaces';
import { formatName, formatLifespan } from '../Utils/functions';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Person[];
  handleSelectPerson: (person: Person) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  handleSelectPerson
}) => {
  return (
    <div className="relative w-1/3">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Search people..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
          <ul className="py-1">
            {searchResults.map(person => (
              <li
                key={person.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSelectPerson(person)}
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <User size={16} className="text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatName(person)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatLifespan(person)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;