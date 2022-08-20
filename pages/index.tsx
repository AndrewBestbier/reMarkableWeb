import { ChangeEvent, useEffect, useState } from "react";
import { Header } from "../components/header";
import { AiFillFolder, AiFillFile, AiOutlineFolder } from "react-icons/ai";
import { HiOutlineChevronRight, HiOutlineChevronDown } from "react-icons/hi";
import { proxy, useSnapshot } from "valtio";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import classNames from "classnames";
import { saveAs } from "file-saver";
import { RegisterDeviceModal } from "../components/register-modal";
import Fuse from "fuse.js";
import { ReadwiseModal } from "../components/readwise-modal";
import toast from "react-hot-toast";

type File = {
  id: string;
  hash: string;
  type: "DocumentType" | "CollectionType";
  visibleName: string;
  lastModified: string;
  fileType?: "pdf";
  parent?: string;
  pinned: boolean;
  lastOpened: string;
  childNodes: File[];
};

const store = proxy<{
  examinedFileHash: string;
  searchText: string;
  refreshToken: string;
  examinedFileTitle: string;
}>({
  examinedFileHash: "",
  searchText: "",
  examinedFileTitle: "",
  refreshToken: "",
});

const setExaminedFileHash = (fileHash: string) => {
  store.examinedFileHash = fileHash;
};

const setSearchText = (searchText: string) => {
  store.searchText = searchText;
};

const setExaminedFileTitle = (fileTitle: string) => {
  store.examinedFileTitle = fileTitle;
};

const setRefreshToken = (refreshToken: string) => {
  store.refreshToken = refreshToken;
};

const createDataTree = (dataset: File[]) => {
  const hashTable = Object.create(null);
  dataset.forEach(
    (aData) => (hashTable[aData.id] = { ...aData, childNodes: [] })
  );
  const dataTree: File[] = [];
  dataset.forEach((aData) => {
    if (aData.parent) {
      if (hashTable[aData.parent]) {
        hashTable[aData.parent].childNodes.push(hashTable[aData.id]);
      }
    } else {
      dataTree.push(hashTable[aData.id]);
    }
  });
  return dataTree;
};

function downloadBlob(content: any, filename: any, contentType: any) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const pom = document.createElement("a");
  pom.href = url;
  pom.setAttribute("download", filename);
  pom.click();
}

function arrayToCsv(data: any) {
  return data
    .map(
      (row: any) =>
        row
          .map(String) // convert every value to String
          .map((v: any) => v.replaceAll('"', '""')) // escape double colons
          .map((v: any) => `"${v}"`) // quote it
          .join(",") // comma-separated
    )
    .join("\r\n"); // rows starting on new lines
}

const Index = () => {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [missingUpdates, setMissingUpdates] = useState<
    {
      id: string;
      hash: string;
    }[]
  >([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);

  const { refreshToken } = useSnapshot(store);

  useEffect(() => {
    setDeviceToken(localStorage.getItem("deviceToken"));
  }, []);

  const registerDeviceToken = (deviceToken: string) => {
    setDeviceToken(deviceToken);
    localStorage.setItem("deviceToken", deviceToken);
  };

  const refreshTokenQuery = useQuery(
    ["refresh-token"],
    async () => {
      const response = await axios.post(
        "/api/refresh-token",
        {},
        {
          headers: {
            Authorization: `Bearer ${deviceToken}`,
          },
        }
      );
      return response.data.refreshToken;
    },
    { enabled: !!deviceToken && true, staleTime: Infinity }
  );

  useEffect(() => {
    setRefreshToken(refreshTokenQuery.data);
  }, [refreshTokenQuery.data]);

  const filesQuery = useQuery<File[]>(
    ["files", refreshToken],
    async () => {
      const response = await axios.get("/api/files", {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      return response.data.files;
    },
    { enabled: !!refreshToken }
  );

  const updatesQuery = useQuery(
    ["updates", refreshToken],
    async () => {
      const response = await axios.get("/api/updates", {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      return response.data;
    },
    { enabled: !!refreshToken && !!filesQuery.data }
  );

  useEffect(() => {
    const updates = updatesQuery.data;
    const parsedUpdates: { id: string; hash: string }[] =
      updates?.map((file: string) => {
        const id = file.split(":")[2];
        const hash = file.split(":")[0];
        return { id, hash };
      }) || [];

    const updatesMap = parsedUpdates.reduce<{ [index: string]: string }>(
      (acc, { id, hash }) => {
        acc[id] = hash;
        acc[hash] = id;
        return acc;
      },
      {}
    );

    const files: File[] = filesQuery.data || [];
    const filesMap =
      files?.reduce<{ [index: string]: string }>((acc, file: File) => {
        acc[file.hash] = file.id;
        acc[file.id] = file.hash;
        return acc;
      }, {}) || [];

    const filteredFiles =
      files?.filter((file: File) => {
        if (
          updatesMap[file.id] === undefined ||
          updatesMap[file.id] !== file.hash
        ) {
          return false;
        }
        return true;
      }) || [];

    setFilteredFiles(filteredFiles);

    const missing =
      parsedUpdates?.filter(({ id, hash }: any) => {
        return !filesMap[id] || !filesMap[hash];
      }) || [];

    setMissingUpdates(missing);
  }, [filesQuery.data, updatesQuery.data]);

  const missingUpdatesQuery = useQuery(
    ["updates", missingUpdates],
    async () => {
      const response = await axios.get(
        `/api/missing?fileHashes=${missingUpdates
          .map((update) => update.hash)
          .join(",")}`,
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      return response.data.files;
    },
    { enabled: !!missingUpdates.length && !!refreshToken }
  );

  const files = (filteredFiles || []).concat(missingUpdatesQuery?.data || []);

  return (
    <>
      <Header />
      <RegisterDeviceModal
        isOpen={!deviceToken}
        setDeviceToken={(deviceToken: string) =>
          registerDeviceToken(deviceToken)
        }
      />
      <div className="grid grid-cols-12 grid-rows-1 grow overflow-hidden">
        <div className="col-span-3 overflow-x-auto overflow-y-auto flex grow">
          <Sidebar files={files} />
        </div>
        <div className="col-span-9 flex grow overscroll-contain overflow-auto">
          <FileView />
        </div>
      </div>
    </>
  );
};

type ReadwiseHighlight = {
  text: string;
  title: string;
  location: number;
  location_type: string;
};

export const exportToReadwise = async (highlights: ReadwiseHighlight[]) => {
  return axios.post(
    "https://readwise.io/api/v2/highlights/",
    {
      highlights,
    },
    {
      headers: {
        Authorization: `Token ${localStorage.getItem("readwiseToken")}`,
      },
    }
  );
};

const Highlights = ({ highlights }: any) => {
  const { examinedFileTitle } = useSnapshot(store);
  const [showReadwiseModal, setShowReadwiseModal] = useState(false);
  const [readwiseToken, setReadwiseToken] = useState<string | null>(null);

  useEffect(() => {
    setReadwiseToken(localStorage.getItem("readwiseToken"));
  }, []);

  const { mutate, isLoading } = useMutation(exportToReadwise, {
    onSuccess: (response) => {
      toast.success("Highlights exported to Readwise successfully");
    },
    onError: () => {
      toast.error("There was an error exporting your highlights");
    },
  });

  return (
    <>
      <ReadwiseModal
        isOpen={showReadwiseModal}
        setReadwiseToken={(token: string) => {
          localStorage.setItem("readwiseToken", token);
          setShowReadwiseModal(false);
          setReadwiseToken(token);
          toast.success(
            "Readwise Token saved. You can now export your highlights."
          );
        }}
      />
      <div className="w-full p-10">
        <h1 className="text-center font-remarkable text-2xl">
          {examinedFileTitle}
        </h1>
        <div className="flex items-center w-full gap-x-10 mb-5 mt-5">
          {!readwiseToken ? (
            <button
              onClick={() => {
                const readwiseToken = localStorage.getItem("readwiseToken");

                if (!readwiseToken) {
                  setShowReadwiseModal(true);
                }
              }}
              type="button"
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Configure Readwise
            </button>
          ) : null}
          {readwiseToken ? (
            <button
              onClick={() => {
                const readwiseHighlights: ReadwiseHighlight[] = highlights
                  .map((page: any, index: any) => {
                    return page.map(({ text }: { text: string }) => {
                      return {
                        text,
                        title: examinedFileTitle,
                        location: index + 1,
                        location_type: "page",
                      };
                    });
                  })
                  .flat();
                mutate(readwiseHighlights);
              }}
              type="button"
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              {!isLoading ? "Export to Readwise" : "Exporting"}
            </button>
          ) : null}
          <button
            onClick={() => {
              const csvHighlights = highlights
                .map((page: any, index: any) => {
                  return page.map(({ text }: any) => [
                    text,
                    examinedFileTitle,
                    "",
                    "",
                    "",
                    index + 1,
                    new Date(),
                  ]);
                })
                .flat();

              const rows = [
                [
                  "Highlight",
                  "Title",
                  "Author",
                  "URL",
                  "Note",
                  "Location",
                  "Date",
                ],
              ]
                .concat(csvHighlights)
                .filter((item) => item.length);
              const csvContent = arrayToCsv(rows);
              downloadBlob(csvContent, "export.csv", "text/csv;charset=utf-8;");
            }}
            type="button"
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Download CSV
          </button>
          <button
            onClick={() => {
              const content = highlights
                .map((page: any, index: number) => {
                  if (!page.length) {
                    return null;
                  }
                  return [`## Page ${index + 1}`]
                    .concat(page.map((highlight: any) => highlight.text))
                    .join("\n\n");
                })
                .filter((item: any) => item)
                .join("\n\n");
              const blob = new Blob([`# ${examinedFileTitle} \n${content}`], {
                type: "text/plain;charset=utf-8",
              });
              saveAs(blob, `${examinedFileTitle}.md`);
            }}
            type="button"
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Download Markdown
          </button>
        </div>
        {highlights.map((page: any, index: any) => {
          return page.length ? (
            <div key={index} className="pb-10">
              <h1 className="text-xl font-remarkable">Page {index + 1}</h1>
              <div className="mt-4">
                {page.map((highlight: any) => {
                  return (
                    <div
                      key={highlight.text}
                      className="flex gap-x-6 gap-y-4 mb-6"
                    >
                      <div>
                        <div
                          className={classNames("rounded", {
                            "bg-yellow-500": highlight.color === 3,
                            "bg-green-500": highlight.color === 4,
                            "bg-fuchsia-500": highlight.color === 5,
                            "bg-gray-600": highlight.color === 8,
                          })}
                          style={{
                            width: 20,
                            maxWidth: 20,
                            height: 20,
                            maxHeight: 20,
                          }}
                        />
                      </div>
                      <p className="text-md text-gray-700">{highlight.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null;
        })}
      </div>
    </>
  );
};

const FileView = () => {
  const { examinedFileHash, refreshToken } = useSnapshot(store);
  const { data, isLoading } = useQuery(
    ["file", examinedFileHash],
    async () => {
      const response = await axios.get(
        `/api/highlights?fileHash=${examinedFileHash}`,
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      return response.data;
    },
    { enabled: !!examinedFileHash, staleTime: Infinity }
  );

  const highlights = data?.highlights;

  if (!examinedFileHash) {
    return (
      <div className="flex items-center justify-center w-full">
        <h1 className="font-remarkable text-4xl">
          Select a document to view highlights
        </h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full">
        <h1 className="font-remarkable text-4xl animate-bounce">Loading</h1>
      </div>
    );
  }

  return <Highlights highlights={highlights} />;
};

const File = ({ file }: { file: File }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div key={file.id}>
      <div
        className="flex flex-nowrap items-center gap-x-2 cursor-pointer"
        onClick={() => {
          if (file.type === "CollectionType" && file.childNodes.length) {
            setExpanded((state) => !state);
            return;
          }
          if (file.type === "DocumentType") {
            setExaminedFileHash(file.hash);
            setExaminedFileTitle(file.visibleName);
            return;
          }
        }}
      >
        {file.type === "CollectionType" && file.childNodes.length ? (
          <>
            {!expanded ? <HiOutlineChevronRight className="min-w-fit" /> : null}
            {expanded ? <HiOutlineChevronDown className="min-w-fit" /> : null}
          </>
        ) : null}
        {file.type === "CollectionType" && file.childNodes.length ? (
          <AiFillFolder className="min-w-fit" />
        ) : null}
        {file.type === "CollectionType" && !file.childNodes.length ? (
          <AiOutlineFolder className="min-w-fit ml-6" />
        ) : null}
        {file.type === "DocumentType" && !file.childNodes?.length ? (
          <AiFillFile className="min-w-fit ml-6" />
        ) : null}
        {file.visibleName}
      </div>
      <div className="flex flex-col ml-6">
        {expanded &&
          file.childNodes
            .sort(
              (a, b) =>
                a.type.localeCompare(b.type) ||
                a.visibleName.localeCompare(b.visibleName)
            )
            .map((file) => <File file={file} key={file.id} />)}
      </div>
    </div>
  );
};

const Sidebar = ({ files }: { files: File[] }) => {
  const { searchText } = useSnapshot(store);

  const fuse = new Fuse(
    files.filter((file) => file.type === "DocumentType"),
    {
      keys: ["visibleName"],
      includeScore: true,
      threshold: 0.4,
    }
  );

  const searchResults = fuse.search(searchText);
  const fileTree = createDataTree(files);

  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  return (
    <div className="py-4 px-6 border-r whitespace-nowrap overflow-auto grow">
      <input
        type="text"
        className="w-full mb-4 appearance-none border w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={searchText}
        placeholder="Search"
        onChange={onSearch}
      />
      {!searchText
        ? fileTree
            .sort(
              (a, b) =>
                a.type.localeCompare(b.type) ||
                a.visibleName.localeCompare(b.visibleName)
            )
            .map((file) => <File file={file} key={file.id} />)
        : searchResults.map((result) => (
            <File file={result.item} key={result.item.id} />
          ))}
    </div>
  );
};

export default Index;
