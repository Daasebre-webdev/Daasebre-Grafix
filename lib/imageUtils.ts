export const getProfileImageUrl = (picture: string | undefined | null): string => {
  if (!picture) return '/default-avatar.png';
  
  // If it's already a full URL (Google avatar, etc.)
  if (picture.startsWith('http')) {
    return picture;
  }
  
  // For production - use your InfinityFree domain
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost/Google_signup';
  
  // Check if the picture is a local file path or just a filename
  if (picture.includes('/') || picture.includes('\\')) {
    return `${baseUrl}/${picture}`;
  } else {
    return `${baseUrl}/uploads/${picture}`;
  }
};