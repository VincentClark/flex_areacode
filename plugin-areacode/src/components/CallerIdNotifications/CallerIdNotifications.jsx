import React, { useState, useEffect } from 'react';
import { Manager } from '@twilio/flex-ui';
import { 
  Toast,
  Toaster,
  Text,
  Box,
  Flex,
  Button
} from '@twilio-paste/core';
import { PhoneIcon, CheckmarkIcon } from '@twilio-paste/icons/esm';

const CallerIdNotifications = () => {
  const [toasts, setToasts] = useState([]);
  const [manager] = useState(() => Manager.getInstance());

  useEffect(() => {
    const handleCallerIdAssigned = (eventData) => {
      const { 
        destinationNumber, 
        areaCode, 
        recommendedCallerId, 
        reasoning, 
        score 
      } = eventData;

      const newToast = {
        id: Date.now(),
        variant: 'success',
        message: `Caller ID automatically assigned: ${formatPhoneNumber(recommendedCallerId)}`,
        details: {
          destination: formatPhoneNumber(destinationNumber),
          areaCode,
          reasoning,
          score
        }
      };

      setToasts(prevToasts => [...prevToasts, newToast]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissToast(newToast.id);
      }, 5000);
    };

    // Listen for caller ID assignment events
    manager.events.addListener('areaCodePlugin:callerIdAssigned', handleCallerIdAssigned);

    return () => {
      manager.events.removeListener('areaCodePlugin:callerIdAssigned', handleCallerIdAssigned);
    };
  }, [manager]);

  const dismissToast = (toastId) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phoneNumber;
  };

  return (
    <Toaster>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          onDismiss={() => dismissToast(toast.id)}
          variant={toast.variant}
        >
          <Flex alignItems="center">
            <CheckmarkIcon decorative />
            <Box marginLeft="space20">
              <Text fontWeight="fontWeightSemibold">
                {toast.message}
              </Text>
              <Text fontSize="fontSize20" color="colorTextWeak">
                Calling {toast.details.destination} (Area code {toast.details.areaCode})
              </Text>
              <Text fontSize="fontSize20" color="colorTextWeak">
                Match score: {toast.details.score}% - {toast.details.reasoning}
              </Text>
            </Box>
          </Flex>
        </Toast>
      ))}
    </Toaster>
  );
};

export default CallerIdNotifications;
