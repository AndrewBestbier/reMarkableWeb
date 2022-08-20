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
      const { fileHash } = req.query;

      const authorization = req.headers.authorization;

      const url = await getFileUrlByHash(fileHash, authorization);

      const files = await axios.get(url);

      const fileNames: string[] = files.data.split("\n");
      const highlightFiles = fileNames
        .filter((fileName) => fileName.includes("highlights"))
        .map((fileName) => {
          return {
            hash: fileName.substring(0, fileName.indexOf(":")),
            fileName: fileName.split("/")[1].split(".")[0],
          };
        });
      const pagesFile = fileNames
        .filter((fileName) => fileName.includes("content"))
        .map((fileName) => fileName.substring(0, fileName.indexOf(":")));

      const highlights = {};
      const pagesFileUrl = await getFileUrlByHash(pagesFile[0], authorization);
      const pagesFileResponse = await axios.get(pagesFileUrl);

      for await (const file of highlightFiles) {
        const url = await getFileUrlByHash(file.hash, authorization);
        const download = await axios.get(url);
        //@ts-ignore
        highlights[file.fileName] = download?.data?.highlights?.[0] || [];
      }

      // @ts-ignore
      const pages = pagesFileResponse.data.pages
        .map((page) => {
          // @ts-ignore
          return highlights[page] || [];
        })
        .map((pageHighlights) =>
          pageHighlights?.sort((a, b) => a.start - b.start)
        )
        .map((pageHighlights) => {
          return pageHighlights.reduce((acc, highlight, index) => {
            const previousElement = [...pageHighlights][index - 1];
            if (
              previousElement &&
              previousElement.color === highlight.color &&
              (previousElement.start + previousElement.length + 1 ===
                highlight.start ||
                previousElement.start + previousElement.length + 2 ===
                  highlight.start ||
                previousElement.start + previousElement.length + 3 ===
                  highlight.start)
            ) {
              const previousEntry = acc[acc.length - 1];
              return [
                ...acc.slice(0, acc.length - 1),
                {
                  text: previousEntry.text + " " + highlight.text,
                  color: highlight.color,
                },
              ];
            }
            return [...acc, { text: highlight.text, color: highlight.color }];
          }, []);
        });

      res.status(200).json({ highlights: pages });
    }
  } catch (e) {
    console.error(e);

    return res.status(500).send({ success: false });
  }
};
