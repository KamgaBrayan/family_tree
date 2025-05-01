'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Users, User, ChevronDown, ChevronUp, Search, GitBranch, Zap, Eye, EyeOff } from 'lucide-react';
import { Person, FamilyTreeData, PersonWithRelationship, GenerationsMap } from '../types/types'; 

const InteractiveTreeVisualization = () => {
  const [familyData, setFamilyData] = useState<FamilyTreeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rootPerson, setRootPerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'radial'>('tree');
  const [maxGenerations, setMaxGenerations] = useState<number>(3);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Use fetch instead of window.fs.readFile
        const response = await fetch('../Utils/family_tree.json');
        const data: FamilyTreeData = await response.json();
        setFamilyData(data);
        
        // Find a root person (no parents)
        const root = data.people.find(p => !p.father_id && !p.mother_id);
        if (root) {
          setRootPerson(root);
          setSelectedPerson(root);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading family data:", error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Search functionality
  useEffect(() => {
    if (!familyData || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = familyData.people.filter(person => 
      person.first_name.toLowerCase().includes(query) || 
      person.last_name.toLowerCase().includes(query)
    ).slice(0, 5);
    
    setSearchResults(results);
  }, [searchQuery, familyData]);
  
  const handleSelectPerson = (person: Person): void => {
    setSelectedPerson(person);
    setRootPerson(person);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  const formatName = (person: Person): string => {
    return `${person.first_name} ${person.last_name}`;
  };
  
  const formatLifespan = (person: Person): string => {
    const birthYear = person.date_of_birth ? person.date_of_birth.split('-')[0] : '?';
    const deathYear = person.is_deceased && person.date_of_death 
      ? person.date_of_death.split('-')[0] 
      : person.is_deceased ? '?' : '';
    
    return deathYear ? `${birthYear}–${deathYear}` : birthYear;
  };
  
  const findFamilyMembers = (person: Person | null, generations = maxGenerations): PersonWithRelationship[] => {
    if (!person || !familyData || generations <= 0) return [];
    
    // Collect family members up to specified number of generations
    const result: PersonWithRelationship[] = [{ ...person, generation: 0, relationship: 'self' }];
    
    // Process current generation
    const processGeneration = (currentPeople: PersonWithRelationship[], currentGen: number, direction: 'up' | 'down' | 'both'): void => {
      if (currentGen > generations) return;
      
      for (const current of currentPeople) {
        if (direction === 'down' || direction === 'both') {
          // Find children
          const children = familyData.people.filter(p => 
            p.father_id === current.id || p.mother_id === current.id
          );
          
          children.forEach(child => {
            if (!result.some(p => p.id === child.id)) {
              result.push({ 
                ...child, 
                generation: direction === 'down' ? (current.generation ?? 0) + 1 : (current.generation ?? 0) - 1,
                relationship: 'child',
                parentId: current.id
              });
            }
          });
          
          if (children.length > 0) {
            processGeneration(
              children.map(child => ({ 
                ...child, 
                generation: direction === 'down' ? (current.generation ?? 0) + 1 : (current.generation ?? 0) - 1
              })), 
              currentGen + 1, 
              direction
            );
          }
        }
        
        if (direction === 'up' || direction === 'both') {
          // Find parents
          const parents: PersonWithRelationship[] = [];
          
          if (current.father_id) {
            const father = familyData.people.find(p => p.id === current.father_id);
            if (father) parents.push({ ...father, relationship: 'father' });
          }
          
          if (current.mother_id) {
            const mother = familyData.people.find(p => p.id === current.mother_id);
            if (mother) parents.push({ ...mother, relationship: 'mother' });
          }
          
          parents.forEach(parent => {
            if (!result.some(p => p.id === parent.id)) {
              result.push({ 
                ...parent, 
                generation: direction === 'up' ? (current.generation ?? 0) + 1 : (current.generation ?? 0) - 1,
                relationship: parent.relationship,
                childId: current.id
              });
            }
          });
          
          if (parents.length > 0) {
            processGeneration(
              parents.map(parent => ({ 
                ...parent, 
                generation: direction === 'up' ? (current.generation ?? 0) + 1 : (current.generation ?? 0) - 1
              })), 
              currentGen + 1, 
              direction
            );
          }
        }
      }
    };
    
    // Process in both directions
    processGeneration([{ ...person, generation: 0 }], 1, 'both');
    
    return result;
  };

  // Render tree visualization based on view mode
  const renderTreeVisualization = () => {
    if (!rootPerson) return null;
    
    const familyMembers = findFamilyMembers(rootPerson);
    
    if (viewMode === 'tree') {
      return renderVerticalTree(familyMembers);
    } else {
      return renderRadialTree(familyMembers);
    }
  };
  
  // Render vertical tree layout
  const renderVerticalTree = (familyMembers: PersonWithRelationship[]) => {
    // Group family members by generation
    const generations: GenerationsMap = {};
    
    familyMembers.forEach(person => {
      const gen = person.generation?.toString() ?? '0';
      if (!generations[gen]) {
        generations[gen] = [];
      }
      generations[gen].push(person);
    });
    
    // Calculate tree dimensions
    const generationKeys = Object.keys(generations);
    if (generationKeys.length === 0) return null;
    
    const maxGeneration = Math.max(...generationKeys.map(g => parseInt(g)));
    const minGeneration = Math.min(...generationKeys.map(g => parseInt(g)));
    const totalGenerations = maxGeneration - minGeneration + 1;
    
    // Render tree
    return (
      <div className="w-full overflow-auto">
        <div 
          className="min-w-max"
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease'
          }}
        >
          <svg 
            ref={svgRef}
            width="1000" 
            height={totalGenerations * 200 + 50} 
            className="mx-auto"
          >
            {/* Connection lines */}
            {familyMembers.map(person => {
              // Draw connections between parents and children
              if (person.parentId) {
                const parent = familyMembers.find(p => p.id === person.parentId);
                if (!parent) return null;
                
                const parentGen = parent.generation?.toString() ?? '0';
                const personGen = person.generation?.toString() ?? '0';
                
                const parentIndex = generations[parentGen].indexOf(parent);
                const personIndex = generations[personGen].indexOf(person);
                
                const parentX = 500 + (parentIndex - generations[parentGen].length / 2) * 150;
                const parentY = ((parent.generation ?? 0) - minGeneration) * 200 + 75;
                
                const personX = 500 + (personIndex - generations[personGen].length / 2) * 150;
                const personY = ((person.generation ?? 0) - minGeneration) * 200 + 75;
                
                return (
                  <line 
                    key={`${person.id}-${parent.id}`}
                    x1={parentX}
                    y1={parentY + 40}
                    x2={personX}
                    y2={personY - 40}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeDasharray={person.relationship === 'spouse' ? "5,5" : "none"}
                  />
                );
              }
              
              return null;
            })}
            
            {/* Person nodes */}
            {Object.entries(generations).map(([gen, people]) => {
              const y = (parseInt(gen) - minGeneration) * 200 + 75;
              
              return people.map((person, index) => {
                const x = 500 + (index - people.length / 2) * 150;
                
                const fillColor = person.sex === 'M' ? '#DBEAFE' : // Light blue
                                 person.sex === 'F' ? '#FCE7F3' : // Light pink
                                 '#E5E7EB'; // Light gray
                                 
                const textColor = person.sex === 'M' ? '#1E40AF' : // Dark blue
                                 person.sex === 'F' ? '#9D174D' : // Dark pink
                                 '#4B5563'; // Gray
                                 
                const strokeColor = person.id === selectedPerson?.id ? '#6366F1' : '#9CA3AF';
                const strokeWidth = person.id === selectedPerson?.id ? 3 : 1;
                
                return (
                  <g key={person.id} onClick={() => setSelectedPerson(person)}>
                    {/* Person card background */}
                    <rect 
                      x={x - 60}
                      y={y - 40}
                      width={120}
                      height={80}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      rx={8}
                      ry={8}
                      className="cursor-pointer"
                    />
                    
                    {/* Name text */}
                    <text 
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fill={textColor}
                      fontWeight="bold"
                      fontSize="14"
                      className="select-none pointer-events-none"
                    >
                      {person.first_name}
                    </text>
                    
                    <text 
                      x={x}
                      y={y + 10}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="14"
                      className="select-none pointer-events-none"
                    >
                      {person.last_name}
                    </text>
                    
                    {/* Dates */}
                    {showDetails && (
                      <text 
                        x={x}
                        y={y + 30}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="12"
                        className="select-none pointer-events-none"
                      >
                        {formatLifespan(person)}
                      </text>
                    )}
                    
                    {/* Root indicator */}
                    {rootPerson && person.id === rootPerson.id && (
                      <circle
                        cx={x + 50}
                        cy={y - 30}
                        r={10}
                        fill="#4F46E5"
                        className="pulse-animation"
                      />
                    )}
                    
                    {/* Set as root button */}
                    {rootPerson && person.id !== rootPerson.id && (
                      <g 
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRootPerson(person);
                        }}
                      >
                        <circle
                          cx={x + 50}
                          cy={y - 30}
                          r={10}
                          fill="#9CA3AF"
                        />
                        <text
                          x={x + 50}
                          y={y - 26}
                          textAnchor="middle"
                          fill="white"
                          fontSize="12"
                          fontWeight="bold"
                          className="select-none pointer-events-none"
                        >
                          R
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}
          </svg>
        </div>
      </div>
    );
  };
  
  // Render radial tree layout
  const renderRadialTree = ({/*familyMembers: PersonWithRelationship[]*/}) => {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <GitBranch size={48} className="mx-auto mb-2 text-gray-400" />
          <p>Radial layout view is in development</p>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading family tree data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Users size={24} className="text-indigo-600 mr-2" />
            <h1 className="text-xl font-semibold text-gray-800">Interactive Family Tree</h1>
          </div>
          
          {/* Search box */}
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
          
          {/* Controls */}
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
        </div>
      </header>
      
      {/* Main visualization area */}
      <main className="flex-1 overflow-hidden relative">
        {renderTreeVisualization()}
        
        {/* Selected person details panel */}
        {selectedPerson && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg p-4 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Person Details</h2>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setSelectedPerson(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4 flex items-center">
              <div className={`w-12 h-12 rounded-full mr-3 flex items-center justify-center
                ${selectedPerson.sex === 'M' ? 'bg-blue-100' : 
                  selectedPerson.sex === 'F' ? 'bg-pink-100' : 'bg-gray-100'}`}>
                <User size={24} className={
                  selectedPerson.sex === 'M' ? 'text-blue-600' : 
                  selectedPerson.sex === 'F' ? 'text-pink-600' : 'text-gray-600'
                } />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{formatName(selectedPerson)}</h3>
                <p className="text-sm text-gray-500">{formatLifespan(selectedPerson)}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Personal Information</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Birth</dt>
                  <dd className="text-sm text-gray-900">{selectedPerson.date_of_birth || 'Unknown'}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Birthplace</dt>
                  <dd className="text-sm text-gray-900">{selectedPerson.place_of_birth || 'Unknown'}</dd>
                </div>
                
                {selectedPerson.is_deceased && (
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Death</dt>
                    <dd className="text-sm text-gray-900">{selectedPerson.date_of_death || 'Unknown'}</dd>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="text-sm text-gray-900">
                    {selectedPerson.sex === 'M' ? 'Male' : 
                     selectedPerson.sex === 'F' ? 'Female' : 
                     selectedPerson.sex || 'Unknown'}
                  </dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                  <dd className="text-sm text-gray-900">{selectedPerson.nationality || 'Unknown'}</dd>
                </div>
                
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                  <dd className="text-sm text-gray-900">{selectedPerson.occupation || 'Unknown'}</dd>
                </div>
              </dl>
            </div>
            
            {/* Family relationships */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Family</h4>
              
              {/* Parents */}
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-1">Parents</h5>
                {selectedPerson.father_id || selectedPerson.mother_id ? (
                  <ul className="space-y-1">
                    {selectedPerson.father_id && (() => {
                      const father = familyData?.people.find(p => p.id === selectedPerson.father_id);
                      return father ? (
                        <li 
                          key={father.id}
                          className="text-sm bg-gray-50 p-2 rounded flex items-center cursor-pointer hover:bg-gray-100"
                          onClick={() => setSelectedPerson(father)}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                          <span className="text-gray-900">{formatName(father)}</span>
                          <span className="text-gray-400 ml-auto">{formatLifespan(father)}</span>
                        </li>
                      ) : <li className="text-sm text-gray-500">Father unknown</li>;
                    })()}
                    
                    {selectedPerson.mother_id && (() => {
                      const mother = familyData?.people.find(p => p.id === selectedPerson.mother_id);
                      return mother ? (
                        <li 
                          key={mother.id}
                          className="text-sm bg-gray-50 p-2 rounded flex items-center cursor-pointer hover:bg-gray-100"
                          onClick={() => setSelectedPerson(mother)}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mr-2"></span>
                          <span className="text-gray-900">{formatName(mother)}</span>
                          <span className="text-gray-400 ml-auto">{formatLifespan(mother)}</span>
                        </li>
                      ) : <li className="text-sm text-gray-500">Mother unknown</li>;
                    })()}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No parents recorded</p>
                )}
              </div>
              
              {/* Siblings */}
              <div className="mb-3">
                <h5 className="text-xs font-semibold text-gray-600 mb-1">Siblings</h5>
                {(() => {
                  const siblings = familyData?.people.filter(p => 
                    p.id !== selectedPerson.id && (
                      (selectedPerson.father_id && p.father_id === selectedPerson.father_id) ||
                      (selectedPerson.mother_id && p.mother_id === selectedPerson.mother_id)
                    )
                  ) || [];
                  
                  return siblings.length > 0 ? (
                    <ul className="space-y-1">
                      {siblings.map(sibling => (
                        <li 
                          key={sibling.id}
                          className="text-sm bg-gray-50 p-2 rounded flex items-center cursor-pointer hover:bg-gray-100"
                          onClick={() => setSelectedPerson(sibling)}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sibling.sex === 'M' ? 'bg-blue-500' : sibling.sex === 'F' ? 'bg-pink-500' : 'bg-gray-500'} mr-2`}></span>
                          <span className="text-gray-900">{formatName(sibling)}</span>
                          <span className="text-gray-400 ml-auto">{formatLifespan(sibling)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No siblings recorded</p>
                  );
                })()}
              </div>
              
              {/* Children */}
              <div>
                <h5 className="text-xs font-semibold text-gray-600 mb-1">Children</h5>
                {(() => {
                  const children = familyData?.people.filter(p => 
                    p.father_id === selectedPerson.id || p.mother_id === selectedPerson.id
                  ) || [];
                  
                  return children.length > 0 ? (
                    <ul className="space-y-1">
                      {children.map(child => (
                        <li 
                          key={child.id}
                          className="text-sm bg-gray-50 p-2 rounded flex items-center cursor-pointer hover:bg-gray-100"
                          onClick={() => setSelectedPerson(child)}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${child.sex === 'M' ? 'bg-blue-500' : child.sex === 'F' ? 'bg-pink-500' : 'bg-gray-500'} mr-2`}></span>
                          <span className="text-gray-900">{formatName(child)}</span>
                          <span className="text-gray-400 ml-auto">{formatLifespan(child)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No children recorded</p>
                  );
                })()}
              </div>
            </div>
            
            {/* Actions */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex space-x-2">
                <button 
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center justify-center"
                  onClick={() => setRootPerson(selectedPerson)}
                >
                  <GitBranch size={16} className="mr-1" /> Set as Root
                </button>
                
                <button className="flex-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center justify-center">
                  <Zap size={16} className="mr-1" /> Find Relationship
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* SVG Definitions for patterns and markers */}
      <svg width="0" height="0" className="hidden">
        <defs>
          {/* Animation for root indicator */}
          <style>
            {`
              @keyframes pulse {
                0% {
                  opacity: 0.6;
                  transform: scale(0.8);
                }
                50% {
                  opacity: 1;
                  transform: scale(1.1);
                }
                100% {
                  opacity: 0.6;
                  transform: scale(0.8);
                }
              }
              
              .pulse-animation {
                animation: pulse 2s infinite;
              }
            `}
          </style>
        </defs>
      </svg>
    </div>
  );
};

// Main component wrapper for the interactive family tree
export default function InteractiveFamilyTreeVisualization() {
  return (
    <div className="min-h-screen bg-gray-50">
      <InteractiveTreeVisualization />
    </div>
  );
}