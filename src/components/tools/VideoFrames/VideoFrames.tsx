import { useState, useRef, useCallback } from 'react';
import {
  Video,
  Camera,
  Play,
  Pause,
  Download,
  Trash2,
  RotateCcw,
  AlertCircle,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../ui/Dropzone';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { imagesToPdf } from '../../../utils/pdfUtils';

interface CapturedFrame {
  id: string;
  timeSec: number;
  previewUrl: string;
  blob: Blob;
}

export function VideoFrames() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [intervalSec, setIntervalSec] = useState<number>(2);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFilesAdded = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setVideoFile(selected);
    setError(null);
    setFrames([]);

    const url = URL.createObjectURL(selected);
    setVideoUrl(url);
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Capture single frame from current video position
  const captureCurrentFrame = (): Promise<CapturedFrame> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      if (!video) return reject(new Error('Video element not found'));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get 2D canvas context'));

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas blob failure'));
        const previewUrl = URL.createObjectURL(blob);
        resolve({
          id: Math.random().toString(36).substring(2, 9),
          timeSec: video.currentTime,
          previewUrl,
          blob,
        });
      }, 'image/jpeg', 0.92);
    });
  };

  const handleSnapCurrent = async () => {
    try {
      const frame = await captureCurrentFrame();
      setFrames((prev) => [...prev, frame]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture frame');
    }
  };

  // Auto-extract frames across the whole video duration
  const handleAutoExtract = async () => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;

    setIsExtracting(true);
    setError(null);
    video.pause();
    setIsPlaying(false);

    try {
      const captured: CapturedFrame[] = [];
      const step = Math.max(0.5, intervalSec);

      for (let t = 0; t <= duration; t += step) {
        await new Promise<void>((res) => {
          video.currentTime = t;
          video.onseeked = () => res();
        });

        const frame = await captureCurrentFrame();
        captured.push(frame);
      }

      setFrames((prev) => [...prev, ...captured]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error during automated extraction');
    } finally {
      setIsExtracting(false);
    }
  };

  const removeFrame = (id: string) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDownloadZip = async () => {
    if (frames.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      frames.forEach((frame, idx) => {
        const timeFormatted = frame.timeSec.toFixed(1).replace('.', 's');
        const filename = `frame_${String(idx + 1).padStart(3, '0')}_${timeFormatted}.jpg`;
        zip.file(filename, frame.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'video_frames.zip');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ZIP');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (frames.length === 0) return;
    setIsExporting(true);
    try {
      const filesToEmbed = frames.map((f, idx) => {
        const file = new File([f.blob], `frame_${idx + 1}.jpg`, { type: 'image/jpeg' });
        return {
          file,
          orientation: 'landscape' as const,
          fit: 'fit' as const,
        };
      });

      const pdfBytes = await imagesToPdf(filesToEmbed);
      const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(pdfBlob, 'video_storyboard.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export storyboard PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    frames.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setFrames([]);
    setError(null);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Video className="w-6 h-6 text-violet-500" />
          Video to Frames & Storyboard
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Extract high-resolution image frames from videos locally at specific timestamps or regular intervals, and export as a ZIP or Storyboard PDF.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!videoFile ? (
        <Dropzone
          accept={{ 'video/*': ['.mp4', '.webm', '.mov', '.ogg'] }}
          onFilesAdded={handleFilesAdded}
          icon={<Video className="w-12 h-12 text-violet-500" />}
          title="Drop your video here to extract frames"
          subtitle="Supports MP4, WebM, MOV, and high-definition video files"
        />
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-500">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{videoFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Duration: {formatTime(duration)} • {frames.length} frames captured
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change Video
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Player & Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black aspect-video flex items-center justify-center relative shadow-md">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Player scrub and buttons */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  className="w-full accent-violet-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <Button variant="secondary" size="sm" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSnapCurrent}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
                  >
                    <Camera className="w-4 h-4 mr-1.5" />
                    Snap Current Frame
                  </Button>
                </div>
              </div>

              {/* Automated batch extraction */}
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-500" />
                  Auto-Extract Interval
                </span>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500">Extract every:</label>
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-950"
                  >
                    <option value={1}>1 second</option>
                    <option value={2}>2 seconds</option>
                    <option value={3}>3 seconds</option>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAutoExtract}
                    disabled={isExtracting}
                    className="ml-auto"
                  >
                    {isExtracting ? (
                      <>
                        <Spinner className="w-3.5 h-3.5 mr-1" />
                        Extracting...
                      </>
                    ) : (
                      'Run Extraction'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Gallery & Export */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-500" />
                  Captured Frames ({frames.length})
                </span>

                {frames.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      frames.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                      setFrames([]);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {frames.length === 0 ? (
                <div className="h-64 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-6 text-center text-xs text-gray-400">
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <p>No frames captured yet.</p>
                  <p className="mt-1">Play the video and click "Snap Current Frame" or run interval extraction.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {frames.map((frame, idx) => (
                      <div
                        key={frame.id}
                        className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-900 shadow-xs"
                      >
                        <img
                          src={frame.previewUrl}
                          alt={`Frame ${idx + 1}`}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                          {formatTime(frame.timeSec)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFrame(frame.id)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      size="sm"
                      onClick={handleDownloadZip}
                      disabled={isExporting}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
                    >
                      {isExporting ? <Spinner className="w-3.5 h-3.5 mr-1" /> : <Download className="w-3.5 h-3.5 mr-1" />}
                      Download ZIP ({frames.length})
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={isExporting}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Storyboard PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
