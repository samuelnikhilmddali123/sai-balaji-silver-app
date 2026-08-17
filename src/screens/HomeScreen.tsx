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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ShoppingBag,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Play,
  MapPin,
} from 'lucide-react-native';
import api, { getFullImageUrl, getProductImageUrl } from '../services/api';
import { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const { width } = Dimensions.get('window');

// Manufacturing Steps
const manufacturingSteps = [
  {
    step: '01',
    title: 'Silver Selection',
    description: 'Assaying and selecting 99.9% pure silver grains for high-grade melting.',
    details: 'Raw silver bullion undergoes NABL-standard spectrometer testing to verify exact elemental purity prior to casting.',
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: '02',
    title: 'Design & 3D Prototyping',
    description: 'Combining ancestral motifs with CAD 3D precision molding.',
    details: 'Our master designers translate sacred iconographies into high-precision 3D wax molds for flawless symmetry.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: '03',
    title: 'Induction Casting',
    description: 'Vacuum induction melting for bubble-free solid silver structure.',
    details: 'High-frequency induction furnaces melt silver under inert gas shields to ensure zero oxidation during casting.',
    image: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: '04',
    title: 'Hand Nakshi & Detailing',
    description: 'Hand-engraving by third-generation silversmith artisans.',
    details: 'Artisans meticulously hand-carve intricate floral patterns, facial features of deities, and Nakshi relief details.',
    image: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: '05',
    title: 'Ultrasonic Cleaning',
    description: 'Multi-stage polishing for brilliant, high-mirror luster.',
    details: 'Cast pieces pass through magnetic pin polishers, walnut shell tumbling, and ultrasonic bath cleaning.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: '06',
    title: 'Anti-Tarnish Shield',
    description: 'Nanotechnology protective barrier application.',
    details: 'Every item receives a micro-layer anti-tarnish shield preserving its silver shine for years without darkening.',
    image: 'https://images.unsplash.com/photo-1616038242814-a6eac7f46688?auto=format&fit=crop&w=800&q=80',
  },
  {
    step: '07',
    title: 'Hallmarking & Packaging',
    description: 'Official purity hallmarking and luxury velvet casing.',
    details: 'Final inspection verifies exact hallmark stamps before items are sealed in tamper-evident velvet gift boxes.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  },
];

// Timeline Data
const timelineEvents = [
  {
    era: 'THE BEGINNING',
    year: 'EST. 1998',
    title: 'Ancestral Craftsmanship',
    description: 'Where the vision of Sai Balaji Silverworks began in Hyderabad, starting as a small studio dedicated to hand-sculpted temple idols.',
    image: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
  },
  {
    era: 'CRAFTSMANSHIP',
    year: '2008',
    title: 'Mastery of Precision',
    description: 'Years of experience perfecting 925 sterling silver & 999 fine silver formulations, setting new standards for temple and home decor silver.',
    image: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=800&q=80',
  },
  {
    era: 'MANUFACTURING',
    year: '2015',
    title: 'Modern Manufacturing Unit',
    description: 'Building our state-of-the-art manufacturing unit with induction casting furnaces, laser engraving, and NABL-certified testing.',
    image: 'https://images.unsplash.com/photo-1616038242814-a6eac7f46688?auto=format&fit=crop&w=800&q=80',
  },
  {
    era: 'EXPANSION',
    year: '2020',
    title: 'Pan-India B2B Wholesale',
    description: 'Growing into a primary wholesale manufacturer supplying leading jewellers, corporate houses, and prominent temple trusts across India.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  },
  {
    era: 'TODAY',
    year: 'PRESENT',
    title: 'Full-Stack Retail & B2B Platform',
    description: 'Combining direct factory-to-consumer luxury retail shopping with automated digital B2B quotation workflows.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Section position references for scroll
  const [journeyY, setJourneyY] = useState(0);
  const [commerceY, setCommerceY] = useState(0);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products?is_featured=true&limit=10'),
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setFeaturedProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const scrollToJourney = () => {
    if (scrollViewRef.current && journeyY > 0) {
      scrollViewRef.current.scrollTo({ y: journeyY, animated: true });
    }
  };

  const scrollToCommerce = () => {
    if (scrollViewRef.current && commerceY > 0) {
      scrollViewRef.current.scrollTo({ y: commerceY, animated: true });
    } else {
      navigation.navigate('Categories');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F6F6' }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* 01. CINEMATIC HERO */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 52, height: 52, borderRadius: 26, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text style={styles.heroTag}>ENTER THE WORLD OF</Text>
            <Text style={styles.heroTitle}>SAI BALAJI SILVERWORKS</Text>
            <Text style={styles.heroSubtitle}>
              Crafting Silver. Building Trust. Creating Legacy.
            </Text>
            <Text style={styles.heroDesc}>
              From traditional craftsmanship to modern silver manufacturing, discover the journey behind Sai Balaji Silverworks.
            </Text>

            <View style={styles.heroBtnRow}>
              <TouchableOpacity
                style={styles.heroBtnPrimary}
                onPress={scrollToJourney}
                activeOpacity={0.8}
              >
                <Text style={styles.heroBtnPrimaryText}>EXPLORE OUR JOURNEY</Text>
                <ArrowRight color="#FFFFFF" size={14} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroBtnSecondary}
                onPress={scrollToCommerce}
                activeOpacity={0.8}
              >
                <Text style={styles.heroBtnSecondaryText}>ENTER SHOP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* TRUST BADGES BAR */}
        <View style={styles.badgeBar}>
          <View style={styles.badgeItem}>
            <ShieldCheck color="#FFFFFF" size={16} />
            <Text style={styles.badgeText}>92.5% & 99.9% Purity</Text>
          </View>
          <View style={styles.badgeItem}>
            <Award color="#FFFFFF" size={16} />
            <Text style={styles.badgeText}>BIS Hallmarked</Text>
          </View>
          <View style={styles.badgeItem}>
            <Sparkles color="#FFFFFF" size={16} />
            <Text style={styles.badgeText}>Direct Wholesale</Text>
          </View>
        </View>

        {/* 02. WHO WE ARE */}
        <View style={styles.sectionContainer}>
          <View style={styles.centerHeader}>
            <Text style={styles.goldTag}>WHO WE ARE</Text>
            <Text style={styles.sectionTitle}>Master Silver Manufacturers & Artisans</Text>
            <Text style={styles.sectionDesc}>
              Sai Balaji Silverworks is a silver manufacturing company dedicated to creating high-quality silver products through a combination of craftsmanship, precision, and modern manufacturing.
            </Text>
          </View>

          {/* Philosophy Cards */}
          <View style={styles.cardCol}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTag}>PURPOSE</Text>
              <Text style={styles.infoCardTitle}>Our Mission</Text>
              <Text style={styles.infoCardDesc}>
                To create silver products that combine authenticity, craftsmanship, and lasting value for families, retailers, and corporate institutions across India.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTag}>ASPIRATION</Text>
              <Text style={styles.infoCardTitle}>Our Vision</Text>
              <Text style={styles.infoCardDesc}>
                To become the most trusted silver manufacturing partner across India, recognized for unquestioned purity, transparent pricing, and design mastery.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTag}>GUIDING PRINCIPLES</Text>
              <Text style={styles.infoCardTitle}>Our Core Values</Text>
              <View style={styles.valuesGrid}>
                <Text style={styles.valueItem}>• Craftsmanship</Text>
                <Text style={styles.valueItem}>• 100% Purity</Text>
                <Text style={styles.valueItem}>• Trust & Integrity</Text>
                <Text style={styles.valueItem}>• Precision</Text>
                <Text style={styles.valueItem}>• Innovation</Text>
                <Text style={styles.valueItem}>• Quality First</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 03. CINEMATIC TIMELINE */}
        <View
          onLayout={(e) => setJourneyY(e.nativeEvent.layout.y)}
          style={[styles.sectionContainer, { paddingTop: 10 }]}
        >
          <View style={styles.centerHeader}>
            <Text style={styles.goldTag}>CINEMATIC TIMELINE</Text>
            <Text style={styles.sectionTitle}>Our Journey</Text>
            <Text style={styles.sectionSub}>From Craftsmanship to a Modern Silverworks</Text>
          </View>

          <View style={styles.timelineList}>
            {timelineEvents.map((ev, index) => (
              <View key={index} style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <View style={styles.eraBadge}>
                    <Text style={styles.eraBadgeText}>{ev.era}</Text>
                  </View>
                  <Text style={styles.yearText}>{ev.year}</Text>
                </View>

                <Text style={styles.timelineTitle}>{ev.title}</Text>
                <Text style={styles.timelineDesc}>{ev.description}</Text>

                <View style={styles.archImageWrapper}>
                  <Image source={{ uri: ev.image }} style={styles.archImage} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 04. HOW WE CREATE - MANUFACTURING PROCESS */}
        <View style={styles.sectionContainer}>
          <View style={styles.centerHeader}>
            <Text style={styles.goldTag}>CRAFTSMANSHIP & PRECISION</Text>
            <Text style={styles.sectionTitle}>How We Create</Text>
            <Text style={styles.sectionDesc}>
              A 7-stage manufacturing process combining ancient metallurgic arts with modern quality controls.
            </Text>
          </View>

          {/* Step Selector Horizontal Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepTabScroll}
          >
            {manufacturingSteps.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.stepTab,
                  activeStepIndex === idx && styles.stepTabActive,
                ]}
                onPress={() => setActiveStepIndex(idx)}
              >
                <Text
                  style={[
                    styles.stepTabNum,
                    activeStepIndex === idx && styles.stepTabNumActive,
                  ]}
                >
                  {s.step}
                </Text>
                <Text
                  style={[
                    styles.stepTabText,
                    activeStepIndex === idx && styles.stepTabTextActive,
                  ]}
                >
                  {s.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active Step Showcase */}
          <View style={styles.activeStepCard}>
            <Text style={styles.activeStepNum}>
              STAGE {manufacturingSteps[activeStepIndex].step}
            </Text>
            <Text style={styles.activeStepTitle}>
              {manufacturingSteps[activeStepIndex].title}
            </Text>
            <Text style={styles.activeStepDesc}>
              {manufacturingSteps[activeStepIndex].description}
            </Text>
            <Text style={styles.activeStepDetails}>
              {manufacturingSteps[activeStepIndex].details}
            </Text>

            <Image
              source={{ uri: manufacturingSteps[activeStepIndex].image }}
              style={styles.activeStepImg}
            />
          </View>
        </View>

        {/* 05. QUALITY & PURITY STANDARDS */}
        <View style={styles.sectionContainer}>
          <View style={styles.centerHeader}>
            <Text style={styles.goldTag}>GUARANTEED STANDARDS</Text>
            <Text style={styles.sectionTitle}>Quality Without Compromise</Text>
            <Text style={styles.sectionSub}>Full chemical purity validation and protective coating on every piece.</Text>
          </View>

          <View style={styles.qualityGrid}>
            <View style={styles.qualityCard}>
              <View style={styles.qualityIconBox}>
                <ShieldCheck color="#C5A059" size={22} />
              </View>
              <Text style={styles.qualityTitle}>925 Sterling Silver</Text>
              <Text style={styles.qualityDesc}>Guaranteed 92.5% pure silver alloyed for enduring structural strength.</Text>
            </View>

            <View style={styles.qualityCard}>
              <View style={styles.qualityIconBox}>
                <Sparkles color="#C5A059" size={22} />
              </View>
              <Text style={styles.qualityTitle}>999 Fine Silver</Text>
              <Text style={styles.qualityDesc}>99.9% pure silver formulated for idols, coins, and sacred pooja vessels.</Text>
            </View>

            <View style={styles.qualityCard}>
              <View style={styles.qualityIconBox}>
                <Award color="#C5A059" size={22} />
              </View>
              <Text style={styles.qualityTitle}>Spectrometer Testing</Text>
              <Text style={styles.qualityDesc}>Chemical melt verification to guarantee purity precision.</Text>
            </View>

            <View style={styles.qualityCard}>
              <View style={styles.qualityIconBox}>
                <CheckCircle2 color="#C5A059" size={22} />
              </View>
              <Text style={styles.qualityTitle}>Anti-Tarnish Shield</Text>
              <Text style={styles.qualityDesc}>Nanotechnology molecular barrier prevents oxidation and darkening.</Text>
            </View>
          </View>
        </View>

        {/* 06. THE COMMERCE EXPERIENCE */}
        <View
          onLayout={(e) => setCommerceY(e.nativeEvent.layout.y)}
          style={styles.sectionContainer}
        >
          <View style={styles.centerHeader}>
            <Text style={styles.goldTag}>THE COMMERCE EXPERIENCE</Text>
            <Text style={styles.sectionTitle}>Ready to Explore Our Collection?</Text>
            <Text style={styles.sectionSub}>Discover our silver products for personal, retail, and wholesale requirements.</Text>
          </View>

          <View style={styles.commerceGrid}>
            {/* Retail Card */}
            <View style={styles.retailCard}>
              <View style={styles.commerceIconBox}>
                <ShoppingBag color="#C5A059" size={24} />
              </View>
              <View style={styles.badgeLight}>
                <Text style={styles.badgeLightText}>FOR INDIVIDUAL PURCHASES</Text>
              </View>
              <Text style={styles.commerceTitle}>RETAIL COLLECTION</Text>
              <Text style={styles.commerceDesc}>
                Explore our curated retail collection of fine 925 sterling silver jewelry, 999 pure silver idols, pooja thalis, and luxury silver gifts.
              </Text>

              <TouchableOpacity
                style={styles.retailBtn}
                onPress={() => navigation.navigate('Categories')}
                activeOpacity={0.8}
              >
                <Text style={styles.retailBtnText}>SHOP RETAIL STORE</Text>
                <ArrowRight color="#FFFFFF" size={14} />
              </TouchableOpacity>
            </View>

            {/* Wholesale Card */}
            <View style={styles.wholesaleCard}>
              <View style={styles.commerceIconBoxDark}>
                <Briefcase color="#C5A059" size={24} />
              </View>
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>FOR B2B & BULK BUYERS</Text>
              </View>
              <Text style={styles.wholesaleCardTitle}>B2B WHOLESALE PORTAL</Text>
              <Text style={styles.wholesaleCardDesc}>
                Explore our wholesale catalogue, configure bulk quantities, and generate official ReportLab PDF quotations directly from our sales desk.
              </Text>

              <TouchableOpacity
                style={styles.wholesaleBtnPrimary}
                onPress={() => navigation.navigate('Wholesale')}
                activeOpacity={0.8}
              >
                <Text style={styles.wholesaleBtnPrimaryText}>EXPLORE B2B WHOLESALE</Text>
                <ArrowRight color="#1A1918" size={14} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 07. PRODUCT CATEGORIES */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.goldTag}>PRODUCT CATEGORIES</Text>
          <Text style={styles.sectionTitle}>Explore Silver Categories</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#C5A059" style={{ marginVertical: 30 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                onPress={() => navigation.navigate('Categories', { categorySlug: cat.slug })}
                activeOpacity={0.9}
              >
                <Image source={{ uri: getFullImageUrl(cat.image_url) }} style={styles.catImage} />
                <View style={styles.catOverlay}>
                  <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
                  <View style={styles.catExploreRow}>
                    <Text style={styles.catExploreText}>Explore</Text>
                    <ChevronRight color="#C5A059" size={12} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 08. FEATURED PRODUCTS */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.goldTag}>HANDPICKED SELECTIONS</Text>
          <View style={styles.featuredHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Silver Creations</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prodScroll}
        >
          {featuredProducts.map((prod) => (
            <View key={prod.id} style={{ marginRight: 14 }}>
              <ProductCard
                product={prod}
                width={180}
                onPress={() => navigation.navigate('ProductDetail', { product: prod })}
              />
            </View>
          ))}
        </ScrollView>

        {/* 09. FACTORY SHOWROOM */}
        <View style={styles.showroomCard}>
          <Text style={styles.showroomTag}>HYDERABAD FACTORY & SHOWROOM</Text>
          <Text style={styles.showroomTitle}>Visit Sai Balaji Silverworks</Text>
          <Text style={styles.showroomDesc}>
            Experience our entire retail collection and consult with our wholesale team directly at our Hyderabad manufacturing showroom.
          </Text>

          <View style={styles.addressRow}>
            <MapPin color="#C5A059" size={16} />
            <Text style={styles.addressText}>
              Main Silver Market, Near Charminar Heritage Zone, Hyderabad, Telangana - 500002
            </Text>
          </View>

          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80' }}
            style={styles.showroomImg}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    height: 480,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 25, 24, 0.72)',
    padding: 24,
    justifyContent: 'center',
  },
  heroTag: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: '#C5A059',
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 6,
    marginBottom: 10,
  },
  heroDesc: {
    color: '#D4CEB8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  heroBtnRow: {
    gap: 10,
  },
  heroBtnPrimary: {
    backgroundColor: '#2D6A68',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2D6A68',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  centerHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  goldTag: {
    color: '#2D6A68',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#1A1918',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  sectionDesc: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  sectionSub: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  cardCol: {
    gap: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 20,
  },
  infoCardTag: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoCardTitle: {
    color: '#1A1918',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  infoCardDesc: {
    color: '#555555',
    fontSize: 12,
    lineHeight: 18,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  valueItem: {
    width: '50%',
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    paddingVertical: 3,
  },
  timelineList: {
    gap: 20,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eraBadge: {
    backgroundColor: '#1A1918',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eraBadgeText: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  yearText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineTitle: {
    color: '#1A1918',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  timelineDesc: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  archImageWrapper: {
    height: 180,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  archImage: {
    width: '100%',
    height: '100%',
  },
  stepTabScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  stepTabActive: {
    backgroundColor: '#1A1918',
    borderColor: '#1A1918',
  },
  stepTabNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888888',
  },
  stepTabNumActive: {
    color: '#C5A059',
  },
  stepTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444444',
  },
  stepTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeStepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
  },
  activeStepNum: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  activeStepTitle: {
    color: '#1A1918',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 2,
    marginBottom: 4,
  },
  activeStepDesc: {
    color: '#1A1918',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeStepDetails: {
    color: '#666666',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  activeStepImg: {
    width: '100%',
    height: 160,
    borderRadius: 14,
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qualityCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  qualityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qualityTitle: {
    color: '#1A1918',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  qualityDesc: {
    color: '#777777',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  commerceGrid: {
    gap: 16,
  },
  retailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 20,
  },
  commerceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeLight: {
    backgroundColor: '#F0EFEA',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeLightText: {
    color: '#333333',
    fontSize: 9,
    fontWeight: '800',
  },
  commerceTitle: {
    color: '#1A1918',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  commerceDesc: {
    color: '#666666',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  retailBtn: {
    backgroundColor: '#1A1918',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retailBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  wholesaleCard: {
    backgroundColor: '#1A1918',
    borderWidth: 2,
    borderColor: '#C5A059',
    borderRadius: 20,
    padding: 20,
  },
  commerceIconBoxDark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeGold: {
    backgroundColor: '#C5A059',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeGoldText: {
    color: '#1A1918',
    fontSize: 9,
    fontWeight: '800',
  },
  wholesaleCardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  wholesaleCardDesc: {
    color: '#D4CEB8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  wholesaleBtnPrimary: {
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  wholesaleBtnPrimaryText: {
    color: '#1A1918',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 10,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
  },
  catScroll: {
    paddingLeft: 16,
    paddingRight: 10,
  },
  catCard: {
    width: 140,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#1A1918',
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 25, 24, 0.45)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  catName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  catExploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  catExploreText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
  },
  prodScroll: {
    paddingLeft: 16,
    paddingRight: 10,
  },
  prodCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    position: 'relative',
  },
  prodImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  purityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#1A1918',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  purityText: {
    color: '#C5A059',
    fontSize: 10,
    fontWeight: '700',
  },
  prodInfo: {
    padding: 12,
  },
  prodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1918',
  },
  prodWeight: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  prodPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  viewBtn: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewBtnText: {
    color: '#1A1918',
    fontSize: 10,
    fontWeight: '700',
  },
  showroomCard: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: '#1A1918',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  showroomTag: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  showroomTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  showroomDesc: {
    color: '#D4CEB8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 14,
  },
  addressText: {
    color: '#CCCCCC',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  showroomImg: {
    width: '100%',
    height: 140,
    borderRadius: 14,
  },
});
