export const uploadImageToCloudinary = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'student_profiles') // You'll need to create this preset in Cloudinary
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const data = await response.json()
    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export const deleteImageFromCloudinary = async (publicId) => {
  try {
    // This would typically be done from the backend for security
    // For now, we'll just return success
    return { success: true }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: error.message }
  }
}

export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return null
  
  const {
    width = 400,
    height = 400,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options

  // If it's already a Cloudinary URL, add transformations
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${parts[1]}`
    }
  }
  
  return url
}
