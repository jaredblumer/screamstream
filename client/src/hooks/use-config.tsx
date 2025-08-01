import { useQuery } from "@tanstack/react-query";

interface AppConfig {
  recaptchaSiteKey: string;
}

export function useConfig() {
  const { data: config, isLoading } = useQuery<AppConfig>({
    queryKey: ["/api/config"],
    staleTime: Infinity, // Config doesn't change often
  });

  return {
    config: config || { recaptchaSiteKey: "" },
    isLoading,
  };
}