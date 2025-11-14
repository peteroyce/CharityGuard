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

// Enhanced TypeScript interfaces (added fraudScore, riskFlags from backend)
interface Nonprofit {
  _id: string;
  name: string;
  ein: string;
  description?: string;
  category?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  nteeCode?: string;
  walletAddress: string;
  totalDonations?: number;
  donorCount?: number;
  rating?: number;
  website?: string;
  logoUrl?: string;
  verified?: boolean;
  taxDeductible?: boolean;
  trustScore?: number;
  fraudScore?: number;
  riskFlags?: string[];
}

interface DonationState {
  step: number;
  donationAmount: string;
  walletConnected: boolean;
  walletAddress: string;
  walletBalance: string;
  isProcessing: boolean;
  transactionHash: string;
  gasEstimate: string;
  error: string;
  selectedAmount: string | null;
  customAmount: string;
  showAdvanced: boolean;
  gasPrice: string;
  gasLimit: string;
  backendResponse?: any;
  fraudChecked?: boolean;
}

const predefinedAmounts = ['0.01', '0.05', '0.1', '0.5', '1.0'];

const steps = [
  'Select Amount',
  'Connect Wallet',
  'Review Details',
  'Confirm Transaction',
  'Success'
];
export const Donate: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const nonprofit = location.state?.nonprofit as Nonprofit | undefined;

  const [donationState, setDonationState] = useState<DonationState>({
    step: 1,
    donationAmount: '',
    walletConnected: false,
    walletAddress: '',
    walletBalance: '0',
    isProcessing: false,
    transactionHash: '',
    gasEstimate: '0.001',
    error: '',
    selectedAmount: null,
    customAmount: '',
    showAdvanced: false,
    gasPrice: '20',
    gasLimit: '21000',
    backendResponse: null,
    fraudChecked: false
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!nonprofit) {
      navigate('/search');
    }
  }, [nonprofit, navigate]);

  useEffect(() => {
    checkWalletConnection();
  }, []);
    // Check if MetaMask is already connected
    const checkWalletConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const balance = await getWalletBalance(accounts[0]);
            setDonationState(prev => ({
              ...prev,
              walletConnected: true,
              walletAddress: accounts[0],
              walletBalance: balance
            }));
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
  
    // Get wallet balance
    const getWalletBalance = async (address: string): Promise<string> => {
      try {
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        const balanceWei = parseInt(balanceHex, 16);
        const balanceEth = balanceWei / 1e18;
        return balanceEth.toFixed(4);
      } catch (error) {
        console.error('Error getting balance:', error);
        return '0';
      }
    };
  
    // Connect wallet
    const connectWallet = async () => {
      if (typeof window.ethereum === 'undefined') {
        setDonationState(prev => ({
          ...prev,
          error: '❌ MetaMask is not installed. Please install MetaMask to make donations.'
        }));
        return;
      }
  
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
  
        const balance = await getWalletBalance(accounts[0]);
  
        setDonationState(prev => ({
          ...prev,
          walletConnected: true,
          walletAddress: accounts[0],
          walletBalance: balance,
          error: '',
          step: 3
        }));
      } catch (error: any) {
        console.error('Wallet connection error:', error);
        setDonationState(prev => ({
          ...prev,
          error: error.message || '❌ Failed to connect wallet. Please try again.'
        }));
      }
    };
      // Handle donation processing (blockchain + backend with FRAUD DETECTION)
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

      // STEP 1: Execute blockchain transaction
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

      // STEP 2: Wait for transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newBalance = await getWalletBalance(donationState.walletAddress);

      // STEP 3: 🔥🔥🔥 SEND TO BACKEND FOR FRAUD DETECTION 🔥🔥🔥
      console.log('🕵️ Sending to backend for fraud analysis...');
      
      try {
        const backendResponse = await fetch('http://localhost:3001/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionHash: transactionHash,
            nonprofitName: nonprofit.name,
            nonprofitEIN: nonprofit.ein || "Unknown",
            donorAddress: donationState.walletAddress,
            recipientAddress: nonprofit.walletAddress,
            amount: amount,
            blockNumber: 0,
            gasUsed: donationState.gasEstimate
          })
        });

        const fraudData = await backendResponse.json();
        console.log('🔍 Fraud detection response:', fraudData);

        // Store backend response
        setDonationState(prev => ({
          ...prev,
          backendResponse: fraudData,
          fraudChecked: true
        }));

        // Show alert if fraud detected
        if (fraudData.warning || fraudData.data?.isFraudulent) {
          console.warn('⚠️ FRAUD DETECTED:', fraudData);
          alert(`⚠️ FRAUD ALERT!\n\nFraud Score: ${fraudData.fraudScore}\n\nRisk Flags:\n${fraudData.riskFlags?.join('\n- ')}\n\nThis transaction has been flagged and will appear on the admin dashboard.`);
        } else {
          console.log('✅ Transaction verified - Fraud Score:', fraudData.fraudScore);
        }

      } catch (backendError) {
        console.error('Backend recording failed (non-blocking):', backendError);
        // Continue even if backend fails
      }

      // STEP 4: Complete donation flow
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
    // Handle amount selection
    const handleAmountSelect = (amount: string) => {
      setDonationState(prev => ({
        ...prev,
        selectedAmount: amount,
        donationAmount: amount,
        customAmount: '',
        error: ''
      }));
    };
  
    // Handle custom amount
    const handleCustomAmountChange = (value: string) => {
      setDonationState(prev => ({
        ...prev,
        customAmount: value,
        donationAmount: value,
        selectedAmount: null,
        error: ''
      }));
    };
  
    // Copy to clipboard
    const copyToClipboard = (text: string, field: string) => {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    };
  
    // Navigate steps
    const handleNext = () => {
      if (donationState.step === 1) {
        if (!donationState.donationAmount || parseFloat(donationState.donationAmount) <= 0) {
          setDonationState(prev => ({ ...prev, error: 'Please enter a valid donation amount' }));
          return;
        }
        setDonationState(prev => ({ ...prev, step: 2, error: '' }));
      } else if (donationState.step === 2) {
        if (!donationState.walletConnected) {
          connectWallet();
        } else {
          setDonationState(prev => ({ ...prev, step: 3 }));
        }
      } else if (donationState.step === 3) {
        handleDonate();
      }
    };
  
    const handleBack = () => {
      setDonationState(prev => ({ ...prev, step: Math.max(1, prev.step - 1), error: '' }));
    };
  
    if (!nonprofit) {
      return null;
    }
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          py: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 20% 50%, #14b8a6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #06b6d4 0%, transparent 50%)',
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.1 },
              '50%': { opacity: 0.2 }
            }
          }}
        />
  
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/search')}
            sx={{
              mb: 3,
              color: '#94a3b8',
              '&:hover': {
                color: '#14b8a6',
                bgcolor: 'rgba(20, 184, 166, 0.1)'
              }
            }}
          >
            Back to Search
          </Button>
  
          {/* Main Card */}
          <Card
            sx={{
              bgcolor: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Nonprofit Header */}
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: '#14b8a6',
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {nonprofit.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h4"
                          sx={{
                            color: '#fff',
                            fontWeight: 700,
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          {nonprofit.name}
                          {nonprofit.verified && (
                            <Verified sx={{ color: '#14b8a6', fontSize: 28 }} />
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<Security />}
                            label="IRS Verified"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(20, 184, 166, 0.2)',
                              color: '#14b8a6',
                              borderColor: '#14b8a6'
                            }}
                            variant="outlined"
                          />
                          {nonprofit.taxDeductible && (
                            <Chip
                              label="Tax Deductible"
                              size="small"
                              sx={{
                                bgcolor: 'rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6'
                              }}
                            />
                          )}
                          {nonprofit.category && (
                            <Chip
                              label={nonprofit.category}
                              size="small"
                              sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
  
                    {nonprofit.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#cbd5e1',
                          mb: 2,
                          maxWidth: 600
                        }}
                      >
                        {nonprofit.description}
                      </Typography>
                    )}
  
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {nonprofit.city && nonprofit.state && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
                          <LocationOn fontSize="small" />
                          <Typography variant="body2">
                            {nonprofit.city}, {nonprofit.state}
                          </Typography>
                        </Box>
                      )}
                      {nonprofit.ein && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
                          <Info fontSize="small" />
                          <Typography variant="body2">EIN: {nonprofit.ein}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
  
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(20, 184, 166, 0.1)',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: '#14b8a6', fontWeight: 700, mb: 1 }}>
                          {nonprofit.trustScore || 95}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                          Trust Score
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              sx={{
                                color: i < Math.floor((nonprofit.trustScore || 95) / 20) ? '#fbbf24' : '#475569',
                                fontSize: 20
                              }}
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Based on {nonprofit.donorCount || 1247} donations
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
  
              <Divider sx={{ my: 4, borderColor: 'rgba(148, 163, 184, 0.1)' }} />
  
              {/* Stepper */}
              <Stepper
                activeStep={donationState.step - 1}
                sx={{
                  mb: 4,
                  '& .MuiStepLabel-root .Mui-completed': { color: '#14b8a6' },
                  '& .MuiStepLabel-root .Mui-active': { color: '#14b8a6' },
                  '& .MuiStepLabel-label': { color: '#94a3b8' }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
                          {/* Step 1: Amount Selection */}
            {donationState.step === 1 && (
              <Fade in timeout={500}>
                <Box>
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>
                    Select Donation Amount (ETH)
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {predefinedAmounts.map((amount) => (
                      <Grid item xs={6} sm={4} md={2.4} key={amount}>
                        <Button
                          fullWidth
                          variant={donationState.selectedAmount === amount ? 'contained' : 'outlined'}
                          onClick={() => handleAmountSelect(amount)}
                          sx={{
                            py: 2,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            bgcolor: donationState.selectedAmount === amount ? '#14b8a6' : 'transparent',
                            borderColor: '#14b8a6',
                            color: donationState.selectedAmount === amount ? '#fff' : '#14b8a6',
                            '&:hover': {
                              bgcolor: donationState.selectedAmount === amount ? '#0f766e' : 'rgba(20, 184, 166, 0.1)',
                              borderColor: '#14b8a6'
                            }
                          }}
                        >
                          {amount} ETH
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 1 }}>
                      Or enter custom amount:
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="0.00"
                      value={donationState.customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      InputProps={{
                        endAdornment: <Typography sx={{ color: '#94a3b8' }}>ETH</Typography>
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          bgcolor: 'rgba(15, 23, 42, 0.5)',
                          '& fieldset': { borderColor: '#475569' },
                          '&:hover fieldset': { borderColor: '#14b8a6' },
                          '&.Mui-focused fieldset': { borderColor: '#14b8a6' }
                        }
                      }}
                    />
                  </Box>

                  {donationState.donationAmount && (
                    <Alert
                      icon={<Info />}
                      severity="info"
                      sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        mb: 2
                      }}
                    >
                      <Typography variant="body2">
                        You're donating <strong>{donationState.donationAmount} ETH</strong> to {nonprofit.name}
                        <br />
                        Estimated gas fee: ~{donationState.gasEstimate} ETH
                      </Typography>
                    </Alert>
                  )}

                  {donationState.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {donationState.error}
                    </Alert>
                  )}
                </Box>
              </Fade>
            )}
                        {/* Step 2: Connect Wallet */}
                        {donationState.step === 2 && (
              <Fade in timeout={500}>
                <Box sx={{ textAlign: 'center' }}>
                  <AccountBalanceWallet sx={{ fontSize: 80, color: '#14b8a6', mb: 3 }} />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                    Connect Your Wallet
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4, maxWidth: 500, mx: 'auto' }}>
                    To proceed with your donation, please connect your MetaMask wallet. Your donation will be securely processed on the Ethereum blockchain.
                  </Typography>

                  {!donationState.walletConnected ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AccountBalanceWallet />}
                      onClick={connectWallet}
                      sx={{
                        bgcolor: '#14b8a6',
                        color: '#fff',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': { bgcolor: '#0f766e' }
                      }}
                    >
                      Connect MetaMask
                    </Button>
                  ) : (
                    <Box>
                      <Alert
                        icon={<CheckCircle />}
                        severity="success"
                        sx={{
                          bgcolor: 'rgba(34, 197, 94, 0.1)',
                          color: '#86efac',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          mb: 3,
                          maxWidth: 500,
                          mx: 'auto'
                        }}
                      >
                        <Typography variant="body2">
                          Wallet Connected: {donationState.walletAddress.slice(0, 6)}...{donationState.walletAddress.slice(-4)}
                          <br />
                          Balance: {donationState.walletBalance} ETH
                        </Typography>
                      </Alert>
                    </Box>
                  )}

                  {donationState.error && (
                    <Alert severity="error" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
                      {donationState.error}
                    </Alert>
                  )}
                </Box>
              </Fade>
            )}
                        {/* Step 3: Review Details */}
                        {donationState.step === 3 && (
              <Fade in timeout={500}>
                <Box>
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>
                    Review Your Donation
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, bgcolor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2 }}>
                          Donation Details
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography sx={{ color: '#cbd5e1' }}>Amount:</Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                            {donationState.donationAmount} ETH
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography sx={{ color: '#cbd5e1' }}>Gas Fee (est):</Typography>
                          <Typography sx={{ color: '#fff' }}>~{donationState.gasEstimate} ETH</Typography>
                        </Box>
                        <Divider sx={{ my: 2, borderColor: 'rgba(148, 163, 184, 0.1)' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ color: '#cbd5e1', fontWeight: 600 }}>Total:</Typography>
                          <Typography sx={{ color: '#14b8a6', fontWeight: 700, fontSize: '1.2rem' }}>
                            {(parseFloat(donationState.donationAmount) + parseFloat(donationState.gasEstimate)).toFixed(4)} ETH
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, bgcolor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 2 }}>
                          Wallet Information
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            From:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                wordBreak: 'break-all'
                              }}
                            >
                              {donationState.walletAddress}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(donationState.walletAddress, 'from')}
                              sx={{ color: copiedField === 'from' ? '#14b8a6' : '#94a3b8' }}
                            >
                              {copiedField === 'from' ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            To:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                wordBreak: 'break-all'
                              }}
                            >
                              {nonprofit.walletAddress}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(nonprofit.walletAddress, 'to')}
                              sx={{ color: copiedField === 'to' ? '#14b8a6' : '#94a3b8' }}
                            >
                              {copiedField === 'to' ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                            </IconButton>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Current Balance:
                          </Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                            {donationState.walletBalance} ETH
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Alert
                    icon={<Security />}
                    severity="info"
                    sx={{
                      mt: 3,
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <Typography variant="body2">
                      <strong>🔒 Secure Transaction:</strong> Your donation will be processed directly on the Ethereum blockchain.
                      All transactions are transparent, immutable, and can be verified on Etherscan.
                    </Typography>
                  </Alert>

                  {donationState.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {donationState.error}
                    </Alert>
                  )}
                </Box>
              </Fade>
            )}
                        {/* Step 4: Processing */}
                        {donationState.step === 4 && (
              <Fade in timeout={500}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress
                    size={80}
                    sx={{
                      color: '#14b8a6',
                      mb: 3
                    }}
                  />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                    Processing Your Donation...
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
                    Please confirm the transaction in MetaMask and wait for blockchain confirmation.
                  </Typography>
                  <LinearProgress
                    sx={{
                      maxWidth: 400,
                      mx: 'auto',
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(148, 163, 184, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#14b8a6',
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block' }}>
                    This may take a few moments...
                  </Typography>
                </Box>
              </Fade>
            )}
                        {/* Step 5: Success */}
                        {donationState.step === 5 && (
              <Fade in timeout={500}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Celebration sx={{ fontSize: 100, color: '#14b8a6', mb: 3 }} />
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                    Donation Successful! 🎉
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 3 }}>
                    Thank you for your generous donation to {nonprofit.name}
                  </Typography>

                  {/* Fraud Detection Results */}
                  {donationState.backendResponse && (
                    <Box sx={{ mb: 3 }}>
                      {donationState.backendResponse.warning ? (
                        <Alert
                          severity="warning"
                          icon={<Warning />}
                          sx={{
                            maxWidth: 600,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: 'rgba(251, 146, 60, 0.1)',
                            color: '#fdba74',
                            border: '1px solid rgba(251, 146, 60, 0.3)'
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            ⚠️ Fraud Alert Detected
                          </Typography>
                          <Typography variant="body2">
                            Fraud Score: <strong>{donationState.backendResponse.fraudScore}</strong>
                          </Typography>
                          {donationState.backendResponse.riskFlags && donationState.backendResponse.riskFlags.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                Risk Flags:
                              </Typography>
                              {donationState.backendResponse.riskFlags.map((flag: string, idx: number) => (
                                <Chip
                                  key={idx}
                                  label={flag}
                                  size="small"
                                  sx={{
                                    m: 0.5,
                                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#fca5a5'
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                            This transaction has been flagged for admin review.
                          </Typography>
                        </Alert>
                      ) : (
                        <Alert
                          severity="success"
                          icon={<CheckCircle />}
                          sx={{
                            maxWidth: 600,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: 'rgba(34, 197, 94, 0.1)',
                            color: '#86efac',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <Typography variant="body2">
                            ✅ Transaction Verified - Fraud Score: {donationState.backendResponse.fraudScore}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}

                  <Paper
                    sx={{
                      p: 3,
                      maxWidth: 600,
                      mx: 'auto',
                      bgcolor: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ color: '#94a3b8' }}>Amount Donated:</Typography>
                          <Typography sx={{ color: '#14b8a6', fontWeight: 700 }}>
                            {donationState.donationAmount} ETH
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ color: '#94a3b8' }}>Transaction Hash:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem'
                              }}
                            >
                              {donationState.transactionHash.slice(0, 10)}...{donationState.transactionHash.slice(-8)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(donationState.transactionHash, 'hash')}
                              sx={{ color: copiedField === 'hash' ? '#14b8a6' : '#94a3b8' }}
                            >
                              {copiedField === 'hash' ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                            </IconButton>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Receipt />}
                          href={`https://etherscan.io/tx/${donationState.transactionHash}`}
                          target="_blank"
                          sx={{
                            borderColor: '#14b8a6',
                            color: '#14b8a6',
                            '&:hover': {
                              borderColor: '#0f766e',
                              bgcolor: 'rgba(20, 184, 166, 0.1)'
                            }
                          }}
                        >
                          View on Etherscan
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Favorite />}
                      onClick={() => navigate('/search')}
                      sx={{
                        bgcolor: '#14b8a6',
                        '&:hover': { bgcolor: '#0f766e' }
                      }}
                    >
                      Make Another Donation
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Timeline />}
                      onClick={() => navigate('/flagged-transactions')}
                      sx={{
                        borderColor: '#fb923c',
                        color: '#fb923c',
                        '&:hover': {
                          borderColor: '#ea580c',
                          bgcolor: 'rgba(251, 146, 60, 0.1)'
                        }
                      }}
                    >
                      View Flagged Transactions
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Share />}
                      sx={{
                        borderColor: '#94a3b8',
                        color: '#94a3b8',
                        '&:hover': {
                          borderColor: '#cbd5e1',
                          bgcolor: 'rgba(148, 163, 184, 0.1)'
                        }
                      }}
                    >
                      Share
                    </Button>
                  </Box>
                </Box>
              </Fade>
            )}
                        {/* Navigation Buttons */}
                        {donationState.step < 5 && donationState.step > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  onClick={handleBack}
                  disabled={donationState.isProcessing}
                  sx={{ color: '#94a3b8' }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={donationState.isProcessing || (donationState.step === 2 && !donationState.walletConnected)}
                  sx={{
                    bgcolor: '#14b8a6',
                    '&:hover': { bgcolor: '#0f766e' },
                    '&.Mui-disabled': { bgcolor: 'rgba(148, 163, 184, 0.2)', color: '#64748b' }
                  }}
                >
                  {donationState.step === 3 ? 'Confirm & Donate' : 'Continue'}
                </Button>
              </Box>
            )}

            {donationState.step === 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!donationState.donationAmount || parseFloat(donationState.donationAmount) <= 0}
                  sx={{
                    bgcolor: '#14b8a6',
                    '&:hover': { bgcolor: '#0f766e' },
                    '&.Mui-disabled': { bgcolor: 'rgba(148, 163, 184, 0.2)', color: '#64748b' }
                  }}
                >
                  Continue
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Donate;






  
  

  

