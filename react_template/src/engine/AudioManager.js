// src/engine/AudioManager.js
import { Howl, Howler } from 'howler';

// Audio Manager for managing game sounds and music
export class AudioManager {
  constructor() {
    this.sounds = new Map();  // Sound effects
    this.music = new Map();   // Background music
    this.soundVolume = 0.7;
    this.musicVolume = 0.4;
    this.isMuted = false;
    this.currentMusic = null;
    this.maxAttempts = 3;     // 最大重试次数
    this.isInitialized = false;
    
    // Define audio file paths
    this.audioFiles = {
      // Music
      main_theme: '/assets/audio/music/main_theme.mp3',
      space_ambient: '/assets/audio/music/space_ambient.mp3',
      battle_theme: '/assets/audio/music/battle_theme.mp3',
      
      // Sound effects
      button_click: '/assets/audio/sfx/button_click.mp3',
      alert: '/assets/audio/sfx/alert.mp3',
      engine_hum: '/assets/audio/sfx/engine_hum.mp3',
      resource_collected: '/assets/audio/sfx/resource_collected.mp3',
      laser_shot: '/assets/audio/sfx/laser_shot.mp3',
      explosion: '/assets/audio/sfx/explosion.mp3',
      shield_hit: '/assets/audio/sfx/shield_hit.mp3',
      warp_drive: '/assets/audio/sfx/warp_drive.mp3',
      upgrade_complete: '/assets/audio/sfx/upgrade_complete.mp3'
    };
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      // 延迟初始化，只在首次用户交互后加载
      this.loadPlaceholderSounds();
      
      // 设置全局错误处理
      Howler.autoUnlock = true;
      Howler.html5PoolSize = 30;  // 增加池大小以避免耗尽警告
      
      this.isInitialized = true;
      console.log('AudioManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioManager', error);
    }
    
    return this;
  }

  /**
   * Resume audio playback - for use after user interaction
   * Alias for resumeAll() for backward compatibility
   */
  resumeAudio() {
    this.resumeAll();
    return true;
  }

  // 加载空音频作为占位符，避免第一次用户交互前资源未加载的问题
  loadPlaceholderSounds() {
    // Create base64 encoded silent mp3 for placeholder
    const silentMp3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eN3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3//////////////////////////8AAAAExTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxAANCAad2AQACVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

    // 减少预加载的音效数量，只加载最关键的音效
    const criticalSounds = ['button_click', 'alert'];
    criticalSounds.forEach(id => {
      if (!this.sounds.has(id)) {
        try {
          const sound = new Howl({
            src: [silentMp3],
            volume: this.soundVolume,
            preload: true,
            html5: true, // 使用HTML5Audio减少Web Audio节点的使用
            pool: 5 // 增加音频池大小
          });
          this.sounds.set(id, sound);
        } catch (error) {
          console.warn(`Failed to load placeholder sound: ${id}`, error);
        }
      }
    });
    
    // 只预加载主要音乐轨道
    const mainMusic = 'main_theme';
    if (!this.music.has(mainMusic)) {
      try {
        const music = new Howl({
          src: [silentMp3],
          volume: this.musicVolume,
          loop: true,
          html5: true, 
          pool: 2
        });
        this.music.set(mainMusic, music);
      } catch (error) {
        console.warn(`Failed to load placeholder music: ${mainMusic}`, error);
      }
    }
  }
  
  // 预加载多个音效，可用于加载场景特定的音效
  preloadSounds(soundIds) {
    if (!Array.isArray(soundIds) || soundIds.length === 0) return;
    
    try {
      soundIds.forEach(id => {
        if (!this.sounds.has(id) && this.audioFiles[id]) {
          this.loadSound(id, this.audioFiles[id]);
        }
      });
    } catch (error) {
      console.error('Error preloading sounds', error);
    }
  }
  
  // 预加载多个音乐轨道
  preloadMusic(musicIds) {
    if (!Array.isArray(musicIds) || musicIds.length === 0) return;
    
    try {
      musicIds.forEach(id => {
        if (!this.music.has(id) && this.audioFiles[id]) {
          // 静默加载音乐轨道，不播放
          const music = new Howl({
            src: [this.audioFiles[id]],
            volume: 0,
            preload: true,
            html5: true,
            pool: 1
          });
          this.music.set(id, music);
        }
      });
    } catch (error) {
      console.error('Error preloading music', error);
    }
  }
  
  loadSound(id, path, attempts = 0) {
    if (attempts >= this.maxAttempts) {
      console.error(`Failed to load sound after ${attempts} attempts: ${id}`);
      return null;
    }
    
    try {
      const sound = new Howl({
        src: [path],
        volume: this.soundVolume,
        onloaderror: (soundId, error) => {
          console.warn(`Error loading sound ${id}, retrying...`, error);
          // 重试加载
          setTimeout(() => {
            this.loadSound(id, path, attempts + 1);
          }, 500);
        }
      });
      
      this.sounds.set(id, sound);
      return sound;
    } catch (error) {
      console.error(`Error creating Howl object: ${id}`, error);
      return null;
    }
  }
  
  loadMusic(id, path) {
    if (this.music.has(id)) return this.music.get(id);
    
    try {
      const musicTrack = new Howl({
        src: [path],
        volume: this.musicVolume,
        loop: true,
        html5: true,
        // Add error handling
        onloaderror: () => {
          console.warn(`Failed to load music: ${id} from path: ${path}`);
        }
      });
      
      this.music.set(id, musicTrack);
      return musicTrack;
    } catch (error) {
      console.error(`Error loading music: ${id}`, error);
      return null;
    }
  }
  
  playSound(id, volume = 1.0) {
    if (this.isMuted) return null;
    
    try {
      let sound = this.sounds.get(id);
      
      // Load sound if it doesn't exist
      if (!sound) {
        const path = this.audioFiles[id];
        if (!path) {
          console.warn(`Sound '${id}' not found in audio files`);
          return null;
        }
        sound = this.loadSound(id, path);
        if (!sound) return null;
      }
      
      // 防止过多播放同一音效
      if (sound.playing() && sound._sounds.length > 5) {
        console.warn(`Too many instances of sound: ${id} already playing`);
        return null;
      }
      
      // Play sound with adjusted volume
      const soundId = sound.play();
      sound.volume(volume * this.soundVolume, soundId);
      
      return soundId;
    } catch (error) {
      console.error(`Error playing sound: ${id}`, error);
      return null;
    }
  }
  
  playMusic(id, fadeTime = 1000) {
    if (this.isMuted) return null;
    
    try {
      // Stop current music with fade out if playing
      if (this.currentMusic) {
        const current = this.music.get(this.currentMusic);
        if (current && current.playing()) {
          current.fade(current.volume(), 0, fadeTime);
          setTimeout(() => current.stop(), fadeTime);
        }
      }
      
      let music = this.music.get(id);
      
      // Load music if it doesn't exist
      if (!music) {
        const path = this.audioFiles[id];
        if (!path) {
          console.warn(`Music '${id}' not found in audio files`);
          return null;
        }
        
        try {
          music = new Howl({
            src: [path],
            volume: 0,
            loop: true,
            html5: true,
            pool: 1,
            onloaderror: (soundId, error) => {
              console.error(`Failed to load music: ${id}`, error);
            }
          });
          this.music.set(id, music);
        } catch (error) {
          console.error(`Error creating music Howl: ${id}`, error);
          return null;
        }
      }
      
      // Play and fade in
      music.volume(0);
      const musicId = music.play();
      music.fade(0, this.musicVolume, fadeTime, musicId);
      
      this.currentMusic = id;
      return musicId;
    } catch (error) {
      console.error(`Error playing music: ${id}`, error);
      return null;
    }
  }
  
  stopMusic(id, fadeOut = true) {
    try {
      const track = this.music.get(id);
      if (!track) return;
      
      if (fadeOut) {
        this.fadeOutAndStop(track);
      } else {
        track.stop();
      }
      
      if (this.currentMusic === id) {
        this.currentMusic = null;
      }
    } catch (error) {
      console.error(`Error stopping music: ${id}`, error);
    }
  }
  
  fadeOutAndStop(track) {
    try {
      const originalVolume = track.volume();
      track.fade(originalVolume, 0, 1000);
      
      // Stop after fade out
      setTimeout(() => {
        track.stop();
      }, 1000);
    } catch (error) {
      console.error('Error in fadeOutAndStop', error);
      // Fallback to immediate stop if fade fails
      track.stop();
    }
  }
  
  stopAllSounds() {
    try {
      this.sounds.forEach(sound => {
        sound.stop();
      });
    } catch (error) {
      console.error('Error stopping all sounds', error);
    }
  }
  
  pauseAll() {
    try {
      Howler.volume(0); // Instantly silent
      setTimeout(() => {
        Howler.pause(); // Pause after going silent
      }, 10);
    } catch (error) {
      console.error('Error pausing all audio', error);
    }
  }
  
  resumeAll() {
    try {
      Howler.play();
      Howler.volume(this.soundVolume);
    } catch (error) {
      console.error('Error resuming all audio', error);
    }
  }
  
  setMasterVolume(volume) {
    try {
      this.soundVolume = Math.max(0, Math.min(1, volume));
      Howler.volume(this.soundVolume);
    } catch (error) {
      console.error('Error setting master volume', error);
    }
    return this;
  }
  
  setSoundVolume(volume) {
    this.soundVolume = volume;
    try {
      // Update volume for all loaded sounds
      this.sounds.forEach(sound => {
        sound.volume(volume);
      });
    } catch (error) {
      console.error('Error setting sound volume', error);
    }
    return this;
  }
  
  setMusicVolume(volume) {
    this.musicVolume = volume;
    try {
      // Update volume only for currently playing music
      if (this.currentMusic) {
        const music = this.music.get(this.currentMusic);
        if (music) {
          music.volume(volume);
        }
      }
    } catch (error) {
      console.error('Error setting music volume', error);
    }
    return this;
  }
  
  toggleMute() {
    try {
      this.isMuted = !this.isMuted;
      Howler.mute(this.isMuted);
      return this.isMuted;
    } catch (error) {
      console.error('Error toggling mute state', error);
      return this.isMuted;
    }
  }
  
  dispose() {
    try {
      // Stop and unload all sounds
      this.sounds.forEach(sound => {
        sound.stop();
        sound.unload();
      });
      
      // Stop and unload all music
      this.music.forEach(music => {
        music.stop();
        music.unload();
      });
      
      this.sounds.clear();
      this.music.clear();
      this.currentMusic = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error disposing AudioManager', error);
    }
    
    return this;
  }
}

export default AudioManager;