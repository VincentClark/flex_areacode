# Area Code Plugin for Twilio Flex

A Twilio Flex plugin that automatically assigns the most appropriate caller ID from your phone number inventory based on the destination number's area code.

## Features

- **Automatic Caller ID Assignment**: Automatically selects the best caller ID when making outbound calls
- **Manual Area Code Lookup**: Agents can manually input destination numbers to see recommendations
- **Real-time Notifications**: Visual notifications when caller IDs are automatically assigned
- **Geographic Matching**: Uses proximity algorithms to find the closest area code matches
- **Alternative Options**: Shows backup caller ID options with scoring

## Components

### AreaCodeMatcher
- Manual interface for agents to input destination numbers
- Shows recommended caller ID with reasoning and geographic information
- Allows applying recommended caller ID to the dialer
- Displays alternative options with scoring

### AreaCodeDialerService
- Background service that monitors outbound calls
- Automatically calls serverless functions to get caller ID recommendations
- Applies caller IDs to outbound calls without agent intervention
- Handles multiple Flex event types for comprehensive coverage

### CallerIdNotifications
- Toast notifications when caller IDs are automatically assigned
- Shows destination number, recommended caller ID, and match reasoning
- Auto-dismisses after 5 seconds

## Configuration

Configure the plugin in `public/appConfig.js`:

```javascript
var appConfig = {
  // ... existing config
  areaCodePlugin: {
    serverlessDomain: 'your-serverless-domain.twil.io',
    autoAssignEnabled: true,
    notificationsEnabled: true
  }
};
```

### Configuration Options

- **serverlessDomain**: The domain where your area code serverless functions are deployed
- **autoAssignEnabled**: Enable/disable automatic caller ID assignment (default: true)
- **notificationsEnabled**: Enable/disable toast notifications (default: true)

## Setup

Make sure you have [Node.js](https://nodejs.org) as well as [`npm`](https://npmjs.com). We support Node >= 10.12 (and recommend the _even_ versions of Node). Afterwards, install the dependencies by running `npm install`:

```bash
cd 

# If you use npm
npm install
```

Next, please install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) by running:

```bash
brew tap twilio/brew && brew install twilio
```

Finally, install the [Flex Plugin extension](https://github.com/twilio-labs/plugin-flex/tree/v1-beta) for the Twilio CLI:

```bash
twilio plugins:install @twilio-labs/plugin-flex
```

## Development

Run `twilio flex:plugins --help` to see all the commands we currently support. For further details on Flex Plugins refer to our documentation on the [Twilio Docs](https://www.twilio.com/docs/flex/developer/plugins/cli) page.

