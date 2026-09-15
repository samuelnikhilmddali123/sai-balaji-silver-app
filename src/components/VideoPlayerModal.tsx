import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize,
  RotateCcw,
} from 'lucide-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppVideoPlayer } from './AppVideoPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  posterUrl?: string;
  title?: string;
  description?: string;
  isPortrait?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  posterUrl,
  title = 'Sai Balaji Silverworks - Cinematic Showcase',
  description,
  isPortrait = false,
}) => {
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Auto-detect portrait orientation if url contains copy_42A5BAB8 or ends with .mov
  const isVideoPortrait =
    isPortrait ||
    videoUrl.includes('copy_42A5BAB8') ||
    videoUrl.toLowerCase().endsWith('.mov');

  // Reset state when modal opens or videoUrl changes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      setIsMuted(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setIsFullscreen(false);
      setReplayTrigger(0);
      setSeekToSeconds(null);
      setShowControls(true);
    }
  }, [isOpen, videoUrl]);

  // Handle Screen Orientation lock ONLY when user toggles Fullscreen for landscape video
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (isOpen && isFullscreen && !isVideoPortrait) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
      } else {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    }
    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    };
  }, [isOpen, isFullscreen, isVideoPortrait]);

  // Auto-hide controls after 5 seconds of playback
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, showControls]);

  const handleClose = () => {
    setIsFullscreen(false);
    setShowControls(true);
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }
    onClose();
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    setShowControls(true);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    setShowControls(true);
  };

  const handleReplay = () => {
    setReplayTrigger((prev) => prev + 1);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setShowControls(true);
  };

  const toggleControls = () => {
    setShowControls((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.backdrop,
          (isFullscreen || isVideoPortrait) && styles.fullscreenBackdrop,
        ]}
      >
        <View
          style={[
            styles.cardContainer,
            isVideoPortrait && styles.portraitCardContainer,
            isFullscreen && styles.fullscreenCardContainer,
          ]}
        >
          {/* 1. VIDEO PLAYER DISPLAY CONTAINER (Tap anywhere on video to toggle matter and timeline) */}
          <TouchableWithoutFeedback onPress={toggleControls}>
            <View style={styles.videoPlayerFrame}>
              {videoUrl ? (
                <AppVideoPlayer
                  videoUrl={videoUrl}
                  posterUrl={posterUrl}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  showsControls={false}
                  seekToSeconds={seekToSeconds}
                  replayTrigger={replayTrigger}
                  contentFit={isVideoPortrait ? 'contain' : isFullscreen ? 'cover' : 'contain'}
                  onProgressUpdate={(cur, dur) => {
                    setCurrentTime(cur);
                    setDuration(dur);
                    if (dur > 0) {
                      setProgress((cur / dur) * 100);
                    }
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setShowControls(true);
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#C5A059" />
                  <Text style={styles.bufferingText}>Loading video...</Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* 2. HEADER OVERLAY BAR (Matter/Title + Working X Button with safe area padding) */}
          {showControls && (
            <View
              style={[
                styles.headerBar,
                {
                  paddingTop: Math.max(insets.top + 8, 20),
                  paddingLeft: Math.max(insets.left + 16, 16),
                  paddingRight: Math.max(insets.right + 16, 16),
                },
              ]}
              pointerEvents="box-none"
            >
              <View style={{ flex: 1, paddingRight: 14 }} pointerEvents="none">
                <Text style={styles.eyebrowText}>
                  SAI BALAJI SILVERWORKS CINEMATIC SHOWCASE
                </Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
              >
                <X size={22} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. CONTROLS OVERLAY BAR AT BOTTOM (Timeline and action buttons) */}
          {showControls && (
            <View
              style={[
                styles.controlsBar,
                {
                  paddingBottom: Math.max(insets.bottom + 12, 18),
                  paddingLeft: Math.max(insets.left + 16, 16),
                  paddingRight: Math.max(insets.right + 16, 16),
                },
              ]}
              pointerEvents="auto"
            >
              {/* TIMELINE SCRUBBER */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={(evt) => {
                  if (duration > 0) {
                    const touchX = evt.nativeEvent.locationX;
                    const barWidth =
                      isFullscreen || isVideoPortrait
                        ? SCREEN_WIDTH - 48
                        : SCREEN_WIDTH * 0.85 - 32;
                    const ratio = Math.max(0, Math.min(1, touchX / barWidth));
                    const targetSec = ratio * duration;
                    setSeekToSeconds(targetSec);
                    setProgress(ratio * 100);
                    setCurrentTime(targetSec);
                  }
                }}
                style={styles.scrubberTrack}
              >
                <View style={[styles.scrubberFill, { width: `${progress}%` }]} />
                <View style={[styles.scrubberKnob, { left: `${progress}%` }]} />
              </TouchableOpacity>

              {/* ACTION BUTTONS ROW */}
              <View style={styles.actionRow}>
                {/* LEFT GROUP: PLAY/PAUSE, MUTE, TIMER */}
                <View style={styles.leftActionGroup}>
                  <TouchableOpacity
                    style={styles.goldPlayBtn}
                    onPress={togglePlay}
                    activeOpacity={0.8}
                  >
                    {isPlaying ? (
                      <Pause size={16} color="#1A1918" fill="#1A1918" />
                    ) : (
                      <Play size={16} color="#1A1918" fill="#1A1918" style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={toggleMute}
                    activeOpacity={0.8}
                  >
                    {isMuted ? (
                      <VolumeX size={18} color="#FF4D4D" />
                    ) : (
                      <Volume2 size={18} color="#C5A059" />
                    )}
                  </TouchableOpacity>

                  <Text style={styles.timerText}>
                    {duration > 0
                      ? `${Math.floor(currentTime)}s / ${Math.floor(duration)}s`
                      : '0s / 0s'}
                  </Text>
                </View>

                {/* RIGHT GROUP: REPLAY, FULLSCREEN */}
                <View style={styles.rightActionGroup}>
                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={handleReplay}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={14} color="#FFFFFF" />
                    <Text style={styles.replayBtnText}>Replay</Text>
                  </TouchableOpacity>

                  {/* Only show landscape fullscreen toggle if not already portrait fullscreen */}
                  {!isVideoPortrait && (
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={toggleFullscreen}
                      activeOpacity={0.8}
                    >
                      {isFullscreen ? (
                        <Minimize size={18} color="#C5A059" />
                      ) : (
                        <Maximize2 size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fullscreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 580,
    aspectRatio: 16 / 9,
    maxHeight: 360,
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    aspectRatio: undefined,
    backgroundColor: '#000000',
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    maxWidth: '100%',
    maxHeight: '100%',
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
    borderRadius: 0,
    borderWidth: 0,
  },

  // HEADER BAR
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  eyebrowText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C5A059',
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
    elevation: 60,
  },

  // VIDEO FRAME
  videoPlayerFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bufferingText: {
    fontSize: 12,
    color: '#C5A059',
    fontWeight: '600',
    letterSpacing: 1,
  },

  // CONTROLS BAR
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },

  // SCRUBBER
  scrubberTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#C5A059',
    borderRadius: 3,
  },
  scrubberKnob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C5A059',
    top: -4,
    marginLeft: -7,
  },

  // ACTION ROW
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goldPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 6,
  },
  timerText: {
    fontSize: 11,
    color: '#D0D0D0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  rightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replayBtnText: {
    fontSize: 11,
    color: '#D0D0D0',
  },
});
