// ==UserScript==
// @name         Perplexity Auto-Driller Pro - Ultimate Edition
// @namespace    https://github.com/GlacierEQ
// @version      2.0.0
// @description  Advanced automation for Perplexity AI: intelligent drilling, auto-approval, context awareness, and AI-powered follow-ups
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
        drillInterval: GM_getValue('drillInterval', 4000),
        approveInterval: GM_getValue('approveInterval', 300),
        intelligentMode: GM_getValue('intelligentMode', true),
        typingSpeed: GM_getValue('typingSpeed', 50),
        debug: GM_getValue('debug', false)
    };

    const STATE = {
        drillCount: 0,
        isProcessing: false,
        lastDrillTime: 0,
        conversationHistory: [],
        topicCache: new Map(),
        observers: []
    };

    // Enhanced drill patterns with intelligent categorization
    const DRILL_PATTERNS = {
        clarification: [
            "Can you elaborate on {topic} with specific examples?",
            "What are the nuances of {topic} that beginners often miss?",
            "Could you break down {topic} into simpler components?"
        ],
        depth: [
            "What are the underlying principles behind {topic}?",
            "How has {topic} evolved over the past decade?",
            "What are the cutting-edge developments in {topic}?"
        ],
        practical: [
            "What are real-world applications of {topic}?",
            "How can I implement {topic} in a production environment?",
            "What tools or frameworks are best for {topic}?"
        ],
        comparative: [
            "How does {topic} compare to similar alternatives?",
            "What are the advantages and disadvantages of {topic}?",
            "When should I choose {topic} over other options?"
        ],
        future: [
            "What's the future outlook for {topic}?",
            "What emerging trends are shaping {topic}?",
            "How will {topic} change by 2030?"
        ],
        technical: [
            "What are the technical specifications of {topic}?",
            "What are common pitfalls when working with {topic}?",
            "What are best practices for {topic}?"
        ]
    };

    /* ==========================================
       UTILITY FUNCTIONS
       ========================================== */
    const utils = {
        log: (...args) => {
            if (CONFIG.debug) {
                console.log('[AutoDriller Pro]', new Date().toISOString(), ...args);
            }
        },

        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        randomDelay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

        saveConfig: () => {
            Object.keys(CONFIG).forEach(key => {
                GM_setValue(key, CONFIG[key]);
            });
        },

        sanitizeText: (text) => {
            return text
                .replace(/[^a-zA-Z0-9\s.,!?-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        extractMainTopic: (text) => {
            if (STATE.topicCache.has(text)) {
                return STATE.topicCache.get(text);
            }

            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
            if (sentences.length === 0) return 'this topic';

            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their']);

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
        }
    };

    /* ==========================================
       DOM SELECTORS & ELEMENT FINDERS
       ========================================== */
    const selectors = {
        approvalButtons: [
            'button[data-testid*="approval"]',
            'button[data-testid*="continue"]',
            'button[aria-label*="pprove"]',
            'button[aria-label*="ontinue"]',
            'button[aria-label*="llow"]',
            'button:has-text("Approve")',
            'button:has-text("Continue")',
            'button:has-text("Yes")',
            'button:has-text("Allow")',
            'button:has-text("Accept")',
            '[role="button"][aria-label*="continue"]',
            '.approval-btn',
            '.continue-btn'
        ],

        textInput: [
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="Follow"]',
            'textarea[placeholder*="Question"]',
            'textarea[data-testid="search-box"]',
            'textarea[name="query"]',
            'textarea.search-input',
            'textarea[aria-label*="search"]',
            'textarea[role="textbox"]',
            'div[contenteditable="true"]',
            'input[type="text"][placeholder*="Ask"]'
        ],

        submitButton: [
            'button[type="submit"]',
            'button[aria-label*="Submit"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="Search"]',
            'button[data-testid="submit"]',
            'button:has(svg[class*="send"])',
            'button:has(svg[class*="arrow"])',
            'button:has(svg[data-icon="send"])',
            '[role="button"][aria-label*="send"]',
            '.submit-button',
            '.send-button'
        ],

        responseContent: [
            '[class*="answer"]',
            '[class*="response"]',
            '[class*="message-content"]',
            '[data-testid*="answer"]',
            'main [class*="prose"]',
            'article p',
            '.copilot-answer',
            '.ai-response'
        ],

        loadingIndicators: [
            '[class*="loading"]',
            '[class*="generating"]',
            '[class*="thinking"]',
            '[class*="typing"]',
            '[aria-busy="true"]',
            '.loading-spinner',
            '.dots-loading'
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
            return element && 
                   element.offsetParent !== null && 
                   !element.disabled &&
                   window.getComputedStyle(element).display !== 'none' &&
                   window.getComputedStyle(element).visibility !== 'hidden';
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
       AUTO-APPROVAL SYSTEM
       ========================================== */
    const autoApprove = {
        clickedButtons: new WeakSet(),

        execute: () => {
            if (!CONFIG.autoApprove) return;

            const buttons = document.querySelectorAll(
                selectors.approvalButtons.join(', ')
            );

            let clickCount = 0;
            buttons.forEach(button => {
                if (dom.isVisible(button) && !autoApprove.clickedButtons.has(button)) {
                    try {
                        utils.log('Clicking approval button:', button.textContent.trim());
                        button.click();
                        autoApprove.clickedButtons.add(button);
                        clickCount++;
                        ui.updateStatus('Clicked approval button');
                    } catch (e) {
                        utils.log('Error clicking button:', e);
                    }
                }
            });

            return clickCount;
        },

        start: () => {
            setInterval(autoApprove.execute, CONFIG.approveInterval);
            utils.log('Auto-approval system started');
        }
    };

    /* ==========================================
       INTELLIGENT DRILLING SYSTEM
       ========================================== */
    const drilling = {
        getResponseText: () => {
            const contentEl = dom.findElement(selectors.responseContent);
            if (!contentEl) return '';

            const text = contentEl.textContent.trim();
            return text.length > 50 ? text : '';
        },

        isResponseComplete: () => {
            const loadingEls = document.querySelectorAll(
                selectors.loadingIndicators.join(', ')
            );
            return loadingEls.length === 0;
        },

        selectPattern: () => {
            const categories = Object.keys(DRILL_PATTERNS);
            const weights = [3, 2, 2, 1, 1, 1];

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
            if (!responseText) {
                return "Can you provide more details about that?";
            }

            const topic = utils.extractMainTopic(responseText);
            const pattern = drilling.selectPattern();
            const question = pattern.replace('{topic}', topic);

            STATE.conversationHistory.push({
                timestamp: Date.now(),
                topic,
                question
            });

            utils.log('Generated question:', question);
            return question;
        },

        typeIntoInput: async (element, text) => {
            element.focus();

            const isContentEditable = element.contentEditable === 'true';

            if (isContentEditable) {
                element.textContent = '';
            } else {
                element.value = '';
            }

            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                if (isContentEditable) {
                    element.textContent += char;
                } else {
                    element.value += char;
                }

                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: char }));
                element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: char }));

                await utils.sleep(utils.randomDelay(CONFIG.typingSpeed - 20, CONFIG.typingSpeed + 30));
            }

            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
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
                const input = await dom.waitForElement(selectors.textInput, 3000);
                if (!input) {
                    utils.log('Input field not found');
                    ui.updateStatus('Error: Input not found');
                    return false;
                }

                const question = drilling.generateQuestion();
                ui.updateStatus('Typing question...');
                await drilling.typeIntoInput(input, question);

                await utils.sleep(utils.randomDelay(300, 700));

                const submitBtn = dom.findElement(selectors.submitButton);
                if (!submitBtn) {
                    utils.log('Submit button not found');
                    ui.updateStatus('Error: Submit button not found');
                    return false;
                }

                submitBtn.click();
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
            panel.id = 'perplexity-auto-driller-pro';
            panel.innerHTML = `
                <div class="panel-header">
                    <div class="panel-title">
                        <span class="icon">🤖</span>
                        <span>Auto-Driller Pro</span>
                        <span class="version">v2.0</span>
                    </div>
                    <button class="minimize-btn" id="minimize-btn">−</button>
                </div>
                <div class="panel-content" id="panel-content">
                    <div class="control-section">
                        <div class="control-row">
                            <span class="label">Auto-Approve</span>
                            <div class="toggle ${CONFIG.autoApprove ? 'active' : ''}" data-setting="autoApprove">
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
        },

        attachStyles: () => {
            GM_addStyle(`
                #perplexity-auto-driller-pro {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: white;
                    width: 340px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 16px;
                }

                .icon {
                    font-size: 20px;
                }

                .version {
                    font-size: 11px;
                    background: rgba(255,255,255,0.2);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .minimize-btn {
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

                .minimize-btn:hover {
                    background: rgba(255,255,255,0.1);
                }

                .panel-content {
                    padding: 20px;
                }

                .panel-content.hidden {
                    display: none;
                }

                .control-section, .settings-section, .stats-section {
                    margin-bottom: 20px;
                }

                .control-row, .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .label {
                    font-size: 14px;
                    font-weight: 500;
                }

                .toggle {
                    position: relative;
                    width: 52px;
                    height: 28px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .toggle.active {
                    background: #10b981;
                }

                .toggle-slider {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .toggle.active .toggle-slider {
                    transform: translateX(24px);
                }

                input[type="number"], input[type="range"] {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    color: white;
                    padding: 6px 10px;
                    font-size: 14px;
                    width: 80px;
                }

                input[type="range"] {
                    width: 120px;
                }

                .range-value {
                    font-size: 12px;
                    margin-left: 8px;
                }

                .stats-section {
                    background: rgba(0,0,0,0.2);
                    padding: 12px;
                    border-radius: 8px;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                    font-size: 13px;
                }

                .stat-value {
                    font-weight: 600;
                }

                .button-section {
                    display: flex;
                    gap: 10px;
                }

                .btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }

                .btn-primary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }

                .btn-primary:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }

                .btn-secondary {
                    background: rgba(16, 185, 129, 0.3);
                    color: white;
                }

                .btn-secondary:hover {
                    background: rgba(16, 185, 129, 0.5);
                    transform: translateY(-2px);
                }

                .panel-minimized .panel-content {
                    display: none;
                }
            `);
        },

        attachEventListeners: () => {
            document.querySelectorAll('.toggle').forEach(toggle => {
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
                document.querySelector('.range-value').textContent = CONFIG.typingSpeed + 'ms';
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
                    timestamp: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `perplexity-session-${Date.now()}.json`;
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
                if (CONFIG.autoApprove) {
                    autoApprove.execute();
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
        utils.log('Initializing Auto-Driller Pro v2.0...');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setTimeout(() => {
            ui.create();
            autoApprove.start();
            drilling.start();
            observer.start();
            ui.updateStatus('System ready');
            utils.log('Initialization complete');
        }, 1500);
    }

    init();

    GM_registerMenuCommand('⚙️ Toggle Auto-Approve', () => {
        CONFIG.autoApprove = !CONFIG.autoApprove;
        utils.saveConfig();
        ui.updateStatus('Auto-approve ' + (CONFIG.autoApprove ? 'enabled' : 'disabled'));
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