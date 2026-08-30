import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, ChevronRight, X, Layers } from 'lucide-react-native';
import { catalogApi } from '../services/api';
import { Category, Product, SubCategoryItem } from '../types';
import { ProductCard } from '../components/ProductCard';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

// Fallback category hierarchy for Wholesale catalog
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Silver Pooja Articles',
    slug: 'silver-pooja-articles',
    description: 'Sacred 925 sterling & 999 fine silver ritual essentials, deepams, thalis, and puja accessories.',
    image_url: '',
    subcategories: [
      {
        name: 'Idols & Statues',
        slug: 'idols-statues',
        sub_subcategories: ['Lord Ganesha', 'Goddess Lakshmi', 'Balaji / Venkateswara', 'Radha Krishna'],
      },
      {
        name: 'Deepam & Lamps',
        slug: 'deepam-lamps',
        sub_subcategories: ['Kuthu Vilakku', 'Annam Lamp', 'Kamatchi Lamp', 'Nanda Deepam'],
      },
      {
        name: 'Thalis & Pooja Accessories',
        slug: 'thalis-pooja-accessories',
        sub_subcategories: ['Pooja Thali Set', 'Engraved Silver Plate', 'Panchapatra Plate', 'Kalasham'],
      },
    ],
  },
  {
    id: 2,
    name: 'Silver Dining & Tableware',
    slug: 'silver-dining-tableware',
    description: 'Luxury 925 sterling dinner sets, tumblers, bowls, trays, and royal silverware.',
    image_url: '',
    subcategories: [
      {
        name: 'Dinner Sets',
        slug: 'dinner-sets',
        sub_subcategories: ['5-Piece Dinner Set', '7-Piece Royal Thali Set', 'Baby Feeding Set'],
      },
      {
        name: 'Drinkware & Tumblers',
        slug: 'drinkware-tumblers',
        sub_subcategories: ['Silver Tumblers', 'Silver Jugs & Pitchers', 'Silver Water Bottle'],
      },
      {
        name: 'Serving Bowls & Trays',
        slug: 'serving-bowls-trays',
        sub_subcategories: ['Ice Cream Bowls', 'Sweet Serving Bowl', 'Silver Trays'],
      },
      {
        name: 'Spoons & Cutlery',
        slug: 'spoons-cutlery',
        sub_subcategories: ['Silver Spoons', 'Silver Forks', 'Cutlery Set'],
      },
    ],
  },
  {
    id: 3,
    name: 'Silver God & Temple Items',
    slug: 'silver-god-idols',
    description: 'Hand-crafted 999 fine silver deities, sanctum adornments, frames, and temple accessories.',
    image_url: '',
    subcategories: [
      {
        name: 'Deity Sculptures',
        slug: 'deity-sculptures',
        sub_subcategories: ['Grand Balaji Iconography', 'Hanuman Idol', 'Shiva Lingam', 'Durga Maa Idol'],
      },
      {
        name: 'Temple Ritual Vessels',
        slug: 'temple-ritual-vessels',
        sub_subcategories: ['Silver Kalasham', 'Abhishekam Vessel', 'Prasadam Bowl', 'Chank & Gada'],
      },
    ],
  },
  {
    id: 4,
    name: 'Silver Wedding & Return Gifts',
    slug: 'silver-wedding-return-gifts',
    description: 'Memorable silver keepsakes, return gift sets, engraved storage boxes, and custom wedding tokens.',
    image_url: '',
    subcategories: [
      {
        name: 'Heirloom Gifts & Coins',
        slug: 'heirloom-gifts-coins',
        sub_subcategories: ['Custom Logo Coins', 'Wedding Gift Frame', 'Silver Note Collection'],
      },
      {
        name: 'Return Gift Sets',
        slug: 'return-gift-sets',
        sub_subcategories: ['Bulk Gift Sets', 'Silver Boxes', 'Custom Tokens'],
      },
    ],
  },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const WholesaleScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const initialCatSlug = route.params?.categorySlug || '';

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [selectedCat, setSelectedCat] = useState<string>(initialCatSlug);
  const [selectedSubcat, setSelectedSubcat] = useState<string>('');
  const [selectedSubSubcat, setSelectedSubSubcat] = useState<string>('');

  const [availableSubcats, setAvailableSubcats] = useState<(string | SubCategoryItem)[]>([]);
  const [availableSubSubcats, setAvailableSubSubcats] = useState<string[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCat, selectedSubcat, selectedSubSubcat]);

  const fetchCategories = async () => {
    try {
      const res = await catalogApi.getCategories().catch(() => null);
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        const merged = res.data.map((cat: Category) => {
          const fb = FALLBACK_CATEGORIES.find((f) => f.slug === cat.slug);
          return {
            ...cat,
            subcategories: (cat.subcategories && cat.subcategories.length > 0)
              ? cat.subcategories
              : fb?.subcategories || [],
          };
        });
        setCategories(merged);
        updateCategorySelection(initialCatSlug, merged);
      } else {
        updateCategorySelection(initialCatSlug, FALLBACK_CATEGORIES);
      }
    } catch (err) {
      updateCategorySelection(initialCatSlug, FALLBACK_CATEGORIES);
    }
  };

  const updateCategorySelection = (catSlug: string, catList: Category[]) => {
    setSelectedCat(catSlug);
    setSelectedSubcat('');
    setSelectedSubSubcat('');
    setAvailableSubSubcats([]);

    if (!catSlug) {
      setAvailableSubcats([]);
      return;
    }

    const found = catList.find((c) => c.slug === catSlug);
    if (found && found.subcategories) {
      setAvailableSubcats(found.subcategories);
    } else {
      setAvailableSubcats([]);
    }
  };

  const handleSelectCat = (slug: string) => {
    updateCategorySelection(slug, categories);
  };

  const handleSelectSubcat = (subcatName: string) => {
    if (selectedSubcat === subcatName) {
      setSelectedSubcat('');
      setSelectedSubSubcat('');
      setAvailableSubSubcats([]);
      return;
    }

    setSelectedSubcat(subcatName);
    setSelectedSubSubcat('');

    const subItem = availableSubcats.find((item) =>
      typeof item === 'string' ? item === subcatName : item.name === subcatName
    );

    if (subItem && typeof subItem !== 'string' && subItem.sub_subcategories) {
      setAvailableSubSubcats(subItem.sub_subcategories);
    } else {
      setAvailableSubSubcats([]);
    }
  };

  const handleSelectSubSubcat = (subSubName: string) => {
    if (selectedSubSubcat === subSubName) {
      setSelectedSubSubcat('');
    } else {
      setSelectedSubSubcat(subSubName);
    }
  };

  const clearAllFilters = () => {
    setSelectedCat('');
    setSelectedSubcat('');
    setSelectedSubSubcat('');
    setAvailableSubcats([]);
    setAvailableSubSubcats([]);
    setSearchQuery('');
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await catalogApi
        .getProducts({
          category: selectedCat || undefined,
          search: searchQuery || undefined,
          limit: 500,
        })
        .catch(() => null);

      let list: Product[] = res && Array.isArray(res.data) ? res.data : [];

      if (list.length === 0) {
        const allRes = await catalogApi.getProducts({ limit: 500 }).catch(() => null);
        if (allRes && Array.isArray(allRes.data) && allRes.data.length > 0) {
          if (selectedCat) {
            const catLower = selectedCat.toLowerCase();
            const catFiltered = allRes.data.filter((p: any) =>
              p.category_slug?.toLowerCase() === catLower ||
              p.category?.slug?.toLowerCase() === catLower ||
              p.category_name?.toLowerCase().includes(catLower)
            );
            list = catFiltered.length > 0 ? catFiltered : allRes.data;
          } else {
            list = allRes.data;
          }
        }
      }

      if (selectedSubcat && list.length > 0) {
        const subcatLower = selectedSubcat.toLowerCase();
        const matchesSubcat = list.filter(
          (p) =>
            p.subcategory?.toLowerCase() === subcatLower ||
            p.title.toLowerCase().includes(subcatLower) ||
            p.description?.toLowerCase().includes(subcatLower)
        );
        if (matchesSubcat.length > 0) {
          list = matchesSubcat;
        }
      }

      if (selectedSubSubcat && list.length > 0) {
        const subSubLower = selectedSubSubcat.toLowerCase();
        const matchesSubSub = list.filter(
          (p) =>
            p.sub_subcategory?.toLowerCase() === subSubLower ||
            p.title.toLowerCase().includes(subSubLower) ||
            p.description?.toLowerCase().includes(subSubLower)
        );
        if (matchesSubSub.length > 0) {
          list = matchesSubSub;
        }
      }

      setProducts(list);
    } catch (err) {
      console.log('Error in fetchProducts, keeping current state');
    } finally {
      setLoading(false);
    }
  };

  const getSubcatName = (item: string | SubCategoryItem): string => {
    return typeof item === 'string' ? item : item.name;
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={{ width: itemWidth, marginRight: 16 }}>
      <ProductCard
        product={item}
        width={itemWidth}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      />
    </View>
  );

  const selectedCatObj = categories.find((c) => c.slug === selectedCat);

  return (
    <View style={styles.container}>

      {/* Active Breadcrumb Hierarchy Indicator */}
      {(selectedCat !== '' || selectedSubcat !== '' || selectedSubSubcat !== '') && (
        <View style={styles.breadcrumbBar}>
          <View style={styles.breadcrumbPath}>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.breadcrumbLink}>Wholesale</Text>
            </TouchableOpacity>

            {selectedCatObj && (
              <>
                <ChevronRight size={12} color="#898985" />
                <TouchableOpacity onPress={() => updateCategorySelection(selectedCat, categories)}>
                  <Text style={[styles.breadcrumbLink, !selectedSubcat && styles.breadcrumbActive]}>
                    {selectedCatObj.name}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {selectedSubcat !== '' && (
              <>
                <ChevronRight size={12} color="#898985" />
                <TouchableOpacity onPress={() => handleSelectSubcat(selectedSubcat)}>
                  <Text style={[styles.breadcrumbLink, !selectedSubSubcat && styles.breadcrumbActive]}>
                    {selectedSubcat}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {selectedSubSubcat !== '' && (
              <>
                <ChevronRight size={12} color="#898985" />
                <Text style={styles.breadcrumbActive}>{selectedSubSubcat}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.clearBtn} onPress={clearAllFilters}>
            <Text style={styles.clearBtnText}>Reset</Text>
            <X size={12} color="#C53030" />
          </TouchableOpacity>
        </View>
      )}

      {/* LEVEL 1: Wholesale Category Chips */}
      <View style={styles.chipSection}>
        <Text style={styles.sectionHeaderLabel}>WHOLESALE COLLECTIONS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[styles.chip, selectedCat === '' && styles.activeChip]}
            onPress={() => handleSelectCat('')}
          >
            <Text style={[styles.chipText, selectedCat === '' && styles.activeChipText]}>All Wholesale</Text>
          </TouchableOpacity>

          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selectedCat === c.slug && styles.activeChip]}
              onPress={() => handleSelectCat(c.slug)}
            >
              <Text style={[styles.chipText, selectedCat === c.slug && styles.activeChipText]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LEVEL 2: Subcategory Chips (if Category Selected) */}
      {availableSubcats.length > 0 && (
        <View style={styles.subcatSection}>
          <Text style={styles.sectionHeaderLabel}>
            WHOLESALE SUBCATEGORIES IN {selectedCatObj?.name.toUpperCase()}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={[styles.subChip, selectedSubcat === '' && styles.activeSubChip]}
              onPress={() => handleSelectSubcat('')}
            >
              <Text style={[styles.subChipText, selectedSubcat === '' && styles.activeSubChipText]}>All Items</Text>
            </TouchableOpacity>
            {availableSubcats.map((item, idx) => {
              const name = getSubcatName(item);
              const isSelected = selectedSubcat === name;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.subChip, isSelected && styles.activeSubChip]}
                  onPress={() => handleSelectSubcat(name)}
                >
                  <Text style={[styles.subChipText, isSelected && styles.activeSubChipText]}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* LEVEL 3: Sub-Subcategory Chips (if Subcategory Selected) */}
      {availableSubSubcats.length > 0 && (
        <View style={styles.subSubcatSection}>
          <Text style={styles.sectionHeaderLabel}>
            WHOLESALE OPTIONS FOR {selectedSubcat.toUpperCase()}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={[styles.subSubChip, selectedSubSubcat === '' && styles.activeSubSubChip]}
              onPress={() => setSelectedSubSubcat('')}
            >
              <Text style={[styles.subSubChipText, selectedSubSubcat === '' && styles.activeSubSubChipText]}>All Options</Text>
            </TouchableOpacity>
            {availableSubSubcats.map((subSubName, idx) => {
              const isSelected = selectedSubSubcat === subSubName;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.subSubChip, isSelected && styles.activeSubSubChip]}
                  onPress={() => handleSelectSubSubcat(subSubName)}
                >
                  <Text style={[styles.subSubChipText, isSelected && styles.activeSubSubChipText]}>{subSubName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Wholesale Product List Grid */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#121767" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={renderProductItem}
          contentContainerStyle={[styles.gridList, { paddingBottom: Math.max(insets.bottom + 90, 90) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Layers size={40} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Wholesale Products Found</Text>
              <Text style={styles.emptyDesc}>
                No items match the selected subcategory or option. Try resetting your filter choices.
              </Text>
              <TouchableOpacity style={styles.resetButton} onPress={clearAllFilters}>
                <Text style={styles.resetButtonText}>View All Wholesale Collections</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBF0F0',
    gap: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAEFEF',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  breadcrumbPath: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  breadcrumbLink: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  breadcrumbActive: {
    fontSize: 11,
    color: '#121767',
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clearBtnText: {
    fontSize: 10,
    color: '#C53030',
    fontWeight: '700',
  },
  sectionHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#898985',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
  },
  chipSection: {
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBF0F0',
    marginRight: 6,
  },
  activeChip: {
    backgroundColor: '#121767',
    borderColor: '#121767',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subcatSection: {
    paddingBottom: 4,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#121767',
    marginRight: 6,
  },
  activeSubChip: {
    backgroundColor: '#121767',
  },
  subChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#121767',
  },
  activeSubChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subSubcatSection: {
    paddingBottom: 6,
  },
  subSubChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#B9A77A',
    marginRight: 6,
  },
  activeSubSubChip: {
    backgroundColor: '#B9A77A',
  },
  subSubChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78350F',
  },
  activeSubSubChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  resetButton: {
    backgroundColor: '#121767',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
