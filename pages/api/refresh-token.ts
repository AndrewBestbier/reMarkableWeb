import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Data = {
  refreshToken: string;
};

export default async (
  req: NextApiRequest & { body: { code: string } },
  res: NextApiResponse<Data>
) => {
  try {
    if (req.method === "POST") {
      const result = await axios.post<string>(
        "https://webapp-production-dot-remarkable-production.appspot.com/token/json/2/user/new",
        {},
        { headers: { Authorization: req.headers.authorization! } }
      );
      res.status(200).json({ refreshToken: result.data });
    }
  } catch (e) {
    console.error(e);
    // @ts-ignore
    return res.status(500).send({ success: false });
  }
};
