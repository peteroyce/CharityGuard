import React, { useState, useCallback } from 'react';
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
  Star,
  FavoriteRounded
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Gradient background animation keyframes
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// TypeScript interfaces
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
  { label: 'Church', icon: '⛪', color: '#8B7355' },
  { label: 'Red Cross', icon: '❤️', color: '#dc2626' },
  { label: 'Cancer', icon: '🎗️', color: '#7c3aed' },
  { label: 'Education', icon: '📚', color: '#6366f1' },
  { label: 'Children', icon: '👶', color: '#a855f7' },
  { label: 'Food Bank', icon: '🍽️', color: '#10b981' },
  { label: 'Hospital', icon: '🏥', color: '#dc2626' },
  { label: 'Environment', icon: '🌱', color: '#10b981' },
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

const Search: React.FC = () => {
  const navigate = useNavigate();

  // State variables
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

  // Fetch nonprofits from API
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
    const colors = ['#6366f1', '#7c3aed', '#a855f7', '#4f46e5', '#8b5cf6', '#d946ef', '#6366f1', '#7c3aed', '#a855f7', '#4338ca'];
    const colorIndex = name.length % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#18181b',
      pt: 0,
      pb: 8
    }}>
      {/* Blue Header Section - EXACT COLOR FROM IMAGE 1 */}
      <Box sx={{
        width: '100%',
        backgroundColor: '#0000ff',
        py: 8,
        mb: 6
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 900, mx: 'auto', px: 3 }}>
          <Typography variant="h1" component="h1" sx={{ 
            color: 'white', 
            fontWeight: 800,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            mb: 2
          }}>
            Find Your Cause
          </Typography>
          <Typography variant="h5" sx={{ 
            color: 'white', 
            fontWeight: 400,
            fontSize: { xs: '1.1rem', md: '1.35rem' },
            lineHeight: 1.6
          }}>
            Discover and support 559,125+ verified nonprofits with complete blockchain transparency
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* Search Card */}
        <Card sx={{ 
          mb: 6, 
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.15)'
        }}>
          <CardContent sx={{ p: 5 }}>
            {/* Search Bar */}
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
                    backgroundColor: '#ffffff',
                    borderRadius: 4,
                    fontSize: '1.2rem',
                    height: '70px',
                    border: '2px solid #e2e8f0',
                    '&:hover': {
                      borderColor: '#6366f1',
                      backgroundColor: '#ffffff',
                    },
                    '&.Mui-focused': {
                      borderColor: '#6366f1',
                      backgroundColor: '#ffffff',
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#1e293b',
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    '&::placeholder': {
                      color: '#64748b',
                      opacity: 1
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748b', fontSize: 28 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="large">
                        <Clear sx={{ color: '#64748b' }} />
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
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                    boxShadow: '0 15px 40px rgba(99, 102, 241, 0.6)',
                  }
                }}
              >
                {loading ? <CircularProgress size={32} color="inherit" /> : 'Search'}
              </Button>

              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  backgroundColor: '#6366f1',
                  color: 'white',
                  height: 70,
                  width: 70,
                  '&:hover': {
                    backgroundColor: '#4f46e5',
                  }
                }}
              >
                <FilterList sx={{ fontSize: 28 }} />
              </IconButton>
            </Box>

            {/* Quick Searches */}
            <Box sx={{ mb: showFilters ? 4 : 0 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', mb: 3, fontWeight: 700 }}>
                🔥 Popular Searches:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {quickSearches.map((item) => (
                  <Chip
                    key={item.label}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>{item.label}</span>
                      </Box>
                    }
                    onClick={() => handleQuickSearch(item.label)}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                      color: 'white',
                      cursor: 'pointer',
                      border: 'none',
                      py: 2,
                      px: 1,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Advanced Filters */}
            <Collapse in={showFilters}>
              <Box sx={{ 
                mt: 4, 
                p: 5, 
                backgroundColor: '#f8f9fa',
                borderRadius: 4,
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="h5" sx={{ color: '#1e293b', mb: 4, fontWeight: 700 }}>
                  🎯 Advanced Filters
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: '#64748b', 
                        fontSize: '1.1rem',
                        '&.Mui-focused': {
                          color: '#6366f1'
                        }
                      }}>
                        State
                      </InputLabel>
                      <Select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        sx={{ 
                          backgroundColor: '#ffffff',
                          borderRadius: 3,
                          height: 60,
                          fontSize: '1.1rem',
                          '& .MuiSelect-select': {
                            color: '#1e293b',
                            fontWeight: 500,
                            backgroundColor: '#ffffff'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e2e8f0'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: '#ffffff',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                              border: '1px solid #e2e8f0',
                              borderRadius: 2,
                              '& .MuiMenuItem-root': {
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontWeight: 500,
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: '#6366f1',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: '#4f46e5'
                                  }
                                }
                              }
                            }
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
                      <InputLabel sx={{ 
                        color: '#64748b', 
                        fontSize: '1.1rem',
                        '&.Mui-focused': {
                          color: '#6366f1'
                        }
                      }}>
                        Category
                      </InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        sx={{ 
                          backgroundColor: '#ffffff',
                          borderRadius: 3,
                          height: 60,
                          fontSize: '1.1rem',
                          '& .MuiSelect-select': {
                            color: '#1e293b',
                            backgroundColor: '#ffffff'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e2e8f0'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: '#ffffff',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                              border: '1px solid #e2e8f0',
                              borderRadius: 2,
                              '& .MuiMenuItem-root': {
                                color: '#1e293b',
                                fontSize: '1rem',
                                fontWeight: 500,
                                '&:hover': {
                                  backgroundColor: '#f1f5f9'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: '#6366f1',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: '#4f46e5'
                                  }
                                }
                              }
                            }
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
                    <Typography sx={{ color: '#1e293b', mb: 3, fontWeight: 600, fontSize: '1.1rem' }}>
                      Min Trust Score: {minTrustScore}%
                    </Typography>
                    <Slider
                      value={minTrustScore}
                      onChange={(e, value) => setMinTrustScore(value as number)}
                      min={0}
                      max={100}
                      step={5}
                      sx={{ 
                        color: '#6366f1',
                        height: 8,
                        '& .MuiSlider-thumb': {
                          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                          width: 24,
                          height: 24
                        },
                        '& .MuiSlider-markLabel': {
                          color: '#64748b',
                          fontWeight: 500
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
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          fontWeight: 700,
                          borderRadius: 3,
                          height: 50,
                          fontSize: '1rem',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                          }
                        }}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        onClick={clearFilters}
                        variant="outlined"
                        sx={{ 
                          color: '#6366f1',
                          borderColor: '#6366f1',
                          fontWeight: 600,
                          borderRadius: 3,
                          height: 50,
                          fontSize: '1rem',
                          '&:hover': {
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(99, 102, 241, 0.05)'
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

        {/* Results Header */}
        {(nonprofits.length > 0 || totalResults > 0) && !loading && (
          <Card sx={{ 
            mb: 5, 
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 15px 50px rgba(0,0,0,0.1)'
            }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 800, mb: 1 }}>
                🎯 Found {totalResults.toLocaleString()} verified nonprofits
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>
              {queryTime && (
                <Typography variant="h6" sx={{ color: '#64748b' }}>
                  ⚡ Search completed in {queryTime} • Database: MongoDB Atlas
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
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
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 20px 60px rgba(45, 55, 72, 0.12)',
                      transition: 'all 0.4s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-15px) scale(1.02)',
                        boxShadow: '0 35px 90px rgba(45, 55, 72, 0.25)',
                      }
                    }}>
                      {/* Trust Score */}
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
                        border: '2px solid white'
                      }}>
                        <Star sx={{ fontSize: 18 }} />
                        {nonprofit.trustScore}/100
                      </Box>

                      <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                          <Avatar sx={{ 
                            width: 70, 
                            height: 70, 
                            mr: 2.5,
                            background: `linear-gradient(135deg, ${avatar.color}, ${avatar.color}95)`,
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            border: '3px solid rgba(255,255,255,0.9)'
                          }}>
                            {avatar.initials}
                          </Avatar>

                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="h5" component="h3" sx={{ 
                              fontWeight: 700, 
                              color: '#1e293b',
                              lineHeight: 1.3,
                              mb: 1
                            }}>
                              {nonprofit.name}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: '#64748b',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              fontWeight: 600
                            }}>
                              EIN: {nonprofit.ein}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Badges */}
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
                              background: 'linear-gradient(135deg, #7c3aed, #a855f7)', 
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </Box>

                        {/* Location */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <LocationOn sx={{ fontSize: 20, mr: 1.5, color: '#64748b' }} />
                          <Typography variant="body1" sx={{ 
                            color: '#475569',
                            fontWeight: 500 
                          }}>
                            {nonprofit.city}, {nonprofit.state} {nonprofit.zip}
                          </Typography>
                        </Box>

                        {/* Description */}
                        <Typography variant="body1" sx={{ 
                          color: '#475569',
                          mb: 3,
                          lineHeight: 1.6
                        }}>
                          {nonprofit.description}
                        </Typography>

                        {/* Stats */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 3,
                          p: 3,
                          background: '#f8f9fa',
                          borderRadius: 3,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800, 
                              color: '#10b981',
                              mb: 0.5
                            }}>
                              ${nonprofit.totalDonations}M
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Total Raised
                            </Typography>
                          </Box>

                          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                          <Box sx={{ textAlign: 'center', flex: 1 }}>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 800, 
                              color: '#6366f1',
                              mb: 0.5
                            }}>
                              {nonprofit.donorCount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Donors
                            </Typography>
                          </Box>
                        </Box>

                        {/* Website */}
                        {nonprofit.website && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Language sx={{ fontSize: 18, mr: 1.5, color: '#6366f1' }} />
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#6366f1',
                                textDecoration: 'none',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' }
                              }}
                              component="a"
                              href={nonprofit.website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Visit Official Website →
                            </Typography>
                          </Box>
                        )}

                        {/* Donate Button */}
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDonate(nonprofit);
                          }}
                          startIcon={<FavoriteRounded />}
                          sx={{
                            mt: 'auto',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            py: 2,
                            textTransform: 'none',
                            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                            }
                          }}
                        >
                          💝 Donate Now
                        </Button>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Card sx={{
              borderRadius: 4,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              p: 3
            }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    backgroundColor: '#f8f9fa',
                    color: '#1e293b',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    border: '1px solid #e2e8f0',
                    '&.Mui-selected': {
                      backgroundColor: '#6366f1',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                    },
                    '&:hover': {
                      backgroundColor: '#e2e8f0',
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
