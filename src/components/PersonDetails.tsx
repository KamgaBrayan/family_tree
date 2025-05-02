'use client'

import React from 'react';
import { User, GitBranch, Zap } from 'lucide-react';
import { Person, FamilyTreeData } from '../types/interfaces';
import { formatName, formatLifespan } from '../Utils/functions';

interface PersonDetailsProps {
  selectedPerson: Person;
  familyData: FamilyTreeData | null;
  setSelectedPerson: (person: Person | null) => void;
  setRootPerson: (person: Person) => void;
}

const PersonDetails: React.FC<PersonDetailsProps> = ({
  selectedPerson,
  familyData,
  setSelectedPerson,
  setRootPerson
}) => {
  if (!selectedPerson || !familyData) return null;

  return (
    <div className="h-full w-80 bg-white shadow-lg p-4 overflow-y-auto">
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
                const father = familyData.people.find(p => p.id === selectedPerson.father_id);
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
                const mother = familyData.people.find(p => p.id === selectedPerson.mother_id);
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
            const siblings = familyData.people.filter(p => 
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
            const children = familyData.people.filter(p => 
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
  );
};

export default PersonDetails;