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
      const { fileHashes } = req.query;
      const authorization = req.headers.authorization;

      const missingFiles = fileHashes.split(",");

      const files = [];

      for await (const file of missingFiles) {
        const url = await getFileUrlByHash(file, authorization);
        const download = await axios.get(url);
        const fileNames: string[] = download.data.split("\n");
        const metaData = fileNames.find((fileName) =>
          fileName.includes("metadata")
        );

        const metaDataHash = metaData.split(":")[0];
        const metaDataId = metaData.split(":")[2].split(".")[0];

        const metaDataFileUrl = await getFileUrlByHash(
          metaDataHash,
          authorization
        );
        const metaDataContent = await axios.get(metaDataFileUrl);
        const data = metaDataContent.data;
        files.push({
          id: metaDataId,
          hash: file,
          type: data.type,
          visibleName: data.visibleName,
          lastModified: data.lastModified,
          parent: data.parent,
          pinned: data.pinned,
          lastOpened: data.lastOpened,
        });
      }

      res.status(200).json({ files });
    }
  } catch (e) {
    console.error(e);

    return res.status(500).send({ success: false });
  }
};
