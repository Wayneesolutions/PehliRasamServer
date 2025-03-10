const getImageUrl = (fileName) => {
    if (!fileName) return null;
  
    const isDev = process.env.NODE_ENV === "development";
  
    if (isDev) {
      return `http://localhost:8098/uploads/${fileName}`; // Local URL for dev
    }
  
    const S3_BUCKET = process.env.S3_BUCKET_NAME;
    const S3_REGION = process.env.S3_REGION; // Example: us-east-1
  
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileName}`;
  };
  
  module.exports = getImageUrl;
  