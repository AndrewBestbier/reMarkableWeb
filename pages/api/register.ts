import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { v4 } from "uuid";

type Data = {
  deviceToken: string;
};

export default async (
  req: NextApiRequest & { body: { code: string } },
  res: NextApiResponse<Data>
) => {
  try {
    if (req.method === "POST") {
      const code = req.body.code;
      const result = await axios.post<string>(
        "https://webapp-production-dot-remarkable-production.appspot.com/token/json/2/device/new",
        {
          code,
          deviceDesc: "desktop-windows",
          deviceID: v4(),
        }
      );
      res.status(200).json({ deviceToken: result.data });
    }
  } catch (e) {
    console.error(e);
    // @ts-ignore
    return res.status(500).send({ success: false });
  }
};
