import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Document, Page, pdfjs } from 'react-pdf'
import { FileUp, Sparkles, Download, Copy, BookOpen } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PDFSummary = () => {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [credits] = useState(48)

  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      setProcessing(true)
      setTimeout(() => {
        setProcessing(false)
        setSummaryData({
          summary: "This document provides a comprehensive overview of the core concepts, definitions, and formulas required for mastery.",
          concepts: ["Machine Learning", "Neural Networks"],
          formulas: ["E = mc^2"],
        })
      }, 2000)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1700px] mx-auto w-full p-4 lg:p-8 gap-8">
        
        {/* Left Panel: Summary/Dropzone */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">AI PDF Summary</h1>
            <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold text-sm">
              {credits} Credits Remaining
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm overflow-y-auto">
            {!file ? (
              <div {...getRootProps()} className={`h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'}`}>
                <input {...getInputProps()} />
                <FileUp className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Drag & drop your PDF</p>
                <p className="text-sm text-slate-500 mt-2">or click to browse files</p>
              </div>
            ) : processing ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">AI is analyzing your document...</p>
              </div>
            ) : summaryData ? (
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h2 className="font-bold font-space-grotesk text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Sparkles size={18} className="text-blue-600"/> Summary</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{summaryData.summary}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl">
                    <h2 className="font-bold font-space-grotesk text-slate-900 dark:text-white mb-3 flex items-center gap-2"><BookOpen size={18} className="text-emerald-600"/> Concepts</h2>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                      {summaryData.concepts.map((c, i) => <li key={i} className="flex items-center gap-2">• {c}</li>)}
                    </ul>
                  </div>

                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl">
                    <h2 className="font-bold font-space-grotesk text-slate-900 dark:text-white mb-3">Important Formulas</h2>
                    <div className="text-sm font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">{summaryData.formulas[0]}</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"><Download size={18} /> Download Notes</button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition"><Copy size={18} /> Copy Summary</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Panel: PDF Preview */}
        <div className="w-full lg:w-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 flex flex-col items-center overflow-hidden">
          {file ? (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-y-auto flex justify-center p-4">
              <Document file={file}>
                <Page pageNumber={1} width={380} />
              </Document>
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
              PDF Preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PDFSummary
