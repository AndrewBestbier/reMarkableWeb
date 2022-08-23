import { BiLibrary } from "react-icons/bi";
import { AiFillStar, AiFillFilePdf, AiFillRead } from "react-icons/ai";
import { useSnapshot } from "valtio";
import { store, Filter, setFilter } from "../state/store";
import classNames from "classnames";

const Link = ({ icon, filter }: { icon: React.ReactNode; filter: Filter }) => {
  const { filter: activeFilter } = useSnapshot(store);
  const active = filter === activeFilter;
  return (
    <div
      onClick={() => setFilter(filter)}
      className={classNames(" p-1 rounded-lg w-8 h-8 text-2xl cursor-pointer", {
        "bg-blue-100 text-blue-400": active,
        "text-gray-400 hover:bg-blue-100 hover:text-blue-400": !active,
      })}
    >
      {icon}
    </div>
  );
};

export const Navigation = () => {
  return (
    <div
      style={{ minWidth: "4rem" }}
      className="bg-gray-100 hidden md:flex h-full w-20 border-r border-gray-200 flex-col items-center pt-2"
    >
      <div className="border-b border-gray-300 pt-2 pb-3 mb-6">
        <div className="font-remarkable text-3xl">rM</div>
      </div>
      <div className="flex flex-col gap-y-6">
        <Link filter={"none"} icon={<BiLibrary />} />
        <Link filter={"favourites"} icon={<AiFillStar />} />
        <Link filter={"pdf"} icon={<AiFillFilePdf />} />
        <Link filter={"ebook"} icon={<AiFillRead />} />
      </div>
    </div>
  );
};
