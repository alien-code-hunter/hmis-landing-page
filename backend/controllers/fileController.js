// File: controllers/fileController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises'); // Use fs.promises for async file operations

const uploadDir = path.join(__dirname, '../Uploads');

// Ensure the uploads directory exists asynchronously on server start
// Multer's destination function can also create it, but this ensures it early.
// Using a self-executing async function for a clean startup check.
(async () => {
  try {
    await fs.access(uploadDir);
    console.log(`Upload directory '${uploadDir}' confirmed.`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`Upload directory '${uploadDir}' created.`);
    } else {
      console.error(`Error ensuring upload directory exists: ${err.message}`);
    }
  }
})();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use the pre-defined upload directory
  },
  filename: (req, file, cb) => {
    // Ensure unique filenames (timestamp + random suffix + original extension)
    // Using path.extname to correctly preserve file extension
    cb(null, Date.now() + '_' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

// Multer instance for file uploads
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Max 20MB, adjust as needed
  fileFilter: (req, file, cb) => {
    // Log the MIME type and original filename for debugging
    console.log(`File upload attempt: ${file.originalname}, MIME type: ${file.mimetype}`);

    // Basic file type filtering (expanded to include more common types)
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel.sheet.macroenabled.12', // .xlsm (macro-enabled Excel)
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
      'text/csv', // .csv
      'video/mp4', 'video/webm', 'video/ogg', 'video/mpeg', 'video/avi', // Expanded video types
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', // Expanded audio types
      'application/octet-stream' // Generic fallback for unknown types
    ];

    // Normalize MIME type to lowercase to handle case sensitivity
    const fileMimeType = file.mimetype.toLowerCase();

    if (allowedMimeTypes.includes(fileMimeType)) {
      cb(null, true);
    } else {
      // Include the rejected MIME type in the error message
      cb(new Error(`Invalid file type: ${fileMimeType}. Only images, PDFs, Word, Excel, PowerPoint, Text, CSV, Video, and Audio files are allowed.`), false);
    }
  }
});

// --- Controller Functions ---

// Export the Multer middleware itself so it can be used in routes
exports.uploadMiddleware = upload.single('file');

// 1. Upload a single file handler
// This function will be called AFTER Multer has processed the file (via uploadMiddleware)
exports.uploadFile = async (req, res) => {
  try {
    // req.file will be populated by Multer's upload.single('file') middleware
    if (!req.file) {
      // This case should ideally be caught by Multer's fileFilter or if no file was sent at all
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, filename, mimetype, size } = req.file; // Destructure 'size' from req.file

    // Robust parseJsonArray function to handle null, undefined, or empty strings
    const parseJsonArray = (str) => {
        if (str === null || str === undefined || (typeof str === 'string' && str.trim() === '')) {
            return []; // Handle null, undefined, or empty string by returning an empty array
        }
        try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : []; // Ensure it's an array
        } catch (e) {
            console.error('Error parsing JSON string:', str, e);
            return []; // Return empty array on parse error
        }
    };

    // Parse the JSON strings from frontend back into JavaScript arrays
    const categories = parseJsonArray(req.body.categories);
    const system = parseJsonArray(req.body.system);
    const documentType = parseJsonArray(req.body.documentType);
    const healthType = parseJsonArray(req.body.healthType);

    const pool = req.db; // Access the database pool from req.db

    // Determine uploaded_by_id from session, default to null if not available
    const uploadedById = req.session?.user?.id || null;

    // Insert into files table
    // Now including 'size' and 'uploaded_by' columns
    const result = await pool.query(
      `INSERT INTO files (filename, original_name, mimetype, size, categories, system, document_type, health_type, uploaded_by, upload_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [
        filename,
        originalname,
        mimetype,
        size,
        JSON.stringify(categories), // Explicitly stringify for JSONB column
        JSON.stringify(system),     // Explicitly stringify for JSONB column
        JSON.stringify(documentType), // Explicitly stringify for JSONB column
        JSON.stringify(healthType), // Explicitly stringify for JSONB column
        uploadedById
      ]
    );

    // Audit Log: Ensure req.session.user is available here
    if (req.session?.user) {
      await pool.query(
        `INSERT INTO audit_log (user_id, user_name, action, file_id, details) VALUES ($1, $2, $3, $4, $5)`,
        [req.session.user.id, req.session.user.username, 'upload', result.rows[0].id, `Uploaded file: ${originalname}`]
      );
    } else {
      console.warn('Audit log: User session not found for file upload. Audit entry skipped.');
    }

    res.status(201).json({ message: 'File uploaded successfully.', file: result.rows[0] });

  } catch (error) {
    console.error('File upload error:', error);

    // If an error occurred after file upload but before DB insertion, delete the file
    // Check if req.file exists and if the file was indeed saved to disk before attempting to unlink
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(cleanupErr => {
        console.error(`Error deleting partially uploaded file ${req.file.path}:`, cleanupErr);
      });
    }

    // Handle specific Multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum 20MB allowed.' });
      }
      return res.status(400).json({ message: `Multer error: ${error.message}` });
    }
    // Handle JSON parsing error for categories or other fields
    if (error.message.includes('JSON.parse')) {
        return res.status(400).json({ message: 'Invalid data format for one or more fields (e.g., categories, system, etc.). Please ensure they are valid JSON arrays.' });
    }

    // Generic error for other issues, including database errors
    res.status(500).json({ message: 'An unexpected error occurred during file upload. Please try again.', error: error.message });
  }
};

// Helper function to map MIME types to human-readable names
const getFriendlyMimeTypeName = (mimetype) => {
  switch (mimetype) {
    case 'application/pdf':
      return 'PDF File';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word Document';
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/png':
    case 'image/gif':
    case 'image/bmp':
    case 'image/webp':
      return 'Image File';
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel.sheet.macroenabled.12':
      return 'Excel Spreadsheet';
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'PowerPoint Presentation';
    case 'text/plain':
      return 'Text File';
    case 'text/csv':
      return 'CSV File';
    case 'video/mp4':
    case 'video/webm':
    case 'video/ogg':
    case 'video/mpeg':
    case 'video/avi':
      return 'Video File';
    case 'audio/mpeg':
    case 'audio/wav':
    case 'audio/ogg':
    case 'audio/mp3':
      return 'Audio File';
    case 'application/octet-stream':
      return 'Generic File';
    default:
      return mimetype || 'Unknown Type'; // Fallback to raw mimetype if not mapped
  }
};

// 2. Get a list of files
exports.listFiles = async (req, res) => {
  try {
    const pool = req.db;
    // Added system, documentType, healthType, and mimetypes to query parameters for filtering
    const { search = '', categories = '', system = '', documentType = '', healthType = '', mimetypes = '', page = 1, limit = 10, sortBy = 'upload_date', sortOrder = 'desc' } = req.query;

    const queryParams = [];
    let whereClause = '';
    let paramIndex = 1;

    // Helper to append conditions
    const appendCondition = (condition) => {
      if (whereClause) {
        whereClause += ' AND ';
      } else {
        whereClause += 'WHERE ';
      }
      whereClause += condition;
    };

    // Search by original_name or filename (case-insensitive)
    if (search) {
      appendCondition(`(original_name ILIKE $${paramIndex} OR filename ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by categories (using JSONB contains operator @>)
    if (categories) {
      const categoryArray = categories.split(',').map(s => s.trim()).filter(s => s !== '');
      if (categoryArray.length > 0) {
        appendCondition(`categories @> $${paramIndex}::jsonb`);
        queryParams.push(JSON.stringify(categoryArray)); // Pass as JSON string for JSONB operator
        paramIndex++;
      }
    }
    // Filter by system
    if (system) {
      const systemArray = system.split(',').map(s => s.trim()).filter(s => s !== '');
      if (systemArray.length > 0) {
        appendCondition(`system @> $${paramIndex}::jsonb`);
        queryParams.push(JSON.stringify(systemArray));
        paramIndex++;
      }
    }
    // Filter by documentType
    if (documentType) {
      const docTypeArray = documentType.split(',').map(s => s.trim()).filter(s => s !== '');
      if (docTypeArray.length > 0) {
        appendCondition(`document_type @> $${paramIndex}::jsonb`);
        queryParams.push(JSON.stringify(docTypeArray));
        paramIndex++;
      }
    }
    // Filter by healthType
    if (healthType) {
      const healthTypeArray = healthType.split(',').map(s => s.trim()).filter(s => s !== '');
      if (healthTypeArray.length > 0) {
        appendCondition(`health_type @> $${paramIndex}::jsonb`);
        queryParams.push(JSON.stringify(healthTypeArray));
        paramIndex++;
      }
    }
    // Filter by mimetypes (using ANY operator for array containment)
    if (mimetypes) {
      const mimeTypeArray = mimetypes.split(',').map(s => s.trim()).filter(s => s !== '');
      if (mimeTypeArray.length > 0) {
        appendCondition(`mimetype = ANY($${paramIndex}::text[])`);
        queryParams.push(mimeTypeArray); // Pass as an array of strings
        paramIndex++;
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    queryParams.push(parseInt(limit), offset); // Add limit and offset params

    // Ensure all columns are selected if they exist in DB
    const filesQuery = `
      SELECT id, original_name, filename, mimetype, size, categories, system, document_type, health_type, uploaded_by, upload_date
      FROM files
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    // Query for total count for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM files
      ${whereClause}`;

    const [filesResult, countResult] = await Promise.all([
      pool.query(filesQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, queryParams.length - 2)) // Remove limit and offset for count query
    ]);

    const totalFiles = parseInt(countResult.rows[0].total);
    // Map mimetypes to friendly names before sending
    const files = filesResult.rows.map(file => ({
      ...file,
      mimetype: getFriendlyMimeTypeName(file.mimetype) // Apply the mapping here
    }));
    
    const totalPages = Math.ceil(totalFiles / parseInt(limit));

    res.status(200).json({
      files,
      pagination: {
        totalFiles,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ message: 'Failed to retrieve files.', error: error.message });
  }
};

// 3. Download a specific file
exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const pool = req.db;

    const result = await pool.query(
      `SELECT filename, original_name FROM files WHERE id = $1`, // CORRECTED TABLE NAME
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const file = result.rows[0];
    const filePath = path.join(uploadDir, file.filename);

    // Check if the file physically exists before attempting to send
    await fs.access(filePath);

    res.download(filePath, file.original_name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        // Handle cases where file might be missing on disk despite DB record
        if (err.code === 'ENOENT') {
          return res.status(404).json({ message: 'File not found on server disk.' });
        }
        res.status(500).json({ message: 'Failed to download file.' });
      }
    });

  } catch (error) {
    console.error('Error in downloadFile:', error);
    res.status(500).json({ message: 'An error occurred while preparing download.', error: error.message });
  }
};

// 4. Update file metadata (original_name, categories, system, documentType, healthType)
exports.updateFileMetadata = async (req, res) => {
  try {
    const fileId = req.params.id;
    const { original_name, categories, system, documentType, healthType } = req.body; // Expecting arrays or JSON strings

    const pool = req.db;

    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;

    if (original_name !== undefined) {
      updateFields.push(`original_name = $${paramIndex}`);
      queryParams.push(original_name);
      paramIndex++;
    }

    // Helper to handle array/JSON string parsing for update
    const processArrayField = (fieldValue, fieldName) => {
        let processedArray;
        if (fieldValue === undefined) return null; // No update for this field

        if (typeof fieldValue === 'string') {
            try {
                processedArray = JSON.parse(fieldValue);
                if (!Array.isArray(processedArray)) {
                    throw new Error(`${fieldName} must be a JSON array string.`);
                }
            } catch (e) {
                throw new Error(`Invalid ${fieldName} format. Must be a JSON array string. Error: ${e.message}`);
            }
        } else if (Array.isArray(fieldValue)) {
            processedArray = fieldValue;
        } else {
            throw new Error(`Invalid ${fieldName} format. Must be a JSON array string or direct array.`);
        }
        return processedArray;
    };

    try {
        const processedCategories = processArrayField(categories, 'categories');
        if (processedCategories !== null) {
            updateFields.push(`categories = $${paramIndex}`);
            queryParams.push(JSON.stringify(processedCategories)); // Explicitly stringify for JSONB
            paramIndex++;
        }

        const processedSystem = processArrayField(system, 'system');
        if (processedSystem !== null) {
            updateFields.push(`system = $${paramIndex}`);
            queryParams.push(JSON.stringify(processedSystem)); // Explicitly stringify for JSONB
            paramIndex++;
        }

        const processedDocumentType = processArrayField(documentType, 'document_type');
        if (processedDocumentType !== null) {
            updateFields.push(`document_type = $${paramIndex}`);
            queryParams.push(JSON.stringify(processedDocumentType)); // Explicitly stringify for JSONB
            paramIndex++;
        }

        const processedHealthType = processArrayField(healthType, 'health_type');
        if (processedHealthType !== null) {
            updateFields.push(`health_type = $${paramIndex}`);
            queryParams.push(JSON.stringify(healthType)); // Explicitly stringify for JSONB
            paramIndex++;
        }

    } catch (parseError) {
        return res.status(400).json({ message: parseError.message });
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update.' });
    }

    queryParams.push(fileId); // Add fileId as the last parameter

    const updateQuery = `
      UPDATE files
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *`;

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found or could not be updated.' });
    }

    // Audit Log
    if (req.session?.user) {
        await pool.query(
            `INSERT INTO audit_log (user_id, user_name, action, file_id, details) VALUES ($1, $2, $3, $4, $5)`,
            [req.session.user.id, req.session.user.username, 'edit', fileId, `Updated file metadata for ID: ${fileId}`]
        );
    }

    res.status(200).json({ message: 'File metadata updated successfully.', file: result.rows[0] });

  } catch (error) {
    console.error('Error updating file metadata:', error);
    res.status(500).json({ message: 'Failed to update file metadata.', error: error.message });
  }
};

// 5. Delete a file (physical deletion as per your original code)
exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const pool = req.db;

    const { rows } = await pool.query('SELECT filename FROM files WHERE id = $1', [fileId]); // CORRECTED TABLE NAME
    if (!rows.length) return res.status(404).json({ message: 'File not found.' });

    const fileToDeleteName = rows[0].filename;
    const filePath = path.join(uploadDir, fileToDeleteName);

    // Physically delete the file from disk
    // Use fs.promises.access to check existence, then unlink
    try {
        await fs.access(filePath); // Check if file exists
        await fs.unlink(filePath); // Delete the file
        console.log(`Physically deleted file: ${filePath}`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.warn(`File ${filePath} not found on disk, but attempting to remove DB entry.`);
        } else {
            console.error(`Error physically deleting file ${filePath}:`, err);
            // Optionally, you might want to return an error if physical deletion fails
            // return res.status(500).json({ message: 'Failed to physically delete file.', error: err.message });
        }
    }

    // Delete record from database
    const deleteResult = await pool.query('DELETE FROM files WHERE id = $1 RETURNING id', [fileId]); // CORRECTED TABLE NAME

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'File not found in database or already deleted.' });
    }

    // Audit Log
    if (req.session?.user) {
      await pool.query(
        `INSERT INTO audit_log (user_id, user_name, action, file_id, details) VALUES ($1, $2, $3, $4, $5)`,
        [req.session.user.id, req.session.user.username, 'delete', fileId, `Deleted file ID: ${fileId}`]
      );
    }

    res.status(200).json({ message: 'File deleted successfully.' });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file.', error: error.message });
  }
};

// 6. Get Audit Logs (from your existing fileRoutes.js)
exports.getAuditLogs = async (req, res) => {
  try {
    const pool = req.db;
    const result = await pool.query('SELECT * FROM audit_log ORDER BY timestamp DESC');
    res.json({ logs: result.rows });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
};