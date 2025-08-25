'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '../context/UserContext';
import Image from 'next/image';

export default function TermsOfService() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'account', title: 'Account Terms' },
    { id: 'usage', title: 'Acceptable Use' },
    { id: 'content', title: 'Content Policy' },
    { id: 'intellectual', title: 'Intellectual Property' },
    { id: 'termination', title: 'Termination' },
    { id: 'changes', title: 'Changes to Terms' }
  ];

  return (
    <div className="terms-container">
      {/* User Profile Section */}
      {user?.picture && (
        <div className="profile-section">
          <Image
            src={
              user.picture.startsWith('http')
                ? user.picture
                : `http://localhost/Google_signup/${user.picture}`
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
        <h1 className="main-title">Terms of Service</h1>
        <p className="intro-text">
          Please read these terms carefully before using Project Pulse. By using our platform, you agree to these terms.
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
        <Link href="/support" className="menu-link">Support</Link>
      </div>

      {/* Terms Content */}
      <div className="terms-content">
        <div className="terms-sidebar">
          <h3>Contents</h3>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <button 
                  className={`sidebar-link ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="terms-main">
          <div className="last-updated">
            <i className="fas fa-history"></i> Last updated: {new Date().toLocaleDateString()}
          </div>

          <section id="introduction" className="terms-section">
            <h2>1. Introduction</h2>
            <p>Welcome to Project Pulse! These Terms of Service govern your use of our platform and services.</p>
            <p>By accessing or using Project Pulse, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of the terms, you may not access our platform.</p>
          </section>

          <section id="account" className="terms-section">
            <h2>2. Account Terms</h2>
            <ul>
              <li>You must be at least 13 years old to use Project Pulse.</li>
              <li>You are responsible for maintaining the security of your account and password.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must not use Project Pulse for any illegal or unauthorized purpose.</li>
              <li>You must not share your account credentials with others.</li>
              <li>You must not create multiple accounts for disruptive or abusive purposes.</li>
            </ul>
          </section>

          <section id="usage" className="terms-section">
            <h2>3. Acceptable Use</h2>
            <p>While using Project Pulse, you agree not to:</p>
            <ul>
              <li>Use the platform for any unlawful purpose or to violate any laws.</li>
              <li>Harass, abuse, or harm another person or group.</li>
              <li>Send spam or unwanted messages to other users.</li>
              <li>Interfere with or disrupt the platform&apos;s security or functionality.</li>
              <li>Attempt to gain unauthorized access to any part of the platform.</li>
              <li>Use automated systems or software to extract data from the platform.</li>
              <li>Impersonate another user or person.</li>
            </ul>
            <p>Use the platform for educational and personal project planning purposes only.</p>
          </section>

          <section id="content" className="terms-section">
            <h2>4. Content Policy</h2>
            <p>You are responsible for the content you post on Project Pulse, including:</p>
            <ul>
              <li>Project ideas and descriptions</li>
              <li>Comments and feedback</li>
              <li>User profile information</li>
            </ul>
            <p>You agree not to post content that:</p>
            <ul>
              <li>Is illegal, pornographic, or offensive</li>
              <li>Infringes on any copyright, trademark, or intellectual property right</li>
              <li>Contains malicious code or viruses</li>
              <li>Includes personal information of others without consent</li>
              <li>Is spam or promotional material</li>
            </ul>
            <p>We reserve the right to remove any content that violates these guidelines.</p>
          </section>

          <section id="intellectual" className="terms-section">
            <h2>5. Intellectual Property</h2>
            <p>Project Pulse and its original content, features, and functionality are owned by Project Pulse and are protected by international copyright, trademark, and other intellectual property laws.</p>
            <p>You retain ownership of the content you create and share on Project Pulse. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of operating and improving our services.</p>
            <p>Respect the intellectual property of project ideas and resources provided. Do not claim others&apos; project ideas as your own.</p>
          </section>

          <section id="termination" className="terms-section">
            <h2>6. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <p>Upon termination, your right to use the platform will immediately cease. If you wish to terminate your account, you may simply discontinue using the platform.</p>
          </section>

          <section id="changes" className="terms-section">
            <h2>7. Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page.</p>
            <p>You are advised to review these Terms periodically for any changes. Continued use of Project Pulse after any modifications constitutes acceptance of the new Terms.</p>
          </section>

          <div className="terms-acceptance">
            <h3>Acceptance of Terms</h3>
            <p>By using Project Pulse, you signify your acceptance of these terms. If you do not agree to these terms, please do not use our platform.</p>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@projectpulse.com">support@projectpulse.com</a>.</p>
          </div>
        </div>
      </div>
 

      <style jsx>{`
        .terms-container {
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
        
        .menu-link {
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
        
        .menu-separator {
          color: #475569;
          font-weight: bold;
        }
        
        /* Terms Content */
        .terms-content {
          display: flex;
          gap: 2rem;
          background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
          border: 1px solid #475569;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        /* Sidebar */
        .terms-sidebar {
          flex: 0 0 250px;
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
          border: 1px solid #475569;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }
        
        .terms-sidebar h3 {
          color: #60a5fa;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #475569;
        }
        
        .terms-sidebar ul {
          list-style: none;
        }
        
        .terms-sidebar li {
          margin-bottom: 0.5rem;
        }
        
        .sidebar-link {
          background: none;
          border: none;
          color: #cbd5e1;
          text-align: left;
          padding: 0.5rem 0;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          border-radius: 6px;
          padding: 0.5rem;
        }
        
        .sidebar-link:hover {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
        }
        
        .sidebar-link.active {
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.2);
          border-left: 3px solid #60a5fa;
        }
        
        /* Main Content */
        .terms-main {
          flex: 1;
        }
        
        .last-updated {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          margin-bottom: 2rem;
          padding: 0.8rem 1rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          border: 1px solid #475569;
          font-size: 0.9rem;
        }
        
        .terms-section {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #475569;
        }
        
        .terms-section:last-of-type {
          border-bottom: none;
        }
        
        .terms-section h2 {
          color: #60a5fa;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        
        .terms-section p {
          color: #cbd5e1;
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        
        .terms-section ul {
          color: #cbd5e1;
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        
        .terms-section li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .terms-acceptance {
          padding: 2rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
          border: 1px solid #475569;
          margin-top: 2rem;
        }
        
        .terms-acceptance h3 {
          color: #60a5fa;
          margin-bottom: 1rem;
        }
        
        .terms-acceptance a {
          color: #60a5fa;
          text-decoration: none;
        }
        
        .terms-acceptance a:hover {
          text-decoration: underline;
        }
        
        /* Responsive Design */
        @media (max-width: 968px) {
          .terms-content {
            flex-direction: column;
          }
          
          .terms-sidebar {
            position: static;
            flex: 0 0 auto;
          }
        }
        
        @media (max-width: 768px) {
          .terms-container {
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
          
          .menu-link {
            width: 100%;
            text-align: center;
          }
          
          .menu-separator {
            display: none;
          }
          
          .terms-content {
            padding: 1.5rem;
          }
          
          .profile-section {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .terms-container {
            padding: 1rem;
          }
          
          .main-title {
            font-size: 1.8rem;
          }
          
          .terms-content {
            padding: 1.2rem;
          }
          
          .terms-sidebar {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}