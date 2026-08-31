import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSilverRate } from '../context/SilverRateContext';

export const SilverRateTicker: React.FC = () => {
  const { rateData } = useSilverRate();

  const rate999g = rateData.silver_999_rate ? rateData.silver_999_rate.toFixed(2) : '250.64';
  const rate925g = rateData.silver_925_rate ? rateData.silver_925_rate.toFixed(2) : '231.84';
  const rate999kg = rateData.silver_999_kg ? rateData.silver_999_kg.toLocaleString('en-IN') : '2,50,640';

  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>
        <View style={styles.liveBadge}>
          <View style={[styles.pulseDot, { backgroundColor: rateData.isLive ? '#34D399' : '#F59E0B' }]} />
          <Text style={styles.liveBadgeText}>{rateData.isLive ? 'LIVE (1s)' : 'SPOT'}</Text>
        </View>

        <Text style={styles.tickerText}>
          <Text style={styles.goldLabel}>999 FINE: </Text>₹{rate999g}/g (₹{rate999kg}/kg)
        </Text>

        <Text style={styles.sep}>•</Text>

        <Text style={styles.tickerText}>
          <Text style={styles.goldLabel}>925 STERLING: </Text>₹{rate925g}/g
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1918',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginVertical: 10,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tickerText: {
    color: '#F4F6F6',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  goldLabel: {
    color: '#B9A77A',
    fontWeight: '800',
  },
  sep: {
    color: '#B9A77A',
    fontSize: 10,
  },
});
