'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '../context/UserContext';
import Image from 'next/image';

export default function Support() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('contact');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the message to your backend here
    console.log('Support message:', message);
    setIsSubmitted(true);
    setMessage('');
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };

  const faqItems = [
    {
      question: "How do I bookmark a project?",
      answer: "Click the bookmark icon (☆) on any project card to save it to your bookmarks. You can access all your bookmarked projects from the Bookmarks page."
    },
    {
      question: "Can I generate custom projects?",
      answer: "Yes! Use our AI Generator to create personalized project ideas based on your skills, interests, and preferred technologies."
    },
    {
      question: "How do I update my profile information?",
      answer: "Your profile information is managed through your Google account. Any changes made there will automatically reflect in Project Pulse."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Project Pulse is a progressive web app, which means you can add it to your home screen for an app-like experience on mobile devices."
    },
    {
      question: "How often are new projects added?",
      answer: "We regularly add new projects across all categories. Additionally, our AI generates new project ideas continuously based on user requests."
    }
  ];

  return (
    <div className="support-container">
      {/* User Profile Section */}
      {user?.picture && (
        <div className="profile-section">
          <Image
            src={
              user.picture.startsWith('http')
                ? user.picture
                : `https://pulse.great-site.net/Google_signup/${user.picture}`
            }
            alt="User profile"
            className="user-avatar"
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

      {/* Header Section */}
      <div className="header">
        <h1 className="main-title">Support Center</h1>
        <p className="intro-text">
          Get help with Project Pulse, find answers to common questions, or contact our support team.
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="menu">
        <Link href="/dashboard" className="menu-link">Dashboard</Link>
        <span className="menu-separator">|</span>
        <Link href="/ai" className="menu-link">AI Generator</Link>
        <span className="menu-separator">|</span>
        <Link href="/bookmarks" className="menu-link">Bookmarks</Link>
        <span className="menu-separator">|</span>
        <Link href="/support" className="menu-link-active">Support</Link>
      </div>

      {/* Support Content */}
      <div className="support-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <i className="fas fa-envelope"></i> Contact Support
          </button>
          <button 
            className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <i className="fas fa-question-circle"></i> FAQ
          </button>
          <button 
            className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <i className="fas fa-book"></i> Resources
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'contact' && (
            <div className="tab-panel">
              <h2>Contact Our Support Team</h2>
              <p>Have a question or need help with Project Pulse? Send us a message and we&apos;ll get back to you as soon as possible.</p>
              
              {isSubmitted ? (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  <p>Thank you for your message! We&apos;ll respond within 24 hours.</p>
                </div>
              ) : (
                <form className="support-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      value={user?.name || ''}
                      disabled
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <select id="subject" required>
                      <option value="">Select a subject</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Help</option>
                      <option value="feature">Feature Request</option>
                      <option value="feedback">General Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea 
                      id="message" 
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your issue or question in detail..."
                      required
                    ></textarea>
                  </div>
                  
                  <button type="submit" className="submit-button">
                    <i className="fas fa-paper-plane"></i> Send Message
                  </button>
                </form>
              )}
              
              <div className="direct-contact">
                <h3>Other Ways to Reach Us</h3>
                <p>
                  <i className="fas fa-envelope"></i> Email: 
                  <a href="mailto:support@projectpulse.com">support@projectpulse.com</a>
                </p>
                <p>We aim to respond to all inquiries within 24 hours on business days.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'faq' && (
            <div className="tab-panel">
              <h2>Frequently Asked Questions</h2>
              <p>Find answers to common questions about Project Pulse.</p>
              
              <div className="faq-list">
                {faqItems.map((item, index) => (
                  <div key={index} className="faq-item">
                    <button 
                      className="faq-question"
                      onClick={() => {
                        const element = document.getElementById(`faq-answer-${index}`);
                        if (element) {
                          element.classList.toggle('active');
                        }
                      }}
                    >
                      {item.question}
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    <div id={`faq-answer-${index}`} className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'resources' && (
            <div className="tab-panel">
              <h2>Helpful Resources</h2>
              <p>Explore these resources to get the most out of Project Pulse.</p>
              
              <div className="resources-grid">
                <div className="resource-card">
                  <div className="resource-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <h3>User Guide</h3>
                  <p>Comprehensive guide to all Project Pulse features and how to use them effectively.</p>
                  <button className="resource-button">View Guide</button>
                </div>
                
                <div className="resource-card">
                  <div className="resource-icon">
                    <i className="fas fa-video"></i>
                  </div>
                  <h3>Video Tutorials</h3>
                  <p>Step-by-step video tutorials showing how to use Project Pulse&apos;s key features.</p>
                  <button className="resource-button">Watch Videos</button>
                </div>
                
                <div className="resource-card">
                  <div className="resource-icon">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <h3>Tips & Tricks</h3>
                  <p>Discover pro tips and hidden features to enhance your Project Pulse experience.</p>
                  <button className="resource-button">Learn More</button>
                </div>
                
                <div className="resource-card">
                  <div className="resource-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <h3>Community Forum</h3>
                  <p>Join our community of users to share ideas, ask questions, and get inspired.</p>
                  <button className="resource-button">Join Forum</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  

      <style jsx>{`
        .support-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%);
          color: #f1f5f9;
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Profile Section */
        .profile-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
          border-radius: 12px;
          border: 1px solid #475569;
          margin-bottom: 2rem;
          max-width: 400px;
        }
        
        .user-avatar {
          border-radius: 50%;
          border: 2px solid #60a5fa;
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
        }
        
        .profile-section div p:first-child {
          font-weight: 600;
          color: #60a5fa;
          margin-bottom: 0.25rem;
        }
        
        .profile-section div p:last-child {
          color: #94a3b8;
          font-size: 0.9rem;
        }
        
        /* Header Section */
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .main-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }
        
        .intro-text {
          color: #cbd5e1;
          font-size: 1.1rem;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }
        
        /* Navigation Menu */
        .menu {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
          border: 1px solid #475569;
        }
        
        .menu-link, .menu-link-active {
          color: #cbd5e1;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .menu-link:hover {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
        }
        
        .menu-link-active {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.2);
          border: 1px solid rgba(96, 165, 250, 0.3);
        }
        
        .menu-separator {
          color: #475569;
          font-weight: bold;
        }
        
        /* Support Content */
        .support-content {
          background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
          border: 1px solid #475569;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #475569;
          margin-bottom: 2rem;
        }
        
        .tab-button {
          background: none;
          border: none;
          padding: 1rem 1.5rem;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          border-bottom: 2px solid transparent;
        }
        
        .tab-button:hover {
          color: #60a5fa;
        }
        
        .tab-button.active {
          color: #60a5fa;
          border-bottom: 2px solid #60a5fa;
        }
        
        .tab-button i {
          margin-right: 0.5rem;
        }
        
        /* Tab Content */
        .tab-panel h2 {
          color: #60a5fa;
          margin-bottom: 1rem;
        }
        
        .tab-panel > p {
          color: #cbd5e1;
          margin-bottom: 2rem;
        }
        
        /* Support Form */
        .support-form {
          margin-bottom: 2rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #cbd5e1;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid #475569;
          border-radius: 8px;
          background: rgba(30, 41, 59, 0.9);
          color: #f1f5f9;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
        }
        
        .form-group input:disabled,
        .form-group select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .submit-button {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
        }
        
        /* Success Message */
        .success-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.2);
          border-radius: 8px;
          color: #4caf50;
          margin-bottom: 2rem;
        }
        
        .success-message i {
          font-size: 1.2rem;
        }
        
        /* Direct Contact */
        .direct-contact {
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          border: 1px solid #475569;
        }
        
        .direct-contact h3 {
          color: #60a5fa;
          margin-bottom: 1rem;
        }
        
        .direct-contact p {
          color: #cbd5e1;
          margin-bottom: 0.5rem;
        }
        
        .direct-contact a {
          color: #60a5fa;
          text-decoration: none;
          margin-left: 0.5rem;
        }
        
        .direct-contact a:hover {
          text-decoration: underline;
        }
        
        .direct-contact i {
          margin-right: 0.5rem;
          color: #60a5fa;
        }
        
        /* FAQ */
        .faq-list {
          margin-top: 2rem;
        }
        
        .faq-item {
          margin-bottom: 1rem;
          border: 1px solid #475569;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .faq-question {
          width: 100%;
          padding: 1rem 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border: none;
          color: #f1f5f9;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
        }
        
        .faq-question:hover {
          background: rgba(30, 41, 59, 0.7);
        }
        
        .faq-answer {
          padding: 0;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s ease;
          background: rgba(30, 41, 59, 0.3);
        }
        
        .faq-answer.active {
          padding: 1rem 1.5rem;
          max-height: 300px;
        }
        
        .faq-answer p {
          color: #cbd5e1;
          line-height: 1.6;
        }
        
        /* Resources */
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        .resource-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #475569;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .resource-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        
        .resource-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        
        .resource-icon i {
          font-size: 1.5rem;
          color: white;
        }
        
        .resource-card h3 {
          color: #60a5fa;
          margin-bottom: 1rem;
        }
        
        .resource-card p {
          color: #cbd5e1;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        
        .resource-button {
          padding: 0.7rem 1.5rem;
          background: rgba(96, 165, 250, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.3);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .resource-button:hover {
          background: rgba(96, 165, 250, 0.2);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .support-container {
            padding: 1.5rem;
          }
          
          .main-title {
            font-size: 2rem;
          }
          
          .intro-text {
            font-size: 1rem;
          }
          
          .menu {
            flex-direction: column;
            gap: 0.8rem;
          }
          
          .menu-link, .menu-link-active {
            width: 100%;
            text-align: center;
          }
          
          .menu-separator {
            display: none;
          }
          
          .support-content {
            padding: 1.5rem;
          }
          
          .tab-navigation {
            flex-direction: column;
          }
          
          .tab-button {
            text-align: left;
            border-bottom: 1px solid #475569;
          }
          
          .tab-button.active {
            border-bottom: 1px solid #475569;
            border-left: 2px solid #60a5fa;
          }
          
          .resources-grid {
            grid-template-columns: 1fr;
          }
          
          .profile-section {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .support-container {
            padding: 1rem;
          }
          
          .main-title {
            font-size: 1.8rem;
          }
          
          .support-content {
            padding: 1.2rem;
          }
          
          .form-group input,
          .form-group select,
          .form-group textarea {
            padding: 0.7rem 0.9rem;
          }
          
          .submit-button {
            padding: 0.9rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}