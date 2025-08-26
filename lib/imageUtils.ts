export const getProfileImageUrl = (picture: string | undefined | null): string => {
  if (!picture) return '/default-avatar.png';

  // If it's already a full HTTPS URL (Google avatar, etc.)
  if (picture.startsWith('https')) {
    return picture;
  }

  // Use the base URL for your application
  const baseUrl = 'https://pulse.great-site.net/Google_signup';

  // Check if the picture is a local file path or just a filename
  if (picture.includes('/') || picture.includes('\\')) {
    return `${baseUrl}/${picture}`;
  } else {
    return `${baseUrl}/uploads/${picture}`;
  }
};