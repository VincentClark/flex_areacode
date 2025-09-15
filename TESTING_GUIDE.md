# 🧪 Plugin Testing Guide - Enhanced Dialpad Caller ID Selector

## 🚀 **Plugin Status: DEPLOYED & ACTIVE**
- ✅ Plugin compiled successfully 
- ✅ Deployed as `plugin-areacode@0.0.1`
- ✅ Released and enabled in Flex
- ✅ Backend serverless functions verified working

---

## 📞 **Testing the Enhanced Dialpad Caller ID Selector**

### **Step 1: Access Your Flex Environment**
1. Go to: https://flex.twilio.com/admin/plugins
2. Verify `plugin-areacode` shows as "Active"
3. Open Flex agent interface

### **Step 2: Locate the Enhanced Selector**
1. **Navigate to the dialpad** (outbound dialer panel)
2. **Look for the prominent purple gradient box** at the top
3. **Should show**: "📞 DIALPAD CALLER ID SELECTOR" with "🔍 DEBUG MODE" badge

### **Step 3: Test Manual Caller ID Selection**
**Available Numbers:**
- 🔵 (626) 602-9805 - Default CA
- 🟢 (734) 203-7317 - Michigan  
- 🟡 (714) 735-0613 - Orange County CA
- 🔴 (704) 703-9096 - North Carolina
- 🟣 (805) 301-6297 - Central CA

**Testing Steps:**
1. **Select a different caller ID** from the dropdown
2. **Verify the green "✅ ACTIVE" confirmation** appears
3. **Check browser console** for log: `✅ Manual Caller ID selected: +17342037317`
4. **Selection should persist** when you refresh the page

### **Step 4: Test Override Functionality**
1. **Select Michigan number**: 🟢 (734) 203-7317
2. **Dial any number** (try a local number)
3. **Verify the outbound call** uses 734 area code as caller ID
4. **Manual selection should override** automatic area code matching

---

## 🔍 **Debugging & Verification**

### **Browser Console Logs to Look For:**
```
📞 DIALPAD CALLER ID SELECTOR LOADED - Ready for debugging!
📞 Loaded debug caller ID numbers: [Array of 5 numbers]
✅ Manual Caller ID selected: +17342037317
🔧 Updated Flex voice configuration with caller ID: +17342037317
```

### **Visual Confirmation:**
- Purple gradient selector box at top of dialpad
- "DEBUG MODE" badge clearly visible
- Green "ACTIVE" status showing selected number
- Dropdown with color-coded emoji indicators

### **Functionality Tests:**
1. **Selection Persistence**: Refresh page, selection should remain
2. **Redux Integration**: Selection stored in Redux state
3. **Priority Logic**: Manual selection overrides automatic matching
4. **Event Broadcasting**: Custom events sent to other components

---

## 🎯 **Expected Behavior**

### **When You Select a Caller ID:**
1. **Immediate visual feedback** with green confirmation
2. **Console logging** showing the selection
3. **localStorage persistence** for next session
4. **Redux state update** for plugin integration
5. **Flex configuration update** for call routing

### **When Making Outbound Calls:**
1. **Manual selection takes priority** over automatic area code matching
2. **Selected caller ID** should appear as the outbound number
3. **Override confirmation** in console logs
4. **Real-time status** in debug panel (if visible)

---

## 🔧 **Troubleshooting**

### **If Selector Not Visible:**
- Check plugin is active at: https://flex.twilio.com/admin/plugins
- Refresh Flex interface
- Check browser console for errors

### **If Selection Not Working:**
- Verify localStorage permissions in browser
- Check Redux DevTools if available
- Look for console error messages

### **If Caller ID Not Changing:**
- Confirm manual selection in console logs
- Check Twilio account phone number permissions
- Verify outbound call configuration

---

## ✅ **Success Indicators**

You'll know it's working when you see:
1. **Prominent purple selector** in dialpad
2. **Real-time selection feedback** 
3. **Console logs confirming** caller ID changes
4. **Persistent selection** across page refreshes
5. **Outbound calls using** your selected number

---

**Ready to test!** 🚀 Your enhanced dialpad caller ID selector is now live and ready for debugging!
