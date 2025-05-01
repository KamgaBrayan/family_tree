'use client'

import React, { useState, useEffect } from 'react';
import { Person, FamilyTreeData, PersonWithRelationship } from '../types/interfaces';
import Header from '../components/Header';
import PersonDetails from '../components/PersonDetails';
import VerticalTreeView from '../components/VerticalTreeView';
import RadialTreeView from '../components/RadialTreeView';
import { bfs } from '../app/services/graph_algorithms/BFS/bfs';
import { addProfileImagesToFamilyData } from '../Utils/addProfileImages';

const InteractiveTreeVisualization: React.FC = () => {
  // State declarations
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
  const [familyMembers, setFamilyMembers] = useState<PersonWithRelationship[]>([]);
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading family data...');
        
        const response = await fetch('/family_tree.json');
        const rawData: FamilyTreeData = await response.json();
        
        // Add profile images to the data
        const enhancedData = addProfileImagesToFamilyData(rawData);
        console.log(`Loaded ${enhancedData.people.length} people from family data`);
        
        setFamilyData(enhancedData);
        
        // Find a root person (no parents)
        const root = enhancedData.people.find(p => !p.father_id && !p.mother_id);
        if (root) {
          console.log(`Found root person: ${root.first_name} ${root.last_name}`);
          setRootPerson(root);
          setSelectedPerson(root);
        } else if (enhancedData.people.length > 0) {
          // Fallback to first person if no root is found
          console.log('No root person found, using first person as root');
          setRootPerson(enhancedData.people[0]);
          setSelectedPerson(enhancedData.people[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading family data:", error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Update family members when root or generations change
  useEffect(() => {
    if (rootPerson && familyData) {
      console.log(`Calculating family members for ${rootPerson.first_name} with ${maxGenerations} generations`);
      const members = bfs(rootPerson, maxGenerations, familyData);
      console.log(`Found ${members.length} family members`);
      setFamilyMembers(members);
    }
  }, [rootPerson, maxGenerations, familyData]);
  
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
    setSearchQuery('');
    setSearchResults([]);
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
      {/* Header with search and controls */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        handleSelectPerson={handleSelectPerson}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showDetails={showDetails}
        setShowDetails={setShowDetails}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        maxGenerations={maxGenerations}
        setMaxGenerations={setMaxGenerations}
      />
      
      {/* Main visualization area */}
      <main className="flex-1 w-full h-full overflow-hidden relative">
        {/* Tree visualization based on view mode */}
        {viewMode === 'tree' ? (
          <VerticalTreeView
            familyMembers={familyMembers}
            rootPerson={rootPerson}
            selectedPerson={selectedPerson}
            handleSelectPerson={handleSelectPerson}
            zoomLevel={zoomLevel}
          />
        ) : (
          <RadialTreeView
            familyMembers={familyMembers}
            rootPerson={rootPerson}
            selectedPerson={selectedPerson}
            handleSelectPerson={handleSelectPerson}
          />
        )}
        
        {/* Selected person details panel */}
        {selectedPerson && familyData && (
          <PersonDetails
            selectedPerson={selectedPerson}
            familyData={familyData}
            setSelectedPerson={setSelectedPerson}
            setRootPerson={setRootPerson}
          />
        )}
      </main>
      
      {/* SVG Definitions for animations and patterns */}
      <svg width="0" height="0" className="hidden">
        <defs>
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