import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Volume2,
  VolumeX,
  RefreshCw,
  Trash2,
  Edit2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Activity,
  Download,
  Info,
  Sliders,
  CheckCheck,
  Radio,
  Clock,
  HardDrive,
  Eye,
} from 'lucide-react';
import { notificationService } from '../../services/api';
import { requestPushToken, detectDeviceInfo, registerServiceWorker } from '../../config/firebase';
import { playOrderAlertChime, playTestChime, getSoundSettings, saveSoundSettings } from '../../utils/notificationAudio';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationManager = ({ onNavigateTab, deferredInstallPrompt, onTriggerInstall }) => {
  const { toastSuccess, toastError, toastInfo, toastWarning } = useToast();

  // Active Sub-Tab: 'health' | 'devices' | 'logs' | 'preferences'
  const [activeSubTab, setActiveSubTab] = useState('health');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

  // Health Metrics
  const [health, setHealth] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [swStatus, setSwStatus] = useState('checking');

  // Devices State
  const [devices, setDevices] = useState([]);
  const [thisDeviceRegistered, setThisDeviceRegistered] = useState(false);
  const [currentFCMToken, setCurrentFCMToken] = useState(
    localStorage.getItem('s2c_admin_fcm_token') || ''
  );
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editNameInput, setEditNameInput] = useState('');

  // Delivery Logs
  const [logs, setLogs] = useState([]);
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logsPage, setLogsPage] = useState(1);
  const [logsPagination, setLogsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  // Sound Preferences State
  const [soundSettings, setSoundState] = useState(getSoundSettings());
  const [copiedToken, setCopiedToken] = useState(null);

  // Auto-detect current device info
  const deviceInfo = detectDeviceInfo();

  // Fetch Health & Config
  const loadHealthData = useCallback(async () => {
    try {
      const res = await notificationService.getHealth();
      if (res.data?.success) {
        setHealth(res.data.health);
      }
    } catch (err) {
      console.error('Failed to load health metrics:', err);
    }
  }, []);

  // Fetch Devices List
  const loadDevices = useCallback(async () => {
    try {
      const res = await notificationService.getDevices();
      if (res.data?.success) {
        setDevices(res.data.devices || []);

        const savedToken = localStorage.getItem('s2c_admin_fcm_token');
        if (savedToken && res.data.devices.some((d) => d.token === savedToken && d.isActive)) {
          setThisDeviceRegistered(true);
        } else {
          setThisDeviceRegistered(false);
        }
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  }, []);

  // Fetch Logs
  const loadLogs = useCallback(
    async (page = 1, status = logStatusFilter, type = logTypeFilter) => {
      setRefreshingLogs(true);
      try {
        const res = await notificationService.getLogs({
          page,
          limit: 15,
          status: status !== 'all' ? status : undefined,
          type: type !== 'all' ? type : undefined,
        });
        if (res.data?.success) {
          setLogs(res.data.logs || []);
          setLogsPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
        }
      } catch (err) {
        console.error('Failed to load notification logs:', err);
      } finally {
        setRefreshingLogs(false);
      }
    },
    [logStatusFilter, logTypeFilter]
  );

  // Check Service Worker status
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.active) {
          setSwStatus('active');
        } else {
          registerServiceWorker().then((newReg) => {
            setSwStatus(newReg ? 'active' : 'inactive');
          });
        }
      });
    } else {
      setSwStatus('unsupported');
    }

    if (typeof Notification !== 'undefined') {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    setLoading(true);
    Promise.all([loadHealthData(), loadDevices(), loadLogs(1)])
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [loadHealthData, loadDevices, loadLogs]);

  // Handle Enable Notifications for THIS device
  const handleEnableNotifications = async () => {
    setRegistering(true);
    try {
      // 1. Request Permission and Get Token
      const { token, permission } = await requestPushToken();
      setPermissionStatus(permission);
      setCurrentFCMToken(token);
      localStorage.setItem('s2c_admin_fcm_token', token);

      // 2. Register Device Token on Backend
      const deviceName = customDeviceName.trim() || deviceInfo.deviceName;
      await notificationService.registerToken({
        token,
        deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });

      setThisDeviceRegistered(true);
      toastSuccess(`Push notifications enabled for ${deviceName}!`);
      await Promise.all([loadDevices(), loadHealthData()]);
    } catch (err) {
      toastError(err.message || 'Failed to enable push notifications');
    } finally {
      setRegistering(false);
    }
  };

  // Handle Disable Notifications for THIS device
  const handleDisableNotifications = async () => {
    setRegistering(true);
    try {
      const token = currentFCMToken || localStorage.getItem('s2c_admin_fcm_token');
      if (token) {
        await notificationService.unregisterToken(token);
      }
      localStorage.removeItem('s2c_admin_fcm_token');
      setCurrentFCMToken('');
      setThisDeviceRegistered(false);
      toastInfo('Push notifications disabled for this device.');
      await Promise.all([loadDevices(), loadHealthData()]);
    } catch (err) {
      toastError('Failed to unregister device');
    } finally {
      setRegistering(false);
    }
  };

  // Send Test Push Notification (Phase 7 & 18)
  const handleSendTestNotification = async () => {
    setSendingTest(true);
    try {
      playTestChime();
      const res = await notificationService.sendTest(currentFCMToken || null);
      if (res.data?.success) {
        toastSuccess('Test push notification dispatched!');
        await Promise.all([loadLogs(1), loadHealthData()]);
      }
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to dispatch test notification');
    } finally {
      setSendingTest(false);
    }
  };

  // Toggle Active status for a device
  const handleToggleDevice = async (device) => {
    try {
      await notificationService.updateDevice(device._id, {
        isActive: !device.isActive,
      });
      toastSuccess(`Device ${device.isActive ? 'disabled' : 'enabled'}.`);
      await loadDevices();
    } catch (err) {
      toastError('Failed to update device status');
    }
  };

  // Rename a device
  const handleSaveDeviceName = async (deviceId) => {
    if (!editNameInput.trim()) return;
    try {
      await notificationService.updateDevice(deviceId, {
        deviceName: editNameInput.trim(),
      });
      setEditingDeviceId(null);
      toastSuccess('Device name updated.');
      await loadDevices();
    } catch (err) {
      toastError('Failed to update device name');
    }
  };

  // Delete a device
  const handleDeleteDevice = async (deviceId, isCurrent) => {
    if (!window.confirm('Are you sure you want to remove this device from push notifications?')) {
      return;
    }
    try {
      await notificationService.deleteDevice(deviceId);
      if (isCurrent) {
        localStorage.removeItem('s2c_admin_fcm_token');
        setCurrentFCMToken('');
        setThisDeviceRegistered(false);
      }
      toastSuccess('Device removed.');
      await Promise.all([loadDevices(), loadHealthData()]);
    } catch (err) {
      toastError('Failed to delete device');
    }
  };

  // Sound preference changes
  const handleSoundToggle = () => {
    const updated = { ...soundSettings, enabled: !soundSettings.enabled };
    setSoundState(updated);
    saveSoundSettings(updated);
    if (updated.enabled) playTestChime();
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    const updated = { ...soundSettings, volume: val };
    setSoundState(updated);
    saveSoundSettings(updated);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-amber-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      default:
        return <Laptop className="w-5 h-5 text-cyan-400" />;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to Firebase Push Gateway..." />;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-festival-card border border-festival-border p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-950/50">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Push Notification & PWA Gateway</span>
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Firebase FCM Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant mobile & desktop order alerts with zero SMS / WhatsApp API charges
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Install PWA Prompt Button */}
            {deferredInstallPrompt && (
              <button
                type="button"
                onClick={onTriggerInstall}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Install Admin App</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={sendingTest}
              className="px-4 py-2 bg-festival-dark hover:bg-white/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-spin' : ''}`} />
              <span>{sendingTest ? 'Dispatching...' : 'Send Test Notification'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-festival-border overflow-x-auto">
          {[
            { id: 'health', label: 'Gateway Health', icon: Activity },
            { id: 'devices', label: `Registered Devices (${devices.length})`, icon: Smartphone },
            { id: 'logs', label: `Delivery Logs (${logsPagination.total})`, icon: Clock },
            { id: 'preferences', label: 'Sound & Alerts', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: HEALTH & OVERVIEW */}
      {activeSubTab === 'health' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FCM Backend Health */}
            <div className="bg-festival-card border border-festival-border p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">FCM Engine</span>
                <Radio
                  className={`w-4 h-4 ${
                    health?.firebaseConfigured ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                  }`}
                />
              </div>
              <p className="text-lg font-black text-white mt-2">
                {health?.firebaseConfigured ? 'Configured (Live)' : 'Simulation / Dev Mode'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {health?.firebaseConfigured
                  ? 'Server Service Account Active'
                  : 'Tokens saved; mock dispatch active'}
              </p>
            </div>

            {/* Service Worker Status */}
            <div className="bg-festival-card border border-festival-border p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Service Worker</span>
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-lg font-black text-white mt-2 capitalize">
                {swStatus === 'active' ? 'Active (Background Ready)' : swStatus}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Background FCM listener enabled
              </p>
            </div>

            {/* Permission Status */}
            <div className="bg-festival-card border border-festival-border p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Browser Permission</span>
                <Bell className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-lg font-black text-white mt-2 capitalize">
                {permissionStatus}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {permissionStatus === 'granted'
                  ? 'Notifications permitted'
                  : 'Click enable to allow'}
              </p>
            </div>

            {/* Active Devices */}
            <div className="bg-festival-card border border-festival-border p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Active Devices</span>
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-lg font-black text-white mt-2">
                {health?.activeDevices || devices.filter((d) => d.isActive).length} Device(s)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                All receive instant order push
              </p>
            </div>
          </div>

          {/* Current Device Registration Card */}
          <div className="bg-festival-card border-2 border-amber-500/40 p-6 sm:p-8 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-festival-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  {getDeviceIcon(deviceInfo.deviceType)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">This Device Registration</h3>
                  <p className="text-xs text-slate-400">
                    {deviceInfo.browser} on {deviceInfo.os} ({deviceInfo.deviceType})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {thisDeviceRegistered ? (
                  <button
                    type="button"
                    onClick={handleDisableNotifications}
                    disabled={registering}
                    className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Disable on this Device</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    disabled={registering}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <BellRing className={`w-4 h-4 ${registering ? 'animate-spin' : ''}`} />
                    <span>{registering ? 'Registering Token...' : 'Enable Push Notifications'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Device Name Input */}
            {!thisDeviceRegistered && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Custom Device Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${deviceInfo.deviceName}`}
                  value={customDeviceName}
                  onChange={(e) => setCustomDeviceName(e.target.value)}
                  className="w-full sm:max-w-md bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
            )}

            {/* Token preview if registered */}
            {thisDeviceRegistered && currentFCMToken && (
              <div className="p-4 rounded-xl bg-festival-dark border border-festival-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Active FCM Registration Token
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentFCMToken, 'current')}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    {copiedToken === 'current' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-300 break-all bg-black/40 p-2.5 rounded-lg">
                  {currentFCMToken}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REGISTERED DEVICES (Phase 10 & 17) */}
      {activeSubTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Registered Admin Devices</h3>
              <p className="text-xs text-slate-400">
                All registered devices receive simultaneous instant push notifications when orders arrive
              </p>
            </div>
            <button
              type="button"
              onClick={loadDevices}
              className="p-2 rounded-xl bg-festival-card hover:bg-white/10 border border-festival-border text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 self-start"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl space-y-3">
              <Smartphone className="w-12 h-12 text-slate-500 mx-auto" />
              <h4 className="text-base font-bold text-white">No devices registered yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Enable Push Notifications" above on your mobile phone or laptop to start receiving instant alerts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => {
                const isCurrent = device.token === currentFCMToken;
                const isEditing = editingDeviceId === device._id;

                return (
                  <div
                    key={device._id}
                    className={`p-5 rounded-2xl bg-festival-card border transition-all space-y-3 ${
                      isCurrent
                        ? 'border-amber-500/80 shadow-lg shadow-amber-950/20'
                        : 'border-festival-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-festival-dark flex items-center justify-center border border-festival-border">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editNameInput}
                                onChange={(e) => setEditNameInput(e.target.value)}
                                className="bg-festival-dark border border-amber-500 rounded-lg px-2.5 py-1 text-xs text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveDeviceName(device._id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingDeviceId(null)}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{device.deviceName}</h4>
                              <button
                                onClick={() => {
                                  setEditingDeviceId(device._id);
                                  setEditNameInput(device.deviceName);
                                }}
                                className="text-slate-400 hover:text-amber-400 p-0.5"
                                title="Rename Device"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <p className="text-[11px] text-slate-400">
                            {device.browser} • {device.os}
                            {isCurrent && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                                This Device
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Active Status Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          device.isActive
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {device.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-festival-border flex items-center justify-between">
                      <span>Registered: {formatDate(device.createdAt)}</span>
                      <span>Last Active: {formatDate(device.lastActiveAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(device.token, device._id)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedToken === device._id ? (
                          <span className="text-emerald-400">Token Copied!</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Token</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDevice(device)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                            device.isActive
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {device.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDevice(device._id, isCurrent)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10"
                          title="Delete Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DELIVERY LOGS & AUDIT TRAIL (Phase 11) */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">FCM Push Notification Delivery Logs</h3>
              <p className="text-xs text-slate-400">
                Complete audit trail of all sent order alerts and test messages
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={logStatusFilter}
                onChange={(e) => {
                  setLogStatusFilter(e.target.value);
                  loadLogs(1, e.target.value, logTypeFilter);
                }}
                className="bg-festival-card border border-festival-border rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={logTypeFilter}
                onChange={(e) => {
                  setLogTypeFilter(e.target.value);
                  loadLogs(1, logStatusFilter, e.target.value);
                }}
                className="bg-festival-card border border-festival-border rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="all">All Types</option>
                <option value="NEW_ORDER">New Order</option>
                <option value="TEST_NOTIFICATION">Test</option>
                <option value="SYSTEM_ALERT">System Alert</option>
              </select>

              <button
                type="button"
                onClick={() => loadLogs(1)}
                disabled={refreshingLogs}
                className="p-2 bg-festival-card border border-festival-border rounded-xl text-slate-300 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl">
              <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No delivery logs found</p>
              <p className="text-xs text-slate-400 mt-1">
                Notifications will appear here when orders are placed or test messages sent.
              </p>
            </div>
          ) : (
            <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-festival-dark text-slate-400 uppercase text-[10px] font-bold border-b border-festival-border">
                    <tr>
                      <th className="px-4 py-3">Type & Order ID</th>
                      <th className="px-4 py-3">Notification Content</th>
                      <th className="px-4 py-3">Target Devices</th>
                      <th className="px-4 py-3">Delivery Status</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-festival-border text-slate-300">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 mr-2">
                            {log.notificationType}
                          </span>
                          {log.orderId ? (
                            <button
                              onClick={() => onNavigateTab && onNavigateTab('orders', log.orderId)}
                              className="text-amber-400 hover:underline"
                            >
                              {log.orderId}
                            </button>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          <p className="font-bold text-white truncate">{log.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{log.body}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-white">{log.deviceCount} Device(s)</span>
                          {log.successCount > 0 && (
                            <span className="text-emerald-400 text-[11px] ml-1.5">
                              ({log.successCount} OK)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.deliveryStatus === 'sent'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                : log.deliveryStatus === 'partial'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {log.deliveryStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(log.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLogDetail(log)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logsPagination.pages > 1 && (
                <div className="p-4 border-t border-festival-border flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page {logsPagination.page} of {logsPagination.pages} ({logsPagination.total} logs)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={logsPage <= 1}
                      onClick={() => {
                        const next = logsPage - 1;
                        setLogsPage(next);
                        loadLogs(next);
                      }}
                      className="px-3 py-1 rounded-lg bg-festival-dark hover:bg-white/10 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={logsPage >= logsPagination.pages}
                      onClick={() => {
                        const next = logsPage + 1;
                        setLogsPage(next);
                        loadLogs(next);
                      }}
                      className="px-3 py-1 rounded-lg bg-festival-dark hover:bg-white/10 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: SOUND & ALERT PREFERENCES (Phase 14) */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-festival-card border border-festival-border p-6 rounded-3xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span>Real-Time Audio Alerts (Synthesized Festive Chime)</span>
            </h3>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-festival-dark border border-festival-border">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Order Alert Audio</h4>
                <p className="text-[11px] text-slate-400">
                  Plays polyphonic festive chime when a new customer order arrives
                </p>
              </div>
              <button
                type="button"
                onClick={handleSoundToggle}
                className={`p-2.5 rounded-xl border transition-all ${
                  soundSettings.enabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {soundSettings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            {/* Volume Slider */}
            {soundSettings.enabled && (
              <div className="space-y-2 p-4 rounded-2xl bg-festival-dark border border-festival-border">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Alert Volume</span>
                  <span className="text-amber-400 font-mono">
                    {Math.round(soundSettings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundSettings.volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}

            {/* Test Sound Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => playTestChime()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>Test Alert Sound</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-festival-card border border-festival-border rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-festival-border">
              <h3 className="text-sm font-bold text-white">Delivery Log Audit Details</h3>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Title</span>
                <p className="text-white font-bold">{selectedLogDetail.title}</p>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Body</span>
                <p className="text-slate-200 whitespace-pre-line bg-festival-dark p-3 rounded-xl border border-festival-border font-mono text-[11px]">
                  {selectedLogDetail.body}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                  Device Responses ({selectedLogDetail.details?.length || 0})
                </span>
                <div className="space-y-2">
                  {selectedLogDetail.details?.map((d, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-festival-dark border border-festival-border text-[11px] flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-white">{d.deviceName || 'Device'}</p>
                        <p className="font-mono text-[10px] text-slate-400">{d.token}</p>
                        {d.error && <p className="text-rose-400 text-[10px] mt-1">{d.error}</p>}
                      </div>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          d.success
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {d.success ? 'Success' : 'Error'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;
