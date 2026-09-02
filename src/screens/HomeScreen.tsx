import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Check, Sparkles, Briefcase, Award, ShieldCheck, Truck } from 'lucide-react-native';
import { catalogApi, getFullImageUrl } from '../services/api';

const DEFAULT_MAIN_CATEGORIES = [
  {
    id: 1,
    name: 'Silver Pooja Articles',
    slug: 'silver-pooja-articles',
    description: 'Sacred 925 sterling & 999 fine silver ritual essentials, deepams, thalis, and puja accessories.',
    subcategories_count: 4,
    image_url: '/public/Saibalaji products S/Floral Engraved Silver Pooja Thali Set.webp',
  },
  {
    id: 2,
    name: 'Silver Dining & Tableware',
    slug: 'silver-dining-tableware',
    description: 'Luxury 925 sterling dinner sets, tumblers, bowls, trays, and royal silverware.',
    subcategories_count: 5,
    image_url: '/public/Saibalaji products S/Royal Floral Crest Silver Serving Tray.webp',
  },
  {
    id: 3,
    name: 'Silver God & Temple Items',
    slug: 'silver-god-temple-items',
    description: 'Hand-crafted 999 fine silver deities, sanctum adornments, frames, and temple accessories.',
    subcategories_count: 2,
    image_url: '/public/Saibalaji products S/Elegant Silver Lakshmi Devi Idol with Ornate Arch.webp',
  },
  {
    id: 4,
    name: 'Silver Wedding & Return Gifts',
    slug: 'silver-wedding-return-gifts',
    description: 'Memorable silver keepsakes, return gift sets, engraved storage boxes, and custom wedding tokens.',
    subcategories_count: 2,
    image_url: '/public/Saibalaji products S/Shree Divya Silver Masala Box Set.webp',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>(DEFAULT_MAIN_CATEGORIES);

  useEffect(() => {
    catalogApi.getCategories()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((cat: any) => ({
            ...cat,
            subcategories_count: cat.subcategories ? cat.subcategories.length : (cat.subcategories_count || 3),
            image_url: cat.image_url || '',
          }));
          setCategories(mapped);
        }
      })
      .catch((err) => {
        console.log('Using default categories with backend image URLs fallback');
      });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CONTENT CONTAINER */}
        <View style={styles.heroContainer}>
          {/* Eyebrow Pill */}
          <View style={styles.eyebrowPill}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowPillText}>EST. 2019  • TENALI, INDIA</Text>
          </View>

          {/* Sub Header */}
          <Text style={styles.brandSubHeader}>SAI BALAJI SILVER</Text>

          {/* Hero Title Lockup */}
          <View style={styles.titleLockup}>
            <Text style={styles.heroTitleMain}>CRAFTED IN</Text>
            <Text style={styles.heroTitleNavy}>PURE SILVER.</Text>
          </View>

          {/* Body Paragraph */}
          <Text style={styles.heroSubtitle}>
            Three decades of South Indian craftsmanship, metallurgical precision and 100% NABL-certified silver — shaped in Tenali.
          </Text>

          {/* Checkmark Features Row */}
          <View style={styles.certRow}>
            <View style={styles.certBadge}>
              <Check size={14} color="#B5985B" strokeWidth={2.5} />
              <Text style={styles.certText}>999 FINE SILVER</Text>
            </View>

            <Text style={styles.certDot}>•</Text>

            <View style={styles.certBadge}>
              <Check size={14} color="#B5985B" strokeWidth={2.5} />
              <Text style={styles.certText}>925 STERLING</Text>
            </View>

            <Text style={styles.certDot}>•</Text>

            <View style={styles.certBadge}>
              <Check size={14} color="#B5985B" strokeWidth={2.5} />
              <Text style={styles.certText}>NABL HALLMARKED</Text>
            </View>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
            activeOpacity={0.88}
          >
            <Text style={styles.exploreBtnText}>EXPLORE COLLECTION</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Secondary SHOP SILVER Button */}
          <TouchableOpacity
            style={styles.shopSilverBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
            activeOpacity={0.88}
          >
            <Text style={styles.shopSilverBtnText}>SHOP SILVER</Text>
          </TouchableOpacity>

          {/* HERO SHOWCASE CARD FRAME WITH DEITY IDOL IMAGE */}
          <View style={styles.showcaseFrame}>
            <View style={styles.innerShowcaseCard}>
              <Image
                source={require('../../assets/homescreen.webp')}
                style={styles.showcaseImage}
                resizeMode="cover"
              />

              {/* Floating Pill Badge */}
              <View style={styles.floatingBadge}>
                <Sparkles size={15} color="#B5985B" />
                <Text style={styles.floatingBadgeText}>999 Fine Silver Deity Idol</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BRAND STORY SECTION — EXACT MATCH FOR USER IMAGE */}
        <View style={styles.brandStorySection}>
          <Text style={styles.brandStoryEyebrow}>THE HOUSE OF SAI BALAJI</Text>
          <Text style={styles.brandStoryHeading}>
            Mastering the art of silver through generations of purity.
          </Text>
          <Text style={styles.brandStoryBody}>
            From Tenali to patrons across India, Sai Balaji Silverworks brings together generations of craftsmanship, purity and precision. Operating from our specialized manufacturing atelier, we bridge classical deity sculpting with NABL-certificated 999 fine & 925 sterling silver formulations.
          </Text>
          <View style={styles.brandStoryDivider} />
        </View>

        {/* SILVER PURITY & CERTIFICATION SECTION — EXACT MATCH FOR USER IMAGE */}
        <View style={styles.puritySection}>
          <Text style={styles.purityEyebrow}>
            GUARANTEED METALLURGICAL{'\n'}EXCELLENCE
          </Text>
          <Text style={styles.purityHeading}>Silver Purity & Certification</Text>

          <View style={styles.purityCardsRow}>
            {/* CARD 1: 999 FINE SILVER */}
            <View style={styles.purityCard}>
              <Text style={styles.purityNumber}>999</Text>
              <Text style={styles.purityTag}>FINE SILVER</Text>
              <Text style={styles.purityDesc}>
                Pure 99.9% fine silver for temple idols, sacred pooja articles, thalis, and investment bullion.
              </Text>
            </View>

            {/* CARD 2: 925 STERLING SILVER */}
            <View style={styles.purityCard}>
              <Text style={styles.purityNumber}>925</Text>
              <Text style={styles.purityTag}>STERLING SILVER</Text>
              <Text style={styles.purityDesc}>
                Precision 92.5% sterling silver for durable dining tableware, baby gifts, and fine ornaments.
              </Text>
            </View>

            {/* CARD 3: 7+ YEARS OF LEGACY */}
            <View style={styles.purityCard}>
              <Text style={styles.purityNumber}>7+</Text>
              <Text style={styles.purityTag}>YEARS OF LEGACY</Text>
              <Text style={styles.purityDesc}>
                Established South Indian silver manufacturing atelier based in Tenali, Andhra Pradesh.
              </Text>
            </View>
          </View>
        </View>

        {/* SILVER COLLECTIONS SECTION — EXACT MATCH FOR USER IMAGE */}
        <View style={styles.collectionsSection}>
          <Text style={styles.collectionsEyebrow}>EXPLORE BY CATEGORY</Text>
          <Text style={styles.collectionsHeading}>Silver Collections</Text>

          <TouchableOpacity
            style={styles.viewCategoriesBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
            activeOpacity={0.8}
          >
            <Text style={styles.viewCategoriesText}>VIEW CATEGORIES</Text>
            <ArrowRight size={15} color="#B5985B" strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={styles.collectionsGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.collectionCard}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Categories', params: { categorySlug: cat.slug } })}
                activeOpacity={0.9}
              >
                {/* Top Image Frame Container */}
                <View style={styles.colImageFrame}>
                  {Boolean(cat.image_url) ? (
                    <Image
                      source={{ uri: getFullImageUrl(cat.image_url) }}
                      style={styles.colImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderFrame}>
                      <Text style={styles.placeholderText} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bottom Details Container */}
                <View style={styles.colDetails}>
                  <Text style={styles.colSubCount}>{cat.subcategories_count} SUBCATEGORIES</Text>
                  <Text style={styles.colName}>{cat.name}</Text>
                  <Text style={styles.colDesc}>{cat.description}</Text>
                  <View style={styles.colCtaLink}>
                    <Text style={styles.colCtaText}>EXPLORE COLLECTION →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* B2B / WHOLESALE SECTION — EXACT MATCH FOR USER IMAGE */}
        <View style={styles.wholesaleSection}>
          <Text style={styles.wholesaleEyebrow}>
            INDIVIDUAL • CUSTOM • WHOLESALE
          </Text>
          <Text style={styles.wholesaleHeading}>
            From individual bespoke pieces to large-scale B2B wholesale requirements.
          </Text>
          <Text style={styles.wholesaleBody}>
            Supplying leading South Indian jewellery showrooms, temples, and corporate institutions with customized silver minting, 999 bullion bars, and bulk retail stock with ReportLab PDF quotation support.
          </Text>

          <TouchableOpacity
            style={styles.wholesaleBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Wholesale' })}
            activeOpacity={0.88}
          >
            <Text style={styles.wholesaleBtnText}>ENQUIRE FOR WHOLESALE</Text>
            <Briefcase size={16} color="#B5985B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* UNCOMPROMISING STANDARDS SECTION */}
        <View style={styles.standardsSection}>
          <Text style={styles.standardsEyebrow}>UNCOMPROMISING STANDARDS</Text>
          <Text style={styles.standardsHeading}>Why Sai Balaji Silverworks</Text>

          <View style={styles.standardsCardsContainer}>
            {/* CARD 1: 100% AUTHENTIC SILVER */}
            <View style={styles.standardCard}>
              <Award size={30} color="#B5985B" strokeWidth={1.4} style={{ marginBottom: 14 }} />
              <Text style={styles.standardCardTitle}>100% Authentic Silver</Text>
              <Text style={styles.standardCardBody}>
                NABL spectrometry assayed 999 fine silver and 925 sterling formulations.
              </Text>
            </View>

            {/* CARD 2: MASTER CRAFTSMANSHIP */}
            <View style={styles.standardCard}>
              <ShieldCheck size={30} color="#B5985B" strokeWidth={1.4} style={{ marginBottom: 14 }} />
              <Text style={styles.standardCardTitle}>Master Craftsmanship</Text>
              <Text style={styles.standardCardBody}>
                Ancestral South Indian temple idol sculpting & Nakshi relief carving.
              </Text>
            </View>

            {/* CARD 3: ANTI-TARANISH COATING */}
            <View style={styles.standardCard}>
              <Sparkles size={30} color="#B5985B" strokeWidth={1.4} style={{ marginBottom: 14 }} />
              <Text style={styles.standardCardTitle}>Anti-Tarnish Coating</Text>
              <Text style={styles.standardCardBody}>
                Nano protective barrier preserves mirror-bright specular shine for years.
              </Text>
            </View>

            {/* CARD 4: INSURED SAFE SHIPPING */}
            <View style={styles.standardCard}>
              <Truck size={30} color="#B5985B" strokeWidth={1.4} style={{ marginBottom: 14 }} />
              <Text style={styles.standardCardTitle}>Insured Safe Shipping</Text>
              <Text style={styles.standardCardBody}>
                Tamper-evident luxury packaging and insured dispatch across India.
              </Text>
            </View>
          </View>
        </View>

        {/* CRAFTED TO LAST BANNER SECTION — EXACT MATCH FOR USER IMAGE */}
        <View style={styles.craftedBannerSection}>
          <Text style={styles.craftedEyebrow}>CRAFTED TO LAST • CREATED IN SILVER</Text>
          <Text style={styles.craftedHeadingMain}>Discover Pure Silver</Text>
          <Text style={styles.craftedHeadingItalic}>Crafted for Generations.</Text>

          <Text style={styles.craftedBody}>
            Browse our hallmarked deity idols, dining tableware, pooja thalis, and custom minting options.
          </Text>

          <View style={styles.craftedBtnRow}>
            <TouchableOpacity
              style={styles.craftedExploreBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
              activeOpacity={0.88}
            >
              <Text style={styles.craftedExploreBtnText}>EXPLORE COLLECTIONS →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.craftedContactBtn}
              onPress={() => navigation.navigate('Contact')}
              activeOpacity={0.88}
            >
              <Text style={styles.craftedContactBtnText}>CONTACT US →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 32,
    alignItems: 'center',
  },
  heroContainer: {
    width: '100%',
    alignItems: 'center',
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#B5985B',
    marginRight: 8,
  },
  eyebrowPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#78726A',
    letterSpacing: 2.2,
  },
  brandSubHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  titleLockup: {
    alignItems: 'center',
    marginBottom: 22,
  },
  heroTitleMain: {
    fontSize: 44,
    fontWeight: '400',
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    lineHeight: 52,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroTitleNavy: {
    fontSize: 44,
    fontWeight: '400',
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#121767',
    lineHeight: 52,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B665E',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  certRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    gap: 6,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  certText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5C574F',
    letterSpacing: 1.5,
  },
  certDot: {
    marginHorizontal: 4,
    color: '#D6CEC3',
    fontSize: 12,
  },
  exploreBtn: {
    backgroundColor: '#1C1D1F',
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  shopSilverBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  shopSilverBtnText: {
    color: '#202020',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 2,
  },
  showcaseFrame: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E1D8',
    padding: 12,
    marginTop: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  innerShowcaseCard: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingBadgeText: {
    fontSize: 13.5,
    fontFamily: Platform.OS === 'ios' ? 'Bodoni 72' : 'serif',
    fontStyle: 'italic',
    color: '#202020',
  },
  // BRAND STORY SECTION STYLING
  brandStorySection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 44,
    marginTop: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EAE6DF',
  },
  brandStoryEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  brandStoryHeading: {
    fontSize: 26,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  brandStoryBody: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 550,
  },
  brandStoryDivider: {
    width: 60,
    height: 1.5,
    backgroundColor: '#B5985B',
    marginTop: 32,
  },
  // PURITY SECTION STYLING
  puritySection: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 22,
    paddingVertical: 44,
    alignItems: 'center',
  },
  purityEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  purityHeading: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    marginBottom: 28,
  },
  purityCardsRow: {
    width: '100%',
    gap: 16,
  },
  purityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E1D8',
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  purityNumber: {
    fontSize: 46,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    marginBottom: 6,
  },
  purityTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 2.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  purityDesc: {
    fontSize: 13.5,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 21,
  },
  // COLLECTIONS SECTION STYLING
  collectionsSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 44,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EAE6DF',
  },
  collectionsEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  collectionsHeading: {
    fontSize: 30,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    marginBottom: 14,
  },
  viewCategoriesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  viewCategoriesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#202020',
    letterSpacing: 2.5,
  },
  collectionsGrid: {
    width: '100%',
    gap: 20,
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E1D8',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  colImageFrame: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
  },
  colImage: {
    width: '100%',
    height: '100%',
  },
  colDetails: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    backgroundColor: '#FFFFFF',
  },
  colSubCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 2,
    marginBottom: 6,
  },
  colName: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    marginBottom: 8,
  },
  colDesc: {
    fontSize: 13.5,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 16,
  },
  colCtaLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colCtaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1C1D1F',
    letterSpacing: 1.8,
  },
  placeholderFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.12)',
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
  },
  // WHOLESALE SECTION STYLING
  wholesaleSection: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 22,
    paddingVertical: 48,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#EAE6DF',
  },
  wholesaleEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  wholesaleHeading: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
  },
  wholesaleBody: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 550,
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  wholesaleBtn: {
    backgroundColor: '#1C1D1F',
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wholesaleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  // UNCOMPROMISING STANDARDS SECTION STYLING
  standardsSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 44,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EAE6DF',
  },
  standardsEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  standardsHeading: {
    fontSize: 28,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    marginBottom: 28,
  },
  standardsCardsContainer: {
    width: '100%',
    gap: 16,
  },
  standardCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE4D9',
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  standardCardTitle: {
    fontSize: 20,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    marginBottom: 10,
  },
  standardCardBody: {
    fontSize: 13.5,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 21,
  },
  // CRAFTED TO LAST BANNER SECTION STYLING
  craftedBannerSection: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 24,
    paddingVertical: 52,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EAE6DF',
  },
  craftedEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5985B',
    letterSpacing: 3.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  craftedHeadingMain: {
    fontSize: 36,
    fontFamily: Platform.select({
      ios: 'BodoniModa_400Regular',
      android: 'BodoniModa_400Regular',
      default: 'BodoniModa_400Regular, Bodoni 72, serif',
    }),
    color: '#202020',
    textAlign: 'center',
    lineHeight: 44,
  },
  craftedHeadingItalic: {
    fontSize: 38,
    fontFamily: Platform.OS === 'ios' ? 'Bodoni 72' : 'serif',
    fontStyle: 'italic',
    color: '#B5985B',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 20,
  },
  craftedBody: {
    fontSize: 13.5,
    color: '#666666',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 500,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  craftedBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  craftedExploreBtn: {
    backgroundColor: '#1C1D1F',
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  craftedExploreBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
  },
  craftedContactBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  craftedContactBtnText: {
    color: '#202020',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
