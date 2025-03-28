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
    
    // 静音音频数据 - 用于创建无声音频对象
    this.silentAudioData = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eN3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3//////////////////////////8AAAAExTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxAANCAad2AQACVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    
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
      upgrade_complete: '/assets/audio/sfx/upgrade_complete.mp3',
      discovery: '/assets/audio/sfx/discovery.mp3'
    };
    
    // 已知有问题的音频文件列表，用于跳过重试和创建静音替代
    this.knownBrokenAudio = new Set();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      // 延迟初始化，只在首次用户交互后加载
      this.loadPlaceholderSounds();
      
      // 设置全局错误处理
      Howler.autoUnlock = true;
      Howler.html5PoolSize = 50;  // 大幅增加池大小以彻底避免耗尽警告
      
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

  /**
   * 创建静音音频对象作为后备
   * @param {boolean} isLooping 是否循环播放
   * @returns {Howl} 静音音频对象
   */
  createSilentAudio(isLooping = false) {
    // 使用预定义的静音base64编码MP3
    return new Howl({
      src: [this.silentAudioData],
      volume: 0,
      loop: isLooping,
      html5: true,
      autoplay: false
    });
  }
  
  // 加载空音频作为占位符，避免第一次用户交互前资源未加载的问题
  loadPlaceholderSounds() {
    // 减少预加载的音效数量，只加载最关键的音效
    const criticalSounds = ['button_click', 'alert'];
    criticalSounds.forEach(id => {
      if (!this.sounds.has(id)) {
        try {
          const sound = new Howl({
            src: [this.silentAudioData],
            volume: this.soundVolume,
            preload: true,
            html5: true, // 使用HTML5Audio减少Web Audio节点的使用
            pool: 8 // 增加音频池大小
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
          src: [this.silentAudioData],
          volume: this.musicVolume,
          loop: true,
          html5: true, 
          pool: 4  // 增加音频池大小
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
        // 如果是已知的损坏音频，直接跳过加载
        if (this.knownBrokenAudio.has(id)) {
          if (!this.sounds.has(id)) {
            this.sounds.set(id, this.createSilentAudio());
          }
          return;
        }
        
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
        // 如果是已知的损坏音频，直接跳过加载
        if (this.knownBrokenAudio.has(id)) {
          if (!this.music.has(id)) {
            this.music.set(id, this.createSilentAudio(true));
          }
          return;
        }
        
        if (!this.music.has(id) && this.audioFiles[id]) {
          // 静默加载音乐轨道，不播放
          const music = new Howl({
            src: [this.audioFiles[id]],
            volume: 0,
            preload: true,
            html5: true,
            pool: 1,
            onloaderror: () => {
              console.warn(`Failed to preload music: ${id}`);
              this.knownBrokenAudio.add(id);
              if (!this.music.has(id)) {
                this.music.set(id, this.createSilentAudio(true));
              }
            }
          });
          this.music.set(id, music);
        }
      });
    } catch (error) {
      console.error('Error preloading music', error);
    }
  }
  
  loadSound(id, path, attempts = 0) {
    // 如果是已知损坏的音频，直接返回静音音频
    if (this.knownBrokenAudio.has(id)) {
      if (!this.sounds.has(id)) {
        const silentSound = this.createSilentAudio();
        this.sounds.set(id, silentSound);
      }
      return this.sounds.get(id);
    }
    
    if (attempts >= this.maxAttempts) {
      console.error(`Failed to load sound after ${attempts} attempts: ${id}`);
      // 标记为已知损坏音频
      this.knownBrokenAudio.add(id);
      // 即使加载失败，也返回一个"空"声音对象，避免后续代码报错
      const silentSound = this.createSilentAudio();
      this.sounds.set(id, silentSound);
      return silentSound;
    }
    
    try {
      const sound = new Howl({
        src: [path],
        volume: this.soundVolume,
        html5: true,
        pool: 5,  // 增加音频池大小
        onloaderror: (soundId, error) => {
          // 记录有用的错误信息
          console.warn(`Error loading sound ${id}, retrying... ${attempts+1}/${this.maxAttempts}`, error.message || error); 
          
          // 重试加载
          setTimeout(() => {
            // 如果文件确实不存在(404)，没必要重试多次
            if (error && (error.message || '').includes('404')) {
              // 标记为已知损坏音频
              this.knownBrokenAudio.add(id);
              // 直接使用静音作为后备
              const silentSound = this.createSilentAudio();
              this.sounds.set(id, silentSound);
            } else {
              this.loadSound(id, path, attempts + 1);
            }
          }, 300);
        }
      });
      
      this.sounds.set(id, sound);
      return sound;
    } catch (error) {
      console.error(`Error creating Howl object: ${id}`, error);
      // 标记为已知损坏音频
      this.knownBrokenAudio.add(id);
      // 错误情况下返回静音音频
      const silentSound = this.createSilentAudio();
      this.sounds.set(id, silentSound);
      return silentSound;
    }
  }
  
  loadMusic(id, path) {
    // 如果是已知损坏的音频，直接返回静音音频
    if (this.knownBrokenAudio.has(id)) {
      if (!this.music.has(id)) {
        const silentMusic = this.createSilentAudio(true);
        this.music.set(id, silentMusic);
      }
      return this.music.get(id);
    }
    
    if (this.music.has(id)) return this.music.get(id);
    
    try {
      const musicTrack = new Howl({
        src: [path],
        volume: this.musicVolume,
        loop: true,
        html5: true,
        // Add error handling
        onloaderror: (soundId, error) => {
          console.warn(`Failed to load music: ${id}`, error);
          // 标记为已知损坏音频
          this.knownBrokenAudio.add(id);
          
          // 即使失败也创建一个空的音乐对象，防止后续报错
          if (!this.music.has(id)) {
            const silentMusic = this.createSilentAudio(true);
            this.music.set(id, silentMusic);
          }
        }
      });
      
      this.music.set(id, musicTrack);
      return musicTrack;
    } catch (error) {
      console.error(`Error loading music: ${id}`, error);
      // 标记为已知损坏音频
      this.knownBrokenAudio.add(id);
      
      // 创建一个静音轨道作为后备
      const silentMusic = this.createSilentAudio(true);
      this.music.set(id, silentMusic);
      return silentMusic;
    }
  }
  
  playSound(id, volume = 1.0) {
    if (this.isMuted) return null;
    
    try {
      // 验证声音ID
      if (!id) {
        console.warn('Attempted to play sound with empty id');
        return null;
      }
      
      // 如果是已知损坏的音频，使用备用音效或静音
      if (this.knownBrokenAudio.has(id)) {
        // 尝试使用alert作为后备
        if (id !== 'alert' && !this.knownBrokenAudio.has('alert') && this.sounds.has('alert')) {
          return this.playSound('alert', volume * 0.7);
        } else {
          // 如果没有备用音效，使用静音
          const silentSound = this.sounds.get(id) || this.createSilentAudio();
          if (!this.sounds.has(id)) {
            this.sounds.set(id, silentSound);
          }
          return silentSound.play();
        }
      }
      
      let sound = this.sounds.get(id);
      
      // 处理audioFiles中不存在的音效
      if (!sound) {
        const path = this.audioFiles[id];
        if (!path) {
          console.warn(`Sound '${id}' not found in audio files, using backup sound`);
          // 使用alert音效作为后备
          if (id !== 'alert' && !this.knownBrokenAudio.has('alert') && this.sounds.has('alert')) {
            return this.playSound('alert', volume * 0.7);
          } else {
            // 如果连alert都没有，创建静音音效
            sound = this.createSilentAudio();
            this.sounds.set(id, sound);
          }
        } else {
          sound = this.loadSound(id, path);
        }
      }
      
      // 确保sound一定存在
      if (!sound) {
        sound = this.createSilentAudio();
        this.sounds.set(id, sound);
      }
      
      // 防止过多播放同一音效
      if (sound.playing() && sound._sounds.length > 3) {
        // 如果已经有多个相同音效播放中，只调整最后一个的音量，而不再创建新实例
        console.warn(`Limiting concurrent instances of sound: ${id}`);
        const lastSoundId = sound._sounds[sound._sounds.length - 1]._id;
        sound.volume(volume * this.soundVolume, lastSoundId);
        return lastSoundId;
      }
      
      // 限制每个音效的最大同时播放实例数
      // 短音效只需要很少的实例
      if (sound._sounds.length >= 5) {
        // 停止最早的音效实例
        if (sound._sounds[0]) {
          sound.stop(sound._sounds[0]._id);
        }
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
      
      // 如果是已知损坏的音频，直接使用静音轨道
      if (this.knownBrokenAudio.has(id)) {
        console.warn(`Using silent track for known broken music: ${id}`);
        const silentMusic = this.music.get(id) || this.createSilentAudio(true);
        if (!this.music.has(id)) {
          this.music.set(id, silentMusic);
        }
        
        silentMusic.volume(0);
        const musicId = silentMusic.play();
        silentMusic.fade(0, this.musicVolume, fadeTime, musicId);
        this.currentMusic = id;
        return musicId;
      }
      
      let music = this.music.get(id);
      
      // Load music if it doesn't exist
      if (!music) {
        const path = this.audioFiles[id];
        if (!path) {
          console.warn(`Music '${id}' not found in audio files`);
          // 使用静音轨道作为后备，不影响游戏流程
          const silentMusic = this.createSilentAudio(true);
          this.music.set(id, silentMusic);
          music = silentMusic;
        } else {
          try {
            music = new Howl({
              src: [path],
              volume: 0,
              loop: true,
              html5: true,
              pool: 2,
              onloaderror: (soundId, error) => {
                console.warn(`Failed to load music: ${id}`, error);
                // 标记为已知损坏音频
                this.knownBrokenAudio.add(id);
                
                // 如果加载失败，使用静音轨道代替
                if (!this.music.has(id) || !this.music.get(id).playing()) {
                  const silentMusic = this.createSilentAudio(true);
                  this.music.set(id, silentMusic);
                  
                  // 立即播放静音轨道
                  silentMusic.volume(0);
                  silentMusic.play();
                  silentMusic.fade(0, this.musicVolume, fadeTime);
                  this.currentMusic = id;
                }
              }
            });
            this.music.set(id, music);
          } catch (error) {
            console.error(`Error creating music Howl: ${id}`, error);
            // 标记为已知损坏音频
            this.knownBrokenAudio.add(id);
            // 使用静音轨道作为后备
            const silentMusic = this.createSilentAudio(true);
            this.music.set(id, silentMusic);
            music = silentMusic;
          }
        }
      }
      
      // Play and fade in
      if (music) {
        music.volume(0);
        const musicId = music.play();
        music.fade(0, this.musicVolume, fadeTime, musicId);
        this.currentMusic = id;
        return musicId;
      }
      
      return null;
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
      // Howler.play() 错误：Howler对象没有play方法
      // 使用正确的API恢复所有声音
      
      // 首先恢复音量
      Howler.volume(this.soundVolume);
      
      // 尝试恢复所有暂停的音效
      this.sounds.forEach(sound => {
        if (sound._paused && !sound._ended) {
          sound.play();
        }
      });
      
      // 恢复背景音乐
      if (this.currentMusic) {
        const music = this.music.get(this.currentMusic);
        if (music && !music.playing()) {
          music.play();
        }
      }
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