import { Manager } from '@twilio/flex-ui';

class AreaCodeDialerService {
    constructor() {
        this.manager = Manager.getInstance();
        this.serverlessDomain = this.getServerlessDomain();
        this.isEnabled = this.getAutoAssignEnabled();
        this.currentRecommendation = null;
    }

    // Get serverless domain from app config or environment
    getServerlessDomain() {
        // Try to get from global app config first
        if (window.appConfig && window.appConfig.areaCodePlugin) {
            return window.appConfig.areaCodePlugin.serverlessDomain;
        }
        // Fallback to environment variable or default
        return process.env.REACT_APP_SERVERLESS_DOMAIN || 'area-code-9939-dev.twil.io';
    }

    // Get auto-assign setting from app config
    getAutoAssignEnabled() {
        if (window.appConfig && window.appConfig.areaCodePlugin) {
            return window.appConfig.areaCodePlugin.autoAssignEnabled !== false;
        }
        return true; // Default to enabled
    }

    // Extract area code from phone number
    extractAreaCode(phoneNumber) {
        if (!phoneNumber) return null;

        const cleaned = phoneNumber.replace(/\D/g, '');

        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return cleaned.substring(1, 4);
        } else if (cleaned.length === 10) {
            return cleaned.substring(0, 3);
        }

        return null;
    }

    // Fetch caller ID recommendation from serverless function
    async getCallerIdRecommendation(destinationNumber) {
        try {
            console.log('🌐 Calling serverless function with:', destinationNumber);
            
            const response = await fetch(`https://${this.serverlessDomain}/assign-caller-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destinationNumber: destinationNumber
                })
            });

            console.log('📡 Serverless response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Serverless response data:', data);

            if (data.success) {
                this.currentRecommendation = data;
                return data;
            } else {
                throw new Error(data.error || 'Failed to get caller ID recommendation');
            }
        } catch (error) {
            console.error('❌ Error fetching caller ID recommendation:', error);
            return null;
        }
    }

    // Apply caller ID to the outbound call
    applyCallerIdToCall(callerId, taskSid = null) {
        try {
            console.log('Applying caller ID:', callerId);

            // Method 1: Try to update phone state directly
            const phoneState = this.manager.store.getState().flex?.phone;
            if (phoneState) {
                console.log('Current phone state:', phoneState);

                // Dispatch action to update caller ID in phone state
                this.manager.store.dispatch({
                    type: 'PHONE_SET_CALLER_ID',
                    payload: callerId
                });
            }

            // Method 2: Update the global outbound caller ID configuration
            if (this.manager.configuration) {
                this.manager.updateConfig({
                    outboundCallerId: callerId
                });
                console.log('Updated manager configuration with caller ID');
            }

            // Method 3: Dispatch action to store for tracking
            this.manager.store.dispatch({
                type: 'FLEX_OUTBOUND_CALLER_ID_SET',
                payload: {
                    callerId: callerId,
                    timestamp: Date.now(),
                    source: 'area-code-plugin'
                }
            });

            // Method 4: Try to set it in the dialer state
            try {
                this.manager.store.dispatch({
                    type: 'SET_OUTBOUND_CALLER_ID',
                    payload: {
                        outboundCallerId: callerId
                    }
                });
            } catch (error) {
                console.log('Could not dispatch SET_OUTBOUND_CALLER_ID:', error.message);
            }

            // Method 5: If we have a specific task, update its attributes
            if (taskSid) {
                const task = this.manager.store.getState().flex.worker.tasks.get(taskSid);
                if (task) {
                    task.setAttributes({
                        ...task.attributes,
                        outboundCallerId: callerId,
                        areaCodeMatched: true
                    });
                }
            }

            console.log('Caller ID applied successfully:', callerId);
            return true;
        } catch (error) {
            console.error('Error applying caller ID:', error);
            return false;
        }
    }

    // Main function to handle outbound call setup
    async handleOutboundCall(destinationNumber, taskSid = null) {
        console.log('🎯 handleOutboundCall called with:', destinationNumber, taskSid);

        if (!this.isEnabled) {
            console.log('❌ Area code matching is disabled');
            return null;
        }

        const areaCode = this.extractAreaCode(destinationNumber);
        if (!areaCode) {
            console.log('❌ Could not extract area code from:', destinationNumber);
            return null;
        }

        console.log('🔍 Processing outbound call for area code:', areaCode);

        try {
            const recommendation = await this.getCallerIdRecommendation(destinationNumber);
            console.log('📋 Received recommendation:', recommendation);

            if (recommendation && recommendation.recommendedCallerId) {
                console.log('✅ Applying caller ID:', recommendation.recommendedCallerId);
                const success = this.applyCallerIdToCall(recommendation.recommendedCallerId, taskSid);

                if (success) {
                    // Notify user of the automatic assignment
                    this.manager.events.emit('areaCodePlugin:callerIdAssigned', {
                        destinationNumber,
                        areaCode,
                        recommendedCallerId: recommendation.recommendedCallerId,
                        reasoning: recommendation.reasoning,
                        score: recommendation.score
                    });

                    return recommendation;
                } else {
                    console.log('❌ Failed to apply caller ID');
                }
            } else {
                console.log('❌ No recommended caller ID in response');
            }
        } catch (error) {
            console.error('❌ Error in handleOutboundCall:', error);
        }

        return null;
    }

    // Initialize the service and set up event listeners
    initialize() {
        // Listen for outbound call events
        this.manager.events.addListener('taskReceived', (task) => {
            if (task.taskChannelUniqueName === 'voice' && task.attributes.direction === 'outbound') {
                const destination = task.attributes.to || task.attributes.called;
                if (destination) {
                    this.handleOutboundCall(destination, task.sid);
                }
            }
        });

        // Listen for before call events - removed hasListeners check
        try {
            this.manager.events.addListener('beforeCall', (payload) => {
                if (payload.destination) {
                    this.handleOutboundCall(payload.destination);
                }
            });
        } catch (error) {
            console.log('beforeCall event not available:', error.message);
        }

        // Listen for dialer state changes
        this.manager.store.subscribe(() => {
            const state = this.manager.store.getState();
            const phoneState = state.flex.phone;

            if (phoneState && phoneState.connection && phoneState.connection.parameters) {
                const destination = phoneState.connection.parameters.To;
                if (destination && this.lastProcessedDestination !== destination) {
                    this.lastProcessedDestination = destination;
                    this.handleOutboundCall(destination);
                }
            }
        });

        console.log('AreaCodeDialerService initialized');
    }

    // Enable/disable the service
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log('Area code matching', enabled ? 'enabled' : 'disabled');
    }

    // Get current recommendation
    getCurrentRecommendation() {
        return this.currentRecommendation;
    }

    // Clear current recommendation
    clearRecommendation() {
        this.currentRecommendation = null;
    }
}

// Create singleton instance
const areaCodeDialerService = new AreaCodeDialerService();

export default areaCodeDialerService;
