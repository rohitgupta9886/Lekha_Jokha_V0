// ==============================================================================
// Lekha Jokha - Unified High-Reliability Voice & Speech Transcription Engine
// Combines:
// 1. Web Speech API (Real-time live interim transcription while speaking)
// 2. MediaRecorder + Gemini 3.8 Flash Audio Multimodal Transcription (Fail-safe backup)
// 3. Indian Language Tuning (English, Hindi, Hinglish)
// 4. Visual audio waves, listening pulses, and permission diagnostics
// ==============================================================================

window.VoiceTranscription = {
  activeSession: null,

  // Check if voice capabilities are available
  isSupported() {
    return ('webkitSpeechRecognition' in window ||
            'SpeechRecognition' in window ||
            (navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  },

  // Attach speech recognition to any input or textarea
  attach({ button, input, statusElem, lang = 'en-IN', onTranscript, onFinish }) {
    if (!button || !input) return;

    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.activeSession && this.activeSession.button === button) {
        this.stopCurrentSession();
      } else {
        this.startSession({ button, input, statusElem, lang, onTranscript, onFinish });
      }
    };
  },

  async startSession({ button, input, statusElem, lang, onTranscript, onFinish }) {
    // Stop any existing session first
    this.stopCurrentSession();

    let recognizedText = '';
    let speechRecognition = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let mediaStream = null;

    // UI Feedback: Listening Mode
    const originalBtnBg = button.style.background || '';
    const originalBtnHtml = button.innerHTML;
    button.classList.add('voice-recording-pulse');
    button.style.background = '#ed1a3b';
    button.style.color = '#ffffff';
    button.innerHTML = '🔴';
    button.setAttribute('title', 'Listening... Click to Stop & Process');

    if (statusElem) {
      statusElem.style.display = 'block';
      statusElem.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;color:#ed1a3b;font-weight:600;font-size:12.5px;">
          <span class="live-dot" style="background:#ed1a3b;animation:pulse 0.8s infinite;"></span>
          <span>Listening... Speak your command in English or Hindi</span>
        </div>
      `;
    }

    // Try setting up MediaRecorder for parallel Gemini audio backup
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm');
        
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        mediaRecorder.start(250);
      } catch (err) {
        console.warn('[VoiceTranscription] getUserMedia error or denied:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          if (window.app && window.app.showToast) {
            window.app.showToast('Microphone access denied. Please click the camera/mic icon in the browser address bar to allow.', 'danger');
          }
        }
      }
    }

    // Setup Web Speech API for live interim real-time typing
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        speechRecognition = new SpeechRec();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.maxAlternatives = 1;
        speechRecognition.lang = lang || 'en-IN';

        speechRecognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const currentText = (finalTranscript + interimTranscript).trim();
          if (currentText) {
            recognizedText = currentText;
            input.value = currentText;
            if (input.dispatchEvent) {
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (onTranscript) onTranscript(currentText, false);

            if (statusElem) {
              statusElem.innerHTML = `
                <div style="color:#059669;font-size:12.5px;font-weight:600;">
                  🎙️ Transcribing: "<i>${currentText}</i>"
                </div>
              `;
            }
          }
        };

        speechRecognition.onerror = (event) => {
          console.warn('[VoiceTranscription] SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            if (window.app && window.app.showToast) {
              window.app.showToast('Microphone permission blocked. Please allow mic access in your browser settings.', 'danger');
            }
          }
        };

        speechRecognition.onend = () => {
          // If stopped naturally without user click, finalize
          if (this.activeSession && this.activeSession.speechRecognition === speechRecognition) {
            this.stopCurrentSession();
          }
        };

        speechRecognition.start();
      } catch (err) {
        console.warn('[VoiceTranscription] Failed to start SpeechRecognition:', err);
      }
    }

    // Track active session
    this.activeSession = {
      button,
      input,
      statusElem,
      originalBtnBg,
      originalBtnHtml,
      speechRecognition,
      mediaRecorder,
      mediaStream,
      audioChunks,
      onTranscript,
      onFinish,
      getRecognizedText: () => recognizedText
    };
  },

  async stopCurrentSession() {
    if (!this.activeSession) return;

    const session = this.activeSession;
    this.activeSession = null;

    // Reset UI button
    session.button.classList.remove('voice-recording-pulse');
    session.button.style.background = session.originalBtnBg;
    session.button.style.color = '';
    session.button.innerHTML = session.originalBtnHtml;
    session.button.setAttribute('title', 'Click to speak (Microphone)');

    // Stop Web Speech API
    if (session.speechRecognition) {
      try {
        session.speechRecognition.onresult = null;
        session.speechRecognition.onerror = null;
        session.speechRecognition.onend = null;
        session.speechRecognition.stop();
      } catch (e) {
        // ignore
      }
    }

    let finalPrompt = session.getRecognizedText() || session.input.value.trim();

    // Stop MediaRecorder and audio stream
    if (session.mediaRecorder && session.mediaRecorder.state !== 'inactive') {
      try {
        await new Promise((resolve) => {
          session.mediaRecorder.onstop = resolve;
          session.mediaRecorder.stop();
        });
      } catch (e) {
        // ignore
      }
    }

    if (session.mediaStream) {
      try {
        session.mediaStream.getTracks().forEach(t => t.stop());
      } catch (e) {
        // ignore
      }
    }

    // If Web Speech API didn't get any text, but we have audio chunks, use Gemini Multimodal Transcription!
    if (!finalPrompt && session.audioChunks.length > 0 && window.GeminiService) {
      if (session.statusElem) {
        session.statusElem.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;color:#7c3aed;font-size:12.5px;">
            <span style="display:inline-block;width:12px;height:12px;border:2px solid #7c3aed;border-right-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
            <span>Transcribing with <b>Gemini 3.8 Flash Audio AI</b>...</span>
          </div>
        `;
      }

      try {
        const audioBlob = new Blob(session.audioChunks, { type: session.audioChunks[0].type || 'audio/webm' });
        if (audioBlob.size > 2000) { // More than 2KB audio recorded
          const geminiTranscript = await window.GeminiService.transcribeAudio(audioBlob);
          if (geminiTranscript && geminiTranscript.trim()) {
            finalPrompt = geminiTranscript.trim();
            session.input.value = finalPrompt;
            if (session.input.dispatchEvent) {
              session.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (session.onTranscript) session.onTranscript(finalPrompt, true);
          }
        }
      } catch (err) {
        console.warn('[VoiceTranscription] Gemini audio transcription error:', err);
      }
    }

    if (session.statusElem) {
      if (finalPrompt) {
        session.statusElem.innerHTML = `
          <div style="color:#059669;font-size:12px;font-weight:600;">
            ✓ Transcribed: "${finalPrompt}"
          </div>
        `;
      } else {
        session.statusElem.style.display = 'none';
      }
    }

    if (session.onFinish) {
      session.onFinish(finalPrompt);
    }
  }
};
