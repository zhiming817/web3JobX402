import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import { 
  loadUserSubscriptions as loadUserSubscriptionsHandler,
  loadResumeSummaries as loadResumeSummariesHandler,
  handleUnlock as handleUnlockHandler,
  handleViewResume as handleViewResumeHandler,
  handleDecryptResume as handleDecryptResumeHandler,
} from './resumeBrowseHandlers';

export default function ResumeBrowse() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Decryption related state
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptKey, setDecryptKey] = useState('');
  
  // Subscription related state
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: '',
    salary: '',
  });

  // Load resume list
  useEffect(() => {
    loadResumeSummaries();
  }, []);

  // Load user subscriptions
  useEffect(() => {
    if (connected && publicKey) {
      loadUserSubscriptions();
    }
  }, [connected, publicKey]);

  const loadUserSubscriptions = async () => {
    try {
      const subscriptions = await loadUserSubscriptionsHandler(suiClient, publicKey);
      setUserSubscriptions(subscriptions);
    } catch (err) {
      console.error('❌ Failed to load subscription list:', err);
    }
  };

  const loadResumeSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const formattedResumes = await loadResumeSummariesHandler();
      setResumes(formattedResumes);
    } catch (err) {
      console.error('Failed to load resume list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (resumeId) => {
    await handleUnlockHandler({
      resumeId,
      resumes,
      userSubscriptions,
      connected,
      publicKey,
      suiClient,
      signAndExecute,
      setIsPurchasing,
      setResumes,
      loadUserSubscriptionsCallback: loadUserSubscriptions,
      handleViewResumeCallback: handleViewResume,
    });
  };

  // View resume (after unlock)
  const handleViewResume = async (resume) => {
    await handleViewResumeHandler(resume, {
      setSelectedResume,
      setShowDecryptModal,
      setDecryptedData,
      setDecryptKey,
      setError,
      handleDecryptResumeCallback: handleDecryptResume,
    });
  };

  // Decrypt resume content
  const handleDecryptResume = async (resume) => {
    await handleDecryptResumeHandler({
      resume,
      currentAccount,
      suiClient,
      signPersonalMessage,
      userSubscriptions,
      resumes,
      decryptKey,
      setIsDecrypting,
      setError,
      setDecryptedData,
      setResumes,
    });
  };

    // Filter resumes
  const filteredResumes = resumes.filter(resume => {
    if (filters.keyword && !resume.name.includes(filters.keyword) && !resume.title.includes(filters.keyword)) {
      return false;
    }
    if (filters.location && !resume.location.includes(filters.location)) {
      return false;
    }
    if (filters.experience && resume.experience !== filters.experience) {
      return false;
    }
    return true;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume list...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Failed</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadResumeSummaries}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Resumes</h1>
          <p className="text-gray-600">Discover excellent talent, use micro Sui payments to unlock full resumes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keyword
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Search position, skills..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All</option>
                <option value="上海">Shanghai</option>
                <option value="北京">Beijing</option>
                <option value="深圳">Shenzhen</option>
                <option value="杭州">Hangzhou</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience
              </label>
              <select
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All</option>
                <option value="1-3年">1-3 years</option>
                <option value="3-5年">3-5 years</option>
                <option value="5-10年">5-10 years</option>
                <option value="10年以上">10+ years</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ keyword: '', location: '', experience: '', salary: '' })}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Found <span className="font-semibold text-gray-900">{filteredResumes.length}</span> matching resumes
        </div>

        {/* Resume Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map(resume => (
            <div
              key={resume.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border-2 border-gray-100 hover:border-orange-300"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{resume.avatar}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {resume.isLocked ? `${resume.name.substring(0, 1)}**` : resume.name}
                    </h3>
                    <p className="text-orange-100">{resume.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {resume.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {resume.education}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">📍</span>
                    <span className="text-gray-700">{resume.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">💰</span>
                    <span className="text-gray-700 font-semibold">{resume.salary}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">🎯</span>
                    <span className="text-gray-700">{resume.jobStatus}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Core Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.slice(0, resume.isLocked ? 3 : resume.skills.length).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {resume.isLocked && resume.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{resume.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {resume.isLocked 
                      ? `${resume.highlights.substring(0, 30)}...` 
                      : resume.highlights
                    }
                  </p>
                </div>

                {/* Unlock Button */}
                {(() => {
                  const encryptionMode = resume.rawData?.encryption_mode;
                  
                  console.log('🔍 Resume button rendering:', {
                    resumeId: resume.id,
                    encryptionMode: encryptionMode,
                    rawData: resume.rawData,
                  });
                  
                  // Allowlist mode - show view button directly
                  if (encryptionMode === 'allowlist') {
                    return (
                      <button
                        onClick={() => handleViewResume({ ...resume, isLocked: false })}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Full Resume
                      </button>
                    );
                  }
                  
                  // Subscription mode - check if subscription is purchased
                  if (encryptionMode === 'subscription') {
                    const hasSubscription = userSubscriptions.some(
                      sub => sub.service_id === resume.rawData?.policy_object_id
                    );
                    
                    if (hasSubscription || !resume.isLocked) {
                      return (
                        <button
                          onClick={() => handleViewResume({ ...resume, isLocked: false })}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Full Resume
                        </button>
                      );
                    }
                    
                    return (
                      <button
                        onClick={() => handleUnlock(resume.id)}
                        disabled={isPurchasing}
                        className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Purchasing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            Pay {resume.price} for Permanent Access
                          </>
                        )}
                      </button>
                    );
                  }
                  
                  // Default case (simple encryption or no encryption mode)
                  return (
                    <button
                      onClick={() => handleViewResume({ ...resume, isLocked: false })}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Resume
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredResumes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Matching Resumes Found</h3>
            <p className="text-gray-600">Try adjusting the filter conditions</p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 border-2 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">💡 How to Use Subscription Mode to View Resumes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">Browse Encrypted Resumes</h4>
              <p className="text-gray-700 text-sm">
                View candidates' skill summaries, experience, and expectations, with detailed information protected by Seal encryption
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">Purchase Subscription (Permanent Access)</h4>
              <p className="text-gray-700 text-sm">
                Pay a small amount of Sui, get permanent access after purchase, payment goes directly to the resume owner
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">Decrypt and View Full Resume</h4>
              <p className="text-gray-700 text-sm">
                After successful subscription, the system automatically verifies permissions and decrypts, view full contact details and information anytime
              </p>
            </div>
          </div>
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm font-medium">
              ✨ <strong>Key Features:</strong>
              Based on Seal subscription mode, pay once for permanent access • On-chain permission verification • End-to-end encryption • Decentralized storage
            </p>
          </div>
        </div>

        {/* Decrypt Modal */}
        {showDecryptModal && selectedResume && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">View Resume Details</h2>
                  <p className="text-orange-100 mt-1">
                    {selectedResume.encryption_type === 'seal' ? '🔒 Seal Encryption Protected' : '🔐 Simple Encryption'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDecryptModal(false);
                    setSelectedResume(null);
                    setDecryptedData(null);
                    setError(null);
                  }}
                  className="text-white hover:text-orange-200 transition-colors text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* If simple encryption and not decrypted, show key input */}
                {selectedResume.encryption_type !== 'seal' && !decryptedData && (
                  <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔑 Encryption Key Required</h3>
                    <p className="text-gray-700 mb-4">
                      This resume is protected with simple encryption, please enter the key to view content
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600">💡</span>
                        <div className="text-yellow-800">
                          <p className="font-semibold mb-1">Where is the key?</p>
                          <ul className="space-y-1 text-xs">
                            <li>• If you are the resume owner, the key was displayed when creating the resume</li>
                            <li>• If you saved it locally, refreshing the page will auto-fill it</li>
                            <li>• If you are an HR, please request the key from the resume owner</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Encryption Key *
                      </label>
                      <div className="flex gap-3">
                        <textarea
                          value={decryptKey}
                          onChange={(e) => setDecryptKey(e.target.value)}
                          placeholder="Please paste your encryption key..."
                          rows={4}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDecryptModal(false);
                            setSelectedResume(null);
                            setDecryptKey('');
                          }}
                          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                          Back to List
                        </button>
                        <button
                          onClick={() => handleDecryptResume(selectedResume)}
                          disabled={!decryptKey.trim() || isDecrypting}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {isDecrypting ? 'Decrypting...' : 'Decrypt'}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        💡 Tip: If you chose to save the key locally when creating the resume, you don't need to enter it manually. If you forget the key, the resume content cannot be recovered.
                      </p>
                    </div>
                  </div>
                )}

                {/* Decrypting Status */}
                {isDecrypting && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mb-4"></div>
                    <p className="text-gray-700 font-medium">
                      {selectedResume.encryption_type === 'seal' 
                        ? 'Verifying access permissions and decrypting...' 
                        : 'Decrypting resume...'}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-bold text-red-900 mb-1">Decryption Failed</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Decryption successful, show full resume */}
                {decryptedData && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <h4 className="font-bold text-green-900">Decryption Successful</h4>
                        <p className="text-green-700 text-sm">Resume content has been successfully decrypted</p>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Name：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.name || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Gender：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.gender || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date of Birth：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.birth_date || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Work Start Date：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.work_start_date || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Contact：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.contact || decryptedData.personal?.phone || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Job Status：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.job_status || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desired Position */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Desired Position</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Position：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.position || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Job Type：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.job_type || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Industry：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.industry || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">City：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.city || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Minimum Salary：</span>
                          <span className="font-medium text-gray-900">
                            {decryptedData.desired_position?.salary_min ? `${(decryptedData.desired_position.salary_min / 1000).toFixed(0)}K` : 'Not provided'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Maximum Salary：</span>
                          <span className="font-medium text-gray-900">
                            {decryptedData.desired_position?.salary_max ? `${(decryptedData.desired_position.salary_max / 1000).toFixed(0)}K` : 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {decryptedData.skills && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">⚡ Skills</h3>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                          {decryptedData.skills}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {decryptedData.education && Array.isArray(decryptedData.education) && decryptedData.education.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🎓 Education</h3>
                        <div className="space-y-4">
                          {decryptedData.education.map((edu, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <div className="font-semibold text-gray-900">{edu.school || 'Unknown School'}</div>
                              <div className="text-gray-700">{edu.major || 'Unknown Major'} · {edu.degree || 'Unknown Degree'}</div>
                              <div className="text-sm text-gray-500">
                                {edu.start_date || ''} - {edu.end_date || ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Work Experience */}
                    {decryptedData.work_experience && Array.isArray(decryptedData.work_experience) && decryptedData.work_experience.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">💼 Work Experience</h3>
                        <div className="space-y-4">
                          {decryptedData.work_experience.map((work, index) => (
                            <div key={index} className="border-l-4 border-green-500 pl-4">
                              <div className="font-semibold text-gray-900">{work.company || 'Unknown Company'}</div>
                              <div className="text-gray-700">{work.position || 'Unknown Position'}</div>
                              <div className="text-sm text-gray-500">
                                {work.start_date || ''} - {work.end_date || 'Present'}
                              </div>
                              {work.description && (
                                <div className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{work.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Project Experience */}
                    {decryptedData.project_experience && Array.isArray(decryptedData.project_experience) && decryptedData.project_experience.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Project Experience</h3>
                        <div className="space-y-4">
                          {decryptedData.project_experience.map((project, index) => (
                            <div key={index} className="border-l-4 border-purple-500 pl-4">
                              <div className="font-semibold text-gray-900">{project.name || 'Unknown Project'}</div>
                              <div className="text-gray-700">{project.role || 'Team Member'}</div>
                              <div className="text-sm text-gray-500">
                                {project.start_date || ''} - {project.end_date || ''}
                              </div>
                              {project.description && (
                                <div className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{project.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certificates */}
                    {decryptedData.certificates && Array.isArray(decryptedData.certificates) && decryptedData.certificates.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Certificates</h3>
                        <div className="space-y-2">
                          {decryptedData.certificates.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-blue-600">•</span>
                              <span className="text-gray-700">{cert.name || 'Unknown Certificate'}</span>
                              {cert.issue_date && (
                                <span className="text-sm text-gray-500">({cert.issue_date})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Self Evaluation */}
                    {decryptedData.self_evaluation && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">✨ Self Evaluation</h3>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                          {decryptedData.self_evaluation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* If Seal encryption and not started decryption */}
                {selectedResume.encryption_type === 'seal' && !decryptedData && !isDecrypting && !error && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Seal Encrypted Resume</h3>
                    <p className="text-gray-600 mb-4">
                      This resume is protected with Seal threshold encryption technology, access permissions are controlled by on-chain Allowlist
                    </p>
                    
                    <div className="max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                      <p className="font-semibold text-blue-900 mb-2">✨ Seal Encryption Features:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• No need to manually enter keys</li>
                        <li>• System automatically verifies your access permissions</li>
                        <li>• Only addresses on the whitelist can decrypt</li>
                        <li>• Keys are managed distributedly by multiple servers</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleDecryptResume(selectedResume)}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 font-medium transition-colors text-lg"
                    >
                      🔓 Verify Permissions and Decrypt
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-4">
                      After clicking the button, the system will automatically create a SessionKey and verify your access permissions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
