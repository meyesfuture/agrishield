import React, { createContext, useContext } from 'react';

interface AuthContextType {
  session: any;
  user: any;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: { demo: true },
  user: { email: 'analyst@agrishield.demo' },
  signOut: async () => {},
  loading: false,
});

// AUTH BYPASSED FOR DEMO — no Supabase dependency
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider value={{
      session: { demo: true },
      user: { email: 'analyst@agrishield.demo' },
      signOut: async () => {},
      loading: false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
