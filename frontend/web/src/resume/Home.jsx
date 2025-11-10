import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../layout/Navbar.jsx';
import Footer from '../layout/Footer.jsx';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div 
        className="fixed inset-0 z-0 animate-[pan_60s_linear_infinite]"
        style={{
          backgroundImage: 'url(/backgroundHome.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
          <div className={`text-center max-w-5xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="ResumeVault Logo" 
                  className="w-48 h-48 md:w-64 md:h-64 animate-bounce drop-shadow-2xl"
                />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-orange-300 via-yellow-300 to-red-300 text-transparent bg-clip-text drop-shadow-[0_4px_20px_rgba(255,165,0,0.8)]">
              ResumeVault
            </h1>
            
            <p className="text-2xl md:text-4xl font-bold mb-8 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
              Own Your Career Data, Earn From Every View
            </p>
            
            <p className="text-xl md:text-2xl mb-12 text-white max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [text-shadow:_1px_1px_3px_rgb(0_0_0_/_90%)] leading-relaxed">
              A Web3 decentralized job platform where job seekers control their encrypted resumes and earn micropayments when recruiters unlock them.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/resume/create">
                <button className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2">
                  Create Your Resume
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>
              <Link to="/resumes/browse">
                <button className="px-8 py-4 text-lg font-bold bg-white/90 hover:bg-white text-gray-900 rounded-lg shadow-xl transform hover:scale-105 transition-all border-2 border-white">
                  Browse Talent
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border-4 border-yellow-400 p-8 md:p-12 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900">The Problem</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚨</span>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    <span className="font-bold text-red-600">Privacy Leakage:</span> Traditional platforms sell your resume data without consent
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📞</span>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    <span className="font-bold text-red-600">Recruiter Spam:</span> Endless calls and messages from unqualified recruiters
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔒</span>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    <span className="font-bold text-red-600">Platform Monopoly:</span> Your career data is trapped and monetized by platforms
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💸</span>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    <span className="font-bold text-red-600">Zero Value:</span> You create the value, but get nothing when recruiters view your profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-2xl border-4 border-orange-500 p-8 md:p-12 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <svg className="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-600 to-red-600 text-transparent bg-clip-text">
                  ResumeVault Solution
                </h2>
              </div>
              <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-6">
                A <span className="font-bold text-orange-600">Web3-powered platform</span> where you truly own your career data.
              </p>
              <div className="space-y-4">
                <div className="bg-white/80 rounded-lg p-6 border-2 border-orange-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🔐</span>
                    <p className="text-2xl font-bold text-orange-700">Encrypted Storage</p>
                  </div>
                  <p className="text-lg text-gray-700 ml-12">
                    Your resume is encrypted and stored on IPFS. Only you control access.
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-6 border-2 border-orange-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">💰</span>
                    <p className="text-2xl font-bold text-orange-700">Pay-to-View with x402</p>
                  </div>
                  <p className="text-lg text-gray-700 ml-12">
                    Recruiters pay micropayments directly to your wallet to unlock your full resume.
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-6 border-2 border-orange-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🤖</span>
                    <p className="text-2xl font-bold text-orange-700">AI-Powered Matching</p>
                  </div>
                  <p className="text-lg text-gray-700 ml-12">
                    AI Agent analyzes skills and generates anonymous summaries for discovery.
                  </p>
                </div>
                <div className="bg-white/80 rounded-lg p-6 border-2 border-orange-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🛡️</span>
                    <p className="text-2xl font-bold text-orange-700">Anti-Spam Protection</p>
                  </div>
                  <p className="text-lg text-gray-700 ml-12">
                    Payment barrier and reputation system prevent low-quality spam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-2xl border-4 border-yellow-500 p-8 md:p-12 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <svg className="w-12 h-12 text-yellow-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 text-transparent bg-clip-text">
                  How It Works
                </h2>
              </div>
              <div className="space-y-6">
                <div className="bg-white/80 rounded-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-black text-yellow-600">1</span>
                    <div>
                      <p className="text-xl font-bold text-gray-900 mb-2">Job Seeker Uploads Encrypted Resume</p>
                      <p className="text-lg text-gray-700">Connect wallet, upload resume, set your unlock price. AI extracts skill tags.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-black text-orange-600">2</span>
                    <div>
                      <p className="text-xl font-bold text-gray-900 mb-2">Recruiters Browse Anonymous Profiles</p>
                      <p className="text-lg text-gray-700">See skill summaries and tags without personal information.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-black text-red-600">3</span>
                    <div>
                      <p className="text-xl font-bold text-gray-900 mb-2">Pay to Unlock with x402</p>
                      <p className="text-lg text-gray-700">Recruiters pay micropayment via x402 to unlock full resume details.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-black text-green-600">4</span>
                    <div>
                      <p className="text-xl font-bold text-gray-900 mb-2">Automatic Decryption & Access</p>
                      <p className="text-lg text-gray-700">Payment goes directly to job seeker's wallet. Resume is decrypted instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-2xl border-4 border-red-500 p-8 md:p-12 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-red-600 to-orange-600 text-transparent bg-clip-text">
                  Who Benefits?
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white/90 rounded-lg p-6 border-2 border-red-300">
                  <h3 className="text-2xl font-bold text-red-700 mb-3 flex items-center gap-2">
                    <span>👔</span> Job Seekers
                  </h3>
                  <ul className="space-y-2 text-lg text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Own your data:</strong> Full control over who sees your resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Earn income:</strong> Get paid every time someone unlocks your profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Privacy protected:</strong> Encrypted storage prevents data leaks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Reduce spam:</strong> Payment barrier filters serious recruiters</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/90 rounded-lg p-6 border-2 border-orange-300">
                  <h3 className="text-2xl font-bold text-orange-700 mb-3 flex items-center gap-2">
                    <span>🎯</span> Recruiters & Companies
                  </h3>
                  <ul className="space-y-2 text-lg text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Quality talent:</strong> Access pre-screened, serious candidates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Efficient search:</strong> AI-powered skill matching saves time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Fair pricing:</strong> Pay only for profiles you want to see</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Direct connection:</strong> No middleman platform fees</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-900 to-red-900 rounded-2xl shadow-2xl border-4 border-yellow-400 p-8 md:p-12 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6 justify-center">
                <svg className="w-16 h-16 text-yellow-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h2 className="text-4xl md:text-5xl font-black text-yellow-400">
                  Powered By Web3
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-6 border-2 border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🔐</span>
                    <h3 className="text-2xl font-bold text-yellow-300">Encryption</h3>
                  </div>
                  <p className="text-white/90 text-lg">
                    IPFS/Arweave + AES/ZK for secure, decentralized storage
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-6 border-2 border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">👛</span>
                    <h3 className="text-2xl font-bold text-yellow-300">Wallet Auth</h3>
                  </div>
                  <p className="text-white/90 text-lg">
                    Phantom/Backpack wallet login for trustless identity
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-6 border-2 border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">💳</span>
                    <h3 className="text-2xl font-bold text-yellow-300">x402 Payments</h3>
                  </div>
                  <p className="text-white/90 text-lg">
                    Seamless micropayment infrastructure for content unlocking
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-6 border-2 border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🤖</span>
                    <h3 className="text-2xl font-bold text-yellow-300">AI Agents</h3>
                  </div>
                  <p className="text-white/90 text-lg">
                    OpenAI Embeddings for resume parsing & skill matching
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <img 
                src="/logo.png" 
                alt="ResumeVault Logo" 
                className="w-32 h-32 md:w-40 md:h-40 animate-bounce drop-shadow-2xl"
              />
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] [text-shadow:_3px_3px_6px_rgb(0_0_0_/_90%)]">
              Take Control of Your Career Data
            </h2>
            <p className="text-2xl md:text-3xl mb-12 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_90%)]">
              Join the Web3 revolution in recruitment
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/resume/create">
                <button className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg shadow-2xl transform hover:scale-110 transition-all flex items-center gap-3">
                  Upload Resume & Earn
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
              </Link>
              <Link to="/resumes/browse">
                <button className="px-12 py-6 text-xl font-bold bg-white/95 hover:bg-white text-gray-900 rounded-lg shadow-2xl transform hover:scale-110 transition-all border-2 border-white flex items-center gap-3">
                  Find Talent
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
