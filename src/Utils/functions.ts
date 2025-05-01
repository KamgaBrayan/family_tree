import { Person } from '../types/interfaces'

export const formatName = (person: Person): string => {
    return `${person.first_name} ${person.last_name}`;
  };
  
  export const formatLifespan = (person: Person): string => {
    const birthYear = person.date_of_birth ? person.date_of_birth.split('-')[0] : '?';
    const deathYear = person.is_deceased && person.date_of_death 
      ? person.date_of_death.split('-')[0] 
      : person.is_deceased ? '?' : '';
    
    return deathYear ? `${birthYear}–${deathYear}` : birthYear;
  };

