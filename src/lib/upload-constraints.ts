export const IMAGE_UPLOAD_MAX_MB = 20;
export const IMAGE_UPLOAD_MAX_BYTES = IMAGE_UPLOAD_MAX_MB * 1024 * 1024;

export function isImageUploadWithinLimit(fileSize: number) {
  return fileSize <= IMAGE_UPLOAD_MAX_BYTES;
}

export function getImageUploadSizeError(fileName: string, fileSize: number) {
  if (isImageUploadWithinLimit(fileSize)) {
    return null;
  }

  const displayName = fileName.trim() || "图片文件";
  return `${displayName} 超过 ${IMAGE_UPLOAD_MAX_MB}MB，请压缩后再上传。`;
}
