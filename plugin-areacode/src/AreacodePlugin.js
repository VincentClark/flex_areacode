import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';

import AreaCodeMatcher from './components/AreaCodeMatcher/AreaCodeMatcher';
import CallerIdNotifications from './components/CallerIdNotifications/CallerIdNotifications';
import DialpadMonitor from './components/DialpadMonitor/DialpadMonitor';
import DebugPanel from './components/DebugPanel/DebugPanel';
import CallerIdTracker from './components/CallerIdTracker/CallerIdTracker';
import CallerIdTestPanel from './components/CallerIdTestPanel/CallerIdTestPanel';
import CallerIdSelector from './components/CallerIdSelector/CallerIdSelector';
import areaCodeDialerService from './services/AreaCodeDialerService';
import flexCallerIdOverride from './services/FlexCallerIdOverride';

const PLUGIN_NAME = 'AreacodePlugin';

export default class AreacodePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  async init(flex, manager) {
    // Initialize the area code dialer service
    areaCodeDialerService.initialize();

    // Initialize the aggressive caller ID override service
    flexCallerIdOverride.initialize();

    // Add the area code matcher component to the agent desktop
    const options = { sortOrder: -1 };
    flex.AgentDesktopView.Panel1.Content.add(
      <AreaCodeMatcher key="AreacodePlugin-matcher" />,
      options
    );

    // Add caller ID notifications to the main view
    flex.MainContainer.Content.add(
      <CallerIdNotifications key="AreacodePlugin-notifications" />,
      { sortOrder: 1000 }
    );

    // COMMENTED OUT - blocking dialer
    // flex.MainContainer.Content.add(
    //   <DialpadMonitor key="AreacodePlugin-dialpad-monitor" />,
    //   { sortOrder: 1001 }
    // );

    // COMMENTED OUT - blocking dialer  
    // flex.MainContainer.Content.add(
    //   <DebugPanel key="AreacodePlugin-debug-panel" />,
    //   { sortOrder: 1002 }
    // );

    // COMMENTED OUT - blocking dialer
    // flex.MainContainer.Content.add(
    //   <CallerIdTracker key="AreacodePlugin-caller-id-tracker" />,
    //   { sortOrder: 1003 }
    // );

    // Add test panel in a less intrusive location (AgentDesktopView instead of MainContainer)
    flex.AgentDesktopView.Panel2.Content.add(
      <CallerIdTestPanel key="AreacodePlugin-test-panel" />,
      { sortOrder: -10 }
    );

    // Add caller ID selector to the dialpad area
    flex.OutboundDialerPanel.Content.add(
      <CallerIdSelector key="AreacodePlugin-caller-id-selector" />,
      { sortOrder: -1 }  // Place at top for visibility
    );

    console.log('📞 DIALPAD CALLER ID SELECTOR LOADED - Ready for debugging!');

    // Hook into the dialer actions to automatically assign caller IDs
    flex.Actions.addListener('beforeStartOutboundCall', async (payload) => {
      console.log('🚀 beforeStartOutboundCall triggered:', payload);

      if (payload.destination) {
        try {
          // First, check if user has manually selected a caller ID
          const selectedCallerId = localStorage.getItem('selected_caller_id');
          if (selectedCallerId) {
            console.log('👤 Using manually selected caller ID:', selectedCallerId);
            payload.from = selectedCallerId;
            payload.callerId = selectedCallerId;

            // Store in Redux
            manager.store.dispatch({
              type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
              payload: { callerId: selectedCallerId }
            });

            console.log('✅ Manual caller ID applied:', selectedCallerId);
            return;
          }

          // If no manual selection, try automatic area code matching
          const recommendation = await areaCodeDialerService.handleOutboundCall(
            payload.destination
          );

          if (recommendation && recommendation.recommendedCallerId) {
            console.log('🎯 Got automatic recommendation:', recommendation.recommendedCallerId);

            // Use the new aggressive override service
            flexCallerIdOverride.setOverrideCallerId(recommendation.recommendedCallerId);

            // Also try the traditional payload modification as backup
            payload.from = recommendation.recommendedCallerId;
            payload.callerId = recommendation.recommendedCallerId;

            // Method 3: Set task attributes for reference
            if (payload.task) {
              payload.task.attributes = {
                ...payload.task.attributes,
                outboundCallerId: recommendation.recommendedCallerId,
                from: recommendation.recommendedCallerId
              };
            }

            // Method 4: Store in Redux for other handlers
            manager.store.dispatch({
              type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
              payload: { callerId: recommendation.recommendedCallerId }
            });

            console.log('✅ Automatic caller ID applied:', recommendation.recommendedCallerId);
          } else {
            console.log('❌ No recommendation received for:', payload.destination);
          }
        } catch (error) {
          console.error('❌ Error in beforeStartOutboundCall:', error);
        }
      } else {
        console.log('❌ No destination in beforeStartOutboundCall payload');
      }
    });    // Hook into dialer state changes more comprehensively
    flex.Actions.addListener('beforeStartCall', async (payload) => {
      console.log('🚀 beforeStartCall triggered:', payload);

      if (payload.destination) {
        try {
          const recommendation = await areaCodeDialerService.handleOutboundCall(
            payload.destination
          );

          if (recommendation && recommendation.recommendedCallerId) {
            payload.from = recommendation.recommendedCallerId;
            payload.callerId = recommendation.recommendedCallerId;
            console.log('✅ Caller ID set via beforeStartCall:', recommendation.recommendedCallerId);
          }
        } catch (error) {
          console.error('❌ Error in beforeStartCall:', error);
        }
      }
    });

    // Try to catch call setup events
    flex.Actions.addListener('beforeSetupCall', async (payload) => {
      console.log('🚀 beforeSetupCall triggered:', payload);

      if (payload.destination || payload.to) {
        const destination = payload.destination || payload.to;
        try {
          const recommendation = await areaCodeDialerService.handleOutboundCall(destination);

          if (recommendation && recommendation.recommendedCallerId) {
            payload.from = recommendation.recommendedCallerId;
            payload.callerId = recommendation.recommendedCallerId;
            console.log('✅ Caller ID set via beforeSetupCall:', recommendation.recommendedCallerId);
          }
        } catch (error) {
          console.error('❌ Error in beforeSetupCall:', error);
        }
      }
    });

    // Hook into dialpad number changes
    flex.Actions.addListener('beforeSetActivity', (payload) => {
      console.log('🔔 Activity change:', payload);
    });

    // Monitor dialpad input changes
    manager.store.subscribe(() => {
      const state = manager.store.getState();
      const phoneState = state.flex?.phone;

      if (phoneState && phoneState.call && phoneState.call.to) {
        const destination = phoneState.call.to;
        console.log('📞 Phone state changed - destination:', destination);

        // Trigger caller ID lookup for the new destination
        areaCodeDialerService.handleOutboundCall(destination);
      }
    });

    // Intercept ALL actions to see what happens during call setup
    const originalDispatch = manager.store.dispatch;
    manager.store.dispatch = (action) => {
      // Log all actions that might be related to calling
      if (action.type && (
        action.type.includes('CALL') ||
        action.type.includes('PHONE') ||
        action.type.includes('DIAL') ||
        action.type.includes('OUTBOUND')
      )) {
        console.log('🎬 FLEX ACTION INTERCEPTED:', action.type, action.payload);

        // Try to extract destination from various action types
        const destination = action.payload?.destination ||
          action.payload?.to ||
          action.payload?.number ||
          action.payload?.phoneNumber;

        if (destination && destination.length >= 10) {
          console.log('🎯 Found destination in action:', destination);
          setTimeout(() => {
            areaCodeDialerService.handleOutboundCall(destination);
          }, 100);
        }
      }

      return originalDispatch(action);
    };    // Hook into task accepted events for outbound calls
    flex.Actions.addListener('afterAcceptTask', (payload) => {
      const task = payload.task;

      if (task.taskChannelUniqueName === 'voice' &&
        task.attributes.direction === 'outbound') {

        const destination = task.attributes.to || task.attributes.called;
        if (destination) {
          areaCodeDialerService.handleOutboundCall(destination, task.sid);
        }
      }
    });

    // Add custom reducer to handle caller ID state with enhanced logic
    manager.store.addReducer('areaCodePlugin', (state = {
      currentCallerId: null,
      lastRecommendation: null,
      isEnabled: true,
      pendingCallerId: null
    }, action) => {
      switch (action.type) {
        case 'FLEX_OUTBOUND_CALLER_ID_SET':
          return {
            ...state,
            currentCallerId: action.payload.callerId,
            lastUpdate: action.payload.timestamp
          };
        case 'AREA_CODE_PLUGIN_SET_ENABLED':
          return {
            ...state,
            isEnabled: action.payload
          };
        case 'AREA_CODE_PLUGIN_SET_RECOMMENDATION':
          return {
            ...state,
            lastRecommendation: action.payload
          };
        case 'AREA_CODE_PLUGIN_SET_CALLER_ID':
          // Store the recommended caller ID for use in call setup
          return {
            ...state,
            pendingCallerId: action.payload.callerId,
            lastRecommendation: action.payload
          };
        default:
          return state;
      }
    });

    // Add a more aggressive approach: intercept the actual Twilio call setup
    const originalTwilioCall = manager.serviceConfiguration?.runtime?.call;
    if (originalTwilioCall) {
      manager.serviceConfiguration.runtime.call = function (params) {
        console.log('🎯 Intercepting Twilio call with params:', params);

        // Check if we have a pending caller ID recommendation
        const pluginState = manager.store.getState().areaCodePlugin;
        if (pluginState?.pendingCallerId) {
          console.log('🔄 Overriding caller ID from', params.From, 'to', pluginState.pendingCallerId);
          params.From = pluginState.pendingCallerId;

          // Clear the pending caller ID
          manager.store.dispatch({
            type: 'AREA_CODE_PLUGIN_SET_CALLER_ID',
            payload: { callerId: null }
          });
        }

        return originalTwilioCall.call(this, params);
      };
    }

    // MOST AGGRESSIVE: Override Twilio Device connect method directly
    setTimeout(() => {
      const device = manager.voiceClient?.device;
      if (device && device.connect) {
        const originalConnect = device.connect.bind(device);
        device.connect = function (connectOptions = {}) {
          console.log('🚨 INTERCEPTING TWILIO DEVICE CONNECT:', connectOptions);

          // Check for recommended caller ID and override
          const pluginState = manager.store.getState().areaCodePlugin;
          if (pluginState?.pendingCallerId) {
            console.log('🔄 DEVICE CONNECT: Overriding caller ID to', pluginState.pendingCallerId);
            connectOptions.params = {
              ...connectOptions.params,
              From: pluginState.pendingCallerId
            };
          }

          console.log('📞 DEVICE CONNECT: Final options:', connectOptions);
          return originalConnect(connectOptions);
        };
        console.log('✅ Twilio Device connect method overridden');
      } else {
        console.log('❌ Could not find Twilio Device to override');
      }
    }, 2000);

    // Monitor and override any voice configuration changes
    setTimeout(() => {
      if (manager.configuration && manager.configuration.voice) {
        const originalVoiceConfig = manager.configuration.voice;
        console.log('🔧 Original voice config:', originalVoiceConfig);

        // Override voice configuration
        manager.configuration.voice = {
          ...originalVoiceConfig,
          outboundCallerId: null, // Force to be dynamic
          defaultCallerId: null   // Remove any default
        };

        console.log('✅ Voice configuration overridden');
      }
    }, 1000);

    // CRITICAL: Override the Dial action itself
    flex.Actions.replaceAction('StartOutboundCall', async (payload, original) => {
      console.log('🎯 INTERCEPTING StartOutboundCall action:', payload);

      if (payload.destination) {
        try {
          const recommendation = await areaCodeDialerService.handleOutboundCall(
            payload.destination
          );

          if (recommendation && recommendation.recommendedCallerId) {
            console.log('🔄 Overriding caller ID in StartOutboundCall action:', recommendation.recommendedCallerId);

            // Create a new payload with the correct caller ID
            const modifiedPayload = {
              ...payload,
              from: recommendation.recommendedCallerId,
              callerId: recommendation.recommendedCallerId
            };

            console.log('📞 Modified StartOutboundCall payload:', modifiedPayload);
            return original(modifiedPayload);
          }
        } catch (error) {
          console.error('❌ Error in StartOutboundCall override:', error);
        }
      }

      // If no recommendation or error, proceed with original
      return original(payload);
    });

    // Try to override ALL call-related actions aggressively
    const callActions = [
      'StartCall',
      'DialerCall',
      'OutboundCall',
      'PlaceCall',
      'InitiateCall'
    ];

    callActions.forEach(actionName => {
      try {
        flex.Actions.replaceAction(actionName, async (payload, original) => {
          console.log(`🎯 INTERCEPTING ${actionName} action:`, payload);

          const destination = payload.destination || payload.to || payload.number;
          if (destination) {
            try {
              const recommendation = await areaCodeDialerService.handleOutboundCall(destination);

              if (recommendation && recommendation.recommendedCallerId) {
                console.log(`🔄 Overriding caller ID in ${actionName}:`, recommendation.recommendedCallerId);

                const modifiedPayload = {
                  ...payload,
                  from: recommendation.recommendedCallerId,
                  callerId: recommendation.recommendedCallerId
                };

                return original(modifiedPayload);
              }
            } catch (error) {
              console.error(`❌ Error in ${actionName} override:`, error);
            }
          }

          return original(payload);
        });
        console.log(`✅ Successfully hooked into ${actionName}`);
      } catch (error) {
        console.log(`⚠️ Could not hook into ${actionName}:`, error.message);
      }
    });

    // Override worker configuration for outbound calls
    const originalWorkerCapacity = manager.workerClient?.updateCapacity;
    if (manager.workerClient && originalWorkerCapacity) {
      console.log('🔧 Setting up worker configuration override');

      // Monitor for activity changes that might indicate outbound calling
      manager.workerClient.on('activityUpdated', (worker) => {
        console.log('👤 Worker activity updated:', worker.activityName, worker.attributes);
      });
    }

    console.log('AreaCode Plugin initialized successfully');
  }
}
