'use client'

import React from 'react'
import Swal, { SweetAlertResult } from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const termsText = (
  <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>Terms of Service</h2>
    
    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>1. Introduction</h3>
      <p style={{ marginBottom: '10px' }}>Welcome to Project Pulse! These Terms of Service govern your use of our platform and services.</p>
      <p>By accessing or using Project Pulse, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of the terms, you may not access our platform.</p>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>2. Account Terms</h3>
      <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '10px' }}>
        <li>You must be at least 13 years old to use Project Pulse.</li>
        <li>You are responsible for maintaining the security of your account and password.</li>
        <li>You are responsible for all activities that occur under your account.</li>
        <li>You must not use Project Pulse for any illegal or unauthorized purpose.</li>
        <li>You must not share your account credentials with others.</li>
        <li>You must not create multiple accounts for disruptive or abusive purposes.</li>
      </ul>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>3. Acceptable Use</h3>
      <p style={{ marginBottom: '10px' }}>While using Project Pulse, you agree not to:</p>
      <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '10px' }}>
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

    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>4. Content Policy</h3>
      <p style={{ marginBottom: '10px' }}>You are responsible for the content you post on Project Pulse, including:</p>
      <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '10px' }}>
        <li>Project ideas and descriptions</li>
        <li>Comments and feedback</li>
        <li>User profile information</li>
      </ul>
      <p style={{ marginBottom: '10px' }}>You agree not to post content that:</p>
      <ul style={{ listStyle: 'disc', paddingLeft: '20px', marginBottom: '10px' }}>
        <li>Is illegal, pornographic, or offensive</li>
        <li>Infringes on any copyright, trademark, or intellectual property right</li>
        <li>Contains malicious code or viruses</li>
        <li>Includes personal information of others without consent</li>
        <li>Is spam or promotional material</li>
      </ul>
      <p>We reserve the right to remove any content that violates these guidelines.</p>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>5. Intellectual Property</h3>
      <p style={{ marginBottom: '10px' }}>Project Pulse and its original content, features, and functionality are owned by Project Pulse and are protected by international copyright, trademark, and other intellectual property laws.</p>
      <p style={{ marginBottom: '10px' }}>You retain ownership of the content you create and share on Project Pulse. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of operating and improving our services.</p>
      <p>Respect the intellectual property of project ideas and resources provided. Do not claim others&apos; project ideas as your own.</p>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>6. Termination</h3>
      <p style={{ marginBottom: '10px' }}>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      <p>Upon termination, your right to use the platform will immediately cease. If you wish to terminate your account, you may simply discontinue using the platform.</p>
    </section>

    <section style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>7. Changes to Terms</h3>
      <p style={{ marginBottom: '10px' }}>We reserve the right to update these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page.</p>
      <p>You are advised to review these Terms periodically for any changes. Continued use of Project Pulse after any modifications constitutes acceptance of the new Terms.</p>
    </section>

    <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
      <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#374151' }}>Acceptance of Terms</h4>
      <p style={{ margin: 0 }}>By using Project Pulse, you signify your acceptance of these terms. If you do not agree to these terms, please do not use our platform.</p>
    </div>
  </div>
)

export default function TermsPopupButton() {
  const handleClick = () => {
    MySwal.fire({
      title: '<strong style="font-size: 24px; color: #1f2937;">Terms of Service</strong>',
      html: termsText,
      icon: 'info',
      confirmButtonText: 'View Full Terms Page',
      confirmButtonColor: '#4f46e5',
      showCancelButton: true,
      cancelButtonText: 'Close',
      width: '800px',
      customClass: {
        popup: 'rounded-lg shadow-xl',
        confirmButton: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white',
        cancelButton: 'px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md text-gray-800'
      },
      showCloseButton: true,
      scrollbarPadding: false
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        window.location.href = '/terms'
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-800 underline text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
    >
      View Terms & Conditions
    </button>
  )
}