import axios from "axios";
import { v4 } from "uuid";

export const registerDevice = async (code: string) => {
  return axios.post(
    "https://webapp-production-dot-remarkable-production.appspot.com/token/json/2/device/new",
    {
      code,
      deviceDesc: "browser-chrome",
      deviceId: v4(),
    },
    {
      headers: {
        // Authorization: "Bearer ",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    }
  );
};
