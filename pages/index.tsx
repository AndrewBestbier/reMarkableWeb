import { ChangeEvent, useEffect, useState } from "react";
import { Header } from "../components/header";
import {
  AiOutlineMenu,
  AiFillFolder,
  AiFillFile,
  AiOutlineFolder,
} from "react-icons/ai";
import { HiOutlineChevronRight, HiOutlineChevronDown } from "react-icons/hi";
import { proxy, useSnapshot } from "valtio";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import classNames from "classnames";
import { RegisterDeviceModal } from "../components/register-modal";
import Fuse from "fuse.js";
import { Highlights } from "../components/highlights";

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

export const store = proxy<{
  examinedFileHash: string;
  showSideBar: boolean;
  searchText: string;
  refreshToken: string;
  examinedFileTitle: string;
}>({
  examinedFileHash: "",
  showSideBar: false,
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

const setShowSideBar = (value: boolean) => {
  store.showSideBar = value;
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

export type Highlight = {
  text: string;
  color: number;
};

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
    { enabled: !!deviceToken, staleTime: Infinity }
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
      <div className="flex flex-col lg:flex-row grow overflow-hidden">
        <div className="flex lg:w-1/3">
          <Sidebar files={files} />
        </div>
        <div className="flex grow overscroll-contain overflow-auto">
          <FileView />
        </div>
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
        <h1 className="font-remarkable text-4xl text-center px-8">
          Select a document to view highlights
        </h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full text-center px-16">
        <h1 className="font-remarkable text-4xl animate-bounce">Loading</h1>
      </div>
    );
  }

  return <Highlights highlights={highlights} />;
};

const File = ({ file }: { file: File }) => {
  const { examinedFileHash } = useSnapshot(store);
  const [expanded, setExpanded] = useState(false);

  return (
    <div key={file.id}>
      <div
        className={classNames(
          "flex flex-nowrap items-center gap-x-2 cursor-pointer",
          {
            "transition ease-in-out duration-100 hover:bg-gray-100":
              examinedFileHash !== file.hash,
            "bg-sky-100": examinedFileHash === file.hash,
          }
        )}
        onClick={() => {
          if (file.type === "CollectionType" && file.childNodes.length) {
            setExpanded((state) => !state);
            return;
          }
          if (file.type === "DocumentType") {
            setExaminedFileHash(file.hash);
            setExaminedFileTitle(file.visibleName);
            setShowSideBar(false);
            return;
          }
        }}
      >
        {file.type === "CollectionType" && file.childNodes.length ? (
          <>
            {!expanded ? <HiOutlineChevronRight /> : null}
            {expanded ? <HiOutlineChevronDown /> : null}
          </>
        ) : null}
        {file.type === "CollectionType" && file.childNodes.length ? (
          <AiFillFolder />
        ) : null}
        {file.type === "CollectionType" && !file.childNodes.length ? (
          <AiOutlineFolder className="ml-6" />
        ) : null}
        {file.type === "DocumentType" && !file.childNodes?.length ? (
          <AiFillFile className="ml-6" style={{ minWidth: "1rem" }} />
        ) : null}
        <div
          className={classNames({
            "transition ease-in-out duration-100 hover:bg-gray-100":
              examinedFileHash !== file.hash,
            "bg-sky-100": examinedFileHash === file.hash,
          })}
        >
          {file.visibleName}
        </div>
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
  const { searchText, showSideBar } = useSnapshot(store);

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
    <div className="flex flex-col lg:border-r z-10 w-full">
      <div
        className="flex lg:hidden gap-x-6 items-center cursor-pointer py-4 px-6"
        onClick={() => setShowSideBar(!showSideBar)}
      >
        <AiOutlineMenu className="w-6 h-6" />
        <div className="text-lg font-bold">Files</div>
      </div>
      <div
        className={classNames("w-full lg:inline px-6 lg:pt-6", {
          inline: showSideBar,
          hidden: !showSideBar,
        })}
      >
        <input
          type="text"
          className={classNames(
            "w-full appearance-none border w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          )}
          value={searchText}
          placeholder="Search"
          onChange={onSearch}
        />
      </div>
      <div
        className={classNames(
          "lg:inline top-44 overflow-auto whitespace-nowrap bottom-0 left-0 right-0 flex flex-col bg-white h-full py-4 px-6",
          {
            absolute: showSideBar,
            hidden: !showSideBar,
          }
        )}
      >
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
    </div>
  );
};

export default Index;
