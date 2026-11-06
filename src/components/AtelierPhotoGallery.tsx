import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_URL = 'https://www.saibalajisilverworkspvtltd.com';

export interface GalleryItem {
  id: number;
  filename?: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  sort_order?: number;
  is_active?: boolean;
  tags?: string[];
}

const FALLBACK_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    filename: 'IMG-20260919-WA0003.webp',
    title: 'Silver Plate Flame Annealing & Thermal Conditioning',
    category: 'Artisan Craftsmanship',
    description:
      'Master artisan performing precision gas-torch flame annealing on circular pure silver blanks to relieve internal metal stress prior to deep spinning.',
    image_url: '/public/gallery/IMG-20260919-WA0003.webp',
    sort_order: 1,
    is_active: true,
    tags: ['Annealing', 'Torch', 'Silver Plate', 'Master Artisan'],
  },
  {
    id: 2,
    filename: 'IMG-20260919-WA0006.webp',
    title: 'Precision Lathe Spinning & Cylindrical Forming',
    category: 'Metal Spinning',
    description:
      'High-precision manual pressure tool forming rotating pure silver vessels to exact dimensional symmetry and seamless contouring.',
    image_url: '/public/gallery/IMG-20260919-WA0006.webp',
    sort_order: 2,
    is_active: true,
    tags: ['Lathe', 'Spinning', 'Vessels', 'Precision Tooling'],
  },
  {
    id: 3,
    filename: 'IMG-20260919-WA0009.webp',
    title: 'Artisan Manual Lathe Turning & Contour Polishing',
    category: 'Artisan Craftsmanship',
    description:
      'Skilled artisan guiding high-torque steel levers on the spinning lathe to achieve mirror curvature for premium temple articles.',
    image_url: '/public/gallery/IMG-20260919-WA0009.webp',
    sort_order: 3,
    is_active: true,
    tags: ['Craftsman', 'Lathe', 'Silver Forming', 'Tenali Atelier'],
  },
  {
    id: 4,
    filename: 'IMG-20260919-WA0010.webp',
    title: 'Hydraulic Deep-Drawing Stamping & Forming Press',
    category: 'Industrial Machinery',
    description:
      'High-tonnage hydraulic deep-drawing press utilized for seamless compression forming of silver utensils and sacred puja articles.',
    image_url: '/public/gallery/IMG-20260919-WA0010.webp',
    sort_order: 4,
    is_active: true,
    tags: ['Hydraulic Press', 'Deep Drawing', 'Stamping', 'Industrial Unit'],
  },
  {
    id: 5,
    filename: 'IMG-20260919-WA0011.webp',
    title: 'Industrial Press Line & Heavy Tooling Workshop',
    category: 'Manufacturing Facility',
    description:
      'Panoramic view of our Tenali automated press shop featuring dedicated multi-stage hydraulic stamping stations and computerized tool banks.',
    image_url: '/public/gallery/IMG-20260919-WA0011.webp',
    sort_order: 5,
    is_active: true,
    tags: ['Factory Floor', 'Tooling', 'Press Shop', 'Infrastructure'],
  },
  {
    id: 6,
    filename: 'IMG-20260919-WA0012.webp',
    title: 'Silver Sheet Gauge Rolling & Circular Blanking',
    category: 'Sheet Rolling & Blanking',
    description:
      'Artisan operating specialized motorized shears and roller calibration units for high-uniformity silver circular discs.',
    image_url: '/public/gallery/IMG-20260919-WA0012.webp',
    sort_order: 6,
    is_active: true,
    tags: ['Sheet Rolling', 'Disc Blanking', 'Precision Gauge', 'Silversmith'],
  },
  {
    id: 7,
    filename: 'IMG-20260919-WA0013.webp',
    title: 'High-Tonnage Heavy Plate Rolling Mill',
    category: 'Industrial Machinery',
    description:
      'Dual heavy-duty calender rollers converting raw 999 fine and 925 sterling silver ingots into calibrated uniform sheets.',
    image_url: '/public/gallery/IMG-20260919-WA0013.webp',
    sort_order: 7,
    is_active: true,
    tags: ['Rolling Mill', 'Ingot Processing', 'Heavy Machinery', 'Tenali Facility'],
  },
];

const formatImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanPath}`;
};

export const AtelierPhotoGallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>(FALLBACK_GALLERY_ITEMS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  // Fetch gallery from API
  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/gallery`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          setItems(data);
        }
      } catch (err) {
        console.log('[AtelierPhotoGallery] Fetch fallback in place:', err);
      }
    };

    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  const total = items.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleModalPrev = () => {
    if (modalIndex === null) return;
    const prevIdx = (modalIndex - 1 + total) % total;
    setModalIndex(prevIdx);
    setCurrentIndex(prevIdx);
  };

  const handleModalNext = () => {
    if (modalIndex === null) return;
    const nextIdx = (modalIndex + 1) % total;
    setModalIndex(nextIdx);
    setCurrentIndex(nextIdx);
  };

  // Pan gesture for carousel touch swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 40) {
          handlePrev();
        } else if (gestureState.dx < -40) {
          handleNext();
        }
      },
    })
  ).current;

  // Pan gesture for modal swipe
  const modalPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 24 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 45) {
          handleModalPrev();
        } else if (gestureState.dx < -45) {
          handleModalNext();
        }
      },
    })
  ).current;

  // Active items
  const activeItem = items[currentIndex] || items[0];
  const modalItem = modalIndex !== null ? items[modalIndex] : null;

  // Card dimensions for 3D coverflow stage
  const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.54, 220);
  const CARD_HEIGHT = CARD_WIDTH * 1.42;

  // Visible slots for coverflow
  const visibleSlots = [-2, -1, 0, 1, 2];

  return (
    <View style={styles.container}>
      {/* 3D COVERFLOW STAGE (MATCHING IMAGE 3) */}
      <View
        style={[styles.stageContainer, { height: CARD_HEIGHT + 36 }]}
        {...panResponder.panHandlers}
      >
        {visibleSlots.map((offset) => {
          const itemIndex = (currentIndex + offset + total * 10) % total;
          const item = items[itemIndex];
          if (!item) return null;

          const isCenter = offset === 0;
          const isImmediate = Math.abs(offset) === 1;
          const isOuter = Math.abs(offset) === 2;

          let scale = 1;
          let opacity = 1;
          let zIndex = 10;
          let translateX = 0;

          if (isCenter) {
            scale = 1.0;
            opacity = 1.0;
            zIndex = 10;
            translateX = 0;
          } else if (isImmediate) {
            scale = 0.84;
            opacity = 0.65;
            zIndex = 5;
            translateX = offset * (CARD_WIDTH * 0.56);
          } else if (isOuter) {
            scale = 0.7;
            opacity = 0.32;
            zIndex = 2;
            translateX = offset * (CARD_WIDTH * 0.96);
          }

          return (
            <TouchableOpacity
              key={`${item.id}-${offset}`}
              activeOpacity={isCenter ? 0.95 : 0.8}
              onPress={() => {
                if (isCenter) {
                  setModalIndex(itemIndex);
                } else {
                  setCurrentIndex(itemIndex);
                }
              }}
              style={[
                styles.cardFrame,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [{ translateX }, { scale }],
                  opacity,
                  zIndex,
                },
                isCenter && styles.centerCardShadow,
              ]}
            >
              <Image
                source={{ uri: formatImageUrl(item.image_url) }}
                style={styles.cardImage}
                resizeMode="cover"
              />

              {!isCenter && <View style={styles.frostedGlassOverlay} />}

              {isCenter && (
                <View style={styles.expandHintBadge}>
                  <Maximize2 size={13} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* LEFT NAVIGATION ARROW (MATCHING IMAGE 3) */}
        <TouchableOpacity
          style={styles.navButtonLeft}
          activeOpacity={0.85}
          onPress={handlePrev}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={20} color="#1A1918" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* RIGHT NAVIGATION ARROW (MATCHING IMAGE 3) */}
        <TouchableOpacity
          style={styles.navButtonRight}
          activeOpacity={0.85}
          onPress={handleNext}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronRight size={20} color="#1A1918" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* ACTIVE PHOTO DETAIL CARD */}
      {activeItem && (
        <View style={styles.metaCard}>
          <View style={styles.metaPillRow}>
            <View style={styles.categoryPill}>
              <Sparkles size={11} color="#B9A77A" style={{ marginRight: 4 }} />
              <Text style={styles.categoryPillText}>
                {(activeItem.category || 'ARTISAN CRAFTSMANSHIP').toUpperCase()}
              </Text>
            </View>

            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {currentIndex + 1} / {total}
              </Text>
            </View>
          </View>

          <Text style={styles.metaTitle}>{activeItem.title}</Text>
          <Text style={styles.metaDescription}>{activeItem.description}</Text>

          {activeItem.tags && activeItem.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {activeItem.tags.map((tag, i) => (
                <View key={i} style={styles.tagItem}>
                  <Text style={styles.tagItemText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.paginationRow}>
            {items.map((_, dotIndex) => (
              <TouchableOpacity
                key={dotIndex}
                activeOpacity={0.7}
                onPress={() => setCurrentIndex(dotIndex)}
                style={[
                  styles.dot,
                  dotIndex === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX MODAL (EXACTLY MATCHING USER'S 2ND IMAGE)               */}
      {/* ========================================================================= */}
      <Modal
        visible={modalIndex !== null && !!modalItem}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setModalIndex(null)}
      >
        <View style={styles.lightboxContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

          {modalItem && (
            <>
              {/* TOP HEADER BAR */}
              <View style={styles.lightboxHeader}>
                <View style={styles.lightboxHeaderLeft}>
                  <Text style={styles.lightboxCategory}>
                    {(modalItem.category || 'ARTISAN CRAFTSMANSHIP').toUpperCase()}
                  </Text>
                  <Text style={styles.lightboxTitle} numberOfLines={2}>
                    {modalItem.title}
                  </Text>
                </View>

                <View style={styles.lightboxHeaderRight}>
                  {/* COUNTER PILL: e.g. 4 / 7 */}
                  <View style={styles.lightboxCounterPill}>
                    <Text style={styles.lightboxCounterText}>
                      {(modalIndex ?? 0) + 1} / {total}
                    </Text>
                  </View>

                  {/* CIRCULAR CLOSE BUTTON (X) */}
                  <TouchableOpacity
                    style={styles.lightboxCloseBtn}
                    onPress={() => setModalIndex(null)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <X size={18} color="#FFFFFF" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CENTER IMAGE STAGE WITH FLOATING CIRCULAR NAV BUTTONS */}
              <View
                style={styles.lightboxImageStage}
                {...modalPanResponder.panHandlers}
              >
                <View style={styles.lightboxImageWrapper}>
                  <Image
                    source={{ uri: formatImageUrl(modalItem.image_url) }}
                    style={styles.lightboxImage}
                    resizeMode="cover"
                  />
                </View>

                {/* FLOATING CIRCULAR LEFT NAV ARROW */}
                <TouchableOpacity
                  style={styles.lightboxNavBtnLeft}
                  onPress={handleModalPrev}
                  activeOpacity={0.85}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
                </TouchableOpacity>

                {/* FLOATING CIRCULAR RIGHT NAV ARROW */}
                <TouchableOpacity
                  style={styles.lightboxNavBtnRight}
                  onPress={handleModalNext}
                  activeOpacity={0.85}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              {/* BOTTOM FOOTER DESCRIPTION */}
              <View style={styles.lightboxFooter}>
                <Text style={styles.lightboxDescription}>
                  {modalItem.description}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },

  /* 3D Coverflow Stage */
  stageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },

  cardFrame: {
    position: 'absolute',
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E4DD',
  },
  centerCardShadow: {
    borderColor: '#C5A059',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  frostedGlassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },

  expandHintBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 25, 24, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Navigation Buttons matching Image 3 */
  navButtonLeft: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -20,
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E2DA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonRight: {
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -20,
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E2DA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  /* Metadata Card */
  metaCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF9F0',
    borderWidth: 1,
    borderColor: '#EFE5CC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#AA8C4B',
    letterSpacing: 0.6,
  },
  countPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666666',
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({
      ios: 'BodoniModa_600SemiBold',
      android: 'BodoniModa_600SemiBold',
      default: 'BodoniModa_600SemiBold, Bodoni 72, serif',
    }),
    color: '#1A1918',
    marginBottom: 6,
    lineHeight: 22,
  },
  metaDescription: {
    fontSize: 12.5,
    color: '#555555',
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagItem: {
    backgroundColor: '#F5F3EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagItemText: {
    fontSize: 10.5,
    color: '#777777',
    fontWeight: '500',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#C5A059',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#E0DDD7',
  },

  /* ========================================================================= */
  /* FULLSCREEN LIGHTBOX STYLES (MATCHING USER'S 2ND IMAGE)                      */
  /* ========================================================================= */
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    paddingTop:
      Platform.OS === 'ios'
        ? 54
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 12
        : 40,
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxHeaderLeft: {
    flex: 1,
    marginRight: 14,
  },
  lightboxCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  lightboxTitle: {
    fontSize: 15.5,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    lineHeight: 20,
  },
  lightboxHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lightboxCounterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lightboxCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
    letterSpacing: 0.5,
  },
  lightboxCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImageStage: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  lightboxImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxNavBtnLeft: {
    position: 'absolute',
    left: 24,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18, 18, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  lightboxNavBtnRight: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18, 18, 18, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  lightboxFooter: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    alignItems: 'center',
  },
  lightboxDescription: {
    fontSize: 13.5,
    color: '#D4D4D4',
    textAlign: 'center',
    lineHeight: 19.5,
  },
});

export default AtelierPhotoGallery;
