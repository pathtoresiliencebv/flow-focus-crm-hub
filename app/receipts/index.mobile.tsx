import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../src/integrations/supabase/client';
import { checkAutoApproval } from '../../src/utils/receiptApprovalService';

interface Receipt {
  id: string;
  amount: number | null;
  description: string;
  category: string;
  receipt_file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  auto_approved?: boolean;
}

export default function ReceiptsScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Upload form state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  
  // Camera permissions
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);

  useEffect(() => {
    fetchReceipts();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasCameraPermission(cameraStatus === 'granted');
  };

  const fetchReceipts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching receipts:', error);
        return;
      }

      setReceipts(data || []);
    } catch (error) {
      console.error('Error in fetchReceipts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
  };

  const takePhoto = async () => {
    if (!camera) return;

    try {
      const photo = await camera.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      setSelectedImage(photo.uri);
      setShowCameraModal(false);
      setShowUploadModal(true);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Fout', 'Kon foto niet maken');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowUploadModal(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fout', 'Kon foto niet selecteren');
    }
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('File not found');

      // If file is small enough, return as is
      if (fileInfo.size && fileInfo.size < 2 * 1024 * 1024) {
        return uri;
      }

      // For larger files, we already compressed with quality: 0.7 in picker/camera
      return uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  };

  const uploadReceipt = async () => {
    if (!selectedImage) {
      Alert.alert('Fout', 'Selecteer eerst een foto');
      return;
    }

    if (!description) {
      Alert.alert('Fout', 'Vul een omschrijving in');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Fout', 'Niet ingelogd');
        return;
      }

      // Compress image
      const compressedUri = await compressImage(selectedImage);

      // Read file
      const fileUri = compressedUri;
      
      // Get file extension
      const extension = compressedUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${extension}`;

      // For React Native, we use a different upload approach
      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        Alert.alert('Fout', 'Bestand niet gevonden');
        return;
      }

      // Create a blob from the file URI (React Native fetch supports this)
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, blob, {
          contentType: `image/${extension}`,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Fout', 'Kon bonnetje niet uploaden');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Parse amount
      const parsedAmount = amount ? parseFloat(amount) : null;

      // Create receipt record
      const receiptData = {
        user_id: user.id,
        amount: parsedAmount,
        description,
        category,
        receipt_file_url: publicUrl,
        receipt_file_name: fileName,
        receipt_file_type: `image/${extension}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { data: receipt, error: insertError } = await supabase
        .from('receipts')
        .insert(receiptData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        Alert.alert('Fout', 'Kon bonnetje niet opslaan');
        return;
      }

      // Check for auto-approval
      if (parsedAmount) {
        try {
          const approvalResult = await checkAutoApproval(user.id, parsedAmount, category || undefined);
          
          if (approvalResult.shouldAutoApprove) {
            // Update to auto-approved
            await supabase
              .from('receipts')
              .update({
                status: 'approved',
                auto_approved: true,
                approval_rule_id: approvalResult.ruleId,
                approved_at: new Date().toISOString(),
              })
              .eq('id', receipt.id);

            Alert.alert(
              'Geüpload & Goedgekeurd! ✅',
              `Je bonnetje is automatisch goedgekeurd via regel: ${approvalResult.ruleName}`
            );
          } else {
            Alert.alert('Geüpload! ✅', 'Je bonnetje is ter beoordeling ingediend');
          }
        } catch (error) {
          console.error('Auto-approval check failed:', error);
          Alert.alert('Geüpload! ✅', 'Je bonnetje is ter beoordeling ingediend');
        }
      } else {
        Alert.alert('Geüpload! ✅', 'Je bonnetje is ter beoordeling ingediend');
      }

      // Reset form
      setSelectedImage(null);
      setAmount('');
      setDescription('');
      setCategory('');
      setShowUploadModal(false);

      // Refresh list
      fetchReceipts();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      Alert.alert('Fout', 'Er is iets misgegaan bij het uploaden');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Goedgekeurd';
      case 'pending':
        return 'In behandeling';
      case 'rejected':
        return 'Afgewezen';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return `€ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9d2235" />
        <Text style={styles.loadingText}>Bonnetjes laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bonnetjes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, styles.cameraButton]}
            onPress={() => {
              if (hasCameraPermission) {
                setShowCameraModal(true);
              } else {
                Alert.alert('Geen toegang', 'Camera toegang is vereist');
              }
            }}
          >
            <Text style={styles.headerButtonText}>📷 Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.galleryButton]}
            onPress={pickImage}
          >
            <Text style={styles.headerButtonText}>🖼️ Galerij</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Receipts List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📄</Text>
            <Text style={styles.emptyTitle}>Geen bonnetjes</Text>
            <Text style={styles.emptySubtitle}>
              Gebruik de camera of galerij om een bonnetje toe te voegen
            </Text>
          </View>
        ) : (
          <View style={styles.receiptsContainer}>
            {receipts.map((receipt) => (
              <View key={receipt.id} style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptDescription}>{receipt.description}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(receipt.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(receipt.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptAmount}>{formatCurrency(receipt.amount)}</Text>
                  <Text style={styles.receiptDate}>{formatDate(receipt.created_at)}</Text>
                </View>

                {receipt.category && (
                  <Text style={styles.receiptCategory}>📁 {receipt.category}</Text>
                )}

                {receipt.auto_approved && (
                  <View style={styles.autoApprovedBadge}>
                    <Text style={styles.autoApprovedText}>✅ Automatisch goedgekeurd</Text>
                  </View>
                )}

                {receipt.receipt_file_url && (
                  <Image
                    source={{ uri: receipt.receipt_file_url }}
                    style={styles.receiptThumbnail}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraContainer}>
          {hasCameraPermission && (
            <Camera
              style={styles.camera}
              type={CameraType.back}
              ref={(ref) => setCamera(ref)}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCameraModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕ Sluiten</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </Camera>
          )}
        </View>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bonnetje uploaden</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Bedrag (optioneel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="€ 0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Omschrijving *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bijv. tankstation, kantoorbenodigdheden"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categorie (optioneel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bijv. transport, materiaal"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={uploadReceipt}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>📤 Uploaden</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#9d2235',
  },
  galleryButton: {
    backgroundColor: '#3b82f6',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  receiptsContainer: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  receiptDescription: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9d2235',
  },
  receiptDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  receiptCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  autoApprovedBadge: {
    backgroundColor: '#d1fae5',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  autoApprovedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  receiptThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#9d2235',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalScroll: {
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#9d2235',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

