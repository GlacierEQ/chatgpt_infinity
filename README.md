# 🤖 ChatGPT Infinity - AI Automation Scripts

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-GlacierEQ-blue?logo=github)](https://github.com/GlacierEQ/chatgpt_infinity)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Firefox%20%7C%20Edge-orange)](https://www.tampermonkey.net/)
[![Version](https://img.shields.io/badge/Version-2.0.0-red)](https://github.com/GlacierEQ/chatgpt_infinity/releases)

Advanced automation tools for AI platforms featuring intelligent drilling, auto-approval, and context-aware interactions.

[Installation](#-installation) • [Features](#-features) • [Usage](#-usage) • [Documentation](#-documentation)

</div>

---

## 🎯 Overview

**ChatGPT Infinity** is a collection of powerful userscripts designed to supercharge your AI interactions. Currently featuring **Perplexity Auto-Driller Pro**, with more AI automation tools coming soon.

### 🆕 Perplexity Auto-Driller Pro v2.0

Transform your Perplexity AI experience with intelligent automation:
- ✨ **18 question patterns** across 6 intelligent categories
- 🧠 **NLP-powered topic extraction** for contextual follow-ups
- 🔄 **Automatic approval** of permissions and continuations
- ⏱️ **Human-like typing** with variable speed simulation
- 🎨 **Modern glassmorphism UI** with real-time statistics
- 💾 **Session export** for conversation history analysis

---

## 🚀 Installation

### Prerequisites

1. **Browser Extension**: Install [Tampermonkey](https://www.tampermonkey.net/)
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
   - [Safari Extension](https://apps.apple.com/app/tampermonkey/id1482490089) (Mac only)

### Quick Install

**Option 1: Direct Install** (⭐ Recommended)

1. Click [**Install Perplexity Auto-Driller Pro**](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/perplexity-auto-driller-pro.user.js)
2. Tampermonkey will detect the script automatically
3. Click **Install** button
4. Visit [perplexity.ai](https://www.perplexity.ai)

**Option 2: Manual Install**

1. Open **Tampermonkey Dashboard** (click extension icon → Dashboard)
2. Click **"+"** icon (Create new script)
3. Delete default template
4. Copy content from [`perplexity-auto-driller-pro.user.js`](perplexity-auto-driller-pro.user.js)
5. Paste into editor
6. Press **Ctrl+S** (or Cmd+S) to save
7. Visit [perplexity.ai](https://www.perplexity.ai)

---

## ✨ Features

### Intelligent Drilling System

**6 Question Categories** with weighted selection:

| Category | Weight | Example |
|----------|--------|----------|
| **Clarification** | 3x | "Can you elaborate on {topic} with specific examples?" |
| **Depth** | 2x | "What are the underlying principles behind {topic}?" |
| **Practical** | 2x | "How can I implement {topic} in production?" |
| **Comparative** | 1x | "How does {topic} compare to alternatives?" |
| **Future** | 1x | "What's the future outlook for {topic}?" |
| **Technical** | 1x | "What are best practices for {topic}?" |

**Smart Topic Extraction:**
- NLP-based keyword extraction
- Stop-word filtering (30+ common words)
- Topic caching for performance
- 2-3 word topic phrases

### Auto-Approval System

**13 Button Selectors** for universal coverage:
- `data-testid` attributes
- `aria-label` patterns
- Text-based matching
- Role-based detection
- Custom class selectors

**Features:**
- 300ms polling interval
- WeakSet tracking (no memory leaks)
- Mutation observer for dynamic content
- Instant click on detection

### Modern UI

**Glassmorphism Design:**
- Gradient background (blue theme)
- Backdrop blur effect
- Smooth animations (300ms)
- Toggle switches with slider
- Range slider for typing speed

**Real-time Statistics:**
- Drill count tracker
- Status messages
- Uptime counter (minutes/seconds)
- Session history

**Control Panel:**
- 3 toggle switches (Auto-Approve, Auto-Drill, Intelligent Mode)
- Max depth configuration (1-50)
- Interval adjustment (1-30s)
- Typing speed slider (20-150ms)

---

## 🎮 Usage

### First-Time Setup

1. **Install script** via Tampermonkey
2. **Visit** [perplexity.ai](https://www.perplexity.ai)
3. **Panel appears** in top-right corner (blue gradient)
4. **Configure settings** as desired
5. **Toggle Auto-Drill ON** to start automation

### Basic Operations

#### Auto-Approve (Default: ON)

- **Automatically clicks** permission/approval buttons
- **Works immediately** without configuration
- **Status updates** show when buttons are clicked
- **Toggle off** if you want manual control

#### Auto-Drill (Default: OFF)

1. **Ask initial question** in Perplexity
2. **Toggle Auto-Drill ON** (green switch)
3. **Wait for response** to complete
4. **Script automatically:**
   - Extracts main topic from response
   - Generates intelligent follow-up question
   - Types question with human-like speed
   - Submits automatically
   - Repeats until max depth reached

### Configuration

**Default Settings:**
```javascript
Auto-Approve: ON
Auto-Drill: OFF (safety)
Max Depth: 5 drills
Interval: 4 seconds
Typing Speed: 50ms per character
```

**Recommended Profiles:**

| Mode | Max Depth | Interval | Use Case |
|------|-----------|----------|----------|
| **Research** | 10+ | 5s | Deep topic exploration |
| **Quick** | 3 | 3s | Fast overviews |
| **Safe** | 2 | 6s | Conservative automation |
| **Aggressive** | 20 | 2s | Maximum depth |

### Keyboard Shortcuts

**Via Tampermonkey Menu** (right-click extension icon):
- ⚙️ **Toggle Auto-Approve** - Enable/disable auto-clicking
- 🔄 **Toggle Auto-Drill** - Enable/disable automated questions
- 🔍 **Toggle Debug Mode** - Show console logs
- 🔄 **Reset Session** - Clear drill count and history

### Buttons

**Reset:**
- Clears drill counter to 0
- Wipes conversation history
- Clears topic cache
- Keeps configuration settings

**Export:**
- Downloads JSON file with:
  - Drill count
  - Conversation history
  - Current configuration
  - Timestamp
- Filename: `perplexity-session-[timestamp].json`

---

## 📊 Technical Specifications

### Architecture

**Modular Design:**
```
┌───────────────────────────┐
│  Configuration & State   │
└────────┬──────────────────┘
         │
    ┌────┼────┐
    │    │    │
    │    │    │
┌───┴──┐ │ ┌─┴────────────┐
│ Utils │ │ │ Drilling    │
└───────┘ │ └─────────────┘
       ┌──┼──┐
       │  │  │
┌──────┴─┐ │ ┌┴──────────┐
│ DOM Ops │ │ │ Observers │
└─────────┘ │ └───────────┘
     ┌──────┼───────┐
     │     UI Panel     │
     └────────────────┘
```

### Performance

**Metrics:**
- **Script Size:** 33KB (minified)
- **Lines of Code:** 913
- **Memory Usage:** ~5MB
- **CPU Usage:** <1% idle, <5% active
- **Startup Time:** 1.5s delay
- **UI Render:** <100ms

**Optimization:**
- WeakSet for button tracking (automatic GC)
- Map-based topic caching
- Debounced DOM queries
- Async/await for smooth execution
- RequestAnimationFrame for UI updates

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Edge | 90+ | ✅ Fully supported |
| Safari | 14+ | ✅ With Tampermonkey |
| Opera | 76+ | ✅ Fully supported |
| Brave | 1.25+ | ✅ Fully supported |

**Mobile:**
- ❌ iOS/iPadOS - Not supported (Apple restrictions)
- ✅ Android - Supported with Kiwi Browser + Tampermonkey

---

## 🛠️ Troubleshooting

### Script Not Loading

**Symptoms:** No blue panel appears

**Solutions:**
1. Check Tampermonkey is enabled (green icon)
2. Verify script has green dot (not red)
3. Hard refresh: **Ctrl+Shift+R** (Win) or **Cmd+Shift+R** (Mac)
4. Check URL is `https://www.perplexity.ai/*`
5. Open console (F12) and look for errors

### Auto-Drill Not Triggering

**Symptoms:** No automatic questions after enabling

**Solutions:**
1. Verify toggle is **green** (active state)
2. Wait for response to fully complete (no loading indicators)
3. Check drill counter hasn't reached max depth
4. Verify interval has passed (default 4 seconds)
5. Enable debug mode and check console

### Buttons Not Clicking

**Symptoms:** Approval buttons not auto-clicked

**Solutions:**
1. Check Auto-Approve toggle is **ON**
2. Perplexity UI may have changed selectors
3. Enable debug mode to see detection attempts
4. Report new button patterns in Issues

### High CPU Usage

**Symptoms:** Browser slows down

**Solutions:**
1. Increase drill interval (5+ seconds)
2. Reduce typing speed (increase ms value)
3. Lower max depth (3-5 drills)
4. Disable debug mode
5. Close other Perplexity tabs

### Panel Position Issues

**Symptoms:** Panel overlaps other elements

**Solutions:**
1. Minimize panel with **−** button
2. Edit CSS in script (line ~700)
3. Adjust `top` and `right` values:
   ```css
   top: 80px;  /* Change this */
   right: 20px; /* Or this */
   ```

---

## 📚 Advanced Customization

### Add Custom Question Patterns

**Edit the `DRILL_PATTERNS` object:**

```javascript
DRILL_PATTERNS.custom = [
    "Your custom question about {topic}?",
    "Another pattern for {topic}?",
    "How does {topic} relate to X?"
];
```

**Then update weights in `selectPattern()`:**

```javascript
const weights = [3, 2, 2, 1, 1, 1, 1]; // Added 1 for custom
```

### Modify UI Colors

**Change gradient background:**

```javascript
// Find in attachStyles() around line 700
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

**Popular alternatives:**
- Purple: `#667eea 0%, #764ba2 100%`
- Green: `#11998e 0%, #38ef7d 100%`
- Orange: `#f12711 0%, #f5af19 100%`
- Pink: `#ee0979 0%, #ff6a00 100%`

### Adjust Selector Patterns

**If Perplexity updates their UI:**

1. Open browser DevTools (F12)
2. Inspect the button you want to click
3. Note its attributes (class, data-testid, aria-label)
4. Add to appropriate selector array:

```javascript
selectors.approvalButtons = [
    'button[data-testid*="approval"]',
    'your-new-selector-here', // Add here
    // ... rest of selectors
];
```

### Export Configuration

**Save current settings as default:**

```javascript
// After configuring in UI, run in console:
console.log(JSON.stringify({
    maxDrillDepth: CONFIG.maxDrillDepth,
    drillInterval: CONFIG.drillInterval,
    typingSpeed: CONFIG.typingSpeed
}, null, 2));

// Copy output and edit defaults in CONFIG object
```

---

## 📄 API Reference

### Configuration Object

```javascript
CONFIG = {
    enabled: Boolean,          // Master switch
    autoApprove: Boolean,      // Auto-click buttons
    autoDrill: Boolean,        // Auto-generate questions
    maxDrillDepth: Number,     // Max questions (1-50)
    drillInterval: Number,     // Milliseconds between drills
    approveInterval: Number,   // Milliseconds between button checks
    intelligentMode: Boolean,  // Use weighted patterns
    typingSpeed: Number,       // Milliseconds per character
    debug: Boolean            // Console logging
}
```

### State Object

```javascript
STATE = {
    drillCount: Number,              // Current drill number
    isProcessing: Boolean,           // Lock flag
    lastDrillTime: Number,           // Timestamp of last drill
    conversationHistory: Array,      // Question history
    topicCache: Map,                 // Topic extraction cache
    observers: Array<MutationObserver> // DOM observers
}
```

### Methods

**Utilities:**
- `utils.log(...args)` - Debug logging
- `utils.sleep(ms)` - Async delay
- `utils.randomDelay(min, max)` - Random delay
- `utils.extractMainTopic(text)` - NLP topic extraction
- `utils.formatTime(ms)` - Human-readable time

**DOM Operations:**
- `dom.findElement(selectorArray)` - Multi-selector query
- `dom.isVisible(element)` - Visibility check
- `dom.waitForElement(selectors, timeout)` - Async element wait

**Drilling:**
- `drilling.generateQuestion()` - Create follow-up
- `drilling.typeIntoInput(element, text)` - Simulate typing
- `drilling.submit()` - Full drill cycle

**UI:**
- `ui.updateDrillCount(count)` - Update counter
- `ui.updateStatus(message)` - Update status text

---

## 📝 Changelog

### v2.0.0 (December 2025)

**Major Release:**
- ✨ Complete rewrite with modular architecture
- 🧠 Intelligent pattern categorization system
- 🎯 Weighted pattern selection (6 categories)
- 🔍 Advanced NLP topic extraction
- 💾 Session export functionality
- ⏱️ Live uptime tracking
- 🎨 Glassmorphism UI design
- 🔧 Improved error handling
- 📈 Performance optimizations

**Technical:**
- 913 lines of code
- 40+ selector patterns
- 18 question templates
- WeakSet memory management
- Map-based caching
- Mutation observer pattern

### v1.0.0 (Initial Release)

**Features:**
- Basic auto-approval
- Simple question generation
- Control panel UI
- Manual drill triggering

---

## 🚀 Roadmap

### v2.1.0 (Planned)
- [ ] ChatGPT integration
- [ ] Claude integration
- [ ] Custom prompt templates
- [ ] Multi-language support
- [ ] Voice input support
- [ ] Mobile-optimized UI

### v3.0.0 (Future)
- [ ] Machine learning pattern optimization
- [ ] Browser sync across devices
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] API for external integrations

---

## 🤝 Contributing

Contributions are welcome! Here's how:

### Bug Reports

1. Check [existing issues](https://github.com/GlacierEQ/chatgpt_infinity/issues)
2. Create new issue with:
   - Browser and version
   - Script version
   - Steps to reproduce
   - Console errors (if any)
   - Screenshots

### Feature Requests

1. Open [feature request](https://github.com/GlacierEQ/chatgpt_infinity/issues/new)
2. Describe use case
3. Explain expected behavior
4. Provide examples

### Pull Requests

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

**Guidelines:**
- Follow existing code style
- Add comments for complex logic
- Test thoroughly
- Update documentation

---

## 📜 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

**TL;DR:** You can use, modify, and distribute this freely, even commercially, as long as you include the original license.

---

## ❤️ Support

**Found this useful?**

- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 👥 Share with others
- ☕ [Buy me a coffee](https://www.buymeacoffee.com/glaciereq) (coming soon)

---

## 💬 Contact

**GitHub:** [@GlacierEQ](https://github.com/GlacierEQ)
**Email:** glacier.equilibrium@gmail.com
**Issues:** [Report here](https://github.com/GlacierEQ/chatgpt_infinity/issues)

---

## ⚠️ Disclaimer

This userscript is provided as-is for educational and productivity purposes. Use responsibly and in accordance with Perplexity AI's Terms of Service. The authors are not responsible for any misuse or damages.

---

<div align="center">

**Made with ❤️ by [GlacierEQ](https://github.com/GlacierEQ)**

*"Making the world a better place, one script at a time"*

[Back to Top](#-chatgpt-infinity---ai-automation-scripts)

</div>