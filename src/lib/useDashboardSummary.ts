import useSWR from 'swr';

interface NextYearTaxItem {
  licensePlate: string;
  customerName: string;
}

interface DashboardSummary {
  totalCustomers: number;
  thisMonthRenewals: number;
  upcomingExpiry: number;
  overdueCount: number;
  alreadyTaxed: number;
  nextYearTax: NextYearTaxItem[];
}

interface DashboardSummaryResponse {
  success: boolean;
  duration: number;
  data?: DashboardSummary;
  error?: string;
}

const DASHBOARD_SUMMARY_API_URL = '/api/dashboard-summary';

const fetcher = async (url: string): Promise<DashboardSummaryResponse> => {
  const res = await fetch(url);
  const json = (await res.json()) as DashboardSummaryResponse;

  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch dashboard summary');
  }

  return json;
};

export function useDashboardSummary() {
  const { data, error, isLoading, mutate } = useSWR<DashboardSummaryResponse>(
    DASHBOARD_SUMMARY_API_URL,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  );

  return {
    data: data?.data,
    duration: data?.duration ?? 0,
    error,
    isLoading,
    refresh: mutate,
  };
}

