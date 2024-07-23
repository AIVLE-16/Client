import { ReactMic } from 'react-mic';
import React, { useState, useEffect, useRef } from 'react';

import './Report.css';
import io from 'socket.io-client';
import Overlay from '../../components/call/Overlay';
import CallModal from '../../components/call/CallModal';
import { GoBackBtn } from '../../components/CommonStyles';

const socket = io('http://localhost:5000', {
  transports: ['websocket']
});

const Report4 = () => {
  const [result, setResult] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [recording, setRecording] = useState(false);
  const [chat, setChat] = useState([{ text: '신고 시작', isUser: false }]);

  const [done, setDone] = useState(true);
  const [address, setAddress] = useState('서울 강서구 화곡동 980-16');
  const [place, setPlace] = useState('강서구청')
  const [time, setTime] = useState(new Date('2024-07-19 07:48:39.428767'))
  const [content, setContent] = useState('불이 크게 일고 있고 사람들이 숨을 쉬지 못하는 상황입니다.');
  const [lat, setLat] = useState(37.45978574975834);
  const [lng, setLng] = useState(126.9511239870991);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    socket.on('audio_text', (data) => {
      console.log('Received audio_text:', data.audio_text);
      setResult(data.audio_text);
      setChat(prevChat => [...prevChat, { text: data.audio_text, isUser: true }]);
      playTts(data.audio_text);
    });

    return () => {
      socket.off('audio_text');
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Web Speech API is not supported by this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'ko-KR';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setResult(finalTranscript || interimTranscript);
      resetSilenceTimer();
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech Recognition Error', event.error);
    };
  }, []);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = e => {
          chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          await processChunks();
        };

        mediaRecorderRef.current.start();
        setRecording(true);
        recognitionRef.current.start();
        startSilenceTimer();
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
      setRecording(false);
      clearTimeout(silenceTimerRef.current);
    }
  };

  const processChunks = async () => {
    const blob = new Blob(chunksRef.current, { 'type': 'audio/webm' });
    const arrayBuffer = await blob.arrayBuffer();
    const audioData = new Uint8Array(arrayBuffer);
    const wavBuffer = await convertToWav(audioData);
    socket.emit('audio_data', wavBuffer);
    chunksRef.current = [];
  };

  const startSilenceTimer = () => {
    silenceTimerRef.current = setTimeout(async () => {
      stopRecording();
      playTts(ttsText);
    }, 3000);
  };

  const resetSilenceTimer = () => {
    clearTimeout(silenceTimerRef.current);
    startSilenceTimer();
  };

  const playTts = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  const convertToWav = async (audioData) => {
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);

    const targetSampleRate = 16000;
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * targetSampleRate / audioBuffer.sampleRate;
    const offlineContext = new OfflineAudioContext(numChannels, length, targetSampleRate);

    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = audioBuffer;

    bufferSource.connect(offlineContext.destination);
    bufferSource.start(0);

    const resampledBuffer = await offlineContext.startRendering();
    return encodeWAV(resampledBuffer);
  };

  const encodeWAV = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;

    let buffers = [];
    for (let i = 0; i < numChannels; i++) {
      buffers.push(audioBuffer.getChannelData(i));
    }

    const interleaved = interleave(buffers);
    const buffer = new ArrayBuffer(44 + interleaved.length * bytesPerSample);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, interleaved.length * bytesPerSample, true);

    floatTo16BitPCM(view, 44, interleaved);

    return buffer;
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const interleave = (buffers) => {
    const length = buffers[0].length;
    const result = new Float32Array(length * buffers.length);

    let inputIndex = 0;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < buffers.length; j++) {
        result[inputIndex++] = buffers[j][i];
      }
    }
    return result;
  };

  const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  return (
    <div className="report-container">
      {done && <>
        <Overlay />
        <CallModal address={address} place={place} time={time} content={content} lat={lat} lng={lng} />
      </>}
      <GoBackBtn />
      <div className="recording-container">
        <div className="bold-text">정확한 접수를 위해 녹음버튼을 눌러주세요</div>
        <div className="react-mic-container">
          <ReactMic
            record={recording}
            className="sound-wave"
            mimeType="audio/wav"
            strokeColor="#444445"
            backgroundColor="#ffffff" />
        </div>
        <div className="button-container">
          {!recording ? 
            <button className="btn-border" onClick={startRecording} disabled={recording}>
              <div className="circle" />
            </button> :
            <button className="btn-border" onClick={stopRecording} disabled={!recording}>
              <div className="square" />
            </button>
          }
        </div>
      </div>
      <div className="chat-container">
        {chat.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.isUser ? 'user' : 'system'}`}>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Report4;
