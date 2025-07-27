# Voice Recorder with Azure Speech-to-Text

A React TypeScript application that allows users to record their voice and convert it to text using Azure's Speech-to-Text service.

## Features

- Record audio using the browser's MediaRecorder API
- Convert recorded audio to text using Azure Speech-to-Text
- Real-time transcription display
- Modern, responsive UI

## Prerequisites

- Node.js (version 14 or higher)
- An Azure account with Speech Service enabled
- A web browser with microphone access

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Azure Speech Service

1. Go to the [Azure Portal](https://portal.azure.com)
2. Create a new Speech Service resource or use an existing one
3. Navigate to "Keys and Endpoint" in the left sidebar
4. Copy Key 1 or Key 2
5. Note the Region (e.g., "East US")

### 3. Update Configuration

Open `src/config.ts` and replace the placeholder values:

```typescript
export const AZURE_CONFIG = {
  SPEECH_KEY: 'your-actual-azure-speech-key-here',
  SPEECH_REGION: 'your-azure-region-here', // e.g., 'eastus'
};
```

### 4. Start the Development Server

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## How to Use

1. Click "Start Recording" to begin recording your voice
2. Speak clearly into your microphone
3. Click "Stop Recording" when finished
4. Click "Convert to Text" to transcribe your recording
5. The transcribed text will appear below the audio player

## Troubleshooting

- **Microphone Access Denied**: Make sure your browser has permission to access your microphone
- **Azure Configuration Error**: Verify your Speech Service key and region are correct in `src/config.ts`
- **No Speech Detected**: Try speaking more clearly or checking your microphone settings

## Technologies Used

- React 19
- TypeScript
- Azure Speech Service SDK
- MediaRecorder API
- HTML5 Audio API

## License

This project is open source and available under the MIT License.
