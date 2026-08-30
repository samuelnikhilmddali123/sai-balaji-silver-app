import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Play,
  Pause,
  X,
  ChevronDown,
  Film,
  Video as VideoIcon,
  Search,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import {
  CRAFTSMANSHIP_VIDEOS,
  CraftsmanshipVideo,
} from '../data/craftsmanshipVideos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44 - 12) / 2;

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'All Reels' },
  { id: 'MELTING & CASTING UNIT', label: 'Melting & Casting' },
  { id: 'SILVER IDOLS & MANDIR ITEMS', label: 'Idols & Mandir' },
  { id: 'DINING & POOJA TABLEWARE', label: 'Dining & Tableware' },
  { id: 'SPECTROMETER & QUALITY TESTING', label: 'Quality & Testing' },
  { id: 'SILVER WIRE & SHEET ROLLING', label: 'Wire & Rolling' },
  { id: 'HAND ENGRAVING & FILIGREE', label: 'Engraving & Filigree' },
  { id: 'BUFFING & POLISHING ATELIER', label: 'Buffing & Polishing' },
  { id: 'SILVER COIN & BULLION MINTING', label: 'Coin Minting' },
];

export const CraftsmanshipVideosSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [videoDisplayCount, setVideoDisplayCount] = useState<number>(10);
  const [activeModalVideo, setActiveModalVideo] = useState<CraftsmanshipVideo | null>(null);

  // Video playback state inside modal
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0.35);

  // Filter logic
  const filteredVideos = useMemo(() => {
    return CRAFTSMANSHIP_VIDEOS.filter((vid) => {
      const matchesCat =
        selectedCategory === 'ALL' || vid.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vid.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vid.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vid.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Handle category change -> reset display count to 10
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setVideoDisplayCount(10);
  };

  // Handle search change -> reset display count to 10
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setVideoDisplayCount(10);
  };

  // Displayed subset
  const displayedVideos = useMemo(() => {
    return filteredVideos.slice(0, videoDisplayCount);
  }, [filteredVideos, videoDisplayCount]);

  const remainingCount = Math.max(0, filteredVideos.length - videoDisplayCount);

  // Handle load more (+10)
  const handleLoadMore = () => {
    setVideoDisplayCount((prev) => prev + 10);
  };

  const handleOpenVideo = (video: CraftsmanshipVideo) => {
    setActiveModalVideo(video);
    setIsPlaying(true);
  };

  const handleCloseVideo = () => {
    setActiveModalVideo(null);
  };

  return (
    <View style={styles.sectionContainer}>
      {/* SECTION HEADER */}
      <View style={styles.headerBlock}>
        {/* Eyebrow badge */}
        <View style={styles.eyebrowBadge}>
          <View style={styles.filmIconBox}>
            <Film size={14} color="#B5985B" />
          </View>
          <Text style={styles.eyebrowText}>LIVE FACTORY & STUDIO REELS</Text>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Craftsmanship Video Atelier</Text>

        {/* Section Description */}
        <Text style={styles.sectionDesc}>
          Browse all {CRAFTSMANSHIP_VIDEOS.length} unscripted, silent video clips from our Tenali silver manufacturing plant.
        </Text>

        {/* Count Pill */}
        <View style={styles.countPill}>
          <VideoIcon size={16} color="#B5985B" />
          <Text style={styles.countPillText}>
            {filteredVideos.length} Videos Available
          </Text>
        </View>
      </View>

      {/* CATEGORY FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipActive,
              ]}
              onPress={() => handleCategoryChange(cat.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SEARCH INPUT BAR */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by code (#6Z1A...) or process..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <X size={16} color="#888888" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2-COLUMN VIDEO CARDS GRID */}
      <View style={styles.videoGrid}>
        {displayedVideos.map((vid) => (
          <TouchableOpacity
            key={vid.id}
            style={styles.videoCard}
            onPress={() => handleOpenVideo(vid)}
            activeOpacity={0.9}
          >
            {/* Background Thumbnail Image */}
            <Image
              source={{ uri: vid.thumbnail }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={styles.darkOverlay} />

            {/* TOP ROW BADGES */}
            <View style={styles.cardTopRow}>
              {/* Category Badge */}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText} numberOfLines={2}>
                  {vid.category}
                </Text>
              </View>

              {/* Code Badge */}
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{vid.code}</Text>
              </View>
            </View>

            {/* PLAY BUTTON */}
            <View style={styles.playBtnContainer}>
              <View style={styles.playBtnCircle}>
                <Play size={18} color="#1A2332" style={{ marginLeft: 2 }} />
              </View>
            </View>

            {/* BOTTOM DETAILS */}
            <View style={styles.cardBottomBlock}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {vid.title}
              </Text>
              <Text style={styles.videoDesc} numberOfLines={2}>
                {vid.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* LOAD MORE BUTTON */}
      {remainingCount > 0 && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={handleLoadMore}
          activeOpacity={0.88}
        >
          <Text style={styles.loadMoreText}>
            LOAD MORE CRAFTSMANSHIP VIDEOS ({remainingCount} REMAINING)
          </Text>
          <ChevronDown size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      )}

      {/* FULL-SCREEN / OVERLAY VIDEO PLAYBACK MODAL */}
      <Modal
        visible={activeModalVideo !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseVideo}
      >
        {activeModalVideo && (
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              {/* MODAL HEADER */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalCategory}>{activeModalVideo.category}</Text>
                  <Text style={styles.modalCode}>{activeModalVideo.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={handleCloseVideo}
                  activeOpacity={0.8}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* VIDEO PLAYER DISPLAY CONTAINER */}
              <View style={styles.videoPlayerFrame}>
                {Platform.OS === 'web' ? (
                  // HTML5 Video Player for Web platform
                  <video
                    src={activeModalVideo.videoUrl}
                    poster={activeModalVideo.thumbnail}
                    controls
                    autoPlay
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  // Interactive Video Preview Frame for Mobile
                  <View style={styles.mobileVideoFrame}>
                    <Image
                      source={{ uri: activeModalVideo.thumbnail }}
                      style={styles.mobileVideoPoster}
                      resizeMode="cover"
                    />
                    <View style={styles.mobileVideoOverlay} />

                    {/* Center Play/Pause button */}
                    <TouchableOpacity
                      style={styles.modalPlayCircle}
                      onPress={() => setIsPlaying(!isPlaying)}
                      activeOpacity={0.8}
                    >
                      {isPlaying ? (
                        <Pause size={28} color="#1A2332" />
                      ) : (
                        <Play size={28} color="#1A2332" style={{ marginLeft: 3 }} />
                      )}
                    </TouchableOpacity>

                    {/* Bottom playback progress controls bar */}
                    <View style={styles.playerControlsBar}>
                      <TouchableOpacity
                        onPress={() => setIsPlaying(!isPlaying)}
                        style={styles.ctrlBtn}
                      >
                        {isPlaying ? (
                          <Pause size={16} color="#FFFFFF" />
                        ) : (
                          <Play size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>

                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${progress * 100}%` },
                          ]}
                        />
                      </View>

                      <Text style={styles.timeText}>
                        {activeModalVideo.duration || '0:45'}
                      </Text>

                      <TouchableOpacity
                        onPress={() => setIsMuted(!isMuted)}
                        style={styles.ctrlBtn}
                      >
                        {isMuted ? (
                          <VolumeX size={16} color="#FFFFFF" />
                        ) : (
                          <Volume2 size={16} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* MODAL DETAILS BLOCK */}
              <View style={styles.modalDetailsBlock}>
                <Text style={styles.modalTitle}>{activeModalVideo.title}</Text>
                <Text style={styles.modalDesc}>{activeModalVideo.description}</Text>

                <View style={styles.atelierBadgeRow}>
                  <View style={styles.atelierBadge}>
                    <Text style={styles.atelierBadgeText}>
                      TENALI SILVERWORKS ATELIER • UNFILTRED FOOTAGE
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    paddingVertical: 36,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EAE6DF',
    alignItems: 'center',
  },
  headerBlock: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 24,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filmIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 2.5,
  },
  sectionTitle: {
    fontSize: 32,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#1A2332',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 520,
    marginBottom: 18,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  countPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2332',
  },

  // FILTER CHIPS
  filterScroll: {
    paddingHorizontal: 22,
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
  },
  filterChipActive: {
    backgroundColor: '#1C1D1F',
    borderColor: '#1C1D1F',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // SEARCH BAR
  searchContainer: {
    width: SCREEN_WIDTH - 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#202020',
  },

  // 2-COLUMN GRID
  videoGrid: {
    width: '100%',
    paddingHorizontal: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  videoCard: {
    width: CARD_WIDTH,
    height: 310,
    backgroundColor: '#000000',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  // TOP ROW
  cardTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(181, 152, 91, 0.5)',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    maxWidth: '65%',
  },
  categoryBadgeText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#E5C378',
    letterSpacing: 0.5,
    lineHeight: 11,
  },
  codeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // PLAY BUTTON
  playBtnContainer: {
    position: 'absolute',
    top: '42%',
    left: 14,
    zIndex: 2,
  },
  playBtnCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // BOTTOM DETAILS
  cardBottomBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 2,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    lineHeight: 18,
    marginBottom: 4,
  },
  videoDesc: {
    color: '#D0D0D0',
    fontSize: 10.5,
    lineHeight: 14,
  },

  // LOAD MORE BUTTON
  loadMoreBtn: {
    marginTop: 28,
    width: SCREEN_WIDTH - 44,
    backgroundColor: '#1C1D1F',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    textAlign: 'center',
  },

  // MODAL STYLING
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#121417',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2E35',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#22262C',
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 1.2,
  },
  modalCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#262A32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#22262C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // PLAYER FRAME
  videoPlayerFrame: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
    position: 'relative',
  },
  mobileVideoFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileVideoPoster: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mobileVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalPlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  playerControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    zIndex: 3,
  },
  ctrlBtn: {
    padding: 4,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#B5985B',
  },
  timeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // MODAL DETAILS
  modalDetailsBlock: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 20,
    marginBottom: 16,
  },
  atelierBadgeRow: {
    flexDirection: 'row',
  },
  atelierBadge: {
    backgroundColor: '#1E232B',
    borderWidth: 1,
    borderColor: '#343A44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  atelierBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 1.5,
  },
});
