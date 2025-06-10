import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome
import { configureStore } from "@reduxjs/toolkit";
import { Toaster } from "react-hot-toast";
import rootReducer from "./reducer";

const store = configureStore({
  reducer: rootReducer,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster />
    </Provider>
  </React.StrictMode>
);
