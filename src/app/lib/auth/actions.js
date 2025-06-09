// Token management
export const setTokens = (adminAccessToken, adminRefreshToken) => {
    localStorage.setItem('adminAccessToken', adminAccessToken);
    localStorage.setItem('adminRefreshToken', adminRefreshToken);
};

export const getAccessToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminAccessToken');
  }
  return null;
};

export const removeTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
  }
};

// Session validation (for server components)
// export const validateSession = async () => {
//   try {
//     const res = await fetch(`${process.env.BACKEND_URL}/auth/validate`, {
//       credentials: 'include',
//     });
//     return res.ok;
//   } catch {
//     return false;
//   }
// };