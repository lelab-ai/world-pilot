import React, { useState, useEffect, useRef } from 'react';
import { useWorldStore } from '../engine/store';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onApply: (transcriptText?: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, onApply, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');

  const isVoiceModeEnabled = useWorldStore(s => s.isVoiceModeEnabled);
  const setVoiceModeEnabled = useWorldStore(s => s.setVoiceModeEnabled);
  const toggleVoiceMode = useWorldStore(s => s.toggleVoiceMode);
  
  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const onApplyRef = useRef(onApply);
  const onTranscriptRef = useRef(onTranscript);
  const silenceTimerRef = useRef<any>(null);

  onApplyRef.current = onApply;
  onTranscriptRef.current = onTranscript;

  const triggerApply = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if (useWorldStore.getState().isVoiceModeEnabled) {
      speakFeedback("Ordre vocal reçu. Synthèse spatiale en cours.");
    }
    onApplyRef.current(clean);
    latestTranscriptRef.current = '';
    setInterimText('');
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      latestTranscriptRef.current = current;
      setInterimText(current);
      onTranscriptRef.current(current);

      // Auto-trigger if user pauses speaking for 1.3s
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (latestTranscriptRef.current.trim().length > 0) {
          try {
            recognition.stop();
          } catch (_) {}
        }
      }, 1300);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const textToApply = latestTranscriptRef.current.trim();
      if (textToApply.length > 0) {
        triggerApply(textToApply);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.abort();
      } catch (_) {}
    };
  }, []);

  const toggleListening = () => {
    if (!isSupported) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur (utilisez Google Chrome ou Edge).");
      return;
    }

    if (isListening) {
      // User manually clicked to stop: immediately apply recognized speech!
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const textToApply = latestTranscriptRef.current.trim();
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      if (textToApply.length > 0) {
        triggerApply(textToApply);
      }
    } else {
      latestTranscriptRef.current = '';
      setInterimText('');
      setVoiceModeEnabled(true); // User clicked mic to talk, enable voice mode
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
      }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {/* Dedicated Voice Mode Toggle */}
      <button
        onClick={toggleVoiceMode}
        type="button"
        title={isVoiceModeEnabled ? "Mode vocal ACTIF : l'application parle à voix haute (cliquez pour couper la voix)" : "Mode vocal MUET : l'application ne parle pas (cliquez pour activer la voix)"}
        style={{
          padding: '6px 11px',
          background: isVoiceModeEnabled ? 'rgba(0, 255, 170, 0.12)' : 'rgba(255, 255, 255, 0.04)',
          border: isVoiceModeEnabled ? '1px solid #00ffaa' : '1px solid #444',
          borderRadius: '16px',
          color: isVoiceModeEnabled ? '#00ffaa' : '#888',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'all 0.2s'
        }}
      >
        <span>{isVoiceModeEnabled ? '🔊' : '🔇'}</span>
        <span>{isVoiceModeEnabled ? 'Voix ON' : 'Voix OFF'}</span>
      </button>

      {/* Microphone recording button */}
      <button
        onClick={toggleListening}
        disabled={disabled}
        type="button"
        title={isListening ? "Cliquez pour valider immédiatement" : "Parler à WorldPilot (Dictée vocale automatique)"}
        style={{
          padding: '7px 13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isListening 
            ? 'linear-gradient(135deg, #ff0055, #ff3300)' 
            : 'linear-gradient(135deg, #0044ff, #00ffff)',
          color: isListening ? '#ffffff' : '#000000',
          border: 'none',
          borderRadius: '16px',
          fontWeight: 'bold',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: isListening 
            ? '0 0 15px rgba(255, 0, 85, 0.7)' 
            : '0 0 8px rgba(0, 255, 255, 0.3)',
          transition: 'all 0.3s ease',
          animation: isListening ? 'pulse 1.2s infinite' : 'none'
        }}
      >
        <span>{isListening ? '🔴' : '🎙️'}</span>
        <span>{isListening ? 'Écoute... (pause = apply)' : 'Micro'}</span>
      </button>

      {isListening && interimText && (
        <span style={{ fontSize: '11px', color: '#00ffff', fontStyle: 'italic', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          "{interimText}"
        </span>
      )}
    </div>
  );
};

import { ambientAudio } from '../engine/ambientAudio';

export function speakFeedback(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Strict rule: The app MUST NOT speak unless Voice Mode is explicitly enabled!
  const isVoiceModeEnabled = useWorldStore.getState().isVoiceModeEnabled;
  if (!isVoiceModeEnabled) return;
  if (ambientAudio.isAudioMuted()) return;
  const effVol = ambientAudio.getEffectiveVolume();
  if (effVol <= 0.01) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = effVol;
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error", err);
  }
}
