/**
 * Gets the content type (MIME type) based on the file format.
 * @param fileFormat - The file extension (e.g., 'jpg', 'jpeg', 'png', etc.).
 * @returns The corresponding MIME type or `null` if the format is not recognized.
 */

export const getContentType = (fileFormat: string): string | null => {
    const mimeTypes: { [key: string]: string } = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        bmp: 'image/bmp',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        tiff: 'image/tiff',
        ico: 'image/x-icon',
    };

    const normalizedFormat = fileFormat.trim().toLowerCase();
    return mimeTypes[normalizedFormat] || null;
};
