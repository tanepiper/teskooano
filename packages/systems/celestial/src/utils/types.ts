export interface TextureProgressEventDetail {
  objectId: string;
  objectName: string;
  status: "pending" | "generating" | "cached" | "complete" | "error";
  message?: string;
}
