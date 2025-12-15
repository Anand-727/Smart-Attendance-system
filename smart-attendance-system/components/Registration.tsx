import React, { useRef, useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { Camera, Save, RefreshCcw, UserPlus, ImagePlus } from 'lucide-react';

interface RegistrationProps {
  onRegister: (user: User) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera error", err);
      alert("Could not access camera");
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setIsCameraOpen(false);
      }
    }
  }, [stream]);

  const retake = () => {
    setPhoto(null);
    startCamera();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !photo) return;
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      role,
      registeredAt: new Date().toISOString(),
      photoBase64: photo
    };
    onRegister(newUser);
    setName('');
    setRole('');
    setPhoto(null);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[500px] transition-colors">
      
      {/* Left: Camera / Photo Area */}
      <div className="w-full md:w-5/12 bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center border-r border-slate-200 dark:border-slate-800 transition-colors">
        
        {!isCameraOpen && !photo && (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <ImagePlus size={32} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold mb-2">Employee Photo</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-[200px] mx-auto">
              Capture a clear photo for the facial recognition system.
            </p>
            <button 
              onClick={startCamera}
              className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Open Camera
            </button>
          </div>
        )}

        {isCameraOpen && !photo && (
          <div className="relative w-full h-full flex flex-col bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            
            <button 
              onClick={capturePhoto}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg cursor-pointer z-20"
            >
               <div className="w-10 h-10 bg-slate-900 rounded-full border-2 border-white"></div>
            </button>
          </div>
        )}

        {photo && (
          <div className="relative w-full h-full">
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <button onClick={retake} className="bg-white text-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 transition-all text-sm font-medium shadow-lg">
                 <RefreshCcw size={16} /> Retake Photo
               </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Right: Form Area */}
      <div className="w-full md:w-7/12 p-10 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            Register Employee
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Create a new personnel profile in the system.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-slate-400"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>
          
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">Role / Designation</label>
            <input 
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg px-4 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-slate-400"
              placeholder="e.g. Senior Analyst"
              required
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={!photo || !name || !role}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                (!photo || !name || !role) 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md'
              }`}
            >
              <Save size={18} />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;