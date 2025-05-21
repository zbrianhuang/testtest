import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
<<<<<<< Updated upstream
  appId: 'io.ionic.starter',
  appName: 'testtest',
  webDir: 'www',
  plugins: {
    Camera: {
      ios: {
        usesCamera: true,
        usesGallery: true,
        usesVideoCamera: true,
        usesAudio: true
      }
    },
    Permissions: {
      ios: {
        camera: 'This app needs camera access to record videos.',
        microphone: 'This app needs microphone access to record audio.'
      }
    }
  },
  server: {
    androidScheme: 'https'
  }
=======
  appId: 'com.hanweicarlao.musicapp',
  appName: 'MusicApp',
  webDir: 'www'
>>>>>>> Stashed changes
};

export default config;
