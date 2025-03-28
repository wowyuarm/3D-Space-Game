// src/engine/AudioManager.js
import { Howl, Howler } from 'howler';

// Audio Manager for managing game sounds and music
export class AudioManager {
  constructor() {
    this.sounds = new Map(); // Store sound effects
    this.music = new Map();  // Store music tracks
    this.masterVolume = 1.0;
    this.soundVolume = 0.8;
    this.musicVolume = 0.5;
    this.currentMusic = null;
    this.isInitialized = false;
    this.isMuted = false;
    
    // Define standard sound files
    this.audioFiles = {
      // UI Sounds
      button_click: '/assets/audio/sfx/button_click.mp3',
      alert: '/assets/audio/sfx/alert.mp3',
      upgrade_complete: '/assets/audio/sfx/upgrade_complete.mp3',
      
      // Gameplay Sounds
      engine_hum: '/assets/audio/sfx/engine_hum.mp3',
      engine_boost: '/assets/audio/sfx/engine_boost.mp3',
      shield_hit: '/assets/audio/sfx/shield_hit.mp3',
      resource_collect: '/assets/audio/sfx/resource_collect.mp3',
      discovery: '/assets/audio/sfx/discovery.mp3',
      warning_alarm: '/assets/audio/sfx/warning_alarm.mp3',
      
      // Music
      main_theme: '/assets/audio/music/main_theme.mp3',
      space_ambient: '/assets/audio/music/space_ambient.mp3',
      discovery_theme: '/assets/audio/music/discovery_theme.mp3',
      battle_theme: '/assets/audio/music/battle_theme.mp3',
    };
  }
  
  initialize() {
    if (this.isInitialized) {
      console.warn('AudioManager already initialized');
      return this;
    }
    
    console.log('Initializing AudioManager...');
    
    // Set global Howler settings
    Howler.autoUnlock = true;
    Howler.volume(this.masterVolume);
    
    // Pre-load common sounds - we'll use placeholder sounds since we don't have actual files yet
    this.loadPlaceholderSounds();
    
    this.isInitialized = true;
    return this;
  }

  // Load placeholder sounds to avoid errors when real sound files are not available
  loadPlaceholderSounds() {
    // Create base64 encoded silent mp3 for placeholder
    const silentMp3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eN3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3//////////////////////////8AAAAExTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxAANCAad2AQACVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

    // Pre-load common UI sounds with silent placeholder
    Object.keys(this.audioFiles).forEach(id => {
      if (!this.sounds.has(id) && id.includes('button_click', 'alert', 'upgrade_complete')) {
        const sound = new Howl({
          src: [silentMp3],
          volume: this.soundVolume,
          preload: true
        });
        this.sounds.set(id, sound);
      }
      
      if (!this.music.has(id) && id.includes('main_theme', 'space_ambient')) {
        const music = new Howl({
          src: [silentMp3],
          volume: this.musicVolume,
          loop: true,
          html5: true
        });
        this.music.set(id, music);
      }
    });
  }
  
  preloadSounds(soundIds) {
    soundIds.forEach(id => {
      try {
        const path = this.audioFiles[id];
        if (path) {
          this.loadSound(id, path);
        }
      } catch (error) {
        console.warn(`Failed to preload sound: ${id}`, error);
      }
    });
    return this;
  }
  
  preloadMusic(musicIds) {
    musicIds.forEach(id => {
      try {
        const path = this.audioFiles[id];
        if (path) {
          this.loadMusic(id, path);
        }
      } catch (error) {
        console.warn(`Failed to preload music: ${id}`, error);
      }
    });
    return this;
  }
  
  loadSound(id, path) {
    if (this.sounds.has(id)) return this.sounds.get(id);
    
    try {
      const sound = new Howl({
        src: [path],
        volume: this.soundVolume,
        preload: true,
        html5: false,
        // Add error handling
        onloaderror: () => {
          console.warn(`Failed to load sound: ${id} from path: ${path}`);
        }
      });
      
      this.sounds.set(id, sound);
      return sound;
    } catch (error) {
      console.error(`Error loading sound: ${id}`, error);
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
      
      // Play sound with adjusted volume
      const soundId = sound.play();
      sound.volume(volume * this.soundVolume, soundId);
      
      return soundId;
    } catch (error) {
      console.error(`Error playing sound: ${id}`, error);
      return null;
    }
  }
  
  playMusic(id, loop = true, fadeIn = false) {
    if (this.currentMusic === id) return; // Already playing this track
    
    try {
      // Stop current music if playing
      if (this.currentMusic) {
        const current = this.music.get(this.currentMusic);
        if (current) {
          this.fadeOutAndStop(current);
        }
      }
      
      // Set new current music
      this.currentMusic = id;
      
      let track = this.music.get(id);
      
      // Load music if it doesn't exist
      if (!track) {
        const path = this.audioFiles[id];
        if (!path) {
          console.warn(`Music '${id}' not found in audio files`);
          return;
        }
        track = this.loadMusic(id, path);
        if (!track) return;
      }
      
      // Set loop state
      track.loop(loop);
      
      if (fadeIn) {
        // Start silent and fade in
        track.volume(0);
        track.play();
        track.fade(0, this.musicVolume, 2000);
      } else {
        track.volume(this.musicVolume);
        track.play();
      }
    } catch (error) {
      console.error(`Error playing music: ${id}`, error);
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
      Howler.volume(this.masterVolume);
    } catch (error) {
      console.error('Error resuming all audio', error);
    }
  }
  
  setMasterVolume(volume) {
    try {
      this.masterVolume = Math.max(0, Math.min(1, volume));
      Howler.volume(this.masterVolume);
    } catch (error) {
      console.error('Error setting master volume', error);
    }
    return this;
  }
  
  setSoundVolume(volume) {
    try {
      this.soundVolume = Math.max(0, Math.min(1, volume));
    } catch (error) {
      console.error('Error setting sound volume', error);
    }
    return this;
  }
  
  setMusicVolume(volume) {
    try {
      this.musicVolume = Math.max(0, Math.min(1, volume));
      
      // Apply to currently playing music
      if (this.currentMusic) {
        const track = this.music.get(this.currentMusic);
        if (track) {
          track.volume(this.musicVolume);
        }
      }
    } catch (error) {
      console.error('Error setting music volume', error);
    }
    return this;
  }
  
  mute() {
    try {
      if (!this.isMuted) {
        this.isMuted = true;
        Howler.mute(true);
      }
    } catch (error) {
      console.error('Error muting audio', error);
    }
    return this;
  }
  
  unmute() {
    try {
      if (this.isMuted) {
        this.isMuted = false;
        Howler.mute(false);
      }
    } catch (error) {
      console.error('Error unmuting audio', error);
    }
    return this;
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