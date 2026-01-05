import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useAppTheme } from '../../hooks/useAppTheme';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../../src/services/ApiService';
import DocumentStore from '../../src/services/DocumentStore';

interface DocumentFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  processed: boolean;
  content?: string;
  error?: string;
}

export default function ExploreScreen() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const { theme } = useAppTheme();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          // Excel and spreadsheet formats
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
          'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // .xltx
          // OpenDocument and Apple formats
          'application/vnd.oasis.opendocument.spreadsheet', // .ods
          'application/vnd.apple.numbers', // .numbers
          // Text-based formats
          'text/plain',
          'text/csv',
          'text/tab-separated-values', // .tsv
          'application/json',
          // Google Drive formats
          'application/vnd.google-apps.document',
          'application/vnd.google-apps.spreadsheet'
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newDocs = result.assets.map((asset, index) => ({
          id: Date.now() + index + '',
          name: asset.name || 'Unknown file',
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          processed: false,
        }));

        setDocuments(prev => [...prev, ...newDocs]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access media library is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newDocs = result.assets.map((asset, index) => ({
          id: Date.now() + index + '',
          name: asset.fileName || `image_${index + 1}.jpg`,
          uri: asset.uri,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
          processed: false,
        }));

        setDocuments(prev => [...prev, ...newDocs]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newDoc: DocumentFile = {
          id: Date.now() + '',
          name: `photo_${Date.now()}.jpg`,
          uri: asset.uri,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
          processed: false,
        };

        setDocuments(prev => [...prev, newDoc]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const processDocuments = async () => {
    if (documents.length === 0) {
      Alert.alert('No Documents', 'Please select documents to process');
      return;
    }

    setLoading(true);
    try {
      const files = documents.map(doc => ({
        uri: doc.uri,
        name: doc.name,
        type: doc.type,
      }));

      const response = await ApiService.uploadFiles(files);
      
      // Update documents with processing results
      const updatedDocs = documents.map((doc, index) => {
        const result = response.results[index];
        return {
          ...doc,
          processed: true,
          content: result.success ? result.filtered_text : undefined,
          error: !result.success ? result.error : undefined,
        };
      });

      setDocuments(updatedDocs);

      // Save successfully processed documents to shared store
      const successfulDocs = updatedDocs.filter(doc => doc.processed && doc.content);
      if (successfulDocs.length > 0) {
        await DocumentStore.saveProcessedDocuments(successfulDocs);
      }

      // Check if any PDFs were processed to customize the message
      const pdfCount = files.filter(file => file.type === 'application/pdf').length;
      const hasPdfs = pdfCount > 0;
      
      let message = `Successfully processed ${response.summary.successful} out of ${response.summary.total_files} files\n\nProcessed documents are now available in the Chat tab.`;
      
      if (hasPdfs) {
        message += `\n\n📄 PDF Note: ${pdfCount} PDF file${pdfCount > 1 ? 's' : ''} processed on-device. Form data and structured content extracted where available. For text-heavy PDFs, converting to Word (.docx) format provides optimal results.`;
      }
      
      message += `\n\n⚠️ Privacy: PII filtering uses basic pattern matching and may not detect all sensitive information. Please review documents before sharing with external services.`;

      Alert.alert(
        'Processing Complete',
        message,
        [
          { text: 'OK' }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to process documents');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All Documents',
      'Are you sure you want to remove all documents?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => setDocuments([])
        }
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocument = ({ item }: { item: DocumentFile }) => (
    <View style={[styles.documentItem, { 
      backgroundColor: theme === 'dark' ? '#333' : 'white',
      borderColor: theme === 'dark' ? '#555' : '#e0e0e0'
    }]}>
      <View style={styles.documentInfo}>
        <Text style={[styles.documentName, { color: textColor }]}>{item.name}</Text>
        <Text style={[styles.documentDetails, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {formatFileSize(item.size)}
        </Text>
        {item.processed && (
          <Text style={[styles.status, item.error ? styles.errorStatus : styles.successStatus]}>
            {item.error ? `Error: ${item.error}` : 'Processed ✓'}
          </Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeDocument(item.id)}
        testID="remove-document"
      >
        <Icon name="close" size={20} color={theme === 'dark' ? '#ccc' : '#666'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { 
        backgroundColor,
        borderBottomColor: theme === 'dark' ? '#555' : '#e0e0e0'
      }]}>
        <Text style={[styles.title, { color: textColor }]}>Document Upload</Text>
        {documents.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.buttonContainer, { backgroundColor }]}>
        <TouchableOpacity style={styles.actionButton} onPress={pickDocument}>
          <Icon name="attach-file" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Pick Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <Icon name="photo-library" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Pick Images</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Icon name="camera-alt" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        style={[styles.documentsList, { backgroundColor }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="cloud-upload" size={64} color={theme === 'dark' ? '#666' : '#ccc'} />
            <Text style={[styles.emptyText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>No documents selected</Text>
            <Text style={[styles.emptySubtext, { color: theme === 'dark' ? '#888' : '#999' }]}>
              Upload PDF, Word, Excel, CSV, ODS, Numbers, text files, or images to get started
            </Text>
          </View>
        }
      />

      {documents.length > 0 && (
        <View style={[styles.footer, { 
          backgroundColor,
          borderTopColor: theme === 'dark' ? '#555' : '#e0e0e0'
        }]}>
          <View style={[styles.disclaimerContainer, { 
            backgroundColor: theme === 'dark' ? '#444' : '#FFF3CD',
            borderLeftColor: '#FF9500'
          }]}>
            <Text style={[styles.disclaimerText, { 
              color: theme === 'dark' ? '#ffcc66' : '#856404'
            }]}>
              ⚠️ Basic PII filtering applied - review documents for sensitive data
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.processButton, loading && styles.processButtonDisabled]}
            onPress={processDocuments}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="play-arrow" size={24} color="white" />
            )}
            <Text style={styles.processButtonText}>
              {loading ? 'Processing...' : `Process ${documents.length} Document(s)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    color: '#FF3B30',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  buttonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
  documentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
  successStatus: {
    color: '#34C759',
  },
  errorStatus: {
    color: '#FF3B30',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  disclaimerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#ccc',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
