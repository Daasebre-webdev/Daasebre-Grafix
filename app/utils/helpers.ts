// app/utils/helpers.ts
import projects from '../data/projects.json';

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  field?: string;
  technologies?: string;
  isUserGenerated?: boolean;
  timestamp?: string;
  bookmarkedBy?: string[];
  viewCount?: number;
  isTrending?: boolean;
  tags?: string[];
  status?: 'new' | 'trending' | 'popular' | 'standard';
  details?: {
    fullDescription?: string;
    difficulty?: string;
    duration?: string;
    learningObjectives?: string[];
    steps?: Array<{
      title: string;
      items: string[];
    }>;
    resources?: {
      tools?: Array<{ name: string; link: string }>;
      guides?: Array<{ title: string; link: string }>;
    };
  };
}

// Get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function getAllProjects(): Project[] {
  try {
    const staticProjects = Object.values(projects.projects).flat() as Project[];

    if (typeof window !== 'undefined') {
      // Check all possible locations for user-generated projects
      const userProjects = JSON.parse(
        localStorage.getItem('userProjects') || '[]'
      ) as Project[];
      
      const allProjects = JSON.parse(
        localStorage.getItem('allProjects') || '[]'
      ) as Project[];
      
      // Also check the old location for backward compatibility
      const generatedProjects = JSON.parse(
        localStorage.getItem('generatedProjects') || '[]'
      ) as Project[];
      
      // Combine all sources, removing duplicates by ID
      const allUserProjects = [...userProjects, ...allProjects, ...generatedProjects];
      const uniqueUserProjects = allUserProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      );
      
      return [...staticProjects, ...uniqueUserProjects];
    }

    return staticProjects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
}

// Get a specific project by ID
export function getProjectById(id: string): Project | undefined {
  const allProjects = getAllProjects();
  return allProjects.find(project => project.id === id);
}

// Save projects to localStorage
export const saveProjects = (projects: Project[], key: string = 'allProjects') => {
  if (typeof window !== 'undefined') {
    try {
      const existingProjects = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedProjects = [...existingProjects, ...projects];
      localStorage.setItem(key, JSON.stringify(updatedProjects));
      
      // Also update the other storage locations for consistency
      if (key === 'allProjects') {
        localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
      } else if (key === 'userProjects') {
        localStorage.setItem('allProjects', JSON.stringify(updatedProjects));
      }
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }
};

// Get projects from localStorage
export const getProjects = (key: string = 'allProjects'): Project[] => {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }
  return [];
};
// Add these functions to your utils/helpers.ts

// Bookmark related functions
export const getBookmarks = (userId: string): string[] => {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem(`userBookmarks-${userId}`) || '[]');
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }
  return [];
};

export const addBookmark = (projectId: string, userId: string): void => {
  if (typeof window !== 'undefined') {
    try {
      const bookmarks = getBookmarks(userId);
      if (!bookmarks.includes(projectId)) {
        const updatedBookmarks = [...bookmarks, projectId];
        localStorage.setItem(`userBookmarks-${userId}`, JSON.stringify(updatedBookmarks));
        
        // Also update the project's bookmarkedBy array
        updateProjectBookmarks(projectId, userId, true);
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  }
};

export const removeBookmark = (projectId: string, userId: string): void => {
  if (typeof window !== 'undefined') {
    try {
      const bookmarks = getBookmarks(userId);
      const updatedBookmarks = bookmarks.filter(id => id !== projectId);
      localStorage.setItem(`userBookmarks-${userId}`, JSON.stringify(updatedBookmarks));
      
      // Also update the project's bookmarkedBy array
      updateProjectBookmarks(projectId, userId, false);
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }
};

export const isBookmarked = (projectId: string, userId: string): boolean => {
  const bookmarks = getBookmarks(userId);
  return bookmarks.includes(projectId);
};

// Helper function to update project's bookmarkedBy array
const updateProjectBookmarks = (projectId: string, userId: string, isAdding: boolean): void => {
  try {
    const allProjects = getAllProjects();
    const updatedProjects = allProjects.map(project => {
      if (project.id === projectId) {
        const bookmarkedBy = project.bookmarkedBy || [];
        let updatedBookmarkedBy: string[];
        
        if (isAdding) {
          updatedBookmarkedBy = [...bookmarkedBy, userId];
        } else {
          updatedBookmarkedBy = bookmarkedBy.filter(id => id !== userId);
        }
        
        return {
          ...project,
          bookmarkedBy: updatedBookmarkedBy,
          isTrending: updatedBookmarkedBy.length >= 5
        };
      }
      return project;
    });
    
    // Save updated projects back to all storage locations
    localStorage.setItem('allProjects', JSON.stringify(updatedProjects));
    localStorage.setItem('userProjects', JSON.stringify(
      updatedProjects.filter(p => p.isUserGenerated)
    ));
  } catch (error) {
    console.error('Error updating project bookmarks:', error);
  }
};

// Get bookmarked projects for a user
export const getBookmarkedProjects = (userId: string): Project[] => {
  const bookmarks = getBookmarks(userId);
  const allProjects = getAllProjects();
  
  return allProjects.filter(project => bookmarks.includes(project.id));
};