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
      console.log('beforeStartOutboundCall triggered:', payload);
      
      if (payload.destination) {
        try {
          const recommendation = await areaCodeDialerService.handleOutboundCall(
            payload.destination
          );
          
          if (recommendation && recommendation.recommendedCallerId) {
            // Update the payload with the recommended caller ID
            payload.callerId = recommendation.recommendedCallerId;
            
            console.log('Caller ID automatically assigned:', recommendation.recommendedCallerId);
          }
        } catch (error) {
          console.error('Error in beforeStartOutboundCall:', error);
        }
      }
    });

    // Hook into dialer state changes more comprehensively
    flex.Actions.addListener('beforeStartCall', async (payload) => {
      console.log('beforeStartCall triggered:', payload);
      
      if (payload.destination) {
        try {
          const recommendation = await areaCodeDialerService.handleOutboundCall(
            payload.destination
          );
          
          if (recommendation && recommendation.recommendedCallerId) {
            payload.callerId = recommendation.recommendedCallerId;
            console.log('Caller ID set via beforeStartCall:', recommendation.recommendedCallerId);
          }
        } catch (error) {
          console.error('Error in beforeStartCall:', error);
        }
      }
    });

    // Hook into dialpad number changes
    flex.Actions.addListener('beforeSetActivity', (payload) => {
      console.log('Activity change:', payload);
    });

    // Monitor dialpad input changes
    manager.store.subscribe(() => {
      const state = manager.store.getState();
      const phoneState = state.flex?.phone;
      
      if (phoneState && phoneState.call && phoneState.call.to) {
        const destination = phoneState.call.to;
        console.log('Phone state changed - destination:', destination);
        
        // Trigger caller ID lookup for the new destination
        areaCodeDialerService.handleOutboundCall(destination);
      }
    });    // Hook into task accepted events for outbound calls
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

    // Add reducer to handle caller ID state
    manager.store.addReducer('areaCodePlugin', (state = {
      currentCallerId: null,
      lastRecommendation: null,
      isEnabled: true
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
        default:
          return state;
      }
    });

    console.log('AreaCode Plugin initialized successfully');
  }
}
