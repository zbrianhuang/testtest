import { Injectable } from '@angular/core';
import { MongoDBService } from './mongodb.service';

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  artist: string;
  coverArtist: string;
  sheetMusicName?: string;
  uploadDate: number;
  likes: number;
  views: number;
  s3Key: string;
  thumbnailKey: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoMetadataService {
  constructor(private mongoService: MongoDBService) {}

  async addVideo(metadata: Omit<VideoMetadata, 'likes' | 'views'>): Promise<VideoMetadata> {
    return this.mongoService.addVideo(metadata);
  }

  async updateThumbnailKey(videoId: string, thumbnailKey: string): Promise<void> {
    await this.mongoService.updateThumbnailKey(videoId, thumbnailKey);
  }

  async getVideo(id: string): Promise<VideoMetadata | null> {
    return this.mongoService.getVideo(id);
  }

  async getAllVideos(): Promise<VideoMetadata[]> {
    return this.mongoService.getAllVideos();
  }

  async incrementLikes(id: string): Promise<number> {
    return this.mongoService.incrementLikes(id);
  }

  async incrementViews(id: string): Promise<number> {
    return this.mongoService.incrementViews(id);
  }

  async getTrendingVideos(limit: number = 5): Promise<VideoMetadata[]> {
    return this.mongoService.getTrendingVideos(limit);
  }

  async getRecentVideos(): Promise<VideoMetadata[]> {
    return this.mongoService.getRecentVideos();
  }

  async getPopularVideos(limit: number = 5): Promise<VideoMetadata[]> {
    return this.mongoService.getPopularVideos(limit);
  }
} 