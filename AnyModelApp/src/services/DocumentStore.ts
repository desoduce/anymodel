import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentFile } from '../types/index';

class DocumentStore {
  private static readonly PROCESSED_DOCS_KEY = 'processed_documents';

  // Save processed documents to storage
  async saveProcessedDocuments(documents: DocumentFile[]): Promise<void> {
    try {
      const processedDocs = documents.filter(doc => doc.processed && doc.content);
      await AsyncStorage.setItem(
        DocumentStore.PROCESSED_DOCS_KEY, 
        JSON.stringify(processedDocs)
      );
    } catch (error) {
      if (__DEV__) console.error('Error saving processed documents:', error);
    }
  }

  // Get all processed document contents for chat
  async getProcessedDocumentContents(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(DocumentStore.PROCESSED_DOCS_KEY);
      if (!stored) return [];

      const documents: DocumentFile[] = JSON.parse(stored);
      return documents
        .filter(doc => doc.content)
        .map(doc => `--- ${doc.name} ---\n${doc.content}`);
    } catch (error) {
      if (__DEV__) console.error('Error loading processed documents:', error);
      return [];
    }
  }

  // Get processed documents list for display
  async getProcessedDocuments(): Promise<DocumentFile[]> {
    try {
      const stored = await AsyncStorage.getItem(DocumentStore.PROCESSED_DOCS_KEY);
      if (!stored) return [];

      return JSON.parse(stored);
    } catch (error) {
      if (__DEV__) console.error('Error loading processed documents:', error);
      return [];
    }
  }

  // Add a single processed document
  async addProcessedDocument(document: DocumentFile): Promise<void> {
    try {
      const existing = await this.getProcessedDocuments();
      const updated = [...existing, document];
      await AsyncStorage.setItem(
        DocumentStore.PROCESSED_DOCS_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      if (__DEV__) console.error('Error adding processed document:', error);
    }
  }

  // Remove a processed document
  async removeProcessedDocument(documentId: string): Promise<void> {
    try {
      const existing = await this.getProcessedDocuments();
      const updated = existing.filter(doc => doc.id !== documentId);
      await AsyncStorage.setItem(
        DocumentStore.PROCESSED_DOCS_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      if (__DEV__) console.error('Error removing processed document:', error);
    }
  }

  // Clear all processed documents
  async clearProcessedDocuments(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DocumentStore.PROCESSED_DOCS_KEY);
    } catch (error) {
      if (__DEV__) console.error('Error clearing processed documents:', error);
    }
  }

  // Get count of processed documents
  async getProcessedDocumentCount(): Promise<number> {
    try {
      const documents = await this.getProcessedDocuments();
      return documents.length;
    } catch (error) {
      return 0;
    }
  }

  // Check if there are any processed documents
  async hasProcessedDocuments(): Promise<boolean> {
    try {
      const count = await this.getProcessedDocumentCount();
      return count > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new DocumentStore();
