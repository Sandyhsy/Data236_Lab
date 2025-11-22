import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

// Helper function to convert date strings to milliseconds for sorting
function toMillis(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(value);
  const ms = parsed.getTime();
  return Number.isNaN(ms) ? fallback : ms;
}

// Async thunks for bookings
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getbookings();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBookingStatus = createAsyncThunk(
  'bookings/fetchBookingStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getbookingStatus();
      return {
        pendingRequests: Array.isArray(response?.pendingRequests) ? response.pendingRequests : [],
        acceptedRequests: Array.isArray(response?.acceptedRequests) ? response.acceptedRequests : [],
        canceledRequests: Array.isArray(response?.canceledRequests) ? response.canceledRequests : [],
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.createBooking(bookingData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const acceptBooking = createAsyncThunk(
  'bookings/acceptBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.acceptBooking(bookingId);
      return { bookingId, response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.cancelBooking(bookingId);
      return { bookingId, response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'bookings/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.myfavorites();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addFavorite = createAsyncThunk(
  'bookings/addFavorite',
  async ({ property_id, user_id }, { rejectWithValue }) => {
    try {
      const response = await api.addFavorite(property_id, user_id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    pendingRequests: [],
    acceptedRequests: [],
    canceledRequests: [],
    favorites: [],
    loading: false,
    error: null,
    createBookingLoading: false,
    createBookingError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createBookingError = null;
    },
    // Combine bookings for concierge view
    getCombinedBookings: (state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter pending requests to only show today onwards
      const pending = state.pendingRequests.filter(b => {
        if (!b.start_date) return false;
        const startDate = new Date(b.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate >= today;
      });

      // Sort bookings by start date
      const acceptedSorted = [...state.acceptedRequests].sort(
        (a, b) =>
          toMillis(a?.start_date ?? a?.startDate, Number.MAX_SAFE_INTEGER) -
          toMillis(b?.start_date ?? b?.startDate, Number.MAX_SAFE_INTEGER)
      );
      const pendingSorted = pending.sort(
        (a, b) =>
          toMillis(a?.start_date ?? a?.startDate, Number.MAX_SAFE_INTEGER) -
          toMillis(b?.start_date ?? b?.startDate, Number.MAX_SAFE_INTEGER)
      );
      const historySorted = [...state.bookings].sort(
        (a, b) =>
          toMillis(a?.start_date ?? a?.startDate, 0) -
          toMillis(b?.start_date ?? b?.startDate, 0)
      );

      // Combine unique bookings
      const seen = new Set();
      const combined = [];
      const pushUnique = (arr) => {
        arr.forEach((booking) => {
          const key = booking?.booking_id ?? booking?.id;
          if (!key || seen.has(key)) return;
          seen.add(key);
          combined.push(booking);
        });
      };

      pushUnique(acceptedSorted);
      pushUnique(pendingSorted);
      pushUnique(historySorted);
      pushUnique(state.canceledRequests);

      return combined;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch booking status
      .addCase(fetchBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRequests = action.payload.pendingRequests;
        state.acceptedRequests = action.payload.acceptedRequests;
        state.canceledRequests = action.payload.canceledRequests;
      })
      .addCase(fetchBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.createBookingLoading = true;
        state.createBookingError = null;
      })
      .addCase(createBooking.fulfilled, (state) => {
        state.createBookingLoading = false;
        state.createBookingError = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.createBookingLoading = false;
        state.createBookingError = action.payload;
      })
      // Accept booking
      .addCase(acceptBooking.fulfilled, (state, action) => {
        const bookingId = action.payload.bookingId;
        // Move from pending to accepted
        const booking = state.pendingRequests.find(b => 
          (b.booking_id ?? b.id) === bookingId
        );
        if (booking) {
          state.pendingRequests = state.pendingRequests.filter(b => 
            (b.booking_id ?? b.id) !== bookingId
          );
          state.acceptedRequests.push(booking);
        }
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const bookingId = action.payload.bookingId;
        // Move from pending to canceled
        const booking = state.pendingRequests.find(b => 
          (b.booking_id ?? b.id) === bookingId
        );
        if (booking) {
          state.pendingRequests = state.pendingRequests.filter(b => 
            (b.booking_id ?? b.id) !== bookingId
          );
          state.canceledRequests.push(booking);
        }
      })
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add favorite
      .addCase(addFavorite.fulfilled, (state) => {
        // Optionally refresh favorites after adding
      });
  },
});

export const { clearError, getCombinedBookings } = bookingsSlice.actions;
export default bookingsSlice.reducer;

