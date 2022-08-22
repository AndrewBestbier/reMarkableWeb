import { useEffect, useState } from "react";
import Link from "next/link";

export const Header = () => {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    setDeviceToken(localStorage.getItem("deviceToken"));
  }, []);

  return (
    <header className="flex px-6 pt-5 pb-4 bg-white border-b border-gray-200 items-center justify-between">
      <div className="flex justify-center items-center gap-x-20 h-full">
        <Link href="/">
          <a className="font-remarkable text-slate-900 hover:text-slate-900 text-xl lg:text-3xl font-bold cursor-pointer">
            reMarkable Web
          </a>
        </Link>
        <Link href="/manual">
          <a className="hover:text-blue-500 hidden sm:inline">Manual upload</a>
        </Link>
      </div>
      <div className="justify-center items-center gap-x-10 hidden lg:flex">
        <a
          href="https://www.buymeacoffee.com/andrewbest"
          className="text-blue-500"
        >
          Enjoying this service? Click here to buy me a coffee
        </a>
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
      </div>
    </header>
  );
};
