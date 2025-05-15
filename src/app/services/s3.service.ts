import { Injectable } from '@angular/core';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: environment.aws.region,
      credentials: {
        accessKeyId: environment.aws.accessKeyId,
        secretAccessKey: environment.aws.secretAccessKey
      }
    });
  }

  private async fileToBuffer(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Failed to convert file to buffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async uploadVideo(file: File): Promise<string> {
    const key = `videos/${Date.now()}-${file.name}`;
    const fileBuffer = await this.fileToBuffer(file);
    
    const command = new PutObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type
    });

    try {
      await this.s3Client.send(command);
      return key;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  async uploadThumbnail(file: File): Promise<string> {
    const key = `thumbnails/${Date.now()}-${file.name}`;
    const fileBuffer = await this.fileToBuffer(file);
    
    const command = new PutObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type
    });

    try {
      await this.s3Client.send(command);
      return key;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  }

  async getVideoUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: key
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error getting video URL:', error);
      throw error;
    }
  }

  async getThumbnailUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: environment.aws.bucketName,
      Key: key
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error getting thumbnail URL:', error);
      throw error;
    }
  }
} 