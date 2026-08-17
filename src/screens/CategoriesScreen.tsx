import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, Filter, ArrowUpDown } from 'lucide-react-native';
import api, { getFullImageUrl, getProductImageUrl } from '../services/api';
import { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

export const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const initialCatSlug = route.params?.categorySlug || '';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>(initialCatSlug);
  const [selectedSubcat, setSelectedSubcat] = useState<string>('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCat, selectedSubcat, sortBy]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (initialCatSlug) {
        const foundCat = res.data.find((c: Category) => c.slug === initialCatSlug);
        if (foundCat && foundCat.subcategories) {
          setSubcategories(foundCat.subcategories);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/products?';
      if (selectedCat) url += `category=${selectedCat}&`;
      if (selectedSubcat) url += `subcategory=${encodeURIComponent(selectedSubcat)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    fetchProducts();
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

  return (
    <View style={styles.container}>
      
      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search color="#888" size={16} />
        <TextInput
          placeholder="Search products, SKUs, purity..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          style={styles.searchInput}
        />
      </View>

      {/* Horizontal Category Chips */}
      <View style={styles.catChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[styles.chip, selectedCat === '' && styles.activeChip]}
            onPress={() => {
              setSelectedCat('');
              setSelectedSubcat('');
            }}
          >
            <Text style={[styles.chipText, selectedCat === '' && styles.activeChipText]}>All Collections</Text>
          </TouchableOpacity>

          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selectedCat === c.slug && styles.activeChip]}
              onPress={() => {
                setSelectedCat(c.slug);
                setSelectedSubcat('');
              }}
            >
              <Text style={[styles.chipText, selectedCat === c.slug && styles.activeChipText]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Subcategory Chips if any */}
      {subcategories.length > 0 && (
        <View style={styles.subcatContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={[styles.subChip, selectedSubcat === '' && styles.activeSubChip]}
              onPress={() => setSelectedSubcat('')}
            >
              <Text style={[styles.subChipText, selectedSubcat === '' && styles.activeSubChipText]}>All Items</Text>
            </TouchableOpacity>
            {subcategories.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.subChip, selectedSubcat === s && styles.activeSubChip]}
                onPress={() => setSelectedSubcat(s)}
              >
                <Text style={[styles.subChipText, selectedSubcat === s && styles.activeSubChipText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Product List Grid */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#C5A059" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={renderProductItem}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptyDesc}>Try clearing your filters or changing your search phrase.</Text>
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
    marginBottom: 8,
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
  catChipsContainer: {
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBF0F0',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#2D6A68',
    borderColor: '#2D6A68',
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
  subcatContainer: {
    paddingBottom: 8,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2D6A68',
    marginRight: 6,
  },
  activeSubChip: {
    backgroundColor: '#2D6A68',
  },
  subChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D6A68',
  },
  activeSubChipText: {
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
  gridCard: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9F9F9',
  },
  purityBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#1A1918',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  purityText: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '700',
  },
  gridContent: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1918',
    height: 32,
  },
  gridWeight: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1918',
    marginTop: 6,
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
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
});
