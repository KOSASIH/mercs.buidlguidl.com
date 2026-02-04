// components/FileShare.js
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileShare = ({ cohortId, userId }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append('files', file));

      const response = await axios.post(`/api/cohorts/${cohortId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { userId },
      });

      setUploadedFiles((prev) => [...prev, ...response.data.files]);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [cohortId, userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*, .pdf, .txt, .js, .py', // Allowed types
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const deleteFile = async (fileId) => {
    try {
      await axios.delete(`/api/cohorts/${cohortId}/files/${fileId}`, { params: { userId } });
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      setError('Delete failed');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl mb-4">File Share</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p>Uploading...</p>
        ) : (
          <p>{isDragActive ? 'Drop files here...' : 'Drag & drop files or click to select'}</p>
        )}
      </div>
      <ul className="mt-4">
        {uploadedFiles.map((file) => (
          <li key={file.id} className="flex justify-between items-center p-2 border-b">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
              {file.name}
            </a>
            <button
              onClick={() => deleteFile(file.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileShare;
