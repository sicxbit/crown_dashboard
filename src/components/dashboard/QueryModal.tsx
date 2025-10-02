import React, { useState } from 'react';
import { useQuery, Query } from '../../contexts/QueryContext';
import { useAuth } from '../../contexts/AuthContext';
import QueryStatusBadge from './QueryStatusBadge';
import PriorityBadge from './PriorityBadge';
import { 
  X, 
  Calendar, 
  User, 
  Mail, 
  MessageSquare, 
  Send,
  CheckCircle,
  Clock
} from 'lucide-react';

interface QueryModalProps {
  queryId: string;
  onClose: () => void;
  onRespond: (queryId: string, response: string) => void;
}

const QueryModal: React.FC<QueryModalProps> = ({ queryId, onClose, onRespond }) => {
  const { queries } = useQuery();
  const { user } = useAuth();
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const query = queries.find(q => q.id === queryId);

  if (!query) return null;

  const canRespond = query.status !== 'responded' && (
    user?.role === 'admin' || 
    user?.role === 'manager' || 
    query.assignedTo === user?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate API call
    onRespond(queryId, response);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Client Request Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Query Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100 pr-4">
                {query.subject}
              </h3>
              <div className="flex items-center space-x-2">
                <PriorityBadge priority={query.priority} />
                <QueryStatusBadge status={query.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4 mr-2" />
                <span>{query.clientName}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2" />
                <span>{query.clientEmail}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created {new Date(query.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                <span>Updated {new Date(query.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Original Message */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Care Request Details
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{query.message}</p>
          </div>

          {/* Assignment Info */}
          {query.assignedToName && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Assignment</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Assigned to {query.assignedToName}
              </p>
            </div>
          )}

          {/* Existing Response */}
          {query.response && (
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Response</h4>
                {query.responseAt && (
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {new Date(query.responseAt).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{query.response}</p>
            </div>
          )}

          {/* Response Form */}
          {canRespond && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="response"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Response
                  </label>
                  <textarea
                    id="response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Write your response about care services and next steps..."
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !response.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/40 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center text-sm md:text-base"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Response
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryModal;
