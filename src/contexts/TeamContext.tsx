import React, { createContext, useContext, useState } from 'react';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  status: 'active' | 'inactive';
  joinedAt: Date;
  lastActive: Date;
  avatar?: string;
}

interface TeamContextType {
  members: TeamMember[];
  addMember: (member: Omit<TeamMember, 'id' | 'joinedAt' | 'lastActive'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  getActiveMembers: () => TeamMember[];
  getMembersByRole: (role: string) => TeamMember[];
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

// Mock team data
const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Jemond White',
    email: 'admin@crowncaregivers.com',
    role: 'admin',
    status: 'active',
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    lastActive: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '2',
    name: 'Natasha White',
    email: 'manager@crowncaregivers.com',
    role: 'manager',
    status: 'active',
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Bob Agent',
    email: 'agent@crowncaregivers.com',
    role: 'agent',
    status: 'active',
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '4',
    name: 'Sarah Agent',
    email: 'sarah@crowncaregivers.com',
    role: 'agent',
    status: 'active',
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);

  const addMember = (memberData: Omit<TeamMember, 'id' | 'joinedAt' | 'lastActive'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: Date.now().toString(),
      joinedAt: new Date(),
      lastActive: new Date(),
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<TeamMember>) => {
    setMembers(prev => prev.map(member => 
      member.id === id ? { ...member, ...updates } : member
    ));
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(member => member.id !== id));
  };

  const getActiveMembers = () => members.filter(m => m.status === 'active');
  const getMembersByRole = (role: string) => members.filter(m => m.role === role);

  return (
    <TeamContext.Provider value={{
      members,
      addMember,
      updateMember,
      removeMember,
      getActiveMembers,
      getMembersByRole,
    }}>
      {children}
    </TeamContext.Provider>
  );
};