import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_charity",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_charityName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_charityEIN",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_fraudScore",
        "type": "uint256"
      }
    ],
    "name": "makeDonation",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalDonations",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface BlockchainStats {
  totalDonations: number;
  totalAmount: string;
}

interface TransactionResponse {
  hash: string;
  wait: () => Promise<any>;
}

export const useBlockchain = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeProvider = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider();
      
      if (ethereumProvider && CONTRACT_ADDRESS) {
        const ethersProvider = new ethers.BrowserProvider(ethereumProvider as any);
        setProvider(ethersProvider);
        
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          ethersProvider
        );
        setContract(contractInstance);
        
        // Check if already connected
        try {
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setIsConnected(true);
          }
        } catch (e) {
          // Not connected yet
        }
      } else {
        setError('MetaMask not found or contract address not configured');
      }
    } catch (err: any) {
      setError('Failed to initialize blockchain provider');
      console.error('Blockchain initialization error:', err);
    }
  };

  const connectWallet = async () => {
    if (!provider) {
      await initializeProvider();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await window.ethereum?.request({ method: 'eth_requestAccounts' });
      
      const signer = await provider.getSigner();
      const userAccount = await signer.getAddress();
      
      setAccount(userAccount);
      setIsConnected(true);

      await switchToSepolia();
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: ['https://sepolia.etherscan.io/'],
          }],
        });
      }
    }
  };

  const makeDonation = async (
    charityAddress: string,
    charityName: string,
    charityEIN: string,
    amount: string,
    fraudScore: number
  ): Promise<TransactionResponse> => {
    if (!provider || !contract || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer) as ethers.Contract;
      
      const amountInWei = ethers.parseEther(amount);
      const fraudScorePercent = Math.round(fraudScore * 100);

      // Type assertion to access makeDonation method
      const tx = await (contractWithSigner as any).makeDonation(
        charityAddress,
        charityName,
        charityEIN,
        fraudScorePercent,
        { value: amountInWei }
      );

      return { hash: tx.hash, wait: () => tx.wait() };
    } catch (err: any) {
      throw new Error(err.message || 'Transaction failed');
    }
  };

  const getTotalStats = async (): Promise<BlockchainStats | null> => {
    if (!contract) return null;

    try {
      const totalDonations = await (contract as any).getTotalDonations();
      const totalAmount = await (contract as any).getTotalAmount();
      
      return {
        totalDonations: Number(totalDonations),
        totalAmount: ethers.formatEther(totalAmount)
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  };

  useEffect(() => {
    initializeProvider();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsConnected(false);
        } else {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    account,
    isConnected,
    isLoading,
    error,
    connectWallet,
    makeDonation,
    getTotalStats,
    switchToSepolia
  };
};

declare global {
  interface Window {
    ethereum?: any;
  }
}