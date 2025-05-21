import { Injectable } from '@angular/core';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { environment } from '../../environments/environment';
import { VideoMetadataService, VideoMetadata } from './video-metadata.service';

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private s3Client: S3Client;

  constructor(private metadataService: VideoMetadataService) {
    this.s3Client = new S3Client({
      region: environment.aws.region,
      credentials: {
        accessKeyId: environment.aws.accessKeyId,
        secretAccessKey: environment.aws.secretAccessKey
      }
    });
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(Buffer.from(reader.result));
        } else {
          reject(new Error('Failed to convert file to buffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async uploadVideo(file: File, metadata: {
    title: string;
    description: string;
    artist: string;
    coverArtist: string;
    trimStart?: number;
    trimEnd?: number;
    duration?: number;
  }): Promise<VideoMetadata> {
    const videoId = `vid-${Date.now()}`;
    const videoKey = `videos/${videoId}/${file.name}`;
    
    try {
      // Convert file to buffer
      const fileBuffer = await this.fileToBuffer(file);
      
      // Upload the file to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: environment.aws.bucketName,
          Key: videoKey,
          Body: fileBuffer,
          ContentType: file.type,
          // Add metadata in S3 object for trim points if available
          Metadata: {
            ...(metadata.trimStart !== undefined ? { 'trim-start': String(metadata.trimStart) } : {}),
            ...(metadata.trimEnd !== undefined ? { 'trim-end': String(metadata.trimEnd) } : {}),
            ...(metadata.duration !== undefined ? { 'duration': String(metadata.duration) } : {})
          }
        })
      );

      // Create metadata entry with a placeholder thumbnail key
      const videoMetadata = await this.metadataService.addVideo({
        id: videoId,
        title: metadata.title,
        description: metadata.description,
        artist: metadata.artist,
        coverArtist: metadata.coverArtist,
        uploadDate: Date.now(),
        s3Key: videoKey,
        thumbnailKey: `thumbnails/${videoId}/${file.name.replace('.mp4', '.jpg')}` // Set a placeholder key
      });

      return videoMetadata;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  async uploadThumbnail(file: File, videoId: string): Promise<string> {
    const thumbnailKey = `thumbnails/${videoId}/${file.name}`;
    const fileBuffer = await this.fileToBuffer(file);
    
    const command = new PutObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: thumbnailKey,
      Body: fileBuffer,
      ContentType: file.type
    });

    try {
      await this.s3Client.send(command);
      
      // Update the video metadata with the new thumbnail key
      await this.metadataService.updateThumbnailKey(videoId, thumbnailKey);
      
      return thumbnailKey;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  }

  async getVideoUrl(key: string): Promise<string> {
    if (!key || key.trim() === '') {
      console.error('Empty video key provided');
      return '';
    }

    const command = new GetObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: key,
      ResponseCacheControl: 'max-age=86400',
      ResponseContentDisposition: `inline; filename="${key.split('/').pop()}"`,
      ResponseContentType: 'video/mp4'
    });

    try {
      console.log('Getting signed URL for video:', key);
      const url = await getSignedUrl(this.s3Client, command, { 
        expiresIn: 86400 // 24 hours
      });
      console.log('Successfully generated signed URL for video:', key);
      return url;
    } catch (error) {
      console.error('Error getting video URL for key:', key, error);
      return '';
    }
  }

  async getThumbnailUrl(key: string): Promise<string> {
    if (!key || key.trim() === '') {
      console.error('Empty thumbnail key provided');
      return 'assets/thumbnails/default.jpg';
    }

    const command = new GetObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: key
    });

    try {
      console.log('Getting signed URL for thumbnail:', key);
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      console.log('Successfully generated signed URL for thumbnail:', key);
      return url;
    } catch (error) {
      console.error('Error getting thumbnail URL for key:', key, error);
      return 'assets/thumbnails/default.jpg';
    }
  }

  async listVideos(): Promise<VideoMetadata[]> {
    // Get all video metadata
    const allVideos = await this.metadataService.getAllVideos();
    console.log('Retrieved video metadata:', allVideos);
    
    // For each video, get the current signed URLs
    const videosWithUrls = await Promise.all(
      allVideos.map(async (video) => {
        console.log('Processing video:', video.id);
        let videoUrl = '';
        let thumbnailUrl = 'assets/thumbnails/default.jpg';
        
        // Get video URL
        if (video.s3Key && video.s3Key.trim() !== '') {
          try {
            videoUrl = await this.getVideoUrl(video.s3Key);
          } catch (error) {
            console.error('Error getting video URL for video:', video.id, error);
          }
        }
        
        // Get thumbnail URL
        if (video.thumbnailKey && video.thumbnailKey.trim() !== '') {
          try {
            thumbnailUrl = await this.getThumbnailUrl(video.thumbnailKey);
          } catch (error) {
            console.warn('Error getting thumbnail URL for video:', video.id, error);
          }
        }
        
        console.log('Processed video:', video.id, { videoUrl, thumbnailUrl });
        return {
          ...video,
          videoUrl,
          thumbnailUrl
        };
      })
    );

    return videosWithUrls;
  }
} 