import { useContext, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { headersWithAuth } from "../utils/auth";
import { siteName } from "../utils/constants";
import { ProfileContext } from "../state/profile";
import { useLoginModal } from "../hooks/useLoginModal";

export function ImageBedPage() {
  const { t } = useTranslation();
  const profile = useContext(ProfileContext);
  const { LoginModal, setIsOpened } = useLoginModal();
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    const form = new FormData();
    form.append("key", file.name);
    form.append("file", file);
    setUploading(true);
    setError("");
    fetch(`${process.env.API_URL}/storage/img-bed`, {
      method: "POST",
      headers: headersWithAuth(),
      body: form,
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) { setError(text || t("upload.failed")); return; }
        setUrls(prev => [text, ...prev]);
      })
      .catch((e: any) => { setError(e.message || t("upload.failed")); })
      .finally(() => setUploading(false));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(upload);
  }

  async function copy(url: string, idx: number) {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 1500);
  }

  return (
    <>
      <Helmet>
        <title>{`${t("image_host")} - ${process.env.NAME}`}</title>
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={t("image_host")} />
        <meta property="og:url" content={document.URL} />
      </Helmet>
      <main className="w-full flex flex-col items-center mb-8 ani-show">
        <div className="wauto py-4 w-full">
          <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white">
            {t("image_host")}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{t("image_host_desc")}</p>
        </div>

        {!profile?.id ? (
          <div className="wauto w-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center">
            <i className="ri-login-circle-line text-4xl text-neutral-400" />
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">{t("image_host.login")}</p>
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
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { Array.from(e.target.files || []).forEach(upload); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <i className="ri-loader-4-line ri-spin text-4xl text-neutral-400" />
              <p className="text-neutral-500">{t("uploading")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <i className="ri-upload-cloud-2-line text-4xl text-neutral-400" />
              <p className="text-neutral-600 dark:text-neutral-400">{t("image_host.click")}</p>
              <p className="text-xs text-neutral-400">{t("image_host.drag")}</p>
            </div>
          )}
        </div>
        )}

        {error && (
          <div className="wauto w-full mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {urls.length > 0 && (
          <div className="wauto w-full mt-6 space-y-4">
            {urls.map((url, i) => (
              <div key={i} className="flex flex-row items-start gap-3 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <img src={url} alt="" className="w-16 h-16 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <input
                    readOnly
                    value={url}
                    className="w-full text-sm text-neutral-600 dark:text-neutral-400 bg-transparent outline-none cursor-text"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <button
                  onClick={() => copy(url, i)}
                  className="shrink-0 px-3 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  {copiedIdx === i ? t("copied") : t("copy")}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <LoginModal />
    </>
  );
}
