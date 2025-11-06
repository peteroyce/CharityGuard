import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Avatar,
  Divider,
  Pagination,
  CircularProgress,
  Fade,
  Grow,
  keyframes
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear,
  FilterList,
  Verified,
  LocationOn,
  Language,
  Star
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const matrixRain = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`;

const glitchText = keyframes`
  0%, 100% { text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 30px #00ff41; }
  50% { text-shadow: 0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 60px #00ff41; }
`;

interface Nonprofit {
  _id: string;
  id: string;
  name: string;
  ein: string;
  city: string;
  state: string;
  zip: string;
  category: string;
  trustScore: number;
  verificationStatus: 'verified' | 'pending';
  walletAddress: string;
  totalDonations: string;
  donorCount: number;
  description: string;
  website: string;
}

interface SearchResponse {
  success: boolean;
  data: Nonprofit[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    page: number;
    pages: number;
    hasMore: boolean;
  };
  performance: {
    queryTime: string;
    database: string;
    totalRecords: number;
  };
  error?: string;
  message?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const quickSearches = [
  { label: 'Church', icon: '⛪', color: '#14b8a6' },
  { label: 'Red Cross', icon: '❤️', color: '#ef4444' },
  { label: 'Cancer', icon: '🎗️', color: '#8b5cf6' },
  { label: 'Education', icon: '📚', color: '#3b82f6' },
  { label: 'Children', icon: '👶', color: '#ec4899' },
  { label: 'Food Bank', icon: '🍽️', color: '#10b981' },
  { label: 'Hospital', icon: '🏥', color: '#f59e0b' },
  { label: 'Environment', icon: '🌱', color: '#22c55e' },
  { label: 'Animals', icon: '🐾', color: '#a855f7' },
  { label: 'Veterans', icon: '🇺🇸', color: '#6366f1' }
];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const categories = [
  { name: 'Religion', icon: '⛪' },
  { name: 'Education', icon: '📚' },
  { name: 'Health', icon: '🏥' },
  { name: 'Human Services', icon: '🤝' },
  { name: 'Arts & Culture', icon: '🎨' },
  { name: 'Environment', icon: '🌱' },
  { name: 'Animal Welfare', icon: '🐾' },
  { name: 'International', icon: '🌍' },
  { name: 'Public Benefit', icon: '🏛️' },
  { name: 'Youth Development', icon: '👦' }
];

const RESULTS_PER_PAGE = 12;

const MatrixRain: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = 400;

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100;
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff41';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = matrix.charAt(Math.floor(Math.random() * matrix.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.8,
        zIndex: 0
      }}
    />
  );
};

const Search: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nonprofits, setNonprofits] = useState<Nonprofit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [queryTime, setQueryTime] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minTrustScore, setMinTrustScore] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const searchNonprofits = useCallback(async (query: string, currentPage: number = 1, state: string = '', category: string = '', trustScore: number = 0) => {
    if (!query.trim() && !state && !category) {
      setNonprofits([]);
      setTotalResults(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: RESULTS_PER_PAGE.toString(),
        skip: ((currentPage - 1) * RESULTS_PER_PAGE).toString(),
        sortBy: 'name'
      });

      if (state) params.append('state', state);
      if (category) params.append('category', category);
      if (trustScore > 0) params.append('minTrustScore', trustScore.toString());

      const response = await fetch(`${API_BASE_URL}/api/nonprofits/search?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setNonprofits(data.data);
        setTotalResults(data.pagination.total);
        setTotalPages(data.pagination.pages);
        setQueryTime(data.performance.queryTime);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search nonprofits. Please check your connection.');
      setNonprofits([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query?: string) => {
    const searchTerm = query ?? searchQuery;
    setPage(1);
    const newUrl = new URL(window.location.href);
    if (searchTerm) {
      newUrl.searchParams.set('q', searchTerm);
    } else {
      newUrl.searchParams.delete('q');
    }
    window.history.pushState({}, '', newUrl.toString());
    searchNonprofits(searchTerm, 1, selectedState, selectedCategory, minTrustScore);
  }, [searchQuery, selectedState, selectedCategory, minTrustScore, searchNonprofits]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    searchNonprofits(searchQuery, value, selectedState, selectedCategory, minTrustScore);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  const handleFilterChange = () => {
    setPage(1);
    searchNonprofits(searchQuery, 1, selectedState, selectedCategory, minTrustScore);
  };

  const clearFilters = () => {
    setSelectedState('');
    setSelectedCategory('');
    setMinTrustScore(0);
    setShowFilters(false);
  };

  const handleDonate = (nonprofit: Nonprofit) => {
    navigate('/donate', { 
      state: { 
        nonprofit: {
          id: nonprofit.id || nonprofit._id,
          name: nonprofit.name,
          ein: nonprofit.ein,
          city: nonprofit.city,
          state: nonprofit.state,
          zip: nonprofit.zip,
          category: nonprofit.category,
          trustScore: nonprofit.trustScore,
          walletAddress: nonprofit.walletAddress,
          description: nonprofit.description,
          website: nonprofit.website,
          totalDonations: nonprofit.totalDonations,
          donorCount: nonprofit.donorCount,
          verificationStatus: nonprofit.verificationStatus
        }
      } 
    });
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 95) return '#10b981';
    if (score >= 90) return '#10b981';  
    if (score >= 85) return '#059669';
    if (score >= 80) return '#eab308';
    if (score >= 75) return '#f59e0b';
    if (score >= 70) return '#ea580c';
    return '#dc2626';
  };

  const getOrgAvatar = (name: string) => {
    const initials = name.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    const colors = ['#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444'];
    const colorIndex = name.length % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      pt: 0,
      pb: 8
    }}>
      {/* MATRIX HERO SECTION */}
      <Box sx={{
        width: '100%',
        background: '#000000',
        py: 10,
        mb: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
      }}>
        <MatrixRain />

        <Box sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
          zIndex: 1
        }} />

        <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto', px: 3, position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              color: '#00ff41', 
              fontWeight: 900,
              fontSize: { xs: '2.5rem', md: '4rem' },
              mb: 3,
              fontFamily: '"Courier New", monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              animation: `${glitchText} 2s ease-in-out infinite`,
              textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 30px #00ff41, 0 0 40px #00ff41'
            }}
          >
            Find Your Cause
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#00ff41', 
              fontWeight: 500,
              fontSize: { xs: '1rem', md: '1.5rem' },
              lineHeight: 1.8,
              fontFamily: '"Courier New", monospace',
              textShadow: '0 0 5px #00ff41, 0 0 10px #00ff41',
              opacity: 0.9,
              letterSpacing: '0.05em'
            }}
          >
            Discover and support <span style={{ fontWeight: 700, color: '#00ff41' }}>559,125+</span> verified nonprofits with complete blockchain transparency
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* DARK SEARCH CARD */}
        <Card sx={{ 
          mb: 6, 
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          boxShadow: '0 25px 80px rgba(20, 184, 166, 0.2)'
        }}>
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by charity name, location, EIN, or cause..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: 4,
                    fontSize: '1.2rem',
                    height: '70px',
                    border: '2px solid rgba(20, 184, 166, 0.3)',
                    '&:hover': {
                      borderColor: '#14b8a6',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    },
                    '&.Mui-focused': {
                      borderColor: '#14b8a6',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: '#94a3b8',
                      opacity: 1
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#14b8a6', fontSize: 28 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="large">
                        <Clear sx={{ color: '#94a3b8' }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                variant="contained"
                onClick={() => handleSearch()}
                disabled={loading}
                sx={{
                  minWidth: 160,
                  height: 70,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  boxShadow: '0 10px 30px rgba(20, 184, 166, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    boxShadow: '0 15px 40px rgba(20, 184, 166, 0.6)',
                  }
                }}
              >
                {loading ? <CircularProgress size={32} color="inherit" /> : 'Search'}
              </Button>

              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  backgroundColor: '#14b8a6',
                  color: 'white',
                  height: 70,
                  width: 70,
                  '&:hover': {
                    backgroundColor: '#0d9488',
                  }
                }}
              >
                <FilterList sx={{ fontSize: 28 }} />
              </IconButton>
            </Box>

            {/* DARK POPULAR SEARCHES */}
            <Box sx={{ mb: showFilters ? 4 : 0 }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                🔥 Popular Searches
              </Typography>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                gap: 2
              }}>
                {quickSearches.map((item) => (
                  <Card
                    key={item.label}
                    onClick={() => handleQuickSearch(item.label)}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7))',
                      border: `2px solid ${item.color}60`,
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.03)',
                        boxShadow: `0 12px 30px ${item.color}40`,
                        border: `2px solid ${item.color}`,
                        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))`
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ fontSize: '2.5rem', mb: 1 }}>{item.icon}</Box>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 700, 
                        color: item.color,
                        fontSize: '0.95rem'
                      }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* DARK ADVANCED FILTERS */}
            <Collapse in={showFilters}>
              <Box sx={{ 
                mt: 4, 
                p: 5, 
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                border: '1px solid rgba(20, 184, 166, 0.3)'
              }}>
                <Typography variant="h5" sx={{ color: '#ffffff', mb: 4, fontWeight: 700 }}>
                  🎯 Advanced Filters
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel 
                        shrink
                        sx={{ 
                          color: '#94a3b8', 
                          fontSize: '1.1rem',
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          px: 1,
                          '&.Mui-focused': {
                            color: '#14b8a6'
                          }
                        }}
                      >
                        State
                      </InputLabel>
                      <Select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: 'rgba(15, 23, 42, 0.98)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(20, 184, 166, 0.3)',
                              maxHeight: 300,
                              '& .MuiMenuItem-root': {
                                color: '#ffffff',
                                fontSize: '1rem',
                                '&:hover': {
                                  backgroundColor: 'rgba(20, 184, 166, 0.2)'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(20, 184, 166, 0.3)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(20, 184, 166, 0.4)'
                                  }
                                }
                              }
                            }
                          }
                        }}
                        sx={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: 3,
                          height: 60,
                          fontSize: '1.1rem',
                          color: '#ffffff',
                          '& .MuiSelect-select': {
                            color: '#ffffff',
                            fontWeight: 500,
                            backgroundColor: 'transparent'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(20, 184, 166, 0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#14b8a6'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#14b8a6'
                          },
                          '& .MuiSelect-icon': {
                            color: '#14b8a6'
                          }
                        }}
                      >
                        <MenuItem value="">All States</MenuItem>
                        {states.map((state) => (
                          <MenuItem key={state} value={state}>{state}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel 
                        shrink
                        sx={{ 
                          color: '#94a3b8', 
                          fontSize: '1.1rem',
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          px: 1,
                          '&.Mui-focused': {
                            color: '#14b8a6'
                          }
                        }}
                      >
                        Category
                      </InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: 'rgba(15, 23, 42, 0.98)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(20, 184, 166, 0.3)',
                              maxHeight: 300,
                              '& .MuiMenuItem-root': {
                                color: '#ffffff',
                                fontSize: '1rem',
                                '&:hover': {
                                  backgroundColor: 'rgba(20, 184, 166, 0.2)'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(20, 184, 166, 0.3)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(20, 184, 166, 0.4)'
                                  }
                                }
                              }
                            }
                          }
                        }}
                        sx={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: 3,
                          height: 60,
                          fontSize: '1.1rem',
                          color: '#ffffff',
                          '& .MuiSelect-select': {
                            color: '#ffffff',
                            fontWeight: 500
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(20, 184, 166, 0.3)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#14b8a6'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#14b8a6'
                          },
                          '& .MuiSelect-icon': {
                            color: '#14b8a6'
                          }
                        }}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.name} value={category.name}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <span style={{ fontSize: '18px' }}>{category.icon}</span>
                              <span>{category.name}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Typography sx={{ color: '#ffffff', mb: 3, fontWeight: 600, fontSize: '1.1rem' }}>
                      Min Trust Score: {minTrustScore}%
                    </Typography>
                    <Slider
                      value={minTrustScore}
                      onChange={(e, value) => setMinTrustScore(value as number)}
                      min={0}
                      max={100}
                      step={5}
                      sx={{ 
                        color: '#14b8a6',
                        height: 8,
                        '& .MuiSlider-thumb': {
                          boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)',
                          width: 24,
                          height: 24
                        },
                        '& .MuiSlider-markLabel': {
                          color: '#94a3b8'
                        }
                      }}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 50, label: '50%' },
                        { value: 100, label: '100%' }
                      ]}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      <Button
                        onClick={handleFilterChange}
                        variant="contained"
                        sx={{ 
                          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                          fontWeight: 700,
                          borderRadius: 3,
                          height: 50,
                          fontSize: '1rem'
                        }}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        onClick={clearFilters}
                        variant="outlined"
                        sx={{ 
                          color: '#14b8a6',
                          borderColor: '#14b8a6',
                          fontWeight: 600,
                          borderRadius: 3,
                          height: 50,
                          '&:hover': {
                            borderColor: '#0d9488',
                            backgroundColor: 'rgba(20, 184, 166, 0.1)'
                          }
                        }}
                      >
                        Clear All
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* RESULTS HEADER */}
        {(nonprofits.length > 0 || totalResults > 0) && !loading && (
          <Card sx={{ 
            mb: 5, 
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            boxShadow: '0 15px 50px rgba(20, 184, 166, 0.15)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
                🎯 Found {totalResults.toLocaleString()} verified nonprofits
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>
              {queryTime && (
                <Typography variant="h6" sx={{ color: '#94a3b8' }}>
                  ⚡ Search completed in {queryTime} • Database: MongoDB Atlas
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* RESULTS GRID */}
        {nonprofits.length > 0 && (
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {nonprofits.map((nonprofit, index) => {
              const avatar = getOrgAvatar(nonprofit.name);

              return (
                <Grid item xs={12} sm={6} lg={4} key={nonprofit._id || nonprofit.id}>
                  <Grow in={true} timeout={800 + index * 150}>
                    <Card sx={{ 
                      height: '100%',
                      borderRadius: 5,
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(20, 184, 166, 0.2)',
                      boxShadow: '0 20px 60px rgba(45, 55, 72, 0.12)',
                      transition: 'all 0.4s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-15px) scale(1.02)',
                        boxShadow: '0 35px 90px rgba(20, 184, 166, 0.25)',
                        border: '1px solid rgba(20, 184, 166, 0.5)'
                      }
                    }}>
                      <Box sx={{ 
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: getTrustScoreColor(nonprofit.trustScore),
                        color: 'white',
                        px: 2.5,
                        py: 1,
                        borderRadius: '15px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        zIndex: 10,
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: '2px solid rgba(15, 23, 42, 0.9)'
                      }}>
                        <Star sx={{ fontSize: 18 }} />
                        {nonprofit.trustScore}/100
                      </Box>

                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                          <Avatar sx={{ 
                            width: 70, 
                            height: 70, 
                            mr: 2.5,
                            background: `linear-gradient(135deg, ${avatar.color}, ${avatar.color}95)`,
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            border: '3px solid rgba(20, 184, 166, 0.3)'
                          }}>
                            {avatar.initials}
                          </Avatar>

                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="h5" component="h3" sx={{ 
                              fontWeight: 700, 
                              color: '#ffffff',
                              lineHeight: 1.3,
                              mb: 1
                            }}>
                              {nonprofit.name}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: '#94a3b8',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              fontWeight: 600
                            }}>
                              EIN: {nonprofit.ein}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<Verified />}
                            label="IRS Verified"
                            size="medium"
                            sx={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                          <Chip 
                            label={nonprofit.category}
                            size="medium"
                            sx={{ 
                              background: 'linear-gradient(135deg, #14b8a6, #0d9488)', 
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <LocationOn sx={{ fontSize: 20, mr: 1.5, color: '#14b8a6' }} />
                          <Typography variant="body1" sx={{ 
                            color: '#cbd5e1',
                            fontWeight: 500 
                          }}>
                            {nonprofit.city}, {nonprofit.state} {nonprofit.zip}
                          </Typography>
                        </Box>

                        <Typography variant="body1" sx={{ 
                          color: '#cbd5e1',
                          mb: 3,
                          lineHeight: 1.6
                        }}>
                          {nonprofit.description}
                        </Typography>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 3,
                          p: 3,
                          background: 'rgba(15, 23, 42, 0.7)',
                          borderRadius: 3,
                          border: '1px solid rgba(20, 184, 166, 0.2)'
                        }}>
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800, 
                              color: '#10b981',
                              mb: 0.5
                            }}>
                              ${nonprofit.totalDonations}M
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                              Total Raised
                            </Typography>
                          </Box>

                          <Divider orientation="vertical" flexItem sx={{ mx: 2, borderColor: 'rgba(20, 184, 166, 0.2)' }} />

                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800, 
                              color: '#14b8a6',
                              mb: 0.5
                            }}>
                              {nonprofit.donorCount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                              Donors
                            </Typography>
                          </Box>
                        </Box>

                        {nonprofit.website && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Language sx={{ fontSize: 18, mr: 1.5, color: '#14b8a6' }} />
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#14b8a6',
                                textDecoration: 'none',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              component="a"
                              href={nonprofit.website.startsWith('http') ? nonprofit.website : `https://${nonprofit.website}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Visit Official Website →
                            </Typography>
                          </Box>
                        )}

                        <Button
                          fullWidth
                          variant="contained"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDonate(nonprofit);
                          }}
                          sx={{
                            mt: 'auto',
                            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            py: 2,
                            textTransform: 'none',
                            boxShadow: '0 10px 30px rgba(20, 184, 166, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 15px 40px rgba(20, 184, 166, 0.5)'
                            }
                          }}
                        >
                          🎁 Donate Now
                        </Button>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Card sx={{
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              p: 3
            }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    border: '1px solid rgba(20, 184, 166, 0.3)',
                    '&.Mui-selected': {
                      backgroundColor: '#14b8a6',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    }
                  }
                }}
              />
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Search;

