import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export interface AppVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  isPlaying?: boolean;
  isMuted?: boolean;
  style?: any;
  showsControls?: boolean;
  seekToSeconds?: number | null;
  replayTrigger?: number;
  contentFit?: 'contain' | 'cover';
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

const NativeVideoPlayer: React.FC<AppVideoPlayerProps> = ({
  videoUrl,
  isPlaying = true,
  isMuted = false,
  style,
  showsControls = false,
  seekToSeconds,
  replayTrigger,
  contentFit = 'contain',
  onProgressUpdate,
  onEnded,
}) => {
  const player = useVideoPlayer({ uri: videoUrl }, (p: any) => {
    p.loop = true;
    p.muted = !!isMuted;
  });

  // Play / Pause / Mute synchronization & playback enforcer
  useEffect(() => {
    if (!player) return;
    player.muted = !!isMuted;

    if (isPlaying) {
      player.play();

      // Active retries to start network video stream immediately
      const t1 = setTimeout(() => { try { player.play(); } catch (e) {} }, 100);
      const t2 = setTimeout(() => { try { player.play(); } catch (e) {} }, 400);
      const t3 = setTimeout(() => { try { player.play(); } catch (e) {} }, 900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      player.pause();
    }
  }, [player, isPlaying, isMuted, videoUrl]);

  // Replay trigger
  useEffect(() => {
    if (player && replayTrigger && replayTrigger > 0) {
      player.currentTime = 0;
      player.play();
    }
  }, [replayTrigger, player]);

  // Seek position
  useEffect(() => {
    if (player && seekToSeconds !== undefined && seekToSeconds !== null && seekToSeconds >= 0) {
      player.currentTime = seekToSeconds;
    }
  }, [seekToSeconds, player]);

  // Periodic progress reporting
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      try {
        const cur = player.currentTime || 0;
        const dur = player.duration || 0;
        if (onProgressUpdate) {
          onProgressUpdate(cur, dur);
        }
        if (dur > 0 && cur >= dur - 0.2 && onEnded) {
          onEnded();
        }
      } catch (e) {}
    }, 250);

    return () => clearInterval(interval);
  }, [player, onProgressUpdate, onEnded]);

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.nativeVideo}
        nativeControls={showsControls}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit={contentFit}
      />
    </View>
  );
};

export const AppVideoPlayer: React.FC<AppVideoPlayerProps> = (props) => {
  const {
    videoUrl,
    posterUrl,
    isPlaying = true,
    isMuted = false,
    style,
    showsControls = false,
    seekToSeconds,
    replayTrigger,
    contentFit = 'contain',
    onProgressUpdate,
    onEnded,
  } = props;

  const videoRef = useRef<any>(null);

  if (Platform.OS === 'web') {
    // Play/Pause sync
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = !!isMuted;
        if (isPlaying) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
    }, [isPlaying, isMuted]);

    // Replay trigger
    useEffect(() => {
      if (videoRef.current && replayTrigger && replayTrigger > 0) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, [replayTrigger]);

    // Seek position
    useEffect(() => {
      if (videoRef.current && seekToSeconds !== undefined && seekToSeconds !== null && seekToSeconds >= 0) {
        videoRef.current.currentTime = seekToSeconds;
      }
    }, [seekToSeconds]);

    return (
      <View style={[styles.container, style]}>
        {React.createElement('video', {
          ref: videoRef,
          src: videoUrl,
          poster: posterUrl,
          controls: showsControls,
          autoPlay: isPlaying,
          muted: isMuted,
          playsInline: true,
          onTimeUpdate: (e: any) => {
            const el = e.target;
            if (el && onProgressUpdate) {
              onProgressUpdate(el.currentTime || 0, el.duration || 0);
            }
          },
          onEnded: () => {
            if (onEnded) onEnded();
          },
          style: {
            width: '100%',
            height: '100%',
            objectFit: contentFit,
            backgroundColor: '#000000',
          },
        })}
      </View>
    );
  }

  return <NativeVideoPlayer {...props} showsControls={showsControls} contentFit={contentFit} />;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
});
