import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { VideoMetadata } from './video-metadata.service';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MongoDBService {
  private apiUrl = environment.apiUrl; // Make sure to add this to your environment.ts

  constructor(private http: HttpClient) {}

  // Create a new video entry
  async addVideo(metadata: Omit<VideoMetadata, 'likes' | 'views'>): Promise<VideoMetadata> {
    const response = await firstValueFrom(
      this.http.post<VideoMetadata>(`${this.apiUrl}/videos`, {
        ...metadata,
        likes: 0,
        views: 0
      })
    );
    if (!response) throw new Error('Failed to add video');
    return response;
  }

  // Update an existing video
  async updateVideo(id: string, updates: Partial<VideoMetadata>): Promise<VideoMetadata> {
    const response = await firstValueFrom(
      this.http.put<VideoMetadata>(`${this.apiUrl}/videos/${id}`, updates)
    );
    if (!response) throw new Error('Failed to update video');
    return response;
  }

  // Get all videos
  async getAllVideos(): Promise<VideoMetadata[]> {
    const response = await firstValueFrom(
      this.http.get<VideoMetadata[]>(`${this.apiUrl}/videos`)
    );
    return response || [];
  }

  // Get a single video by ID
  async getVideo(id: string): Promise<VideoMetadata | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<VideoMetadata>(`${this.apiUrl}/videos/${id}`)
      );
      return response || null;
    } catch (error) {
      console.error('Error fetching video:', error);
      return null;
    }
  }

  // Update thumbnail key for a video
  async updateThumbnailKey(videoId: string, thumbnailKey: string): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${this.apiUrl}/videos/${videoId}`, { thumbnailKey })
    );
  }

  // Increment likes for a video
  async incrementLikes(id: string): Promise<number> {
    const response = await firstValueFrom(
      this.http.post<{ likes: number }>(`${this.apiUrl}/videos/${id}/like`, {})
    );
    if (!response) throw new Error('Failed to increment likes');
    return response.likes;
  }

  // Increment views for a video
  async incrementViews(id: string): Promise<number> {
    const response = await firstValueFrom(
      this.http.post<{ views: number }>(`${this.apiUrl}/videos/${id}/view`, {})
    );
    if (!response) throw new Error('Failed to increment views');
    return response.views;
  }

  // Get trending videos
  async getTrendingVideos(limit: number = 5): Promise<VideoMetadata[]> {
    const response = await firstValueFrom(
      this.http.get<VideoMetadata[]>(`${this.apiUrl}/videos/trending?limit=${limit}`)
    );
    return response || [];
  }

  // Get recent videos
  async getRecentVideos(): Promise<VideoMetadata[]> {
    const response = await firstValueFrom(
      this.http.get<VideoMetadata[]>(`${this.apiUrl}/videos/recent`)
    );
    return response || [];
  }

  // Get popular videos
  async getPopularVideos(limit: number = 5): Promise<VideoMetadata[]> {
    const response = await firstValueFrom(
      this.http.get<VideoMetadata[]>(`${this.apiUrl}/videos/popular?limit=${limit}`)
    );
    return response || [];
  }
} 