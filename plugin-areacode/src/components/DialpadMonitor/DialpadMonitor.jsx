import React, { useEffect, useState } from 'react';
import { Manager } from '@twilio/flex-ui';
import areaCodeDialerService from '../../services/AreaCodeDialerService';

const DialpadMonitor = () => {
    const [manager] = useState(() => Manager.getInstance());
    const [lastDestination, setLastDestination] = useState(null);

    useEffect(() => {
        let intervalId;

        // Monitor dialpad input changes
        const monitorDialpad = () => {
            const state = manager.store.getState();
            const phoneState = state.flex?.phone;

            console.log('=== DIALPAD MONITOR CHECK ===');
            console.log('Full phone state:', phoneState);

            if (phoneState) {
                // Check different possible locations for the destination number
                const possibleDestinations = [
                    phoneState.call?.to,
                    phoneState.dialpadInputValue,
                    phoneState.outboundCallNumber,
                    phoneState.destination,
                    phoneState.number,
                    phoneState.targetNumber
                ];

                console.log('Checking possible destinations:', possibleDestinations);

                const currentDestination = possibleDestinations.find(dest => dest && dest.length >= 10);

                console.log('Current destination found:', currentDestination);
                console.log('Last destination was:', lastDestination);

                if (currentDestination && currentDestination !== lastDestination) {
                    console.log('🔥 DESTINATION CHANGED:', currentDestination);
                    setLastDestination(currentDestination);

                    // Extract area code and get recommendation
                    const areaCode = areaCodeDialerService.extractAreaCode(currentDestination);
                    console.log('Extracted area code:', areaCode);

                    if (areaCode && areaCode.length === 3) {
                        console.log('🎯 AUTO-TRIGGERING CALLER ID LOOKUP for area code:', areaCode);
                        areaCodeDialerService.handleOutboundCall(currentDestination);
                    } else {
                        console.log('❌ Invalid area code extracted:', areaCode);
                    }
                }
            } else {
                console.log('❌ No phone state available');
            }
            console.log('=== END DIALPAD MONITOR CHECK ===');
        };

        // Poll for dialpad changes every 500ms
        intervalId = setInterval(monitorDialpad, 500);

        // Also listen for store changes
        const unsubscribe = manager.store.subscribe(() => {
            monitorDialpad();
        });

        // Listen for specific actions that might indicate dialpad usage
        const handleAction = (action) => {
            console.log('Flex action dispatched:', action.type, action.payload);

            if (action.type.includes('PHONE') || action.type.includes('DIAL') || action.type.includes('CALL')) {
                setTimeout(monitorDialpad, 100); // Small delay to let state update
            }
        };

        // Intercept store dispatch to catch all actions
        const originalDispatch = manager.store.dispatch;
        manager.store.dispatch = (action) => {
            handleAction(action);
            return originalDispatch(action);
        };

        return () => {
            clearInterval(intervalId);
            unsubscribe();
            manager.store.dispatch = originalDispatch;
        };
    }, [manager, lastDestination]);

    // This component doesn't render anything visible
    return null;
};

export default DialpadMonitor;
