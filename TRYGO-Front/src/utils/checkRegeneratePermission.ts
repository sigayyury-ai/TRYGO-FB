/**
 * Check if user has permission to see regenerate forms
 * Only users with emails containing "sigayyury" or "pavelmolodecfda" (case insensitive) can see regenerate forms
 */
export const checkRegeneratePermission = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  return emailLower.includes("sigayyury") || emailLower.includes("pavelmolodecfda");
};
