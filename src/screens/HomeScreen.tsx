import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  ChevronRight,
  Play,
  X,
} from 'lucide-react-native';
import api, { getFullImageUrl } from '../services/api';
import { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const { width } = Dimensions.get('window');

// Manufacturing Steps (Compact 4-Step Workflow)
const manufacturingSteps = [
  {
    num: '01',
    name: 'Induction Casting',
    desc: 'High-vacuum melting of 99.9% fine silver bullion.',
  },
  {
    num: '02',
    name: 'Precision Forming',
    desc: 'Hydraulic minting & sheet forming for dense structural durability.',
  },
  {
    num: '03',
    name: 'Nakshi Engraving',
    desc: 'Hand-sculpted temple iconographies and detailed relief carving.',
  },
  {
    num: '04',
    name: 'Finishing',
    desc: 'Pin polishing & protective nano anti-tarnish coating.',
  },
];

// Fallback Main Collections if API categories are loading or empty
const DEFAULT_MAIN_CATEGORIES = [
  {
    id: 1,
    name: 'Silver Pooja Articles',
    slug: 'silver-pooja-articles',
    description: 'Handcrafted 999 fine silver idols, sacred deepams, and thalis.',
    image_url: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Silver God & Temple',
    slug: 'silver-temple-items',
    description: 'Grand Balaji idols, silver kalasham, and ritual temple vessels.',
    image_url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Silver Dining',
    slug: 'silver-dining-tableware',
    description: 'Luxury 925 sterling dinner sets, tumblers, and serving bowls.',
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Silver Gifts',
    slug: 'silver-coins-bars',
    description: '99.9% spectrometer tested silver coins, bars, and heirloom gifts.',
    image_url: 'https://images.unsplash.com/photo-1616038242814-a6eac7f46688?auto=format&fit=crop&w=800&q=80',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products?is_featured=true&limit=10'),
      ]);
      const fetchedCats = Array.isArray(catRes.data) ? catRes.data : [];
      setCategories(fetchedCats.length > 0 ? fetchedCats : (DEFAULT_MAIN_CATEGORIES as any));
      setFeaturedProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setCategories(DEFAULT_MAIN_CATEGORIES as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Display top 4 categories mapped dynamically
  const displayCategories = categories.length >= 4 ? categories.slice(0, 4) : DEFAULT_MAIN_CATEGORIES;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 + (insets.bottom > 0 ? insets.bottom : 8) }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* 01. PREMIUM HERO SECTION */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=1200&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>EST. 1998 · TENALI</Text>

              <Text style={styles.heroHeadline}>
                CRAFTED IN PURE{'\n'}
                <Text style={styles.heroHeadlineItalic}>SILVER.</Text>
              </Text>

              <Text style={styles.heroDesc}>
                Handcrafted silver creations made with precision, heritage and exceptional purity.
              </Text>

              <View style={styles.heroCtaRow}>
                <TouchableOpacity
                  style={styles.heroPrimaryBtn}
                  onPress={() => navigation.navigate('Categories')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroPrimaryBtnText}>EXPLORE COLLECTIONS</Text>
                  <ArrowRight color="#111111" size={14} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() => navigation.navigate('Wholesale')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroSecondaryBtnText}>WHOLESALE →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 02. QUICK TRUST INDICATORS */}
        <View style={styles.trustStrip}>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>999</Text>
            <Text style={styles.trustLabel}>FINE SILVER</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>925</Text>
            <Text style={styles.trustLabel}>STERLING</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>25+</Text>
            <Text style={styles.trustLabel}>YEARS</Text>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>TENALI</Text>
            <Text style={styles.trustLabel}>ATELIER</Text>
          </View>
        </View>

        {/* 03. SHOP BY COLLECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>CURATED FOR YOU</Text>
            <Text style={styles.sectionTitle}>Shop Collections</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#111111" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.collectionsGrid}>
              {displayCategories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat.id || idx}
                  style={styles.collectionCard}
                  onPress={() => navigation.navigate('Categories', { categorySlug: cat.slug })}
                  activeOpacity={0.88}
                >
                  <View style={styles.collectionImgWrapper}>
                    <Image
                      source={{ uri: getFullImageUrl(cat.image_url) }}
                      style={styles.collectionImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.collectionDetails}>
                    <Text style={styles.collectionName} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <ChevronRight color="#898985" size={14} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 04. FEATURED PRODUCTS */}
        {featuredProducts.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>HANDPICKED SILVER</Text>
                <Text style={styles.sectionTitle}>Featured Creations</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productCarousel}
            >
              {featuredProducts.map((prod) => (
                <View key={prod.id} style={{ marginRight: 12 }}>
                  <ProductCard
                    product={prod}
                    width={170}
                    onPress={() => navigation.navigate('ProductDetail', { product: prod })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 05. ABOUT THE ATELIER */}
        <View style={styles.atelierSection}>
          <Text style={styles.sectionEyebrow}>THE HOUSE OF SILVER</Text>
          <Text style={styles.atelierHeading}>
            Generations of craftsmanship.{'\n'}One standard of purity.
          </Text>
          <Text style={styles.atelierDesc}>
            From our atelier in Tenali, we combine traditional craftsmanship with modern precision to create exceptional silver pieces.
          </Text>

          <View style={styles.atelierImageFrame}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
              }}
              style={styles.atelierImage}
              resizeMode="cover"
            />
          </View>

          <TouchableOpacity
            style={styles.storyBtn}
            onPress={() => navigation.navigate('Wholesale')}
            activeOpacity={0.85}
          >
            <Text style={styles.storyBtnText}>OUR STORY →</Text>
          </TouchableOpacity>
        </View>

        {/* 06. CRAFTSMANSHIP WORKFLOW */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>FROM CRAFT TO CREATION</Text>
            <Text style={styles.sectionTitle}>Atelier Process</Text>
          </View>

          <View style={styles.processList}>
            {manufacturingSteps.map((step, idx) => (
              <View key={idx} style={styles.processCard}>
                <Text style={styles.processNum}>{step.num}</Text>
                <View style={styles.processContent}>
                  <Text style={styles.processName}>{step.name}</Text>
                  <Text style={styles.processDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 07. ATELIER VIDEO BANNER */}
        <View style={styles.videoBanner}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1616038242814-a6eac7f46688?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.videoBgImage}
            resizeMode="cover"
          />
          <View style={styles.videoOverlay}>
            <Text style={styles.videoEyebrow}>INSIDE THE ATELIER</Text>
            <Text style={styles.videoHeading}>See how silver becomes timeless.</Text>

            <TouchableOpacity
              style={styles.playCircle}
              onPress={() => setIsVideoModalOpen(true)}
              activeOpacity={0.85}
            >
              <Play color="#111111" fill="#111111" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 08. WHOLESALE B2B */}
        <View style={styles.b2bContainer}>
          <Text style={styles.b2bEyebrow}>WHOLESALE & B2B</Text>
          <Text style={styles.b2bTitle}>
            Wholesale Silver,{'\n'}Direct From Our Atelier.
          </Text>

          <View style={styles.b2bPoints}>
            <Text style={styles.b2bPointText}>• Manufacturer pricing</Text>
            <Text style={styles.b2bPointText}>• Bulk orders</Text>
            <Text style={styles.b2bPointText}>• Custom requirements</Text>
            <Text style={styles.b2bPointText}>• B2B support</Text>
          </View>

          <TouchableOpacity
            style={styles.b2bBtn}
            onPress={() => navigation.navigate('Wholesale')}
            activeOpacity={0.85}
          >
            <Text style={styles.b2bBtnText}>EXPLORE WHOLESALE →</Text>
          </TouchableOpacity>
        </View>

        {/* 09. FINAL HOME CTA */}
        <View style={styles.finalCtaContainer}>
          <Text style={styles.finalCtaTitle}>Find something timeless.</Text>
          <Text style={styles.finalCtaDesc}>
            Explore our silver collections or speak with our team.
          </Text>

          <View style={styles.finalBtnRow}>
            <TouchableOpacity
              style={styles.finalPrimaryBtn}
              onPress={() => navigation.navigate('Categories')}
              activeOpacity={0.85}
            >
              <Text style={styles.finalPrimaryBtnText}>EXPLORE COLLECTIONS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.finalSecondaryBtn}
              onPress={() => navigation.navigate('Wholesale')}
              activeOpacity={0.85}
            >
              <Text style={styles.finalSecondaryBtnText}>CONTACT US</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* DOCUMENTARY VIDEO MODAL */}
      <Modal
        visible={isVideoModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsVideoModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsVideoModalOpen(false)}
            >
              <X color="#FFFFFF" size={20} />
            </TouchableOpacity>

            <Text style={styles.modalEyebrow}>SAI BALAJI ATELIER</Text>
            <Text style={styles.modalTitle}>See how silver becomes timeless.</Text>
            <Text style={styles.modalDesc}>
              Discover 25+ years of South Indian silver craftsmanship from our direct atelier in Tenali.
            </Text>

            <View style={styles.modalVideoFrame}>
              <Play color="#FFFFFF" size={32} fill="#FFFFFF" />
              <Text style={styles.modalVideoText}>Playing Atelier Story...</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  heroContainer: {
    height: 380,
    position: 'relative',
    backgroundColor: '#111111',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.55,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  heroContent: {
    gap: 4,
  },
  heroEyebrow: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 36,
    marginBottom: 8,
  },
  heroHeadlineItalic: {
    fontStyle: 'italic',
    color: '#E5E5E0',
  },
  heroDesc: {
    color: '#D0CECA',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
    maxWidth: 300,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  heroPrimaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroPrimaryBtnText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroSecondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  heroSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  trustStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E7E2',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustNumber: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  trustLabel: {
    color: '#898985',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  trustDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5E0',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: '#898985',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 3,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  viewAllText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  collectionCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E7E2',
    overflow: 'hidden',
  },
  collectionImgWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: '#F7F6F2',
  },
  collectionImg: {
    width: '100%',
    height: '100%',
  },
  collectionDetails: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectionName: {
    flex: 1,
    color: '#111111',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  productCarousel: {
    paddingRight: 16,
  },
  atelierSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E7E2',
  },
  atelierHeading: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 28,
    marginTop: 4,
    marginBottom: 10,
  },
  atelierDesc: {
    color: '#555555',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  atelierImageFrame: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  atelierImage: {
    width: '100%',
    height: '100%',
  },
  storyBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#111111',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  storyBtnText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  processList: {
    gap: 10,
  },
  processCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E7E2',
    alignItems: 'center',
    gap: 12,
  },
  processNum: {
    color: '#898985',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    width: 24,
  },
  processContent: {
    flex: 1,
  },
  processName: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  processDesc: {
    color: '#666666',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  videoBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    height: 190,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111111',
  },
  videoBgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.4)',
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoEyebrow: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  videoHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 14,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  b2bContainer: {
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 22,
    borderRadius: 8,
  },
  b2bEyebrow: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  b2bTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 26,
    marginBottom: 14,
  },
  b2bPoints: {
    gap: 6,
    marginBottom: 18,
  },
  b2bPointText: {
    color: '#D0CECA',
    fontSize: 12,
    lineHeight: 18,
  },
  b2bBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  b2bBtnText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  finalCtaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  finalCtaTitle: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 6,
  },
  finalCtaDesc: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
  },
  finalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  finalPrimaryBtn: {
    backgroundColor: '#111111',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  finalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  finalSecondaryBtn: {
    borderWidth: 1,
    borderColor: '#111111',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  finalSecondaryBtnText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#111111',
    padding: 24,
    borderRadius: 8,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  modalEyebrow: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  modalDesc: {
    color: '#898985',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 18,
  },
  modalVideoFrame: {
    height: 140,
    backgroundColor: '#222222',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  modalVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
