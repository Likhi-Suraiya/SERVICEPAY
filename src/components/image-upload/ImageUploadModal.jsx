import { Modal, Button } from 'react-bootstrap';
import { useState, useRef } from 'react';
import { toast } from 'react-toastify';

export const ImageUploadModal = ({ show, onHide, onConfirm, onSkip, item }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onConfirm(selectedFile);  // Pass the file directly
      // Don't call onHide here - let the parent handle it
    } else {
      toast.warning('Please select an image');
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Upload Image for Item: {item?.itemId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <p><strong>Item:</strong> {item?.itemName}</p>
          <p><strong>Code:</strong> {item?.itemId}</p>
          {preview ? (
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} className="mb-3" />
          ) : (
            <div className="border rounded p-5 mb-3">
              <p className="text-muted">No image selected</p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="d-none"
            id="image-input"
          />
          <label htmlFor="image-input" className="btn btn-primary me-2">
            Choose Image
          </label>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onSkip}>
          Skip
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!selectedFile}>
          Upload
        </Button>
      </Modal.Footer>
    </Modal>
  );
};