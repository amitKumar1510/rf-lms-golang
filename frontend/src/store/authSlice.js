import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authService from "../admin/services/authService";

const initialState = {
  status: "idle", // idle | loading | succeeded | failed
  hydrateStatus: "idle", // idle | loading | succeeded | failed
  error: null,
  hydrateError: null,
  accessToken: localStorage.getItem("access_token") || null,
  user: null,
};

export const loginThunk = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    const data = await authService.login({ email, password });
    // Save token, then fetch current user (cookie or bearer both work)
    const me = await authService.me();
    return { ...data, me };
  } catch (err) {
    const msg = err?.response?.data?.detail || err?.message || "Login failed";
    return rejectWithValue(msg);
  }
});

export const hydrateThunk = createAsyncThunk("auth/hydrate", async (_, { rejectWithValue }) => {
  try {
    const me = await authService.me();
    return me;
  } catch (err) {
    // Not logged-in is a normal case; keep it as rejected with no noisy error
    const msg = err?.response?.data?.detail || err?.message || "Not authenticated";
    return rejectWithValue(msg);
  }
});

export const logoutThunk = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    return true;
  } catch (err) {
    const msg = err?.response?.data?.detail || err?.message || "Logout failed";
    return rejectWithValue(msg);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
      state.user = null;
      localStorage.removeItem("access_token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.accessToken = action.payload?.access_token || null;
        if (state.accessToken) localStorage.setItem("access_token", state.accessToken);
        state.user = action.payload?.me || null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed";
      });

    builder
      .addCase(hydrateThunk.pending, (state) => {
        state.hydrateStatus = "loading";
        state.hydrateError = null;
      })
      .addCase(hydrateThunk.fulfilled, (state, action) => {
        state.hydrateStatus = "succeeded";
        state.hydrateError = null;
        state.user = action.payload || null;
      })
      .addCase(hydrateThunk.rejected, (state, action) => {
        state.hydrateStatus = "failed";
        state.hydrateError = action.payload || "Not authenticated";
        state.user = null;
      });

    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
        state.error = null;
        localStorage.removeItem("access_token");
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        // Still clear local state on logout failure (cookie may already be gone)
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
        state.error = action.payload || "Logout failed";
        localStorage.removeItem("access_token");
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;


