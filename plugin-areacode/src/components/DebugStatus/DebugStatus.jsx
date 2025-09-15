import React, { useState, useEffect } from 'react';

const DebugStatus = () => {
    const [currentCallerId, setCurrentCallerId] = useState('');
    const [lastDialed, setLastDialed] = useState('');

    useEffect(() => {
        // Load current selection
        const saved = localStorage.getItem('selected_caller_id');
        if (saved) {
            setCurrentCallerId(saved);
        }

        // Listen for caller ID changes
        const handleCallerIdChange = (event) => {
            setCurrentCallerId(event.detail.callerId);
        };

        window.addEventListener('callerIdChanged', handleCallerIdChange);

        // Listen for dialpad input changes
        const handleDialpadChange = () => {
            const dialpadInput = document.querySelector('input[data-testid="dialpad-input"]');
            if (dialpadInput) {
                setLastDialed(dialpadInput.value);
            }
        };

        // Check dialpad every 500ms
        const interval = setInterval(handleDialpadChange, 500);

        return () => {
            window.removeEventListener('callerIdChanged', handleCallerIdChange);
            clearInterval(interval);
        };
    }, []);

    if (!currentCallerId) return null;

    return (
        <div style={{
            background: '#F3F4F6',
            border: '2px dashed #6B7280',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '10px',
            fontSize: '12px'
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                🔍 DEBUG STATUS
            </div>
            <div style={{ color: '#059669' }}>
                📞 Caller ID: {currentCallerId}
            </div>
            {lastDialed && (
                <div style={{ color: '#7C3AED' }}>
                    🎯 Target: {lastDialed}
                </div>
            )}
        </div>
    );
};

export default DebugStatus;
