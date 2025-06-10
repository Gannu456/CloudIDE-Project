import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   user: null,
//   token: null,
//   loading: false
// };

const loadInitialState = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    return {
      token: storedToken || null,
      user: storedUser ? JSON.parse(storedUser) : null,
      loading: false,
    };
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setToken: (state, action) => {
        state.token = action.payload;
        localStorage.setItem('token', action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    resetLoading: (state) => {
        state.loading = false;
    },
    setlogout: (state) => {
        state.token = null;
        state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
  }
});

export const { setToken, setUser, setLoading, resetLoading, setlogout } = authSlice.actions;
export default authSlice.reducer;