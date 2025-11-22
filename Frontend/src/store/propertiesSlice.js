import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

// Async thunks for properties
export const fetchAllProperties = createAsyncThunk(
  'properties/fetchAllProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.loadAllProperties();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchProperties = createAsyncThunk(
  'properties/searchProperties',
  async (searchData, { rejectWithValue }) => {
    try {
      const response = await api.searchProperty(searchData);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProperty = createAsyncThunk(
  'properties/fetchProperty',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await api.getProperty(propertyId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyProperties = createAsyncThunk(
  'properties/fetchMyProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.myProperties();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    allProperties: [],
    searchResults: [],
    currentProperty: null,
    myProperties: [],
    loading: false,
    searchLoading: false,
    error: null,
    searchError: null,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all properties
      .addCase(fetchAllProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.allProperties = action.payload;
      })
      .addCase(fetchAllProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Search properties
      .addCase(searchProperties.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
        state.searchResults = [];
      })
      // Fetch single property
      .addCase(fetchProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProperty = action.payload;
      })
      .addCase(fetchProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch my properties
      .addCase(fetchMyProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.myProperties = action.payload;
      })
      .addCase(fetchMyProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, clearCurrentProperty, clearError } = propertiesSlice.actions;
export default propertiesSlice.reducer;

