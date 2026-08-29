import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscript, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init failed:', e);
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  if (!supported) return null;

  return (
    <button
      id="voice-dictation-btn"
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium ${
        isListening
          ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
          : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700/60'
      }`}
      title={isListening ? 'Stop voice recording' : 'Dictate your journal entry with speech-to-text'}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4 text-red-400" />
          <span className="text-[11px] text-red-300 hidden sm:inline">Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">Voice</span>
        </>
      )}
    </button>
  );
};
