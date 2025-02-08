import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GeneratedContentModal({ isOpen, onClose, content }) {
    if (!isOpen || !content) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto"> 
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative min-h-screen">
                <div className="preview-section" style={{ 
                    backgroundColor: content.raw_content?.theme?.colors?.background || '#ffffff',
                    margin: 0,
                    padding: 0,
                }}>
                    <iframe
                        srcDoc={content.preview_html}
                        style={{
                            width: '100%',
                            height: '100vh',
                            border: 'none',
                        }}
                        title="Modal Preview"
                    />
                </div>
                <button
                    onClick={onClose}
                    className="fixed top-4 right-4 text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                    Close
                </button>
            </div>
        </div>
    );
}