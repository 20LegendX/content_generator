import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GeneratedContentModal({ isOpen, onClose, content }) {
    if (!isOpen || !content) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative min-h-screen"
                >
                    <div
                        dangerouslySetInnerHTML={{ __html: content.preview_html }}
                    />
                    <button
                        onClick={onClose}
                        className="fixed top-4 right-4 text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
                    >
                        Close
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}