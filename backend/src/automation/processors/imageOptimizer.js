const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const axios = require('axios')

// Save logos to frontend/public/logos directory to serve them statically and use 0 MongoDB space
const logoDir = path.resolve(__dirname, '..', '..', '..', '..', 'frontend', 'public', 'logos')

async function optimizeAndSaveLogo(logoUrl, slug) {
  if (!logoUrl) return ''

  try {
    // Ensure logoDir exists
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true })
    }

    const localFileName = `${slug}.webp`
    const localFilePath = path.join(logoDir, localFileName)
    const relativeWebPath = `/logos/${localFileName}`

    // 1. Handle base64 logo data
    if (logoUrl.startsWith('data:image/')) {
      const match = logoUrl.match(/^data:image\/(\w+);base64,/)
      if (!match) return ''
      
      const base64Data = logoUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      await sharp(buffer)
        .resize(120, 120, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(localFilePath)

      return relativeWebPath
    }

    // 2. Handle remote URL
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      const response = await axios.get(logoUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })

      const buffer = Buffer.from(response.data)

      await sharp(buffer)
        .resize(120, 120, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(localFilePath)

      return relativeWebPath
    }

    return logoUrl // Return raw url if it is not base64 or standard http link
  } catch (error) {
    console.warn(`[Image Optimizer] Failed to optimize logo for ${slug}:`, error.message)
    // Fallback: If local file write fails (e.g. read-only system), return original URL to ensure functionality
    return logoUrl.startsWith('data:image/') ? '' : logoUrl
  }
}

module.exports = {
  optimizeAndSaveLogo
}
