import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Square, Play, Pause, Download, RefreshCw, Mic, MicOff, AlertCircle } from 'lucide-react';
import { saveAs } from 'file-saver';

export function ScreenRecorder() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [includeMic, setIncludeMic] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Clean up timers & object URLs
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setRecordingState('stopped');
  }, []);

  const handleStart = async () => {
    setErrorMsg(null);
    recordedChunksRef.current = [];
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);
    setRecordingTime(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture is not supported in this browser.');
      }

      // 1. Get Screen Stream
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true, // Display audio
      });

      let combinedStream = displayStream;

      // 2. Mix with Microphone if enabled
      if (includeMic && navigator.mediaDevices.getUserMedia) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const dest = audioCtx.createMediaStreamDestination();

          // Add display audio tracks if present
          if (displayStream.getAudioTracks().length > 0) {
            const displaySource = audioCtx.createMediaStreamSource(new MediaStream(displayStream.getAudioTracks()));
            displaySource.connect(dest);
          }

          // Add mic tracks
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(dest);

          combinedStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch {
          // If mic fails, proceed with display audio only
        }
      }

      streamRef.current = combinedStream;

      // When user clicks the browser's native "Stop Sharing" button
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleStop();
        };
      }

      // 3. Attach stream to preview during recording
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = combinedStream;
        previewVideoRef.current.play().catch(() => {});
      }

      // 4. Configure MediaRecorder
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

      const mediaRecorder = new MediaRecorder(combinedStream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunksRef.current, {
          type: selectedMime || 'video/webm',
        });
        setVideoBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setVideoUrl(url);

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = null;
          previewVideoRef.current.src = url;
        }
      };

      // Collect data every 1 second
      mediaRecorder.start(1000);
      setRecordingState('recording');

      // Start elapsed timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setErrorMsg('Screen recording permission was cancelled or denied.');
      } else {
        setErrorMsg(error.message || 'Failed to start screen recording.');
      }
      setRecordingState('idle');
    }
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;

    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingState('recording');
    }
  };

  const handleDownload = () => {
    if (!videoBlob) return;
    const isMp4 = videoBlob.type.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    saveAs(videoBlob, `screen-recording-${Date.now()}.${ext}`);
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setVideoBlob(null);
    setRecordingTime(0);
    setRecordingState('idle');
    setErrorMsg(null);
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
      previewVideoRef.current.src = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-violet-500" />
          Client-Side Screen & Audio Recorder
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Capture your entire screen, application window, or browser tab with audio. Encoded 100% locally with zero server streaming.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
        {/* State Badge and Timer */}
        <div className="flex items-center gap-3">
          {recordingState === 'recording' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              Recording Active
            </div>
          )}
          {recordingState === 'paused' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-900">
              <Pause className="w-3.5 h-3.5" /> Paused
            </div>
          )}
          {recordingState === 'stopped' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
              Recording Ready
            </div>
          )}
          {recordingState === 'idle' && (
            <span className="text-xs text-gray-500 font-medium">Ready to record</span>
          )}

          <div className="text-sm sm:text-base font-mono font-bold text-gray-800 dark:text-gray-200">
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Options & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {recordingState === 'idle' && (
            <button
              type="button"
              onClick={() => setIncludeMic(!includeMic)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                includeMic
                  ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              {includeMic ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-violet-500" /> Mic Enabled
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" /> Mic Muted
                </>
              )}
            </button>
          )}

          {recordingState === 'idle' && (
            <button
              type="button"
              onClick={handleStart}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/20 transition cursor-pointer"
            >
              <Video className="w-4 h-4" /> Start Recording
            </button>
          )}

          {(recordingState === 'recording' || recordingState === 'paused') && (
            <>
              <button
                type="button"
                onClick={handlePauseResume}
                className="px-3.5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {recordingState === 'recording' ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Resume
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleStop}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Stop & Save
              </button>
            </>
          )}

          {recordingState === 'stopped' && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> New Recording
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Video ({videoBlob ? (videoBlob.size / (1024 * 1024)).toFixed(1) : 0} MB)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Video Viewport */}
      <div className="w-full bg-black rounded-2xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[340px] shadow-lg relative">
        <video
          ref={previewVideoRef}
          controls={recordingState === 'stopped'}
          muted={recordingState === 'recording' || recordingState === 'paused'}
          playsInline
          className="w-full h-auto max-h-[520px] object-contain"
        />

        {recordingState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gray-950/80">
            <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl mb-3 border border-violet-500/30">
              <Video className="w-8 h-8" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mb-1">
              Capture Screen, Window or Tab
            </h4>
            <p className="text-xs text-gray-400 max-w-sm">
              Press "Start Recording" above and select which window or screen you want to share. All video is captured directly in memory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
