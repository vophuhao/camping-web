// import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
// import type { User } from '../types/user';
// import { authApi } from '../services/api/auth';

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   error: string | null;
//   login: (emailOrUsername: string, password: string) => Promise<void>;
//   loginWithOAuth: (token: string, userData: any) => Promise<void>;
//   register: (userData: { name: string; username: string; email: string; password: string }) => Promise<void>;
//   logout: () => void;
//   updateUser: (userData: Partial<User>) => void;
//   checkAuth: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(() => {
//     // Khôi phục user từ localStorage khi khởi tạo
//     const savedUser = localStorage.getItem('user');
//     return savedUser ? JSON.parse(savedUser) as any : null;
//   });
//   const [loading, setLoading] = useState(false); // Đổi thành false mặc định
//   const [error, setError] = useState<string | null>(null);

//   const checkAuth = useCallback(async () => {
//     try {
//       const accessToken = localStorage.getItem('accessToken');
//       const refreshToken = localStorage.getItem('refreshToken');
      
//       if (accessToken && refreshToken) {
//         try {
//           const userData = await authApi.getCurrentUser();
//           setUser(userData.user as any);
//           localStorage.setItem('user', JSON.stringify(userData.user));
//         } catch (err) {
//           // Nếu access token hết hạn, thử refresh
//           try {
//             const { accessToken: newAccessToken, user } = await authApi.refreshToken(refreshToken);
//             localStorage.setItem('accessToken', newAccessToken);
//             setUser(user as any);
//             localStorage.setItem('user', JSON.stringify(user));
//           } catch (refreshErr) {
//             // Refresh thất bại, logout
//             localStorage.removeItem('accessToken');
//             localStorage.removeItem('refreshToken');
//             localStorage.removeItem('user');
//             setUser(null);
//           }
//         }
//       }
//     } catch (err) {
//       console.error('Auth check failed:', err);
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('user');
//       setUser(null);
//     }
//   }, []);

//   useEffect(() => {
//     checkAuth();
//   }, []); // Chỉ chạy một lần khi mount

//   const login = async (emailOrUsername: string, password: string) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const { accessToken, refreshToken, user: userData } = await authApi.login(emailOrUsername, password);
//       localStorage.setItem('accessToken', accessToken);
//       localStorage.setItem('refreshToken', refreshToken);
//       // Immediately fetch the freshest user profile to ensure avatarUrl and other fields are up-to-date
//       try {
//         const fresh = await authApi.getCurrentUser();
//         localStorage.setItem('user', JSON.stringify(fresh.user));
//         setUser(fresh.user as any);
//       } catch (_) {
//         localStorage.setItem('user', JSON.stringify(userData));
//         setUser(userData as any);
//       }
//     } catch (err: any) {
//       // Backend trả về error trong errorData.error hoặc errorData.message
//       const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Đăng nhập thất bại';
//       setError(errorMsg);
//       throw err; // Re-throw để LoginPage có thể xử lý chi tiết
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loginWithOAuth = useCallback(async (token: string, userData: any) => {
//     try {
//       // Prevent double execution in StrictMode and remove noisy logs
//       if (localStorage.getItem('accessToken') === token) {
//         setUser(userData as any);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       // OAuth vẫn sử dụng token cũ cho tương thích
//       localStorage.setItem('accessToken', token);
//       localStorage.setItem('user', JSON.stringify(userData));
//       setUser(userData as any);
//     } catch (err: any) {
//       console.error('loginWithOAuth error:', err);
//       setError('OAuth đăng nhập thất bại');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const register = async (userData: { name: string; username: string; email: string; password: string }) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const { accessToken, refreshToken, user: userResponse } = await authApi.register(userData);
//       localStorage.setItem('accessToken', accessToken);
//       localStorage.setItem('refreshToken', refreshToken);
//       localStorage.setItem('user', JSON.stringify(userResponse));
//       setUser(userResponse as any);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Đăng ký thất bại');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = useCallback(async () => {
//     try {
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (refreshToken) {
//         await authApi.logout(refreshToken);
//       }
//     } catch (err) {
//       console.error('Logout error:', err);
//     } finally {
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('user');
//       setUser(null);
//     }
//   }, []);

//   const updateUser = useCallback((userData: Partial<User>) => {
//     setUser(prev => {
//       if (!prev) return null;
//       const updatedUser = { ...prev, ...userData } as any;
//       localStorage.setItem('user', JSON.stringify(updatedUser));
//       return updatedUser;
//     });
//   }, []);

//   const value = {
//     user,
//     loading,
//     error,
//     login,
//     loginWithOAuth,
//     register,
//     logout,
//     updateUser,
//     checkAuth,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }; 