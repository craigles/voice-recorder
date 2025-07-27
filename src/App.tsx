import React, { useRef, useState, useEffect } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { AZURE_CONFIG } from './config';
import './App.css';
import data from './data.json';
import sounds from './sounds.json';

interface ImageObject {
  name: string;
  image: string;
}

const App: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageObject | null>(null);
  const [speechMatch, setSpeechMatch] = useState<boolean | null>(null);
  const [showNewImage, setShowNewImage] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Function to get a random sound from an array
  const getRandomSound = (sounds: string[]) => {
    const randomIndex = Math.floor(Math.random() * sounds.length);
    return sounds[randomIndex];
  };

  // Function to play a random sound
  const playRandomSound = (isCorrect: boolean) => {
    const soundArray = isCorrect ? sounds.correctSounds : sounds.incorrectSounds;
    const randomSound = getRandomSound(soundArray);
    
    if (audioRef.current) {
      audioRef.current.src = randomSound;
      audioRef.current.play().catch(error => {
        console.log('Error playing sound:', error);
      });
    }
  };

  // Azure Speech Service configuration
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    AZURE_CONFIG.SPEECH_KEY,
    AZURE_CONFIG.SPEECH_REGION
  );

  // Function to get a random image from data.json
  const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * data.objects.length);
    return data.objects[randomIndex];
  };

  // Set initial random image when component mounts
  useEffect(() => {
    setCurrentImage(getRandomImage());
  }, []);

  // Play sound effects when speechMatch changes
  useEffect(() => {
    if (speechMatch === true) {
      playRandomSound(true);
    } else if (speechMatch === false) {
      playRandomSound(false);
    }
  }, [speechMatch]);

  // Function to get a new random image
  const handleNewImage = () => {
    setCurrentImage(getRandomImage());
    setTranscribedText('');
    setSpeechMatch(null);
    setShowNewImage(false);
  };

  const handleStartRecording = async () => {
    setTranscribedText('');
    setSpeechMatch(null); 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribeAudio = async (audioURL: string) => {
    if (!audioURL) return;

    setIsTranscribing(true);
    try {
      // Fetch the audio blob from the URL
      const response = await fetch(audioURL);
      const audioBlob = await response.blob();

      // Convert the audio to a format that Azure can process
      // We'll use the REST API approach for better compatibility
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Use the configuration values
      const azureKey = AZURE_CONFIG.SPEECH_KEY;
      const azureRegion = AZURE_CONFIG.SPEECH_REGION;
      
      const transcriptionResponse = await fetch(
        `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'audio/webm;codecs=opus',
          },
          body: audioBlob,
        }
      );

      if (transcriptionResponse.ok) {
        const result = await transcriptionResponse.json();
        if (result.DisplayText) {
          const transcribedText = result.DisplayText.toLowerCase().trim();
          setTranscribedText(transcribedText);
          
          // Check if the transcribed text matches the image name
          if (currentImage) {
            const imageName = currentImage.name.toLowerCase();
            const isMatch = transcribedText.includes(imageName) || imageName.includes(transcribedText);
            setSpeechMatch(isMatch);
            setShowNewImage(isMatch);
          }
        } else {
          setTranscribedText('No speech detected in the recording.');
          setSpeechMatch(false);
        }
      } else {
        throw new Error(`HTTP error! status: ${transcriptionResponse.status}`);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscribedText('Error processing audio. Please check your Azure configuration and try again.');
      setSpeechMatch(false);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        
        {currentImage && (
          <div className="image-container">
            <h2>What do you see in this image?</h2>
            <img 
              src={currentImage.image} 
              alt={currentImage.name}
              style={{ 
                maxWidth: '300px', 
                maxHeight: '300px', 
                borderRadius: '10px',
                border: '3px solid rgba(255,255,255,0.3)'
              }} 
            />
          </div>
        )}

        <button 
          onClick={recording ? handleStopRecording : handleStartRecording}
          style={{
            fontSize: '18px',
            padding: '15px 30px',
            backgroundColor: recording ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          {recording ? '🛑 Stop Recording' : '🎤 Start Recording'}
        </button>

        {transcribedText && (
          <div className="transcribed-text">
            <h3 style={{margin:0, color:'#38b000', fontWeight:'bold', fontSize:'1.1em'}}>🗣️ You said:</h3>
            <p style={{margin:0}}>
              "{transcribedText}"
            </p>
          </div>
        )}

        {speechMatch !== null && (
          <div className={speechMatch ? "correct-feedback" : "incorrect-feedback"}>
            {speechMatch ? (
              <>
                <h3 style={{margin:0}}>🎉 Correct! Well done! 🎈</h3>
                <p style={{margin:0}}>You correctly identified the <b>{currentImage?.name}</b>! 🌟</p>
              </>
            ) : (
              <>
                <h3 style={{margin:0}}>❌ Oops! Not quite right</h3>
                <p style={{margin:0}}>The correct answer was <b>"{currentImage?.name}"</b>. Try again! 🦄</p>
              </>
            )}
          </div>
        )}

        {showNewImage && (
          <button 
            onClick={handleNewImage}
          >
            🎯 Next Image!
          </button>
        )}

        {/* Hidden audio elements for sound effects */}
        <audio ref={audioRef} src="" preload="auto" />
      </header>
    </div>
  );
};

export default App;
