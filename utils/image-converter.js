const axios = require("axios");
const { getFirebaseBucket } = require("../lib/firebase");

async function facebookImageToOpenAIContent(fbUrl, accessToken) {
  // Download image with axios as arraybuffer
  const res = await axios.get(`${fbUrl}&access_token=${accessToken}`, {
    responseType: "arraybuffer",
  });

  // Convert to base64 directly
  const base64 = Buffer.from(res.data, "binary").toString("base64");

  // Return object ready for OpenAI messages
  return {
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${base64}` },
  };
}

async function uploadFacebookImageToFirebase(fbUrl, accessToken) {
  try {
    // Download image from Facebook
    const response = await axios.get(`${fbUrl}&access_token=${accessToken}`, {
      responseType: "arraybuffer",
    });

    // Get image buffer
    const imageBuffer = Buffer.from(response.data);
    
    // Determine file extension from URL or content type
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 
                     contentType.includes('webp') ? 'webp' : 'jpg';
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `facebook-images/${timestamp}.${extension}`;
    
    // Upload to Firebase Storage
    const bucket = getFirebaseBucket();
    const file = bucket.file(filename);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: contentType,
      },
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    // Return the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    return publicUrl;
    
  } catch (error) {
    console.error("Error uploading Facebook image to Firebase:", error);
    throw error;
  }
}

module.exports = { facebookImageToOpenAIContent, uploadFacebookImageToFirebase };
