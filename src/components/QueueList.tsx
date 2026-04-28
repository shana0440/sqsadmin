import { useState } from 'react';
import { Select } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { QueueInfo } from '#/lib/sqs';
import SystemFilterCombobox from './SystemFilterCombobox';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';

type QueueListResponse = {
  items: QueueInfo[];
  nextToken?: string;
};

type FilterOptionsResponse = {
  items: string[];
};

const fetchQueues = async (
  pageToken: string | undefined,
  pageSize: number,
  systemFilterText: string,
  environmentFilter: string,
): Promise<QueueListResponse> => {
  const params = new URLSearchParams();
  params.set('limit', String(pageSize));
  if (pageToken) {
    params.set('nextToken', pageToken);
  }
  if (systemFilterText.trim()) {
    params.set('system', systemFilterText.trim());
  }
  if (environmentFilter.trim()) {
    params.set('environment', environmentFilter.trim());
  }

  const query = `/api/queues?${params.toString()}`;

  const response = await fetch(query);

  if (!response.ok) {
    throw new Error(`Failed to fetch queues: ${response.statusText}`);
  }

  return response.json();
};

const fetchSystems = async (): Promise<FilterOptionsResponse> => {
  const response = await fetch('/api/systems');

  if (!response.ok) {
    throw new Error(`Failed to fetch systems: ${response.statusText}`);
  }

  return response.json();
};

const fetchEnvironments = async (): Promise<FilterOptionsResponse> => {
  const response = await fetch('/api/environments');

  if (!response.ok) {
    throw new Error(`Failed to fetch environments: ${response.statusText}`);
  }

  return response.json();
};

export default function QueueList() {
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showDlqOnly, setShowDlqOnly] = useState(true);
  const [systemFilterText, setSystemFilterText] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const PAGE_SIZE = 100;

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: [
      'queues',
      pageToken,
      PAGE_SIZE,
      systemFilterText,
      environmentFilter,
    ],
    queryFn: () =>
      fetchQueues(pageToken, PAGE_SIZE, systemFilterText, environmentFilter),
  });

  const { data: systemsData } = useQuery({
    queryKey: ['systems'],
    queryFn: fetchSystems,
  });

  const { data: environmentsData } = useQuery({
    queryKey: ['environments'],
    queryFn: fetchEnvironments,
  });

  const allQueues = data?.items ?? [];
  const systemNames = systemsData?.items ?? [];
  const environmentNames = environmentsData?.items ?? [];
  const queues = showDlqOnly
    ? allQueues.filter((q) => q.deadLetterSourceQueues.length > 0)
    : allQueues;
  const normalizedTextFilter = textFilter.trim().toLowerCase();
  const filteredQueues =
    normalizedTextFilter === ''
      ? queues
      : queues.filter((queue) =>
          queue.name.toLowerCase().includes(normalizedTextFilter),
        );
  const nextToken = data?.nextToken;
  const hasMore = !!nextToken;
  const loading = isLoading || isFetching;

  const handleNextPage = () => {
    if (nextToken) {
      setPageToken(nextToken);
      setPage((currentPage) => currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPageToken(undefined);
      setPage(1);
    }
  };

  if (loading && queues.length === 0) {
    return (
      <div className="p-4 text-center dark:text-gray-300">
        Loading queues...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">Error: {error.message}</div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Your Queues
      </h2>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="relative w-64">
            <SearchIcon />
            <input
              type="text"
              value={textFilter}
              onChange={(event) => setTextFilter(event.target.value)}
              placeholder="Filter queue name"
              className="w-full pl-9 pr-3 py-1.5 text-sm font-medium rounded-md border bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SystemFilterCombobox
            value={systemFilterText}
            options={systemNames}
            onChange={setSystemFilterText}
          />

          <div className="relative">
            <Select
              value={environmentFilter}
              onChange={(event) => setEnvironmentFilter(event.target.value)}
              className="appearance-none px-3 pr-8 py-1.5 text-sm font-medium rounded-md border bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            >
              <option value="">All Environments</option>
              {environmentNames.map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
                </option>
              ))}
            </Select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-300">
              <ChevronDownIcon />
            </span>
          </div>

          <button
            onClick={() => setShowDlqOnly(!showDlqOnly)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border cursor-pointer ${
              showDlqOnly
                ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
            }`}
          >
            {showDlqOnly ? 'Showing DLQ Only' : 'Showing All Queues'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Queue Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Messages Available
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Messages In Flight
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredQueues.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8">
                  <div className="text-center dark:text-gray-300 p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <svg
                      className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p className="mt-2 text-lg font-medium">No queues found</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No accessible queues are available.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filteredQueues.map((queue) => {
              const encodedUrl = btoa(queue.url);
              const isFifo = queue.attributes?.FifoQueue === 'true';

              return (
                <tr key={queue.url}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {queue.name}
                    {queue.deadLetterSourceQueues.length > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                        DLQ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {isFifo ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                        FIFO
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {queue.attributes?.ApproximateNumberOfMessages || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {queue.attributes?.ApproximateNumberOfMessagesNotVisible ||
                      '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex space-x-2">
                    <Link
                      to="/queues/$queueUrl"
                      params={{ queueUrl: encodedUrl }}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-between items-center px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Page {page}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1 || loading}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${
              page === 1 || loading
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!hasMore || loading}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${
              !hasMore || loading
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer'
            }`}
          >
            Next
          </button>
        </div>
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
