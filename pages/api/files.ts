import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Data = {
  files: File[];
};

type File = {
  id: string;
  hash: string;
  type: "DocumentType";
  visibleName: string;
  lastModified: string;
  fileType: "pdf";
  parent: string;
  pinned: boolean;
  lastOpened: string;
};

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    if (req.method === "GET") {
      const result = await axios.get<File[]>(
        "https://internal.cloud.remarkable.com/doc/v2/files",
        { headers: { Authorization: req.headers.authorization! } }
      );
      res.status(200).json({ files: result.data });
    }
  } catch (e) {
    console.error(e);
    // @ts-ignore
    return res.status(500).send({ success: false });
  }
};
