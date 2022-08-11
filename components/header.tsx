import { useEffect, useState } from "react";

export const Header = () => {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    setDeviceToken(localStorage.getItem("deviceToken"));
  }, []);

  return (
    <header className="flex px-6 pt-5 pb-4 bg-white border-b border-gray-200 items-center justify-between">
      <h1 className="font-remarkable text-3xl font-bold">reMarkable Web</h1>
      {deviceToken ? (
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("deviceToken");
            location.reload();
          }}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          Remove Device
        </button>
      ) : null}
    </header>
  );
};