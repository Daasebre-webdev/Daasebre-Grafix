'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '../context/UserContext';
import Image from 'next/image';

export default function PrivacyPolicy() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('introduction');

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'data-collection', title: 'Data Collection' },
    { id: 'data-usage', title: 'Data Usage' },
    { id: 'data-protection', title: 'Data Protection' },
    { id: 'cookies', title: 'Cookies & Tracking' },
    { id: 'rights', title: 'Your Rights' },
    { id: 'changes', title: 'Policy Changes' }
  ];

  return (
    <div className="privacy-container">
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
        <h1 className="main-title">Privacy Policy</h1>
        <p className="intro-text">
          At Project Pulse, we are committed to protecting your privacy and ensuring transparency about how we handle your data.
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

      {/* Privacy Content */}
      <div className="privacy-content">
        <div className="privacy-sidebar">
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

        <div className="privacy-main">
          <div className="last-updated">
            <i className="fas fa-history"></i> Last updated: {new Date().toLocaleDateString()}
          </div>

          <section id="introduction" className="privacy-section">
            <h2>1. Introduction</h2>
            <p>Welcome to Project Pulse! Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
            <p>By using Project Pulse, you consent to the data practices described in this policy. If you do not agree with the data practices described, you should not use our platform.</p>
            <div className="notice-box">
              <i className="fas fa-info-circle"></i>
              <p>We only collect the information necessary to provide personalized project recommendations and improve your experience. We do not sell or share your data with third parties for marketing purposes.</p>
            </div>
          </section>

          <section id="data-collection" className="privacy-section">
            <h2>2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, as well as information automatically collected when you use our services.</p>
            
            <h3>Personal Information</h3>
            <ul>
              <li><strong>Account Information:</strong> Your name, email address, and profile picture when you sign in with Google</li>
              <li><strong>Academic Profile:</strong> Your field of study, skills, interests, and academic preferences</li>
              <li><strong>Project Data:</strong> Projects you create, bookmark, or interact with</li>
            </ul>
            
            <h3>Automatically Collected Information</h3>
            <ul>
              <li><strong>Usage Data:</strong> How you interact with our platform, including pages visited and features used</li>
              <li><strong>Device Information:</strong> Browser type, device type, and operating system</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
            </ul>
          </section>

          <section id="data-usage" className="privacy-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul>
              <li><strong>Personalization:</strong> To provide personalized project suggestions based on your skills and interests</li>
              <li><strong>Service Delivery:</strong> To operate, maintain, and improve our platform</li>
              <li><strong>Communication:</strong> To send you important updates about our services</li>
              <li><strong>Analytics:</strong> To understand how users interact with our platform and improve user experience</li>
              <li><strong>Security:</strong> To protect against fraudulent or unauthorized activity</li>
            </ul>
            
            <div className="notice-box">
              <i className="fas fa-shield-alt"></i>
              <p>We process your data based on your consent and our legitimate interest in providing and improving our services.</p>
            </div>
          </section>

          <section id="data-protection" className="privacy-section">
            <h2>4. Data Protection & Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h3>Security Measures</h3>
            <ul>
              <li>Encryption of data in transit using SSL/TLS protocols</li>
              <li>Secure storage of user data with access controls</li>
              <li>Regular security assessments and monitoring</li>
              <li>Limited access to personal information to authorized personnel only</li>
            </ul>
            
            <p>While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security but we work hard to protect your data.</p>
          </section>

          <section id="cookies" className="privacy-section">
            <h2>5. Cookies & Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information.</p>
            
            <h3>Types of Cookies We Use</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the basic functionality of our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
            </ul>
            
            <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.</p>
          </section>

          <section id="rights" className="privacy-section">
            <h2>6. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Objection:</strong> Object to processing of your personal information</li>
              <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time where we rely on consent to process your information</li>
            </ul>
            
            <p>To exercise any of these rights, please contact us at <a href="mailto:support@projectpulse.com">support@projectpulse.com</a>.</p>
          </section>

          <section id="changes" className="privacy-section">
            <h2>7. Changes to This Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.</p>
            <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
          </section>

          <div className="contact-section">
            <h3>Contact Us</h3>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
            <div className="contact-details">
              <p><i className="fas fa-envelope"></i> Email: <a href="mailto:support@projectpulse.com">support@projectpulse.com</a></p>
              <p>We aim to respond to all privacy-related inquiries within 48 hours.</p>
            </div>
          </div>
        </div>
      </div>
  

      <style jsx>{`
        .privacy-container {
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
        
        /* Privacy Content */
        .privacy-content {
          display: flex;
          gap: 2rem;
          background: linear-gradient(145deg, #1e293b 0%, #334155 100%);
          border: 1px solid #475569;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        
        /* Sidebar */
        .privacy-sidebar {
          flex: 0 0 250px;
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
          border: 1px solid #475569;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }
        
        .privacy-sidebar h3 {
          color: #60a5fa;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #475569;
        }
        
        .privacy-sidebar ul {
          list-style: none;
        }
        
        .privacy-sidebar li {
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
        .privacy-main {
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
        
        .privacy-section {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #475569;
        }
        
        .privacy-section:last-of-type {
          border-bottom: none;
        }
        
        .privacy-section h2 {
          color: #60a5fa;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        
        .privacy-section h3 {
          color: #cbd5e1;
          margin: 1.5rem 0 1rem;
          font-size: 1.2rem;
        }
        
        .privacy-section p {
          color: #cbd5e1;
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        
        .privacy-section ul {
          color: #cbd5e1;
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        
        .privacy-section li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .privacy-section li strong {
          color: #f1f5f9;
        }
        
        .notice-box {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          padding: 1.2rem;
          background: rgba(96, 165, 250, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(96, 165, 250, 0.2);
          margin: 1.5rem 0;
        }
        
        .notice-box i {
          color: #60a5fa;
          font-size: 1.2rem;
          margin-top: 0.2rem;
        }
        
        .notice-box p {
          margin: 0;
          color: #cbd5e1;
        }
        
        .contact-section {
          padding: 2rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
          border: 1px solid #475569;
          margin-top: 2rem;
        }
        
        .contact-section h3 {
          color: #60a5fa;
          margin-bottom: 1rem;
        }
        
        .contact-details p {
          margin-bottom: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .contact-details a {
          color: #60a5fa;
          text-decoration: none;
        }
        
        .contact-details a:hover {
          text-decoration: underline;
        }
        
        /* Responsive Design */
        @media (max-width: 968px) {
          .privacy-content {
            flex-direction: column;
          }
          
          .privacy-sidebar {
            position: static;
            flex: 0 0 auto;
          }
        }
        
        @media (max-width: 768px) {
          .privacy-container {
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
          
          .privacy-content {
            padding: 1.5rem;
          }
          
          .profile-section {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .privacy-container {
            padding: 1rem;
          }
          
          .main-title {
            font-size: 1.8rem;
          }
          
          .privacy-content {
            padding: 1.2rem;
          }
          
          .privacy-sidebar {
            padding: 1rem;
          }
          
          .privacy-section h2 {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}