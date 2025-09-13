import React, { useState, useEffect } from 'react';
import { Manager } from '@twilio/flex-ui';
import {
    Box,
    Card,
    Heading,
    Text,
    Input,
    Button,
    Stack,
    Flex as FlexBox,
    Spinner,
    Badge,
    Alert
} from '@twilio-paste/core';
import { SearchIcon } from '@twilio-paste/icons/esm/SearchIcon';
import { CallActiveIcon } from '@twilio-paste/icons/esm/CallActiveIcon';

const AreaCodeMatcher = () => {
    const [destinationNumber, setDestinationNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);

    // Get serverless domain from app config or environment
    const getServerlessDomain = () => {
        // Try to get from global app config first
        if (window.appConfig && window.appConfig.areaCodePlugin) {
            return window.appConfig.areaCodePlugin.serverlessDomain;
        }
        // Fallback to environment variable or default
        return process.env.REACT_APP_SERVERLESS_DOMAIN || 'area-code-9939-dev.twil.io';
    };

    const [serverlessDomain] = useState(getServerlessDomain());

    const extractAreaCode = (phoneNumber) => {
        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Handle different phone number formats
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return cleaned.substring(1, 4);
        } else if (cleaned.length === 10) {
            return cleaned.substring(0, 3);
        }

        return null;
    };

    const fetchCallerIdRecommendation = async (areaCode) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`https://${serverlessDomain}/assign-caller-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destinationNumber: `+1${areaCode}5551234` // Create a sample number with the area code
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setRecommendation(data);
            } else {
                throw new Error(data.error || 'Failed to get caller ID recommendation');
            }
        } catch (err) {
            console.error('Error fetching caller ID recommendation:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDestinationNumberChange = (e) => {
        const value = e.target.value;
        setDestinationNumber(value);

        // Auto-lookup when area code is complete
        const areaCode = extractAreaCode(value);
        if (areaCode && areaCode.length === 3 && autoAssignEnabled) {
            fetchCallerIdRecommendation(areaCode);
        }
    };

    const handleManualLookup = () => {
        const areaCode = extractAreaCode(destinationNumber);
        if (areaCode && areaCode.length === 3) {
            fetchCallerIdRecommendation(areaCode);
        } else {
            setError('Please enter a valid phone number with area code');
        }
    };

    const applyCallerIdToDialer = () => {
        if (!recommendation?.recommendedCallerId) return;

        try {
            // Get the current task manager
            const manager = Manager.getInstance();

            // Set the caller ID for outbound calls
            manager.store.dispatch({
                type: 'SET_OUTBOUND_CALLER_ID',
                payload: {
                    callerId: recommendation.recommendedCallerId,
                    reason: `Area code matched: ${recommendation.reasoning}`
                }
            });

            // Also try to update the dialer component directly if available
            const dialerState = manager.store.getState().flex.phone;
            if (dialerState) {
                manager.updateConfig({
                    outboundCallerId: recommendation.recommendedCallerId
                });
            }

            console.log('Caller ID applied:', recommendation.recommendedCallerId);

        } catch (err) {
            console.error('Error applying caller ID:', err);
            setError('Failed to apply caller ID to dialer');
        }
    };

    // Format phone number for display
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
        <Card>
            <Box padding="space60">
                <Stack orientation="vertical" spacing="space40">
                    <Heading as="h3" variant="heading30">
                        Smart Caller ID Assignment
                    </Heading>

                    <Text>
                        Enter the destination number to automatically find the best caller ID from your inventory.
                    </Text>

                    <FlexBox>
                        <Box width="100%" marginRight="space30">
                            <Input
                                id="destination-number"
                                type="tel"
                                placeholder="Enter destination number (e.g., +1 323 555 0123)"
                                value={destinationNumber}
                                onChange={handleDestinationNumberChange}
                                disabled={isLoading}
                            />
                        </Box>
                        <Button
                            variant="primary"
                            size="default"
                            onClick={handleManualLookup}
                            disabled={isLoading || !destinationNumber}
                        >
                            {isLoading ? <Spinner decorative={false} title="Loading" /> : <SearchIcon decorative />}
                            Lookup
                        </Button>
                    </FlexBox>

                    {error && (
                        <Alert variant="error">
                            <Text>{error}</Text>
                        </Alert>
                    )}

                    {recommendation && (
                        <Card>
                            <Box padding="space40">
                                <Stack orientation="vertical" spacing="space30">
                                    <FlexBox justifyContent="space-between" alignItems="center">
                                        <Heading as="h4" variant="heading40">
                                            Recommended Caller ID
                                        </Heading>
                                        <Badge variant="success">
                                            Score: {recommendation.score}%
                                        </Badge>
                                    </FlexBox>

                                    <FlexBox alignItems="center">
                                        <CallActiveIcon decorative />
                                        <Box marginLeft="space20">
                                            <Text fontSize="fontSize40" fontWeight="fontWeightSemibold">
                                                {formatPhoneNumber(recommendation.recommendedCallerId)}
                                            </Text>
                                        </Box>
                                    </FlexBox>

                                    <Text fontSize="fontSize20" color="colorTextWeak">
                                        {recommendation.reasoning}
                                    </Text>

                                    {recommendation.geographicInfo && (
                                        <Box>
                                            <Text fontSize="fontSize20">
                                                <strong>Location:</strong> {recommendation.geographicInfo.city}, {recommendation.geographicInfo.state}
                                            </Text>
                                            <Text fontSize="fontSize20">
                                                <strong>Region:</strong> {recommendation.geographicInfo.region}
                                            </Text>
                                            <Text fontSize="fontSize20">
                                                <strong>Timezone:</strong> {recommendation.geographicInfo.timezone}
                                            </Text>
                                        </Box>
                                    )}

                                    <FlexBox justifyContent="space-between">
                                        <Button
                                            variant="primary"
                                            onClick={applyCallerIdToDialer}
                                        >
                                            Apply to Dialer
                                        </Button>

                                        <Text fontSize="fontSize20" color="colorTextWeak">
                                            Auto-assign: {autoAssignEnabled ? 'Enabled' : 'Disabled'}
                                        </Text>
                                    </FlexBox>
                                </Stack>
                            </Box>
                        </Card>
                    )}

                    {recommendation?.alternativeOptions && recommendation.alternativeOptions.length > 0 && (
                        <Card>
                            <Box padding="space40">
                                <Heading as="h5" variant="heading50">
                                    Alternative Options
                                </Heading>
                                <Stack orientation="vertical" spacing="space20">
                                    {recommendation.alternativeOptions.slice(0, 3).map((option, index) => (
                                        <FlexBox key={index} justifyContent="space-between" alignItems="center">
                                            <FlexBox alignItems="center">
                                                <CallActiveIcon decorative size="sizeIcon20" />
                                                <Text marginLeft="space20">
                                                    {formatPhoneNumber(option.phoneNumber)}
                                                </Text>
                                            </FlexBox>
                                            <Badge variant="neutral">
                                                {option.score}%
                                            </Badge>
                                        </FlexBox>
                                    ))}
                                </Stack>
                            </Box>
                        </Card>
                    )}
                </Stack>
            </Box>
        </Card>
    );
};

export default AreaCodeMatcher;
