import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './user/userSlice';

const rootReducer = combineReducers({ user: userReducer });

// Keeps the logged-in user after a page refresh
const persistedReducer = persistReducer({ key: 'root', storage, version: 1 }, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
});

export const persistor = persistStore(store);
