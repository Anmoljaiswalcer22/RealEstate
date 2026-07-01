import { createSlice } from '@reduxjs/toolkit';

// Only the public profile is kept here. The JWT itself lives in an
// httpOnly cookie that JavaScript can't read.
const initialState = { currentUser: null };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.currentUser = action.payload;
    },
    signOutSuccess(state) {
      state.currentUser = null;
    },
  },
});

export const { setUser, signOutSuccess } = userSlice.actions;
export default userSlice.reducer;
