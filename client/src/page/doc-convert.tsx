import { useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { siteName } from "../utils/constants";
import { allExtensions, converters, pickConverter, type ConvertResult } from "../utils/doc-convert";

export function DocConvertPage() {
  const { t } = useTranslation();
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setResult(null);
    setCopied(false);
    setFileName(file.name);

    const converter = pickConverter(file.name);
    if (!converter) {
      const exts = allExtensions.map(e => "." + e).join("、");
      // 旧版 .doc 是二进制复合文档，和 docx 完全不是一回事，单独给个能照做的提示
      const isLegacyDoc = /\.doc$/i.test(file.name);
      setError(
        isLegacyDoc
          ? t("doc_convert.legacy_doc")
          : t("doc_convert.unsupported", { formats: exts }),
      );
      return;
    }

    setWorking(true);
    try {
      const res = await converter.convert(file);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("doc_convert.failed"));
    } finally {
      setWorking(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!result) return;
    const stem = fileName.replace(/\.[^.]+$/, "") || "converted";
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stem}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setResult(null);
    setError("");
    setFileName("");
    setCopied(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <Helmet>
        <title>{`${t("doc_convert")} - ${process.env.NAME}`}</title>
        <meta name="description" content={`${t("doc_convert")} - ${siteName}`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={t("doc_convert")} />
        <meta property="og:url" content={document.URL} />
      </Helmet>
      <main className="w-full flex flex-col items-center mb-8 ani-show">
        <div className="wauto py-4 w-full">
          <h1 className="text-3xl sm:text-4xl font-bold c-text-main">
            {t("doc_convert")}
          </h1>
          <p className="text-sm c-text-muted mt-1">{t("doc_convert_desc")}</p>
        </div>

        <div
          className="wauto w-full border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center hover:border-[var(--primary)] transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={converters.map(c => c.accept).join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {working ? (
            <div className="flex flex-col items-center gap-2">
              <i className="ri-loader-4-line ri-spin text-4xl c-text-faint" />
              <p className="c-text-muted">{t("doc_convert.working")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <i className="ri-file-text-line text-4xl c-text-faint" />
              <p className="c-text-body">{t("doc_convert.click")}</p>
              <p className="text-xs c-text-faint">
                {t("doc_convert.accept", { formats: converters.map(c => c.label).join("、") })}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="wauto w-full mt-4 p-3 rounded-lg text-sm c-text-main border border-[var(--border)] c-bg-code">
            <i className="ri-error-warning-line mr-1" />
            {error}
          </div>
        )}

        {result && (
          <div className="wauto w-full mt-6">
            <div className="flex flex-row items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm c-text-body truncate">{fileName}</p>
                {result.summary && <p className="text-xs c-text-faint mt-0.5">{result.summary}</p>}
              </div>
              <div className="flex flex-row items-center gap-2 shrink-0">
                <button
                  onClick={copy}
                  className="px-3 py-1.5 text-xs rounded-md c-bg-code c-text-body hover:text-[var(--primary-ink)] transition-colors"
                >
                  {copied ? t("copied") : t("copy")}
                </button>
                <button
                  onClick={download}
                  className="px-3 py-1.5 text-xs rounded-md c-bg-code c-text-body hover:text-[var(--primary-ink)] transition-colors"
                >
                  {t("doc_convert.download")}
                </button>
                <button
                  onClick={reset}
                  className="px-3 py-1.5 text-xs rounded-md c-bg-code c-text-muted hover:c-text-main transition-colors"
                >
                  {t("doc_convert.reset")}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={result.text}
              className="w-full h-96 rounded-lg border border-[var(--border)] c-bg-card px-4 py-3 text-sm c-text-body leading-relaxed focus:outline-none resize-y"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
      </main>
    </>
  );
}
