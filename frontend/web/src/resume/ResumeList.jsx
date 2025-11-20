import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField 
} from '@mui/material';
import PageLayout from '../layout/PageLayout';
import { resumeService } from '../services';

export default function ResumeList() {
  const currentAccount = useCurrentAccount();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rename Dialog State
  const [openRenameDialog, setOpenRenameDialog] = useState(false);
  const [renameResumeId, setRenameResumeId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Load resume list
  useEffect(() => {
    if (connected && publicKey) {
      loadMyResumes();
    } else {
      setResumes([]);
    }
  }, [connected, publicKey]);

  const loadMyResumes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const walletAddress = publicKey;
      const data = await resumeService.getMyResumes(walletAddress);
      
      // Transform backend data format to frontend format
      const formattedResumes = data.map(resume => {
        const encryptionMode = resume.encryption_mode || 'subscription';
        const isSubscription = encryptionMode === 'subscription';
        
        return {
          id: resume.id, // Use id instead of resume_id
          name: resume.name || 'Untitled Resume',
          updatedAt: new Date(resume.updated_at * 1000).toLocaleDateString('en-US'), // Convert timestamp
          views: resume.view_count || 0,
          unlocks: resume.unlock_count || 0,
          encryptionMode, // Encryption mode
          price: resume.price || 0, // Price (SUI MIST, 9 decimals)
          priceSUI: isSubscription ? ((resume.price || 0) / 1_000_000_000).toFixed(2) + ' SUI' : null, // Show price only for subscription mode
          earnings: isSubscription ? (((resume.price || 0) * (resume.unlock_count || 0)) / 1_000_000_000).toFixed(2) + ' SUI' : null, // Show earnings only for subscription mode
          status: resume.status || 'active',
          rawData: resume, // Save raw data
        };
      });
      
      setResumes(formattedResumes);
    } catch (err) {
      console.error('Failed to load resume list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const walletAddress = publicKey;
      await resumeService.deleteResume(id, walletAddress);
      
      // Remove from list
      setResumes(resumes.filter(r => r.id !== id));
      alert('Resume deleted successfully');
    } catch (err) {
      console.error('Failed to delete resume:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSetPrice = async (id) => {
    // Find current resume and display its current price
    const resume = resumes.find(r => r.id === id);
    const currentPrice = resume ? ((resume.price || 0) / 1_000_000_000).toFixed(2) : '5.00';
    
    const price = prompt('Set resume unlock price (SUI):', currentPrice);
    if (price === null) return; // User cancelled
    
    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat < 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      const walletAddress = publicKey;
      await resumeService.setResumePrice(id, walletAddress, priceFloat);
      
      alert(`Resume price set to ${priceFloat} SUI`);
      // Reload list to show updated price
      loadMyResumes();
    } catch (err) {
      console.error('Failed to set resume price:', err);
      alert(`Set price failed: ${err.message}`);
    }
  };

  const handleRename = (id, currentName) => {
    setRenameResumeId(id);
    // If it's the default name, clear it for easier editing
    setRenameValue(currentName === 'Untitled Resume' ? '' : currentName);
    setOpenRenameDialog(true);
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setRenaming(true);
    try {
      const walletAddress = publicKey;
      await resumeService.updateResumeName(renameResumeId, walletAddress, renameValue);
      
      setOpenRenameDialog(false);
      loadMyResumes();
    } catch (err) {
      console.error('Failed to rename resume:', err);
      alert(`Rename failed: ${err.message}`);
    } finally {
      setRenaming(false);
    }
  };

  if (!connected || !publicKey) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Please Connect Wallet
            </h2>
            <p className="text-xl text-gray-600">
              You need to connect your wallet to manage resumes
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">Loading resume list...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadMyResumes}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="text-gray-600 mt-2">Manage your encrypted resumes</p>
          </div>
          <Link to="/resume/create">
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Resume
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Resumes</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{resumes.length}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Views</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {resumes.reduce((acc, r) => acc + r.views, 0)}
                </p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Unlocks</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {resumes.reduce((acc, r) => acc + r.unlocks, 0)}
                </p>
              </div>
              <div className="text-4xl">🔓</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {resumes
                    .filter(r => r.encryptionMode === 'subscription')
                    .reduce((acc, r) => acc + parseFloat(r.earnings || 0), 0)
                    .toFixed(2)} SUI
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Resume List */}
        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Resumes Yet</h3>
            <p className="text-gray-600 mb-6">Create your first encrypted resume and start earning</p>
            <Link to="/resume/create">
              <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors">
                Create Now
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map(resume => (
              <div
                key={resume.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{resume.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        resume.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {resume.status === 'active' ? 'Published' : 'Draft'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        resume.encryptionMode === 'allowlist'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {resume.encryptionMode === 'allowlist' ? '📋 Allowlist' : '💰 Subscription'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Resume ID: {resume.id}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Updated {resume.updatedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {resume.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        {resume.unlocks} unlocks
                      </span>
                      {resume.encryptionMode === 'subscription' && (
                        <>
                          <span className="flex items-center gap-1 font-semibold text-purple-600">
                            💎 Price: {resume.priceSUI}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-green-600">
                            💰 Earnings: {resume.earnings}
                          </span>
                        </>
                      )}
                      {resume.encryptionMode === 'allowlist' && (
                        <span className="flex items-center gap-1 font-semibold text-blue-600">
                          🔐 Whitelist Access
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/resume/preview/${resume.id}`}>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Preview
                      </button>
                    </Link>
                    <Link to={`/resume/edit/${resume.id}`}>
                      <button className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleRename(resume.id, resume.name)}
                      className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Rename
                    </button>
                    {resume.encryptionMode === 'subscription' && (
                      <button
                        onClick={() => handleSetPrice(resume.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Set Price
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog 
        open={openRenameDialog} 
        onClose={() => setOpenRenameDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rename Resume</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resume Name"
            type="text"
            fullWidth
            variant="outlined"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRenameDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleRenameSubmit} 
            variant="contained" 
            color="primary"
            disabled={renaming}
          >
            {renaming ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
