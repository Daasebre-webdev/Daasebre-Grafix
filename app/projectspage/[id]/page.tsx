'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProjectById, type Project } from '@/app/utils/helpers';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useUser } from '@/app/context/UserContext';
import styles from './projectspage.module.css';

// Define types for resources
interface ResourceItem {
  name: string;
  link: string;
}

interface GuideItem {
  title: string;
  link: string;
}

interface ProjectResources {
  tools?: ResourceItem[];
  guides?: GuideItem[];
}

// Augment the Project type to include detailed resources
interface DetailedProject extends Project {
  details?: {
    fullDescription?: string;
    difficulty?: string;
    duration?: string;
    learningObjectives?: string[];
    steps?: {
      title: string;
      items: string[];
    }[];
    resources?: ProjectResources;
  };
}

export default function ProjectPage() {
  const params = useParams();
  const rawId = params?.id;

  // Normalize id to always be a string
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? '';
  const router = useRouter();
  const { user } = useUser();

  const [project, setProject] = useState<DetailedProject | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isBookmarked, toggleBookmark, isLoading: bookmarksLoading } = useBookmarks();

  useEffect(() => {
    setIsMounted(true);
    
    const loadProject = () => {
      if (!id) {
        router.push('/404');
        return;
      }

      try {
        const foundProject = getProjectById(id) as DetailedProject | undefined;

        if (!foundProject) {
          router.push('/404');
          return;
        }

        setProject(foundProject);
      } catch (error) {
        console.error('Error loading project:', error);
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, router]);

  // Listen for bookmark updates to refresh project data
  useEffect(() => {
    const handleBookmarkUpdate = () => {
      if (id) {
        const updatedProject = getProjectById(id) as DetailedProject | undefined;
        if (updatedProject) {
          setProject(updatedProject);
        }
      }
    };

    window.addEventListener('bookmarks-updated', handleBookmarkUpdate);
    window.addEventListener('projects-updated', handleBookmarkUpdate);
    
    return () => {
      window.removeEventListener('bookmarks-updated', handleBookmarkUpdate);
      window.removeEventListener('projects-updated', handleBookmarkUpdate);
    };
  }, [id]);

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (id) {
      const success = toggleBookmark(id);
      if (success) {
        // The hook will dispatch events to update other components
        // We don't need to do anything else here
      }
    }
  };

  if (!isMounted || loading) return <div className={styles.loading}>Loading...</div>;
  if (!project) return <div className={styles.loading}>Project not found</div>;

  return (
    <div className={styles.projectContainer}>
      <button onClick={() => router.back()} className={styles.backLink}>
        &larr; Back
      </button>

      <h1 className={styles.heading}>{project.title}</h1>
      <span className={styles.category}>{project.category}</span>
      <p className={styles.description}>{project.description}</p>

      {/* Show tags for user-generated projects */}
      {project.tags && project.tags.length > 0 && (
        <div className={styles.tags}>
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
        <div className={styles.userInfo}>
          {project.field && (
            <p><strong>Field:</strong> {project.field}</p>
          )}
          {project.technologies && (
            <p><strong>Technologies:</strong> {project.technologies}</p>
          )}
        </div>
      )}

      <div className={styles.bookmarkControls}>
        <button
          onClick={handleBookmarkToggle}
          disabled={bookmarksLoading || !user}
          className={`${styles.bookmarkButton} ${
            isBookmarked(id) ? styles.bookmarked : ''
          }`}
        >
          {bookmarksLoading
            ? '...'
            : !user
            ? 'Sign in to bookmark'
            : isBookmarked(id)
            ? 'Bookmarked ✓'
            : 'Bookmark this Project'}
        </button>
      </div>

      {!project.details ? (
        <div className={styles.detailsSection}>
          <h2 className={styles.subHeading}>Project Information</h2>
          <div className={styles.stepCard}>
            <h3 className={styles.stepTitle}>About This Project</h3>
            <p>This is a user-generated project. For detailed implementation steps and resources, 
               please contact the project creator or refer to the project documentation.</p>
            
            {project.isUserGenerated && (
              <p className={styles.userGeneratedNote}>
                <em>This project was generated based on user preferences and may not have full detailed documentation yet.</em>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.detailsSection}>
          <h2 className={styles.subHeading}>Project Details</h2>
          <div className={styles.detailGrid}>
            {project.details.fullDescription && (
              <div className={styles.stepCard}>
                <h3 className={styles.stepTitle}>Description</h3>
                <p>{project.details.fullDescription}</p>
              </div>
            )}
            {project.details.difficulty && (
              <div className={styles.stepCard}>
                <h3 className={styles.stepTitle}>Difficulty</h3>
                <p>{project.details.difficulty}</p>
              </div>
            )}
            {project.details.duration && (
              <div className={styles.stepCard}>
                <h3 className={styles.stepTitle}>Duration</h3>
                <p>{project.details.duration}</p>
              </div>
            )}
            {project.details.learningObjectives && (
              <div className={styles.stepCard}>
                <h3 className={styles.stepTitle}>Learning Objectives</h3>
                <ul className={styles.stepItems}>
                  {project.details.learningObjectives.map((obj, index) => (
                    <li key={index} className={styles.stepItem}>
                      <span className={styles.itemBullet}>•</span> {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.details.steps && (
              <div className={styles.stepCard}>
                <h3 className={styles.stepTitle}>Steps</h3>
                <ul className={styles.stepItems}>
                  {project.details.steps.map((step, index) => (
                    <li key={index} className={styles.stepItem}>
                      <strong>{step.title}</strong>
                      <ul>
                        {step.items.map((item, i) => (
                          <li key={i} className={styles.stepItem}>
                            <span className={styles.itemBullet}>–</span> {item}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.details.resources && (
              <div className={styles.stepCard}>
                <h3 className={styles.stepTitle}>Resources</h3>
                {project.details.resources.tools && (
                  <>
                    <h4>Tools</h4>
                    <ul className={styles.stepItems}>
                      {project.details.resources.tools.map((tool, index) => (
                        <li key={index} className={styles.stepItem}>
                          <a href={tool.link} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                            {tool.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {project.details.resources.guides && (
                  <>
                    <h4>Guides</h4>
                    <ul className={styles.stepItems}>
                      {project.details.resources.guides.map((guide, index) => (
                        <li key={index} className={styles.stepItem}>
                          <a href={guide.link} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                            {guide.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}