import React, { useState } from 'react';
import { Clipboard, ClipboardCheck } from 'lucide-react';

export const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        // Use the document.execCommand fallback for environments where navigator.clipboard might be restricted.
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textArea);
    };

    return (
        <button onClick={handleCopy} className="p-2 rounded-md hover:bg-gray-600 transition-colors">
            {copied ? <ClipboardCheck className="h-5 w-5 text-green-400" /> : <Clipboard className="h-5 w-5" />}
        </button>
    );
};
