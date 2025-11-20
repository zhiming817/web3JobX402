import React, { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { TESTNET_PACKAGE_ID, ALLOWLIST_MODULE_NAME } from '../config/seal.config';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
  Paper,
  CircularProgress,
  Collapse,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Link as LinkIcon,
  Close as CloseIcon,
  AddLink as AddLinkIcon
} from '@mui/icons-material';

export default function PublishBlobToAllowlist({ 
  allowlistId, 
  capId, 
  onPublished,
  className = '' 
}) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [blobId, setBlobId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePublish = async () => {
    const trimmedBlobId = blobId.trim();
    
    if (!trimmedBlobId) {
      showSnackbar('Please enter Blob ID', 'warning');
      return;
    }

    if (!allowlistId || !capId) {
      showSnackbar('Missing Allowlist ID or Cap ID', 'error');
      return;
    }

    setIsPublishing(true);

    try {
      console.log('📤 Associating Blob to Allowlist...', {
        allowlistId,
        capId,
        blobId: trimmedBlobId,
      });

      const tx = new Transaction();
      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::publish`,
        arguments: [
          tx.object(allowlistId),
          tx.object(capId),
          tx.pure.string(trimmedBlobId),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Blob associated successfully!', result);
            showSnackbar(`✅ Successfully associated Blob to Allowlist!`, 'success');
            
            setBlobId('');
            setShowForm(false);
            
            if (onPublished) {
              onPublished({ blobId: trimmedBlobId, result });
            }
          },
          onError: (error) => {
            console.error('❌ Association failed:', error);
            showSnackbar('Association failed: ' + error.message, 'error');
          },
        }
      );
    } catch (error) {
      console.error('❌ Association failed:', error);
      showSnackbar('Association failed: ' + error.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderColor: 'secondary.light', bgcolor: 'secondary.50', ...className }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="secondary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon fontSize="small" /> Associate Blob to Allowlist
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Associate encrypted resume Blob with this Allowlist
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => setShowForm(!showForm)}
            startIcon={showForm ? <CloseIcon /> : <AddLinkIcon />}
          >
            {showForm ? 'Cancel' : 'Associate Blob'}
          </Button>
        </Box>

        <Collapse in={showForm}>
          <Stack spacing={2} sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'secondary.200' }}>
            <TextField
              label="Blob ID"
              required
              fullWidth
              size="small"
              value={blobId}
              onChange={(e) => setBlobId(e.target.value)}
              placeholder="Enter Walrus Blob ID"
              helperText="This is the Blob ID returned after uploading to Walrus"
            />

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                📝 Instructions
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>After association, this Blob is protected by the current Allowlist</li>
                  <li>Only allowlist members can decrypt and view</li>
                  <li>One Allowlist can be associated with multiple Blobs</li>
                  <li>Cap is required to perform association</li>
                </ul>
              </Typography>
            </Paper>

            <Button
              variant="contained"
              color="secondary"
              onClick={handlePublish}
              disabled={isPublishing || !blobId.trim()}
              startIcon={isPublishing && <CircularProgress size={20} color="inherit" />}
              fullWidth
            >
              {isPublishing ? 'Associating...' : 'Confirm Association'}
            </Button>
          </Stack>
        </Collapse>

        {!showForm && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'grey.200' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Allowlist ID:</strong>
            </Typography>
            <Typography variant="caption" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
              {allowlistId || 'Not provided'}
            </Typography>
          </Box>
        )}
      </CardContent>

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
    </Card>
  );
}
