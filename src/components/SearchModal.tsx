import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSearchModal } from '../context/SearchContext';
import { catalogApi } from '../services/api';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

export const SearchModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isSearchOpen, closeSearch } = useSearchModal();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await catalogApi.getProducts({ search: searchTerm, limit: 100 });
      if (res && Array.isArray(res.data)) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.log('Search API error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    closeSearch();
    navigation.navigate('ProductDetail', { product });
  };

  if (!isSearchOpen) return null;

  return (
    <Modal
      visible={isSearchOpen}
      animationType="fade"
      transparent={false}
      onRequestClose={closeSearch}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top + 12, 24) }]}>
        {/* TOP CLOSE BUTTON */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeSearch}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color="#1A1918" />
          </TouchableOpacity>
        </View>

        {/* SEARCH HEADER & INPUT BLOCK (MATCHING USER SCREENSHOT) */}
        <View style={styles.searchCenterBlock}>
          <Text style={styles.searchTag}>SEARCH SAI BALAJI SILVER STORE</Text>

          <View style={styles.inputUnderlineFrame}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search 999 Fine Idols, Pooja Thalis, Silver Lamps..."
              placeholderTextColor="#999999"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch(query)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
                <X size={18} color="#888888" />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.subHint}>Press Enter to view results</Text>
        </View>

        {/* SEARCH RESULTS LIST */}
        <View style={{ flex: 1, marginTop: 20 }}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#C5A059" />
              <Text style={styles.stateText}>Searching catalog...</Text>
            </View>
          ) : query.trim() && results.length === 0 ? (
            <View style={styles.centerState}>
              <Search size={32} color="#CCCCCC" />
              <Text style={styles.stateTitle}>No products found</Text>
              <Text style={styles.stateText}>Try searching for "Idols", "Thali", "Lamp", or "Bowl"</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 40) }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ width: itemWidth }}>
                  <ProductCard
                    product={item}
                    width={itemWidth}
                    onPress={() => handleSelectProduct(item)}
                  />
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 20,
  },

  searchCenterBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  searchTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B9A77A',
    letterSpacing: 2.5,
    marginBottom: 20,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  inputUnderlineFrame: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#C5A059',
    paddingBottom: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingVertical: 0,
  },

  subHint: {
    fontSize: 11.5,
    color: '#888888',
    textAlign: 'center',
  },

  centerState: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 10,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  stateText: {
    fontSize: 12.5,
    color: '#777777',
    textAlign: 'center',
  },
});

export default SearchModal;
