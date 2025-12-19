// ==UserScript==
// @name         Notion Auto-Driller Pro - Ultimate Edition
// @namespace    https://github.com/GlacierEQ
// @version      2.0.0
// @description  Advanced automation for Notion AI: intelligent drilling, auto-expand, context awareness, and AI-powered follow-ups
// @author       GlacierEQ Team
// @match        https://www.notion.so/*
// @match        https://notion.so/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/notion-auto-driller-pro.user.js
// @downloadURL  https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/notion-auto-driller-pro.user.js
// ==/UserScript==

(function() {
    'use strict';

    /* ==========================================
       CONFIGURATION & STATE MANAGEMENT
       ========================================== */
    const CONFIG = {
        enabled: GM_getValue('enabled', true),
        autoExpand: GM_getValue('autoExpand', true),
        autoDrill: GM_getValue('autoDrill', false),
        maxDrillDepth: GM_getValue('maxDrillDepth', 5),
        drillInterval: GM_getValue('drillInterval', 6000),
        expandInterval: GM_getValue('expandInterval', 500),
        intelligentMode: GM_getValue('intelligentMode', true),
        typingSpeed: GM_getValue('typingSpeed', 60),
        debug: GM_getValue('debug', false)
    };

    const STATE = {
        drillCount: 0,
        isProcessing: false,
        lastDrillTime: 0,
        conversationHistory: [],
        topicCache: new Map(),
        observers: [],
        notionAIActive: false
    };

    // Notion-specific drill patterns
    const DRILL_PATTERNS = {
        clarification: [
            "Can you elaborate on {topic} with specific examples?",
            "What are the key nuances of {topic}?",
            "Could you break down {topic} into simpler components?",
            "What details about {topic} should I know?",
            "Can you explain {topic} more thoroughly?"
        ],
        depth: [
            "What are the underlying principles of {topic}?",
            "How does {topic} work in practice?",
            "What's the theory behind {topic}?",
            "What are the core concepts of {topic}?",
            "How can I understand {topic} deeply?"
        ],
        practical: [
            "What are practical applications of {topic}?",
            "How can I implement {topic}?",
            "What are actionable steps for {topic}?",
            "How do I use {topic} effectively?",
            "What's a practical guide to {topic}?"
        ],
        comparative: [
            "How does {topic} compare to alternatives?",
            "What are pros and cons of {topic}?",
            "When should I use {topic}?",
            "What makes {topic} different?",
            "How does {topic} stack up?"
        ],
        future: [
            "What's the future of {topic}?",
            "What trends affect {topic}?",
            "How will {topic} evolve?",
            "What innovations are happening in {topic}?",
            "What's next for {topic}?"
        ],
        technical: [
            "What are technical aspects of {topic}?",
            "What are common challenges with {topic}?",
            "What are best practices for {topic}?",
            "How do experts approach {topic}?",
            "What technical details of {topic} matter?"
        ],
        structured: [
            "Can you create a structured outline for {topic}?",
            "What's a step-by-step breakdown of {topic}?",
            "Can you organize information about {topic}?",
            "What's a hierarchical view of {topic}?",
            "Can you structure {topic} into sections?"
        ],
        creative: [
            "What creative approaches exist for {topic}?",
            "How can I innovate with {topic}?",
            "What unique perspectives on {topic} exist?",
            "What creative solutions involve {topic}?",
            "How can {topic} be used creatively?"
        ]
    };

    /* ==========================================
       UTILITY FUNCTIONS
       ========================================== */
    const utils = {
        log: (...args) => {
            if (CONFIG.debug) {
                console.log('[Notion AutoDriller]', new Date().toISOString(), ...args);
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
        }
    };

    /* ==========================================
       DOM SELECTORS & ELEMENT FINDERS
       ========================================== */
    const selectors = {
        expandButtons: [
            'button:has-text("Continue")',
            'button:has-text("Keep writing")',
            'button:has-text("Continue writing")',
            'button[class*="continue"]',
            'div[role="button"]:has-text("Continue")'
        ],

        notionAIInput: [
            'div[contenteditable="true"][data-content-editable-leaf="true"]',
            'div[contenteditable="true"][role="textbox"]',
            'div[data-content-editable-void="true"]',
            'div[placeholder*="Tell AI"]',
            'div[placeholder*="Ask AI"]'
        ],

        notionAITrigger: [
            'div[data-ai-button="true"]',
            'button[aria-label*="AI"]',
            'div[class*="aiButton"]'
        ],

        aiResponse: [
            'div[data-block-id]',
            'div[class*="notion-ai"]',
            'div[data-ai-block="true"]',
            'div[class*="aiContent"]'
        ],

        loadingIndicators: [
            'div[class*="loading"]',
            'div[class*="spinner"]',
            'div[aria-label*="Loading"]'
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
                   !element.hasAttribute('disabled') &&
                   window.getComputedStyle(element).display !== 'none' &&
                   window.getComputedStyle(element).visibility !== 'hidden' &&
                   window.getComputedStyle(element).opacity !== '0';
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

        findNotionAI: () => {
            // Check if Notion AI panel is open
            const aiPanel = document.querySelector('div[data-ai-panel="true"]') ||
                          document.querySelector('div[class*="notionAI"]') ||
                          document.querySelector('div[role="dialog"][aria-label*="AI"]');
            
            STATE.notionAIActive = !!aiPanel;
            return aiPanel;
        }
    };

    /* ==========================================
       AUTO-EXPAND SYSTEM (for AI responses)
       ========================================== */
    const autoExpand = {
        clickedButtons: new WeakSet(),

        execute: () => {
            if (!CONFIG.autoExpand) return;

            const buttons = document.querySelectorAll(
                selectors.expandButtons.join(', ')
            );

            let clickCount = 0;
            buttons.forEach(button => {
                if (dom.isVisible(button) && !autoExpand.clickedButtons.has(button)) {
                    try {
                        utils.log('Clicking expand button:', button.textContent.trim());
                        button.click();
                        autoExpand.clickedButtons.add(button);
                        clickCount++;
                        ui.updateStatus('Clicked expand button');
                    } catch (e) {
                        utils.log('Error clicking button:', e);
                    }
                }
            });

            return clickCount;
        },

        start: () => {
            setInterval(autoExpand.execute, CONFIG.expandInterval);
            utils.log('Auto-expand system started');
        }
    };

    /* ==========================================
       INTELLIGENT DRILLING SYSTEM
       ========================================== */
    const drilling = {
        getResponseText: () => {
            // Get latest AI response or page content
            const aiBlocks = document.querySelectorAll(selectors.aiResponse.join(', '));
            if (aiBlocks.length > 0) {
                const lastBlock = Array.from(aiBlocks).pop();
                return lastBlock ? lastBlock.textContent.trim() : '';
            }

            // Fallback to general page content
            const contentBlock = document.querySelector('div[data-block-id]');
            return contentBlock ? contentBlock.textContent.trim() : '';
        },

        isResponseComplete: () => {
            const loadingEls = document.querySelectorAll(
                selectors.loadingIndicators.join(', ')
            );
            
            return loadingEls.length === 0;
        },

        selectPattern: () => {
            const categories = Object.keys(DRILL_PATTERNS);
            // Weights: structured=4, clarification=3, practical=3, depth=2, others=1
            const weights = [3, 2, 3, 1, 1, 1, 4, 1];

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

        invokeNotionAI: async (question) => {
            // Method 1: Try keyboard shortcut (Cmd/Ctrl + J)
            const event = new KeyboardEvent('keydown', {
                key: 'j',
                code: 'KeyJ',
                keyCode: 74,
                which: 74,
                ctrlKey: !navigator.platform.includes('Mac'),
                metaKey: navigator.platform.includes('Mac'),
                bubbles: true
            });
            
            document.dispatchEvent(event);
            await utils.sleep(500);

            // Method 2: Find and click AI button
            const aiButton = dom.findElement(selectors.notionAITrigger);
            if (aiButton) {
                aiButton.click();
                await utils.sleep(500);
            }

            return true;
        },

        typeIntoNotionAI: async (question) => {
            const input = await dom.waitForElement(selectors.notionAIInput, 3000);
            if (!input) {
                utils.log('Notion AI input not found');
                return false;
            }

            input.focus();
            input.textContent = '';

            // Type character by character
            for (let i = 0; i < question.length; i++) {
                const char = question[i];
                input.textContent += char;
                
                // Dispatch events
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new InputEvent('beforeinput', { 
                    bubbles: true, 
                    data: char 
                }));
                
                await utils.sleep(utils.randomDelay(
                    CONFIG.typingSpeed - 20, 
                    CONFIG.typingSpeed + 30
                ));
            }

            // Final event
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        },

        submitToNotionAI: async () => {
            // Press Enter to submit
            const input = dom.findElement(selectors.notionAIInput);
            if (!input) return false;

            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
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
                ui.updateStatus('Invoking Notion AI...');
                
                await drilling.invokeNotionAI(question);
                await utils.sleep(1000);

                ui.updateStatus('Typing question...');
                const typed = await drilling.typeIntoNotionAI(question);
                
                if (!typed) {
                    ui.updateStatus('Error: Could not type');
                    return false;
                }

                await utils.sleep(utils.randomDelay(500, 1000));

                ui.updateStatus('Submitting...');
                await drilling.submitToNotionAI();

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
            panel.id = 'notion-auto-driller-pro';
            panel.innerHTML = `
                <div class="panel-header">
                    <div class="panel-title">
                        <span class="icon">📝</span>
                        <span>Notion Driller</span>
                        <span class="version">v2.0</span>
                    </div>
                    <button class="minimize-btn" id="minimize-btn">−</button>
                </div>
                <div class="panel-content" id="panel-content">
                    <div class="control-section">
                        <div class="control-row">
                            <span class="label">Auto-Expand</span>
                            <div class="toggle ${CONFIG.autoExpand ? 'active' : ''}" data-setting="autoExpand">
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
                #notion-auto-driller-pro {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #000000 0%, #2d2d2d 100%);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: white;
                    width: 340px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                #notion-auto-driller-pro .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                #notion-auto-driller-pro .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 16px;
                }

                #notion-auto-driller-pro .icon {
                    font-size: 20px;
                }

                #notion-auto-driller-pro .version {
                    font-size: 11px;
                    background: rgba(255,255,255,0.2);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                #notion-auto-driller-pro .minimize-btn {
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

                #notion-auto-driller-pro .minimize-btn:hover {
                    background: rgba(255,255,255,0.1);
                }

                #notion-auto-driller-pro .panel-content {
                    padding: 20px;
                }

                #notion-auto-driller-pro .panel-content.hidden {
                    display: none;
                }

                #notion-auto-driller-pro .control-section, 
                #notion-auto-driller-pro .settings-section, 
                #notion-auto-driller-pro .stats-section {
                    margin-bottom: 20px;
                }

                #notion-auto-driller-pro .control-row, 
                #notion-auto-driller-pro .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                #notion-auto-driller-pro .label {
                    font-size: 14px;
                    font-weight: 500;
                }

                #notion-auto-driller-pro .toggle {
                    position: relative;
                    width: 52px;
                    height: 28px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                #notion-auto-driller-pro .toggle.active {
                    background: #eb5757;
                }

                #notion-auto-driller-pro .toggle-slider {
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

                #notion-auto-driller-pro .toggle.active .toggle-slider {
                    transform: translateX(24px);
                }

                #notion-auto-driller-pro input[type="number"], 
                #notion-auto-driller-pro input[type="range"] {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    color: white;
                    padding: 6px 10px;
                    font-size: 14px;
                    width: 80px;
                }

                #notion-auto-driller-pro input[type="range"] {
                    width: 120px;
                }

                #notion-auto-driller-pro .range-value {
                    font-size: 12px;
                    margin-left: 8px;
                }

                #notion-auto-driller-pro .stats-section {
                    background: rgba(0,0,0,0.3);
                    padding: 12px;
                    border-radius: 8px;
                }

                #notion-auto-driller-pro .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                    font-size: 13px;
                }

                #notion-auto-driller-pro .stat-value {
                    font-weight: 600;
                }

                #notion-auto-driller-pro .button-section {
                    display: flex;
                    gap: 10px;
                }

                #notion-auto-driller-pro .btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }

                #notion-auto-driller-pro .btn-primary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }

                #notion-auto-driller-pro .btn-primary:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }

                #notion-auto-driller-pro .btn-secondary {
                    background: rgba(235, 87, 87, 0.3);
                    color: white;
                }

                #notion-auto-driller-pro .btn-secondary:hover {
                    background: rgba(235, 87, 87, 0.5);
                    transform: translateY(-2px);
                }
            `);
        },

        attachEventListeners: () => {
            document.querySelectorAll('#notion-auto-driller-pro .toggle').forEach(toggle => {
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
                document.querySelector('#notion-auto-driller-pro .range-value').textContent = CONFIG.typingSpeed + 'ms';
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
                a.download = `notion-session-${Date.now()}.json`;
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
                if (CONFIG.autoExpand) {
                    autoExpand.execute();
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
        utils.log('Initializing Notion Auto-Driller Pro v2.0...');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setTimeout(() => {
            ui.create();
            autoExpand.start();
            drilling.start();
            observer.start();
            ui.updateStatus('System ready');
            utils.log('Initialization complete');
        }, 2000);
    }

    init();

    GM_registerMenuCommand('⚙️ Toggle Auto-Expand', () => {
        CONFIG.autoExpand = !CONFIG.autoExpand;
        utils.saveConfig();
        ui.updateStatus('Auto-expand ' + (CONFIG.autoExpand ? 'enabled' : 'disabled'));
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