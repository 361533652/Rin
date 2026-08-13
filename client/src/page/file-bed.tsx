import { useContext, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { headersWithAuth } from "../utils/auth";
import { siteName } from "../utils/constants";
import { ProfileContext } from "../state/profile";
import { useLoginModal } from "../hooks/useLoginModal";

const PART_SIZE = 50 * 1024 * 1024; // 分片大小，与后端一致
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 单文件 5GB

type UploadItem = {
  id: number;
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function FileBedPage() {
  const { t } = useTranslation();
  const profile = useContext(ProfileContext);
  const { LoginModal, setIsOpened } = useLoginModal();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  function patch(id: number, patch: Partial<UploadItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  async function upload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setError(t("file_host.size$limit", { size: 5 }));
      return;
    }
    const id = idRef.current++;
    setItems(prev => [{
      id, name: file.name, size: file.size,
      status: "uploading", progress: 0,
    }, ...prev]);
    setError("");

    let uploadId = "";
    let key = "";
    try {
      // 1. initiate multipart upload
      const initForm = new FormData();
      initForm.append("key", file.name);
      const initRes = await fetch(`${process.env.API_URL}/storage/files/multipart`, {
        method: "POST",
        headers: headersWithAuth(),
        body: initForm,
      });
      const initText = await initRes.text();
      if (!initRes.ok) throw new Error(initText || t("upload.failed"));
      ({ uploadId, key } = JSON.parse(initText));

      // 2. upload parts sequentially
      const parts: { partNumber: number; etag: string; size: number }[] = [];
      const total = Math.max(1, Math.ceil(file.size / PART_SIZE));
      for (let n = 1; n <= total; n++) {
        const start = (n - 1) * PART_SIZE;
        const blob = file.slice(start, start + PART_SIZE);
        const partForm = new FormData();
        partForm.append("key", key);
        partForm.append("file", blob, `part-${n}`);
        const partRes = await fetch(
          `${process.env.API_URL}/storage/files/multipart/${uploadId}/${n}`,
          { method: "PUT", headers: headersWithAuth(), body: partForm }
        );
        const partText = await partRes.text();
        if (!partRes.ok) throw new Error(partText || t("upload.failed"));
        const { partNumber, etag } = JSON.parse(partText);
        parts.push({ partNumber, etag, size: blob.size });
        patch(id, { progress: Math.round((start + blob.size) / file.size * 100) });
      }

      // 3. complete
      const compRes = await fetch(
        `${process.env.API_URL}/storage/files/multipart/${uploadId}/complete`,
        {
          method: "POST",
          headers: { ...headersWithAuth(), "Content-Type": "application/json" },
          body: JSON.stringify({ key, parts }),
        }
      );
      const url = await compRes.text();
      if (!compRes.ok) throw new Error(url || t("upload.failed"));
      patch(id, { status: "done", progress: 100, url });
    } catch (e: any) {
      if (uploadId && key) {
        // 失败清理：终止 multipart 上传
        fetch(`${process.env.API_URL}/storage/files/multipart/${uploadId}`, {
          method: "DELETE",
          headers: { ...headersWithAuth(), "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        }).catch(() => {});
      }
      patch(id, { status: "error", error: e.message || t("upload.failed") });
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(upload);
  }

  async function copy(url: string, idx: number) {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 1500);
  }

  return (
    <>
      <Helmet>
        <title>{`${t("file_host")} - ${process.env.NAME}`}</title>
        <meta name="description" content={`${t("file_host")} - ${siteName}`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={t("file_host")} />
        <meta property="og:url" content={document.URL} />
      </Helmet>
      <main className="w-full flex flex-col items-center mb-8 ani-show">
        <div className="wauto py-4 w-full">
          <h1 className="text-3xl sm:text-4xl font-bold c-text-main">
            {t("file_host")}
          </h1>
          <p className="text-sm c-text-muted mt-1">{t("file_host_desc")}</p>
          <p className="text-xs c-text-muted mt-1">{t("file_host.size$limit", { size: 5 })}</p>
        </div>

        {!profile?.id ? (
          <div className="wauto w-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center">
            <i className="ri-login-circle-line text-4xl text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">{t("file_host.login")}</p>
            <button
              onClick={() => setIsOpened(true)}
              className="mt-3 px-4 py-2 rounded-lg bg-theme text-white text-sm hover:opacity-90 transition-opacity"
            >
              {t("github_login")}
            </button>
          </div>
        ) : (
        <div
          className="wauto w-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          <div className="flex flex-col items-center gap-2">
            <i className="ri-upload-cloud-2-line text-4xl text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400">{t("file_host.click")}</p>
            <p className="text-xs text-neutral-400">{t("file_host.drag")}</p>
          </div>
        </div>
        )}

        {error && (
          <div className="wauto w-full mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {items.length > 0 && (
          <div className="wauto w-full mt-6 space-y-3">
            {items.map((it, i) => (
              <div key={it.id} className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-row items-center gap-3">
                  <i className="ri-file-line text-xl text-neutral-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate" title={it.name}>
                      {it.name}
                    </p>
                    <p className="text-xs text-neutral-400">{formatSize(it.size)}</p>
                  </div>
                  {it.status === "uploading" && (
                    <span className="shrink-0 text-xs c-text-muted">
                      {it.progress}%
                    </span>
                  )}
                  {it.status === "error" && (
                    <span className="shrink-0 text-xs text-red-500">{it.error}</span>
                  )}
                </div>

                {it.status === "uploading" && (
                  <div className="mt-2 h-1.5 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-theme transition-all duration-300" style={{ width: `${it.progress}%` }} />
                  </div>
                )}

                {it.status === "done" && it.url && (
                  <div className="mt-2 flex flex-row items-start gap-2">
                    <input
                      readOnly
                      value={it.url}
                      className="flex-1 min-w-0 text-xs text-neutral-600 dark:text-neutral-400 bg-transparent outline-none cursor-text"
                      onFocus={(e) => e.target.select()}
                    />
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {t("download")}
                    </a>
                    <button
                      onClick={() => copy(it.url!, i)}
                      className="shrink-0 px-3 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {copiedIdx === i ? t("copied") : t("copy")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <LoginModal />
    </>
  );
}
