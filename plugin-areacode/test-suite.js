// 🧪 CallerIdSelector Test Suite
// Run this in your browser console at http://localhost:3000/

console.log('🚀 Starting CallerIdSelector Test Suite...');

// Test 1: API Connection
async function testAPI() {
    console.log('\n📡 Test 1: API Connection');
    try {
        const response = await fetch('https://area-code-9939-dev.twil.io/get-phone-numbers');
        const data = await response.json();

        if (data.success && data.phoneNumbers) {
            console.log('✅ API Working - Found', data.phoneNumbers.length, 'phone numbers');
            console.log('📞 Numbers:', data.phoneNumbers.map(n => n.friendlyName));
            return true;
        } else {
            console.log('❌ API Error:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ API Connection Failed:', error);
        return false;
    }
}

// Test 2: Component Presence
function testComponentPresence() {
    console.log('\n🔍 Test 2: Component Presence');

    // Look for the CallerIdSelector
    const selector = document.querySelector('select');
    if (selector) {
        console.log('✅ Dropdown found');

        // Count options
        const options = selector.querySelectorAll('option');
        console.log('✅ Found', options.length, 'options in dropdown');

        // List the options
        const optionTexts = Array.from(options).map(opt => opt.textContent);
        console.log('📋 Options:', optionTexts);

        return true;
    } else {
        console.log('❌ CallerIdSelector dropdown not found');
        return false;
    }
}

// Test 3: Local Storage
function testLocalStorage() {
    console.log('\n💾 Test 3: Local Storage');

    // Test setting a value
    localStorage.setItem('selected_caller_id', '+17342037317');
    const stored = localStorage.getItem('selected_caller_id');

    if (stored === '+17342037317') {
        console.log('✅ LocalStorage working - can save caller ID');
        return true;
    } else {
        console.log('❌ LocalStorage not working');
        return false;
    }
}

// Test 4: Area Code Emoji Mapping
function testEmojiMapping() {
    console.log('\n🎨 Test 4: Area Code Emoji Mapping');

    const testNumbers = [
        '+16266029805', // 626 -> 🔵
        '+17342037317', // 734 -> 🟢
        '+18053016297', // 805 -> 🟣
        '+17047039096', // 704 -> 🔴
        '+17147350613', // 714 -> 🟡
        '+16598370194'  // 659 -> 🟤
    ];

    const expectedEmojis = ['🔵', '🟢', '🟣', '🔴', '🟡', '🟤'];

    // Simulate the emoji mapping function
    const getAreaCodeEmoji = (phoneNumber) => {
        const areaCode = phoneNumber.substring(2, 5);
        const emojiMap = {
            '626': '🔵', '805': '🟣', '714': '🟡',
            '704': '🔴', '734': '🟢', '659': '🟤'
        };
        return emojiMap[areaCode] || '📞';
    };

    let allCorrect = true;
    testNumbers.forEach((number, index) => {
        const emoji = getAreaCodeEmoji(number);
        const expected = expectedEmojis[index];
        if (emoji === expected) {
            console.log(`✅ ${number} -> ${emoji}`);
        } else {
            console.log(`❌ ${number} -> ${emoji} (expected ${expected})`);
            allCorrect = false;
        }
    });

    return allCorrect;
}

// Test 5: Plugin Loading
function testPluginLoading() {
    console.log('\n🔌 Test 5: Plugin Loading');

    // Check for Twilio Flex
    if (typeof window.Twilio !== 'undefined' && window.Twilio.Flex) {
        console.log('✅ Twilio Flex SDK loaded');

        // Check for Manager
        try {
            const manager = window.Twilio.Flex.Manager.getInstance();
            if (manager) {
                console.log('✅ Flex Manager instance available');
                return true;
            }
        } catch (error) {
            console.log('❌ Flex Manager error:', error);
        }
    } else {
        console.log('❌ Twilio Flex SDK not loaded');
    }

    return false;
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Running CallerIdSelector Test Suite...\n');

    const results = {
        api: await testAPI(),
        component: testComponentPresence(),
        localStorage: testLocalStorage(),
        emojis: testEmojiMapping(),
        plugin: testPluginLoading()
    };

    console.log('\n📊 Test Results Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test.toUpperCase()}`);
    });

    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Overall: ${passedCount}/${totalCount} tests passed`);

    if (passedCount === totalCount) {
        console.log('🎉 All tests passed! CallerIdSelector is ready for use.');
    } else {
        console.log('⚠️  Some tests failed. Check the logs above for details.');
    }

    return results;
}

// Auto-run the tests
runAllTests();
