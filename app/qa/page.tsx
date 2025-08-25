// app/qa/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/app/context/UserContext';
import { useRouter } from 'next/navigation';
import styles from './qa.module.css';

interface QAItem {
  id: string;
  question: string;
  answers: Answer[];
  author: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  timestamp: string;
  tags: string[];
  upvotes: number;
  views: number;
}

interface Answer {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  timestamp: string;
  upvotes: number;
  isAccepted: boolean;
}

export default function QAPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [qas, setQas] = useState<QAItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionTags, setNewQuestionTags] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load Q&A data
  useEffect(() => {
    if (user) {
      const savedQAs = localStorage.getItem('communityQAs');
      if (savedQAs) {
        try {
          setQas(JSON.parse(savedQAs));
        } catch (error) {
          console.error('Failed to parse Q&A data:', error);
        }
      }
    }
  }, [user]);

  const handleAskQuestion = () => {
    if (!newQuestion.trim() || !user) return;
    
    const newQA: QAItem = {
      id: Date.now().toString(),
      question: newQuestion,
      answers: [],
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture
      },
      timestamp: new Date().toISOString(),
      tags: newQuestionTags.split(',').map(tag => tag.trim()).filter(Boolean),
      upvotes: 0,
      views: 0
    };
    
    const updatedQAs = [newQA, ...qas];
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
    setNewQuestion('');
    setNewQuestionTags('');
    setIsAsking(false);
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
            picture: user.picture
          },
          timestamp: new Date().toISOString(),
          upvotes: 0,
          isAccepted: false
        };
        
        // Notify question author (in a real app, this would be an email/notification)
        if (qa.author.id !== user.id) {
          console.log(`Notifying ${qa.author.name} about new answer to their question`);
          // Here you would add actual notification logic
        }
        
        return {
          ...qa,
          answers: [...qa.answers, newAnswer]
        };
      }
      return qa;
    });
    
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleUpvote = (questionId: string, answerId?: string) => {
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        if (!answerId) {
          // Upvote question
          return { ...qa, upvotes: qa.upvotes + 1 };
        } else {
          // Upvote answer
          const updatedAnswers = qa.answers.map(answer => {
            if (answer.id === answerId) {
              return { ...answer, upvotes: answer.upvotes + 1 };
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

  const handleAcceptAnswer = (questionId: string, answerId: string) => {
    const updatedQAs = qas.map(qa => {
      if (qa.id === questionId) {
        const updatedAnswers = qa.answers.map(answer => {
          if (answer.id === answerId) {
            return { ...answer, isAccepted: true };
          }
          return { ...answer, isAccepted: false }; // Unaccept other answers
        });
        return { ...qa, answers: updatedAnswers };
      }
      return qa;
    });
    
    setQas(updatedQAs);
    localStorage.setItem('communityQAs', JSON.stringify(updatedQAs));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Filter questions based on active tab and search term
  const filteredQuestions = qas.filter(qa => {
    const matchesSearch = qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qa.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'my-questions') return matchesSearch && qa.author.id === user?.id;
    if (activeTab === 'my-answers') {
      return matchesSearch && qa.answers.some(answer => answer.author.id === user?.id);
    }
    if (activeTab === 'unanswered') return matchesSearch && qa.answers.length === 0;
    return matchesSearch;
  });

  if (authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Community Q&A</h1>
        <p>Ask questions and get help from the community</p>
        
        <div className={styles.actions}>
          <div className={styles.search}>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className={styles.askButton}
            onClick={() => setIsAsking(true)}
          >
            Ask Question
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={activeTab === 'all' ? styles.activeTab : ''}
          onClick={() => setActiveTab('all')}
        >
          All Questions
        </button>
        <button 
          className={activeTab === 'my-questions' ? styles.activeTab : ''}
          onClick={() => setActiveTab('my-questions')}
        >
          My Questions
        </button>
        <button 
          className={activeTab === 'my-answers' ? styles.activeTab : ''}
          onClick={() => setActiveTab('my-answers')}
        >
          My Answers
        </button>
        <button 
          className={activeTab === 'unanswered' ? styles.activeTab : ''}
          onClick={() => setActiveTab('unanswered')}
        >
          Unanswered
        </button>
      </div>

      {isAsking && (
        <div className={styles.askModal}>
          <div className={styles.askForm}>
            <h2>Ask a Question</h2>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              rows={5}
            />
            <input
              type="text"
              value={newQuestionTags}
              onChange={(e) => setNewQuestionTags(e.target.value)}
              placeholder="Tags (comma separated, e.g., javascript, react, nextjs)"
            />
            <div className={styles.formActions}>
              <button onClick={handleAskQuestion}>Post Question</button>
              <button onClick={() => setIsAsking(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.questionsList}>
        {filteredQuestions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions found.</p>
            {activeTab === 'unanswered' && (
              <p>Be the first to ask a question!</p>
            )}
          </div>
        ) : (
          filteredQuestions.map(qa => (
            <div key={qa.id} className={styles.question}>
              <div className={styles.questionHeader}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{qa.author.name}</span>
                  <span className={styles.authorEmail}>{qa.author.email}</span>
                </div>
                <span className={styles.timestamp}>{formatDate(qa.timestamp)}</span>
              </div>
              
              <h3>{qa.question}</h3>
              
              <div className={styles.tags}>
                {qa.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              
              <div className={styles.stats}>
                <button 
                  className={styles.upvoteButton}
                  onClick={() => handleUpvote(qa.id)}
                >
                  ▲ {qa.upvotes}
                </button>
                <span>{qa.answers.length} answers</span>
                <span>{qa.views} views</span>
              </div>
              
              <div className={styles.answers}>
                {qa.answers.map(answer => (
                  <div key={answer.id} className={styles.answer}>
                    <div className={styles.answerHeader}>
                      <div className={styles.authorInfo}>
                        <span className={styles.authorName}>{answer.author.name}</span>
                        <span className={styles.authorEmail}>{answer.author.email}</span>
                      </div>
                      <span className={styles.timestamp}>{formatDate(answer.timestamp)}</span>
                      {answer.isAccepted && (
                        <span className={styles.accepted}>✓ Accepted</span>
                      )}
                    </div>
                    <p>{answer.content}</p>
                    <div className={styles.answerActions}>
                      <button 
                        className={styles.upvoteButton}
                        onClick={() => handleUpvote(qa.id, answer.id)}
                      >
                        ▲ {answer.upvotes}
                      </button>
                      {qa.author.id === user.id && (
                        <button 
                          className={answer.isAccepted ? styles.acceptedButton : styles.acceptButton}
                          onClick={() => handleAcceptAnswer(qa.id, answer.id)}
                        >
                          {answer.isAccepted ? 'Accepted' : 'Mark as Accepted'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {replyingTo === qa.id ? (
                <div className={styles.replyForm}>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your answer..."
                    rows={3}
                  />
                  <div className={styles.replyActions}>
                    <button onClick={() => handleReply(qa.id)}>Post Answer</button>
                    <button onClick={() => setReplyingTo(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button 
                  className={styles.replyButton}
                  onClick={() => setReplyingTo(qa.id)}
                >
                  Answer this question
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}