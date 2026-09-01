'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import type { Team, DateRange } from '@/types';
import { getTeams, DATE_RANGE_OPTIONS } from '@/services/mock-data';

interface MainLayoutProps {
  children: React.ReactNode;
}

export interface LayoutContextType {
  teamId: string | null;
  memberId: string | null;
  dateRange: DateRange;
  teams: Team[];
  currentTeam: Team | null;
}

export const LayoutContext = React.createContext<LayoutContextType>({
  teamId: null,
  memberId: null,
  dateRange: DATE_RANGE_OPTIONS[0],
  teams: [],
  currentTeam: null,
});

export default function MainLayout({ children }: MainLayoutProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGE_OPTIONS[0]);

  useEffect(() => {
    getTeams().then(data => {
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeamId(data[0].id);
      }
    });
  }, []);

  const handleTeamChange = (teamId: string | null) => {
    setSelectedTeamId(teamId || null);
    setSelectedMemberId(null);
  };

  const handleMemberSelect = (memberId: string | null) => {
    setSelectedMemberId(memberId);
  };

  const currentTeam = teams.find(t => t.id === selectedTeamId) || null;
  const members = currentTeam?.members || [];

  const contextValue: LayoutContextType = {
    teamId: selectedTeamId,
    memberId: selectedMemberId,
    dateRange,
    teams,
    currentTeam,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className="crm-layout">
        <Header
          teams={teams}
          selectedTeamId={selectedTeamId}
          onTeamChange={handleTeamChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <div className="crm-body">
          {currentTeam && (
            <Sidebar
              members={members}
              selectedMemberId={selectedMemberId}
              onMemberSelect={handleMemberSelect}
              teamName={currentTeam.name}
            />
          )}
          <main className="crm-main">
            {children}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
