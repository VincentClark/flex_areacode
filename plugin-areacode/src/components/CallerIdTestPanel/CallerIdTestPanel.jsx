import React, { useState } from 'react';
import { Manager } from '@twilio/flex-ui';
import areaCodeDialerService from '../../services/AreaCodeDialerService';
import flexCallerIdOverride from '../../services/FlexCallerIdOverride';

const CallerIdTestPanel = () => {
    const [testNumber, setTestNumber] = useState('7343851234');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null);

    // Update status periodically
    React.useEffect(() => {
        const updateStatus = () => {
            const currentStatus = flexCallerIdOverride.getStatus();
            setStatus(currentStatus);
        };

        updateStatus();
        const interval = setInterval(updateStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const forceCallerIdOverride = () => {
        const testCallerId = '+17345551234';

        console.log('🚨 FORCE OVERRIDE: Setting caller ID to', testCallerId);

        // Use the new aggressive override service
        flexCallerIdOverride.setOverrideCallerId(testCallerId);

        // Also set in Redux store for compatibility
        const manager = Manager.getInstance();
        manager.store.dispatch({
            type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
            payload: { callerId: testCallerId }
        });

        // Try to override configuration as backup
        if (manager.configuration?.voice) {
            manager.configuration.voice.defaultCallerId = testCallerId;
            manager.configuration.voice.outboundCallerId = testCallerId;
            console.log('✅ Voice configuration forcefully updated');
        }

        // Update UI
        setResult({
            recommendedCallerId: testCallerId,
            forced: true,
            message: 'Caller ID set with AGGRESSIVE override - make call NOW!'
        });
    };

    const runDiagnostics = () => {
        console.log('🔍 RUNNING CALLER ID DIAGNOSTICS...');

        // Test the override service
        flexCallerIdOverride.testOverride();

        // Log current status
        const diagnostics = flexCallerIdOverride.getStatus();
        console.log('📊 Override Service Status:', diagnostics);

        // Update UI
        setResult({
            diagnostics: true,
            status: diagnostics,
            message: 'Check console for detailed diagnostics'
        });
    };

    const style = {
        background: '#fff',
        border: '2px solid #dc3545',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 2px 10px rgba(220, 53, 69, 0.2)',
        fontSize: '11px',
        fontFamily: 'monospace',
        width: '100%',
        maxWidth: '300px',
        margin: '10px 0'
    };

    return (
        <div style={style}>
            <h4 style={{
                margin: '0 0 10px 0',
                color: '#dc3545',
                textAlign: 'center',
                fontSize: '12px'
            }}>
                🚨 CALLER ID TEST
            </h4>

            <button
                onClick={forceCallerIdOverride}
                style={{
                    padding: '8px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: '5px'
                }}
            >
                🚨 FORCE CALLER ID (734)
            </button>

            <button
                onClick={runDiagnostics}
                style={{
                    padding: '6px 10px',
                    background: '#0073e6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: '8px'
                }}
            >
                🔍 RUN DIAGNOSTICS
            </button>

            {status && (
                <div style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '9px',
                    marginBottom: '8px'
                }}>
                    <div><strong>Status:</strong></div>
                    <div>Enabled: {status.isEnabled ? '✅' : '❌'}</div>
                    <div>Device: {status.hasDevice ? '✅' : '❌'}</div>
                    <div>Override: {status.hasOverriddenConnect ? '✅' : '❌'}</div>
                </div>
            )}

            <div style={{ fontSize: '9px', color: '#666', textAlign: 'center' }}>
                Click FORCE, then make call to test
            </div>

            {result && (
                <div style={{
                    background: result.error ? '#ffebee' : '#e8f5e8',
                    border: `1px solid ${result.error ? '#ef5350' : '#4caf50'}`,
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '9px',
                    marginTop: '8px'
                }}>
                    {result.error ? (
                        <div style={{ color: '#c62828' }}>Error: {result.error}</div>
                    ) : result.diagnostics ? (
                        <div>
                            <div><strong>Diagnostics run - check console</strong></div>
                        </div>
                    ) : (
                        <div>
                            <div><strong>Set:</strong> {result.recommendedCallerId}</div>
                            {result.forced && <div style={{ color: '#dc3545' }}><strong>Ready to test!</strong></div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CallerIdTestPanel;