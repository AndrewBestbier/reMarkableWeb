import { Header } from "../components/header";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import classNames from "classnames";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const Dropzone = () => {
  const [examinedFile, setExaminedFile] = useState<any>(null);

  const { data } = useQuery(
    ["manual"],
    async () => {
      const data = new FormData();
      data.append("file", examinedFile);
      const response = await axios.post("/api/manual", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    { enabled: !!examinedFile, staleTime: Infinity }
  );

  const onDrop = useCallback((acceptedFiles: any) => {
    setExaminedFile(acceptedFiles[0]);
  }, []);
  const { getRootProps, acceptedFiles, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      accept: { "application/pdf": [".pdf"] },
    });

  return !data ? (
    <div
      {...getRootProps()}
      className="border-4 border-dashed border-grey-700 h-full flex items-center justify-center"
    >
      <input {...getInputProps()} />
      {acceptedFiles.length ? (
        <p className="font-remarkable text-3xl animate-bounce">Loading...</p>
      ) : isDragActive ? (
        <p className="font-remarkable text-3xl animate-bounce">
          Drop the file here ...
        </p>
      ) : (
        <p className="font-remarkable text-3xl">
          Drop your PDF downloaded from ReMarkable here
        </p>
      )}
    </div>
  ) : (
    <>
      {data.map(({ page, images, annotations }: any) => {
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
                {annotations.map((annotation: any) => {
                  return (
                    <div key={annotation} className="flex gap-x-6 gap-y-4 mb-6">
                      <div>
                        <div
                          className={classNames("rounded bg-yellow-500")}
                          style={{
                            width: 20,
                            maxWidth: 20,
                            height: 20,
                            maxHeight: 20,
                          }}
                        />
                      </div>
                      <p className="text-md text-gray-700">{annotation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const Manual = () => {
  const data: any = null;

  return (
    <>
      <Header />
      <div className="h-full py-10 px-10">
        <Dropzone />
      </div>
    </>
  );
};

export default Manual;
