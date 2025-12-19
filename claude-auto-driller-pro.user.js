// ==UserScript==
// @name         Claude Auto-Driller Pro - Ultimate Edition
// @namespace    https://github.com/GlacierEQ
// @version      2.0.0
// @description  Advanced automation for Claude AI: intelligent drilling, auto-continue, context awareness, and AI-powered follow-ups
// @author       GlacierEQ Team
// @match        https://claude.ai/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/claude-auto-driller-pro.user.js
// @downloadURL  https://raw.githubusercontent.com/GlacierEQ/chatgpt_infinity/main/claude-auto-driller-pro.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        enabled: GM_getValue('enabled', true),
        autoContinue: GM_getValue('autoContinue', true),
        autoDrill: GM_getValue('autoDrill', false),
        maxDrillDepth: GM_getValue('maxDrillDepth', 5),
        drillInterval: GM_getValue('drillInterval', 5000),
        continueInterval: GM_getValue('continueInterval', 500),
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

    const DRILL_PATTERNS = {
        clarification: [
            "Can you elaborate on {topic} with specific examples?",
            "What are the nuances of {topic} that beginners often miss?",
            "Could you break down {topic} into simpler components?",
            "What are some real-world examples of {topic}?",
            "Can you explain {topic} in more detail?"
        ],
        depth: [
            "What are the underlying principles behind {topic}?",
            "How has {topic} evolved over the past decade?",
            "What are the cutting-edge developments in {topic}?",
            "What are the theoretical foundations of {topic}?",
            "How does {topic} work at a deeper level?"
        ],
        practical: [
            "What are real-world applications of {topic}?",
            "How can I implement {topic} in a production environment?",
            "What tools or frameworks are best for {topic}?",
            "Can you provide a step-by-step guide for {topic}?",
            "What are common use cases for {topic}?"
        ],
        comparative: [
            "How does {topic} compare to similar alternatives?",
            "What are the advantages and disadvantages of {topic}?",
            "When should I choose {topic} over other options?",
            "What makes {topic} different from related concepts?",
            "How does {topic} stack up against competitors?"
        ],
        future: [
            "What's the future outlook for {topic}?",
            "What emerging trends are shaping {topic}?",
            "How will {topic} change by 2030?",
            "What innovations are happening in {topic}?",
            "What's next for {topic}?"
        ],
        technical: [
            "What are the technical specifications of {topic}?",
            "What are common pitfalls when working with {topic}?",
            "What are best practices for {topic}?",
            "What are the performance implications of {topic}?",
            "How do experts optimize {topic}?"
        ]
    };

    const utils = {
        log: (...args) => CONFIG.debug && console.log('[Claude AutoDriller]', new Date().toISOString(), ...args),
        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        randomDelay: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        saveConfig: () => Object.keys(CONFIG).forEach(key => GM_setValue(key, CONFIG[key])),
        
        extractMainTopic: (text) => {
            if (STATE.topicCache.has(text)) return STATE.topicCache.get(text);
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
            if (sentences.length === 0) return 'this topic';
            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
            const words = sentences[0].toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));
            const topic = words.slice(0, 3).join(' ') || 'this topic';
            STATE.topicCache.set(text, topic);
            return topic;
        },
        
        formatTime: (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
        }
    };

    const selectors = {
        continueButtons: [
            'button:has-text("Continue")',
            'button[class*="continue"]',
            'button:has-text("Keep going")',
            'button:has-text("Resume")'
        ],
        textInput: [
            'div[contenteditable="true"][role="textbox"]',
            'textarea',
            'div.ProseMirror'
        ],
        submitButton: [
            'button[aria-label*="Send"]',
            'button:has(svg)',
            'button[type="submit"]'
        ],
        responseContent: [
            'div[class*="font-claude"]',
            'div[class*="prose"]',
            'article',
            'div[class*="markdown"]'
        ],
        loadingIndicators: [
            '[class*="animate-pulse"]',
            '[class*="loading"]'
        ]
    };

    const dom = {
        findElement: (selectorArray) => {
            for (const selector of selectorArray) {
                try {
                    if (selector.includes(':has-text')) {
                        const match = selector.match(/^(.+?):has-text\("(.+?)"\)$/);
                        if (match) {
                            const [, baseSelector, text] = match;
                            const elements = document.querySelectorAll(baseSelector);
                            const element = Array.from(elements).find(el => 
                                el.textContent.trim().toLowerCase().includes(text.toLowerCase())
                            );
                            if (element && dom.isVisible(element)) return element;
                        }
                    } else {
                        const element = document.querySelector(selector);
                        if (element && dom.isVisible(element)) return element;
                    }
                } catch (e) {
                    utils.log('Selector error:', selector, e.message);
                }
            }
            return null;
        },
        
        isVisible: (element) => {
            return element && element.offsetParent !== null && !element.disabled &&
                   window.getComputedStyle(element).display !== 'none';
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

    const autoContinue = {
        clickedButtons: new WeakSet(),
        
        execute: () => {
            if (!CONFIG.autoContinue) return;
            const buttons = document.querySelectorAll(selectors.continueButtons.join(', '));
            buttons.forEach(button => {
                if (dom.isVisible(button) && !autoContinue.clickedButtons.has(button)) {
                    utils.log('Clicking continue button');
                    button.click();
                    autoContinue.clickedButtons.add(button);
                    ui.updateStatus('Clicked continue');
                }
            });
        },
        
        start: () => {
            setInterval(autoContinue.execute, CONFIG.continueInterval);
            utils.log('Auto-continue started');
        }
    };

    const drilling = {
        getResponseText: () => {
            const contentEls = document.querySelectorAll(selectors.responseContent.join(', '));
            if (contentEls.length === 0) return '';
            const lastMessage = Array.from(contentEls).pop();
            return lastMessage ? lastMessage.textContent.trim() : '';
        },
        
        isResponseComplete: () => {
            const loadingEls = document.querySelectorAll(selectors.loadingIndicators.join(', '));
            return loadingEls.length === 0;
        },
        
        selectPattern: () => {
            const categories = Object.keys(DRILL_PATTERNS);
            const weights = [4, 3, 3, 2, 1, 1];
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
            return patterns[Math.floor(Math.random() * patterns.length)];
        },
        
        generateQuestion: () => {
            const responseText = drilling.getResponseText();
            if (!responseText) return "Can you provide more details?";
            const topic = utils.extractMainTopic(responseText);
            const pattern = drilling.selectPattern();
            return pattern.replace('{topic}', topic);
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
                await utils.sleep(utils.randomDelay(CONFIG.typingSpeed - 20, CONFIG.typingSpeed + 30));
            }
        },
        
        submit: async () => {
            if (STATE.isProcessing || STATE.drillCount >= CONFIG.maxDrillDepth) return false;
            const now = Date.now();
            if (now - STATE.lastDrillTime < CONFIG.drillInterval) return false;
            if (!drilling.isResponseComplete()) return false;
            
            STATE.isProcessing = true;
            ui.updateStatus('Processing...');
            
            try {
                const input = await dom.waitForElement(selectors.textInput, 3000);
                if (!input) {
                    ui.updateStatus('Error: Input not found');
                    return false;
                }
                
                const question = drilling.generateQuestion();
                ui.updateStatus('Typing question...');
                await drilling.typeIntoInput(input, question);
                await utils.sleep(utils.randomDelay(500, 1000));
                
                const submitBtn = dom.findElement(selectors.submitButton);
                if (submitBtn) submitBtn.click();
                
                STATE.drillCount++;
                STATE.lastDrillTime = now;
                ui.updateDrillCount(STATE.drillCount);
                ui.updateStatus(`Drill ${STATE.drillCount} submitted`);
                utils.log(`Submitted drill #${STATE.drillCount}:`, question);
                
                return true;
            } catch (error) {
                utils.log('Error:', error);
                ui.updateStatus('Error: ' + error.message);
                return false;
            } finally {
                STATE.isProcessing = false;
            }
        },
        
        start: () => {
            setInterval(async () => {
                if (CONFIG.autoDrill) await drilling.submit();
            }, CONFIG.drillInterval);
            utils.log('Drilling system started');
        }
    };

    const ui = {
        panel: null,
        
        create: () => {
            const panel = document.createElement('div');
            panel.id = 'claude-auto-driller-pro';
            panel.innerHTML = `
                <div class="panel-header">
                    <div class="panel-title">
                        <span class="icon">🤖</span>
                        <span>Claude Driller</span>
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
        },
        
        attachStyles: () => {
            GM_addStyle(`
                #claude-auto-driller-pro {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #cc785c 0%, #e07b39 100%);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: white;
                    width: 340px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                #claude-auto-driller-pro .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                #claude-auto-driller-pro .panel-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 16px;
                }
                #claude-auto-driller-pro .minimize-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    border-radius: 6px;
                }
                #claude-auto-driller-pro .panel-content {
                    padding: 20px;
                }
                #claude-auto-driller-pro .control-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    margin-bottom: 8px;
                }
                #claude-auto-driller-pro .toggle {
                    width: 52px;
                    height: 28px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 14px;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.3s;
                }
                #claude-auto-driller-pro .toggle.active {
                    background: #f59e0b;
                }
                #claude-auto-driller-pro .toggle-slider {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.3s;
                }
                #claude-auto-driller-pro .toggle.active .toggle-slider {
                    transform: translateX(24px);
                }
                #claude-auto-driller-pro input {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    color: white;
                    padding: 6px 10px;
                    width: 80px;
                }
                #claude-auto-driller-pro .stats-section {
                    background: rgba(0,0,0,0.2);
                    padding: 12px;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                #claude-auto-driller-pro .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                }
                #claude-auto-driller-pro .btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    margin: 0 5px;
                }
                #claude-auto-driller-pro .btn-primary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }
                #claude-auto-driller-pro .button-section {
                    display: flex;
                }
            `);
        },
        
        attachEventListeners: () => {
            document.querySelectorAll('#claude-auto-driller-pro .toggle').forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    const setting = e.currentTarget.dataset.setting;
                    CONFIG[setting] = !CONFIG[setting];
                    toggle.classList.toggle('active');
                    utils.saveConfig();
                });
            });
            
            document.getElementById('reset-btn').addEventListener('click', () => {
                STATE.drillCount = 0;
                ui.updateDrillCount(0);
            });
            
            document.getElementById('export-btn').addEventListener('click', () => {
                const data = {drillCount: STATE.drillCount, config: CONFIG};
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `claude-session-${Date.now()}.json`;
                a.click();
            });
            
            document.getElementById('minimize-btn').addEventListener('click', () => {
                document.getElementById('panel-content').classList.toggle('hidden');
            });
        },
        
        updateDrillCount: (count) => {
            const el = document.getElementById('drill-count');
            if (el) el.textContent = count;
        },
        
        updateStatus: (message) => {
            const el = document.getElementById('status');
            if (el) el.textContent = message;
        }
    };

    function init() {
        utils.log('Initializing Claude Auto-Driller Pro v2.0...');
        setTimeout(() => {
            ui.create();
            autoContinue.start();
            drilling.start();
            ui.updateStatus('System ready');
        }, 2000);
    }

    init();
})();