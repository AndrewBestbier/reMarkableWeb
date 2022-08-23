import classNames from "classnames";
import { Highlight, store } from "../pages";
import { useEffect, useState } from "react";
import { Tree } from "antd";
import "antd/dist/antd.css";
import { useSnapshot } from "valtio";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ReadwiseModal } from "./readwise-modal";
import { saveAs } from "file-saver";
import axios from "axios";

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

type ReadwiseHighlight = {
  text: string;
  title: string;
  location: number;
  location_type: string;
};

const exportToReadwise = async (highlights: ReadwiseHighlight[]) => {
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

export const Highlights = ({ highlights }: { highlights: Highlight[][] }) => {
  const { examinedFileTitle } = useSnapshot(store);
  const [showReadwiseModal, setShowReadwiseModal] = useState(false);
  const [readwiseToken, setReadwiseToken] = useState<string | null>(null);

  const [checkedKeys, setCheckedKeys] = useState([]);
  const [checkedHighlights, setCheckedHighlights] = useState([]);

  const onCheck = (checkedKeysValue: string[], e: any) => {
    const checkedData = e.checkedNodes
      // @ts-ignore
      .filter((node) => !node?.children?.length)
      // @ts-ignore
      .map((node) => ({ text: node.key, location: node.data.location }));
    setCheckedHighlights(checkedData);
    // @ts-ignore
    setCheckedKeys(checkedKeysValue);
  };

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
      <div className="w-full py-4 px-6 lg:p-10">
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
                const readwiseHighlights: ReadwiseHighlight[] =
                  checkedHighlights.map(
                    ({
                      text,
                      location,
                    }: {
                      text: string;
                      location: number;
                    }) => {
                      return {
                        text,
                        title: examinedFileTitle,
                        location,
                        location_type: "page",
                      };
                    }
                  );
                mutate(readwiseHighlights);
              }}
              disabled={!checkedHighlights.length}
              type="button"
              className={classNames(
                "inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500",
                {
                  "bg-slate-400 cursor-not-allowed": !checkedHighlights.length,
                },
                {
                  "bg-slate-600 hover:bg-slate-700 cursor-pointer":
                    !!checkedHighlights.length,
                }
              )}
            >
              {!isLoading ? "Export to Readwise" : "Exporting"}
            </button>
          ) : null}
          <button
            onClick={() => {
              const csvHighlights = checkedHighlights.map(
                ({ text, location }: { text: string; location: number }) => {
                  return [
                    text,
                    examinedFileTitle,
                    "",
                    "",
                    "",
                    location,
                    new Date(),
                  ];
                }
              );

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
                // @ts-ignore
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
        <Tree
          checkable
          showIcon
          defaultExpandAll
          //@ts-ignore
          checkedKeys={checkedKeys}
          //@ts-ignore
          onCheck={onCheck}
          onSelect={(text) => {
            //@ts-ignore
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
          }}
        >
          <Tree.TreeNode
            title={examinedFileTitle}
            key={"root"}
            className="text-slate-800 font-bold mt-10"
          >
            {highlights.map((page, index) => {
              return page.length ? (
                <Tree.TreeNode
                  title={`Page ${index + 1}`}
                  key={`Page ${index + 1}`}
                  className="text-slate-800 font-bold"
                  selectable={false}
                >
                  {page.map((highlight) => {
                    return (
                      <Tree.TreeNode
                        title={highlight.text}
                        key={highlight.text}
                        className="my-2"
                        // @ts-ignore
                        data={{ location: index + 1 }}
                        icon={
                          <div>
                            <div
                              className={classNames("rounded", {
                                "bg-yellow-500": highlight.color === 3,
                                "bg-green-500": highlight.color === 4,
                                "bg-fuchsia-500": highlight.color === 5,
                                "bg-gray-600": highlight.color === 8,
                              })}
                              style={{
                                width: 24,
                                maxWidth: 24,
                                height: 24,
                                maxHeight: 24,
                                marginRight: 20,
                              }}
                            />
                          </div>
                        }
                      />
                    );
                  })}
                </Tree.TreeNode>
              ) : null;
            })}
          </Tree.TreeNode>
        </Tree>
      </div>
    </>
  );
};
