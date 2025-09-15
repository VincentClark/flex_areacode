import { Manager } from '@twilio/flex-ui';

class FlexCallerIdOverride {
    constructor() {
        this.manager = null;
        this.originalConnect = null;
        this.overrideCallerId = null;
        this.isEnabled = false;
    }

    initialize() {
        this.manager = Manager.getInstance();
        this.setupDeviceOverride();
        this.setupVoiceClientOverride();
        console.log('🔧 FlexCallerIdOverride initialized');
    }

    // Set the caller ID to force on next call
    setOverrideCallerId(callerId) {
        this.overrideCallerId = callerId;
        this.isEnabled = true;
        console.log('🚨 OVERRIDE SET:', callerId);

        // Store in Redux for other components to see
        if (this.manager?.store) {
            this.manager.store.dispatch({
                type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
                payload: { callerId }
            });
        }
    }

    // Clear the override
    clearOverride() {
        this.overrideCallerId = null;
        this.isEnabled = false;
        console.log('🔄 Override cleared');
    }

    // Setup Twilio Device override (most direct approach)
    setupDeviceOverride() {
        const checkForDevice = () => {
            const device = this.manager?.voiceClient?.device;

            if (device && !this.originalConnect) {
                console.log('📱 Found Twilio Device, setting up override');
                console.log('📱 Device object:', device);
                console.log('📱 Device methods:', Object.getOwnPropertyNames(device));

                this.originalConnect = device.connect.bind(device);

                device.connect = (connectOptions = {}) => {
                    console.log('🎯 DEVICE CONNECT INTERCEPTED:', connectOptions);
                    console.log('🎯 Override enabled:', this.isEnabled);
                    console.log('🎯 Override caller ID:', this.overrideCallerId);

                    if (this.isEnabled && this.overrideCallerId) {
                        console.log('🔄 FORCING CALLER ID:', this.overrideCallerId);

                        // Try multiple approaches to set caller ID
                        if (!connectOptions.params) {
                            connectOptions.params = {};
                        }

                        // Method 1: params.From
                        connectOptions.params.From = this.overrideCallerId;

                        // Method 2: params.CallerId  
                        connectOptions.params.CallerId = this.overrideCallerId;

                        // Method 3: top level properties
                        connectOptions.from = this.overrideCallerId;
                        connectOptions.callerId = this.overrideCallerId;
                        connectOptions.From = this.overrideCallerId;
                        connectOptions.CallerId = this.overrideCallerId;

                        console.log('📞 FINAL MODIFIED CONNECT OPTIONS:', JSON.stringify(connectOptions, null, 2));

                        // Clear the override after use
                        this.clearOverride();
                    } else {
                        console.log('❌ Override not applied - enabled:', this.isEnabled, 'callerId:', this.overrideCallerId);
                    }

                    const result = this.originalConnect(connectOptions);
                    console.log('📞 Connect result:', result);
                    return result;
                };

                console.log('✅ Device connect method overridden');
            } else if (!device) {
                console.log('⏳ Device not ready yet, retrying...');
                setTimeout(checkForDevice, 1000);
            } else {
                console.log('ℹ️ Device found but connect already overridden');
            }
        };

        checkForDevice();
    }

    // Setup Voice Client override (alternative approach)
    setupVoiceClientOverride() {
        setTimeout(() => {
            const voiceClient = this.manager?.voiceClient;

            if (voiceClient && voiceClient.makeCall) {
                const originalMakeCall = voiceClient.makeCall.bind(voiceClient);

                voiceClient.makeCall = (options) => {
                    console.log('🎯 VOICE CLIENT MAKE CALL INTERCEPTED:', options);

                    if (this.isEnabled && this.overrideCallerId) {
                        console.log('🔄 FORCING CALLER ID IN VOICE CLIENT:', this.overrideCallerId);

                        options = {
                            ...options,
                            from: this.overrideCallerId,
                            callerId: this.overrideCallerId
                        };

                        console.log('📞 MODIFIED VOICE CLIENT OPTIONS:', options);

                        this.clearOverride();
                    }

                    return originalMakeCall(options);
                };

                console.log('✅ Voice client makeCall method overridden');
            }
        }, 2000);
    }

    // Manual test function
    testOverride() {
        const testCallerId = '+17345551234';
        console.log('🧪 TESTING OVERRIDE WITH:', testCallerId);
        this.setOverrideCallerId(testCallerId);

        // Try to trigger a test call setup to see what happens
        const device = this.manager?.voiceClient?.device;
        if (device) {
            console.log('📱 Device available for testing');
            console.log('📱 Device status:', device.status());
            console.log('📱 Device token:', device.token ? 'Present' : 'Missing');
        } else {
            console.log('❌ No device available for testing');
        }

        // Check voice client
        const voiceClient = this.manager?.voiceClient;
        if (voiceClient) {
            console.log('🎤 Voice client available');
            console.log('🎤 Voice client methods:', Object.getOwnPropertyNames(voiceClient));
        } else {
            console.log('❌ No voice client available');
        }
    }

    // Get current status for debugging
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            overrideCallerId: this.overrideCallerId,
            hasManager: !!this.manager,
            hasVoiceClient: !!this.manager?.voiceClient,
            hasDevice: !!this.manager?.voiceClient?.device,
            deviceStatus: this.manager?.voiceClient?.device?.status?.() || 'Unknown',
            hasOverriddenConnect: !!this.originalConnect
        };
    }
}

// Create singleton instance
const flexCallerIdOverride = new FlexCallerIdOverride();

export default flexCallerIdOverride;
