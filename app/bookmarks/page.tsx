'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import projects from '../data/projects.json';
import styles from './bookmarks.module.css';
import { useUser } from '../context/UserContext';
import { useBookmarks } from '../../hooks/useBookmarks';

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  isUserGenerated?: boolean;
  field?: string;
  technologies?: string;
  tags?: string[];
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

export default function Bookmarks() {
  const { user } = useUser();
  const { bookmarkedIds, toggleBookmark, isLoading: bookmarksLoading } = useBookmarks();
  const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarkedProjects = () => {
      try {
        if (!user) {
          setBookmarkedProjects([]);
          setIsLoading(false);
          return;
        }

        // Get projects from all possible sources
        const staticProjects = Object.values(projects.projects).flat() as Project[];
        
        // Check all storage locations for user-generated projects
        const userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]') as Project[];
        const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]') as Project[];
        const generatedProjects = JSON.parse(localStorage.getItem('generatedProjects') || '[]') as Project[];
        
        // Combine all projects, removing duplicates by ID
        const allAvailableProjects = [
          ...staticProjects, 
          ...userProjects, 
          ...allProjects, 
          ...generatedProjects
        ];
        
        const uniqueProjects = allAvailableProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        );

        const bookmarked = uniqueProjects.filter(project =>
          bookmarkedIds.includes(project.id)
        );

        setBookmarkedProjects(bookmarked);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarkedProjects();

    const handleBookmarkUpdate = () => {
      loadBookmarkedProjects();
    };

    window.addEventListener('bookmarks-updated', handleBookmarkUpdate);
    return () => window.removeEventListener('bookmarks-updated', handleBookmarkUpdate);
  }, [user, bookmarkedIds]);

  const handleRemoveBookmark = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(projectId);
  };

  if (!user) {
    return (
      <div className={styles.bookmarks_container}>
        <div className={styles.empty_state}>
          <p>Please sign in to view your bookmarks</p>
          <Link href="/" className={styles.browse_btn}>
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || bookmarksLoading) {
    return <div className={styles.loading}>Loading your bookmarks...</div>;
  }

  return (
    <div className={styles.bookmarks_container}>
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
            width={40}
            height={40}
          />
          <div>
            <p><strong>{user.name}</strong></p>
            <p>{user.email}</p>
          </div>
        </div>
      )}

      <h1 className={styles.title}>Your Bookmarked Projects</h1>

      {bookmarkedProjects.length > 0 ? (
        <div className={styles.projects_grid}>
          {bookmarkedProjects.map(project => (
            <div key={project.id} className={styles.project_card}>
              <button
                onClick={(e) => handleRemoveBookmark(project.id, e)}
                className={styles.remove_btn}
                aria-label="Remove bookmark"
                disabled={bookmarksLoading}
              >
                &times;
              </button>

              <Link href={`/projectspage/${project.id}`} className={styles.link_wrapper}>
                <div className={styles.card_content}>
                  <h3 className={styles.project_title}>{project.title}</h3>
                  <p className={styles.project_category}>{project.category}</p>
                  <p className={styles.project_desc}>{project.description}</p>

                  {/* Show tags for user-generated projects */}
                  {project.tags && project.tags.length > 0 && (
                    <div className={styles.project_tags}>
                      {project.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`${styles.tag} ${
                            tag === 'trending' ? styles.trending :
                            tag === 'new' ? styles.new :
                            tag === 'popular' ? styles.popular :
                            tag === 'existing' ? styles.existing : ''
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Show additional info for user-generated projects */}
                  {project.isUserGenerated && (
                    <div className={styles.user_generated_info}>
                      <span className={styles.user_generated_badge}>User Generated</span>
                      {project.field && <span>Field: {project.field}</span>}
                      {project.technologies && <span>Tech: {project.technologies}</span>}
                    </div>
                  )}

                  {project.details && (
                    <div className={styles.project_meta}>
                      {project.details.difficulty && (
                        <span className={styles.meta_item}>
                          Difficulty: {project.details.difficulty}
                        </span>
                      )}
                      {project.details.duration && (
                        <span className={styles.meta_item}>
                          Duration: {project.details.duration}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty_state}>
          <p>No bookmarks yet!</p>
          <Link href="/dashboard" className={styles.browse_btn}>
            Browse Projects
          </Link>
        </div>
      )}
    </div>
  );
}