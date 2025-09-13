import React, { useState, useEffect } from 'react';
import { Manager } from '@twilio/flex-ui';
import { 
  Box, 
  Card, 
  Heading, 
  Text,
  Stack,
  Button
} from '@twilio-paste/core';

const DebugPanel = () => {
  const [manager] = useState(() => Manager.getInstance());
  const [phoneState, setPhoneState] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePhoneState = () => {
      const state = manager.store.getState();
      setPhoneState(state.flex?.phone || null);
    };

    updatePhoneState();
    const unsubscribe = manager.store.subscribe(updatePhoneState);

    return unsubscribe;
  }, [manager]);

  if (!isVisible) {
    return (
      <Box position="fixed" bottom="20px" right="20px" zIndex="zIndex90">
        <Button 
          variant="primary" 
          size="small"
          onClick={() => setIsVisible(true)}
        >
          Debug Phone State
        </Button>
      </Box>
    );
  }

  return (
    <Box position="fixed" bottom="20px" right="20px" zIndex="zIndex90" width="400px">
      <Card>
        <Box padding="space40">
          <Stack orientation="vertical" spacing="space30">
            <Heading as="h4" variant="heading40">
              Phone State Debug
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => setIsVisible(false)}
                marginLeft="space30"
              >
                Hide
              </Button>
            </Heading>
            
            {phoneState ? (
              <Box>
                <Text fontSize="fontSize20" fontFamily="fontFamilyCode">
                  <strong>Full State:</strong>
                </Text>
                <Box backgroundColor="colorBackgroundWeak" padding="space20" borderRadius="borderRadius20">
                  <Text fontSize="fontSize10" fontFamily="fontFamilyCode">
                    {JSON.stringify(phoneState, null, 2)}
                  </Text>
                </Box>
                
                {phoneState.call && (
                  <Box marginTop="space20">
                    <Text fontSize="fontSize20">
                      <strong>Call Destination:</strong> {phoneState.call.to || 'None'}
                    </Text>
                  </Box>
                )}
                
                {phoneState.dialpadInputValue && (
                  <Box marginTop="space20">
                    <Text fontSize="fontSize20">
                      <strong>Dialpad Input:</strong> {phoneState.dialpadInputValue}
                    </Text>
                  </Box>
                )}
              </Box>
            ) : (
              <Text>No phone state available</Text>
            )}
          </Stack>
        </Box>
      </Card>
    </Box>
  );
};

export default DebugPanel;
