// @ts-nocheck
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

const getFileUrlByHash = async (fileHash: any, authorization: any) => {
  const result = await axios.post<{ url: string }>(
    "https://internal.cloud.remarkable.com/api/v1/signed-urls/downloads",
    {
      http_method: "GET",
      relative_path: fileHash,
    },
    { headers: { Authorization: authorization! } }
  );
  return result.data.url;
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse<{ url: string }>
) => {
  try {
    if (req.method === "GET") {
      const authorization = req.headers.authorization;

      const url = await getFileUrlByHash("root", authorization);

      const files = await axios.get(url);

      const rootFile: string[] = files.data.split("\n")[0];

      const rootFileUrl = await getFileUrlByHash(rootFile, authorization);

      const allFiles = await axios.get(rootFileUrl);
      const allFileNames: string[] = allFiles.data.split("\n");

      res.status(200).json(allFileNames.slice(1, allFileNames.length - 1));
    }
  } catch (e) {
    console.error(e);

    return res.status(500).send({ success: false });
  }
};
