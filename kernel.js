/**
 * InternetOS Kernel — The Heart of InternetOS
 *
 * Internet-Native Operating System Kernel
 * Works on Linux, Android, iOS/Apple, and Desktop
 * Powered by NeuralChip™ Internet Native Core
 *
 * This kernel boots directly onto the internet.
 * There is no offline mode. The network IS the computer.
 */

'use strict';

const EventEmitter = require('events');
const path = require('path');
const os = require('os');

// ─── Core Modules ───────────────────────────────────────────────────────────
const NeuralChip = require('./neuralchip');
const InternetNativeCore = require('./internet-native-core');
const AIEngine = require('./ai-engine');

// ─── Subsystems ─────────────────────────────────────────────────────────────
const FileSystem = require('../modules/filesystem');
const Network = require('../modules/network');
const ProcessManager = require('../modules/process-manager');
const PackageManager = require('../modules/package-manager');
const GitIntegration = require('../git/git-integration');
const RepoManager = require('../git/repo-manager');
const Terminal = require('../console/terminal');

// ─── Platform Detection ────────────────────────────────────────────────────
const PlatformAdapter = require('../platform/adapter');

/**
 * InternetOS Kernel Class
 *
 * This is the main kernel that boots the entire InternetOS system.
 * It initializes all subsystems, connects to the internet, and
 * launches the appropriate platform interface.
 */
class InternetOSKernel extends EventEmitter {
  constructor(config = {}) {
    super();

    this.version = '1.0.0';
    this.codename = 'NeuralChip';
    this.bootTime = null;
    this.uptime = 0;
    this.state = 'STOPPED'; // STOPPED | BOOTING | RUNNING | SHUTDOWN
    this.platform = null;
    this.config = this._loadConfig(config);

    // Core components (initialized during boot)
    this.neuralChip = null;
    this.internetNativeCore = null;
    this.aiEngine = null;
    this.filesystem = null;
    this.network = null;
    this.processManager = null;
    this.packageManager = null;
    this.gitIntegration = null;
    this.repoManager = null;
    this.terminal = null;

    // Platform adapter
    this.platformAdapter = null;

    // Kernel logs
    this.logs = [];
    this.bootLog = [];
  }

  /**
   * Load configuration from environment, config files, and defaults
   */
  _loadConfig(userConfig) {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();

    return {
      hostname: userConfig.hostname || process.env.IOS_HOSTNAME || 'internetos',
      platform: userConfig.platform || this._detectPlatform(),
      arch: userConfig.arch || arch,
      debug: userConfig.debug || process.env.IOS_DEBUG === 'true' || false,
      port: userConfig.port || parseInt(process.env.IOS_PORT, 10) || 3000,
      neuralChip: {
        enabled: userConfig.neuralChip?.enabled !== false,
        model: userConfig.neuralChip?.model || 'neuralchip-v2',
        autoFork: userConfig.neuralChip?.autoFork !== false,
        autoIngest: userConfig.neuralChip?.autoIngest !== false,
        learningRate: userConfig.neuralChip?.learningRate || 0.01,
      },
      internetNative: {
        alwaysOnline: true,
        peerDiscovery: true,
        meshNetworking: userConfig.internetNative?.meshNetworking !== false,
        cdnEnabled: true,
      },
      git: {
        defaultRemote: userConfig.git?.defaultRemote || 'origin',
        autoCommit: userConfig.git?.autoCommit !== false,
        autoPush: userConfig.git?.autoPush !== false,
        username: userConfig.git?.username || process.env.GIT_USERNAME || 'internetos',
        email: userConfig.git?.email || process.env.GIT_EMAIL || 'os@internetos.dev',
      },
      ai: {
        provider: userConfig.ai?.provider || 'openai',
        model: userConfig.ai?.model || 'gpt-4',
        temperature: userConfig.ai?.temperature || 0.7,
        maxTokens: userConfig.ai?.maxTokens || 4096,
      },
      ...userConfig,
    };
  }

  /**
   * Detect the running platform
   */
  _detectPlatform() {
    const p = os.platform();
    switch (p) {
      case 'linux':
        return 'linux';
      case 'android':
        return 'android';
      case 'darwin':
        return 'apple'; // macOS / iOS base
      case 'win32':
        return 'desktop';
      default:
        return 'desktop';
    }
  }

  /**
   * BOOT SEQUENCE
   *
   * This is the main boot sequence for InternetOS.
   * It brings the entire system online, connects to the internet,
   * and initializes all subsystems.
   */
  async boot() {
    if (this.state === 'RUNNING') {
      this.log('InternetOS is already running.', 'warn');
      return this;
    }

    this.state = 'BOOTING';
    this.bootTime = Date.now();
    this.bootLog = [];

    this._bootLog('═══════════════════════════════════════════');
    this._bootLog('  InternetOS v' + this.version);
    this._bootLog('  Codename: ' + this.codename);
    this._bootLog('  "The OS that IS the Internet."');
    this._bootLog('═══════════════════════════════════════════');

    try {
      // Phase 1: Platform Detection & Adapter
      await this._bootPhase1_Platform();

      // Phase 2: Core Subsystems
      await this._bootPhase2_CoreSubsystems();

      // Phase 3: NeuralChip Initialization
      await this._bootPhase3_NeuralChip();

      // Phase 4: AI Engine
      await this._bootPhase4_AIEngine();

      // Phase 5: Internet-Native Core
      await this._bootPhase5_InternetNative();

      // Phase 6: Git & Repo System
      await this._bootPhase6_GitSystem();

      // Phase 7: Package Manager
      await this._bootPhase7_PackageManager();

      // Phase 8: Console & Terminal
      await this._bootPhase8_Console();

      // Phase 9: Network Services
      await this._bootPhase9_Network();

      // Phase 10: Finalize Boot
      await this._bootPhase10_Finalize();

      this.state = 'RUNNING';
      this._bootLog('═══════════════════════════════════════════');
      this._bootLog('  InternetOS is NOW LIVE ON THE INTERNET');
      this._bootLog('  Platform: ' + this.platform.toUpperCase());
      this._bootLog('  NeuralChip: ACTIVE');
      this._bootLog('  AI Engine: ONLINE');
      this._bootLog('  Internet-Native: CONNECTED');
      this._bootLog('═══════════════════════════════════════════');

      this.emit('booted', { platform: this.platform, bootTime: this.bootTime });
    } catch (error) {
      this.state = 'STOPPED';
      this._bootLog('BOOT FAILED: ' + error.message);
      this.emit('boot-error', error);
      throw error;
    }

    return this;
  }

  async _bootPhase1_Platform() {
    this._bootLog('[Phase 1/10] Detecting platform...');
    this.platformAdapter = new PlatformAdapter(this.config);
    this.platform = await this.platformAdapter.detect();
    this._bootLog('  ✓ Platform detected: ' + this.platform);
    this._bootLog('  ✓ Architecture: ' + os.arch());
    this._bootLog('  ✓ Hostname: ' + os.hostname());
    this._bootLog('  ✓ CPUs: ' + os.cpus().length);
    this._bootLog('  ✓ Memory: ' + Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB');
  }

  async _bootPhase2_CoreSubsystems() {
    this._bootLog('[Phase 2/10] Initializing core subsystems...');

    // Filesystem (Internet-native virtual filesystem)
    this.filesystem = new FileSystem(this);
    await this.filesystem.init();
    this._bootLog('  ✓ Internet-Native Filesystem: READY');

    // Process Manager
    this.processManager = new ProcessManager(this);
    await this.processManager.init();
    this._bootLog('  ✓ Distributed Process Manager: READY');

    // Network stack
    this.network = new Network(this);
    await this.network.init();
    this._bootLog('  ✓ Network Stack: READY');
  }

  async _bootPhase3_NeuralChip() {
    this._bootLog('[Phase 3/10] Initializing NeuralChip™ Internet Native Core...');

    if (!this.config.neuralChip.enabled) {
      this._bootLog('  ⚠ NeuralChip disabled in config');
      return;
    }

    this.neuralChip = new NeuralChip(this);
    await this.neuralChip.init();
    this._bootLog('  ✓ NeuralChip Core: ACTIVE');
    this._bootLog('  ✓ Model: ' + this.config.neuralChip.model);
    this._bootLog('  ✓ Auto-Fork: ' + (this.config.neuralChip.autoFork ? 'ENABLED' : 'DISABLED'));
    this._bootLog('  ✓ Auto-Ingest: ' + (this.config.neuralChip.autoIngest ? 'ENABLED' : 'DISABLED'));
  }

  async _bootPhase4_AIEngine() {
    this._bootLog('[Phase 4/10] Initializing AI Engine...');

    this.aiEngine = new AIEngine(this);
    await this.aiEngine.init();
    this._bootLog('  ✓ AI Engine: ONLINE');
    this._bootLog('  ✓ Provider: ' + this.config.ai.provider);
    this._bootLog('  ✓ Model: ' + this.config.ai.model);
  }

  async _bootPhase5_InternetNative() {
    this._bootLog('[Phase 5/10] Activating Internet-Native Core...');

    this.internetNativeCore = new InternetNativeCore(this);
    await this.internetNativeCore.init();
    this._bootLog('  ✓ Internet-Native Core: ACTIVE');
    this._bootLog('  ✓ Always Online: YES');
    this._bootLog('  ✓ Mesh Networking: ' + (this.config.internetNative.meshNetworking ? 'ENABLED' : 'DISABLED'));
    this._bootLog('  ✓ Peer Discovery: ACTIVE');
  }

  async _bootPhase6_GitSystem() {
    this._bootLog('[Phase 6/10] Initializing Git-Native Filesystem...');

    this.gitIntegration = new GitIntegration(this);
    await this.gitIntegration.init();
    this._bootLog('  ✓ Git Integration: READY');

    this.repoManager = new RepoManager(this);
    await this.repoManager.init();
    this._bootLog('  ✓ Repo Manager: READY');
    this._bootLog('  ✓ Auto-Commit: ' + (this.config.git.autoCommit ? 'ENABLED' : 'DISABLED'));
  }

  async _bootPhase7_PackageManager() {
    this._bootLog('[Phase 7/10] Initializing Package Manager...');

    this.packageManager = new PackageManager(this);
    await this.packageManager.init();
    this._bootLog('  ✓ Package Manager: READY (Repo-as-Package mode)');
  }

  async _bootPhase8_Console() {
    this._bootLog('[Phase 8/10] Starting Console & Terminal...');

    this.terminal = new Terminal(this);
    await this.terminal.init();
    this._bootLog('  ✓ Console: READY');
  }

  async _bootPhase9_Network() {
    this._bootLog('[Phase 9/10] Starting network services...');

    await this.network.startServices();
    this._bootLog('  ✓ HTTP Server: Port ' + this.config.port);
    this._bootLog('  ✓ WebSocket: ACTIVE');
    this._bootLog('  ✓ P2P Mesh: CONNECTED');
  }

  async _bootPhase10_Finalize() {
    this._bootLog('[Phase 10/10] Finalizing boot...');

    // Register system-wide event handlers
    this._registerSystemHandlers();

    // Start background tasks
    this._startBackgroundTasks();

    // Emit ready event
    this.emit('ready', this.getStatus());

    this._bootLog('  ✓ Boot sequence complete.');
  }

  /**
   * Register system-wide event handlers
   */
  _registerSystemHandlers() {
    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));

    // Uncaught errors
    process.on('uncaughtException', (err) => {
      this.log('UNCAUGHT EXCEPTION: ' + err.message, 'error');
      this.emit('error', err);
    });

    process.on('unhandledRejection', (reason) => {
      this.log('UNHANDLED REJECTION: ' + reason, 'error');
      this.emit('error', new Error(reason));
    });
  }

  /**
   * Start background system tasks
   */
  _startBackgroundTasks() {
    // Periodic peer discovery
    if (this.config.internetNative.peerDiscovery) {
      this._peerDiscoveryInterval = setInterval(() => {
        this.internetNativeCore.discoverPeers();
      }, 30000);
    }

    // NeuralChip background processing
    if (this.neuralChip) {
      this._neuralChipInterval = setInterval(() => {
        this.neuralChip.backgroundProcess();
      }, 60000);
    }

    // Auto-sync git repos
    if (this.config.git.autoPush) {
      this._autoSyncInterval = setInterval(() => {
        this.repoManager.autoSyncAll();
      }, 300000); // Every 5 minutes
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(signal) {
    this._bootLog('Shutdown signal received: ' + signal);
    this._bootLog('Shutting down InternetOS...');
    this.state = 'SHUTDOWN';

    // Clear intervals
    if (this._peerDiscoveryInterval) clearInterval(this._peerDiscoveryInterval);
    if (this._neuralChipInterval) clearInterval(this._neuralChipInterval);
    if (this._autoSyncInterval) clearInterval(this._autoSyncInterval);

    // Shutdown subsystems in reverse order
    if (this.terminal) await this.terminal.shutdown();
    if (this.packageManager) await this.packageManager.shutdown();
    if (this.repoManager) await this.repoManager.shutdown();
    if (this.gitIntegration) await this.gitIntegration.shutdown();
    if (this.internetNativeCore) await this.internetNativeCore.shutdown();
    if (this.aiEngine) await this.aiEngine.shutdown();
    if (this.neuralChip) await this.neuralChip.shutdown();
    if (this.processManager) await this.processManager.shutdown();
    if (this.network) await this.network.shutdown();
    if (this.filesystem) await this.filesystem.shutdown();
    if (this.platformAdapter) await this.platformAdapter.shutdown();

    this._bootLog('InternetOS has shut down.');
    this.emit('shutdown', { signal, uptime: this.getUptime() });

    process.exit(0);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      version: this.version,
      codename: this.codename,
      state: this.state,
      platform: this.platform,
      uptime: this.getUptime(),
      neuralChip: this.neuralChip ? this.neuralChip.getStatus() : null,
      aiEngine: this.aiEngine ? this.aiEngine.getStatus() : null,
      internetNative: this.internetNativeCore ? this.internetNativeCore.getStatus() : null,
      network: this.network ? this.network.getStatus() : null,
      peers: this.internetNativeCore ? this.internetNativeCore.getPeers() : [],
      processes: this.processManager ? this.processManager.list() : [],
    };
  }

  /**
   * Get system uptime in milliseconds
   */
  getUptime() {
    if (!this.bootTime) return 0;
    return Date.now() - this.bootTime;
  }

  /**
   * Log a message to the kernel log
   */
  log(message, level = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.logs.push(entry);
    this.emit('log', entry);

    const prefix = {
      info: '[INFO]',
      warn: '[WARN]',
      error: '[ERROR]',
      debug: '[DEBUG]',
    }[level] || '[INFO]';

    console.log(`${prefix} [InternetOS Kernel] ${message}`);
    return entry;
  }

  /**
   * Internal boot log
   */
  _bootLog(message) {
    this.bootLog.push(message);
    console.log(message);
    this.emit('boot-log', message);
  }
}

// ─── Kernel Factory ─────────────────────────────────────────────────────────

/**
 * Create and boot a new InternetOS kernel instance
 */
async function createKernel(config = {}) {
  const kernel = new InternetOSKernel(config);
  await kernel.boot();
  return kernel;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  InternetOSKernel,
  createKernel,
};

// ─── Direct Boot (when run as main) ─────────────────────────────────────────

if (require.main === module) {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║          InternetOS Kernel Boot          ║');
  console.log('║    "The OS that IS the Internet."         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  const kernel = new InternetOSKernel();

  kernel.boot()
    .then(() => {
      console.log('');
      console.log('InternetOS is running. Press Ctrl+C to shutdown.');
    })
    .catch((err) => {
      console.error('FATAL: Kernel boot failed:', err.message);
      process.exit(1);
    });
}
