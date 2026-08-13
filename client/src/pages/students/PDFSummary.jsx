import React, { useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useDropzone } from 'react-dropzone'
import { Document, Page, pdfjs } from 'react-pdf'
import { FileUp, Sparkles, Download, Copy, BookOpen, Loader2, AlertTriangle } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { aiRequest } from '../../utils/aiClient'
import NoApiKeyState from '../../components/ai/NoApiKeyState'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDFSummary = () => {
  const { getToken } = useAuth()
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [error, setError] = useState(null)
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  const extractText = async (uploadedFile) => {
    const buffer = await uploadedFile.arrayBuffer()
    const typed = new Uint8Array(buffer)
    const pdf = await pdfjs.getDocument({ data: typed }).promise
    let text = ''
    for (let pageIndex = 1; pageIndex <= Math.min(pdf.numPages, 20); pageIndex += 1) {
      const page = await pdf.getPage(pageIndex)
      const content = await page.getTextContent()
      text += `${content.items.map((item) => item.str).join(' ')}\n`
    }
    return text.trim()
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setProcessing(true)
    setError(null)
    setSummaryData(null)

    try {
      const text = await extractText(uploadedFile)
      const { data } = await aiRequest({
        backendURL,
        getToken,
        path: '/api/ai/pdf-summary',
        data: { text, fileName: uploadedFile.name },
        retries: 1,
      })
      setSummaryData(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.statusCode === 403 })
    } finally {
      setProcessing(false)
    }
  }, [backendURL, getToken])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1700px] mx-auto w-full p-4 lg:p-8 gap-8">
        <div className="flex-1 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">AI PDF Summary</h1>
            <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold text-sm">
              Real-time summary
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-3xl p-6 shadow-sm overflow-y-auto">
            {!file ? (
              <div
                {...getRootProps()}
                className={`h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'}`}
              >
                <input {...getInputProps()} />
                <FileUp className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-lg font-semibold text-slate-700 dark:text-dk-text">Drag & drop your PDF</p>
                <p className="text-sm text-slate-500 mt-2">or click to browse files</p>
              </div>
            ) : processing ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
                <p className="text-slate-600 dark:text-dk-text-2 font-medium">AI is analyzing your document…</p>
              </div>
            ) : error ? (
              error.isNoKey ? (
                <NoApiKeyState />
              ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-slate-700 dark:text-dk-text font-semibold">Unable to generate summary</p>
                <p className="text-sm text-slate-500 max-w-md">{error.message}</p>
              </div>
              )
            ) : summaryData ? (
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-dk-surface-2/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h2 className="font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-3 flex items-center gap-2"><Sparkles size={18} className="text-blue-600" /> Summary</h2>
                  <p className="text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed">
                    {summaryData.summary || 'No summary was returned.'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl">
                    <h2 className="font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-3 flex items-center gap-2"><BookOpen size={18} className="text-emerald-600" /> Concepts</h2>
                    {summaryData.concepts?.length ? (
                      <ul className="text-sm text-slate-600 dark:text-dk-text-2 space-y-2">
                        {summaryData.concepts.map((concept, index) => (
                          <li key={index} className="flex items-center gap-2">• {concept}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No concepts were extracted.</p>
                    )}
                  </div>

                  <div className="p-6 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl">
                    <h2 className="font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-3">Important Formulas</h2>
                    {summaryData.formulas?.length ? (
                      <div className="space-y-2">
                        {summaryData.formulas.map((formula, index) => (
                          <div key={index} className="text-sm font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                            {formula}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No formulas were detected.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"><Download size={18} /> Download Notes</button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-dk-surface-2 border border-slate-200 dark:border-dk-border text-slate-700 dark:text-dk-text rounded-xl font-semibold hover:bg-slate-50 transition"><Copy size={18} /> Copy Summary</button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Upload a PDF to generate a real summary.</div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[450px] bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-3xl p-4 flex flex-col items-center overflow-hidden">
          {file ? (
            <div className="w-full h-full bg-slate-100 dark:bg-dk-surface-2 rounded-2xl overflow-y-auto flex justify-center p-4">
              <Document file={file}>
                <Page pageNumber={1} width={380} />
              </Document>
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">PDF Preview</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PDFSummary
