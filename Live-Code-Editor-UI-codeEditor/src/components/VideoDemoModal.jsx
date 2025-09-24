import React, { useState, useRef, useEffect } from 'react';
import { Play, X, Volume2, VolumeX, Maximize, Minimize, RotateCcw } from 'lucide-react';

const VideoDemoModal = ({ 
  buttonText = "Watch Demo",
  buttonClassName = "group border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-gray-400 hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-base",
  showIcon = true,
  videoUrl: customVideoUrl
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  const modalRef = useRef(null);

  // Laravel video URL options with fallback
  const videoUrl = "../public/videos/demo-video.mp4";

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
    setCurrentTime(0);
    document.body.style.overflow = 'unset';
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {/* Watch Demo Button - Reusable */}
      <button 
        onClick={openModal}
        className={buttonClassName}
      >
        {showIcon && <Play className="w-4 h-4 group-hover:text-blue-600 transition-colors" />}
        {buttonText}
      </button>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            ref={modalRef}
            className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
              isFullscreen 
                ? 'w-full h-full rounded-none' 
                : 'w-full max-w-4xl mx-auto'
            }`}
          >
            {/* Close Button */}
            {!isFullscreen && (
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Video Container */}
            <div className="relative group">
              <video
                ref={videoRef}
                className="w-full h-auto max-h-[80vh] object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                poster="https://via.placeholder.com/1280x720/1e293b/ffffff?text=Code+Editor+Demo"
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Video Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-200 transform hover:scale-110"
                  >
                    <Play className={`w-8 h-8 ${isPlaying ? 'hidden' : 'block'}`} />
                  </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {/* Progress Bar */}
                  <div 
                    className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-150"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlay}
                        className="hover:text-blue-400 transition-colors"
                      >
                        <Play className={`w-5 h-5 ${isPlaying ? 'hidden' : 'block'}`} />
                        <div className={`w-5 h-5 ${isPlaying ? 'block' : 'hidden'}`}>⏸️</div>
                      </button>
                      
                      <button
                        onClick={restartVideo}
                        className="hover:text-blue-400 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={toggleMute}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFullscreen}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                      </button>
                      
                      {isFullscreen && (
                        <button
                          onClick={closeModal}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            {!isFullscreen && (
              <div className="p-6 bg-gray-900 text-white">
                <h3 className="text-xl font-bold mb-2">Code Editor Demo</h3>
                <p className="text-gray-300 text-sm">
                  Learn how to use our powerful code editor with real-time collaboration, 
                  multiple language support, and instant code execution.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VideoDemoModal;