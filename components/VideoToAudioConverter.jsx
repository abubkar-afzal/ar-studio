// components/VideoToAudioConverter.jsx
import { useState, useRef } from 'react';

export default function VideoToAudioConverter() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoSrc(URL.createObjectURL(file));
    setOutputUrl(null);
    setError(null);
  };

  const extractAudio = async () => {
    const video = videoRef.current;
    if (!video) return;

    setProcessing(true);
    setError(null);

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a media element source from the video
      const source = audioContext.createMediaElementSource(video);
      
      // Connect to destination (not needed for extraction, but required for graph)
      // We'll use OfflineAudioContext to render the whole video
      
      // Since we can't use createMediaElementSource with OfflineAudioContext directly,
      // we'll use a workaround: capture audio from video playing into a MediaRecorder
      // or use Web Audio + MediaStream recording.
      
      // Method: Play video silently, capture audio via MediaStream
      const stream = video.captureStream();
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track found in the video.');
      }

      // Use MediaRecorder to record audio only
      const audioStream = new MediaStream([audioTrack]);
      const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setOutputUrl(URL.createObjectURL(blob));
        setProcessing(false);
        video.pause();
      };

      // Start recording and play the video
      recorder.start();
      video.currentTime = 0;
      video.play();

      // Stop when video ends
      video.onended = () => {
        recorder.stop();
        video.onended = null;
      };

      // Also stop if video errors
      video.onerror = () => {
        recorder.stop();
        setError('An error occurred while processing the video.');
        setProcessing(false);
      };
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract audio.');
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-primary">🎵 Video to Audio Converter</h2>
      <input type="file" accept="video/*" onChange={handleFile} className="mb-4" />

      {videoSrc && (
        <>
          <video ref={videoRef} src={videoSrc} className="hidden" controls={false} />
          <p className="text-muted">Video loaded. Ready to extract audio.</p>
          <button onClick={extractAudio} disabled={processing} className="px-6 py-3 bg-primary text-white rounded-xl">
            {processing ? 'Extracting Audio...' : 'Extract Audio'}
          </button>
          {error && <div className="bg-red-900/80 text-white p-3 rounded-xl">{error}</div>}
          {outputUrl && (
            <div className="flex flex-col items-center gap-2">
              <audio controls src={outputUrl} className="w-full max-w-xl" />
              <a href={outputUrl} download="extracted_audio.webm" className="text-accent underline">⬇ Download Audio (.webm)</a>
            </div>
          )}
        </>
      )}
    </div>
  );
}