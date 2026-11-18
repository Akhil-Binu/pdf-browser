import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  Music,
  Play,
  Pause,
  Download,
  RotateCcw,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';

export function AudioTrimmer() {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setError(null);
    setIsDecoding(true);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
      setStartTime(0);
      setEndTime(decoded.duration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decode audio file');
    } finally {
      setIsDecoding(false);
    }
  }, []);

  // Draw waveform
  useEffect(() => {
    if (!audioBuffer || !waveformCanvasRef.current) return;

    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Channel 0 data
    const rawData = audioBuffer.getChannelData(0);
    const step = Math.ceil(rawData.length / width);
    const amp = height / 2;

    // Draw full background waveform
    ctx.fillStyle = '#64748b'; // slate-500
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = rawData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Highlight active trim selection
    const startX = (startTime / audioBuffer.duration) * width;
    const endX = (endTime / audioBuffer.duration) * width;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'; // emerald overlay
    ctx.fillRect(startX, 0, Math.max(2, endX - startX), height);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }, [audioBuffer, startTime, endTime]);

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayTrim = () => {
    if (!audioBuffer || !audioCtxRef.current) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const offset = Math.max(0, startTime);
    const duration = Math.max(0.1, endTime - startTime);

    source.start(0, offset, duration);
    source.onended = () => setIsPlaying(false);

    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const handleExportWav = async () => {
    if (!audioBuffer || !file) return;
    setIsExporting(true);
    stopPlayback();

    try {
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
      const length = Math.max(1, endSample - startSample);
      const numChannels = audioBuffer.numberOfChannels;

      // Extract sliced channels
      const channels: Float32Array[] = [];
      for (let ch = 0; ch < numChannels; ch++) {
        channels.push(audioBuffer.getChannelData(ch).slice(startSample, endSample));
      }

      // Encode to 16-bit PCM WAV
      const wavBytes = encodeWav(channels, length, sampleRate, numChannels);
      const wavBlob = new Blob([wavBytes as unknown as BlobPart], { type: 'audio/wav' });

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      saveAs(wavBlob, `${baseName}_trimmed.wav`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export WAV audio');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    stopPlayback();
    setFile(null);
    setAudioBuffer(null);
    setStartTime(0);
    setEndTime(0);
    setError(null);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Scissors className="w-6 h-6 text-emerald-500" />
          Audio Waveform Trimmer
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Visually scrub and trim MP3, WAV, or AAC audio files with sample-accurate waveform visualization. Exports lossless 16-bit PCM WAV.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <Dropzone
          accept={{ 'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'] }}
          onFilesAdded={handleFilesAdded}
          icon={<Music className="w-12 h-12 text-emerald-500" />}
          title="Drop audio file here to trim"
          subtitle="Supports MP3, WAV, AAC, M4A, OGG, and FLAC"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {audioBuffer ? `${formatSeconds(audioBuffer.duration)} • ${audioBuffer.sampleRate}Hz` : 'Decoding...'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change Audio
            </Button>
          </div>

          {isDecoding ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Spinner className="w-8 h-8 text-emerald-500" />
              <p className="text-xs text-gray-500 font-medium">Decoding waveform into memory...</p>
            </div>
          ) : audioBuffer ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-5">
              {/* Waveform Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-slate-950 p-2 shadow-inner">
                <canvas
                  ref={waveformCanvasRef}
                  width={800}
                  height={120}
                  className="w-full h-28 object-contain"
                />
              </div>

              {/* Time scrubbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
                    <span>Trim Start Time:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                      {formatSeconds(startTime)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={audioBuffer.duration}
                    step={0.05}
                    value={startTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < endTime) setStartTime(val);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
                    <span>Trim End Time:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                      {formatSeconds(endTime)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={audioBuffer.duration}
                    step={0.05}
                    value={endTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > startTime) setEndTime(val);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* Summary & Play / Download Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="text-xs text-gray-500">
                  Selected Segment Duration:{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatSeconds(Math.max(0, endTime - startTime))}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={togglePlayTrim}>
                    {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                    {isPlaying ? 'Pause Preview' : 'Preview Selection'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleExportWav}
                    disabled={isExporting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {isExporting ? (
                      <>
                        <Spinner className="w-3.5 h-3.5 mr-1" />
                        Encoding WAV...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download Trimmed WAV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Uncompressed 16-bit PCM WAV file encoder
function encodeWav(
  channels: Float32Array[],
  numSamples: number,
  sampleRate: number,
  numChannels: number
): Uint8Array {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
