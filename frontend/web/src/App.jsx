import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './resume/Home.jsx';
import ResumeCreate from './resume/ResumeCreate.jsx';
import ResumeEdit from './resume/ResumeEdit.jsx';
import ResumePreviewPage from './resume/ResumePreviewPage.jsx';
import ResumeList from './resume/ResumeList.jsx';
import ResumeBrowse from './resume/ResumeBrowse.jsx';
import ResumeEncryptionExample from './components/ResumeEncryptionExample.jsx';
import AllowlistManager from './components/AllowlistManager.jsx';
import PageLayout from './layout/PageLayout.jsx';
import { NETWORK_CONFIG } from './config.js';

const queryClient = new QueryClient();

// 配置网络
const networkConfig = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <HashRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/resume/create" element={<ResumeCreate />} />
                <Route path="/resume/edit/:id" element={<ResumeEdit />} />
                <Route path="/resume/preview/:id" element={<ResumePreviewPage />} />
                <Route path="/resumes" element={<ResumeList />} />
                <Route path="/resumes/browse" element={<ResumeBrowse />} />
                <Route path="/allowlist" element={<PageLayout><AllowlistManager /></PageLayout>} />
                <Route path="/encryption-test" element={<ResumeEncryptionExample />} />
                <Route path="/templates" element={<div className="p-8 text-center"><h2 className="text-2xl">模板功能开发中...</h2></div>} />
              </Routes>
            </HashRouter>
          </ThemeProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;