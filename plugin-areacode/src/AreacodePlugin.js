import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';

import AreaCodeMatcher from './components/AreaCodeMatcher/AreaCodeMatcher';
import CallerIdNotifications from './components/CallerIdNotifications/CallerIdNotifications';
import DialpadMonitor from './components/DialpadMonitor/DialpadMonitor';
import DebugPanel from './components/DebugPanel/DebugPanel';
import areaCodeDialerService from './services/AreaCodeDialerService';

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

    // Add dialpad monitor for real-time area code detection
    flex.MainContainer.Content.add(
      <DialpadMonitor key="AreacodePlugin-dialpad-monitor" />,
      { sortOrder: 1001 }
    );

    // Add debug panel (remove in production)
    flex.MainContainer.Content.add(
      <DebugPanel key="AreacodePlugin-debug-panel" />,
      { sortOrder: 1002 }
    );

    // Hook into the dialer actions to automatically assign caller IDs
    flex.Actions.addListener('beforeStartOutboundCall', async (payload) => {
      console.log('🚀 beforeStartOutboundCall triggered:', payload);
      
      if (payload.destination) {
        try {
          const recommendation = await areaCodeDialerService.handleOutboundCall(
            payload.destination
          );
          
          if (recommendation && recommendation.recommendedCallerId) {
            // CRITICAL: Directly modify the payload to change caller ID
            payload.callerId = recommendation.recommendedCallerId;
            
            // Also try to override any existing caller ID
            if (payload.task) {
              payload.task.attributes = {
                ...payload.task.attributes,
                outboundCallerId: recommendation.recommendedCallerId
              };
            }
            
            console.log('✅ Caller ID automatically assigned via beforeStartOutboundCall:', recommendation.recommendedCallerId);
            console.log('🔍 Modified payload:', payload);
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
      manager.serviceConfiguration.runtime.call = function(params) {
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

    console.log('AreaCode Plugin initialized successfully');
  }
}
