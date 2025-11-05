import { getOptimizedImageUrl } from './cloudinary'

/**
 * Get profile image URL with fallback to user_icon.png (preserves original quality)
 * @param {string} profileImageUrl - The user's profile image URL from database
 * @param {boolean} preserveOriginal - Whether to preserve original quality (default: true)
 * @returns {string} - The profile image URL or fallback image
 */
export const getProfileImageUrl = (profileImageUrl, preserveOriginal = true) => {
  if (profileImageUrl && profileImageUrl.trim() !== '') {
    // Return original image URL without any transformations to preserve quality
    if (preserveOriginal) {
      return profileImageUrl
    }
    // Only apply transformations if specifically requested (for navbar avatars)
    return getOptimizedImageUrl(profileImageUrl, { width: 40, height: 40 })
  }
  return '/images/user_icon.png'
}

/**
 * Get profile image for avatar display (original quality, no compression)
 * @param {string} profileImageUrl - The user's profile image URL from database
 * @returns {string} - Original quality profile image URL or fallback
 */
export const getAvatarImageUrl = (profileImageUrl) => {
  if (profileImageUrl && profileImageUrl.trim() !== '') {
    return profileImageUrl // Return original image without any transformations
  }
  return '/images/user_icon.png'
}

/**
 * Get profile image for profile page display (original quality)
 * @param {string} profileImageUrl - The user's profile image URL from database
 * @returns {string} - Original quality profile image URL or fallback
 */
export const getProfilePageImageUrl = (profileImageUrl) => {
  return getProfileImageUrl(profileImageUrl, true) // Preserve original quality
}
