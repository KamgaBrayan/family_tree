/**
 * Utility function to add profile images to family data
 * 
 * This can be used to add profile images to your family tree data
 * before displaying it in the application.
 */

import { FamilyTreeData, Person } from '../types/interfaces';

/**
 * Add placeholder profile images to people in the family tree
 * 
 * In a real application, you would replace this with actual image URLs.
 * This function demonstrates how to add profile images to the data structure.
 */
export const addProfileImagesToFamilyData = (familyData: FamilyTreeData): FamilyTreeData => {
  // Create a copy of the data to avoid mutating the original
  const updatedData: FamilyTreeData = {
    people: familyData.people.map(person => ({
      ...person,
      // You could use a different strategy to assign images, such as:
      // 1. Based on person ID (deterministic)
      // 2. From an images map/object
      // 3. From an API or database
      
      // This example uses placeholder images based on gender and a random seed
      profile_image_url: getProfileImageForPerson(person)
    }))
  };
  
  return updatedData;
};

/**
 * Get a profile image URL for a person
 * 
 * This function generates placeholder URLs. In a real application,
 * you would replace this with actual image URLs.
 */
const getProfileImageForPerson = (person: Person): string | undefined => {
  // In a real application, you might:
  // 1. Return actual image URLs stored in your database
  // 2. Use a naming convention for image files (e.g., person_id.jpg)
  // 3. Use a service like Gravatar with email addresses
  
  // This is just a demonstration using placeholder images
  
  // Seed based on person ID to get consistent images
  const seed = person.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // 30% chance of having no image
  if (seed % 10 < 3) {
    return undefined;
  }
  
  // Use different placeholder services based on gender
  const width = 200;
  const height = 200;
  
  if (person.sex === 'M') {
    return `https://randomuser.me/api/portraits/men/${seed % 100}.jpg`;
  } else if (person.sex === 'F') {
    return `https://randomuser.me/api/portraits/women/${seed % 100}.jpg`;
  } else {
    // For other genders, use a generic placeholder
    return `https://via.placeholder.com/${width}x${height}`;
  }
};

/**
 * Usage example:
 * 
 * When loading your family data, you can process it to add profile images:
 * 
 * const loadData = async () => {
 *   try {
 *     const response = await fetch('/family_tree.json');
 *     const rawData = await response.json();
 *     
 *     // Add profile images to the data
 *     const enhancedData = addProfileImagesToFamilyData(rawData);
 *     
 *     setFamilyData(enhancedData);
 *     // ... rest of your loading logic
 *   } catch (error) {
 *     console.error("Error loading family data:", error);
 *   }
 * };
 */