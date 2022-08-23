import { proxy } from "valtio";

export type Filter = "none" | "favourites" | "pdf" | "ebook";

export const store = proxy<{
  examinedFileHash: string;
  showSideBar: boolean;
  searchText: string;
  refreshToken: string;
  examinedFileTitle: string;
  filter: Filter;
}>({
  examinedFileHash: "",
  showSideBar: false,
  searchText: "",
  examinedFileTitle: "",
  refreshToken: "",
  filter: "none",
});

export const setExaminedFileHash = (fileHash: string) => {
  store.examinedFileHash = fileHash;
};

export const setSearchText = (searchText: string) => {
  store.searchText = searchText;
};

export const setShowSideBar = (value: boolean) => {
  store.showSideBar = value;
};

export const setExaminedFileTitle = (fileTitle: string) => {
  store.examinedFileTitle = fileTitle;
};

export const setRefreshToken = (refreshToken: string) => {
  store.refreshToken = refreshToken;
};

export const setFilter = (filter: Filter) => {
  store.filter = filter;
};
