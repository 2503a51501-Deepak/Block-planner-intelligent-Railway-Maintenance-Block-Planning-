import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Stations } from './pages/Stations';
import { Trains } from './pages/Trains';
import { MaintenanceTasks } from './pages/MaintenanceTasks';
import { AIBlockPlanner } from './pages/AIBlockPlanner';
import { WeeklyPlan } from './pages/WeeklyPlan';
import { MonthlyPlan } from './pages/MonthlyPlan';
import { Settings } from './pages/Settings';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePlanBlockDirect = () => {
    setCurrentTab('planner');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Clean Light Navbar */}
      <Navbar
        onPlanBlock={handlePlanBlockDirect}
        isOptimizing={isOptimizing}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 8-Item Clean Light Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <Dashboard
                onNavigate={setCurrentTab}
                onOpenAddTrain={() => setCurrentTab('trains')}
                onOpenAddStation={() => setCurrentTab('stations')}
                onOpenAddTask={() => setCurrentTab('tasks')}
              />
            )}
            {currentTab === 'stations' && <Stations />}
            {currentTab === 'trains' && <Trains />}
            {currentTab === 'tasks' && <MaintenanceTasks />}
            {currentTab === 'planner' && <AIBlockPlanner />}
            {currentTab === 'weekly' && <WeeklyPlan />}
            {currentTab === 'monthly' && <MonthlyPlan />}
            {currentTab === 'settings' && <Settings />}
          </div>
        </main>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg border border-blue-400 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <span>?</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
