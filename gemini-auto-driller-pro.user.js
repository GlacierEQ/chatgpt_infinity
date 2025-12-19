// ==UserScript==
// @name         Gemini Auto-Driller Pro - Ultimate Edition
// @namespace    https://github.com/GlacierEQ
// @version      2.0.0
// @description  Advanced automation for Google Gemini: intelligent drilling, multi-modal support, auto-continue, and contextual follow-ups
// @author       GlacierEQ Team
// @match        https://gemini.google.com/*
// @match        https://gemini.google.com/app*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/gemini-auto-driller-pro.user.js
// @downloadURL  https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/gemini-auto-driller-pro.user.js
// ==/UserScript==

(function() {
    'use strict';

    /* ==========================================
       CONFIGURATION & STATE MANAGEMENT
       ========================================== */
    const CONFIG = {
        enabled: GM_getValue('enabled', true),
        autoDrill: GM_getValue('autoDrill', false),
        autoContinue: GM_getValue('autoContinue', true),
        maxDrillDepth: GM_getValue('maxDrillDepth', 8),
        drillInterval: GM_getValue('drillInterval', 5000),
        continueInterval: GM_getValue('continueInterval', 800),
        intelligentMode: GM_getValue('intelligentMode', true),
        typingSpeed: GM_getValue('typingSpeed', 45),
        multiModalAware: GM_getValue('multiModalAware', true),
        debug: GM_getValue('debug', false)
    };

    const STATE = {
        drillCount: 0,
        isProcessing: false,
        lastDrillTime: 0,
        conversationHistory: [],
        topicCache: new Map(),
        observers: [],
        geminiVersion: 'unknown',
        hasMultiModal: false
    };

    // Gemini-specific drill patterns (technical + multi-modal aware)
    const DRILL_PATTERNS = {
        technical: [
            "Can you provide technical details about {topic}?",
            "What are the implementation specifics of {topic}?",
            "How does {topic} work at a technical level?",
            "What are the technical challenges with {topic}?",
            "Can you explain the engineering behind {topic}?"
        ],
        analytical: [
            "What patterns emerge from analyzing {topic}?",
            "Can you break down the data about {topic}?",
            "What insights can we derive from {topic}?",
            "How do different aspects of {topic} interconnect?",
            "What conclusions can we draw about {topic}?"
        ],
        exploratory: [
            "What unexplored areas of {topic} should we investigate?",
            "What related concepts connect to {topic}?",
            "How does {topic} relate to broader contexts?",
            "What adjacent topics should we explore from {topic}?",
            "What deeper questions arise from {topic}?"
        ],
        practical: [
            "What are real-world applications of {topic}?",
            "How can we implement {topic} effectively?",
            "What practical steps involve {topic}?",
            "How do professionals use {topic}?",
            "What hands-on approaches work for {topic}?"
        ],
        research: [
            "What current research exists on {topic}?",
            "What do experts say about {topic}?",
            "What scientific evidence supports {topic}?",
            "What studies have been conducted on {topic}?",
            "What academic perspectives exist on {topic}?"
        ],
        comparative: [
            "How does {topic} compare to similar concepts?",
            "What distinguishes {topic} from alternatives?",
            "What trade-offs exist with {topic}?",
            "How does {topic} perform versus other options?",
            "What makes {topic} unique?"
        ],
        futurecast: [
            "What future developments might affect {topic}?",
            "How could {topic} evolve over time?",
            "What emerging trends impact {topic}?",
            "What innovations could transform {topic}?",
            "Where is {topic} heading in the future?"
        ],
        multimodal: [
            "Can you visualize or diagram {topic}?",
            "What would {topic} look like visually?",
            "How can we represent {topic} graphically?",
            "Can you create a visual explanation of {topic}?",
            "What diagrams help explain {topic}?"
        ],
        strategic: [
            "What strategies work best for {topic}?",
            "How should we approach {topic} strategically?",
            "What long-term plans involve {topic}?",
            "What strategic considerations affect {topic}?",
            "How do we optimize {topic}?"
        ]
    };

    /* ==========================================
       UTILITY FUNCTIONS
       ========================================== */
    const utils = {
        log: (...args) => {
            if (CONFIG.debug) {
                console.log('[Gemini AutoDriller]', new Date().toISOString(), ...args);
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

            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
            if (sentences.length === 0) return 'this topic';

            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 
                'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 
                'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 
                'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

            const firstSentence = sentences[0].toLowerCase();
            const words = firstSentence
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            const topic = words.slice(0, 3).join(' ') || 'this topic';
            STATE.topicCache.set(text, topic);
            return topic;
        },

        formatTime: (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            if (minutes > 0) {
                return `${minutes}m ${seconds % 60}s`;
            }
            return `${seconds}s`;
        },

        detectGeminiVersion: () => {
            const versionIndicators = [
                { selector: '[data-model*="gemini-2"]', version: 'Gemini 2.0' },
                { selector: '[data-model*="gemini-pro"]', version: 'Gemini Pro' },
                { selector: '[data-model*="gemini-ultra"]', version: 'Gemini Ultra' },
                { selector: '[data-model*="gemini"]', version: 'Gemini' }
            ];

            for (const {selector, version} of versionIndicators) {
                if (document.querySelector(selector)) {
                    STATE.geminiVersion = version;
                    utils.log('Detected:', version);
                    return version;
                }
            }

            STATE.geminiVersion = 'Gemini';
            return 'Gemini';
        }
    };

    /* ==========================================
       DOM SELECTORS & ELEMENT FINDERS
       ========================================== */
    const selectors = {
        chatInput: [
            'div[contenteditable="true"][aria-label*="Ask"]',
            'textarea[placeholder*="Ask"]',
            'rich-textarea[placeholder*="Ask"]',
            'div[contenteditable="true"].ql-editor',
            'div[data-placeholder*="Ask"]',
            'textarea.textarea'
        ],

        sendButton: [
            'button[aria-label*="Send"]',
            'button[data-test-id*="send"]',
            'button[class*="send-button"]',
            'button[mattooltip*="Send"]',
            'button svg[class*="send"]'
        ],

        continueButton: [
            'button:has-text("Continue")',
            'button:has-text("Continue generating")',
            'button[aria-label*="Continue"]',
            'button[data-action="continue"]'
        ],

        responseContainer: [
            'div[data-response-id]',
            'div[class*="response-container"]',
            'div[class*="model-response"]',
            'message-content',
            'div.response'
        ],

        loadingIndicators: [
            'div[class*="loading"]',
            'div[class*="thinking"]',
            'div[aria-label*="Generating"]',
            'mat-spinner',
            'div.spinner'
        ],

        stopButton: [
            'button[aria-label*="Stop"]',
            'button[data-action="stop"]',
            'button:has-text("Stop")'
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
                    utils.log('Selector error:', selector, e.message);
                }
            }
            return null;
        },

        isVisible: (element) => {
            if (!element) return false;
            const style = window.getComputedStyle(element);
            return element.offsetParent !== null && 
                   !element.disabled &&
                   !element.hasAttribute('disabled') &&
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
        },

        isGenerating: () => {
            const loader = dom.findElement(selectors.loadingIndicators);
            const stopBtn = dom.findElement(selectors.stopButton);
            return !!(loader || stopBtn);
        }
    };

    /* ==========================================
       AUTO-CONTINUE SYSTEM
       ========================================== */
    const autoContinue = {
        clickedButtons: new WeakSet(),

        execute: () => {
            if (!CONFIG.autoContinue) return false;

            const continueBtn = dom.findElement(selectors.continueButton);
            if (continueBtn && !autoContinue.clickedButtons.has(continueBtn)) {
                try {
                    utils.log('Clicking continue button');
                    continueBtn.click();
                    autoContinue.clickedButtons.add(continueBtn);
                    ui.updateStatus('Auto-continued');
                    return true;
                } catch (e) {
                    utils.log('Error clicking continue:', e);
                }
            }
            return false;
        },

        start: () => {
            setInterval(autoContinue.execute, CONFIG.continueInterval);
            utils.log('Auto-continue system started');
        }
    };

    /* ==========================================
       INTELLIGENT DRILLING SYSTEM
       ========================================== */
    const drilling = {
        getResponseText: () => {
            const responses = document.querySelectorAll(
                selectors.responseContainer.join(', ')
            );

            if (responses.length > 0) {
                const lastResponse = Array.from(responses).pop();
                return lastResponse ? lastResponse.textContent.trim() : '';
            }

            return '';
        },

        isResponseComplete: () => {
            return !dom.isGenerating();
        },

        selectPattern: () => {
            const categories = Object.keys(DRILL_PATTERNS);
            // Weights: analytical=3, technical=3, exploratory=2, research=2, others=1
            const weights = [3, 3, 2, 1, 2, 1, 1, 1, 1];

            let totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;

            let categoryIndex = 0;
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    categoryIndex = i;
                    break;
                }
            }

            const category = categories[categoryIndex];
            const patterns = DRILL_PATTERNS[category];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];

            utils.log(`Selected pattern from category: ${category}`);
            return pattern;
        },

        generateQuestion: () => {
            const responseText = drilling.getResponseText();
            if (!responseText || responseText.length < 50) {
                return "Can you elaborate on that with more details?";
            }

            const topic = utils.extractMainTopic(responseText);
            const pattern = drilling.selectPattern();
            const question = pattern.replace('{topic}', topic);

            STATE.conversationHistory.push({
                timestamp: Date.now(),
                topic,
                question,
                depth: STATE.drillCount + 1
            });

            utils.log('Generated question:', question);
            return question;
        },

        typeIntoInput: async (text) => {
            const input = dom.findElement(selectors.chatInput);
            if (!input) {
                utils.log('Input field not found');
                return false;
            }

            input.focus();

            // Check input type
            const isTextarea = input.tagName === 'TEXTAREA';
            
            if (isTextarea) {
                input.value = '';
            } else {
                input.textContent = '';
                input.innerHTML = '';
            }

            // Type character by character
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                if (isTextarea) {
                    input.value += char;
                } else {
                    input.textContent += char;
                }
                
                // Dispatch events
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new InputEvent('beforeinput', { 
                    bubbles: true, 
                    data: char 
                }));
                input.dispatchEvent(new KeyboardEvent('keydown', {
                    key: char,
                    bubbles: true
                }));
                
                await utils.sleep(utils.randomDelay(
                    CONFIG.typingSpeed - 15, 
                    CONFIG.typingSpeed + 25
                ));
            }

            // Final events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            return true;
        },

        clickSendButton: async () => {
            const sendBtn = await dom.waitForElement(selectors.sendButton, 2000);
            if (!sendBtn) {
                utils.log('Send button not found');
                return false;
            }

            try {
                sendBtn.click();
                return true;
            } catch (e) {
                utils.log('Error clicking send button:', e);
                return false;
            }
        },

        pressEnter: () => {
            const input = dom.findElement(selectors.chatInput);
            if (!input) return false;

            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });

            input.dispatchEvent(enterEvent);
            return true;
        },

        submit: async () => {
            if (STATE.isProcessing) {
                utils.log('Already processing, skipping');
                return false;
            }

            if (STATE.drillCount >= CONFIG.maxDrillDepth) {
                utils.log('Max depth reached');
                ui.updateStatus(`Max depth (${CONFIG.maxDrillDepth}) reached`);
                return false;
            }

            const now = Date.now();
            if (now - STATE.lastDrillTime < CONFIG.drillInterval) {
                utils.log('Cooldown active');
                return false;
            }

            if (!drilling.isResponseComplete()) {
                utils.log('Response not complete yet');
                return false;
            }

            STATE.isProcessing = true;
            ui.updateStatus('Processing...');

            try {
                const question = drilling.generateQuestion();
                ui.updateStatus('Typing question...');
                
                const typed = await drilling.typeIntoInput(question);
                if (!typed) {
                    ui.updateStatus('Error: Could not type');
                    return false;
                }

                await utils.sleep(utils.randomDelay(300, 700));

                ui.updateStatus('Submitting...');
                
                // Try clicking send button first, then Enter key
                let submitted = await drilling.clickSendButton();
                if (!submitted) {
                    submitted = drilling.pressEnter();
                }

                if (!submitted) {
                    ui.updateStatus('Error: Could not submit');
                    return false;
                }

                STATE.drillCount++;
                STATE.lastDrillTime = now;

                ui.updateDrillCount(STATE.drillCount);
                ui.updateStatus(`Drill ${STATE.drillCount} submitted`);
                utils.log(`Submitted drill #${STATE.drillCount}:`, question);

                return true;

            } catch (error) {
                utils.log('Error during drilling:', error);
                ui.updateStatus('Error: ' + error.message);
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
            utils.log('Intelligent drilling system started');
        }
    };

    /* ==========================================
       UI SYSTEM
       ========================================== */
    const ui = {
        panel: null,

        create: () => {
            const panel = document.createElement('div');
            panel.id = 'gemini-auto-driller-pro';
            panel.innerHTML = `
                <div class="panel-header">
                    <div class="panel-title">
                        <span class="icon">✨</span>
                        <span>Gemini Driller</span>
                        <span class="version">v2.0</span>
                    </div>
                    <button class="minimize-btn" id="minimize-btn">−</button>
                </div>
                <div class="panel-content" id="panel-content">
                    <div class="control-section">
                        <div class="control-row">
                            <span class="label">Auto-Continue</span>
                            <div class="toggle ${CONFIG.autoContinue ? 'active' : ''}" data-setting="autoContinue">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                        <div class="control-row">
                            <span class="label">Auto-Drill</span>
                            <div class="toggle ${CONFIG.autoDrill ? 'active' : ''}" data-setting="autoDrill">
                                <div class="toggle-slider"></div>
                            </div>
                        </div>
                        <div class="control-row">
                            <span class="label">Intelligent Mode</span>
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
                            <span class="stat-label">Drills:</span>
                            <span class="stat-value" id="drill-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Model:</span>
                            <span class="stat-value" id="gemini-version">Detecting...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Status:</span>
                            <span class="stat-value" id="status">Idle</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Uptime:</span>
                            <span class="stat-value" id="uptime">0s</span>
                        </div>
                    </div>

                    <div class="button-section">
                        <button class="btn btn-primary" id="reset-btn">Reset</button>
                        <button class="btn btn-secondary" id="export-btn">Export</button>
                    </div>
                </div>
            `;

            document.body.appendChild(panel);
            ui.panel = panel;
            ui.attachStyles();
            ui.attachEventListeners();
            ui.startUptimeCounter();
            ui.detectAndDisplayVersion();
        },

        attachStyles: () => {
            GM_addStyle(`
                #gemini-auto-driller-pro {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 100%);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(66,133,244,0.4);
                    z-index: 999999;
                    font-family: 'Google Sans', 'Product Sans', -apple-system, sans-serif;
                    color: white;
                    width: 340px;
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255,255,255,0.2);
                }

                #gemini-auto-driller-pro .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 14px 14px 0 0;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                #gemini-auto-driller-pro .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 16px;
                }

                #gemini-auto-driller-pro .icon {
                    font-size: 20px;
                    animation: sparkle 2s infinite;
                }

                @keyframes sparkle {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.1) rotate(5deg); }
                }

                #gemini-auto-driller-pro .version {
                    font-size: 11px;
                    background: rgba(255,255,255,0.3);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                #gemini-auto-driller-pro .minimize-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: background 0.2s;
                }

                #gemini-auto-driller-pro .minimize-btn:hover {
                    background: rgba(255,255,255,0.2);
                }

                #gemini-auto-driller-pro .panel-content {
                    padding: 20px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 0 0 14px 14px;
                }

                #gemini-auto-driller-pro .panel-content.hidden {
                    display: none;
                }

                #gemini-auto-driller-pro .control-section, 
                #gemini-auto-driller-pro .settings-section, 
                #gemini-auto-driller-pro .stats-section {
                    margin-bottom: 20px;
                }

                #gemini-auto-driller-pro .control-row, 
                #gemini-auto-driller-pro .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                #gemini-auto-driller-pro .label {
                    font-size: 14px;
                    font-weight: 500;
                }

                #gemini-auto-driller-pro .toggle {
                    position: relative;
                    width: 52px;
                    height: 28px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                #gemini-auto-driller-pro .toggle.active {
                    background: #34a853;
                }

                #gemini-auto-driller-pro .toggle-slider {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }

                #gemini-auto-driller-pro .toggle.active .toggle-slider {
                    transform: translateX(24px);
                }

                #gemini-auto-driller-pro input[type="number"], 
                #gemini-auto-driller-pro input[type="range"] {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 6px;
                    color: white;
                    padding: 6px 10px;
                    font-size: 14px;
                    width: 80px;
                }

                #gemini-auto-driller-pro input[type="range"] {
                    width: 120px;
                }

                #gemini-auto-driller-pro .range-value {
                    font-size: 12px;
                    margin-left: 8px;
                }

                #gemini-auto-driller-pro .stats-section {
                    background: rgba(0,0,0,0.4);
                    padding: 12px;
                    border-radius: 8px;
                }

                #gemini-auto-driller-pro .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                    font-size: 13px;
                }

                #gemini-auto-driller-pro .stat-value {
                    font-weight: 600;
                }

                #gemini-auto-driller-pro .button-section {
                    display: flex;
                    gap: 10px;
                }

                #gemini-auto-driller-pro .btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }

                #gemini-auto-driller-pro .btn-primary {
                    background: rgba(255,255,255,0.3);
                    color: white;
                }

                #gemini-auto-driller-pro .btn-primary:hover {
                    background: rgba(255,255,255,0.4);
                    transform: translateY(-2px);
                }

                #gemini-auto-driller-pro .btn-secondary {
                    background: rgba(66, 133, 244, 0.5);
                    color: white;
                }

                #gemini-auto-driller-pro .btn-secondary:hover {
                    background: rgba(66, 133, 244, 0.7);
                    transform: translateY(-2px);
                }
            `);
        },

        attachEventListeners: () => {
            document.querySelectorAll('#gemini-auto-driller-pro .toggle').forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    const setting = e.currentTarget.dataset.setting;
                    CONFIG[setting] = !CONFIG[setting];
                    toggle.classList.toggle('active');
                    utils.saveConfig();
                    ui.updateStatus(`${setting} ${CONFIG[setting] ? 'enabled' : 'disabled'}`);
                });
            });

            document.getElementById('max-depth').addEventListener('change', (e) => {
                CONFIG.maxDrillDepth = parseInt(e.target.value);
                utils.saveConfig();
            });

            document.getElementById('interval').addEventListener('change', (e) => {
                CONFIG.drillInterval = parseFloat(e.target.value) * 1000;
                utils.saveConfig();
            });

            document.getElementById('typing-speed').addEventListener('input', (e) => {
                CONFIG.typingSpeed = parseInt(e.target.value);
                document.querySelector('#gemini-auto-driller-pro .range-value').textContent = CONFIG.typingSpeed + 'ms';
                utils.saveConfig();
            });

            document.getElementById('reset-btn').addEventListener('click', () => {
                STATE.drillCount = 0;
                STATE.conversationHistory = [];
                STATE.topicCache.clear();
                ui.updateDrillCount(0);
                ui.updateStatus('Reset complete');
            });

            document.getElementById('export-btn').addEventListener('click', () => {
                const data = {
                    drillCount: STATE.drillCount,
                    history: STATE.conversationHistory,
                    config: CONFIG,
                    geminiVersion: STATE.geminiVersion,
                    timestamp: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gemini-session-${Date.now()}.json`;
                a.click();
                ui.updateStatus('Session exported');
            });

            document.getElementById('minimize-btn').addEventListener('click', () => {
                const content = document.getElementById('panel-content');
                const btn = document.getElementById('minimize-btn');
                content.classList.toggle('hidden');
                btn.textContent = content.classList.contains('hidden') ? '+' : '−';
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
                utils.log('Status:', message);
            }
        },

        detectAndDisplayVersion: () => {
            setTimeout(() => {
                const version = utils.detectGeminiVersion();
                const el = document.getElementById('gemini-version');
                if (el) el.textContent = version;
            }, 1000);
        },

        startUptimeCounter: () => {
            const startTime = Date.now();
            setInterval(() => {
                const uptime = Date.now() - startTime;
                const el = document.getElementById('uptime');
                if (el) el.textContent = utils.formatTime(uptime);
            }, 1000);
        }
    };

    /* ==========================================
       MUTATION OBSERVER
       ========================================== */
    const observer = {
        start: () => {
            const obs = new MutationObserver((mutations) => {
                if (CONFIG.autoContinue) {
                    autoContinue.execute();
                }
            });

            obs.observe(document.body, {
                childList: true,
                subtree: true
            });

            STATE.observers.push(obs);
            utils.log('Mutation observer started');
        }
    };

    /* ==========================================
       INITIALIZATION
       ========================================== */
    function init() {
        utils.log('Initializing Gemini Auto-Driller Pro v2.0...');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setTimeout(() => {
            ui.create();
            autoContinue.start();
            drilling.start();
            observer.start();
            ui.updateStatus('System ready');
            utils.log('Initialization complete');
        }, 2000);
    }

    init();

    GM_registerMenuCommand('⚙️ Toggle Auto-Continue', () => {
        CONFIG.autoContinue = !CONFIG.autoContinue;
        utils.saveConfig();
        ui.updateStatus('Auto-continue ' + (CONFIG.autoContinue ? 'enabled' : 'disabled'));
    });

    GM_registerMenuCommand('🔄 Toggle Auto-Drill', () => {
        CONFIG.autoDrill = !CONFIG.autoDrill;
        utils.saveConfig();
        ui.updateStatus('Auto-drill ' + (CONFIG.autoDrill ? 'enabled' : 'disabled'));
    });

    GM_registerMenuCommand('🔍 Toggle Debug Mode', () => {
        CONFIG.debug = !CONFIG.debug;
        utils.saveConfig();
        console.log('Debug mode:', CONFIG.debug ? 'ENABLED' : 'DISABLED');
    });

    GM_registerMenuCommand('🔄 Reset Session', () => {
        STATE.drillCount = 0;
        STATE.conversationHistory = [];
        STATE.topicCache.clear();
        ui.updateDrillCount(0);
        ui.updateStatus('Session reset');
    });

})();