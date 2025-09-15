# 🧪 Local Plugin Testing Guide

## 🚀 **Development Server Status: RUNNING**
- ✅ **Local URL**: http://localhost:3000/
- ✅ **Network URL**: http://192.168.86.148:3000/
- ✅ **Plugin**: plugin-areacode loaded successfully
- ✅ **Build**: Development build with hot reloading

---

## 📞 **Testing Your Enhanced CallerIdSelector Locally**

### **Step 1: Access Local Flex Environment**
1. **Open**: http://localhost:3000/
2. **This loads**: Your local plugin-areacode with enhanced CallerIdSelector
3. **Features**: Hot reloading - changes auto-refresh

### **Step 2: Testing the CallerIdSelector Component**

#### **What to Look For:**
- **Purple gradient selector** at top of dialpad
- **"📞 DIALPAD CALLER ID SELECTOR"** header
- **"🔍 DEBUG MODE"** badge
- **Dropdown with all 10 phone numbers**

#### **Expected Phone Numbers in Dropdown:**
1. 🟣 (805) 301-6297 - Central CA
2. 🔴 (704) 703-9096 - North Carolina  
3. 🔵 (626) 602-9805 - Los Angeles CA
4. 🟢 (734) 203-7317 - Michigan
5. 🔵 (626) 329-4809 - Los Angeles CA
6. 🟣 (805) 669-3142 - Central CA
7. 🔵 (626) 657-2197 - Los Angeles CA
8. 🟡 (714) 735-0613 - Orange County CA
9. 🟤 (659) 837-0194 - Alabama
10. 🔴 (704) 703-3029 - North Carolina

### **Step 3: Interactive Testing**

#### **Test 1: Basic Selection**
1. **Open dialpad** in the local Flex interface
2. **Click dropdown** in the purple CallerIdSelector
3. **Select a different number** (try Michigan 734)
4. **Verify green confirmation** appears: "✅ ACTIVE: 🟢 (734) 203-7317"

#### **Test 2: Console Debugging**
1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Select a caller ID** from dropdown
4. **Look for logs**:
   ```
   📞 DIALPAD CALLER ID SELECTOR LOADED - Ready for debugging!
   📞 Loaded actual account caller ID numbers: [Array]
   ✅ Manual Caller ID selected: +17342037317
   🔧 Updated Flex voice configuration with caller ID: +17342037317
   ```

#### **Test 3: Persistence Testing**
1. **Select a caller ID** (e.g., Michigan 734)
2. **Refresh the page** (F5)
3. **Verify selection is maintained** from localStorage

#### **Test 4: API Integration Testing**
1. **Check if API fetching works**:
   ```javascript
   // In browser console, test the API:
   fetch('https://area-code-9939-dev.twil.io/get-phone-numbers')
     .then(r => r.json())
     .then(data => console.log('API Response:', data));
   ```

### **Step 4: Real-Time Development**

#### **Making Changes:**
1. **Edit files** in `/src/components/CallerIdSelector/`
2. **Save changes** - auto-reloads in browser
3. **Test immediately** - no rebuild needed

#### **Common Test Edits:**
- **Change colors** in the gradient background
- **Modify emoji mappings** for area codes
- **Add console logs** for debugging
- **Test different phone number formats**

---

## 🔍 **Debugging Tools Available**

### **Browser DevTools:**
- **Console**: See all plugin logs and errors
- **Network**: Monitor API calls to serverless functions
- **Application > Local Storage**: Check saved caller ID selection
- **Redux DevTools**: If installed, view state changes

### **Component Debug Features:**
- **Visual feedback**: Green "ACTIVE" status indicators
- **Console logging**: Detailed selection and API logs
- **Error handling**: Fallback to hardcoded numbers if API fails
- **Real-time updates**: Selection changes broadcast to other components

### **API Testing:**
- **Serverless functions**: https://area-code-9939-dev.twil.io/
- **Phone numbers API**: `/get-phone-numbers`
- **Area code matching**: `/assign-caller-id`
- **Test functions**: `/test-functions`

---

## 🎯 **What to Test**

### **Core Functionality:**
- ✅ **Dropdown shows all 10 numbers** with correct formatting
- ✅ **Selection triggers console logs** with correct caller ID
- ✅ **Green confirmation** appears with friendly name
- ✅ **localStorage persistence** maintains selection across refreshes
- ✅ **API integration** fetches numbers from Twilio account
- ✅ **Fallback system** uses hardcoded numbers if API fails

### **Visual Design:**
- ✅ **Purple gradient background** is prominent and visible
- ✅ **DEBUG MODE badge** clearly indicates testing mode
- ✅ **Color-coded emojis** help identify area codes
- ✅ **Responsive layout** works in dialpad panel
- ✅ **Clear typography** and readable text

### **Integration:**
- ✅ **Redux state management** updates correctly
- ✅ **Event broadcasting** notifies other components
- ✅ **Flex configuration** updates voice settings
- ✅ **Priority logic** ensures manual selection overrides automatic

---

## 🚀 **Ready for Local Testing!**

Your enhanced CallerIdSelector is now running locally with:
- **All 10 account phone numbers** loaded dynamically
- **Real-time debugging** with console logs
- **Hot reloading** for instant development feedback
- **Full API integration** with your serverless functions

**Access at**: http://localhost:3000/

**Happy testing!** 🎉
