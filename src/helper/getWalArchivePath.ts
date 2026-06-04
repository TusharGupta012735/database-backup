import { text } from "@clack/prompts";

export async function getWalArchivePath(): Promise<string> {
  const walArchivePath = await text({
    message: "Enter local or mounted WAL archive directory",
    validate(value) {
      if (value!.length === 0) return "WAL archive directory is required !";
    },
  });

  return walArchivePath as string;
}

export async function getBackupMetadataPath(): Promise<string> {
  const metadataPath = await text({
    message: "Enter previous backup metadata file or directory",
    validate(value) {
      if (value!.length === 0) return "Previous backup metadata path is required !";
    },
  });

  return metadataPath as string;
}
