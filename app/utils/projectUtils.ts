// app/utils/projectUtils.ts

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
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
    difficulty?: string;
    duration?: string;
    fullDescription?: string;
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

// Define interfaces for the JSON data structure
interface ProjectDetail {
  difficulty?: string;
  duration?: string;
  fullDescription?: string;
  learningObjectives?: string[];
  steps?: Array<{
    title: string;
    items: string[];
  }>;
  resources?: {
    tools?: Array<{ name: string; link: string }>;
    guides?: Array<{ title: string; link: string }>;
  };
}

interface ProjectData {
  id: string;
  title: string;
  description: string;
  category?: string;
  details?: ProjectDetail;
}

interface ProjectsByCategory {
  [key: string]: ProjectData[];
}

interface ProjectsJson {
  projects: ProjectsByCategory;
}

// Function to bookmark a project
export const bookmarkProject = (projectId: string, userId: string) => {
  const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
  
  const updatedProjects = allProjects.map((project: Project) => {
    if (project.id === projectId) {
      const bookmarkedBy = project.bookmarkedBy || [];
      // Check if user already bookmarked
      if (!bookmarkedBy.includes(userId)) {
        const newBookmarkedBy = [...bookmarkedBy, userId];
        return {
          ...project,
          bookmarkedBy: newBookmarkedBy,
          // If bookmarked by many users, mark as trending
          isTrending: newBookmarkedBy.length >= 5 ? true : project.isTrending,
          tags: updateProjectTags(project, newBookmarkedBy.length, project.viewCount || 0)
        };
      }
    }
    return project;
  });
  
  localStorage.setItem('allProjects', JSON.stringify(updatedProjects));
  
  // Also update user's bookmarks
  const userBookmarks = JSON.parse(localStorage.getItem(`userBookmarks-${userId}`) || '[]');
  if (!userBookmarks.includes(projectId)) {
    localStorage.setItem(`userBookmarks-${userId}`, JSON.stringify([...userBookmarks, projectId]));
  }
  
  return updatedProjects;
};

// Function to remove bookmark
export const removeBookmark = (projectId: string, userId: string) => {
  const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
  
  const updatedProjects = allProjects.map((project: Project) => {
    if (project.id === projectId) {
      const bookmarkedBy = project.bookmarkedBy || [];
      const newBookmarkedBy = bookmarkedBy.filter((id: string) => id !== userId);
      return {
        ...project,
        bookmarkedBy: newBookmarkedBy,
        // If bookmarks drop below threshold, remove trending status
        isTrending: newBookmarkedBy.length < 5 ? false : project.isTrending,
        tags: updateProjectTags(project, newBookmarkedBy.length, project.viewCount || 0)
      };
    }
    return project;
  });
  
  localStorage.setItem('allProjects', JSON.stringify(updatedProjects));
  
  // Also update user's bookmarks
  const userBookmarks = JSON.parse(localStorage.getItem(`userBookmarks-${userId}`) || '[]');
  localStorage.setItem(`userBookmarks-${userId}`, JSON.stringify(
    userBookmarks.filter((id: string) => id !== projectId)
  ));
  
  return updatedProjects;
};

// Function to increment view count
export const incrementViewCount = (projectId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing projects from localStorage
    const projectsJson = localStorage.getItem('userProjects');
    const projects: Project[] = projectsJson ? JSON.parse(projectsJson) : []; // Changed from let to const
    
    // Find and update the specific project
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          viewCount: (project.viewCount || 0) + 1
        };
      }
      return project;
    });
    
    // Save back to localStorage
    localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};
// Helper function to update project tags based on status
const updateProjectTags = (project: Project, bookmarkCount: number, viewCount: number): string[] => {
  const tags = new Set(project.tags || []);
  
  // Remove status tags
  tags.delete('trending');
  tags.delete('new');
  tags.delete('popular');
  tags.delete('existing');
  
  // Add appropriate status tag
  if (bookmarkCount >= 5) {
    tags.add('trending');
  } else if (viewCount >= 50) {
    tags.add('popular');
  } else if (project.isUserGenerated && Date.now() - new Date(project.timestamp || 0).getTime() < 7 * 24 * 60 * 60 * 1000) {
    tags.add('new');
  } else if (!project.isUserGenerated) {
    tags.add('existing');
  }
  
  return Array.from(tags);
};

// Function to get projects for homepage with proper tagging
export const getHomepageProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
    
    return allProjects.map((project: Project) => {
      const tags = updateProjectTags(
        project, 
        project.bookmarkedBy?.length || 0, 
        project.viewCount || 0
      );
      
      return {
        ...project,
        tags,
        isTrending: tags.includes('trending'),
        status: tags.includes('trending') ? 'trending' : 
                tags.includes('popular') ? 'popular' : 
                tags.includes('new') ? 'new' : 'standard'
      };
    });
  } catch (error) {
    console.error('Error getting homepage projects:', error);
    return [];
  }
};

// Function to get existing projects from the JSON data
export const getExistingProjects = (projectsData: ProjectsJson): Project[] => {
  const projects: Project[] = [];
  
  // Extract all projects from the JSON structure
  Object.values(projectsData.projects || {}).forEach((categoryProjects: ProjectData[]) => {
    categoryProjects.forEach((project: ProjectData) => {
      projects.push({
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category || 'General',
        // Add default values for the new properties
        bookmarkedBy: [],
        viewCount: Math.floor(Math.random() * 100), // Random view count for demo
        isTrending: Math.random() > 0.7, // Some projects are trending
        tags: ['existing'], // Tag to identify existing projects
        status: 'standard',
        // Add details if they exist
        details: project.details
      });
    });
  });
  
  return projects;
};

// Function to initialize projects in localStorage
export const initializeProjects = (existingProjects: Project[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Get user-generated projects
    const userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    
    // Combine all projects
    const allProjects = [...existingProjects, ...userProjects];
    
    // Update tags for all projects
    const updatedProjects = allProjects.map(project => {
      const tags = updateProjectTags(
        project, 
        project.bookmarkedBy?.length || 0, 
        project.viewCount || 0
      );
      
      return {
        ...project,
        tags,
        isTrending: tags.includes('trending'),
        status: tags.includes('trending') ? 'trending' : 
                tags.includes('popular') ? 'popular' : 
                tags.includes('new') ? 'new' : 'standard'
      };
    });
    
    localStorage.setItem('allProjects', JSON.stringify(updatedProjects));
  } catch (error) {
    console.error('Error initializing projects:', error);
  }
};