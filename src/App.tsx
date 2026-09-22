import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { WebsiteSetupModal } from './components/WebsiteSetupModal';
import { InstallModal } from './components/InstallModal';
import { DashboardAccessModal } from './components/DashboardAccessModal';
import { PlaygroundModal } from './components/PlaygroundModal';
import { getStoredSession, getSavedSites } from './lib/api';
import { DEMO_WEBSITE } from './lib/demoData';

export default function App() {
  const [activeSession, setActiveSession] = useState<{
    site_id: string;
    dashboard_key: string;
    name: string;
    domain: string;
    tracking_key?: string;
  } | null>(null);

  const [isDemo, setIsDemo] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

  const [installSiteDetails, setInstallSiteDetails] = useState<{
    site_id: string;
    tracking_key: string;
    dashboard_key: string;
    name: string;
    domain: string;
  } | null>(null);

  // Initialize from URL params or local session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSiteId = params.get('site_id');
    const urlDashKey = params.get('dash_key') || params.get('dashboard_key');
    const demoParam = params.get('demo');

    if (demoParam === 'true') {
      setIsDemo(true);
      setActiveSession({
        site_id: DEMO_WEBSITE.site_id,
        dashboard_key: 'dash_demo_key',
        name: DEMO_WEBSITE.name,
        domain: DEMO_WEBSITE.domain,
        tracking_key: 'trk_demo_key'
      });
      return;
    }

    if (urlSiteId && urlDashKey) {
      setActiveSession({
        site_id: urlSiteId,
        dashboard_key: urlDashKey,
        name: params.get('name') || 'Active Project',
        domain: params.get('domain') || 'example.com'
      });
      return;
    }

    // Check stored session
    const stored = getStoredSession();
    if (stored) {
      setActiveSession(stored);
    }
  }, []);

  const handleStartTracking = () => {
    setIsSetupOpen(true);
  };

  const handleViewDemo = () => {
    setIsDemo(true);
    setActiveSession({
      site_id: DEMO_WEBSITE.site_id,
      dashboard_key: 'dash_demo_key',
      name: DEMO_WEBSITE.name,
      domain: DEMO_WEBSITE.domain,
      tracking_key: 'trk_demo_key'
    });
  };

  const handleSetupSuccess = (details: {
    site_id: string;
    tracking_key: string;
    dashboard_key: string;
    name: string;
    domain: string;
  }) => {
    setIsSetupOpen(false);
    setInstallSiteDetails(details);
    setIsInstallOpen(true);
  };

  const handleAccessSuccess = (session: {
    site_id: string;
    dashboard_key: string;
    name: string;
    domain: string;
  }) => {
    setIsAccessOpen(false);
    setIsDemo(false);
    setActiveSession(session);
  };

  const handleSwitchSite = (siteId: string, dashboardKey: string) => {
    const saved = getSavedSites();
    const found = saved.find(s => s.site_id === siteId);
    if (found) {
      setIsDemo(false);
      setActiveSession(found);
    } else {
      // Prompt credentials or open access
      setIsAccessOpen(true);
    }
  };

  const handleExitDashboard = () => {
    setActiveSession(null);
    setIsDemo(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
      {/* Show Navbar when not inside dashboard or as global header */}
      {!activeSession && (
        <Navbar
          onStartTracking={handleStartTracking}
          onViewDemo={handleViewDemo}
          onOpenAccessModal={() => setIsAccessOpen(true)}
          onOpenPlayground={() => setIsPlaygroundOpen(true)}
          currentView="landing"
          onNavigateLanding={() => {
            setActiveSession(null);
            setIsDemo(false);
          }}
        />
      )}

      {/* Main Content: Dashboard or Landing Page */}
      {activeSession ? (
        <Dashboard
          siteId={activeSession.site_id}
          dashboardKey={activeSession.dashboard_key}
          siteName={activeSession.name}
          domain={activeSession.domain}
          isDemo={isDemo}
          onExit={handleExitDashboard}
          onOpenNewSiteModal={() => setIsSetupOpen(true)}
          onOpenInstallModal={(site) => {
            setInstallSiteDetails({
              site_id: site.site_id,
              tracking_key: site.tracking_key || activeSession.tracking_key || 'trk_key',
              dashboard_key: site.dashboard_key,
              name: site.name,
              domain: site.domain
            });
            setIsInstallOpen(true);
          }}
          onOpenPlayground={() => setIsPlaygroundOpen(true)}
          onSwitchSite={handleSwitchSite}
        />
      ) : (
        <LandingPage
          onStartTracking={handleStartTracking}
          onViewDemo={handleViewDemo}
          onOpenPlayground={() => setIsPlaygroundOpen(true)}
          onOpenAccessModal={() => setIsAccessOpen(true)}
        />
      )}

      {/* Setup Modal */}
      <WebsiteSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onSuccess={handleSetupSuccess}
      />

      {/* Installation Modal */}
      {installSiteDetails && (
        <InstallModal
          isOpen={isInstallOpen}
          onClose={() => setIsInstallOpen(false)}
          siteDetails={installSiteDetails}
          onGoToDashboard={() => {
            setIsInstallOpen(false);
            setIsDemo(false);
            setActiveSession({
              site_id: installSiteDetails.site_id,
              dashboard_key: installSiteDetails.dashboard_key,
              name: installSiteDetails.name,
              domain: installSiteDetails.domain,
              tracking_key: installSiteDetails.tracking_key
            });
          }}
        />
      )}

      {/* Access Dashboard Modal */}
      <DashboardAccessModal
        isOpen={isAccessOpen}
        onClose={() => setIsAccessOpen(false)}
        onSuccess={handleAccessSuccess}
        onLaunchDemo={handleViewDemo}
      />

      {/* Interactive Browser Live Test Playground Modal */}
      <PlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        siteId={activeSession ? activeSession.site_id : (installSiteDetails?.site_id || 'site_orbit_prod')}
        trackingKey={activeSession?.tracking_key || (installSiteDetails?.tracking_key || 'trk_orbit_key')}
        siteName={activeSession ? activeSession.name : (installSiteDetails?.name || 'ORBIT')}
        onEventSent={() => {
          // If in dashboard, refresh automatically
        }}
      />
    </div>
  );
}
