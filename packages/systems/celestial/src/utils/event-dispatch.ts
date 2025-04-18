import { TextureProgressEventDetail } from './types'; // Assuming types.ts is created

export function dispatchTextureProgress(
  objectId: string, 
  objectName: string, 
  status: TextureProgressEventDetail['status'], 
  message?: string
): void {
  const detail: TextureProgressEventDetail = { objectId, objectName, status, message };
  document.dispatchEvent(new CustomEvent('texture-progress', { detail }));
}

export function dispatchTextureGenerationComplete(success: boolean, errorCount: number = 0): void {
  document.dispatchEvent(new CustomEvent('texture-generation-complete', { 
    detail: { success, errorCount } 
  }));
} 