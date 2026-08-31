import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {
  Play,
  Pause,
  X,
  VolumeX,
  Volume2,
  RotateCcw,
  Maximize2,
  Minimize,
  ShieldCheck,
  Factory,
  Award,
  Film,
  Video,
  ChevronDown,
} from 'lucide-react-native';
import { AppVideoPlayer } from '../components/AppVideoPlayer';
import { VideoPlayerModal } from '../components/VideoPlayerModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_URL = 'https://saibalajisilverworkspvtltd.com';
const INITIAL_DISPLAY_COUNT = 6;
const BATCH_LOAD_COUNT = 6;

interface ActiveVideo {
  id?: number;
  title: string;
  description: string;
  category?: string;
  code?: string;
  video_url?: string;
  thumbnail_url?: string;
}

export const AboutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Video Gallery API State
  const [videoList, setVideoList] = useState<ActiveVideo[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(INITIAL_DISPLAY_COUNT);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);

  // Video Player Modal & Thumbnail State
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPlayingModal, setIsPlayingModal] = useState(true);
  const [isMutedModal, setIsMutedModal] = useState(false);
  const [modalProgress, setModalProgress] = useState(0);
  const [currentTimeModal, setCurrentTimeModal] = useState<number>(0);
  const [durationModal, setDurationModal] = useState<number>(0);
  const [replayTriggerModal, setReplayTriggerModal] = useState<number>(0);
  const [seekToSecondsModal, setSeekToSecondsModal] = useState<number | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);
  const [thumbnailMap, setThumbnailMap] = useState<Record<string, string>>({});

  // Screen orientation lock for fullscreen video
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (isFullscreenModal && isVideoModalOpen) {
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
  }, [isFullscreenModal, isVideoModalOpen]);

  // Fetch Videos from API
  useEffect(() => {
    const fetchVideoGallery = async () => {
      try {
        setIsLoadingVideos(true);
        const response = await fetch(`${BASE_URL}/api/v1/content/videos`);
        const json = await response.json();
        const rawItems = json?.value || json || [];

        const formattedItems: ActiveVideo[] = rawItems.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category || 'Craftsmanship',
          code: item.filename ? `#${item.filename.replace('.MP4', '')}` : '',
          video_url: item.video_url?.startsWith('/')
            ? `${BASE_URL}${item.video_url}`
            : item.video_url,
          thumbnail_url: item.thumbnail_url?.startsWith('/')
            ? `${BASE_URL}${item.thumbnail_url}`
            : (item.thumbnail_url || 'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Floral%20Engraved%20Silver%20Pooja%20Thali%20Set.webp'),
        }));

        setVideoList(formattedItems);
      } catch (error) {
        console.error('Failed to load video archive gallery:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideoGallery();
  }, []);

  // Generate real video frame thumbnails for videoList
  useEffect(() => {
    if (videoList.length === 0) return;

    let isMounted = true;
    const generateThumbnails = async () => {
      for (const vid of videoList) {
        if (vid.video_url && !thumbnailMap[vid.video_url]) {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(vid.video_url, { time: 800 });
            if (uri && isMounted) {
              setThumbnailMap((prev) => ({ ...prev, [vid.video_url!]: uri }));
            }
          } catch (e) {}
        }
      }
    };

    generateThumbnails();

    return () => {
      isMounted = false;
    };
  }, [videoList]);

  // Generate thumbnails for fixed featured & doc videos
  useEffect(() => {
    let isMounted = true;
    const initFixedThumbnails = async () => {
      const urls = [
        `${BASE_URL}/public/videos/6Z1A1842.MP4`,
        `${BASE_URL}/public/videos/6Z1A1823.MP4`,
      ];
      for (const url of urls) {
        if (url && !thumbnailMap[url]) {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(url, { time: 800 });
            if (uri && isMounted) {
              setThumbnailMap((prev) => ({ ...prev, [url]: uri }));
            }
          } catch (e) {}
        }
      }
    };
    initFixedThumbnails();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenVideo = (video: ActiveVideo) => {
    setActiveVideo(video);
    setIsPlayingModal(true);
    setIsMutedModal(false);
    setModalProgress(0);
    setCurrentTimeModal(0);
    setDurationModal(0);
    setSeekToSecondsModal(null);
    setIsFullscreenModal(false);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideo = async () => {
    setIsFullscreenModal(false);
    setIsVideoModalOpen(false);
    setActiveVideo(null);
    if (Platform.OS !== 'web') {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (e) {}
    }
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + BATCH_LOAD_COUNT);
  };

  const docVideoData: ActiveVideo = {
    title: 'High Precision Laser Engraving #1842',
    description:
      'Unscripted footage of high precision laser engraving at our Tenali silver manufacturing facility. File code: 6Z1A1842.MP4.',
    code: '#6Z1A1842',
    video_url: `${BASE_URL}/public/videos/6Z1A1842.MP4`,
    thumbnail_url: 'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Floral%20Engraved%20Silver%20Pooja%20Thali%20Set.webp',
  };

  const mfgVideoData: ActiveVideo = {
    title: 'Silver Kalash & Diya Polishing #1823',
    description:
      'Unscripted footage of silver kalash & diya polishing at our Tenali silver manufacturing facility. File code: 6Z1A1823.MP4.',
    code: '#6Z1A1823',
    video_url: `${BASE_URL}/public/videos/6Z1A1823.MP4`,
    thumbnail_url: 'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Royal%20Floral%20Crest%20Silver%20Serving%20Tray.webp',
  };

  const visibleVideos = videoList.slice(0, displayCount);
  const remainingCount = Math.max(0, videoList.length - displayCount);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6F1" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 20, 24),
          paddingBottom: Math.max(insets.bottom + 40, 40),
          paddingHorizontal: 20,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO CREST CARD */}
        <View style={styles.crestFrame}>
          <Image
            source={require('../../assets/logo.webp')}
            style={styles.crestImage}
            resizeMode="contain"
          />
        </View>

        {/* SUBTAG */}
        <Text style={styles.subtag}>HERITAGE & CRAFTSMANSHIP</Text>

        {/* MAIN TITLE */}
        <Text style={styles.title}>The Journey of Sai Balaji Silverworks</Text>

        {/* SUBTITLE */}
        <Text style={styles.subtitle}>
          Combining ancestral metallurgic mastery with modern NABL hallmarking techniques to craft pure 925 sterling & 999 fine silver.
        </Text>

        {/* DOCUMENTARY VIDEO CARD */}
        <TouchableOpacity
          style={styles.videoCard}
          activeOpacity={0.92}
          onPress={() => handleOpenVideo(docVideoData)}
        >
          <Image
            source={{
              uri:
                thumbnailMap[docVideoData.video_url!] ||
                docVideoData.thumbnail_url ||
                'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Floral%20Engraved%20Silver%20Pooja%20Thali%20Set.webp',
            }}
            style={{ ...StyleSheet.absoluteFillObject, opacity: 0.45 }}
            resizeMode="cover"
          />
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>COMPANY DOCUMENTARY VIDEO</Text>
          </View>

          <Text style={styles.videoTitle}>{docVideoData.title}</Text>

          <Text style={styles.videoDesc}>{docVideoData.description}</Text>

          <View style={styles.playButtonCircle}>
            <Play size={20} color="#1A1918" fill="#1A1918" style={{ marginLeft: 2 }} />
          </View>
        </TouchableOpacity>

        {/* BOTTOM SECTION HEADING */}
        <Text style={styles.bottomHeading}>
          Master Craftsmen in Silver Manufacturing
        </Text>

        {/* PARAGRAPH 1 */}
        <Text style={styles.bodyParagraph}>
          Sai Balaji Silverworks was founded on a singular vision: to produce silver products of unquestionable purity and timeless elegance. From our high-precision casting lines in Tenali to our intricate hand-carving artisan studios, every stage of production reflects uncompromising commitment.
        </Text>

        {/* PARAGRAPH 2 */}
        <Text style={styles.bodyParagraph}>
          Whether supplying bulk silver idols to prominent temples across South India or manufacturing bespoke 925 sterling jewellery collections for premium retail stores, our products carry the official seal of trust.
        </Text>

        {/* SILVER IDOL / ARTISAN PRODUCT IMAGE CARD */}
        <View style={styles.imageCardContainer}>
          <Image
            source={require('../../assets/homescreen.webp')}
            style={styles.productArtisanImage}
            resizeMode="contain"
          />
        </View>

        {/* FEATURED VIDEO — MANUFACTURING UNIT CARD */}
        <View style={styles.featuredMfgCard}>
          <TouchableOpacity
            style={styles.featuredVideoThumbnailBox}
            activeOpacity={0.9}
            onPress={() => handleOpenVideo(mfgVideoData)}
          >
            <Image
              source={{
                uri:
                  thumbnailMap[mfgVideoData.video_url!] ||
                  mfgVideoData.thumbnail_url ||
                  'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Royal%20Floral%20Crest%20Silver%20Serving%20Tray.webp',
              }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              resizeMode="cover"
            />
            <View style={styles.featuredVideoOverlay}>
              <View style={styles.goldPlayCircle}>
                <Play size={22} color="#1A1918" fill="#1A1918" style={{ marginLeft: 2 }} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.featuredContentBox}>
            <Text style={styles.featuredSubtag}>FEATURED VIDEO — MANUFACTURING UNIT</Text>
            <Text style={styles.featuredTitle}>{mfgVideoData.title}</Text>
            <Text style={styles.featuredDesc}>{mfgVideoData.description}</Text>

            <TouchableOpacity
              style={styles.playTourBtn}
              activeOpacity={0.88}
              onPress={() => handleOpenVideo(mfgVideoData)}
            >
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playTourBtnText}>PLAY MANUFACTURING TOUR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PILLARS GRID (3 CARDS) */}
        <View style={styles.pillarsContainer}>
          <View style={styles.pillarCard}>
            <View style={styles.pillarIconCircle}>
              <ShieldCheck size={20} color="#C5A059" />
            </View>
            <Text style={styles.pillarTitle}>Spectrometer Purity</Text>
            <Text style={styles.pillarDesc}>
              Every melt batch undergoes chemical analysis to guarantee exact 92.5% and 99.9% purity standards.
            </Text>
          </View>

          <View style={styles.pillarCard}>
            <View style={styles.pillarIconCircle}>
              <Factory size={20} color="#C5A059" />
            </View>
            <Text style={styles.pillarTitle}>In-House Unit</Text>
            <Text style={styles.pillarDesc}>
              Complete control over silver refining, sheet rolling, wire drawing, casting, polishing, and anti-tarnish coating.
            </Text>
          </View>

          <View style={styles.pillarCard}>
            <View style={styles.pillarIconCircle}>
              <Award size={20} color="#C5A059" />
            </View>
            <Text style={styles.pillarTitle}>Pan-India B2B Supply</Text>
            <Text style={styles.pillarDesc}>
              Trusted wholesale partner for jewellers, corporate houses, and temples requiring reliable bulk supply.
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* CRAFTSMANSHIP VIDEO GALLERY (API FETCHED FROM SAIBALAJISILVERWORKSPVTLTD)  */}
        {/* ========================================================================= */}
        <View style={styles.gallerySectionContainer}>
          {/* GALLERY SECTION HEADER */}
          <View style={styles.galleryHeaderBox}>
            <View style={styles.galleryTagRow}>
              <View style={styles.galleryFilmBadge}>
                <Film size={14} color="#C5A059" />
              </View>
              <Text style={styles.gallerySubtag}>FACTORY & STUDIO ARCHIVE</Text>
            </View>

            <Text style={styles.galleryTitle}>Craftsmanship Video Gallery</Text>

            <Text style={styles.gallerySubtitle}>
              Unfiltered video clips from our Tenali silver manufacturing plant and artisan studios.
            </Text>

            {/* COUNT PILL */}
            <View style={styles.countPill}>
              <Video size={13} color="#C5A059" />
              <Text style={styles.countPillText}>
                <Text style={{ fontWeight: '800' }}>
                  {videoList.length > 0 ? videoList.length : 171}
                </Text>{' '}
                Videos Available
              </Text>
            </View>
          </View>

          {/* GALLERY VIDEO LIST */}
          {isLoadingVideos ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#C5A059" />
              <Text style={styles.loadingText}>Fetching Craftsmanship Videos...</Text>
            </View>
          ) : visibleVideos.length > 0 ? (
            <View style={styles.videoListContainer}>
              {visibleVideos.map((video, index) => (
                <TouchableOpacity
                  key={video.id || index}
                  style={styles.galleryVideoCard}
                  activeOpacity={0.92}
                  onPress={() => handleOpenVideo(video)}
                >
                  {/* VIDEO THUMBNAIL CONTAINER */}
                  <View style={styles.galleryThumbnailFrame}>
                    <Image
                      source={{
                        uri:
                          (video.video_url && thumbnailMap[video.video_url]) ||
                          (video.thumbnail_url && !video.thumbnail_url.endsWith('.MP4') && !video.thumbnail_url.endsWith('.mp4')
                            ? video.thumbnail_url
                            : 'https://saibalajisilverworkspvtltd.com/public/Saibalaji%20products%20S/Floral%20Engraved%20Silver%20Pooja%20Thali%20Set.webp'),
                      }}
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      resizeMode="cover"
                    />
                    {/* TOP BADGES */}
                    <View style={styles.galleryBadgesOverlay}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>
                          {(video.category || 'CRAFTSMANSHIP').toUpperCase()}
                        </Text>
                      </View>

                      {video.code ? (
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>{video.code}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* CENTER PLAY BUTTON */}
                    <View style={styles.galleryPlayOverlay}>
                      <View style={styles.galleryPlayCircle}>
                        <Play size={20} color="#1A1918" fill="#1A1918" style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </View>

                  {/* BOTTOM INFO CONTAINER */}
                  <View style={styles.galleryInfoBox}>
                    <Text style={styles.galleryCardTitle} numberOfLines={1}>
                      {video.title}
                    </Text>
                    <Text style={styles.galleryCardDesc} numberOfLines={2}>
                      {video.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noVideosBox}>
              <Film size={32} color="#999999" />
              <Text style={styles.noVideosText}>No videos available</Text>
            </View>
          )}

          {/* LOAD MORE BUTTON */}
          {remainingCount > 0 && !isLoadingVideos && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              activeOpacity={0.88}
              onPress={handleLoadMore}
            >
              <Text style={styles.loadMoreText}>
                LOAD MORE CRAFTSMANSHIP VIDEOS ({remainingCount} REMAINING)
              </Text>
              <ChevronDown size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* VIDEO PLAYER SHOWCASE MODAL ADOPTED FROM SAIBALAJI_SILVERWORKS */}
      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setActiveVideo(null);
        }}
        videoUrl={activeVideo?.video_url || ''}
        posterUrl={
          activeVideo?.video_url
            ? thumbnailMap[activeVideo.video_url] || activeVideo.thumbnail_url
            : activeVideo?.thumbnail_url
        }
        title={activeVideo?.title}
        description={activeVideo?.description}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  crestFrame: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  crestImage: {
    width: 46,
    height: 46,
  },

  subtag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B9A77A',
    letterSpacing: 2.5,
    marginBottom: 10,
    textAlign: 'center',
  },

  title: {
    fontSize: 27,
    fontWeight: '400',
    color: '#202020',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 12.5,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 340,
    marginBottom: 28,
  },

  videoCard: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 22,
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  docBadge: {
    backgroundColor: '#B9A77A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  docBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  videoDesc: {
    color: '#D0D0D0',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 18,
  },
  playButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomHeading: {
    alignSelf: 'flex-start',
    fontSize: 23,
    fontWeight: 'normal',
    color: '#202020',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 30,
    marginBottom: 14,
  },

  bodyParagraph: {
    alignSelf: 'stretch',
    fontSize: 13,
    color: '#444444',
    lineHeight: 21,
    marginBottom: 16,
    textAlign: 'left',
  },

  imageCardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  productArtisanImage: {
    width: '100%',
    height: 320,
  },

  // FEATURED VIDEO MANUFACTURING UNIT CARD
  featuredMfgCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    padding: 16,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredVideoThumbnailBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  featuredVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  goldPlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  featuredContentBox: {
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  featuredSubtag: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  featuredTitle: {
    color: '#1A1918',
    fontSize: 22,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  featuredDesc: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },
  playTourBtn: {
    backgroundColor: '#1A1918',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  playTourBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // PILLARS GRID STYLES MATCHING SCREENSHOT
  pillarsContainer: {
    width: '100%',
    gap: 16,
    marginTop: 10,
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E6E1DA',
    paddingTop: 24,
  },
  pillarCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    padding: 24,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pillarIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pillarTitle: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  pillarDesc: {
    fontSize: 12.5,
    color: '#666666',
    lineHeight: 18,
  },

  // CRAFTSMANSHIP VIDEO GALLERY STYLES
  gallerySectionContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E6E1DA',
    paddingTop: 28,
    marginTop: 8,
    marginBottom: 20,
  },
  galleryHeaderBox: {
    marginBottom: 22,
    gap: 8,
  },
  galleryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  galleryFilmBadge: {
    padding: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderRadius: 8,
  },
  gallerySubtag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C5A059',
    letterSpacing: 2,
  },
  galleryTitle: {
    fontSize: 26,
    fontWeight: 'normal',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 2,
  },
  gallerySubtitle: {
    fontSize: 12.5,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 4,
  },
  countPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    marginTop: 6,
  },
  countPillText: {
    fontSize: 11.5,
    color: '#444444',
  },

  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#888888',
  },

  noVideosBox: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    gap: 10,
  },
  noVideosText: {
    fontSize: 14,
    color: '#666666',
  },

  videoListContainer: {
    width: '100%',
    gap: 20,
  },
  galleryVideoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  galleryThumbnailFrame: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryBadgesOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  categoryPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(181, 152, 91, 0.6)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B5985B',
    letterSpacing: 0.8,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  galleryPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryInfoBox: {
    padding: 16,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  galleryCardTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  galleryCardDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
  },

  loadMoreBtn: {
    width: '100%',
    backgroundColor: '#1A1918',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // MODAL PLAYER STYLES MATCHING SCREENSHOT & LANDSCAPE FULLSCREEN
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullscreenModalOverlay: {
    padding: 0,
    backgroundColor: '#000000',
  },
  modalVideoCard: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C5A059',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  fullscreenVideoCard: {
    width: SCREEN_HEIGHT || '100%',
    height: SCREEN_WIDTH || '100%',
    borderRadius: 0,
    borderWidth: 0,
    justifyContent: 'space-between',
    transform: [{ rotate: '90deg' }],
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#000000',
  },
  modalShowcaseTag: {
    color: '#C5A059',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalVideoTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalVideoDisplayArea: {
    width: '100%',
    height: 210,
    backgroundColor: '#000000',
  },
  fullscreenVideoDisplayArea: {
    flex: 1,
    height: '100%',
  },
  modalControlsBar: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: '#000000',
  },
  scrubberLineBackground: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberLineFill: {
    height: 3,
    backgroundColor: '#C5A059',
    borderRadius: 2,
  },
  scrubberKnobDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C5A059',
    position: 'absolute',
    top: -5.5,
    marginLeft: -7,
  },
  controlsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goldPlayPauseCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtn: {
    padding: 4,
  },
  timerText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  rightControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  replayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  fullscreenBtn: {
    padding: 4,
  },
});

export default AboutScreen;
