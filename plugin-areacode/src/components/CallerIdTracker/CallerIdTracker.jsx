import React, { useState, useEffect } from 'react';
import { Manager } from '@twilio/flex-ui';

const CallerIdTracker = () => {
    const [currentCallerId, setCurrentCallerId] = useState('Not set');
    const [lastCall, setLastCall] = useState(null);
    const [voiceConfig, setVoiceConfig] = useState(null);

    useEffect(() => {
        const manager = Manager.getInstance();

        // Check initial voice configuration
        if (manager.configuration?.voice) {
            setVoiceConfig(manager.configuration.voice);
        }

        // Monitor store changes for call events
        const unsubscribe = manager.store.subscribe(() => {
            const state = manager.store.getState();

            // Check phone state
            if (state.flex?.phone?.call) {
                const call = state.flex.phone.call;
                setLastCall({
                    to: call.to,
                    from: call.from,
                    status: call.status
                });
            }

            // Check worker state
            if (state.flex?.worker?.activity) {
                const activity = state.flex.worker.activity;
                console.log('🎭 Worker activity:', activity);
            }

            // Check plugin state
            if (state.areaCodePlugin) {
                const pluginState = state.areaCodePlugin;
                if (pluginState.pendingCallerId) {
                    setCurrentCallerId(pluginState.pendingCallerId);
                }
            }
        });

        // Check for Twilio Device and monitor its state
        const checkDevice = () => {
            const device = manager.voiceClient?.device;
            if (device) {
                console.log('📱 Twilio Device found:', device);

                device.on('connect', (call) => {
                    console.log('📞 Device connected:', call);
                    setLastCall({
                        to: call.parameters?.To,
                        from: call.parameters?.From,
                        status: 'connected'
                    });
                });

                device.on('disconnect', () => {
                    console.log('📴 Device disconnected');
                    setLastCall(null);
                });
            } else {
                setTimeout(checkDevice, 1000);
            }
        };

        checkDevice();

        return unsubscribe;
    }, []);

    const style = {
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#fff',
        border: '2px solid #0073e6',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 9999,
        fontSize: '12px',
        fontFamily: 'monospace',
        minWidth: '300px'
    };

    return (
        <div style={style}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0073e6' }}>Caller ID Tracker</h4>

            <div style={{ marginBottom: '8px' }}>
                <strong>Current Caller ID:</strong> {currentCallerId}
            </div>

            {lastCall && (
                <div style={{ marginBottom: '8px' }}>
                    <strong>Last Call:</strong><br />
                    To: {lastCall.to}<br />
                    From: {lastCall.from}<br />
                    Status: {lastCall.status}
                </div>
            )}

            {voiceConfig && (
                <div style={{ marginBottom: '8px' }}>
                    <strong>Voice Config:</strong><br />
                    Default: {voiceConfig.defaultCallerId || 'None'}<br />
                    Outbound: {voiceConfig.outboundCallerId || 'None'}
                </div>
            )}

            <div style={{ fontSize: '10px', color: '#666' }}>
                Check browser console for detailed logs
            </div>
        </div>
    );
};

export default CallerIdTracker;
