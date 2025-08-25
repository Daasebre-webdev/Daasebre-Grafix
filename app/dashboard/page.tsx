'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useUser } from '../context/UserContext'
import styles from './dashboard.module.css'
import Link from 'next/link'
import projects from '../data/projects.json'
import RequireAuth from '../components/RequireAuth'
import { bookmarkProject, removeBookmark, getHomepageProjects, Project } from '../utils/projectUtils'

// Bookmark interface
interface Bookmark {
  projectId: string;
  userId: string;
  timestamp: number;
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [showBookmarkBanner, setShowBookmarkBanner] = useState(true)
  const { user, loading } = useUser()
  const [allProjects, setAllProjects] = useState<Project[]>([])

  // Load bookmarks and projects from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBookmarks = localStorage.getItem('projectBookmarks')
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks))
      }
      
      // Load all projects
      const projects = getHomepageProjects()
      setAllProjects(projects)
    }
  }, [])

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && bookmarks.length >= 0) {
      localStorage.setItem('projectBookmarks', JSON.stringify(bookmarks))
    }
  }, [bookmarks])

  const projectsData = projects?.projects || {}
  const existingProjects = Object.values(projectsData).flat() as Project[]

  // Combine existing projects with user-generated projects
  const combinedProjects = [...existingProjects, ...allProjects.filter(p => p.isUserGenerated)]

  const filteredProjects = combinedProjects.filter(project =>
    project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if a project is bookmarked by the current user
  const isBookmarked = (projectId: string) => {
    return bookmarks.some(bookmark => 
      bookmark.projectId === projectId && bookmark.userId === user?.id
    )
  }

  // Toggle bookmark status for a project
  const toggleBookmark = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user?.id) return
    
    if (isBookmarked(projectId)) {
      // Remove bookmark
      removeBookmark(projectId, user.id)
      setBookmarks(bookmarks.filter(bookmark => 
        !(bookmark.projectId === projectId && bookmark.userId === user.id)
      ))
    } else {
      // Add bookmark
      bookmarkProject(projectId, user.id)
      setBookmarks([...bookmarks, {
        projectId,
        userId: user.id,
        timestamp: Date.now()
      }])
    }
    
    // Refresh projects
    const updatedProjects = getHomepageProjects()
    setAllProjects(updatedProjects)
  }

  // Clear search term
  const clearSearch = () => {
    setSearchTerm('')
  }

  if (loading) {
    return <div className={styles["dashboard-container"]}>Loading...</div>
  }

  return (
    <RequireAuth>
      <div className={styles["dashboard-container"]}>

        {/* User Profile Section */}
        {user?.picture && (
          <div className={styles["profile-section"]}>
            <Image
              src={
                user.picture.startsWith('http')
                  ? user.picture
                  : `http://localhost/Google_signup/${user.picture}`
              }
              alt="User profile"
              className={styles["user-avatar"]}
              width={80}
              height={80}
              priority
            />
            <div>
              <p><strong>{user.name}</strong></p>
              <p>{user.email}</p>
            </div>
          </div>
        )}

        {/* Bookmark Notification Banner */}
        {showBookmarkBanner && (
          <div className={styles["bookmark-banner"]}>
            <div className={styles["banner-content"]}>
              <span className={styles["banner-icon"]}>📌</span>
              <p>
                <strong>Bookmark projects you want to work on!</strong> This helps prevent others from 
                selecting the same project and shows your interest publicly.
              </p>
            </div>
            <button 
              className={styles["banner-close"]}
              onClick={() => setShowBookmarkBanner(false)}
              aria-label="Close banner"
            >
              &times;
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className={styles["header"]}>
          <h1 className={styles["main-title"]}>AI-Powered Personalized Project Topic Selection</h1>
          <p className={styles["intro-text"]}>
            An AI-driven system designed to assist final-year university students in selecting personalized project topics. 
            The system analyzes student profiles, academic interests, and resources to recommend suitable ideas, providing 
            detailed descriptions, step-by-step tutorials, and access to relevant resources.
          </p>
        </div>

        {/* Navigation Menu */}
        <div className={styles["menu"]}>
          <Link href={`/dashboard`} className={styles["menu-link"]}>Browse Projects</Link>
          <span className={styles["menu-separator"]}>|</span>
          <Link href={`../ai`} className={styles["menu-link"]}>Generate Your Own Project</Link>
          <span className={styles["menu-separator"]}>|</span>
          <Link href={`../bookmarks`} className={styles["menu-link"]}>My Bookmarks</Link>
        </div>

        {/* Search Input */}
        <div className={styles["search"]}>
          <div className={styles["search-container"]}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles["search-input"]}
              placeholder='Search projects...'
            />
            {searchTerm && (
              <button 
                className={styles["search-clear"]}
                onClick={clearSearch}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Search Results or Projects */}
        {searchTerm ? (
          <div className={styles["search-results"]}>
            <h3>Search Results</h3>
            <div className={styles["recommendations"]}>
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isBookmarked={isBookmarked(project.id)}
                  onBookmarkToggle={toggleBookmark}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles["content-sections"]}>
            {/* Overview Section */}
            <div className={styles["section"]}>
              <h2 className={styles["section-title"]}>Overview</h2>
              <p className={styles["section-description"]}>
                The AI-Powered Personalized Project Topic Selection system is designed to streamline the project selection 
                process for final-year university students by leveraging machine learning algorithms to analyze student 
                profiles, academic interests, and resources. Each recommendation includes a comprehensive project description, 
                clear objectives, and expected outcomes. The system offers step-by-step tutorials and access to relevant resources.
              </p>
            </div>

            {/* Projects by Category */}
            {Object.entries(projectsData).map(([field, items]) => (
              <div key={field} className={styles["section"]}>
                <h2 className={styles["section-title"]}>
                  {field.charAt(0).toUpperCase() + field.slice(1)} Projects
                </h2>
                <div className={styles["recommendations"]}>
                  {(items as Project[]).map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      isBookmarked={isBookmarked(project.id)}
                      onBookmarkToggle={toggleBookmark}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* User Generated Projects Section */}
            {allProjects.filter(p => p.isUserGenerated).length > 0 && (
              <div key="user-generated" className={styles["section"]}>
                <h2 className={styles["section-title"]}>
                  User Generated Projects
                </h2>
                <div className={styles["recommendations"]}>
                  {allProjects
                    .filter(p => p.isUserGenerated)
                    .map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        isBookmarked={isBookmarked(project.id)}
                        onBookmarkToggle={toggleBookmark}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}

// Updated Project Card Component
function ProjectCard({ 
  project, 
  isBookmarked, 
  onBookmarkToggle 
}: { 
  project: Project; 
  isBookmarked: boolean;
  onBookmarkToggle: (projectId: string, e: React.MouseEvent) => void;
}) {
  const [viewCount, setViewCount] = useState<number>(project.viewCount || 0)

  // Load saved view count from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViews = localStorage.getItem(`views_${project.id}`)
      if (savedViews) {
        setViewCount(parseInt(savedViews, 10))
      }
    }
  }, [project.id])

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Increment and save to localStorage
    setViewCount(prev => {
      const newCount = prev + 1
      localStorage.setItem(`views_${project.id}`, newCount.toString())
      return newCount
    })

    // TODO: send update to backend if needed
    // fetch(`/api/projects/${project.id}/increment-view`, { method: "POST" })

    // Navigate to project page
    window.location.href = `/projectspage/${project.id}`
  }

  return (
    <div className={styles["project-card"]}>
      {/* Bookmark button */}
      <button 
        className={`${styles["bookmark-button"]} ${isBookmarked ? styles["bookmarked"] : ""}`}
        onClick={(e) => onBookmarkToggle(project.id, e)}
        aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
      >
        {isBookmarked ? '★' : '☆'}
      </button>
      
      {/* Project status tags */}
      <div className={styles["project-tags"]}>
        {project.tags?.map(tag => (
          <span 
            key={tag} 
            className={`${styles["project-tag"]} ${
              tag === 'trending' ? styles["trending-tag"] :
              tag === 'new' ? styles["new-tag"] :
              tag === 'popular' ? styles["popular-tag"] :
              tag === 'existing' ? styles["existing-tag"] : ''
            }`}
          >
            {tag === 'trending' ? '🔥 Trending' : 
             tag === 'new' ? '🆕 New' : 
             tag === 'popular' ? '⭐ Popular' : 
             tag === 'existing' ? '📚 Existing' : tag}
          </span>
        ))}
      </div>
      
      <div className={styles["card-icon"]}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className={styles["card-content"]}>
        <div className={styles["card-title"]}>{project.title}</div>
        <div className={styles["card-description"]}>{project.description}</div>
        <div className={styles["project-stats"]}>
          <span>👁️ {viewCount}</span>
          <span>⭐ {project.bookmarkedBy?.length || 0}</span>
        </div>
      </div>

      {/* View button */}
      <button 
        className={styles["card-button"]}
        onClick={handleViewClick}
      >
        View
      </button>
    </div>
  )
}