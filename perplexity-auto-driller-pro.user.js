// ==UserScript==
// @name         Perplexity Auto-Driller Pro - EMERGENCY FIX
// @namespace    https://github.com/GlacierEQ
// @version      3.2.0
// @description  EMERGENCY: Won't hijack your typing, minimize actually works, no crashes
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

    const CONFIG = {
        enabled: GM_getValue('enabled', true),
        autoApprove: GM_getValue('autoApprove', true),
        autoDrill: GM_getValue('autoDrill', false), // 🔥 OFF BY DEFAULT - USER MUST ENABLE
        maxDrillDepth: GM_getValue('maxDrillDepth', 5),
        drillInterval: GM_getValue('drillInterval', 8000), // 🔥 LONGER INTERVAL
        approveInterval: GM_getValue('approveInterval', 500), // 🔥 SLOWER
        intelligentMode: GM_getValue('intelligentMode', true),
        typingSpeed: GM_getValue('typingSpeed', 50),
        debug: GM_getValue('debug', false), // 🔥 OFF BY DEFAULT
        minimized: GM_getValue('minimized', false)
    };

    const STATE = {
        drillCount: 0,
        isProcessing: false,
        lastDrillTime: 0,
        conversationHistory: [],
        topicCache: new Map(),
        observers: [],
        startTime: Date.now(),
        lastResponseText: '',
        userIsTyping: false, // 🔥 TRACK IF USER IS TYPING
        lastUserActivity: 0
    };

    const DRILL_PATTERNS = {
        deep_analysis: [
            "What are the fundamental principles underlying {topic}?",
            "Can you analyze {topic} from first principles?"
        ],
        practical_application: [
            "Give me a step-by-step guide for {topic}",
            "What are real-world examples of {topic}?"
        ],
        comparative_analysis: [
            "Compare {topic} to alternatives",
            "What are the pros and cons of {topic}?"
        ],
        expert_insights: [
            "What are non-obvious insights about {topic}?",
            "What do experts say about {topic}?"
        ]
    };

    const utils = {
        log: (...args) => {
            if (CONFIG.debug) {
                console.log('[🔥 DRILLER]', ...args);
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
            if (!text || text.length < 20) return 'this topic';
            
            const words = text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 4)
                .slice(0, 5);
            
            return words.slice(0, 2).join(' ') || 'this topic';
        },

        formatTime: (ms) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
            return `${seconds}s`;
        }
    };

    const selectors = {
        approvalButtons: [
            'button[aria-label*="pprove" i]',
            'button[aria-label*="ontinue" i]',
            'button:has-text("Approve")',
            'button:has-text("Continue")'
        ],

        textInput: [
            'textarea[placeholder*="Ask" i]',
            'textarea[role="textbox"]'
        ],

        submitButton: [
            'button[type="submit"]',
            'button[aria-label*="Submit" i]'
        ],

        responseContent: [
            '[class*="answer"]',
            '[class*="response"]',
            'article'
        ],

        loadingIndicators: [
            '[aria-busy="true"]',
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
                    // Continue
                }
            }
            return null;
        },

        isVisible: (element) => {
            if (!element) return false;
            const style = window.getComputedStyle(element);
            return element.offsetParent !== null && 
                   !element.disabled &&
                   style.display !== 'none' &&
                   style.visibility !== 'hidden';
        },

        waitForElement: async (selectorArray, timeout = 3000) => {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const element = dom.findElement(selectorArray);
                if (element) return element;
                await utils.sleep(200);
            }
            return null;
        }
    };

    const autoApprove = {
        clickedButtons: new WeakSet(),

        execute: () => {
            if (!CONFIG.autoApprove) return;

            const approveBtn = dom.findElement(selectors.approvalButtons);
            if (approveBtn && !autoApprove.clickedButtons.has(approveBtn)) {
                utils.log('Clicking approval button');
                approveBtn.click();
                autoApprove.clickedButtons.add(approveBtn);
                ui.updateStatus('✅ Approved');
            }
        }
    };

    const drilling = {
        getResponseText: () => {
            const el = dom.findElement(selectors.responseContent);
            if (!el) return '';
            const text = el.textContent.trim();
            return text.length > 50 ? text : '';
        },

        isResponseComplete: () => {
            const loading = document.querySelector('[aria-busy="true"]');
            return !loading;
        },

        hasNewResponse: () => {
            const currentText = drilling.getResponseText();
            const hasNew = currentText !== STATE.lastResponseText && currentText.length > 0;
            if (hasNew) {
                STATE.lastResponseText = currentText;
                utils.log('New response detected');
            }
            return hasNew;
        },

        generateQuestion: () => {
            const responseText = drilling.getResponseText();
            if (!responseText) return "Tell me more about that";

            const topic = utils.extractMainTopic(responseText);
            const categories = Object.keys(DRILL_PATTERNS);
            const category = categories[Math.floor(Math.random() * categories.length)];
            const patterns = DRILL_PATTERNS[category];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            return pattern.replace('{topic}', topic);
        },

        checkUserActivity: () => {
            const now = Date.now();
            // 🔥 IF USER TYPED IN LAST 10 SECONDS, DON'T DRILL
            if (now - STATE.lastUserActivity < 10000) {
                utils.log('User is active, skipping drill');
                return false;
            }
            return true;
        },

        submit: async () => {
            // 🔥 SAFETY CHECKS
            if (!CONFIG.autoDrill) return false;
            if (STATE.isProcessing) return false;
            if (STATE.drillCount >= CONFIG.maxDrillDepth) {
                utils.log('Max depth reached');
                return false;
            }

            const now = Date.now();
            if (now - STATE.lastDrillTime < CONFIG.drillInterval) return false;
            if (!drilling.isResponseComplete()) return false;
            if (!drilling.hasNewResponse()) return false;
            if (!drilling.checkUserActivity()) return false; // 🔥 CHECK USER ACTIVITY

            STATE.isProcessing = true;
            ui.updateStatus('🔄 Processing...');

            try {
                await utils.sleep(1000); // 🔥 WAIT BEFORE DOING ANYTHING

                const input = await dom.waitForElement(selectors.textInput, 2000);
                if (!input) {
                    utils.log('Input not found');
                    return false;
                }

                // 🔥 CHECK IF INPUT HAS TEXT (USER MIGHT BE TYPING)
                if (input.value && input.value.length > 0) {
                    utils.log('Input has text, user might be typing');
                    return false;
                }

                const question = drilling.generateQuestion();
                utils.log('Typing question:', question);
                ui.updateStatus('⌨️ Typing...');

                input.focus();
                await utils.sleep(300);
                input.value = question;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await utils.sleep(500);

                const submitBtn = dom.findElement(selectors.submitButton);
                if (!submitBtn) {
                    utils.log('Submit button not found');
                    return false;
                }

                submitBtn.click();
                
                STATE.drillCount++;
                STATE.lastDrillTime = now;
                ui.updateDrillCount(STATE.drillCount);
                ui.updateStatus(`🚀 Drill ${STATE.drillCount} sent`);
                utils.log('Drill submitted:', question);

                return true;

            } catch (error) {
                utils.log('Error:', error);
                ui.updateStatus('❌ Error');
                return false;
            } finally {
                STATE.isProcessing = false;
            }
        }
    };

    const ui = {
        panel: null,

        create: () => {
            const panel = document.createElement('div');
            panel.id = 'driller-panel';
            panel.innerHTML = `
                <div class="panel-header" id="panel-header">
                    <div class="panel-title">
                        <span class="icon">🔥</span>
                        <span>Driller</span>
                        <span class="version">v3.2</span>
                    </div>
                    <button class="minimize-btn" id="minimize-btn">−</button>
                </div>
                <div class="panel-content" id="panel-content">
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
                    </div>

                    <div class="settings-section">
                        <div class="setting-row">
                            <label>Max Depth</label>
                            <input type="number" id="max-depth" value="${CONFIG.maxDrillDepth}" min="1" max="10">
                        </div>
                        <div class="setting-row">
                            <label>Interval (s)</label>
                            <input type="number" id="interval" value="${CONFIG.drillInterval / 1000}" min="5" max="30">
                        </div>
                    </div>

                    <div class="stats-section">
                        <div class="stat-item">
                            <span>🎯 Drills:</span>
                            <span id="drill-count">0</span>
                        </div>
                        <div class="stat-item">
                            <span>📊 Status:</span>
                            <span id="status">Idle</span>
                        </div>
                        <div class="stat-item">
                            <span>⏱️ Uptime:</span>
                            <span id="uptime">0s</span>
                        </div>
                    </div>

                    <button class="btn btn-reset" id="reset-btn">🔄 Reset</button>
                </div>
            `;

            document.body.appendChild(panel);
            ui.panel = panel;
            ui.attachStyles();
            ui.attachEventListeners();
            ui.applyMinimizeState();
            ui.startUptimeCounter();
        },

        applyMinimizeState: () => {
            const content = document.getElementById('panel-content');
            const btn = document.getElementById('minimize-btn');
            
            if (CONFIG.minimized) {
                content.style.display = 'none';
                btn.textContent = '+';
            } else {
                content.style.display = 'block';
                btn.textContent = '−';
            }
        },

        attachStyles: () => {
            GM_addStyle(`
                #driller-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: -apple-system, sans-serif;
                    color: white;
                    width: 320px;
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    cursor: move;
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
                    font-size: 10px;
                    background: rgba(255,255,255,0.2);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .minimize-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    line-height: 1;
                    padding: 0;
                }

                .minimize-btn:hover {
                    background: rgba(255,255,255,0.3);
                }

                .panel-content {
                    padding: 16px;
                }

                .control-section, .settings-section, .stats-section {
                    margin-bottom: 16px;
                }

                .control-row, .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: rgba(0,0,0,0.15);
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .label {
                    font-size: 14px;
                    font-weight: 500;
                }

                .toggle {
                    position: relative;
                    width: 48px;
                    height: 26px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 13px;
                    cursor: pointer;
                }

                .toggle.active {
                    background: #10b981;
                }

                .toggle-slider {
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }

                .toggle.active .toggle-slider {
                    transform: translateX(22px);
                }

                input[type="number"] {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    color: white;
                    padding: 6px 10px;
                    font-size: 14px;
                    width: 60px;
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

                .btn {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                }

                .btn-reset {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }

                .btn-reset:hover {
                    background: rgba(255,255,255,0.3);
                }
            `);
        },

        attachEventListeners: () => {
            // 🔥 TRACK USER TYPING
            document.addEventListener('keydown', () => {
                STATE.lastUserActivity = Date.now();
            });

            document.addEventListener('input', () => {
                STATE.lastUserActivity = Date.now();
            });

            // Toggles
            document.querySelectorAll('.toggle').forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    const setting = e.currentTarget.dataset.setting;
                    CONFIG[setting] = !CONFIG[setting];
                    toggle.classList.toggle('active');
                    utils.saveConfig();
                    ui.updateStatus(setting + (CONFIG[setting] ? ' ON' : ' OFF'));
                });
            });

            // Settings
            document.getElementById('max-depth').addEventListener('change', (e) => {
                CONFIG.maxDrillDepth = parseInt(e.target.value);
                utils.saveConfig();
            });

            document.getElementById('interval').addEventListener('change', (e) => {
                CONFIG.drillInterval = parseFloat(e.target.value) * 1000;
                utils.saveConfig();
            });

            // Reset
            document.getElementById('reset-btn').addEventListener('click', () => {
                STATE.drillCount = 0;
                STATE.conversationHistory = [];
                STATE.lastResponseText = '';
                ui.updateDrillCount(0);
                ui.updateStatus('Reset');
            });

            // 🔥 MINIMIZE BUTTON - SIMPLE VERSION
            document.getElementById('minimize-btn').addEventListener('click', () => {
                const content = document.getElementById('panel-content');
                const btn = document.getElementById('minimize-btn');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    btn.textContent = '−';
                    CONFIG.minimized = false;
                } else {
                    content.style.display = 'none';
                    btn.textContent = '+';
                    CONFIG.minimized = true;
                }
                
                utils.saveConfig();
            });

            // Draggable
            let isDragging = false;
            let currentX, currentY, initialX, initialY;

            const header = document.getElementById('panel-header');
            header.addEventListener('mousedown', (e) => {
                if (e.target.id === 'minimize-btn') return;
                isDragging = true;
                initialX = e.clientX - ui.panel.offsetLeft;
                initialY = e.clientY - ui.panel.offsetTop;
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    ui.panel.style.left = currentX + 'px';
                    ui.panel.style.top = currentY + 'px';
                    ui.panel.style.right = 'auto';
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        },

        updateDrillCount: (count) => {
            const el = document.getElementById('drill-count');
            if (el) el.textContent = count;
        },

        updateStatus: (message) => {
            const el = document.getElementById('status');
            if (el) el.textContent = message;
        },

        startUptimeCounter: () => {
            setInterval(() => {
                const uptime = Date.now() - STATE.startTime;
                const el = document.getElementById('uptime');
                if (el) el.textContent = utils.formatTime(uptime);
            }, 1000);
        }
    };

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setTimeout(() => {
            ui.create();
            ui.updateStatus('Ready');
            
            // Auto-approve check
            setInterval(() => {
                if (CONFIG.autoApprove) {
                    autoApprove.execute();
                }
            }, CONFIG.approveInterval);

            // Drilling loop
            setInterval(async () => {
                if (CONFIG.autoDrill) {
                    await drilling.submit();
                }
            }, CONFIG.drillInterval);

        }, 1000);
    }

    init();

})();