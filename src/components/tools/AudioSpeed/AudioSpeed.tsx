import { useState, useRef, useEffect } from 'react';
import { Gauge, Play, Pause, Download, Volume2, RefreshCw, Undo2, AlertCircle } from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';

// Encode an AudioBuffer to standard 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');

  // "fmt " Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels & write 16-bit PCM samples
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function AudioSpeed() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.25);
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleAudioDrop = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setErrorMsg(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  const handleExport = async () => {
    if (!audioFile) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Handle Reversing if requested
      let workingBuffer = decodedBuffer;
      if (isReversed) {
        const reversedBuffer = audioCtx.createBuffer(
          decodedBuffer.numberOfChannels,
          decodedBuffer.length,
          decodedBuffer.sampleRate
        );
        for (let ch = 0; ch < decodedBuffer.numberOfChannels; ch++) {
          const originalData = decodedBuffer.getChannelData(ch);
          const reversedData = reversedBuffer.getChannelData(ch);
          for (let i = 0; i < decodedBuffer.length; i++) {
            reversedData[i] = originalData[decodedBuffer.length - 1 - i];
          }
        }
        workingBuffer = reversedBuffer;
      }

      // Calculate Target Duration based on speed
      const targetLength = Math.max(1, Math.round(workingBuffer.length / speed));
      const offlineCtx = new OfflineAudioContext(
        workingBuffer.numberOfChannels,
        targetLength,
        workingBuffer.sampleRate
      );

      const sourceNode = offlineCtx.createBufferSource();
      sourceNode.buffer = workingBuffer;
      sourceNode.playbackRate.value = speed;
      sourceNode.connect(offlineCtx.destination);
      sourceNode.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWav(renderedBuffer);

      const baseName = audioFile.name.replace(/\.[^/.]+$/, '');
      const reverseTag = isReversed ? '-reversed' : '';
      const speedTag = speed !== 1 ? `-${speed}x` : '';
      saveAs(wavBlob, `${baseName}${speedTag}${reverseTag}.wav`);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to process audio speed change.');
    } finally {
      setIsProcessing(false);
    }
  };

  const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Gauge className="w-5 h-5 text-emerald-500" />
          Client-Side Audio Speed & Pitch Controller
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Adjust audio playback velocity from 0.25x up to 4.0x or reverse playback entirely. Exports high-fidelity 16-bit PCM WAV directly in your browser.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!audioFile ? (
        <Dropzone
          accept="audio/*"
          maxFiles={1}
          onDrop={handleAudioDrop}
          label="Drop an audio file here (MP3, WAV, OGG, AAC, M4A, FLAC)"
        />
      ) : (
        <div className="space-y-5">
          {/* Audio Information Card */}
          <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {audioFile.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>Duration: {formatSeconds(duration)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAudioFile(null);
                if (audioUrl) URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
                setIsPlaying(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Change Audio
            </button>
          </div>

          {/* Hidden Audio Player for Preview */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={() => {
                if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (audioRef.current) setDuration(audioRef.current.duration);
              }}
              onEnded={() => setIsPlaying(false)}
            />
          )}

          {/* Playback Controls & Timeline */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>

              <button
                type="button"
                onClick={handlePlayPause}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Play Preview ({speed}x)
                  </>
                )}
              </button>
            </div>

            {/* Custom Scrub Bar */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const newTime = Number(e.target.value);
                setCurrentTime(newTime);
                if (audioRef.current) audioRef.current.currentTime = newTime;
              }}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Speed & Pitch Settings */}
          <div className="p-5 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Speed Multiplier
              </span>
              <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {speed.toFixed(2)}x
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {SPEED_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSpeedChange(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    speed === p
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {p}x
                </button>
              ))}
            </div>

            {/* Smooth Slider */}
            <div>
              <input
                type="range"
                min="0.25"
                max="3.0"
                step="0.05"
                value={speed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0.25x (Slow Mo)</span>
                <span>1.0x (Normal)</span>
                <span>3.0x (Hyper Speed)</span>
              </div>
            </div>

            {/* Reverse Toggle */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Reverse Audio
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Flips the waveform backwards on WAV export
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReversed}
                  onChange={(e) => setIsReversed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600" />
              </label>
            </div>
          </div>

          {/* Export Action */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExport}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Rendering Audio...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Export Processed Audio (WAV)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
