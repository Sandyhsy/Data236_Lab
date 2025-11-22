import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import propertiesReducer from './propertiesSlice';
import bookingsReducer from './bookingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    bookings: bookingsReducer,
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Type definitions for TypeScript (if needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

