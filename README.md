# Flex Area Code Plugin

A Twilio Flex plugin that intelligently matches area codes for outbound dialing by automatically selecting the most appropriate caller ID from your phone number inventory based on the destination number's area code.

## Overview

This project creates a smart caller ID assignment system for Twilio Flex that:
- Analyzes the area code of outbound calls
- Searches your Twilio phone number inventory for numbers in the same or nearby area codes
- Automatically assigns the best matching number as the caller ID
- Improves answer rates by using local presence

**Flex Version**: 2.14.0

## Project Architecture

This solution consists of two main components:

### 1. Serverless Component (`area-code/`)
- **Purpose**: Hosts the backend logic for area code matching
- **Technology**: Twilio Serverless Functions
- **Functionality**: 
  - Accepts area code input
  - Queries Twilio phone number inventory
  - Implements proximity algorithm to find closest matching numbers
  - Returns optimal caller ID suggestions

### 2. Plugin Component (`plugin-areacode/`)
- **Purpose**: Frontend Flex plugin integration
- **Technology**: Twilio Flex Plugin Framework
- **Functionality**:
  - Integrates with Flex dialer interface
  - Captures outbound number area codes
  - Calls serverless functions for caller ID recommendations
  - Updates call configuration with selected caller ID

## Features

- 🎯 **Smart Area Code Matching**: Automatically finds the best caller ID based on geographic proximity
- 📞 **Seamless Flex Integration**: Works directly within the Flex dialer interface
- 🔄 **Real-time Processing**: Instant caller ID assignment during call setup
- 📊 **Inventory Management**: Efficiently searches through your entire phone number inventory
- 🌐 **Geographic Optimization**: Uses area code proximity algorithms for optimal local presence

## Project Structure

```
flex_areacode/
├── area-code/                 # Serverless Functions Component
│   ├── functions/
│   │   ├── hello-world.js     # Test function
│   │   ├── private-message.js # Messaging utilities
│   │   └── sms/
│   │       └── reply.protected.js
│   ├── assets/
│   └── package.json
│
├── plugin-areacode/           # Flex Plugin Component
│   ├── src/
│   │   ├── AreacodePlugin.js  # Main plugin file
│   │   ├── index.js           # Plugin entry point
│   │   └── components/
│   │       └── CustomTaskList/
│   ├── public/
│   │   ├── appConfig.js
│   │   └── appConfig.example.js
│   ├── webpack.config.js
│   ├── webpack.dev.js
│   └── package.json
│
├── .env.example               # Environment configuration template
└── README.md                  # This file
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Twilio CLI with Flex and Serverless plugins
- Active Twilio account with Flex configured
- Phone number inventory in your Twilio account

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Twilio credentials in `.env`:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WORKSPACE_SID=WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_WORKFLOW_SID=WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_QUEUE_SID=WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PROXY_SERVICE_SID=KSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Development Workflow

1. **Serverless Development**: Work on area code matching logic
2. **Plugin Development**: Build the Flex UI integration
3. **Integration Testing**: Test the complete flow in Flex
4. **Deployment**: Deploy both components to Twilio

## Implementation Plan

1. ✅ **Project Setup**: Initialize serverless and plugin components
2. 🔄 **Serverless Functions**: Create area code lookup and matching algorithms
3. 🔄 **Plugin Integration**: Build Flex dialer integration
4. 🔄 **Testing**: Comprehensive testing of matching logic
5. 🔄 **Deployment**: Production deployment and configuration

## Contributing

This project follows standard Git workflow practices. Please create feature branches and submit pull requests for any changes.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 