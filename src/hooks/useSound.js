import { useCallback, useRef, useState } from 'react';

// Sound effects configuration
const SOUND_EFFECTS = {
  click: { frequency: 800, duration: 100, type: 'sine' },
  hover: { frequency: 600, duration: 50, type: 'sine' },
  win: { frequency: 880, duration: 300, type: 'square' },
  lose: { frequency: 220, duration: 200, type: 'sawtooth' },
  spin: { frequency: 440, duration: 1000, type: 'triangle' },
  deal: { frequency: 330, duration: 150, type: 'sine' },
  bet: { frequency: 550, duration: 120, type: 'square' },
  jackpot: { frequency: 1000, duration: 500, type: 'square' },
  notification: { frequency: 660, duration: 200, type: 'sine' },
  error: { frequency: 150, duration: 300, type: 'sawtooth' }
};

export const useSound = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const audioContextRef = useRef(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((soundType, options = {}) => {
    if (!isEnabled) return;

    const audioContext = initAudioContext();
    if (!audioContext) return;

    try {
      const soundConfig = { ...SOUND_EFFECTS[soundType], ...options };
      const { frequency, duration, type, volume = 0.1 } = soundConfig;

      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      // Create envelope for smoother sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [isEnabled, initAudioContext]);

  const playWinSequence = useCallback(() => {
    if (!isEnabled) return;
    
    // Play a sequence of ascending notes for win effect
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playSound('win', { frequency: freq, duration: 200 });
      }, index * 100);
    });
  }, [isEnabled, playSound]);

  const playJackpotSequence = useCallback(() => {
    if (!isEnabled) return;
    
    // Play an exciting jackpot sequence
    const sequence = [
      { freq: 880, delay: 0 },
      { freq: 1100, delay: 100 },
      { freq: 1320, delay: 200 },
      { freq: 1760, delay: 300 },
      { freq: 2200, delay: 400 }
    ];
    
    sequence.forEach(({ freq, delay }) => {
      setTimeout(() => {
        playSound('jackpot', { frequency: freq, duration: 300 });
      }, delay);
    });
  }, [isEnabled, playSound]);

  const toggleSound = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    playSound,
    playWinSequence,
    playJackpotSequence,
    toggleSound,
    isEnabled
  };
};

export default useSound;