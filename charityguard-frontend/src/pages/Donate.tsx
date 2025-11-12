import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Slide,
  Fade,
  Collapse,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  Verified,
  Security,
  LocationOn,
  Language,
  TrendingUp,
  ArrowBack,
  CheckCircle,
  Warning,
  Info,
  Close,
  ContentCopy,
  Star,
  Favorite,
  Groups,
  Public,
  Timeline,
  Celebration,
  Share,
  Download,
  Receipt
} from '@mui/icons-material';

// MetaMask window type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}

// TypeScript interfaces
interface Nonprofit {
  id: string;
  name: string;
  ein: string;
  city: string;
  state: string;
  category: string;
  trustScore: number;
  walletAddress: string;
  description: string;
  website: string;
  totalDonations?: string;
  donorCount?: number;
}

interface DonationState {
  step: number;
  walletConnected: boolean;
  walletAddress: string;
  walletBalance: string;
  donationAmount: string;
  isProcessing: boolean;
  transactionHash: string;
  error: string;
  donorName: string;
  donorEmail: string;
  isAnonymous: boolean;
  networkName: string;
  chainId: string;
  gasEstimate: string;
}

const Donate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get nonprofit data from navigation state
  const nonprofit: Nonprofit | null = location.state?.nonprofit || null;
  
  // Component state with additional properties
  const [donationState, setDonationState] = useState<DonationState>({
    step: 0, // 0: Connect Wallet, 1: Enter Amount, 2: Donor Info, 3: Confirm, 4: Processing, 5: Complete
    walletConnected: false,
    walletAddress: '',
    walletBalance: '0.0000',
    donationAmount: '',
    isProcessing: false,
    transactionHash: '',
    error: '',
    donorName: '',
    donorEmail: '',
    isAnonymous: false,
    networkName: 'Unknown',
    chainId: '',
    gasEstimate: '0.002'
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [impactMetrics, setImpactMetrics] = useState({
    meals: 0,
    blankets: 0,
    water: 0,
    people: 0,
    co2Saved: 0,
    treesPlanted: 0
  });

  // Quick donation amounts with descriptions
  const quickAmounts = [
    { amount: '0.01', label: '0.01 ETH', description: '~10 meals', icon: '🍽️', color: '#4CAF50' },
    { amount: '0.05', label: '0.05 ETH', description: '~50 meals', icon: '🥗', color: '#2196F3' },
    { amount: '0.1', label: '0.1 ETH', description: '~100 meals', icon: '🍲', color: '#FF9800' },
    { amount: '0.25', label: '0.25 ETH', description: '~250 meals', icon: '🏠', color: '#E91E63' },
    { amount: '0.5', label: '0.5 ETH', description: '~500 meals', icon: '🏥', color: '#9C27B0' },
    { amount: '1.0', label: '1.0 ETH', description: '~1000 meals', icon: '🏫', color: '#F44336' }
  ];

  // Stepper labels
  const stepLabels = ['Connect Wallet', 'Choose Amount', 'Donor Details', 'Confirm Donation', 'Processing', 'Complete'];

  // Network configurations
  const networks = {
    '0x1': { name: 'Ethereum Mainnet', explorer: 'https://etherscan.io' },
    '0x5': { name: 'Goerli Testnet', explorer: 'https://goerli.etherscan.io' },
    '0xaa36a7': { name: 'Sepolia Testnet', explorer: 'https://sepolia.etherscan.io' },
    '0x89': { name: 'Polygon Mainnet', explorer: 'https://polygonscan.com' },
    '0x38': { name: 'BSC Mainnet', explorer: 'https://bscscan.com' }
  };

  // Check for existing wallet connection on page load
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const balance = await getWalletBalance(accounts[0]);
            const networkInfo = await getNetworkInfo();
            
            setDonationState(prev => ({
              ...prev,
              walletConnected: true,
              walletAddress: accounts[0],
              walletBalance: balance,
              networkName: networkInfo.name,
              chainId: networkInfo.chainId,
              step: 1 // Skip to amount selection
            }));
          }
        } catch (error) {
          console.log('No previous wallet connection found');
        }
      }
    };

    checkExistingConnection();
  }, []);

  // Redirect if no nonprofit data
  useEffect(() => {
    if (!nonprofit) {
      navigate('/search');
    }
  }, [nonprofit, navigate]);

  // Calculate impact metrics when amount changes
  useEffect(() => {
    if (donationState.donationAmount) {
      const amount = parseFloat(donationState.donationAmount);
      setImpactMetrics({
        meals: Math.floor(amount * 1000),
        blankets: Math.floor(amount * 100),
        water: Math.floor(amount * 10000),
        people: Math.floor(amount * 50),
        co2Saved: Math.floor(amount * 2.5),
        treesPlanted: Math.floor(amount * 10)
      });
    }
  }, [donationState.donationAmount]);

  // Get wallet balance
  const getWalletBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const ethBalance = parseFloat((parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4));
      return ethBalance.toString();
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.0000';
    }
  };

  // Get network information
  const getNetworkInfo = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkInfo = networks[chainId as keyof typeof networks];
      return {
        chainId,
        name: networkInfo?.name || `Unknown Network (${chainId})`,
        explorer: networkInfo?.explorer || 'https://etherscan.io'
      };
    } catch (error) {
      return {
        chainId: 'unknown',
        name: 'Unknown Network',
        explorer: 'https://etherscan.io'
      };
    }
  };

  // Gas estimation
  const estimateGas = async (to: string, value: string) => {
    try {
      const gasEstimate = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: donationState.walletAddress,
          to: to,
          value: value
        }]
      });

      const gasPrice = await window.ethereum.request({ method: 'eth_gasPrice' });
      const gasCost = parseInt(gasEstimate, 16) * parseInt(gasPrice, 16);
      const gasCostEth = (gasCost / Math.pow(10, 18)).toFixed(6);
      
      setDonationState(prev => ({ ...prev, gasEstimate: gasCostEth }));
      return gasCostEth;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return '0.002'; // Fallback estimate
    }
  };

  // Handle wallet connection with better error handling
  const handleConnectWallet = async () => {
    setDonationState(prev => ({ ...prev, error: '', isProcessing: true }));

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('🦊 MetaMask is not installed. Please install MetaMask browser extension from metamask.io to continue.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }).catch((error: any) => {
        if (error.code === 4001) {
          throw new Error('🚫 Connection rejected. Please approve the connection request in MetaMask to continue.');
        }
        throw error;
      });

      if (accounts.length === 0) {
        throw new Error('🔒 No accounts found. Please unlock your MetaMask wallet and try again.');
      }

      const account = accounts[0];
      const balance = await getWalletBalance(account);
      const networkInfo = await getNetworkInfo();

      setDonationState(prev => ({
        ...prev,
        walletConnected: true,
        walletAddress: account,
        walletBalance: balance,
        networkName: networkInfo.name,
        chainId: networkInfo.chainId,
        step: 1,
        isProcessing: false,
        error: ''
      }));

      console.log('✅ Wallet connected successfully:', account);

    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      setDonationState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet. Please try again.',
        isProcessing: false
      }));
    }
  };

  // Handle amount selection with gas estimation
  const handleAmountSelect = async (amount: string) => {
    setDonationState(prev => ({
      ...prev,
      donationAmount: amount,
      error: ''
    }));

    if (nonprofit?.walletAddress && parseFloat(amount) > 0) {
      const amountWei = '0x' + Math.floor(parseFloat(amount) * 1e18).toString(16);
      await estimateGas(nonprofit.walletAddress, amountWei);
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (donationState.step === 1) {
      const amount = parseFloat(donationState.donationAmount);
      if (!amount || amount < 0.001) {
        setDonationState(prev => ({
          ...prev,
          error: '💰 Please enter a valid donation amount (minimum 0.001 ETH)'
        }));
        return;
      }

      const totalNeeded = amount + parseFloat(donationState.gasEstimate);
      if (parseFloat(donationState.walletBalance) < totalNeeded) {
        setDonationState(prev => ({
          ...prev,
          error: `❌ Insufficient balance. You need ${totalNeeded.toFixed(4)} ETH (including gas) but only have ${donationState.walletBalance} ETH`
        }));
        return;
      }
    }

    setDonationState(prev => ({
      ...prev,
      step: prev.step + 1,
      error: ''
    }));
  };

  // Handle donation processing with better error handling
  const handleDonate = async () => {
    if (!nonprofit || !donationState.walletConnected) {
      return;
    }

    setDonationState(prev => ({
      ...prev,
      step: 4,
      isProcessing: true,
      error: ''
    }));

    try {
      const amount = parseFloat(donationState.donationAmount);
      const amountWei = '0x' + Math.floor(amount * 1e18).toString(16);

      console.log('🚀 Initiating donation transaction...');

      const transactionHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: donationState.walletAddress,
          to: nonprofit.walletAddress,
          value: amountWei,
          gas: '0x5208',
        }],
      }).catch((error: any) => {
        if (error.code === 4001) {
          throw new Error('🚫 Transaction was rejected by user. Please approve the transaction in MetaMask to complete your donation.');
        }
        if (error.code === -32603) {
          throw new Error('❌ Transaction failed: Insufficient funds for gas or network congestion. Please try again.');
        }
        if (error.code === -32602) {
          throw new Error('❌ Invalid transaction parameters. Please check the donation amount and try again.');
        }
        throw error;
      });

      console.log('📄 Transaction submitted:', transactionHash);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const newBalance = await getWalletBalance(donationState.walletAddress);

      setDonationState(prev => ({
        ...prev,
        step: 5,
        isProcessing: false,
        transactionHash,
        walletBalance: newBalance,
        error: ''
      }));

      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('❌ Donation failed:', error);
      setDonationState(prev => ({
        ...prev,
        step: 3,
        isProcessing: false,
        error: error.message || 'Transaction failed. Please try again.'
      }));
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#FF9800';
    return '#F44336';
  };

  // Generate organization avatar
  const getOrgAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722'];
    const colorIndex = name.length % colors.length;
    
    return {
      initials,
      color: colors[colorIndex]
    };
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Get block explorer URL based on current network
  const getExplorerUrl = () => {
    const networkInfo = networks[donationState.chainId as keyof typeof networks];
    return networkInfo?.explorer || 'https://etherscan.io';
  };

  // If no nonprofit data, show loading
  if (!nonprofit) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  const avatar = getOrgAvatar(nonprofit.name);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* MetaMask Installation Check */}
        {typeof window.ethereum === 'undefined' && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              backgroundColor: '#fff3cd',
              border: '2px solid #ffeaa7',
              '& .MuiAlert-message': {
                color: '#1a1a1a !important' // FORCE DARK TEXT
              }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a !important' }}>
              🦊 MetaMask Required for Donations
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#1a1a1a !important' }}>
              Please install the MetaMask browser extension to make secure blockchain donations.
            </Typography>
            <Button 
              href="https://metamask.io/download/" 
              target="_blank"
              variant="contained"
              sx={{ 
                background: 'linear-gradient(45deg, #f6851b, #e2761b)',
                fontWeight: 600
              }}
            >
              Install MetaMask
            </Button>
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/search')}
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              px: 3,
              py: 1,
              fontWeight: 600,
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.2)' 
              }
            }}
          >
            Back to Search
          </Button>
        </Box>

        {/* Page Title */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            mb: 2
          }}>
            💝 Make a Donation
          </Typography>
          
          <Typography variant="h5" sx={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontWeight: 500,
            mb: 1
          }}>
            Support {nonprofit.name} with blockchain transparency
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: 'rgba(255,255,255,0.7)' 
          }}>
            🔒 Secure • 🌍 Transparent • 💝 Direct Impact
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Organization Info Sidebar - COMPLETELY FIXED COLORS */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              position: 'sticky',
              top: 20,
              backgroundColor: '#ffffff', // SOLID WHITE
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              {/* Header with gradient */}
              <Box sx={{ 
                background: `linear-gradient(135deg, ${avatar.color}, ${avatar.color}dd)`,
                p: 3,
                color: 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    mr: 2,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {avatar.initials}
                  </Avatar>
                  
                  <Box>
                    <Chip
                      icon={<Star />}
                      label={`${nonprofit.trustScore}/100`}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 1
                      }}
                    />
                    <Chip
                      icon={<Security />}
                      label="IRS Verified"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(76, 175, 80, 0.3)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  mb: 1, 
                  lineHeight: 1.2,
                  color: '#1a1a1a !important' // FORCE DARK TEXT
                }}>
                  {nonprofit.name}
                </Typography>

                <Typography variant="body2" sx={{ 
                  color: '#666666 !important', // FORCE READABLE GRAY
                  mb: 2, 
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}>
                  EIN: {nonprofit.ein}
                </Typography>

                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ fontSize: 20, mr: 1, color: '#666666' }} />
                  <Typography variant="body2" sx={{ color: '#666666 !important' }}>
                    {nonprofit.city}, {nonprofit.state}
                  </Typography>
                </Box>

                {/* Category */}
                <Chip 
                  label={nonprofit.category}
                  sx={{ 
                    mb: 3, 
                    backgroundColor: '#E3F2FD', 
                    color: '#1565C0 !important',
                    fontWeight: 600
                  }}
                />

                {/* Description */}
                <Typography variant="body2" sx={{ 
                  mb: 3, 
                  lineHeight: 1.6,
                  color: '#1a1a1a !important' // FORCE DARK TEXT
                }}>
                  {nonprofit.description}
                </Typography>

                {/* Website */}
                {nonprofit.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Language sx={{ fontSize: 20, mr: 1, color: '#1976d2' }} />
                    <Typography 
                      component="a"
                      href={nonprofit.website}
                      target="_blank"
                      sx={{ 
                        color: '#1976d2 !important',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Visit Official Website →
                    </Typography>
                  </Box>
                )}

                {/* Stats */}
                <Paper sx={{ 
                  p: 3, 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: 3,
                  border: '1px solid #e0e0e0'
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 'bold', 
                          color: '#4ECDC4',
                          mb: 0.5
                        }}>
                          ${nonprofit.totalDonations || '236.7'}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#666666 !important', 
                          fontWeight: 600 
                        }}>
                          Total Raised
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 'bold', 
                          color: '#45B7D1',
                          mb: 0.5
                        }}>
                          {nonprofit.donorCount || 1247}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#666666 !important', 
                          fontWeight: 600 
                        }}>
                          Donors
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Wallet Address */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="body2" sx={{ 
                  mb: 1, 
                  fontWeight: 600,
                  color: '#1a1a1a !important'
                }}>
                  🏦 Donation Address:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 2,
                  border: '2px dashed #ddd'
                }}>
                  <Typography variant="caption" sx={{ 
                    flexGrow: 1, 
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    color: '#1a1a1a !important'
                  }}>
                    {nonprofit.walletAddress}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(nonprofit.walletAddress)}
                    sx={{ ml: 1 }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Donation Process - COMPLETELY FIXED COLORS */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ 
              borderRadius: 4,
              backgroundColor: '#ffffff', // SOLID WHITE
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                {/* Progress Stepper */}
                <Box sx={{ mb: 6 }}>
                  <Stepper 
                    activeStep={donationState.step} 
                    alternativeLabel
                    sx={{
                      '& .MuiStepConnector-line': {
                        borderColor: '#E0E0E0',
                        borderTopWidth: 3
                      },
                      '& .MuiStepConnector-active .MuiStepConnector-line': {
                        borderColor: '#4ECDC4'
                      },
                      '& .MuiStepConnector-completed .MuiStepConnector-line': {
                        borderColor: '#4ECDC4'
                      }
                    }}
                  >
                    {stepLabels.map((label, index) => (
                      <Step key={label}>
                        <StepLabel 
                          sx={{
                            '& .MuiStepLabel-label': {
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              color: '#666666 !important',
                              '&.Mui-active': {
                                color: '#4ECDC4 !important',
                                fontWeight: 800
                              },
                              '&.Mui-completed': {
                                color: '#4CAF50 !important',
                                fontWeight: 700
                              }
                            },
                            '& .MuiStepIcon-root': {
                              fontSize: '2rem',
                              '&.Mui-active': {
                                color: '#4ECDC4'
                              },
                              '&.Mui-completed': {
                                color: '#4ECDC4'
                              }
                            }
                          }}
                        >
                          {label}
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {/* Error Display */}
                {donationState.error && (
                  <Collapse in={!!donationState.error}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 3,
                        backgroundColor: '#ffebee',
                        border: '2px solid #f44336',
                        '& .MuiAlert-message': {
                          color: '#1a1a1a !important' // FORCE DARK TEXT
                        }
                      }}
                      onClose={() => setDonationState(prev => ({ ...prev, error: '' }))}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a !important' }}>
                        {donationState.error}
                      </Typography>
                    </Alert>
                  </Collapse>
                )}

                {/* Step 0: Connect Wallet */}
                {donationState.step === 0 && (
                  <Fade in={donationState.step === 0}>
                    <Paper sx={{ 
                      p: 6, 
                      textAlign: 'center',
                      borderRadius: 4,
                      backgroundColor: '#f8f9fa',
                      border: '2px dashed rgba(102, 126, 234, 0.3)'
                    }}>
                      <Box sx={{ 
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 10px 30px rgba(78, 205, 196, 0.3)'
                      }}>
                        <AccountBalanceWallet sx={{ fontSize: 60, color: 'white' }} />
                      </Box>
                      
                      <Typography variant="h4" sx={{ 
                        mb: 2, 
                        fontWeight: 'bold',
                        color: '#1a1a1a !important'
                      }}>
                        Connect Your Wallet
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        mb: 4, 
                        maxWidth: 400, 
                        mx: 'auto',
                        color: '#666666 !important'
                      }}>
                        Connect your MetaMask wallet to make a secure donation. 
                        Your transaction will be transparent and verifiable on the blockchain.
                      </Typography>
                      
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleConnectWallet}
                        disabled={donationState.isProcessing || typeof window.ethereum === 'undefined'}
                        startIcon={<AccountBalanceWallet />}
                        sx={{
                          background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                          py: 2,
                          px: 6,
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          borderRadius: 3,
                          boxShadow: '0 8px 25px rgba(78, 205, 196, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #45B7D1, #4ECDC4)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 35px rgba(78, 205, 196, 0.6)'
                          },
                          '&:disabled': {
                            background: '#ccc',
                            color: '#666'
                          }
                        }}
                      >
                        {donationState.isProcessing 
                          ? 'Connecting...' 
                          : typeof window.ethereum === 'undefined'
                            ? 'Install MetaMask First'
                            : 'Connect MetaMask Wallet'
                        }
                      </Button>
                      
                      {donationState.isProcessing && (
                        <Box sx={{ mt: 3 }}>
                          <LinearProgress sx={{ 
                            borderRadius: 2,
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)'
                            }
                          }} />
                          <Typography variant="body2" sx={{ 
                            mt: 1, 
                            color: '#666666 !important'
                          }}>
                            🔄 Please check your MetaMask extension and approve the connection...
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Fade>
                )}

                {/* Step 1: Enter Amount - COMPLETELY FIXED */}
                {donationState.step === 1 && (
                  <Fade in={donationState.step === 1}>
                    <Box>
                      <Typography variant="h4" sx={{ 
                        mb: 3, 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        color: '#1a1a1a !important'
                      }}>
                        💝 Choose Your Donation Amount
                      </Typography>

                      {/* Wallet Status */}
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mb: 4,
                          borderRadius: 3,
                          backgroundColor: '#e8f5e8',
                          border: '2px solid #4CAF50',
                          '& .MuiAlert-message': {
                            color: '#1a1a1a !important'
                          }
                        }}
                        icon={<CheckCircle />}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a !important' }}>
                          ✅ Wallet Connected Successfully!
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          mt: 0.5, 
                          fontFamily: 'monospace',
                          color: '#1a1a1a !important'
                        }}>
                          Address: {donationState.walletAddress.substring(0, 6)}...{donationState.walletAddress.substring(38)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#1a1a1a !important',
                          fontWeight: 600
                        }}>
                          💰 Balance: {donationState.walletBalance} ETH
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>
                          🌐 Network: {donationState.networkName}
                        </Typography>
                      </Alert>

                      {/* Quick Amount Selection */}
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        fontWeight: 600, 
                        textAlign: 'center',
                        color: '#1a1a1a !important'
                      }}>
                        🚀 Quick Select:
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 4 }}>
                        {quickAmounts.map((item) => (
                          <Grid item xs={6} sm={4} key={item.amount}>
                            <Card
                              onClick={() => handleAmountSelect(item.amount)}
                              sx={{
                                p: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                borderRadius: 3,
                                border: donationState.donationAmount === item.amount 
                                  ? `3px solid ${item.color}` 
                                  : '2px solid #e0e0e0',
                                backgroundColor: donationState.donationAmount === item.amount 
                                  ? `${item.color}22` 
                                  : '#ffffff',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 10px 25px ${item.color}44`,
                                  backgroundColor: `${item.color}22`
                                }
                              }}
                            >
                              <Typography variant="h3" sx={{ mb: 1 }}>
                                {item.icon}
                              </Typography>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold', 
                                color: item.color,
                                mb: 0.5
                              }}>
                                {item.label}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: '#666666 !important',
                                fontWeight: 500
                              }}>
                                {item.description}
                              </Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      {/* Custom Amount Input */}
                      <Paper sx={{ 
                        p: 3, 
                        borderRadius: 3, 
                        backgroundColor: '#f8f9fa', 
                        mb: 4,
                        border: '1px solid #e0e0e0'
                      }}>
                        <Typography variant="h6" sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: '#1a1a1a !important'
                        }}>
                          💰 Or Enter Custom Amount:
                        </Typography>
                        <TextField
                          fullWidth
                          label="Enter amount (ETH)"
                          value={donationState.donationAmount}
                          onChange={(e) => handleAmountSelect(e.target.value)}
                          type="number"
                          inputProps={{ 
                            min: 0.001, 
                            step: 0.001,
                            placeholder: "0.1" 
                          }}
                          sx={{ 
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              fontSize: '1.2rem',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              '& input': {
                                color: '#1a1a1a !important'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              color: '#666666',
                              '&.Mui-focused': {
                                color: '#4ECDC4'
                              }
                            }
                          }}
                          helperText={
                            <Typography variant="body2" sx={{ color: '#666666 !important' }}>
                              Minimum donation: 0.001 ETH • Gas estimate: ~{donationState.gasEstimate} ETH
                            </Typography>
                          }
                        />
                      </Paper>

                      {/* Impact Preview */}
                      {donationState.donationAmount && parseFloat(donationState.donationAmount) >= 0.001 && (
                        <Slide direction="up" in={!!donationState.donationAmount}>
                          <Card sx={{ 
                            mb: 4,
                            background: 'linear-gradient(135deg, #E8F5E8, #F0F8F0)',
                            border: '2px solid #4CAF50',
                            borderRadius: 4
                          }}>
                            <CardContent sx={{ p: 4 }}>
                              <Typography variant="h5" sx={{ 
                                mb: 3, 
                                fontWeight: 'bold', 
                                color: '#2E7D32',
                                textAlign: 'center'
                              }}>
                                🌟 Your Amazing Impact Preview
                              </Typography>
                              
                              <Grid container spacing={3}>
                                {[
                                  { value: impactMetrics.meals.toLocaleString(), label: 'Meals Provided', icon: '🍽️', color: '#4CAF50' },
                                  { value: impactMetrics.people.toLocaleString(), label: 'People Helped', icon: '👥', color: '#2196F3' },
                                  { value: impactMetrics.blankets.toLocaleString(), label: 'Blankets', icon: '🛏️', color: '#FF9800' },
                                  { value: impactMetrics.water.toLocaleString(), label: 'Cups of Water', icon: '💧', color: '#00BCD4' },
                                  { value: impactMetrics.treesPlanted.toLocaleString(), label: 'Trees Planted', icon: '🌱', color: '#4CAF50' },
                                  { value: impactMetrics.co2Saved.toLocaleString(), label: 'KG CO2 Saved', icon: '🌍', color: '#009688' }
                                ].map((metric, index) => (
                                  <Grid item xs={6} sm={4} key={index}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <Typography variant="h2" sx={{ mb: 1 }}>
                                        {metric.icon}
                                      </Typography>
                                      <Typography variant="h4" sx={{ 
                                        fontWeight: 'bold', 
                                        color: metric.color,
                                        mb: 0.5
                                      }}>
                                        {metric.value}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        color: '#1a1a1a !important',
                                        fontWeight: 600
                                      }}>
                                        {metric.label}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Slide>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleNextStep}
                          disabled={!donationState.donationAmount || parseFloat(donationState.donationAmount) < 0.001}
                          sx={{
                            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                            py: 2,
                            px: 6,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 3,
                            boxShadow: '0 8px 25px rgba(78, 205, 196, 0.4)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 35px rgba(78, 205, 196, 0.6)'
                            },
                            '&:disabled': {
                              background: '#ccc',
                              color: '#666'
                            }
                          }}
                        >
                          Continue to Donor Details →
                        </Button>
                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Step 2: Donor Information */}
                {donationState.step === 2 && (
                  <Fade in={donationState.step === 2}>
                    <Box>
                      <Typography variant="h4" sx={{ 
                        mb: 3, 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        color: '#1a1a1a !important'
                      }}>
                        👤 Donor Information
                      </Typography>

                      <Paper sx={{ p: 4, borderRadius: 4, mb: 4, backgroundColor: '#ffffff' }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Your Name"
                              value={donationState.donorName}
                              onChange={(e) => setDonationState(prev => ({ ...prev, donorName: e.target.value }))}
                              disabled={donationState.isAnonymous}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: '#ffffff',
                                  '& input': {
                                    color: '#1a1a1a !important'
                                  }
                                },
                                '& .MuiInputLabel-root': {
                                  color: '#666666',
                                  '&.Mui-focused': {
                                    color: '#4ECDC4'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Email Address"
                              type="email"
                              value={donationState.donorEmail}
                              onChange={(e) => setDonationState(prev => ({ ...prev, donorEmail: e.target.value }))}
                              disabled={donationState.isAnonymous}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: '#ffffff',
                                  '& input': {
                                    color: '#1a1a1a !important'
                                  }
                                },
                                '& .MuiInputLabel-root': {
                                  color: '#666666',
                                  '&.Mui-focused': {
                                    color: '#4ECDC4'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Button
                                variant={donationState.isAnonymous ? "contained" : "outlined"}
                                onClick={() => setDonationState(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                                sx={{ 
                                  borderRadius: 2,
                                  ...(donationState.isAnonymous ? {
                                    background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)'
                                  } : {
                                    color: '#4ECDC4',
                                    borderColor: '#4ECDC4'
                                  })
                                }}
                              >
                                🕶️ Donate Anonymously
                              </Button>
                              {donationState.isAnonymous && (
                                <Typography variant="body2" sx={{ color: '#666666 !important' }}>
                                  Your donation will be recorded as "Anonymous Donor"
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>

                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => setDonationState(prev => ({ ...prev, step: 1 }))}
                          sx={{ 
                            py: 2, 
                            px: 4, 
                            borderRadius: 2, 
                            fontWeight: 600,
                            color: '#4ECDC4',
                            borderColor: '#4ECDC4'
                          }}
                        >
                          ← Back
                        </Button>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleNextStep}
                          sx={{
                            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                            py: 2,
                            px: 6,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: 2
                          }}
                        >
                          Continue to Confirmation →
                        </Button>
                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Step 3: Confirm Donation */}
                {donationState.step === 3 && (
                  <Fade in={donationState.step === 3}>
                    <Box>
                      <Typography variant="h4" sx={{ 
                        mb: 4, 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        color: '#1a1a1a !important'
                      }}>
                        🔐 Confirm Your Donation
                      </Typography>

                      {/* Balance check warning */}
                      {parseFloat(donationState.walletBalance) < parseFloat(donationState.donationAmount) + parseFloat(donationState.gasEstimate) && (
                        <Alert severity="warning" sx={{ 
                          mb: 3, 
                          borderRadius: 3,
                          backgroundColor: '#fff3cd',
                          '& .MuiAlert-message': {
                            color: '#1a1a1a !important'
                          }
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a !important' }}>
                            ⚠️ Insufficient Balance
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>
                            You need {(parseFloat(donationState.donationAmount) + parseFloat(donationState.gasEstimate)).toFixed(4)} ETH 
                            but only have {donationState.walletBalance} ETH
                          </Typography>
                        </Alert>
                      )}

                      {/* Donation Summary Card */}
                      <Card sx={{ 
                        mb: 4, 
                        background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                        border: '2px solid #4ECDC4',
                        borderRadius: 4
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Grid container spacing={4} alignItems="center">
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" sx={{ 
                                mb: 1,
                                color: '#666666 !important'
                              }}>
                                Donation Amount
                              </Typography>
                              <Typography variant="h2" sx={{ 
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}>
                                {donationState.donationAmount} ETH
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666666 !important' }}>
                                ≈ ${(parseFloat(donationState.donationAmount) * 2500).toFixed(2)} USD
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" sx={{ 
                                mb: 1,
                                color: '#666666 !important'
                              }}>
                                Recipient
                              </Typography>
                              <Typography variant="h5" sx={{ 
                                fontWeight: 'bold', 
                                mb: 1,
                                color: '#1a1a1a !important'
                              }}>
                                {nonprofit.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666666 !important' }}>
                                {nonprofit.city}, {nonprofit.state}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* Donor Information */}
                      <Card sx={{ mb: 4, borderRadius: 3, backgroundColor: '#ffffff' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontWeight: 600,
                            color: '#1a1a1a !important'
                          }}>
                            👤 Donor Information:
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" sx={{ color: '#666666 !important' }}>Name:</Typography>
                              <Typography variant="body1" sx={{ 
                                fontWeight: 600,
                                color: '#1a1a1a !important'
                              }}>
                                {donationState.isAnonymous ? 'Anonymous Donor' : donationState.donorName || 'Not provided'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" sx={{ color: '#666666 !important' }}>Email:</Typography>
                              <Typography variant="body1" sx={{ 
                                fontWeight: 600,
                                color: '#1a1a1a !important'
                              }}>
                                {donationState.isAnonymous ? 'Anonymous' : donationState.donorEmail || 'Not provided'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* Transaction Details */}
                      <Alert severity="info" sx={{ 
                        mb: 4, 
                        borderRadius: 3,
                        backgroundColor: '#e3f2fd',
                        '& .MuiAlert-message': {
                          color: '#1a1a1a !important'
                        }
                      }}>
                        <Typography variant="h6" sx={{ 
                          mb: 2, 
                          fontWeight: 600,
                          color: '#1a1a1a !important'
                        }}>
                          📋 Transaction Details:
                        </Typography>
                        <Grid container spacing={2} sx={{ fontSize: '0.9rem' }}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ color: '#1a1a1a !important', fontWeight: 'bold' }}>From:</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', color: '#1a1a1a !important' }}>
                              {donationState.walletAddress}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ color: '#1a1a1a !important', fontWeight: 'bold' }}>To:</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', color: '#1a1a1a !important' }}>
                              {nonprofit.walletAddress}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ color: '#1a1a1a !important', fontWeight: 'bold' }}>Network:</Typography>
                            <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>{donationState.networkName}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" sx={{ color: '#1a1a1a !important', fontWeight: 'bold' }}>Estimated Gas Fee:</Typography>
                            <Typography variant="body2" sx={{ 
                              color: '#f57c00',
                              fontWeight: 600
                            }}>
                              ~{donationState.gasEstimate} ETH
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ color: '#1a1a1a !important', fontWeight: 'bold' }}>Total Cost:</Typography>
                            <Typography variant="h6" sx={{ 
                              color: '#d32f2f',
                              fontWeight: 'bold'
                            }}>
                              {(parseFloat(donationState.donationAmount) + parseFloat(donationState.gasEstimate)).toFixed(4)} ETH
                            </Typography>
                          </Grid>
                        </Grid>
                      </Alert>

                      <Alert severity="warning" sx={{ 
                        mb: 4, 
                        borderRadius: 3,
                        backgroundColor: '#fff3cd',
                        '& .MuiAlert-message': {
                          color: '#1a1a1a !important'
                        }
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a !important' }}>
                          ⚠️ Important Notice:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>
                          This transaction will be permanently recorded on the blockchain and cannot be reversed. 
                          Please review all details carefully before confirming your donation.
                        </Typography>
                      </Alert>

                      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => setDonationState(prev => ({ ...prev, step: 2 }))}
                          sx={{ 
                            py: 2, 
                            px: 4, 
                            borderRadius: 2, 
                            fontWeight: 600,
                            color: '#4ECDC4',
                            borderColor: '#4ECDC4'
                          }}
                        >
                          ← Back
                        </Button>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleDonate}
                          disabled={parseFloat(donationState.walletBalance) < parseFloat(donationState.donationAmount) + parseFloat(donationState.gasEstimate)}
                          sx={{
                            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                            py: 2,
                            px: 6,
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            borderRadius: 2,
                            boxShadow: '0 8px 25px rgba(78, 205, 196, 0.4)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 35px rgba(78, 205, 196, 0.6)'
                            },
                            '&:disabled': {
                              background: '#ccc',
                              color: '#666'
                            }
                          }}
                        >
                          💝 Confirm Donation
                        </Button>
                      </Box>
                    </Box>
                  </Fade>
                )}

                {/* Step 4: Processing */}
                {donationState.step === 4 && (
                  <Fade in={donationState.step === 4}>
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ 
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        animation: 'pulse 2s infinite'
                      }}>
                        <Timeline sx={{ fontSize: 60, color: 'white' }} />
                      </Box>
                      
                      <Typography variant="h4" sx={{ 
                        mb: 2, 
                        fontWeight: 'bold',
                        color: '#1a1a1a !important'
                      }}>
                        🔄 Processing Your Donation
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        mb: 3,
                        color: '#666666 !important'
                      }}>
                        Please wait while your transaction is being processed on the blockchain...
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        mb: 4,
                        color: '#666666 !important'
                      }}>
                        This may take a few moments. Please do not close this window.
                      </Typography>
                      
                      <Alert severity="info" sx={{ 
                        mb: 4, 
                        textAlign: 'left',
                        backgroundColor: '#e3f2fd',
                        '& .MuiAlert-message': {
                          color: '#1a1a1a !important'
                        }
                      }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a !important' }}>
                          🦊 Please check your MetaMask extension
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>
                          If you haven't approved the transaction yet, please check your MetaMask popup and confirm the transaction.
                        </Typography>
                      </Alert>
                      
                      <LinearProgress sx={{ 
                        borderRadius: 2,
                        height: 8,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)'
                        }
                      }} />
                    </Box>
                  </Fade>
                )}

                {/* Step 5: Complete */}
                {donationState.step === 5 && (
                  <Fade in={donationState.step === 5}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ 
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 32px',
                        boxShadow: '0 15px 40px rgba(76, 175, 80, 0.4)'
                      }}>
                        <Celebration sx={{ fontSize: 80, color: 'white' }} />
                      </Box>
                      
                      <Typography variant="h3" sx={{ 
                        mb: 2, 
                        fontWeight: 'bold', 
                        color: '#4CAF50'
                      }}>
                        🎉 Donation Successful!
                      </Typography>
                      
                      <Typography variant="h4" sx={{ 
                        mb: 1, 
                        fontWeight: 'bold',
                        color: '#1a1a1a !important'
                      }}>
                        {donationState.donationAmount} ETH
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        mb: 4,
                        color: '#666666 !important'
                      }}>
                        has been donated to {nonprofit.name}
                      </Typography>

                      {/* Transaction Hash */}
                      {donationState.transactionHash && (
                        <Card sx={{ 
                          mb: 4, 
                          p: 3, 
                          backgroundColor: '#e8f5e8',
                          border: '2px solid #4CAF50',
                          borderRadius: 3
                        }}>
                          <Typography variant="h6" sx={{ 
                            mb: 1, 
                            fontWeight: 600,
                            color: '#1a1a1a !important'
                          }}>
                            📜 Transaction Receipt:
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.8rem',
                            wordBreak: 'break-all',
                            display: 'block',
                            mb: 2,
                            color: '#1a1a1a !important'
                          }}>
                            {donationState.transactionHash}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Receipt />}
                            onClick={() => {
                              const explorerUrl = getExplorerUrl();
                              window.open(`${explorerUrl}/tx/${donationState.transactionHash}`, '_blank');
                            }}
                          >
                            View on Block Explorer
                          </Button>
                        </Card>
                      )}

                      {/* Impact Summary */}
                      <Card sx={{ 
                        mb: 4,
                        background: 'linear-gradient(135deg, #E8F5E8, #F0F8F0)',
                        border: '2px solid #4CAF50',
                        borderRadius: 4
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography variant="h5" sx={{ 
                            mb: 3, 
                            fontWeight: 'bold', 
                            color: '#2E7D32'
                          }}>
                            🌟 Your Amazing Impact:
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                {impactMetrics.meals}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>Meals Provided</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                                {impactMetrics.people}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>People Helped</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                                {impactMetrics.treesPlanted}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>Trees Planted</Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                                {impactMetrics.co2Saved}kg
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#1a1a1a !important' }}>CO2 Saved</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          startIcon={<Share />}
                          onClick={() => setShowShareModal(true)}
                          sx={{
                            background: 'linear-gradient(45deg, #E91E63, #EC407A)',
                            fontWeight: 600,
                            borderRadius: 2
                          }}
                        >
                          Share Impact
                        </Button>
                        
                        <Button
                          variant="contained"
                          onClick={() => navigate('/search')}
                          sx={{
                            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                            fontWeight: 600,
                            borderRadius: 2
                          }}
                        >
                          Donate to Another Charity
                        </Button>
                        
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/')}
                          sx={{ 
                            fontWeight: 600, 
                            borderRadius: 2,
                            color: '#4ECDC4',
                            borderColor: '#4ECDC4'
                          }}
                        >
                          Return Home
                        </Button>
                      </Box>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Success Modal */}
        <Dialog 
          open={showSuccessModal} 
          onClose={() => setShowSuccessModal(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              backgroundColor: '#ffffff'
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
            <Celebration sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              color: '#4CAF50' 
            }}>
              Thank You for Your Generosity! 🙏
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="h5" sx={{ 
              mb: 3, 
              fontWeight: 600,
              color: '#1a1a1a !important'
            }}>
              Your {donationState.donationAmount} ETH donation to
            </Typography>
            <Typography variant="h4" sx={{ 
              mb: 3, 
              fontWeight: 'bold',
              color: '#1976d2'
            }}>
              {nonprofit.name}
            </Typography>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              color: '#666666 !important'
            }}>
              will create lasting impact in the community! 🌟
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowSuccessModal(false)}
              sx={{
                background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
                px: 6,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 3
              }}
            >
              Continue Your Journey 🚀
            </Button>
          </DialogActions>
        </Dialog>

        {/* Share Modal */}
        <Dialog 
          open={showShareModal} 
          onClose={() => setShowShareModal(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { backgroundColor: '#ffffff' }
          }}
        >
          <DialogTitle>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold',
              color: '#1a1a1a !important'
            }}>
              📱 Share Your Impact
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ 
              mb: 3,
              color: '#1a1a1a !important'
            }}>
              Help inspire others to give! Share your charitable donation on social media.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined">Twitter</Button>
              <Button variant="outlined">Facebook</Button>
              <Button variant="outlined">LinkedIn</Button>
              <Button variant="outlined">Copy Link</Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowShareModal(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Donate;