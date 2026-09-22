/**
 * INSIGHTLY Analytics Tracker
 * Lightweight, privacy-conscious website analytics
 * Version: 1.2.0 (< 4KB minified)
 * License: MIT
 */
(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__insightly_initialized) return;
  window.__insightly_initialized = true;

  // Locate the script tag that loaded tracker.js
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

  // Extract endpoint base URL (default to origin of the script, or current window origin)
  var scriptSrc = scriptTag && scriptTag.src ? scriptTag.src : '';
  var endpoint = '';
  if (scriptSrc && scriptSrc.indexOf('http') === 0) {
    var a = document.createElement('a');
    a.href = scriptSrc;
    endpoint = a.protocol + '//' + a.host + '/api/collect';
  } else {
    endpoint = window.location.origin + '/api/collect';
  }

  // Fallback / config override via window.insightlyConfig
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

  // Generate random IDs
  function generateId(prefix) {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var res = prefix ? prefix + '_' : '';
    for (var i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  // Local storage / session storage accessors with error safety
  function getStorage(key, isSession) {
    try {
      var storage = isSession ? window.sessionStorage : window.localStorage;
      return storage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function setStorage(key, value, isSession) {
    try {
      var storage = isSession ? window.sessionStorage : window.localStorage;
      storage.setItem(key, value);
    } catch (e) {}
  }

  // Anonymous Visitor ID (Persists in localStorage, privacy-safe random string)
  var visitorId = getStorage('_ins_vid');
  if (!visitorId) {
    visitorId = generateId('v');
    setStorage('_ins_vid', visitorId);
  }

  // Session ID (30-minute idle expiration)
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  var lastActivity = parseInt(getStorage('_ins_last_act', true) || '0', 10);
  var sessionId = getStorage('_ins_sid', true);
  var now = Date.now();

  if (!sessionId || !lastActivity || now - lastActivity > SESSION_TIMEOUT_MS) {
    sessionId = generateId('s');
    setStorage('_ins_sid', sessionId, true);
  }
  setStorage('_ins_last_act', now.toString(), true);

  // Parse Device Type
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

  // Parse Browser
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

  // Parse OS
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

  // Parse UTM parameters from current URL
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

  // Page load & duration timers
  var pageStartTime = Date.now();
  var lastUrl = window.location.href;
  var currentReferrer = document.referrer || '';

  // Core Send Function
  function sendEvent(eventType, payload) {
    // Refresh session activity
    setStorage('_ins_last_act', Date.now().toString(), true);

    var data = {
      site_id: siteId,
      tracking_key: trackingKey,
      type: eventType,
      payload: {
        url: window.location.href,
        path: window.location.pathname + window.location.search,
        title: document.title || 'Untitled',
        referrer: currentReferrer,
        anonymous_id: visitorId,
        session_id: sessionId,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        screen_size: (window.screen.width || 0) + 'x' + (window.screen.height || 0),
        language: (navigator.language || 'en').split('-')[0].toLowerCase(),
        utm: getUtmParams(),
        timestamp: new Date().toISOString()
      }
    };

    if (payload) {
      for (var k in payload) {
        if (payload.hasOwnProperty(k)) {
          data.payload[k] = payload[k];
        }
      }
    }

    var jsonStr = JSON.stringify(data);

    // Prefer navigator.sendBeacon for non-blocking exit & event transmission
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

  // Track Page View
  function trackPageView() {
    pageStartTime = Date.now();
    sendEvent('pageview');
  }

  // Track Page Leave (duration update)
  function trackPageDuration() {
    var durationSec = Math.max(1, Math.round((Date.now() - pageStartTime) / 1000));
    sendEvent('ping', { duration: durationSec });
  }

  // Initial Page View
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackPageView();
  } else {
    window.addEventListener('DOMContentLoaded', trackPageView, { once: true });
  }

  // SPA Navigation Interceptors (React, Next.js, Vite, Vue, WordPress SPA)
  function handleUrlChange() {
    if (window.location.href !== lastUrl) {
      // Send duration for old page
      trackPageDuration();
      currentReferrer = lastUrl;
      lastUrl = window.location.href;
      trackPageView();
    }
  }

  var originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      setTimeout(handleUrlChange, 50);
    };
  }

  var originalReplaceState = history.replaceState;
  if (originalReplaceState) {
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      setTimeout(handleUrlChange, 50);
    };
  }

  window.addEventListener('popstate', handleUrlChange);
  window.addEventListener('hashchange', handleUrlChange);

  // Send duration update when page is closed or hidden
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      trackPageDuration();
    }
  });

  window.addEventListener('pagehide', trackPageDuration);

  // Public Custom Event API
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
    version: '1.2.0'
  };
})();
