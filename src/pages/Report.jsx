import io from 'socket.io-client';
import { ReactMic } from 'react-mic'; 
import React, { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';
import { GoBackBtn } from '../components/CommonStyles';

const socket = io('http://localhost:5000', {
  transports: ['websocket']
});

const WhiteContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  background-size: cover;
  background-position: center;
`;

const BoldText = styled.p`
  font-size: 20px;
  font-weight: bold;
  color: #CF1010;
  margin-bottom: 15px;
`;

const RecordBox = styled.div`
  width: 550px;
  height: 270px;
  display: flex;
  text-align: center;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 25px;
  border-radius: 20px;
  color: #db0948;
  background-color: #f5f5f5c0;
`;

const BtnBorder = styled.button`
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background-color: rgb(255, 255, 255, 0.5);
  cursor: pointer;
  margin-bottom: 30px;
`;

const Circle = styled.div`
  width: 20px;
  height: 20px;
  margin: 0 auto;
  border-radius: 50%;
  background-color: red;
`;

const Square = styled.div`
  width: 20px;
  height: 20px;
  margin: 0 auto;
  background-color: red;
`;

const MacWindow = styled.div`
  width: 60%;
  height: 500px;
  max-width: 1200px;
  margin: 50px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const MacHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid #ccc;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => props.color};
`;

const MacBody = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const STTText = styled.p`
  color: black;
  font-size: 18px; /* 글자 크기 */
  position: absolute; /* 위치를 절대값으로 설정 */
  top: 95%; /* 상단에서의 거리 */
  left: 50%; /* 왼쪽에서의 거리 */
  transform: translate(-50%, -50%); /* 중앙 정렬 */
  text-align: center;
  min-width: 500px;
  max-width: 80%; /* 최대 너비를 설정하여 텍스트가 줄 바꿈되도록 함 */
  word-wrap: break-word; /* 단어를 자동으로 줄 바꿈 */
`;

const Report = () => {
  const [result, setResult] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [recording, setRecording] = useState(false);
  const [ttsFinished, setTtsFinished] = useState(false); // TTS 완료 여부 상태 추가
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    socket.on('audio_text', (data) => {
      console.log('Received audio_text:', data.audio_text);
      setResult(data.audio_text);
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

  useEffect(() => {
    playTts('신고 시작', () => {
      setTtsFinished(true); // TTS가 완료되면 상태를 true로 설정
    });
  }, []); // 빈 배열을 의존성 배열로 설정하여 한 번만 실행되도록 함

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = e => {
          chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(chunksRef.current, { 'type': 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const audioData = new Uint8Array(arrayBuffer);
          const wavBuffer = await convertToWav(audioData);
          socket.emit('audio_data', wavBuffer);
          chunksRef.current = [];
        };

        mediaRecorderRef.current.start();
        setRecording(true);

        intervalRef.current = setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.start();
          }
        }, 5000);

        recognitionRef.current.start();
        startSilenceTimer();
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      clearInterval(intervalRef.current);
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
      setRecording(false);
      clearTimeout(silenceTimerRef.current);
    }
  };

  const startSilenceTimer = () => {
    silenceTimerRef.current = setTimeout(async () => {
      stopRecording();
      const ttsText = await fetchTtsText();
      setTtsText(ttsText); // TTS 텍스트 상태 설정
      playTts(ttsText, startRecording);
    }, 5000); // 5초 동안 음성이 인식되지 않으면 TTS 실행
  };

  const resetSilenceTimer = () => {
    clearTimeout(silenceTimerRef.current);
    startSilenceTimer();
  };

  const fetchTtsText = async () => {
    const response = await fetch('http://localhost:5000/get-tts-text');
    const data = await response.json();
    return data.text;
  };

  const playTts = (text, callback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.onend = () => {
      if (callback) callback();
    };
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

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + interleaved.length * bytesPerSample, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * bytesPerSample, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
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
    <WhiteContainer>

      <GoBackBtn />
      <MacWindow>
        <MacHeader>
          <Dot color="#FF605C" />
          <Dot color="#FFBD44" />
          <Dot color="#00CA4E" />
        </MacHeader>
        <MacBody>
          <RecordBox>
            <BoldText>정확한 접수를 위해 녹음버튼을 눌러주세요</BoldText>
            <div style={{ width: "500px", overflow: "hidden", margin: "0 auto" }}>
              <ReactMic
                record={recording}
                className="sound-wave"
                mimeType="audio/wav"
                strokeColor="#444445"
                backgroundColor="#f5f5f5c0" />
            </div>
          </RecordBox>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {!recording ? 
              <BtnBorder onClick={startRecording} disabled={recording}>
                <Circle />
              </BtnBorder> :
              <BtnBorder onClick={stopRecording} disabled={!recording}>
                <Square />
              </BtnBorder>
            }
          </div>
          <STTText>{result}</STTText>
          {ttsText && (
            <STTText style={{ marginTop: '20px' }}>TTS: {ttsText}</STTText>
          )}
        </MacBody>
      </MacWindow>
    </WhiteContainer>
  );
}

export default Report;
