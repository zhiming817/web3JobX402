/**
 * Allowlist 管理组件
 * 用于创建和管理简历访问控制白名单
 */
import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { resumeService } from '../services';
import PublishBlobToAllowlist from './PublishBlobToAllowlist';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  VpnKey as KeyIcon,
  ListAlt as ListAltIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  fetchUserAllowlists,
  createAllowlistTransaction,
  createAddMemberTransaction,
  createRemoveMemberTransaction,
  validateSuiAddress,
  extractCreatedObjectIds,
  saveAllowlistToLocalStorage,
  loadAllowlistHistoryFromLocalStorage,
  copyToClipboard,
  openSuiExplorer,
  openSuiExplorerTx,
} from '../utils/allowlistUtils';

export default function AllowlistManager({ onAllowlistCreated }) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isCreating, setIsCreating] = useState(false);
  const [allowlistName, setAllowlistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allowlistHistory, setAllowlistHistory] = useState(() => {
    // Load history from localStorage
    return loadAllowlistHistoryFromLocalStorage();
  });
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);
  const [onChainAllowlists, setOnChainAllowlists] = useState([]);
  const [managingAllowlist, setManagingAllowlist] = useState(null); // Allowlist being managed
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Dialog states
  const [successDialog, setSuccessDialog] = useState({ open: false, title: '', content: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', content: '', onConfirm: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleCloseSuccessDialog = () => setSuccessDialog({ ...successDialog, open: false });
  const handleCloseConfirmDialog = () => setConfirmDialog({ ...confirmDialog, open: false });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Query user's Allowlist Cap objects from chain
  const loadOnChainAllowlists = async () => {
    if (!currentAccount?.address) {
      console.log('⚠️ Wallet not connected');
      return;
    }

    setIsLoadingOnChain(true);
    try {
      const allowlists = await fetchUserAllowlists(suiClient, currentAccount.address);
      setOnChainAllowlists(allowlists);
    } catch (error) {
      console.error('❌ Failed to query on-chain Allowlist:', error);
      showSnackbar('Failed to query on-chain data: ' + error.message, 'error');
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // Automatically query chain data when component loads
  useEffect(() => {
    if (currentAccount?.address) {
      loadOnChainAllowlists();
    }
  }, [currentAccount?.address]);

  // Add member to allowlist
  const handleAddMember = async (allowlist) => {
    const address = newMemberAddress.trim();
    
    if (!address) {
      showSnackbar('Please enter an address', 'warning');
      return;
    }

    // Validate address format
    if (!validateSuiAddress(address)) {
      showSnackbar('Invalid address format. Must be a valid Sui address (hex string starting with 0x)', 'error');
      return;
    }

    setIsAddingMember(true);
    try {
      console.log('➕ Adding member to allowlist...', {
        allowlistId: allowlist.allowlistId,
        capId: allowlist.capId,
        address,
      });

      const tx = createAddMemberTransaction(allowlist.allowlistId, allowlist.capId, address);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Member added successfully!', result);
            showSnackbar(`✅ Successfully added to allowlist! Address: ${address}`, 'success');
            setNewMemberAddress('');
            setManagingAllowlist(null);
            // Reload on-chain data
            loadOnChainAllowlists();
          },
          onError: (error) => {
            console.error('❌ Add failed:', error);
            showSnackbar('Add failed: ' + error.message, 'error');
          },
        }
      );
    } catch (error) {
      console.error('❌ Add failed:', error);
      showSnackbar('Add failed: ' + error.message, 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove member from allowlist
  const handleRemoveMember = async (allowlist, memberAddress) => {
    setConfirmDialog({
      open: true,
      title: 'Confirm Removal',
      content: `Are you sure you want to remove this address?\n\n${memberAddress}`,
      onConfirm: async () => {
        handleCloseConfirmDialog();
        setIsRemovingMember(true);
        try {
          console.log('➖ Removing member from allowlist...', {
            allowlistId: allowlist.allowlistId,
            capId: allowlist.capId,
            address: memberAddress,
          });

          const tx = createRemoveMemberTransaction(allowlist.allowlistId, allowlist.capId, memberAddress);

          signAndExecute(
            { transaction: tx },
            {
              onSuccess: (result) => {
                console.log('✅ Member removed successfully!', result);
                showSnackbar(`✅ Successfully removed from allowlist! Address: ${memberAddress}`, 'success');
                // Reload on-chain data
                loadOnChainAllowlists();
              },
              onError: (error) => {
                console.error('❌ Remove failed:', error);
                showSnackbar('Remove failed: ' + error.message, 'error');
              },
            }
          );
        } catch (error) {
          console.error('❌ Remove failed:', error);
          showSnackbar('Remove failed: ' + error.message, 'error');
        } finally {
          setIsRemovingMember(false);
        }
      }
    });
  };

  // Create new Allowlist
  const handleCreateAllowlist = async () => {
    if (!allowlistName.trim()) {
      showSnackbar('Please enter an Allowlist name', 'warning');
      return;
    }

    setIsCreating(true);

    try {
      console.log('🆕 Creating Allowlist...');
      
      const tx = createAllowlistTransaction(allowlistName);

      signAndExecute(
        { 
          transaction: tx,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showEvents: true,
          }
        },
        {
          onSuccess: async (result) => {
            console.log('✅ Allowlist created (initial result):', result);
            
            let txData = result;

            // Fetch full transaction details to ensure we have events and object changes
            // The initial result might be missing these details depending on the wallet/SDK version
            try {
              console.log('⏳ Fetching full transaction details...');
              txData = await suiClient.waitForTransaction({
                digest: result.digest,
                options: {
                  showEffects: true,
                  showObjectChanges: true,
                  showEvents: true
                }
              });
              console.log('✅ Full transaction details fetched:', txData);
            } catch (err) {
              console.error('⚠️ Failed to fetch full transaction details, using initial result:', err);
            }
            
            // Parse created objects to get allowlistId and capId
            const { allowlistId, capId } = extractCreatedObjectIds(txData);
            
            console.log('Parsed IDs:', { allowlistId, capId });

            // Build detailed success message content
            const successContent = (
              <Box>
                <Typography variant="body1" gutterBottom>
                  ✅ Allowlist created successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Please copy the following IDs for resume creation:
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">🔗 Allowlist ID:</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100', flex: 1, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {allowlistId || '(Check in Explorer)'}
                    </Paper>
                    <IconButton size="small" onClick={() => copyToClipboard(allowlistId, 'Allowlist ID')}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">🔑 Cap ID:</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100', flex: 1, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {capId || '(Check in Explorer)'}
                    </Paper>
                    <IconButton size="small" onClick={() => copyToClipboard(capId, 'Cap ID')}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  These two IDs are required when creating your resume.
                </Alert>

                <Typography variant="caption" display="block" gutterBottom>
                  Transaction Hash: {result.digest}
                </Typography>
              </Box>
            );

            setSuccessDialog({
              open: true,
              title: 'Allowlist Created',
              content: successContent
            });
            
            // Try to copy Allowlist ID to clipboard
            if (allowlistId) {
              copyToClipboard(allowlistId, 'Allowlist ID');
            }
            
            // Save to history
            if (allowlistId && capId) {
              const newRecord = saveAllowlistToLocalStorage(
                allowlistName,
                allowlistId,
                capId,
                result.digest
              );
              setAllowlistHistory([newRecord, ...allowlistHistory]);
            }
            
            setAllowlistName('');
            setShowCreateForm(false);
            
            // Reload on-chain data
            loadOnChainAllowlists();
            
            if (onAllowlistCreated) {
              onAllowlistCreated({ allowlistId, capId, result });
            }
          },
          onError: (error) => {
            console.error('❌ Creation failed:', error);
            showSnackbar('Creation failed: ' + error.message, 'error');
          },
        }
      );
    } catch (error) {
      console.error('❌ Creation failed:', error);
      showSnackbar('Creation failed: ' + error.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      {/* Dialogs and Snackbars */}
      <Dialog open={successDialog.open} onClose={handleCloseSuccessDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{successDialog.title}</DialogTitle>
        <DialogContent>
          {successDialog.content}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary" variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="error" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Allowlist Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={showCreateForm ? <CloseIcon /> : <AddIcon />}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create New Allowlist'}
        </Button>
      </Box>

      <Collapse in={showCreateForm}>
        <Card variant="outlined" sx={{ mb: 4, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
          <CardContent>
            <Typography variant="h6" color="primary.main" gutterBottom>
              Create Access Control List
            </Typography>
            
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Allowlist Name *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="e.g., My Resume Access Control"
                  value={allowlistName}
                  onChange={(e) => setAllowlistName(e.target.value)}
                  size="small"
                  sx={{ bgcolor: 'white' }}
                />
              </Box>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                <Typography variant="subtitle2" gutterBottom>
                  📝 Instructions
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    <li>Allowlist controls who can access your encrypted resume.</li>
                    <li>Creating one generates an Allowlist ID and a Cap ID.</li>
                    <li>Allowlist ID is used to encrypt the resume.</li>
                    <li>Cap ID is used to manage the allowlist (add/remove addresses).</li>
                    <li>This is an on-chain operation and requires Gas fees.</li>
                  </ul>
                </Typography>
              </Paper>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleCreateAllowlist}
                  disabled={isCreating || !allowlistName.trim()}
                  startIcon={isCreating && <CircularProgress size={20} color="inherit" />}
                >
                  {isCreating ? 'Creating...' : 'Create Allowlist'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Collapse>

      {/* On-Chain Allowlist List */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            🔗 On-Chain Allowlist
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={isLoadingOnChain ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={loadOnChainAllowlists}
            disabled={isLoadingOnChain || !currentAccount?.address}
          >
            {isLoadingOnChain ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>

        {!currentAccount?.address ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Please connect wallet to view on-chain data.
          </Alert>
        ) : isLoadingOnChain ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
            <CircularProgress size={32} sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Loading data from chain...
            </Typography>
          </Box>
        ) : onChainAllowlists.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography color="text.secondary" gutterBottom>
              📭 No Allowlist found
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create your first Allowlist to get started.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {onChainAllowlists.map((allowlist, index) => (
              <Card key={index} variant="outlined" sx={{ borderColor: 'success.light', bgcolor: '#f0fdf4' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span role="img" aria-label="link">🔗</span> {allowlist.name}
                    </Typography>
                    <Chip label="On-Chain Data" color="success" size="small" />
                  </Box>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Allowlist ID:</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Paper variant="outlined" sx={{ p: 0.5, px: 1, bgcolor: 'white', flex: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {allowlist.allowlistId}
                        </Paper>
                        <Tooltip title="Copy Allowlist ID">
                          <IconButton size="small" onClick={() => {
                            copyToClipboard(allowlist.allowlistId, 'Allowlist ID');
                            alert('✅ Allowlist ID copied');
                          }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Cap ID:</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Paper variant="outlined" sx={{ p: 0.5, px: 1, bgcolor: 'white', flex: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {allowlist.capId}
                        </Paper>
                        <Tooltip title="Copy Cap ID">
                          <IconButton size="small" onClick={() => {
                            copyToClipboard(allowlist.capId, 'Cap ID');
                            alert('✅ Cap ID copied');
                          }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Allowlist Members ({allowlist.members.length}):
                      </Typography>
                      {allowlist.members.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 1, bgcolor: 'white', color: 'text.secondary', fontSize: '0.75rem' }}>
                          No members
                        </Paper>
                      ) : (
                        <Paper variant="outlined" sx={{ maxHeight: 150, overflowY: 'auto', bgcolor: 'white' }}>
                          <List dense disablePadding>
                            {allowlist.members.map((member, idx) => (
                              <ListItem key={idx} divider>
                                <ListItemText 
                                  primary={member} 
                                  primaryTypographyProps={{ variant: 'caption', fontFamily: 'monospace' }} 
                                />
                                <ListItemSecondaryAction>
                                  <IconButton 
                                    edge="end" 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleRemoveMember(allowlist, member)}
                                    disabled={isRemovingMember}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      )}
                    </Box>

                    {/* Add Member Form */}
                    {managingAllowlist?.allowlistId === allowlist.allowlistId ? (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
                        <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                          Add New Member
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter Sui Address (0x...)"
                            value={newMemberAddress}
                            onChange={(e) => setNewMemberAddress(e.target.value)}
                            sx={{ bgcolor: 'white' }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAddMember(allowlist)}
                            disabled={isAddingMember || !newMemberAddress.trim()}
                          >
                            {isAddingMember ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="inherit"
                            onClick={() => {
                              setManagingAllowlist(null);
                              setNewMemberAddress('');
                            }}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Paper>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setManagingAllowlist(allowlist)}
                        fullWidth
                      >
                        Add Member
                      </Button>
                    )}
                  </Stack>

                  {/* Publish Blob Component */}
                  <Box sx={{ mt: 2 }}>
                    <PublishBlobToAllowlist
                      allowlistId={allowlist.allowlistId}
                      capId={allowlist.capId}
                      onPublished={(data) => {
                        console.log('✅ Blob associated:', data);
                      }}
                    />
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      fullWidth
                      onClick={() => openSuiExplorer(allowlist.allowlistId)}
                    >
                      View Allowlist
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      onClick={() => openSuiExplorer(allowlist.capId)}
                    >
                      View Cap
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* History */}
      {allowlistHistory.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            📚 Local History
          </Typography>
          <Stack spacing={2}>
            {allowlistHistory.map((record, index) => (
              <Card key={index} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{record.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(record.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">🔗 Allowlist ID:</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Paper variant="outlined" sx={{ p: 0.5, px: 1, bgcolor: 'white', flex: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {record.allowlistId}
                        </Paper>
                        <Tooltip title="Copy Allowlist ID">
                          <IconButton size="small" onClick={() => {
                            copyToClipboard(record.allowlistId, 'Allowlist ID');
                            alert('✅ Allowlist ID copied to clipboard');
                          }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary">🔑 Cap ID:</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Paper variant="outlined" sx={{ p: 0.5, px: 1, bgcolor: 'white', flex: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {record.capId}
                        </Paper>
                        <Tooltip title="Copy Cap ID">
                          <IconButton size="small" onClick={() => {
                            copyToClipboard(record.capId, 'Cap ID');
                            alert('✅ Cap ID copied to clipboard');
                          }}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                    
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        fullWidth
                        onClick={() => openSuiExplorer(record.allowlistId)}
                      >
                        View Allowlist
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        fullWidth
                        onClick={() => openSuiExplorerTx(record.txHash)}
                      >
                        View Transaction
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          User Guide
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Step 1:</strong> Create Allowlist (Get Allowlist ID and Cap ID)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Step 2:</strong> Enable Seal encryption when creating resume and enter Allowlist ID and Cap ID
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Step 3:</strong> After HR purchases resume, use Cap ID to add HR address to allowlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Step 4:</strong> HR can use SessionKey to decrypt and view resume
          </Typography>
        </Paper>
      </Box>
    </Paper>
  );
}

/**
 * Add Address to Allowlist Component
 */
export function AddToAllowlist({ allowlistId, capId, onAddressAdded }) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [address, setAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!address.trim()) {
      alert('Please enter an address');
      return;
    }

    setIsAdding(true);

    try {
      await resumeService.addToResumeAllowlist(
        allowlistId,
        capId,
        address.trim(),
        signAndExecute
      );

      alert(`✅ Address added to allowlist!\n\nAddress: ${address}`);
      setAddress('');
      
      if (onAddressAdded) {
        onAddressAdded(address);
      }
    } catch (error) {
      console.error('Add failed:', error);
      alert('Add failed: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f0fdf4', borderColor: 'success.light' }}>
      <Typography variant="subtitle1" color="success.dark" gutterBottom fontWeight="bold">
        Add Address to Allowlist
      </Typography>
      
      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Sui Address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          sx={{ bgcolor: 'white' }}
        />
        
        <Button
          variant="contained"
          color="success"
          onClick={handleAdd}
          disabled={isAdding || !address.trim()}
          startIcon={isAdding && <CircularProgress size={20} color="inherit" />}
        >
          {isAdding ? 'Adding...' : 'Add to Allowlist'}
        </Button>
      </Stack>
    </Paper>
  );
}
