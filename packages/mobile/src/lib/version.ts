import Constants from "expo-constants";

export const APP_VERSION: string =
  Constants.expoConfig?.version ?? "0.0.0";

export const APP_COMMIT: string =
  (Constants.expoConfig?.extra?.commit as string) ?? "dev";

export const APP_MAJOR_VERSION: number =
  parseInt(APP_VERSION.split(".")[0], 10) || 0;
