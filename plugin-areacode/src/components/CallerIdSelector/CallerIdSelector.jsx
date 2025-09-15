import React, { useState, useEffect } from 'react';
import { Manager } from '@twilio/flex-ui';

const CallerIdSelector = () => {
    const [availableNumbers, setAvailableNumbers] = useState([]);
    const [selectedCallerId, setSelectedCallerId] = useState('');
    const [manager, setManager] = useState(null);
    const [dialedNumber, setDialedNumber] = useState('');
    const [autoSelectedReason, setAutoSelectedReason] = useState('');

    useEffect(() => {
        const mgr = Manager.getInstance();
        setManager(mgr);

        console.log('📞 CallerIdSelector initializing...');

        // Load your actual phone numbers immediately
        const phoneNumbers = [
            { phoneNumber: '+18053016297', friendlyName: '(805) 301-6297 - Central CA', areaCode: '805', region: 'Central California' },
            { phoneNumber: '+17047039096', friendlyName: '(704) 703-9096 - North Carolina', areaCode: '704', region: 'North Carolina' },
            { phoneNumber: '+16266029805', friendlyName: '(626) 602-9805 - Los Angeles CA', areaCode: '626', region: 'Los Angeles CA' },
            { phoneNumber: '+17342037317', friendlyName: '(734) 203-7317 - Michigan', areaCode: '734', region: 'Michigan' },
            { phoneNumber: '+16263294809', friendlyName: '(626) 329-4809 - Los Angeles CA', areaCode: '626', region: 'Los Angeles CA' },
            { phoneNumber: '+18056693142', friendlyName: '(805) 669-3142 - Central CA', areaCode: '805', region: 'Central California' },
            { phoneNumber: '+16266572197', friendlyName: '(626) 657-2197 - Los Angeles CA', areaCode: '626', region: 'Los Angeles CA' },
            { phoneNumber: '+17047033029', friendlyName: '(704) 703-3029 - North Carolina', areaCode: '704', region: 'North Carolina' },
            { phoneNumber: '+17147350613', friendlyName: '(714) 735-0613 - Orange County CA', areaCode: '714', region: 'Orange County CA' },
            { phoneNumber: '+16598370194', friendlyName: '(659) 837-0194 - Alabama', areaCode: '659', region: 'Alabama' }
        ];

        setAvailableNumbers(phoneNumbers);

        // Area code matching function
        const findClosestAreaCode = (targetAreaCode) => {
            if (!targetAreaCode || targetAreaCode.length !== 3) {
                return null;
            }

            console.log('🔍 Finding closest area code for:', targetAreaCode);

            // First, try exact match
            const exactMatch = phoneNumbers.find(num => num.areaCode === targetAreaCode);
            if (exactMatch) {
                console.log('✅ Exact area code match found:', exactMatch.friendlyName);
                return { number: exactMatch, reason: `Exact match for ${targetAreaCode} area code` };
            }

            // Geographic proximity mapping for area codes
            const areaCodeProximity = {
                // California area codes - geographically close
                '626': ['714', '805'], // LA area -> Orange County, Central CA
                '714': ['626', '805'], // Orange County -> LA area, Central CA  
                '805': ['626', '714'], // Central CA -> LA area, Orange County

                // North Carolina
                '704': ['734'], // NC -> Michigan (no other close matches)

                // Michigan  
                '734': ['704'], // Michigan -> NC (no other close matches)

                // Alabama
                '659': ['704', '734'], // Alabama -> NC, Michigan (southeastern preference)

                // Common CA area codes that might be dialed
                '213': ['626', '714'], // Downtown LA -> LA area, Orange County
                '310': ['626', '714'], // West LA -> LA area, Orange County
                '323': ['626', '714'], // Central LA -> LA area, Orange County
                '818': ['626', '805'], // San Fernando Valley -> LA area, Central CA
                '949': ['714', '626'], // South Orange County -> Orange County, LA area
                '562': ['626', '714'], // Long Beach -> LA area, Orange County

                // Michigan area codes  
                '313': ['734'], // Detroit -> Michigan
                '248': ['734'], // Oakland County -> Michigan
                '586': ['734'], // Macomb County -> Michigan

                // North Carolina area codes
                '919': ['704'], // Raleigh -> Charlotte area
                '910': ['704'], // Fayetteville -> Charlotte area
                '828': ['704'], // Asheville -> Charlotte area
                '252': ['704'], // Eastern NC -> Charlotte area

                // Alabama area codes
                '205': ['659'], // Birmingham -> Alabama
                '251': ['659'], // Mobile -> Alabama
                '256': ['659'], // Huntsville -> Alabama
                '334': ['659'], // Montgomery -> Alabama
            };

            // Check for proximity matches
            const proximityList = areaCodeProximity[targetAreaCode];
            if (proximityList) {
                for (const proximateCode of proximityList) {
                    const proximateMatch = phoneNumbers.find(num => num.areaCode === proximateCode);
                    if (proximateMatch) {
                        console.log(`🎯 Geographic proximity match: ${targetAreaCode} -> ${proximateCode}`);
                        return {
                            number: proximateMatch,
                            reason: `Geographic match: ${targetAreaCode} is close to ${proximateCode} (${proximateMatch.region})`
                        };
                    }
                }
            }

            // Fallback: Default to 626 (LA area) as it's most versatile
            const fallback = phoneNumbers.find(num => num.areaCode === '626');
            console.log('🔄 Using fallback caller ID for area code:', targetAreaCode);
            return {
                number: fallback,
                reason: `No close match for ${targetAreaCode}, using default LA number`
            };
        };

        // Load saved selection or default to first number
        const saved = localStorage.getItem('selected_caller_id');
        if (saved) {
            setSelectedCallerId(saved);
            console.log('📞 Restored saved caller ID:', saved);
        } else {
            setSelectedCallerId(phoneNumbers[0].phoneNumber);
            console.log('📞 Using default caller ID:', phoneNumbers[0].phoneNumber);
        }

        console.log('📞 Available numbers loaded:', phoneNumbers.length);

        // Listen for dialpad input changes
        const handleDialpadChange = (inputValue) => {
            setDialedNumber(inputValue);

            // Extract area code from the input (first 3 digits after country code)
            const cleanNumber = inputValue.replace(/\D/g, ''); // Remove non-digits
            let areaCode = '';

            if (cleanNumber.length >= 3) {
                if (cleanNumber.startsWith('1') && cleanNumber.length >= 4) {
                    // US number with country code
                    areaCode = cleanNumber.substring(1, 4);
                } else if (cleanNumber.length >= 3) {
                    // Assume it's a US number without country code
                    areaCode = cleanNumber.substring(0, 3);
                }

                if (areaCode.length === 3) {
                    console.log('🎯 Detected area code:', areaCode, 'from input:', inputValue);

                    const match = findClosestAreaCode(areaCode);
                    if (match && match.number) {
                        setSelectedCallerId(match.number.phoneNumber);
                        setAutoSelectedReason(match.reason);

                        // Save to localStorage
                        localStorage.setItem('selected_caller_id', match.number.phoneNumber);

                        console.log('🚀 Auto-selected caller ID:', match.number.friendlyName);
                        console.log('📍 Reason:', match.reason);

                        // Update Redux store
                        if (manager && manager.store) {
                            manager.store.dispatch({
                                type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
                                payload: { callerId: match.number.phoneNumber }
                            });
                        }

                        // Dispatch custom event
                        window.dispatchEvent(new CustomEvent('callerIdChanged', {
                            detail: {
                                callerId: match.number.phoneNumber,
                                autoSelected: true,
                                reason: match.reason,
                                targetAreaCode: areaCode
                            }
                        }));

                        // Update Flex configuration
                        if (manager?.configuration?.voice) {
                            manager.configuration.voice.defaultCallerId = match.number.phoneNumber;
                        }
                    }
                }
            }
        };

        // Monitor dialpad input using MutationObserver to watch for input changes
        const observeDialpadInput = () => {
            // Look for dialpad input field
            const checkForDialpad = () => {
                const dialpadInput = document.querySelector('input[data-testid="dialpad-input"]') ||
                    document.querySelector('input[placeholder*="phone"]') ||
                    document.querySelector('input[type="tel"]') ||
                    document.querySelector('.Twilio-OutboundDialerPanel input');

                if (dialpadInput) {
                    console.log('📱 Found dialpad input, monitoring for area code matching...');

                    // Add event listener for input changes
                    dialpadInput.addEventListener('input', (e) => {
                        handleDialpadChange(e.target.value);
                    });

                    dialpadInput.addEventListener('keyup', (e) => {
                        handleDialpadChange(e.target.value);
                    });

                    dialpadInput.addEventListener('paste', (e) => {
                        setTimeout(() => handleDialpadChange(e.target.value), 100);
                    });

                    return true;
                }
                return false;
            };

            // Try to find dialpad immediately
            if (!checkForDialpad()) {
                // If not found, observe DOM changes
                const observer = new MutationObserver(() => {
                    if (checkForDialpad()) {
                        observer.disconnect();
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Cleanup observer after 30 seconds
                setTimeout(() => observer.disconnect(), 30000);
            }
        };

        // Start monitoring dialpad after a short delay
        setTimeout(observeDialpadInput, 1000);
    }, []);

    const handleCallerIdChange = (e) => {
        const newCallerId = e.target.value;
        setSelectedCallerId(newCallerId);

        // Save to localStorage for persistence
        localStorage.setItem('selected_caller_id', newCallerId);

        console.log('✅ Manual Caller ID selected:', newCallerId);

        // Store in Redux for the plugin to access
        if (manager && manager.store) {
            manager.store.dispatch({
                type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
                payload: { callerId: newCallerId }
            });
        }

        // Also notify any listening components
        window.dispatchEvent(new CustomEvent('callerIdChanged', {
            detail: { callerId: newCallerId }
        }));

        // Try to update Flex configuration
        if (manager?.configuration?.voice) {
            manager.configuration.voice.defaultCallerId = newCallerId;
            console.log('🔧 Updated Flex voice configuration with caller ID:', newCallerId);
        }
    };

    const getCurrentSelection = () => {
        const selected = availableNumbers.find(num => num.phoneNumber === selectedCallerId);
        return selected ? selected.friendlyName : selectedCallerId;
    };

    if (availableNumbers.length === 0) {
        return (
            <div style={{
                background: '#FEF3C7',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '2px solid #F59E0B'
            }}>
                <div style={{ color: '#92400E', fontSize: '14px', fontWeight: 'bold' }}>
                    Loading caller ID options...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '3px solid #4F46E5',
            boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)'
        }}>
            <div style={{
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                📞 DIALPAD CALLER ID SELECTOR
                <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'normal',
                    letterSpacing: '0.5px'
                }}>
                    DEBUG MODE
                </span>
            </div>

            <select
                value={selectedCallerId}
                onChange={handleCallerIdChange}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '3px solid white',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: 'white',
                    color: '#1f2937',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <option value="">Choose your outbound number...</option>
                {availableNumbers.map((number) => (
                    <option key={number.phoneNumber} value={number.phoneNumber}>
                        {number.friendlyName}
                    </option>
                ))}
            </select>

            {selectedCallerId && (
                <div style={{
                    color: 'white',
                    fontSize: '14px',
                    marginTop: '10px',
                    background: 'rgba(34, 197, 94, 0.3)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(34, 197, 94, 0.5)'
                }}>
                    ✅ ACTIVE: {getCurrentSelection()}
                </div>
            )}

            {autoSelectedReason && (
                <div style={{
                    color: 'white',
                    fontSize: '12px',
                    marginTop: '8px',
                    background: 'rgba(59, 130, 246, 0.3)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    fontWeight: '500'
                }}>
                    🤖 AUTO-SELECTED: {autoSelectedReason}
                </div>
            )}

            {dialedNumber && (
                <div style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '11px',
                    marginTop: '6px',
                    fontStyle: 'italic'
                }}>
                    📞 Dialing: {dialedNumber}
                </div>
            )}

            <div style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '12px',
                marginTop: '10px',
                fontWeight: '500'
            }}>
                🎯 Auto-selects closest area code when you type a number
            </div>

            <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '11px',
                marginTop: '4px',
                fontStyle: 'italic'
            }}>
                💡 Also allows manual override - select any number you prefer
            </div>
        </div>
    );
};

export default CallerIdSelector;
