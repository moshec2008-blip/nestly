export type ModuleRecordStatus = "open" | "done";

export type ModuleRecord = {
  id: string;
  title: string;
  description: string;
  owner: string;
  category: string;
  date: string;
  status: ModuleRecordStatus;
};
