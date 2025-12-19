# 🤖 ChatGPT Infinity - AI Automation Scripts

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-GlacierEQ-blue?logo=github)](https://github.com/GlacierEQ/chatgpt_infinity)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Firefox%20%7C%20Edge-orange)](https://www.tampermonkey.net/)
[![Version](https://img.shields.io/badge/Version-2.0.0-red)](https://github.com/GlacierEQ/chatgpt_infinity/releases)

Advanced automation tools for AI platforms featuring intelligent drilling, auto-continue, and context-aware interactions.

[Installation](#-installation) • [Features](#-features) • [Scripts](#-available-scripts) • [Documentation](#-documentation)

</div>

---

## 🎯 Overview

**ChatGPT Infinity** is a comprehensive collection of powerful userscripts designed to supercharge your AI interactions across multiple platforms. Featuring intelligent drilling systems, auto-continue capabilities, and context-aware automation.

### 🌟 Featured Scripts

| Script | Platform | Status | Features |
|--------|----------|--------|----------|
| **[ChatGPT Auto-Driller Pro](#-chatgpt-auto-driller-pro)** | ChatGPT | ✅ v2.0 | Auto-continue, 8 categories, 40 patterns |
| **[Perplexity Auto-Driller Pro](#-perplexity-auto-driller-pro)** | Perplexity | ✅ v2.0 | Auto-approve, 6 categories, 18 patterns |

---

## 🚀 Installation

### Prerequisites

1. **Browser Extension**: Install [Tampermonkey](https://www.tampermonkey.net/)
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)
   - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
   - [Safari Extension](https://apps.apple.com/app/tampermonkey/id1482490089) (Mac only)

### Quick Install Links

#### 🤖 ChatGPT Auto-Driller Pro
**[📥 Click to Install ChatGPT Script](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/chatgpt-auto-driller-pro.user.js)**

#### 🔍 Perplexity Auto-Driller Pro  
**[📥 Click to Install Perplexity Script](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/perplexity-auto-driller-pro.user.js)**

---

## 🤖 ChatGPT Auto-Driller Pro

### Overview
Transform your ChatGPT experience with intelligent automation, auto-continue, and context-aware follow-up questions.

### ✨ Key Features

- 🔄 **Auto-Continue** - Automatically clicks "Continue generating" buttons
- 🧠 **8 Question Categories** with 40+ intelligent patterns
- 💡 **Intelligent Mode** - Weighted pattern selection for better questions
- ⚡ **Real-time Topic Extraction** using advanced NLP
- 🎨 **Modern ChatGPT-themed UI** (green gradient)
- ⏱️ **Human-like Typing** with variable speed (20-150ms)
- 📊 **Live Statistics** - drill count, status, uptime
- 💾 **Session Export** - save conversation history as JSON
- 🔧 **Fully Configurable** - depth, interval, speed controls

### 🎯 Question Categories

| Category | Patterns | Weight | Example |
|----------|----------|--------|----------|
| **Clarification** | 5 | 4x | "Can you elaborate on {topic} with specific examples?" |
| **Depth** | 5 | 3x | "What are the underlying principles behind {topic}?" |
| **Practical** | 5 | 3x | "How can I implement {topic} in production?" |
| **Comparative** | 5 | 2x | "How does {topic} compare to alternatives?" |
| **Future** | 5 | 1x | "What's the future outlook for {topic}?" |
| **Technical** | 5 | 1x | "What are best practices for {topic}?" |
| **Problem Solving** | 5 | 1x | "What problems does {topic} solve?" |
| **Integration** | 5 | 1x | "How does {topic} integrate with existing systems?" |

### 📥 Installation

1. **Direct Install**: [Click here](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/chatgpt-auto-driller-pro.user.js)
2. Click **Install** when Tampermonkey prompts you
3. Visit [chatgpt.com](https://chatgpt.com) or [chat.openai.com](https://chat.openai.com)
4. Green panel appears in top-right corner

### 🎮 Usage

#### Quick Start
1. Ask your initial question in ChatGPT
2. **Toggle Auto-Continue ON** (enabled by default)
3. Wait for response
4. **Toggle Auto-Drill ON** to start automated follow-ups
5. Script generates intelligent questions automatically

#### Controls

**Toggle Switches:**
- 🔄 **Auto-Continue** - Automatically continues long responses (Default: ON)
- 🔁 **Auto-Drill** - Generates follow-up questions (Default: OFF for safety)
- 🧠 **Intelligent Mode** - Uses weighted pattern selection (Default: ON)

**Settings:**
- **Max Depth**: 1-50 drills (Default: 5)
- **Interval**: 1-30 seconds (Default: 5s)
- **Typing Speed**: 20-150ms per character (Default: 50ms)

### 🎨 UI Features

**ChatGPT Green Theme:**
- Gradient: `#10a37f → #1a7f64`
- Glassmorphism design
- Smooth animations
- Minimizable panel
- Real-time stats

**Statistics Display:**
- Current drill count
- Status messages
- Session uptime

---

## 🔍 Perplexity Auto-Driller Pro

### Overview
Enhance your Perplexity AI experience with auto-approval, intelligent drilling, and context-aware automation.

### ✨ Key Features

- ✅ **Auto-Approve** - Automatically approves permissions and continuations
- 🧠 **6 Question Categories** with 18 intelligent patterns
- 🎯 **Smart Topic Extraction** with NLP and stop-word filtering
- 🔄 **Mutation Observer** for dynamic content detection
- 🎨 **Modern Blue-themed UI** with glassmorphism
- ⏱️ **Human-like Typing** simulation
- 📊 **Live Statistics** and session tracking
- 💾 **Export Sessions** to JSON

### 🎯 Question Categories

| Category | Patterns | Weight | Example |
|----------|----------|--------|----------|
| **Clarification** | 3 | 3x | "Can you elaborate on {topic} with specific examples?" |
| **Depth** | 3 | 2x | "What are the underlying principles behind {topic}?" |
| **Practical** | 3 | 2x | "What are real-world applications of {topic}?" |
| **Comparative** | 3 | 1x | "How does {topic} compare to similar alternatives?" |
| **Future** | 3 | 1x | "What's the future outlook for {topic}?" |
| **Technical** | 3 | 1x | "What are the technical specifications of {topic}?" |

### 📥 Installation

1. **Direct Install**: [Click here](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/perplexity-auto-driller-pro.user.js)
2. Click **Install** when Tampermonkey prompts you
3. Visit [perplexity.ai](https://www.perplexity.ai)
4. Blue panel appears in top-right corner

### 🎮 Usage

#### Quick Start
1. Ask your initial question in Perplexity
2. **Auto-Approve** handles permissions automatically (ON by default)
3. Wait for response to complete
4. **Toggle Auto-Drill ON** to start automation
5. Script generates contextual follow-up questions

#### Controls

**Toggle Switches:**
- ✅ **Auto-Approve** - Auto-clicks approval buttons (Default: ON)
- 🔁 **Auto-Drill** - Generates follow-up questions (Default: OFF)
- 🧠 **Intelligent Mode** - Uses weighted patterns (Default: ON)

**Settings:**
- **Max Depth**: 1-50 drills (Default: 5)
- **Interval**: 1-30 seconds (Default: 4s)
- **Typing Speed**: 20-150ms per character (Default: 50ms)

---

## ⚙️ Configuration Profiles

### Recommended Settings by Use Case

| Profile | Max Depth | Interval | Use Case |
|---------|-----------|----------|----------|
| **🔬 Research** | 15-20 | 5-6s | Deep exploration, academic research |
| **⚡ Quick** | 2-3 | 3s | Fast overviews, simple queries |
| **🛡️ Safe** | 2 | 6s | Conservative, testing, rate-limit safe |
| **🚀 Aggressive** | 20-30 | 2s | Maximum depth, powerful accounts |
| **🎓 Learning** | 8-10 | 4s | Structured learning, tutorials |
| **💼 Professional** | 5-7 | 4-5s | Business research, reports |

---

## 🛠️ Technical Specifications

### Architecture

```
┌─────────────────────────────────────────┐
│         Configuration & State           │
└────────────────┬────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
    ┌───┴──┐ ┌──┴───┐ ┌──┴────────┐
    │Utils │ │ DOM  │ │  Drilling │
    └──────┘ └──────┘ └───────────┘
        │        │        │
        └────────┼────────┘
                 │
        ┌────────┴────────┐
        │   UI System     │
        └─────────────────┘
                 │
        ┌────────┴────────┐
        │   Observers     │
        └─────────────────┘
```

### Performance Metrics

| Metric | ChatGPT Script | Perplexity Script |
|--------|----------------|-------------------|
| **File Size** | 35KB | 33KB |
| **Lines of Code** | 940 | 913 |
| **Memory Usage** | ~5MB | ~5MB |
| **CPU Usage** | <1% idle | <1% idle |
| **Startup Time** | 2s | 1.5s |

### Browser Compatibility

| Browser | Version | ChatGPT | Perplexity |
|---------|---------|---------|------------|
| Chrome | 90+ | ✅ | ✅ |
| Firefox | 88+ | ✅ | ✅ |
| Edge | 90+ | ✅ | ✅ |
| Safari | 14+ | ✅ | ✅ |
| Opera | 76+ | ✅ | ✅ |
| Brave | 1.25+ | ✅ | ✅ |

**Mobile:**
- ❌ iOS/iPadOS - Not supported (Apple restrictions)
- ✅ Android - Use Kiwi Browser + Tampermonkey

---

## 🐛 Troubleshooting

### Common Issues

#### Script Not Loading
**Symptoms:** No panel appears

**Solutions:**
1. Verify Tampermonkey is enabled (green icon)
2. Check script shows green dot in dashboard
3. Hard refresh: **Ctrl+Shift+R** / **Cmd+Shift+R**
4. Verify URL matches script's `@match` patterns
5. Check console (F12) for errors

#### Auto-Drill Not Working
**Symptoms:** No questions after enabling

**Solutions:**
1. Ensure toggle is **green** (active)
2. Wait for AI response to fully complete
3. Check drill count vs max depth
4. Verify interval has elapsed
5. Enable debug mode for diagnostics

#### High CPU/Memory Usage
**Symptoms:** Browser becomes slow

**Solutions:**
1. Increase drill interval (5+ seconds)
2. Reduce max depth (3-5 drills)
3. Increase typing speed delay
4. Disable debug mode
5. Close duplicate tabs

---

## 📚 Advanced Customization

### Adding Custom Patterns

**1. Edit Question Categories:**

```javascript
// In DRILL_PATTERNS object, add new category:
DRILL_PATTERNS.your_category = [
    "Your question about {topic}?",
    "Another pattern for {topic}?",
    "How can {topic} be optimized?"
];
```

**2. Update Pattern Weights:**

```javascript
// In selectPattern() function:
const weights = [4, 3, 3, 2, 1, 1, 1, 1, 2]; // Added weight for new category
```

### Customizing UI Colors

**Change gradient themes:**

```javascript
// ChatGPT (Green):
background: linear-gradient(135deg, #10a37f 0%, #1a7f64 100%);

// Perplexity (Blue):
background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);

// Custom alternatives:
// Purple: #667eea 0%, #764ba2 100%
// Orange: #f12711 0%, #f5af19 100%
// Pink: #ee0979 0%, #ff6a00 100%
```

### Modifying Selectors

**Update DOM selectors if UI changes:**

```javascript
// Add new selectors to arrays:
selectors.continueButtons = [
    'button[class*="continue"]',
    'your-new-selector',  // Add here
    // ... existing selectors
];
```

---

## 📖 API Reference

### Configuration Object

```javascript
CONFIG = {
    enabled: Boolean,          // Master enable switch
    autoContinue: Boolean,     // Auto-continue for ChatGPT
    autoApprove: Boolean,      // Auto-approve for Perplexity
    autoDrill: Boolean,        // Auto-generate questions
    maxDrillDepth: Number,     // Maximum question depth (1-50)
    drillInterval: Number,     // MS between drills
    continueInterval: Number,  // MS between continue checks
    intelligentMode: Boolean,  // Use weighted patterns
    typingSpeed: Number,       // MS per character
    debug: Boolean            // Enable console logging
}
```

### Core Methods

**Utilities:**
```javascript
utils.log(...args)                    // Debug logging
utils.sleep(ms)                       // Async delay
utils.randomDelay(min, max)           // Random delay
utils.extractMainTopic(text)          // NLP topic extraction
utils.formatTime(ms)                  // Format milliseconds
```

**DOM Operations:**
```javascript
dom.findElement(selectorArray)        // Multi-selector query
dom.isVisible(element)                // Visibility check
dom.waitForElement(selectors, timeout) // Async wait
```

**Drilling:**
```javascript
drilling.generateQuestion()           // Create follow-up
drilling.typeIntoInput(el, text)      // Simulate typing
drilling.submit()                     // Execute drill cycle
```

---

## 📝 Changelog

### v2.0.0 (December 2025)

**🤖 ChatGPT Auto-Driller Pro:**
- ✨ Initial release
- 🔄 Auto-continue system
- 🧠 8 question categories (40 patterns)
- ⚡ Advanced topic extraction
- 🎨 ChatGPT green theme
- 💾 Session export
- 📊 Live statistics

**🔍 Perplexity Auto-Driller Pro:**
- ✨ Major v2.0 rewrite
- ✅ Enhanced auto-approve system
- 🎯 6 categories with weighted selection
- 🔍 Improved NLP topic extraction
- 🎨 Glassmorphism UI redesign
- 📈 Performance optimizations

---

## 🚀 Roadmap

### v2.1.0 (Q1 2025)
- [ ] Claude integration
- [ ] Gemini support
- [ ] Custom prompt templates
- [ ] Multi-language questions
- [ ] Voice input support
- [ ] Mobile-optimized UI
- [ ] Dark/light theme toggle

### v3.0.0 (Q2 2025)
- [ ] ML-based pattern optimization
- [ ] Browser sync across devices
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] API for external integrations
- [ ] Plugin system for extensions

---

## 🤝 Contributing

### How to Contribute

**Bug Reports:**
1. Check [existing issues](https://github.com/GlacierEQ/chatgpt_infinity/issues)
2. Create detailed bug report with:
   - Browser & version
   - Script version
   - Steps to reproduce
   - Console errors
   - Screenshots

**Feature Requests:**
1. Open [feature request](https://github.com/GlacierEQ/chatgpt_infinity/issues/new)
2. Describe use case
3. Explain expected behavior
4. Provide examples

**Pull Requests:**
1. Fork repository
2. Create branch: `git checkout -b feature/YourFeature`
3. Commit: `git commit -m 'Add YourFeature'`
4. Push: `git push origin feature/YourFeature`
5. Open Pull Request

**Guidelines:**
- Follow existing code style
- Comment complex logic
- Test thoroughly
- Update documentation

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file.

**You can:**
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

**You must:**
- 📄 Include license
- 📄 Include copyright

---

## ❤️ Support

**Found this useful?**

- ⭐ Star this repository
- 🔀 Fork and customize
- 🐛 Report bugs
- 💡 Suggest features  
- 👥 Share with others
- ☕ [Buy me a coffee](https://www.buymeacoffee.com/glaciereq) (coming soon)

---

## 📞 Contact

- **GitHub:** [@GlacierEQ](https://github.com/GlacierEQ)
- **Email:** glacier.equilibrium@gmail.com
- **Issues:** [Report here](https://github.com/GlacierEQ/chatgpt_infinity/issues)
- **Discussions:** [Join here](https://github.com/GlacierEQ/chatgpt_infinity/discussions)

---

## ⚠️ Disclaimer

These userscripts are provided as-is for educational and productivity purposes. Use responsibly and in accordance with each platform's Terms of Service. The authors are not responsible for any misuse, damages, or account restrictions.

**Rate Limiting:** Be mindful of API rate limits. Use conservative settings to avoid issues.

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=GlacierEQ/chatgpt_infinity&type=Date)](https://star-history.com/#GlacierEQ/chatgpt_infinity&Date)

---

<div align="center">

### 🎯 Quick Links

[ChatGPT Script](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/chatgpt-auto-driller-pro.user.js) • [Perplexity Script](https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/perplexity-auto-driller-pro.user.js) • [Issues](https://github.com/GlacierEQ/chatgpt_infinity/issues) • [Discussions](https://github.com/GlacierEQ/chatgpt_infinity/discussions)

---

**Made with ❤️ by [GlacierEQ](https://github.com/GlacierEQ)**

*Empowering AI interactions through intelligent automation*

⭐ **If you find this useful, please consider starring the repo!** ⭐

[⬆ Back to Top](#-chatgpt-infinity---ai-automation-scripts)

</div>