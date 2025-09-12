import { database } from '../config/firebase';
import { ref, push, get, query, orderByChild, equalTo, remove } from 'firebase/database';

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
  linkedUploads?: string[]; // Array of upload IDs for same customer on same day
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

// Save upload data to Firebase
export const saveUpload = async (
  userId: string,
  customerName: string,
  bank: string,
  dateRange: { start: string; end: string },
  originalResponse: unknown,
): Promise<string> => {
  try {
    const uploadData = {
      userId,
      customerName,
      bank,
      dateRange,
      uploadDate: new Date().toISOString(),
      originalResponse,
      linkedUploads: [] as string[],
    };

    // Check for existing uploads for same customer on same day
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const existingUploads = await getUploadsByCustomerAndDate(userId, customerName, today);

    if (existingUploads.length > 0) {
      // Link this upload with existing ones
      const linkedIds = existingUploads.map((upload) => upload.id);
      uploadData.linkedUploads = linkedIds;

      // Update existing uploads to include this new one
      for (const existingUpload of existingUploads) {
        const existingRef = ref(database, `uploads/${existingUpload.id}`);
        const updatedLinkedUploads = [...(existingUpload.linkedUploads || []), 'pending'];
        await push(existingRef, { linkedUploads: updatedLinkedUploads });
      }
    }

    const uploadRef = ref(database, 'uploads');
    const newUploadRef = push(uploadRef, uploadData);

    const uploadId = newUploadRef.key!;

    // Update linked uploads with the actual ID
    if (existingUploads.length > 0) {
      for (const existingUpload of existingUploads) {
        const existingRef = ref(database, `uploads/${existingUpload.id}/linkedUploads`);
        push(existingRef, uploadId);
      }
    }

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

    // Group uploads by customer and date for linking
    const groupedUploads: {
      [key: string]: Array<{
        id: string;
        customerName: string;
        uploadDate: string;
        originalResponse?: unknown;
        bank?: string;
        dateRange?: { start: string; end: string };
      }>;
    } = {};

    Object.entries(uploadsData).forEach(([id, upload]: [string, unknown]) => {
      const uploadData = upload as {
        customerName: string;
        uploadDate: string;
        originalResponse?: unknown;
        bank?: string;
        dateRange?: { start: string; end: string };
      };
      const uploadDate = new Date(uploadData.uploadDate).toISOString().split('T')[0];
      const groupKey = `${uploadData.customerName}_${uploadDate}`;

      if (!groupedUploads[groupKey]) {
        groupedUploads[groupKey] = [];
      }
      groupedUploads[groupKey].push({ id, ...uploadData });
    });

    // Process grouped uploads
    Object.values(groupedUploads).forEach((group) => {
      const isLinked = group.length > 1;

      group.forEach((upload) => {
        const transactionCount = (() => {
          if (!upload.originalResponse || typeof upload.originalResponse !== 'object') return 0;

          const response = upload.originalResponse as {
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
          id: upload.id,
          customerName: upload.customerName,
          bank: upload.bank || 'Unknown Bank',
          dateRange: upload.dateRange
            ? `${upload.dateRange.start} to ${upload.dateRange.end}`
            : 'Unknown Date Range',
          uploadDate: new Date(upload.uploadDate).toLocaleDateString(),
          transactionCount,
          isLinked,
          linkedCount: isLinked ? group.length : undefined,
        });
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

// Get uploads by customer and date
const getUploadsByCustomerAndDate = async (
  userId: string,
  customerName: string,
  date: string,
): Promise<SavedUpload[]> => {
  try {
    const uploadsRef = ref(database, 'uploads');
    const userUploadsQuery = query(uploadsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userUploadsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const uploads: SavedUpload[] = [];
    const uploadsData = snapshot.val();

    Object.entries(uploadsData).forEach(([id, upload]: [string, unknown]) => {
      const uploadData = upload as {
        customerName: string;
        uploadDate: string;
        userId: string;
        bank: string;
        dateRange: { start: string; end: string };
        originalResponse: unknown;
      };
      const uploadDate = new Date(uploadData.uploadDate).toISOString().split('T')[0];
      if (uploadData.customerName === customerName && uploadDate === date) {
        uploads.push({ id, ...uploadData });
      }
    });

    return uploads;
  } catch (error) {
    console.error('Error getting uploads by customer and date:', error);
    return [];
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

// Get linked uploads for a specific upload
export const getLinkedUploads = async (uploadId: string): Promise<SavedUpload[]> => {
  try {
    const upload = await getUploadById(uploadId);
    if (!upload || !upload.linkedUploads || upload.linkedUploads.length === 0) {
      return [];
    }

    const linkedUploads: SavedUpload[] = [];
    for (const linkedId of upload.linkedUploads) {
      const linkedUpload = await getUploadById(linkedId);
      if (linkedUpload) {
        linkedUploads.push(linkedUpload);
      }
    }

    return linkedUploads;
  } catch (error) {
    console.error('Error getting linked uploads:', error);
    return [];
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
