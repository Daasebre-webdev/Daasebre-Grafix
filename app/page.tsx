'use client';

import Link from 'next/link';
import styles from './home.module.css';
import { useEffect, useState, useMemo, useCallback } from 'react'; // Fixed imports
import { useUser } from '@/app/context/UserContext';
import Image from 'next/image';
import { incrementViewCount, getHomepageProjects, getExistingProjects, initializeProjects, Project } from '@/app/utils/projectUtils';
import projectsData from '@/app/data/projects.json';
import { useBookmarks } from '@/hooks/useBookmarks';

interface QAItem {
  id: string;
  question: string;
  answers: Answer[];
  author: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    reputation?: number;
  };
  timestamp: string;
  tags: string[];
  upvotes: number;
  views: number;
  isBookmarked?: boolean;
  isEmergency?: boolean;
  isEditing?: boolean;
  showAnswers?: boolean;
}

interface Answer {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    reputation?: number;
  };
  timestamp: string;
  upvotes: number;
  isAccepted: boolean;
}

export default function Home() {
  const { user, loading: authLoading } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [qas, setQas] = useState<QAItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAllQA, setShowAllQA] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string>('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const { 
    isBookmarked, 
    toggleBookmark, 
    getBookmarkCount, 
    isLoading: bookmarksLoading,
    claimProject,
    isProjectClaimed,
    getProjectClaimant
  } = useBookmarks();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingProjects = getExistingProjects(projectsData);
      initializeProjects(existingProjects);
      
      const projects = getHomepageProjects();
      setAllProjects(projects);
      
      try {
        const savedQAs = localStorage.getItem('communityQAs');
        if (savedQAs) {
          const parsedQAs = JSON.parse(savedQAs);
          setQas(parsedQAs);
        } else {
          setQas([]);
          localStorage.setItem('communityQAs', JSON.stringify([]));
        }
      } catch (error) {
        console.error('Failed to parse Q&A data:', error);
        setQas([]);
        localStorage.setItem('communityQAs', JSON.stringify([]));
      }
    }
  }, []);

  useEffect(() => {
    const handleBookmarkUpdate = () => {
      const updatedProjects = getHomepageProjects();
      setAllProjects(updatedProjects);
    };

    const handleProjectUpdate = () => {
      const updatedProjects = getHomepageProjects();
      setAllProjects(updatedProjects);
    };

    const handleClaimUpdate = () => {
      const updatedProjects = getHomepageProjects();
      setAllProjects(updatedProjects);
    };

    window.addEventListener('bookmarks-updated', handleBookmarkUpdate);
    window.addEventListener('projects-updated', handleProjectUpdate);
    window.addEventListener('claims-updated', handleClaimUpdate);
    
    return () => {
      window.removeEventListener('bookmarks-updated', handleBookmarkUpdate);
      window.removeEventListener('projects-updated', handleProjectUpdate);
      window.removeEventListener('claims-updated', handleClaimUpdate);
    };
  }, []);

   const isBookmarkedByUser = useCallback((projectId: string) => {
    if (!user) return false;
    return isBookmarked(projectId);
  }, [user, isBookmarked]);

  const getUserProfileForBookmark = (projectId: string) => {
    if (!user || !isBookmarkedByUser(projectId)) return null;
    return user.picture || '/default-profile.png';
  };

  const handleBookmarkToggle = (projectId: string) => {
    if (!user) {
      alert('Please sign in to bookmark projects');
      return;
    }
    toggleBookmark(projectId);
  };

  const handleClaimProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      alert('Please sign in to claim a project');
      return;
    }
    
    if (isProjectClaimed(projectId)) {
      const claimant = getProjectClaimant(projectId);
      alert(`This project has already been claimed by ${claimant?.userName || 'another user'}`);
      return;
    }
    
    const success = claimProject(projectId);
    if (success) {
      alert('Project claimed successfully!');
      const updatedProjects = getHomepageProjects();
      setAllProjects(updatedProjects);
    } else {
      alert('Failed to claim project. It may already be taken.');
    }
  };

const hasUserClaimedProject = useCallback((projectId: string) => {
    if (!user) return false;
    const claimant = getProjectClaimant(projectId);
    return claimant && claimant.userId === user.id;
  }, [user, getProjectClaimant]);

 const getViewCount = useCallback((projectId: string) => {
    try {
      const storedViews = localStorage.getItem(`views_${projectId}`);
      return storedViews ? parseInt(storedViews, 10) : 0;
    } catch (error) {
      console.error('Error getting view count:', error);
      return 0;
    }
  }, []);



 const getDaysSinceCreation = useCallback((project: Project): number => {
    if (!project.timestamp) return 0;
    
    try {
      const projectDate = new Date(project.timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - projectDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days since creation:', error);
      return 0;
    }
  }, []);

 const isProjectNew = useCallback((project: Project): boolean => {
    if (!project.timestamp) return false;
    
    try {
      const projectDate = new Date(project.timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - projectDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch (error) {
      console.error('Error calculating days since creation:', error);
      return false;
    }
  }, []);

const sortedProjects = useMemo(() => {
    return [...allProjects].sort((a, b) => {
      const aIsNew = isProjectNew(a);
      const bIsNew = isProjectNew(b);
      
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      
      if (a.isUserGenerated && !b.isUserGenerated) return -1;
      if (!a.isUserGenerated && b.isUserGenerated) return 1;
      
      if (a.isUserGenerated && b.isUserGenerated) {
        const aDate = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bDate = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bDate - aDate;
      }
      
      const aBookmarks = getBookmarkCount(a.id);
      const bBookmarks = getBookmarkCount(b.id);
      return bBookmarks - aBookmarks;
    });
  }, [allProjects, getBookmarkCount, isProjectNew]);

  const filteredProjects = useMemo(() => {
    if (searchTerm.trim() === '') {
      return sortedProjects;
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      
      return sortedProjects.filter(project => {
        const viewCount = getViewCount(project.id);
        
        // Handle special filter keywords
        if (searchTermLower === 'popular') {
          return viewCount >= 50;
        }
        if (searchTermLower === 'trending') {
          return !project.isUserGenerated;
        }
        if (searchTermLower === 'new') {
          return isProjectNew(project);
        }
        if (searchTermLower === 'bookmarked') {
          return isBookmarkedByUser(project.id) || project.tags?.includes('bookmarked');
        }
        if (searchTermLower === 'taken') {
          return isProjectClaimed(project.id);
        }

        // Standard search
        return (
          project.title.toLowerCase().includes(searchTermLower) ||
          project.description.toLowerCase().includes(searchTermLower) ||
          project.category.toLowerCase().includes(searchTermLower) ||
          (project.tags && project.tags.some(tag => 
            tag.toLowerCase().includes(searchTermLower)
          )) ||
          (isProjectClaimed(project.id) && 
           getProjectClaimant(project.id)?.userName.toLowerCase().includes(searchTermLower))
        );
      });
    }
  }, [searchTerm, sortedProjects, isProjectNew, isBookmarkedByUser, isProjectClaimed, getViewCount, getProjectClaimant]);

  const handleAskQuestion = () => {
    if (!newQuestion.trim() || !user) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const newQA: QAItem = {
        id: Date.now().toString(),
        question: newQuestion,
        answers: [],
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          reputation: user.reputation || 0
        },
        timestamp: new Date().toISOString(),
        tags: [],
        upvotes: 0,
        views: 0,
        isEmergency: false,
        showAnswers: false
      };
      
      const updatedQAs = [newQA, ...qas];
      setQas(updatedQAs);
      localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
      setNewQuestion('');
      setIsAsking(false);
      setIsGenerating(false);
    }, 1500);
  };

  const handleReply = (questionId: string) => {
    if (!replyContent.trim() || !user) return;
    
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        const newAnswer: Answer = {
          id: Date.now().toString(),
          content: replyContent,
          author: {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            reputation: user.reputation || 0
          },
          timestamp: new Date().toISOString(),
          upvotes: 0,
          isAccepted: false
        };
        
        return {
          ...qa,
          answers: [...qa.answers, newAnswer],
          showAnswers: true
        };
      }
      return qa;
    });
    
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleToggleAnswers = (questionId: string) => {
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        return {
          ...qa,
          showAnswers: !qa.showAnswers
        };
      }
      return qa;
    });
    
    setQas(updatedQAs);
  };

  const handleEditQuestion = (questionId: string) => {
    const question = qas.find(q => q.id === questionId);
    if (question) {
      setEditingQuestion(questionId);
      setEditQuestionText(question.question);
    }
  };

  const handleSaveEdit = (questionId: string) => {
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        return {
          ...qa,
          question: editQuestionText,
          isEditing: false
        };
      }
      return qa;
    });
    
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
    setEditingQuestion('');
    setEditQuestionText('');
  };

  const handleCancelEdit = () => {
    setEditingQuestion('');
    setEditQuestionText('');
  };

  const handleDeleteQuestion = (questionId:string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQAs = qas.filter(qa => qa.id !== questionId);
      setQas(updatedQAs);
      localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
    }
  };

  const handleToggleEmergency = (questionId: string) => {
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        return {
          ...qa,
          isEmergency: !qa.isEmergency
        };
      }
      return qa;
    });
    
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
  };

  const handleUpvote = (questionId: string, answerId?: string) => {
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        if (!answerId) {
          return { ...qa, upvotes: (qa.upvotes || 0) + 1 };
        } else {
          const updatedAnswers = qa.answers.map(answer => {
            if (answer.id === answerId) {
              return { ...answer, upvotes: (answer.upvotes || 0) + 1 };
            }
            return answer;
          });
          return { ...qa, answers: updatedAnswers };
        }
      }
      return qa;
    });
    
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'recently';
    }
  };

  const topQuestions = useMemo(() => {
    if (!qas || !Array.isArray(qas)) return [];
    
    return qas
      .sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      })
      .slice(0, showAllQA ? qas.length : 3);
  }, [qas, showAllQA]);

  const googleLoginUrl = 'https://pulse.great-site.net/Google_signup/index.php';

  return (
    <>
      <div className={styles.home_container}>
        <div className={styles["background-image-container"]}>
          <div className={styles["main-text"]}>
            <div className={styles["heading"]}>
              <h1>Unlock Your Final Year<br />Project Potential</h1> 
            </div>
            <div className={styles["description"]}>
              <p>Get personalized project topic recommendations tailored to your interests and skills.</p>
            </div>
            <div className={styles["explore-btn"]}>
              {authLoading ? (
                <button className={styles["explore-button"]} disabled>
                  Loading...
                </button>
              ) : user ? (
                <Link href="/dashboard" className={styles["explore-button"]}>
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  className={styles["explore-button"]}
                  onClick={() => { window.location.href = googleLoginUrl; }}
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>

    <div className={styles["tabs-container"]}>
  <div className={styles["left-section"]}>
    <div className={styles["search-section"]}>
      {/* Filter suggestions above search bar */}
      <div className={styles["filter-suggestions"]}>
        <span className={styles["suggestion-title"]}>Quick filters: </span>
        <div className={styles["filter-tags"]}>
          <button 
            className={styles["filter-tag"]}
            onClick={() => setSearchTerm('popular')}
            title="Show popular projects"
          >
            ⭐ Popular
          </button>
          <button 
            className={styles["filter-tag"]}
            onClick={() => setSearchTerm('trending')}
            title="Show trending projects"
          >
            🔥 Trending
          </button>
          <button 
            className={styles["filter-tag"]}
            onClick={() => setSearchTerm('new')}
            title="Show new projects"
          >
            🆕 New
          </button>
          <button 
            className={styles["filter-tag"]}
            onClick={() => setSearchTerm('bookmarked')}
            title="Show bookmarked projects"
          >
            📌 Bookmarked
          </button>
          <button 
            className={styles["filter-tag"]}
            onClick={() => setSearchTerm('taken')}
            title="Show claimed projects"
          >
            ✅ Taken
          </button>
        </div>
      </div>

      <div className={styles["search-container"]}>
        <svg className={styles["search-icon"]} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input 
          type="text" 
          placeholder="Search for project topics..." 
          className={styles["search-input"]}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>

    <div className={styles["featured-projects"]}>
      <h2>Featured Projects</h2>
      <p>Discover trending project ideas and innovative solutions</p>
    </div>

    <div className={styles["left-tabs"]}>
  {filteredProjects.length > 0 ? (
    filteredProjects.map((project) => {
      const viewCount = getViewCount(project.id);
      const isPopular = viewCount >= 50; // Popular based on views (50+ views)
      const isTrending = !project.isUserGenerated; // Trending for all existing projects
      const daysSinceCreation = getDaysSinceCreation(project);
      const isNew = isProjectNew(project);
      const userProfileImage = getUserProfileForBookmark(project.id);
      const isClaimed = isProjectClaimed(project.id);
      const claimant = getProjectClaimant(project.id);
      const userHasClaimed = hasUserClaimedProject(project.id);

      return (
        <div 
          className={styles["tab"]} 
          key={project.id}
          onClick={() => {
            incrementViewCount(project.id);
            const updatedProjects = getHomepageProjects();
            setAllProjects(updatedProjects);
          }}
        >
          <div className={styles["tab-header"]}>
            <div className={styles["tab-icon"]}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2C5.11929 2 4 3.11929 4 4.5V19.5C4 20.8807 5.11929 22 6.5 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles["project-tags"]}>
              {isClaimed && claimant && (
                <div className={styles["claimant-info"]}>
                  <Image
                    src={claimant.userPicture}
                    alt={`Claimed by ${claimant.userName}`}
                    width={24}
                    height={24}
                    className={styles["claimant-avatar"]}
                    onError={(e) => {
                      e.currentTarget.src = '/default-profile.png';
                    }}
                  />
                  <span className={styles["claimant-name"]}>
                    ✅ {userHasClaimed ? "You claimed this" : `Claimed by ${claimant.userName}`}
                  </span>
                </div>
              )}

              {userProfileImage && !isClaimed && (
                <div className={styles["bookmark-user-profile"]}>
                  <Image
                    src={userProfileImage}
                    alt={`Bookmarked by ${user?.name || 'You'}`}
                    width={24}
                    height={24}
                    className={styles["bookmark-profile-image"]}
                    onError={(e) => {
                      e.currentTarget.src = '/default-profile.png';
                    }}
                  />
                  <span className={styles["bookmark-user-name"]}>
                    {user?.name || 'You'}
                  </span>
                </div>
              )}
              
              {isPopular && (
                <span className={`${styles["project-tag"]} ${styles["popular-tag"]}`}>
                  ⭐ Popular ({viewCount} views)
                </span>
              )}
              
              {isTrending && (
                <span className={`${styles["project-tag"]} ${styles["trending-tag"]}`}>
                  🔥 Trending
                </span>
              )}
              
              {project.isUserGenerated && isNew && !isClaimed && (
                <span className={`${styles["project-tag"]} ${styles["new-tag"]}`}>
                  🆕 New ({daysSinceCreation}d)
                </span>
              )}
              
              {project.tags?.map(tag => (
                <span 
                  key={tag} 
                  className={`${styles["project-tag"]} ${
                    tag === 'bookmarked' ? styles["bookmarked-tag"] :
                    tag === 'taken' ? styles["taken-tag"] : ''
                  }`}
                  style={{ display: ['existing', 'trending'].includes(tag) ? 'none' : 'inline-flex' }}
                >
                  {tag === 'bookmarked' ? '📌 Bookmarked' :
                   tag === 'taken' ? '✅ Taken' : tag}
                </span>
              ))}
              
              {isBookmarkedByUser(project.id) && !project.tags?.includes('bookmarked') && !isClaimed && (
                <span className={styles["bookmarked-tag"]}>📌 Bookmarked</span>
              )}
            </div>
          </div>

          <div className={styles["tab-content"]}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div className={styles["tab-category"]}>
              <span>{project.category}</span>
              {project.isUserGenerated && (
                <span className={styles["user-generated-badge"]}>User Generated</span>
              )}
              {!project.isUserGenerated && (
                <span className={styles["existing-badge"]}>Existing Project</span>
              )}
            </div>

            <div className={styles["project-stats"]}>
              <span>👁️ {viewCount} views</span>
              <span>⭐ {getBookmarkCount(project.id)} bookmarks</span>
              
              {user && !isClaimed && (
                <button 
                  className={styles["claim-btn"]}
                  onClick={(e) => handleClaimProject(project.id, e)}
                  title="Claim this project"
                >
                  🚀 Claim
                </button>
              )}
              
              {userHasClaimed && (
                <span className={styles["user-claimed-badge"]}>✅ You claimed this</span>
              )}

              {user && !userHasClaimed && isClaimed && (
                <span className={styles["claimed-badge"]}>✅ Claimed</span>
              )}

              {!user && isClaimed && (
                <span className={styles["claimed-badge"]}>✅ Claimed</span>
              )}

              {user && (
                <button 
                  className={`${styles["bookmark-btn"]} ${isBookmarkedByUser(project.id) ? styles["bookmarked"] : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookmarkToggle(project.id);
                  }}
                  disabled={bookmarksLoading || isClaimed}
                  title={isBookmarkedByUser(project.id) ? "Remove bookmark" : "Bookmark this project"}
                >
                  {bookmarksLoading ? '...' : isBookmarkedByUser(project.id) ? '★' : '☆'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })
  ) : (
    <div className={styles["no-results"]}>
      <p>No projects found matching your search.</p>
      <button 
        className={styles["explore-button"]}
        onClick={() => setSearchTerm('')}
      >
        Clear search
      </button>
    </div>
  )}
</div>
  </div>


          <div className={styles["right-tabs"]}>
            <div className={styles["side-tab"]}>
              <div className={styles["qa-header"]}>
                <h3>Community Q&A</h3>
                <p>Browse questions and answers from our community</p>
                {user ? (
                  <Link href="/qa" className={styles["view-all-button"]}>
                    View All Questions
                  </Link>
                ) : (
                  <button 
                    className={styles["view-all-button"]}
                    onClick={() => { window.location.href = googleLoginUrl; }}
                  >
                    Sign in to View All
                  </button>
                )}
              </div>

              {user && !isAsking && (
                <button 
                  className={styles["ask-button"]}
                  onClick={() => setIsAsking(true)}
                >
                  Ask Question
                </button>
              )}

              {isAsking && (
                <div className={styles["ask-container"]}>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className={styles["question-input"]}
                    rows={3}
                  />
                  <div className={styles["ask-actions"]}>
                    <button
                      onClick={handleAskQuestion}
                      disabled={!newQuestion.trim() || isGenerating}
                      className={styles["submit-question"]}
                    >
                      {isGenerating ? (
                        <>
                          <span className={styles["spinner"]}></span>
                          Posting Question...
                        </>
                      ) : (
                        'Submit Question'
                      )}
                    </button>
                    <button 
                      className={styles["cancel-button"]}
                      onClick={() => {
                        setIsAsking(false);
                        setNewQuestion('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!user && (
                <div className={styles["login-prompt"]}>
                  <p>Sign in to ask questions and participate in discussions</p>
                  <button 
                    className={styles["login-button"]}
                    onClick={() => { window.location.href = googleLoginUrl; }}
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className={styles["qa-list"]}>
                {topQuestions.length === 0 ? (
                  <div className={styles["no-questions"]}>
                    <p>No questions yet. Be the first to ask!</p>
                  </div>
                ) : (
                  topQuestions.map((qa) => (
                    qa && (
                      <div key={qa.id} className={`${styles["qa-item"]} ${qa.isEmergency ? styles.emergency : ''}`}>
                        <div className={styles["qa-question"]}>
                          <div className={styles["qa-meta"]}>
                            <div className={styles["author-info"]}>
                              <Image 
                                src={qa.author.picture || '/default-profile.png'} 
                                alt={qa.author.name || 'User'}
                                className={styles["author-avatar"]}
                                width={32}
                                height={32}
                                onError={(e) => {
                                  e.currentTarget.src = '/default-profile.png';
                                }}
                              />
                              <div className={styles["author-details"]}>
                                <span className={styles["qa-author"]}>{qa.author.name || 'Unknown User'}</span>
                                {qa.author.reputation !== undefined && (
                                  <span className={styles["author-reputation"]}>{qa.author.reputation} points</span>
                                )}
                              </div>
                            </div>
                            <div className={styles["question-actions"]}>
                              <span className={styles["qa-time"]}>{formatDate(qa.timestamp)}</span>
                              {qa.isEmergency && (
                                <span className={styles["emergency-badge"]}>🚨 Emergency</span>
                              )}
                              {user && user.id === qa.author.id && (
                                <div className={styles["question-controls"]}>
                                  <button 
                                    className={styles["emergency-button"]}
                                    onClick={() => handleToggleEmergency(qa.id)}
                                    title={qa.isEmergency ? "Remove emergency tag" : "Mark as emergency"}
                                  >
                                    {qa.isEmergency ? '🚨' : '⚠️'}
                                  </button>
                                  <button 
                                    className={styles["edit-button"]}
                                    onClick={() => handleEditQuestion(qa.id)}
                                    title="Edit question"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    className={styles["delete-button"]}
                                    onClick={() => handleDeleteQuestion(qa.id)}
                                    title="Delete question"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {editingQuestion === qa.id ? (
                            <div className={styles["edit-container"]}>
                              <textarea
                                value={editQuestionText}
                                onChange={(e) => setEditQuestionText(e.target.value)}
                                className={styles["edit-input"]}
                                rows={3}
                              />
                              <div className={styles["edit-actions"]}>
                                <button 
                                  className={styles["save-button"]}
                                  onClick={() => handleSaveEdit(qa.id)}
                                >
                                  Save
                                </button>
                                <button 
                                  className={styles["cancel-edit-button"]}
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <h4>{qa.question}</h4>
                          )}
                          
                          <div className={styles["qa-stats"]}>
                            <button 
                              className={styles["upvote-button"]}
                              onClick={() => handleUpvote(qa.id)}
                            >
                              ▲ {qa.upvotes || 0}
                            </button>
                            <button 
                              className={styles["answers-toggle"]}
                              onClick={() => handleToggleAnswers(qa.id)}
                            >
                              {qa.answers ? qa.answers.length : 0} answers
                            </button>
                            <span>{qa.views || 0} views</span>
                          </div>
                        </div>
                        
                        {(qa.showAnswers && qa.answers && qa.answers.length > 0) && (
                          <div className={styles["qa-answers"]}>
                            {qa.answers.map((answer) => (
                              <div key={answer.id} className={styles["qa-answer"]}>
                                <div className={styles["answer-meta"]}>
                                  <div className={styles["author-info"]}>
                                    <Image 
                                      src={answer.author.picture || '/default-profile.png'} 
                                      alt={answer.author.name || 'User'}
                                      className={styles["author-avatar"]}
                                      width={28}
                                      height={28}
                                      onError={(e) => {
                                        e.currentTarget.src = '/default-profile.png';
                                      }}
                                    />
                                    <div className={styles["author-details"]}>
                                      <span className={styles["answer-author"]}>
                                        {answer.author.name || 'Unknown User'}
                                      </span>
                                      {answer.author.reputation !== undefined && (
                                        <span className={styles["author-reputation"]}>{answer.author.reputation} points</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className={styles["answer-actions"]}>
                                    <span className={styles["answer-time"]}>
                                      {formatDate(answer.timestamp)}
                                    </span>
                                    <button 
                                      className={styles["upvote-button"]}
                                      onClick={() => handleUpvote(qa.id, answer.id)}
                                    >
                                      ▲ {answer.upvotes || 0}
                                    </button>
                                    {answer.isAccepted && (
                                      <span className={styles["accepted-badge"]}>✓ Accepted</span>
                                    )}
                                  </div>
                                </div>
                                <p>{answer.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {user && (
                          <div className={styles["reply-section"]}>
                            {replyingTo === qa.id ? (
                              <div className={styles["reply-form"]}>
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Write your answer..."
                                  className={styles["reply-input"]}
                                  rows={3}
                                />
                                <div className={styles["reply-actions"]}>
                                  <button 
                                    onClick={() => handleReply(qa.id)}
                                    disabled={!replyContent.trim()}
                                    className={styles["post-answer-button"]}
                                  >
                                    Post Answer
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                    className={styles["cancel-reply-button"]}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                className={styles["reply-button"]}
                                onClick={() => setReplyingTo(qa.id)}
                              >
                                Answer this question
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  ))
                )}
              </div>

              {qas.length > 3 && (
                <button 
                  className={styles["show-more-button"]}
                  onClick={() => setShowAllQA(!showAllQA)}
                >
                  {showAllQA ? 'Show Less' : `Show All ${qas.length} Questions`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className={styles.footer}>
        <div className={styles["footer-content"]}>
          <div className={styles["footer-links"]}>
            <Link href="/support" className={styles["footer-link"]}>Support</Link>
            <Link href="/terms" className={styles["footer-link"]}>Terms of Service</Link>
            <Link href="/privacy" className={styles["footer-link"]}>Privacy Policy</Link>
          </div>
          <div className={styles["footer-copyright"]}>
            © 2025 Project Pulse. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}