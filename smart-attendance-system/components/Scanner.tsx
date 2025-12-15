import React, { useRef, useState, useEffect, useCallback } from 'react';
import { User, AttendanceRecord, RecognitionResult } from '../types';
import { identifyPerson } from '../services/geminiService';
import { Camera, RefreshCw, UserCheck, UserX, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ScannerProps {
  users: User[];
  onAttendance: (record: AttendanceRecord) => void;
  recentRecords: AttendanceRecord[];
}

const Scanner: React.FC<ScannerProps> = ({ users, onAttendance, recentRecords }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<RecognitionResult | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'processing' | 'cooldown'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [matchFlash, setMatchFlash] = useState<{name: string} | null>(null);
  const [loggedMessage, setLoggedMessage] = useState<string | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    setScanStatus('idle');
    setMatchFlash(null);
    setLoggedMessage(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const processFrame = useCallback(async () => {
    if (!isActive || scanStatus === 'processing' || users.length === 0) return;
    setScanStatus('processing');
    const frame = captureFrame();
    if (!frame) {
      setScanStatus('cooldown');
      setTimeout(() => { if (isActiveRef.current) setScanStatus('scanning'); }, 500);
      return;
    }

    let nextCooldown = 3500;
    try {
      const result = await identifyPerson(frame, users);
      setLastScanResult(result);

      if (result.matchFound && result.matchId && result.confidence > 0.65) {
        if (result.confidence > 0.85) nextCooldown = 1200;
        else if (result.confidence > 0.75) nextCooldown = 2000;
        else nextCooldown = 3000;

        const matchedUser = users.find(u => u.id === result.matchId);
        if (matchedUser) {
          if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
          setMatchFlash({ name: matchedUser.name });
          matchTimeoutRef.current = setTimeout(() => setMatchFlash(null), 2000);

          const lastRecord = recentRecords.find(r => r.userId === matchedUser.id);
          const isRecent = lastRecord && (Date.now() - new Date(lastRecord.timestamp).getTime() < 60000);

          if (!isRecent) {
             const newRecord: AttendanceRecord = {
              id: crypto.randomUUID(),
              userId: matchedUser.id,
              userName: matchedUser.name,
              timestamp: new Date().toISOString(),
              status: 'Present',
              confidence: result.confidence,
              mood: result.demographics?.expression
            };
            onAttendance(newRecord);
            setLoggedMessage("Check-in Successful");
            setTimeout(() => setLoggedMessage(null), 3000);
          }
        }
      } else {
        nextCooldown = 3500;
      }
    } catch (e) {
      console.error("Scan failed", e);
      nextCooldown = 4000;
    } finally {
      setScanStatus('cooldown');
      setTimeout(() => { if (isActiveRef.current) setScanStatus('scanning'); }, nextCooldown);
    }
  }, [isActive, scanStatus, users, captureFrame, onAttendance, recentRecords]);

  useEffect(() => {
    if (isActive && scanStatus === 'scanning') processFrame();
  }, [isActive, scanStatus, processFrame]);

  useEffect(() => {
    if (isActive && scanStatus === 'idle') setScanStatus('scanning');
  }, [isActive, scanStatus]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative transition-colors">
      
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-start">
        <div className="flex flex-col">
           <div className="flex items-center space-x-2">
             <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
             <h2 className="text-white font-medium text-sm drop-shadow-md">Live Camera Feed</h2>
           </div>
           {isActive && (
             <p className="text-white/80 text-xs mt-1 ml-4.5">{scanStatus === 'processing' ? 'Processing...' : 'Scanning...'}</p>
           )}
        </div>
        
        {!isActive ? (
          <button 
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 rounded-lg text-sm font-medium shadow-lg transition-all"
          >
            <Camera size={16} />
            Start Camera
          </button>
        ) : (
          <button 
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 rounded-lg text-sm font-medium transition-all"
          >
            <UserX size={16} />
            Stop Camera
          </button>
        )}
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        
        {error && (
          <div className="absolute z-30 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl max-w-sm text-center mx-4">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Camera Error</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">{error}</p>
          </div>
        )}

        {!isActive && !error && (
          <div className="text-white/50 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
               <Camera size={32} />
            </div>
            <p className="text-sm font-medium">Camera is offline</p>
            <p className="text-xs mt-1 opacity-70">Click 'Start Camera' to begin attendance</p>
          </div>
        )}

        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity`} 
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* HUD Elements */}
        {isActive && (
          <>
            {/* Simple Overlay Frame */}
            <div className="absolute inset-8 border-2 border-white/20 rounded-2xl pointer-events-none"></div>

            {/* Attendance Logged Notification */}
            {loggedMessage && (
               <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="bg-white text-slate-800 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-slate-100">
                   <div className="bg-emerald-100 p-1 rounded-full">
                     <CheckCircle2 size={16} className="text-emerald-600" strokeWidth={3} />
                   </div>
                   <span className="font-semibold text-sm">{loggedMessage}</span>
                 </div>
               </div>
            )}

            {/* Success Overlay */}
            {matchFlash && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                 <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                   <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
                     <UserCheck size={40} className="text-emerald-600" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome!</h2>
                   <p className="text-slate-500 mb-4">Good to see you.</p>
                   <div className="bg-slate-50 py-2 px-4 rounded-lg font-semibold text-lg text-slate-700">
                     {matchFlash.name}
                   </div>
                 </div>
              </div>
            )}

            {/* Scanning Line - Professional */}
            {!matchFlash && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                 <div className="w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan-line"></div>
              </div>
            )}
            
            {/* Bottom Analysis Panel */}
            {lastScanResult && !matchFlash && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md px-4">
                 <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/50 dark:border-slate-700/50 flex items-center gap-4">
                    <div className={`p-2 rounded-full ${lastScanResult.matchFound ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                      {lastScanResult.matchFound ? <UserCheck size={20} /> : <RefreshCw size={20} className={scanStatus === 'processing' ? 'animate-spin' : ''} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Status</p>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {lastScanResult.matchFound 
                          ? `Identified: ${users.find(u => u.id === lastScanResult.matchId)?.name}` 
                          : 'Scanning faces...'}
                      </h4>
                    </div>
                    {lastScanResult.demographics && (
                      <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                        <p className="text-xs text-slate-400">Est. Age</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{lastScanResult.demographics.age_range || '--'}</p>
                      </div>
                    )}
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Scanner;