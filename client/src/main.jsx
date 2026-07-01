import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import App from './App';
import './index.css';
import { persistor, store } from './redux/store';
import { signOutSuccess } from './redux/user/userSlice';
import { setSessionExpiredHandler } from './api/client';

// If the refresh token is also expired, log the user out in the UI
setSessionExpiredHandler(() => store.dispatch(signOutSuccess()));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
