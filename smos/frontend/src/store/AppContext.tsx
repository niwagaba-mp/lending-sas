import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import api, { isDemoMode } from '../services/api';
import { DEMO_USER, DEMO_TOKEN } from '../services/mockData';

interface User {
  id: string; first_name: string; last_name: string; email: string;
  role: string; tenant_id: string; branch_id: string;
  branch_name: string; tenant_name: string; currency: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  loading: boolean;
  sidebarOpen: boolean;
  demoMode: boolean;
}

type Action =
  | { type: 'SET_USER'; payload: { user: User; token: string; demo?: boolean } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' };

const initialState: AppState = {
  user: null,
  token: localStorage.getItem('smos_token'),
  loading: true,
  sidebarOpen: true,
  demoMode: isDemoMode(),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false, demoMode: action.payload.demo ?? false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false, demoMode: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // If demo mode is stored, restore demo session without hitting backend
    if (isDemoMode()) {
      const storedUser = localStorage.getItem('smos_user');
      const user = storedUser ? JSON.parse(storedUser) : DEMO_USER;
      dispatch({ type: 'SET_USER', payload: { user, token: DEMO_TOKEN, demo: true } });
      return;
    }

    const token = localStorage.getItem('smos_token');
    if (token) {
      api.me()
        .then((res: any) => dispatch({ type: 'SET_USER', payload: { user: res.data, token, demo: false } }))
        .catch(() => {
          localStorage.removeItem('smos_token');
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await api.login(email, password);
    localStorage.setItem('smos_token', res.data.accessToken);
    localStorage.setItem('smos_refresh', res.data.refreshToken);
    localStorage.setItem('smos_user', JSON.stringify(res.data.user));
    const demo = isDemoMode();
    dispatch({ type: 'SET_USER', payload: { user: res.data.user, token: res.data.accessToken, demo } });
  };

  const logout = () => {
    const refresh = localStorage.getItem('smos_refresh') || '';
    api.logout(refresh).catch(() => {});
    localStorage.removeItem('smos_token');
    localStorage.removeItem('smos_refresh');
    localStorage.removeItem('smos_user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

// Formatting helpers
export const fmt = {
  currency: (v: number | string, curr = 'UGX') =>
    `${curr} ${Number(v || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`,
  date: (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—',
  pct: (v: number) => `${Number(v || 0).toFixed(1)}%`,
  num: (v: number) => Number(v || 0).toLocaleString(),
};
