export const isTestEmail = (email: string) => {
  const localPart = email.split("@")[0].toLowerCase();
  return localPart.includes("pavelmolodecfda") || localPart.includes("test");
};