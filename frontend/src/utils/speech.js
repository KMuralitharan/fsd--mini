// Web Speech API Utilities & Gamification Effects
import confetti from 'canvas-confetti';

// 1. Text-to-Speech (Audio Voice Narration)
export function speakText(text, rate = 1.0, onEndCallback = null) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.max(0.6, Math.min(rate, 1.8));
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  // Pick high-quality English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira')));
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (onEndCallback) {
    utterance.onend = onEndCallback;
    utterance.onerror = onEndCallback;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// 2. Speech-to-Text (Voice Recording)
export function createSpeechRecognizer({ onResult, onError, onEnd, continuous = true }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      isSupported: false,
      start: () => {},
      stop: () => {}
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult(finalTranscript, interimTranscript);
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech Recognition Event Error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    isSupported: true,
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition already started or error:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Recognition stop error:', err);
      }
    }
  };
}

// 3. Celebratory Confetti Burst for XP & Badges
export function triggerCelebration(intensity = 'medium') {
  try {
    const count = intensity === 'high' ? 120 : 60;
    confetti({
      particleCount: count,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']
    });
  } catch (err) {
    // Ignore if canvas-confetti is not loaded
  }
}
