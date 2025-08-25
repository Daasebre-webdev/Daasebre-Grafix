'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/app/context/UserContext';

interface Claimant {
  userId: string;
  userName: string;
  userPicture: string;
}

interface BookmarkHook {
  isBookmarked: (projectId: string) => boolean;
  toggleBookmark: (projectId: string) => boolean;
  bookmarkedIds: string[];
  isLoading: boolean;
  getBookmarkCount: (projectId: string) => number;
  claimProject: (projectId: string) => boolean;
  isProjectClaimed: (projectId: string) => boolean;
  getProjectClaimant: (projectId: string) => Claimant | null;
}

export const useBookmarks = (): BookmarkHook => {
  const { user } = useUser();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Safe JSON parse with error handling
  const safeJsonParse = <T,>(jsonString: string): T | null => {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  };

  // Load bookmarks when user changes
  useEffect(() => {
    const loadBookmarks = () => {
      try {
        setIsLoading(true);
        
        if (!user) {
          setBookmarkedIds([]);
          return;
        }

        const bookmarkKey = `userBookmarks-${user.id}`;
        const storedBookmarks = localStorage.getItem(bookmarkKey);
        const parsedBookmarks = storedBookmarks 
          ? safeJsonParse<string[]>(storedBookmarks) 
          : [];
        
        setBookmarkedIds(parsedBookmarks || []);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
        setBookmarkedIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `userBookmarks-${user?.id}`) {
        loadBookmarks();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const isBookmarked = (projectId: string): boolean => {
    return bookmarkedIds.includes(projectId);
  };

  // Function to get total bookmark count for a project
  const getBookmarkCount = (projectId: string): number => {
    try {
      // Get all users' bookmarks from localStorage
      let totalCount = 0;
      
      // Loop through all localStorage keys that start with "userBookmarks-"
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userBookmarks-')) {
          const bookmarks = safeJsonParse<string[]>(localStorage.getItem(key) || '[]') || [];
          if (bookmarks.includes(projectId)) {
            totalCount++;
          }
        }
      }
      
      return totalCount;
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  };

  const toggleBookmark = (projectId: string): boolean => {
    if (!user || isLoading) return false;

    try {
      const bookmarkKey = `userBookmarks-${user.id}`;
      const isCurrentlyBookmarked = isBookmarked(projectId);
      const updatedIds = isCurrentlyBookmarked
        ? bookmarkedIds.filter(id => id !== projectId)
        : [...bookmarkedIds, projectId];

      localStorage.setItem(bookmarkKey, JSON.stringify(updatedIds));
      setBookmarkedIds(updatedIds);
      
      // Update project metadata to reflect bookmark status
      updateProjectBookmarkStatus(projectId, user.id, !isCurrentlyBookmarked);
      
      window.dispatchEvent(new Event('bookmarks-updated'));
      window.dispatchEvent(new Event('projects-updated'));
      return true;
    } catch (error) {
      console.error('Failed to update bookmarks:', error);
      return false;
    }
  };

  // Add claim project functionality
  const claimProject = (projectId: string): boolean => {
    if (!user) return false;

    try {
      const projects = getAllProjectsFromStorage();
      const projectIndex = projects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) return false;
      
      // Check if project is already claimed
      if (projects[projectIndex].isClaimed) {
        return false;
      }
      
      // Claim the project
      projects[projectIndex].isClaimed = true;
      projects[projectIndex].claimedBy = {
        userId: user.id,
        userName: user.name,
        userPicture: user.picture || '/default-profile.png'
      };
      
      // Update tags
      const currentTags = new Set(projects[projectIndex].tags || []);
      currentTags.delete('new');
      currentTags.add('taken');
      projects[projectIndex].tags = Array.from(currentTags);
      
      // Save updated projects
      saveProjectsToStorage(projects);
      
      // Dispatch event to update UI
      window.dispatchEvent(new Event('claims-updated'));
      window.dispatchEvent(new Event('projects-updated'));
      
      return true;
    } catch (error) {
      console.error('Failed to claim project:', error);
      return false;
    }
  };

  const isProjectClaimed = (projectId: string): boolean => {
    try {
      const projects = getAllProjectsFromStorage();
      const project = projects.find(p => p.id === projectId);
      return project?.isClaimed || false;
    } catch (error) {
      console.error('Error checking if project is claimed:', error);
      return false;
    }
  };

  const getProjectClaimant = (projectId: string): Claimant | null => {
    try {
      const projects = getAllProjectsFromStorage();
      const project = projects.find(p => p.id === projectId);
      return project?.claimedBy || null;
    } catch (error) {
      console.error('Error getting project claimant:', error);
      return null;
    }
  };

  // Function to update project metadata when bookmarked
  const updateProjectBookmarkStatus = (projectId: string, userId: string, isBookmarking: boolean) => {
    try {
      // Get all projects from all storage locations
      const allProjects = getAllProjectsFromStorage();
      
      const updatedProjects = allProjects.map((project: any) => {
        if (project.id === projectId) {
          // Update bookmarkedBy array
          const bookmarkedBy = project.bookmarkedBy || [];
          const updatedBookmarkedBy = isBookmarking
            ? [...bookmarkedBy, userId]
            : bookmarkedBy.filter((id: string) => id !== userId);
          
          // Calculate total bookmark count
          const bookmarkCount = getBookmarkCount(projectId);
          
          // Update tags based on bookmark status and count
          const currentTags = new Set(project.tags || []);
          
          if (isBookmarking) {
            currentTags.delete('new');
            currentTags.add('bookmarked');
            
            // If enough bookmarks, mark as trending
            if (bookmarkCount >= 5) {
              currentTags.add('trending');
            }
            
            // If it's the first bookmark by any user, mark as popular
            if (bookmarkCount >= 3) {
              currentTags.add('popular');
            }
          } else {
            currentTags.delete('bookmarked');
            
            // If bookmarks drop below threshold, remove trending
            if (bookmarkCount < 5 && currentTags.has('trending')) {
              currentTags.delete('trending');
            }
            
            // If bookmarks drop below threshold, remove popular
            if (bookmarkCount < 3 && currentTags.has('popular')) {
              currentTags.delete('popular');
            }
            
            // If it's a user-generated project and recently created, add back 'new' tag
            if (project.isUserGenerated && isProjectNew(project)) {
              currentTags.add('new');
            }
          }
          
          return {
            ...project,
            bookmarkedBy: updatedBookmarkedBy,
            bookmarkCount, // Store the count for easy access
            tags: Array.from(currentTags),
            isTrending: bookmarkCount >= 5,
            isPopular: bookmarkCount >= 3
          };
        }
        return project;
      });
      
      // Save updated projects back to all storage locations
      saveProjectsToStorage(updatedProjects);
    } catch (error) {
      console.error('Error updating project bookmark status:', error);
    }
  };

  // Helper function to get all projects from storage
  const getAllProjectsFromStorage = (): any[] => {
    try {
      const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
      const userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
      const generatedProjects = JSON.parse(localStorage.getItem('generatedProjects') || '[]');
      
      // Combine and remove duplicates
      const combined = [...allProjects, ...userProjects, ...generatedProjects];
      const uniqueProjects = combined.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      );
      
      return uniqueProjects;
    } catch (error) {
      console.error('Error getting projects from storage:', error);
      return [];
    }
  };

  // Helper function to save projects to all storage locations
  const saveProjectsToStorage = (projects: any[]) => {
    try {
      // Save to allProjects (all projects)
      localStorage.setItem('allProjects', JSON.stringify(projects));
      
      // Save to userProjects (only user-generated projects)
      const userGeneratedProjects = projects.filter(p => p.isUserGenerated);
      localStorage.setItem('userProjects', JSON.stringify(userGeneratedProjects));
      
      // Also update generatedProjects if they exist
      const generatedProjects = projects.filter(p => p.isGenerated && !p.isUserGenerated);
      if (generatedProjects.length > 0) {
        localStorage.setItem('generatedProjects', JSON.stringify(generatedProjects));
      }
    } catch (error) {
      console.error('Error saving projects to storage:', error);
    }
  };

  // Helper function to check if a project is new (created within last 7 days)
  const isProjectNew = (project: any): boolean => {
    if (!project.timestamp) return false;
    
    try {
      const projectDate = new Date(project.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      return projectDate > weekAgo;
    } catch (error) {
      console.error('Error checking if project is new:', error);
      return false;
    }
  };

  return { 
    isBookmarked, 
    toggleBookmark, 
    bookmarkedIds, 
    isLoading, 
    getBookmarkCount,
    claimProject,
    isProjectClaimed,
    getProjectClaimant
  };
};