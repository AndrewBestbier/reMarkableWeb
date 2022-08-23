import { Header } from "../components/header";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Highlights } from "../components/highlights";

const Dropzone = () => {
  const [examinedFile, setExaminedFile] = useState<any>(null);

  const { data } = useQuery(
    ["manual"],
    async () => {
      const data = new FormData();
      data.append("file", examinedFile);
      const response = await axios.post("api/manual", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    { enabled: !!examinedFile, staleTime: Infinity }
  );

  const highlights =
    data?.map(({ annotations }: { annotations: string[] }) =>
      annotations.map((annotation) => ({ text: annotation, color: 3 }))
    ) || [];

  const onDrop = useCallback((acceptedFiles: any) => {
    setExaminedFile(acceptedFiles[0]);
  }, []);
  const { getRootProps, acceptedFiles, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      maxSize: 4 * 1000000,
      accept: { "application/pdf": [".pdf"] },
    });

  return !data ? (
    <div
      {...getRootProps()}
      className="border-4 border-dashed border-grey-700 h-full flex items-center justify-center my-10 mx-10"
    >
      <input {...getInputProps()} />
      {acceptedFiles.length ? (
        <p className="font-remarkable text-3xl animate-bounce">Loading...</p>
      ) : isDragActive ? (
        <p className="font-remarkable text-3xl animate-bounce">
          Drop the file here ...
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center gap-y-10">
          <p className="font-remarkable text-3xl">
            Drop your PDF downloaded from ReMarkable here.
            <p className="font-remarkable text-xl mt-4 text-center">
              Only Yellow highlights are picked up in manual mode for now.
            </p>
          </p>
          <p className="font-remarkable text-xl">Max size: 4MB</p>
        </div>
      )}
    </div>
  ) : (
    <div className="grid grid-cols-2 w-full">
      <div className="py-10 px-10 border-r">
        <h1 className="text-3xl font-remarkable">Image highlights</h1>
        {data?.map(({ page, images }: any) => {
          if (!images.length) {
            return null;
          }
          return (
            <div key={page}>
              <div key={page} className="pb-10">
                <h1 className="text-xl font-remarkable">Page {page}</h1>
                <div className="mt-4">
                  {images.map((image: any) => {
                    return (
                      <img
                        key={image}
                        className="mb-10"
                        src={`data:image/jpeg;base64,${image}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="py-10 px-10">
        <h1 className="text-3xl font-remarkable">Text Highlights</h1>
        <Highlights highlights={highlights} title={examinedFile.path} />
      </div>
    </div>
  );
};

const Manual = () => {
  return (
    <>
      <Header />
      <div className="h-full">
        <Dropzone />
      </div>
    </>
  );
};

export default Manual;
