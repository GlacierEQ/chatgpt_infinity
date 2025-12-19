// ==UserScript==
// @name         Perplexity Auto-Driller Pro - NUCLEAR Edition
// @namespace    https://github.com/GlacierEQ
// @version      3.0.0
// @description  FIXED: Actually minimizes, intelligently drills deeper, reliably auto-approves. No more bullshit.
// @author       GlacierEQ Team
// @match        https://www.perplexity.ai/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/perplexity-auto-driller-pro.user.js
// @downloadURL  https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/perplexity-auto-driller-pro.user.js
// ==/UserScript==

(function() {
    'use strict';

    /* ==========================================
       CONFIGURATION & STATE MANAGEMENT
       ========================================== */
    const CONFIG = {
        enabled: GM_getValue('enabled', true),
        autoApprove: GM_getValue('autoApprove', true),
        autoDrill: GM_getValue('autoDrill', false),
        maxDrillDepth: GM_getValue('maxDrillDepth', 5),
        drillInterval: GM_getValue('drillInterval', 5000),
        approveInterval: GM_getValue('approveInterval', 200),
        intelligentMode: GM_getValue('intelligentMode', true),
        typingSpeed: GM_getValue('typingSpeed', 40),
        debug: GM_getValue('debug', false),
        minimized: GM_getValue('minimized', false) // 🔥 PERSISTENT MINIMIZE STATE
    };

    const STATE = {
        drillCount: 0,
        isProcessing: false,
        lastDrillTime: 0,
        conversationHistory: [],
        topicCache: new Map(),
        observers: [],
        startTime: Date.now(),
        lastResponseText: ''
    };

    // 🔥 NUCLEAR DRILL PATTERNS - WAY MORE DIVERSE
    const DRILL_PATTERNS = {
        deep_analysis: [
            "What are the fundamental principles underlying {topic}?",
            "Can you analyze {topic} from first principles?",
            "What are the core mechanisms that make {topic} work?",
            "How do experts think about {topic} differently than beginners?"
        ],
        practical_application: [
            "Give me a step-by-step implementation guide for {topic}",
            "What are 3 real-world case studies of {topic}?",
            "How can I apply {topic} starting tomorrow?",
            "What's the fastest path to mastering {topic}?"
        ],
        comparative_analysis: [
            "Compare {topic} to the top 3 alternatives with pros/cons",
            "What makes {topic} superior or inferior to competing approaches?",
            "When should I NOT use {topic}?",
            "What's the objective truth about {topic} vs the hype?"
        ],
        edge_cases: [
            "What are the edge cases and failure modes of {topic}?",
            "What do people get wrong about {topic}?",
            "What are the hidden complexities in {topic}?",
            "What advanced concepts in {topic} are often overlooked?"
        ],
        future_trends: [
            "What's the cutting edge of {topic} in 2025?",
            "How will {topic} evolve in the next 5 years?",
            "What emerging research is changing {topic}?",
            "What are the unsolved problems in {topic}?"
        ],
        expert_insights: [
            "What would a world-class expert say about {topic}?",
            "What are the non-obvious insights about {topic}?",
            "What's the 80/20 of {topic}?",
            "What do insiders know about {topic} that outsiders don't?"
        ],
        technical_deep_dive: [
            "Explain the technical architecture of {topic}",
            "What are the performance characteristics of {topic}?",
            "What are the scalability challenges with {topic}?",
            "What's the best way to debug/troubleshoot {topic}?"
        ],
        context_expansion: [
            "How does {topic} fit into the broader ecosystem?",
            "What's the historical context that led to {topic}?",
            "What adjacent topics should I learn alongside {topic}?",
            "What are the interdisciplinary connections with {topic}?"
        ]
    };

    /* ==========================================
       UTILITY FUNCTIONS
       ========================================== */
    const utils = {
        log: (...args) => {
            if (CONFIG.debug) {
                console.log('[🔥 NUCLEAR DRILLER]', new Date().toISOString(), ...args);
            }
        },

        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        randomDelay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

        saveConfig: () => {
            Object.keys(CONFIG).forEach(key => {
                GM_setValue(key, CONFIG[key]);
            });
        },

        extractMainTopic: (text) => {
            if (STATE.topicCache.has(text)) {
                return STATE.topicCache.get(text);
            }

            // 🔥 SMARTER TOPIC EXTRACTION
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
            if (sentences.length === 0) return 'this topic';

            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);

            const allWords = text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            // 🔥 FREQUENCY ANALYSIS FOR BETTER TOPIC DETECTION
            const wordFreq = {};
            allWords.forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });

            const topWords = Object.entries(wordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(entry => entry[0]);

            const topic = topWords.join(' ') || 'this topic';
            STATE.topicCache.set(text, topic);
            return topic;
        },

        formatTime: (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
                return `${hours}h ${minutes % 60}m`;
            }
            if (minutes > 0) {
                return `${minutes}m ${seconds % 60}s`;
            }
            return `${seconds}s`;
        }
    };

    /* ==========================================
       🔥 NUCLEAR DOM SELECTORS - MORE AGGRESSIVE
       ========================================== */
    const selectors = {
        approvalButtons: [
            // Primary approval buttons
            'button[data-testid*="approval"]',
            'button[data-testid*="continue"]',
            'button[data-testid*="accept"]',
            'button[data-testid*="allow"]',
            'button[data-testid*="proceed"]',
            // Aria labels
            'button[aria-label*="pprove" i]',
            'button[aria-label*="ontinue" i]',
            'button[aria-label*="llow" i]',
            'button[aria-label*="ccept" i]',
            'button[aria-label*="roceed" i]',
            'button[aria-label*="yes" i]',
            // Text content matching
            'button:has-text("Approve")',
            'button:has-text("Continue")',
            'button:has-text("Yes")',
            'button:has-text("Allow")',
            'button:has-text("Accept")',
            'button:has-text("Proceed")',
            'button:has-text("OK")',
            'button:has-text("Confirm")',
            // Role-based
            '[role="button"][aria-label*="continue" i]',
            '[role="button"][aria-label*="approve" i]',
            // Class-based
            '.approval-btn',
            '.continue-btn',
            '.accept-btn',
            // Generic buttons with positive actions
            'button.primary',
            'button.confirm'
        ],

        textInput: [
            'textarea[placeholder*="Ask" i]',
            'textarea[placeholder*="Follow" i]',
            'textarea[placeholder*="Question" i]',
            'textarea[placeholder*="search" i]',
            'textarea[data-testid="search-box"]',
            'textarea[name="query"]',
            'textarea.search-input',
            'textarea[aria-label*="search" i]',
            'textarea[role="textbox"]',
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]',
            'input[type="text"][placeholder*="Ask" i]',
            'input[type="text"][placeholder*="search" i]'
        ],

        submitButton: [
            'button[type="submit"]',
            'button[aria-label*="Submit" i]',
            'button[aria-label*="Send" i]',
            'button[aria-label*="Search" i]',
            'button[data-testid="submit"]',
            'button[data-testid="send"]',
            'button:has(svg[class*="send"])',
            'button:has(svg[class*="arrow"])',
            'button:has(svg[data-icon="send"])',
            '[role="button"][aria-label*="send" i]',
            '.submit-button',
            '.send-button'
        ],

        responseContent: [
            '[class*="answer"]',
            '[class*="response"]',
            '[class*="message-content"]',
            '[data-testid*="answer"]',
            '[data-testid*="response"]',
            'main [class*="prose"]',
            'article',
            '.copilot-answer',
            '.ai-response',
            '[role="article"]'
        ],

        loadingIndicators: [
            '[class*="loading"]',
            '[class*="generating"]',
            '[class*="thinking"]',
            '[class*="typing"]',
            '[aria-busy="true"]',
            '[data-loading="true"]',
            '.loading-spinner',
            '.dots-loading',
            'svg.animate-spin'
        ]
    };

    const dom = {
        findElement: (selectorArray) => {
            for (const selector of selectorArray) {
                try {
                    let element;

                    if (selector.includes(':has-text')) {
                        const match = selector.match(/^(.+?):has-text\("(.+?)"\)$/);
                        if (match) {
                            const [, baseSelector, text] = match;
                            const elements = document.querySelectorAll(baseSelector);
                            element = Array.from(elements).find(el => 
                                el.textContent.trim().toLowerCase().includes(text.toLowerCase())
                            );
                        }
                    } else {
                        element = document.querySelector(selector);
                    }

                    if (element && dom.isVisible(element)) {
                        return element;
                    }
                } catch (e) {
                    // Silently continue to next selector
                }
            }
            return null;
        },

        findAllElements: (selectorArray) => {
            const elements = [];
            for (const selector of selectorArray) {
                try {
                    const found = document.querySelectorAll(selector);
                    elements.push(...Array.from(found).filter(el => dom.isVisible(el)));
                } catch (e) {
                    // Continue
                }
            }
            return elements;
        },

        isVisible: (element) => {
            if (!element) return false;
            const style = window.getComputedStyle(element);
            return element.offsetParent !== null && 
                   !element.disabled &&
                   style.display !== 'none' &&
                   style.visibility !== 'hidden' &&
                   style.opacity !== '0';
        },

        waitForElement: async (selectorArray, timeout = 5000) => {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const element = dom.findElement(selectorArray);
                if (element) return element;
                await utils.sleep(100);
            }
            return null;
        }
    };

    /* ==========================================
       🔥 NUCLEAR AUTO-APPROVAL SYSTEM
       ========================================== */
    const autoApprove = {
        clickedButtons: new WeakSet(),
        lastCheckTime: 0,
        checkInterval: 150, // 🔥 FASTER CHECKING

        execute: () => {
            if (!CONFIG.autoApprove) return 0;

            const now = Date.now();
            if (now - autoApprove.lastCheckTime < autoApprove.checkInterval) {
                return 0;
            }
            autoApprove.lastCheckTime = now;

            // 🔥 FIND ALL POSSIBLE APPROVAL BUTTONS
            const buttons = dom.findAllElements(selectors.approvalButtons);

            let clickCount = 0;
            buttons.forEach(button => {
                if (!autoApprove.clickedButtons.has(button)) {
                    try {
                        utils.log('🔥 CLICKING APPROVAL:', button.textContent.trim());
                        button.click();
                        autoApprove.clickedButtons.add(button);
                        clickCount++;
                        ui.updateStatus(`✅ Approved (${clickCount})`);
                    } catch (e) {
                        utils.log('Click error:', e);
                    }
                }
            });

            return clickCount;
        },

        start: () => {
            setInterval(autoApprove.execute, CONFIG.approveInterval);
            utils.log('🔥 Auto-approval system started');
        }
    };

    /* ==========================================
       🔥 NUCLEAR INTELLIGENT DRILLING SYSTEM
       ========================================== */
    const drilling = {
        getResponseText: () => {
            const contentEls = dom.findAllElements(selectors.responseContent);
            if (contentEls.length === 0) return '';

            // Get the most recent response (last element)
            const latestContent = contentEls[contentEls.length - 1];
            const text = latestContent.textContent.trim();

            return text.length > 50 ? text : '';
        },

        isResponseComplete: () => {
            const loadingEls = document.querySelectorAll(
                selectors.loadingIndicators.join(', ')
            );
            const isLoading = Array.from(loadingEls).some(el => dom.isVisible(el));
            return !isLoading;
        },

        hasNewResponse: () => {
            const currentText = drilling.getResponseText();
            const hasNew = currentText !== STATE.lastResponseText && currentText.length > 0;
            if (hasNew) {
                STATE.lastResponseText = currentText;
                utils.log('🔥 NEW RESPONSE DETECTED:', currentText.substring(0, 100) + '...');
            }
            return hasNew;
        },

        selectIntelligentPattern: () => {
            const categories = Object.keys(DRILL_PATTERNS);
            const usedCategories = STATE.conversationHistory
                .slice(-3)
                .map(h => h.category);

            // 🔥 AVOID REPEATING RECENT CATEGORIES
            const availableCategories = categories.filter(
                cat => !usedCategories.includes(cat)
            );

            const selectedCategory = availableCategories.length > 0
                ? availableCategories[Math.floor(Math.random() * availableCategories.length)]
                : categories[Math.floor(Math.random() * categories.length)];

            const patterns = DRILL_PATTERNS[selectedCategory];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];

            utils.log(`🔥 Selected category: ${selectedCategory}`);
            return { pattern, category: selectedCategory };
        },

        generateQuestion: () => {
            const responseText = drilling.getResponseText();
            if (!responseText) {
                return { question: "Can you provide more details about that?", category: 'general' };
            }

            const topic = utils.extractMainTopic(responseText);
            const { pattern, category } = drilling.selectIntelligentPattern();
            const question = pattern.replace('{topic}', topic);

            STATE.conversationHistory.push({
                timestamp: Date.now(),
                topic,
                category,
                question
            });

            // 🔥 KEEP HISTORY MANAGEABLE
            if (STATE.conversationHistory.length > 50) {
                STATE.conversationHistory = STATE.conversationHistory.slice(-25);
            }

            utils.log('🔥 Generated question:', question);
            return { question, category };
        },

        typeIntoInput: async (element, text) => {
            element.focus();
            await utils.sleep(100);

            const isContentEditable = element.contentEditable === 'true';

            // 🔥 CLEAR EXISTING CONTENT
            if (isContentEditable) {
                element.textContent = '';
            } else {
                element.value = '';
            }

            // 🔥 TYPE CHARACTER BY CHARACTER WITH REALISTIC DELAYS
            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                if (isContentEditable) {
                    element.textContent += char;
                } else {
                    element.value += char;
                }

                // Trigger all necessary events
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: char }));
                element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: char }));
                element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: char }));

                // 🔥 VARIABLE TYPING SPEED FOR MORE HUMAN-LIKE BEHAVIOR
                const delay = utils.randomDelay(
                    CONFIG.typingSpeed - 20,
                    CONFIG.typingSpeed + 30
                );
                await utils.sleep(delay);
            }

            // 🔥 FINAL EVENTS TO TRIGGER ANY LISTENERS
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            await utils.sleep(200);
        },

        submit: async () => {
            if (STATE.isProcessing) {
                utils.log('🔥 Already processing, skipping');
                return false;
            }

            if (STATE.drillCount >= CONFIG.maxDrillDepth) {
                utils.log('🔥 Max depth reached');
                ui.updateStatus(`🛑 Max depth (${CONFIG.maxDrillDepth})`);
                return false;
            }

            const now = Date.now();
            if (now - STATE.lastDrillTime < CONFIG.drillInterval) {
                const remaining = Math.ceil((CONFIG.drillInterval - (now - STATE.lastDrillTime)) / 1000);
                utils.log(`🔥 Cooldown active: ${remaining}s remaining`);
                return false;
            }

            if (!drilling.isResponseComplete()) {
                utils.log('🔥 Response not complete yet');
                return false;
            }

            // 🔥 ONLY DRILL IF THERE'S A NEW RESPONSE
            if (!drilling.hasNewResponse()) {
                utils.log('🔥 No new response to drill into');
                return false;
            }

            STATE.isProcessing = true;
            ui.updateStatus('🔄 Processing...');

            try {
                const input = await dom.waitForElement(selectors.textInput, 3000);
                if (!input) {
                    utils.log('🔥 Input field not found');
                    ui.updateStatus('❌ Input not found');
                    return false;
                }

                const { question, category } = drilling.generateQuestion();
                ui.updateStatus(`⌨️ Typing (${category})...`);
                await drilling.typeIntoInput(input, question);

                await utils.sleep(utils.randomDelay(300, 700));

                const submitBtn = dom.findElement(selectors.submitButton);
                if (!submitBtn) {
                    utils.log('🔥 Submit button not found');
                    ui.updateStatus('❌ Submit button not found');
                    return false;
                }

                utils.log('🔥 Clicking submit button');
                submitBtn.click();
                
                STATE.drillCount++;
                STATE.lastDrillTime = now;

                ui.updateDrillCount(STATE.drillCount);
                ui.updateStatus(`🚀 Drill ${STATE.drillCount} submitted!`);
                utils.log(`🔥 DRILL #${STATE.drillCount} SUBMITTED:`, question);

                return true;

            } catch (error) {
                utils.log('🔥 ERROR during drilling:', error);
                ui.updateStatus('❌ Error: ' + error.message);
                return false;
            } finally {
                STATE.isProcessing = false;
            }
        },

        start: () => {
            setInterval(async () => {
                if (CONFIG.autoDrill) {
                    await drilling.submit();
                }
            }, CONFIG.drillInterval);
            utils.log('🔥 Intelligent drilling system started');
        }
    };

    /* ==========================================
       🔥 NUCLEAR UI SYSTEM WITH PERSISTENT MINIMIZE
       ========================================== */
    const ui = {
        panel: null,

        create: () => {
            const panel = document.createElement('div');
            panel.id = 'perplexity-auto-driller-pro';
            panel.className = CONFIG.minimized ? 'panel-minimized' : ''; // 🔥 RESTORE STATE
            panel.innerHTML = `
                <div class="panel-header">
                    <div class="panel-title">
                        <span class="icon">🔥</span>
                        <span>NUCLEAR Driller</span>
                        <span class="version">v3.0</span>
                    </div>
                    <button class="minimize-btn" id="minimize-btn">${CONFIG.minimized ? '+' : '−'}</button>
                </div>
                <div class="panel-content" id="panel-content" style="${CONFIG.minimized ? 'display: none;' : ''}">
                    <div class="control-section">
                        <div class="control-row">
                            <span class="label">🔓 Auto-Approve</span>
                            <div class="toggle ${CONFIG.autoApprove ? 'active' : ''}" data-setting="autoApprove">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                        <div class="control-row">
                            <span class="label">🚀 Auto-Drill</span>
                            <div class="toggle ${CONFIG.autoDrill ? 'active' : ''}" data-setting="autoDrill">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                        <div class="control-row">
                            <span class="label">🧠 Intelligent Mode</span>
                            <div class="toggle ${CONFIG.intelligentMode ? 'active' : ''}" data-setting="intelligentMode">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="setting-row">
                            <label>Max Depth</label>
                            <input type="number" id="max-depth" value="${CONFIG.maxDrillDepth}" min="1" max="50">
                        </div>
                        <div class="setting-row">
                            <label>Interval (s)</label>
                            <input type="number" id="interval" value="${CONFIG.drillInterval / 1000}" min="1" max="30" step="0.5">
                        </div>
                        <div class="setting-row">
                            <label>Typing Speed</label>
                            <input type="range" id="typing-speed" value="${CONFIG.typingSpeed}" min="20" max="150">
                            <span class="range-value">${CONFIG.typingSpeed}ms</span>
                        </div>
                    </div>

                    <div class="stats-section">
                        <div class="stat-item">
                            <span class="stat-label">🎯 Drills:</span>
                            <span class="stat-value" id="drill-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">📊 Status:</span>
                            <span class="stat-value" id="status">Idle</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">⏱️ Uptime:</span>
                            <span class="stat-value" id="uptime">0s</span>
                        </div>
                    </div>

                    <div class="button-section">
                        <button class="btn btn-primary" id="reset-btn">🔄 Reset</button>
                        <button class="btn btn-secondary" id="export-btn">💾 Export</button>
                    </div>
                </div>
            `;

            document.body.appendChild(panel);
            ui.panel = panel;
            ui.attachStyles();
            ui.attachEventListeners();
            ui.startUptimeCounter();
        },

        attachStyles: () => {
            GM_addStyle(`
                #perplexity-auto-driller-pro {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #c44569 100%);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(255,107,107,0.3);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: white;
                    width: 360px;
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255,255,255,0.2);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                #perplexity-auto-driller-pro:hover {
                    box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255,107,107,0.5);
                    transform: translateY(-2px);
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 18px 24px;
                    border-bottom: 2px solid rgba(255,255,255,0.15);
                    background: rgba(0,0,0,0.15);
                    border-radius: 14px 14px 0 0;
                }

                .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    font-size: 17px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }

                .icon {
                    font-size: 22px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                .version {
                    font-size: 11px;
                    background: rgba(255,255,255,0.25);
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
                }

                .minimize-btn {
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.25);
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: all 0.2s;
                    font-weight: 300;
                    line-height: 1;
                }

                .minimize-btn:hover {
                    background: rgba(255,255,255,0.25);
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .panel-content {
                    padding: 20px;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .panel-content::-webkit-scrollbar {
                    width: 8px;
                }

                .panel-content::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.2);
                    border-radius: 4px;
                }

                .panel-content::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 4px;
                }

                .control-section, .settings-section, .stats-section {
                    margin-bottom: 20px;
                }

                .control-row, .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 16px;
                    background: rgba(0,0,0,0.15);
                    border-radius: 10px;
                    margin-bottom: 10px;
                    transition: background 0.2s;
                }

                .control-row:hover, .setting-row:hover {
                    background: rgba(0,0,0,0.25);
                }

                .label {
                    font-size: 14px;
                    font-weight: 600;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }

                .toggle {
                    position: relative;
                    width: 56px;
                    height: 30px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
                }

                .toggle.active {
                    background: #10b981;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 0 15px rgba(16,185,129,0.5);
                }

                .toggle-slider {
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: 24px;
                    height: 24px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                }

                .toggle.active .toggle-slider {
                    transform: translateX(26px);
                }

                input[type="number"], input[type="range"] {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    padding: 8px 12px;
                    font-size: 14px;
                    width: 90px;
                    font-weight: 600;
                }

                input[type="number"]:focus, input[type="range"]:focus {
                    outline: none;
                    border-color: rgba(255,255,255,0.4);
                    background: rgba(0,0,0,0.3);
                }

                input[type="range"] {
                    width: 130px;
                    padding: 0;
                    height: 6px;
                }

                .range-value {
                    font-size: 13px;
                    margin-left: 10px;
                    font-weight: 600;
                }

                .stats-section {
                    background: rgba(0,0,0,0.25);
                    padding: 16px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    font-size: 14px;
                }

                .stat-label {
                    font-weight: 500;
                }

                .stat-value {
                    font-weight: 700;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }

                .button-section {
                    display: flex;
                    gap: 12px;
                }

                .btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }

                .btn-primary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                }

                .btn-primary:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }

                .btn-secondary {
                    background: rgba(16, 185, 129, 0.5);
                    color: white;
                    border: 1px solid rgba(16, 185, 129, 0.7);
                }

                .btn-secondary:hover {
                    background: rgba(16, 185, 129, 0.7);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                .panel-minimized .panel-content {
                    display: none !important;
                }
            `);
        },

        attachEventListeners: () => {
            // 🔥 TOGGLE CONTROLS
            document.querySelectorAll('.toggle').forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    const setting = e.currentTarget.dataset.setting;
                    CONFIG[setting] = !CONFIG[setting];
                    toggle.classList.toggle('active');
                    utils.saveConfig();
                    ui.updateStatus(`${setting} ${CONFIG[setting] ? '✅' : '❌'}`);
                    utils.log(`🔥 ${setting}:`, CONFIG[setting]);
                });
            });

            // 🔥 SETTINGS INPUTS
            document.getElementById('max-depth').addEventListener('change', (e) => {
                CONFIG.maxDrillDepth = parseInt(e.target.value);
                utils.saveConfig();
                ui.updateStatus(`Max depth: ${CONFIG.maxDrillDepth}`);
            });

            document.getElementById('interval').addEventListener('change', (e) => {
                CONFIG.drillInterval = parseFloat(e.target.value) * 1000;
                utils.saveConfig();
                ui.updateStatus(`Interval: ${e.target.value}s`);
            });

            document.getElementById('typing-speed').addEventListener('input', (e) => {
                CONFIG.typingSpeed = parseInt(e.target.value);
                document.querySelector('.range-value').textContent = CONFIG.typingSpeed + 'ms';
                utils.saveConfig();
            });

            // 🔥 RESET BUTTON
            document.getElementById('reset-btn').addEventListener('click', () => {
                STATE.drillCount = 0;
                STATE.conversationHistory = [];
                STATE.topicCache.clear();
                STATE.lastResponseText = '';
                ui.updateDrillCount(0);
                ui.updateStatus('🔄 Reset complete');
                utils.log('🔥 SESSION RESET');
            });

            // 🔥 EXPORT BUTTON
            document.getElementById('export-btn').addEventListener('click', () => {
                const data = {
                    drillCount: STATE.drillCount,
                    history: STATE.conversationHistory,
                    config: CONFIG,
                    timestamp: new Date().toISOString(),
                    uptime: Date.now() - STATE.startTime
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nuclear-driller-session-${Date.now()}.json`;
                a.click();
                ui.updateStatus('💾 Exported!');
                utils.log('🔥 SESSION EXPORTED');
            });

            // 🔥 MINIMIZE BUTTON WITH PERSISTENT STATE
            document.getElementById('minimize-btn').addEventListener('click', () => {
                const content = document.getElementById('panel-content');
                const btn = document.getElementById('minimize-btn');
                const panel = document.getElementById('perplexity-auto-driller-pro');
                
                const isMinimized = content.style.display === 'none';
                content.style.display = isMinimized ? 'block' : 'none';
                btn.textContent = isMinimized ? '−' : '+';
                
                if (isMinimized) {
                    panel.classList.remove('panel-minimized');
                } else {
                    panel.classList.add('panel-minimized');
                }
                
                // 🔥 SAVE MINIMIZE STATE
                CONFIG.minimized = !isMinimized;
                utils.saveConfig();
                utils.log('🔥 Panel minimized:', CONFIG.minimized);
            });
        },

        updateDrillCount: (count) => {
            const el = document.getElementById('drill-count');
            if (el) el.textContent = count;
        },

        updateStatus: (message) => {
            const el = document.getElementById('status');
            if (el) {
                el.textContent = message;
                utils.log('🔥 Status:', message);
            }
        },

        startUptimeCounter: () => {
            setInterval(() => {
                const uptime = Date.now() - STATE.startTime;
                const el = document.getElementById('uptime');
                if (el) el.textContent = utils.formatTime(uptime);
            }, 1000);
        }
    };

    /* ==========================================
       🔥 NUCLEAR MUTATION OBSERVER
       ========================================== */
    const observer = {
        start: () => {
            const obs = new MutationObserver((mutations) => {
                if (CONFIG.autoApprove) {
                    autoApprove.execute();
                }
            });

            obs.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false, // 🔥 IGNORE ATTRIBUTE CHANGES FOR PERFORMANCE
                characterData: false
            });

            STATE.observers.push(obs);
            utils.log('🔥 Mutation observer started');
        }
    };

    /* ==========================================
       🔥 NUCLEAR INITIALIZATION
       ========================================== */
    function init() {
        utils.log('🔥🔥🔥 INITIALIZING NUCLEAR AUTO-DRILLER PRO v3.0 🔥🔥🔥');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setTimeout(() => {
            ui.create();
            autoApprove.start();
            drilling.start();
            observer.start();
            ui.updateStatus('🔥 NUCLEAR MODE ACTIVE');
            utils.log('🔥 All systems operational');
        }, 1500);
    }

    init();

    // 🔥 MENU COMMANDS
    GM_registerMenuCommand('🔓 Toggle Auto-Approve', () => {
        CONFIG.autoApprove = !CONFIG.autoApprove;
        utils.saveConfig();
        ui.updateStatus('Auto-approve ' + (CONFIG.autoApprove ? '✅' : '❌'));
    });

    GM_registerMenuCommand('🚀 Toggle Auto-Drill', () => {
        CONFIG.autoDrill = !CONFIG.autoDrill;
        utils.saveConfig();
        ui.updateStatus('Auto-drill ' + (CONFIG.autoDrill ? '✅' : '❌'));
    });

    GM_registerMenuCommand('🔍 Toggle Debug Mode', () => {
        CONFIG.debug = !CONFIG.debug;
        utils.saveConfig();
        console.log('🔥 Debug mode:', CONFIG.debug ? 'ENABLED' : 'DISABLED');
    });

    GM_registerMenuCommand('🔄 Reset Session', () => {
        STATE.drillCount = 0;
        STATE.conversationHistory = [];
        STATE.topicCache.clear();
        STATE.lastResponseText = '';
        ui.updateDrillCount(0);
        ui.updateStatus('🔄 Reset complete');
    });

    GM_registerMenuCommand('💾 Export Session', () => {
        const data = {
            drillCount: STATE.drillCount,
            history: STATE.conversationHistory,
            config: CONFIG,
            timestamp: new Date().toISOString()
        };
        console.log('🔥 SESSION DATA:', data);
    });

})();