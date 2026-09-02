import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react-native';

export const ContactScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Contact Form State
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleContactSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      Alert.alert('Required Fields', 'Please fill in your Name, Email, and Message.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6F1" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: Math.max(insets.top + 20, 24),
            paddingBottom: Math.max(insets.bottom + 80, 80),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contactPageContent}>
            {/* EDITORIAL HEADER */}
            <View style={styles.editorialHeader}>
              <Text style={styles.heritageTag}>GET IN TOUCH</Text>
              <Text style={styles.mainTitle}>Contact Sai Balaji Silverworks</Text>
              <Text style={styles.mainSubtitle}>
                Visit our Tenali showroom or submit your retail & wholesale inquiries directly.
              </Text>
            </View>

            {/* DARK FACTORY SHOWROOM INFO CARD */}
            <View style={styles.darkInfoCard}>
              <View style={styles.darkBadge}>
                <Text style={styles.darkBadgeText}>TENALI FACTORY SHOWROOM</Text>
              </View>
              <Text style={styles.darkCompanyTitle}>Sai Balaji Silverworks Pvt Ltd</Text>

              <View style={styles.darkInfoList}>
                <View style={styles.darkInfoRow}>
                  <MapPin size={18} color="#B9A77A" style={{ marginTop: 2 }} />
                  <Text style={styles.darkInfoText}>
                    Main Silver Market, Autonagar, Tenali, Andhra Pradesh - 522201
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.darkInfoRow}
                  onPress={() => {
                    Linking.openURL('tel:+919492664870').catch(() => {
                      Alert.alert('Phone Call', 'Call: +91 9492664870');
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Phone size={18} color="#B9A77A" />
                  <Text style={styles.darkInfoText}>+91 9492664870</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.darkInfoRow}
                  onPress={() => {
                    Linking.openURL('mailto:wholesale@saibalajisilverworks.com').catch(() => {
                      Alert.alert('Email', 'Email: wholesale@saibalajisilverworks.com');
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Mail size={18} color="#B9A77A" />
                  <Text style={styles.darkInfoText}>wholesale@saibalajisilverworks.com</Text>
                </TouchableOpacity>

                <View style={styles.darkInfoRow}>
                  <Clock size={18} color="#B9A77A" />
                  <Text style={styles.darkInfoText}>Monday – Saturday: 10:00 AM – 8:30 PM IST</Text>
                </View>
              </View>

              <View style={styles.darkQuoteFooter}>
                <Text style={styles.darkQuoteText}>
                  "Direct Manufacturing & Wholesale Inquiries Welcome"
                </Text>
              </View>
            </View>

            {/* CONTACT FORM CARD */}
            <View style={styles.contactFormCard}>
              {submitted ? (
                <View style={styles.successContainer}>
                  <CheckCircle2 size={54} color="#34A853" style={{ marginBottom: 12 }} />
                  <Text style={styles.successTitle}>Inquiry Sent Successfully</Text>
                  <Text style={styles.successSub}>
                    Thank you for reaching out. Our representative will contact you within 24 hours.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resetBtnText}>SEND ANOTHER MESSAGE</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  <Text style={styles.formTitle}>Send Us an Inquiry</Text>

                  <View>
                    <Text style={styles.fieldLabel}>YOUR NAME *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Enter your name"
                      placeholderTextColor="#999"
                      value={formData.name}
                      onChangeText={(t) => setFormData({ ...formData, name: t })}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Enter your email address"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(t) => setFormData({ ...formData, email: t })}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(t) => setFormData({ ...formData, phone: t })}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>SUBJECT</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Retail / Wholesale Inquiry"
                      placeholderTextColor="#999"
                      value={formData.subject}
                      onChangeText={(t) => setFormData({ ...formData, subject: t })}
                    />
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>YOUR MESSAGE *</Text>
                    <TextInput
                      style={[styles.fieldInput, styles.textAreaInput]}
                      placeholder="Write your query or custom silver requirement..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      value={formData.message}
                      onChangeText={(t) => setFormData({ ...formData, message: t })}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitFormBtn, submitting && { opacity: 0.6 }]}
                    onPress={handleContactSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Send size={16} color="#FFFFFF" />
                        <Text style={styles.submitFormBtnText}>SUBMIT MESSAGE</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  // EDITORIAL HEADER
  editorialHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 16,
  },
  heritageTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B9A77A',
    letterSpacing: 2.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#202020',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 12.5,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },

  // CONTACT PAGE
  contactPageContent: {
    paddingHorizontal: 16,
    gap: 20,
  },
  darkInfoCard: {
    backgroundColor: '#1A1918',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 20,
    gap: 16,
  },
  darkBadge: {
    backgroundColor: '#B9A77A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  darkBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  darkCompanyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  darkInfoList: {
    gap: 12,
  },
  darkInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  darkInfoText: {
    color: '#E0E0E0',
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
  },
  darkQuoteFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  darkQuoteText: {
    color: '#B9A77A',
    fontSize: 12,
    fontStyle: 'italic',
  },

  contactFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: '#1A1918',
  },
  textAreaInput: {
    height: 100,
    paddingTop: 12,
  },
  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1918',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  submitFormBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1,
  },

  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  successSub: {
    fontSize: 12.5,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  resetBtn: {
    backgroundColor: '#1A1918',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default ContactScreen;
