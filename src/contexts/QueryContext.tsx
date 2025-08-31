import React, { createContext, useContext, useState } from 'react';

export interface Query {
  id: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  status: 'active' | 'responded' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  response?: string;
  responseAt?: Date;
}

interface QueryContextType {
  queries: Query[];
  addQuery: (query: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateQuery: (id: string, updates: Partial<Query>) => void;
  assignQuery: (queryId: string, userId: string, userName: string) => void;
  respondToQuery: (queryId: string, response: string) => void;
  getActiveQueries: () => Query[];
  getRespondedQueries: () => Query[];
  getPendingQueries: () => Query[];
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

export const useQuery = () => {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
};

// Mock data for demo
const mockQueries: Query[] = [
  {
    id: '1',
    clientName: 'Margaret Thompson',
    clientEmail: 'margaret.thompson@email.com',
    subject: 'Care Services Inquiry',
    message: 'Hello, I am looking for in-home care services for my elderly mother. She needs assistance with daily activities and medication management. Could you please provide information about your services and availability?',
    status: 'active',
    priority: 'high',
    assignedTo: '2',
    assignedToName: 'Jane Manager',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    clientName: 'Robert Chen',
    clientEmail: 'robert.chen@email.com',
    subject: 'Respite Care Request',
    message: 'I am the primary caregiver for my father and need respite care services for this weekend so I can attend a family event. What are your rates and availability?',
    status: 'responded',
    priority: 'medium',
    assignedTo: '3',
    assignedToName: 'Bob Agent',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    response: 'Thank you for reaching out to us. We have respite care services available this weekend. Our certified caregivers can provide the support your father needs. I will call you today to discuss the details and schedule.',
    responseAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    clientName: 'Sarah Williams',
    clientEmail: 'sarah.williams@email.com',
    subject: 'Post-Surgery Care Support',
    message: 'My husband is recovering from hip surgery and will need assistance with mobility and personal care for the next 6 weeks. Do you provide post-operative care services?',
    status: 'pending',
    priority: 'low',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    clientName: 'Emily Rodriguez',
    clientEmail: 'emily.rodriguez@email.com',
    subject: 'Urgent Care Needed',
    message: 'My grandmother fell this morning and is being discharged from the hospital today. She needs immediate care assistance at home. Can someone be available today?',
    status: 'active',
    priority: 'urgent',
    assignedTo: '1',
    assignedToName: 'John Admin',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queries, setQueries] = useState<Query[]>(mockQueries);

  const addQuery = (queryData: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newQuery: Query = {
      ...queryData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setQueries(prev => [newQuery, ...prev]);
  };

  const updateQuery = (id: string, updates: Partial<Query>) => {
    setQueries(prev => prev.map(query => 
      query.id === id 
        ? { ...query, ...updates, updatedAt: new Date() }
        : query
    ));
  };

  const assignQuery = (queryId: string, userId: string, userName: string) => {
    updateQuery(queryId, { 
      assignedTo: userId,
      assignedToName: userName,
      status: 'active'
    });
  };

  const respondToQuery = (queryId: string, response: string) => {
    updateQuery(queryId, {
      status: 'responded',
      response,
      responseAt: new Date(),
    });
  };

  const getActiveQueries = () => queries.filter(q => q.status === 'active');
  const getRespondedQueries = () => queries.filter(q => q.status === 'responded');
  const getPendingQueries = () => queries.filter(q => q.status === 'pending');

  return (
    <QueryContext.Provider value={{
      queries,
      addQuery,
      updateQuery,
      assignQuery,
      respondToQuery,
      getActiveQueries,
      getRespondedQueries,
      getPendingQueries,
    }}>
      {children}
    </QueryContext.Provider>
  );
};
