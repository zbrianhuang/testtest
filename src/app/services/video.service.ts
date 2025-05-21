import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private ffmpeg = new FFmpeg();
  private isFFmpegLoaded = false;

  constructor() {
    this.loadFFmpeg();
  }

  checkIfCrossOriginIsolated(): boolean {
    return window.crossOriginIsolated === true;
  }

  private async loadFFmpeg() {
    if (!this.isFFmpegLoaded) {
      // Load ffmpeg with the correct base URL
      await this.ffmpeg.load({
        coreURL: await toBlobURL('/assets/ffmpeg/core/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('/assets/ffmpeg/core/ffmpeg-core.wasm', 'application/wasm'),
      });
      this.isFFmpegLoaded = true;
    }
  }

  async stitchVideos(videos: File[]): Promise<Blob> {
    await this.loadFFmpeg();
    
    // Write each video file to FFmpeg's virtual filesystem
    for (let i = 0; i < videos.length; i++) {
      const fileName = `input${i}.mp4`;
      const arrayBuffer = await videos[i].arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await this.ffmpeg.writeFile(fileName, uint8Array);
    }

    // Create a concat demuxer file
    let concatContent = '';
    for (let i = 0; i < videos.length; i++) {
      concatContent += `file 'input${i}.mp4'\n`;
    }
    await this.ffmpeg.writeFile('concat_list.txt', new TextEncoder().encode(concatContent));

    // Run FFmpeg command to concatenate videos
    await this.ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c', 'copy',
      'output.mp4'
    ]);

    // Read the output file
    const data = await this.ffmpeg.readFile('output.mp4');

    // Clean up files
    for (let i = 0; i < videos.length; i++) {
      await this.ffmpeg.deleteFile(`input${i}.mp4`);
    }
    await this.ffmpeg.deleteFile('concat_list.txt');
    await this.ffmpeg.deleteFile('output.mp4');

    // Return the stitched video as a Blob
    return new Blob([data], { type: 'video/mp4' });
  }
} 