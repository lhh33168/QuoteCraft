import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

type DownloadedFile = {
  fileName: string;
  blob: Blob;
};

type DownloadMode = "browser-download" | "web-share" | "native-share";

function getFileNameFromDisposition(disposition: string | null, fallbackFileName: string) {
  if (!disposition) {
    return fallbackFileName;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename=\"([^\"]+)\"/i);

  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return fallbackFileName;
}

async function extractDownloadedFile(response: Response, fallbackFileName: string): Promise<DownloadedFile> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || contentType.includes("application/json")) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    throw new Error(data.error ?? "File download failed.");
  }

  const blob = await response.blob();
  const fileName = getFileNameFromDisposition(response.headers.get("content-disposition"), fallbackFileName);

  return {
    blob,
    fileName
  };
}

function sanitizeExportFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-");
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("File conversion failed."));
    };

    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;

      if (!base64) {
        reject(new Error("File conversion failed."));
        return;
      }

      resolve(base64);
    };

    reader.readAsDataURL(blob);
  });
}

function triggerBrowserDownload(file: DownloadedFile) {
  const objectUrl = window.URL.createObjectURL(file.blob);
  const link = window.document.createElement("a");

  link.href = objectUrl;
  link.download = file.fileName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

async function tryCapacitorShare(file: DownloadedFile, shareTitle?: string) {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  if (!Capacitor.isPluginAvailable("Filesystem") || !Capacitor.isPluginAvailable("Share")) {
    return false;
  }

  const exportPath = `exports/${Date.now()}-${sanitizeExportFileName(file.fileName)}`;
  const base64 = await blobToBase64(file.blob);
  const writeResult = await Filesystem.writeFile({
    path: exportPath,
    data: base64,
    directory: Directory.Cache,
    recursive: true
  });
  const fileUri =
    writeResult.uri ||
    (
      await Filesystem.getUri({
        path: exportPath,
        directory: Directory.Cache
      })
    ).uri;
  const shareSupport = await Share.canShare().catch(() => ({ value: false }));

  if (!shareSupport.value) {
    throw new Error("当前设备暂不支持文件分享，请稍后重试。");
  }

  await Share.share({
    title: shareTitle ?? file.fileName,
    dialogTitle: shareTitle ?? file.fileName,
    files: [fileUri]
  });

  return true;
}

async function tryNativeShare(file: DownloadedFile, shareTitle?: string) {
  if (typeof window === "undefined" || typeof navigator === "undefined" || typeof File === "undefined") {
    return false;
  }

  if (!("share" in navigator) || !("canShare" in navigator)) {
    return false;
  }

  const nativeFile = new File([file.blob], file.fileName, {
    type: file.blob.type || "application/pdf"
  });

  const sharePayload = {
    files: [nativeFile],
    title: shareTitle ?? file.fileName
  };

  try {
    if (!navigator.canShare?.(sharePayload)) {
      return false;
    }

    await navigator.share(sharePayload);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return true;
    }

    return false;
  }
}

export async function downloadFileFromResponse(
  response: Response,
  fallbackFileName: string,
  options?: {
    preferShare?: boolean;
    shareTitle?: string;
  }
) {
  const file = await extractDownloadedFile(response, fallbackFileName);
  const nativeShared = options?.preferShare ? await tryCapacitorShare(file, options.shareTitle) : false;

  if (nativeShared) {
    return {
      fileName: file.fileName,
      shared: true,
      mode: "native-share" as DownloadMode
    };
  }

  const shared = options?.preferShare ? await tryNativeShare(file, options.shareTitle) : false;

  if (shared) {
    return {
      fileName: file.fileName,
      shared: true,
      mode: "web-share" as DownloadMode
    };
  }

  triggerBrowserDownload(file);

  return {
    fileName: file.fileName,
    shared: false,
    mode: "browser-download" as DownloadMode
  };
}
