/**
 * INSIGHTLY Analytics Tracker
 * Lightweight, privacy-conscious website analytics (< 4KB)
 * Version: 1.3.0
 * License: MIT
 */
(function () {
  'use strict';

  // 1. Guard against multiple tracker initializations
  if (window.__insightly_initialized) {
    return;
  }
  window.__insightly_initialized = true;

  // 2. Locate the script tag that loaded tracker.js
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      if (s.src && s.src.indexOf('tracker.js') !== -1) return s;
    }
    return null;
  })();

  var siteId = scriptTag ? scriptTag.getAttribute('data-site-id') : null;
  var trackingKey = scriptTag ? scriptTag.getAttribute('data-tracking-key') : null;

  // Endpoint base URL (default to origin of script, or current window origin)
  var scriptSrc = scriptTag && scriptTag.src ? scriptTag.src : '';
  var endpoint = '';
  if (scriptSrc && scriptSrc.indexOf('http') === 0) {
    try {
      var a = document.createElement('a');
      a.href = scriptSrc;
      endpoint = a.protocol + '//' + a.host + '/api/collect';
    } catch (e) {
      endpoint = window.location.origin + '/api/collect';
    }
  } else {
    endpoint = window.location.origin + '/api/collect';
  }

  // Fallback or explicit override via window.insightlyConfig
  if (window.insightlyConfig) {
    siteId = window.insightlyConfig.siteId || siteId;
    trackingKey = window.insightlyConfig.trackingKey || trackingKey;
    if (window.insightlyConfig.endpoint) {
      endpoint = window.insightlyConfig.endpoint;
    }
  }

  if (!siteId || !trackingKey) {
    console.warn('[INSIGHTLY] Missing data-site-id or data-tracking-key. Analytics paused.');
    return;
  }

  // 3. ID Generator
  function generateId(prefix) {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var res = prefix ? prefix + '_' : '';
    for (var i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  // 4. Storage with Memory Fallback (works even if localStorage is blocked)
  var memStore = {};
  function getStorage(key) {
    try {
      if (window.localStorage) {
        var v = window.localStorage.getItem(key);
        if (v !== null) return v;
      }
    } catch (e) {}
    return memStore[key] || null;
  }

  function setStorage(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
    memStore[key] = value;
  }

  // 5. Visitor Identification (Persists indefinitely across reloads/sessions)
  var visitorId = getStorage('_ins_vid');
  if (!visitorId) {
    visitorId = generateId('v');
    setStorage('_ins_vid', visitorId);
  }

  // 6. Session Logic (30-minute inactivity timeout)
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  function getActiveSessionId() {
    var now = Date.now();
    var lastAct = parseInt(getStorage('_ins_last_act') || '0', 10);
    var sid = getStorage('_ins_sid');

    if (!sid || !lastAct || (now - lastAct > SESSION_TIMEOUT_MS)) {
      sid = generateId('s');
      setStorage('_ins_sid', sid);
    }
    setStorage('_ins_last_act', now.toString());
    return sid;
  }

  // 7. Device, Browser, OS Detectors
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Internet';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'Internet Explorer';
    if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) {
      if (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) return 'iOS';
      return 'macOS';
    }
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 || ua.indexOf('iPod') > -1) return 'iOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    return 'Unknown';
  }

  function getUtmParams() {
    try {
      var search = window.location.search;
      if (!search) return {};
      var params = new URLSearchParams(search);
      return {
        source: params.get('utm_source') || null,
        medium: params.get('utm_medium') || null,
        campaign: params.get('utm_campaign') || null,
        term: params.get('utm_term') || null,
        content: params.get('utm_content') || null
      };
    } catch (e) {
      return {};
    }
  }

  var pageStartTime = Date.now();
  var lastUrl = window.location.href;
  var currentReferrer = document.referrer || '';
  var lastTrackedPageview = { path: '', timestamp: 0 };

  // 8. Event Sender
  function sendEvent(eventType, extra) {
    var sid = getActiveSessionId();
    var nowIso = new Date().toISOString();
    var currentPath = window.location.pathname + window.location.search;

    var data = {
      site_id: siteId,
      tracking_key: trackingKey,
      type: eventType,
      payload: {
        event_id: generateId('evt'),
        url: window.location.href,
        path: currentPath,
        title: document.title || 'Untitled',
        referrer: currentReferrer,
        anonymous_id: visitorId,
        session_id: sid,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screen_size: (window.screen.width || 0) + 'x' + (window.screen.height || 0),
        language: (navigator.language || 'en').split('-')[0].toLowerCase(),
        utm: getUtmParams(),
        timestamp: nowIso
      }
    };

    if (extra) {
      for (var k in extra) {
        if (extra.hasOwnProperty(k)) {
          data.payload[k] = extra[k];
        }
      }
    }

    var jsonStr = JSON.stringify(data);

    // Prefer navigator.sendBeacon
    var sent = false;
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([jsonStr], { type: 'application/json' });
        sent = navigator.sendBeacon(endpoint, blob);
      } catch (err) {
        sent = false;
      }
    }

    if (!sent) {
      try {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonStr,
          keepalive: true
        }).catch(function () {});
      } catch (err) {}
    }
  }

  // 9. Pageview Tracking with Strict Deduplication
  function trackPageView() {
    var currentPath = window.location.pathname + window.location.search;
    var now = Date.now();

    // Prevent duplicate pageviews for the same path within 600ms (React StrictMode / dual router mount)
    if (lastTrackedPageview.path === currentPath && (now - lastTrackedPageview.timestamp < 600)) {
      return;
    }

    lastTrackedPageview = { path: currentPath, timestamp: now };
    pageStartTime = now;
    sendEvent('pageview');
  }

  // 10. Page Duration Tracking
  function trackPageDuration() {
    var durationSec = Math.max(1, Math.round((Date.now() - pageStartTime) / 1000));
    sendEvent('ping', { duration: durationSec });
  }

  // 11. Lightweight Realtime Heartbeat (every 25 seconds when visible)
  var heartbeatInterval = null;
  function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(function () {
      if (document.visibilityState === 'visible') {
        var durationSec = Math.max(1, Math.round((Date.now() - pageStartTime) / 1000));
        sendEvent('heartbeat', { duration: durationSec });
      }
    }, 25000);
  }

  // 12. Initial Load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackPageView();
    startHeartbeat();
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      trackPageView();
      startHeartbeat();
    }, { once: true });
  }

  // 13. SPA Navigation Interceptor (React, Next.js, Vite, Vue, Angular, WordPress SPA)
  var urlChangeTimeout = null;
  function handleUrlChange() {
    if (urlChangeTimeout) clearTimeout(urlChangeTimeout);
    urlChangeTimeout = setTimeout(function () {
      if (window.location.href !== lastUrl) {
        trackPageDuration();
        currentReferrer = lastUrl;
        lastUrl = window.location.href;
        trackPageView();
      }
    }, 40);
  }

  var originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };
  }

  var originalReplaceState = history.replaceState;
  if (originalReplaceState) {
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      handleUrlChange();
    };
  }

  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('hashchange', handleUrlChange);

  // 14. Visibility and Exit Listeners
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      trackPageDuration();
    } else if (document.visibilityState === 'visible') {
      var durationSec = Math.max(1, Math.round((Date.now() - pageStartTime) / 1000));
      sendEvent('heartbeat', { duration: durationSec });
    }
  });

  window.addEventListener('pagehide', function () {
    trackPageDuration();
  });

  // 15. Public Custom Event API
  window.insightly = {
    track: function (eventName, metadata) {
      if (!eventName || typeof eventName !== 'string') return;
      sendEvent('event', {
        event_name: eventName,
        metadata: metadata && typeof metadata === 'object' ? metadata : {}
      });
    },
    page: function () {
      trackPageView();
    },
    version: '1.3.0'
  };
})();
