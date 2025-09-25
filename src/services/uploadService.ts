import { database } from '../config/firebase';
import { ref, push, get, query, orderByChild, equalTo, remove, set } from 'firebase/database';

export interface SavedUpload {
  id: string;
  userId: string;
  customerName: string;
  bank: string;
  dateRange: {
    start: string;
    end: string;
  };
  uploadDate: string;
  originalResponse: unknown;
}

export interface UploadSummary {
  id: string;
  customerName: string;
  bank: string;
  dateRange: string;
  uploadDate: string;
  transactionCount: number;
  isLinked: boolean;
  linkedCount?: number;
}

// Test Firebase connectivity
export const testFirebaseConnection = async (userId: string): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    // Test with a user-specific path that should have write permissions
    const testRef = ref(database, `users/${userId}/test`);
    await set(testRef, { timestamp: new Date().toISOString(), test: true });
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Save upload data to Firebase
export const saveUpload = async (
  userId: string,
  customerName: string,
  bank: string,
  dateRange: { start: string; end: string },
  originalResponse: unknown,
): Promise<string> => {
  try {
    console.log('saveUpload called with:', {
      userId,
      customerName,
      bank,
      dateRange,
      originalResponseType: typeof originalResponse,
      originalResponseKeys:
        originalResponse && typeof originalResponse === 'object'
          ? Object.keys(originalResponse)
          : 'not an object',
    });

    const uploadData = {
      userId,
      customerName,
      bank,
      dateRange,
      uploadDate: new Date().toISOString(),
      originalResponse,
    };

    console.log('Upload data prepared:', uploadData);

    console.log('Pushing to Firebase database...');
    const uploadRef = ref(database, 'uploads');
    const newUploadRef = push(uploadRef, uploadData);

    const uploadId = newUploadRef.key!;
    console.log('Upload pushed to Firebase with ID:', uploadId);

    console.log('Upload save completed successfully');
    return uploadId;
  } catch (error) {
    console.error('Error saving upload:', error);
    throw error;
  }
};

// Get all uploads for a user
export const getUserUploads = async (userId: string): Promise<UploadSummary[]> => {
  try {
    const uploadsRef = ref(database, 'uploads');
    const userUploadsQuery = query(uploadsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userUploadsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const uploads: UploadSummary[] = [];
    const uploadsData = snapshot.val();

    // Process each upload individually (no grouping)
    Object.entries(uploadsData).forEach(([id, upload]: [string, unknown]) => {
      const uploadData = upload as {
        customerName: string;
        uploadDate: string;
        originalResponse?: unknown;
        bank?: string;
        dateRange?: { start: string; end: string };
      };

      const transactionCount = (() => {
        if (!uploadData.originalResponse || typeof uploadData.originalResponse !== 'object')
          return 0;

        const response = uploadData.originalResponse as {
          transactions?: unknown[];
          results?: Array<{ transactions?: unknown[] }>;
        };

        if (response.transactions && Array.isArray(response.transactions)) {
          return response.transactions.length;
        }

        if (response.results && Array.isArray(response.results)) {
          return response.results.reduce(
            (total: number, result) => total + (result.transactions?.length || 0),
            0,
          );
        }

        return 0;
      })();

      uploads.push({
        id,
        customerName: uploadData.customerName,
        bank: uploadData.bank || 'Unknown Bank',
        dateRange: uploadData.dateRange
          ? (() => {
              try {
                const start = new Date(uploadData.dateRange.start);
                const end = new Date(uploadData.dateRange.end);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                  return 'Invalid Date Range';
                }
                return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
              } catch {
                return 'Invalid Date Range';
              }
            })()
          : 'Unknown Date Range',
        uploadDate: new Date(uploadData.uploadDate).toLocaleDateString(),
        transactionCount,
        isLinked: false, // No more linking
        linkedCount: undefined,
      });
    });

    // Sort by upload date (newest first)
    return uploads.sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(),
    );
  } catch (error) {
    console.error('Error getting user uploads:', error);
    throw error;
  }
};

// Get a specific upload by ID
export const getUploadById = async (uploadId: string): Promise<SavedUpload | null> => {
  try {
    const uploadRef = ref(database, `uploads/${uploadId}`);
    const snapshot = await get(uploadRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { id: uploadId, ...snapshot.val() };
  } catch (error) {
    console.error('Error getting upload by ID:', error);
    return null;
  }
};

// Delete an upload
export const deleteUpload = async (uploadId: string): Promise<void> => {
  try {
    const uploadRef = ref(database, `uploads/${uploadId}`);
    await remove(uploadRef);
  } catch (error) {
    console.error('Error deleting upload:', error);
    throw error;
  }
};
