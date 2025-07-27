import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center text-lg">
        <Loader2 className="animate-spin h-5 w-5 mr-3" />
        {text}
    </div>
);
