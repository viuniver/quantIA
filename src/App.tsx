import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Ruler, 
  Layers, 
  Download, 
  Plus, 
  Trash2, 
  Search, 
  BarChart3,
  Loader2,
  ChevronRight,
  Maximize2,
  Settings,
  Info,
  CheckCircle2,
  AlertCircle,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import * as pdfjs from 'pdfjs-dist';
import { extractLegend, analyzeTile, QTOItem, LegendItem, identifyDrawingType, chatWithDrawing } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MessageSquare, Send } from 'lucide-react';
import LandingPage from './components/LandingPage';

// PDF worker setup
const PDFJS_VERSION = '5.4.624';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: number;
  name: string;
  created_at: string;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number, total: number } | null>(null);
  const [results, setResults] = useState<QTOItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'takeoff' | 'history'>('takeoff');
  const [rightTab, setRightTab] = useState<'results' | 'chat'>('chat');
  const [drawingType, setDrawingType] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Bem-vindo ao QuantIA! Carregue um desenho técnico para começarmos a conversar sobre o levantamento de quantitativos.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [mobileActivePanel, setMobileActivePanel] = useState<'viewer' | 'controls' | 'results' | 'chat'>('viewer');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(10, Math.max(0.01, s * delta)));
    }
  };

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const identify = async () => {
      if (previewUrl) {
        try {
          const type = await identifyDrawingType(previewUrl);
          setDrawingType(type);
          setChatMessages(prev => [
            ...prev, 
            { role: 'model', text: `Identifiquei que este desenho é uma **${type}**. Podemos começar o levantamento de quantitativos. Você tem alguma área de foco ou item específico que deseja priorizar?` }
          ]);
        } catch (err) {
          console.error('Failed to identify drawing type', err);
          setDrawingType('Não identificado');
        }
      } else {
        setDrawingType(null);
      }
    };
    identify();
  }, [previewUrl]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const renderPage = async (pageNumber: number, pdf: pdfjs.PDFDocumentProxy) => {
    setIsProcessingFile(true);
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.5 }); 
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Não foi possível criar o contexto do canvas');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ 
        canvasContext: context, 
        viewport,
        canvas: canvas as any // Fix for missing property in some type versions
      }).promise;
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewUrl(dataUrl);
      setError(null);
      setRightTab('chat');
      setChatMessages([{ role: 'model', text: `Olá! Carreguei a página ${pageNumber} do seu PDF. Estou analisando o conteúdo... O que você gostaria de quantificar neste desenho?` }]);
    } catch (err) {
      console.error('Erro ao renderizar página do PDF', err);
      setError('Falha ao renderizar o PDF. Tente novamente.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResults([]);
    setCurrentPage(1);
    setError(null);
    setIsProcessingFile(true);
    
    try {
      if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const typedarray = new Uint8Array(reader.result as ArrayBuffer);
            const loadingTask = pdfjs.getDocument({
              data: typedarray,
              // Ensure worker is set for this task as well
              workerSrc: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`
            } as any);
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);
            await renderPage(1, pdf);
          } catch (err: any) {
            console.error('Erro ao processar PDF:', err);
            setError(`Erro ao ler o arquivo PDF: ${err.message || 'Verifique se o arquivo não está corrompido.'}`);
            setIsProcessingFile(false);
          }
        };
        reader.onerror = () => {
          setError('Erro ao ler o arquivo.');
          setIsProcessingFile(false);
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setNumPages(0);
        setPdfDoc(null);
        setIsProcessingFile(false);
        setRightTab('chat');
        setChatMessages([{ role: 'model', text: `Olá! Identifiquei que você carregou um desenho. Estou analisando o tipo de desenho agora... Como posso te ajudar com este levantamento hoje?` }]);
      }
    } catch (err) {
      console.error('Erro no upload', err);
      setError('Ocorreu um erro inesperado ao carregar o arquivo.');
      setIsProcessingFile(false);
    }
  }, []);

  const handlePageChange = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > numPages) return;
    setCurrentPage(newPage);
    await renderPage(newPage, pdfDoc);
  };

  const createTiles = async (imageBase64: string, rows: number, cols: number): Promise<{ data: string, row: number, col: number }[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const tiles = [];
        const tileWidth = img.width / cols;
        const tileHeight = img.height / rows;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);

        canvas.width = tileWidth;
        canvas.height = tileHeight;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.clearRect(0, 0, tileWidth, tileHeight);
            ctx.drawImage(img, c * tileWidth, r * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
            tiles.push({
              data: canvas.toDataURL('image/jpeg', 0.9),
              row: r,
              col: c
            });
          }
        }
        resolve(tiles);
      };
      img.src = imageBase64;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  } as any);

  const handleAnalyze = async () => {
    if (!previewUrl) return;
    setIsAnalyzing(true);
    setResults([]);
    const TILE_ROWS = 3;
    const TILE_COLS = 3;
    setAnalysisProgress({ current: 0, total: 1 + (TILE_ROWS * TILE_COLS) }); 
    
    try {
      // 1. Extrair Legenda
      const legend = await extractLegend(previewUrl);
      setAnalysisProgress(p => ({ ...p!, current: 1 }));

      // Contexto do chat para a análise
      const chatContext = chatMessages
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join(' | ');
      const fullPrompt = `${prompt} ${chatContext}`.trim();

      // 2. Criar Tiles (3x3)
      const tiles = await createTiles(previewUrl, TILE_ROWS, TILE_COLS);
      const allResults: QTOItem[] = [];

      // 3. Analisar cada Tile
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const tileResults = await analyzeTile(tile.data, legend, fullPrompt);
        
        // Mapear coordenadas de volta para o global (0-1000)
        const mappedResults = tileResults.map(res => ({
          ...res,
          coordinates: res.coordinates?.map(coord => ({
            x: (coord.x / TILE_COLS) + (tile.col * (1000 / TILE_COLS)),
            y: (coord.y / TILE_ROWS) + (tile.row * (1000 / TILE_ROWS)),
            width: coord.width / TILE_COLS,
            height: coord.height / TILE_ROWS
          }))
        }));

        allResults.push(...mappedResults);
        setAnalysisProgress(p => ({ ...p!, current: i + 2 }));
      }

      // 4. Agrupar resultados por nome do item
      const groupedResults = allResults.reduce((acc, curr) => {
        const existing = acc.find(item => item.itemName.toLowerCase() === curr.itemName.toLowerCase());
        if (existing) {
          existing.quantity += curr.quantity;
          if (curr.coordinates) {
            existing.coordinates = [...(existing.coordinates || []), ...curr.coordinates];
          }
        } else {
          acc.push({ ...curr });
        }
        return acc;
      }, [] as QTOItem[]);

      setResults(groupedResults);
      
      // Auto-save to a new project if not already in one
      let projId = currentProjectId;
      if (!projId) {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file?.name || 'Projeto Sem Nome' })
        });
        const newProj = await res.json();
        projId = newProj.id;
        setCurrentProjectId(projId);
        fetchProjects();
      }

      // Save takeoffs
      if (projId) {
        for (const item of groupedResults) {
          await fetch(`/api/projects/${projId}/takeoffs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_name: item.itemName,
              category: item.category,
              quantity: item.quantity,
              unit: item.unit,
              details: { description: item.description, confidence: item.confidence }
            })
          });
        }
      }
    } catch (err: any) {
      console.error('Analysis failed', err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('credits');
      setError(`A análise falhou: ${err.message || 'Erro desconhecido'}. ${isQuotaError ? 'Parece que seus créditos acabaram ou você atingiu o limite. Verifique sua Chave API no ícone de chave no topo.' : 'Tente novamente com um arquivo menor ou mais nítido.'}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !previewUrl || isChatting) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const response = await chatWithDrawing(previewUrl, userMsg, chatMessages);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err: any) {
      console.error('Chat failed', err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('credits');
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        text: isQuotaError 
          ? 'Desculpe, parece que seus créditos de IA acabaram ou o limite foi atingido. Por favor, clique no ícone de chave (🔑) no topo para configurar uma chave API com faturamento ativo.' 
          : 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em instantes.' 
      }]);
    } finally {
      setIsChatting(false);
    }
  };
  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = ['Item Name', 'Category', 'Quantity', 'Unit', 'Confidence', 'Description'];
    const rows = results.map(r => [
      r.itemName,
      r.category,
      r.quantity,
      r.unit,
      r.confidence,
      `"${r.description.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `takeoff_${file?.name || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStart = useCallback(() => {
    setShowLanding(false);
  }, []);

  if (showLanding) {
    return <LandingPage onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#141414]/10 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#141414] rounded-lg flex items-center justify-center shrink-0">
            <Layers className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="hidden xs:block">
            <h1 className="font-bold text-base sm:text-lg tracking-tight leading-none">QuantIA</h1>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-widest opacity-50 font-semibold mt-1">Smart QTO</p>
          </div>
        </div>

        <nav className="flex items-center gap-0.5 sm:gap-1 bg-[#F5F5F0] p-0.5 sm:p-1 rounded-full border border-[#141414]/5">
          <button 
            onClick={() => setActiveTab('takeoff')}
            className={cn(
              "px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold sm:font-medium transition-all",
              activeTab === 'takeoff' ? "bg-white shadow-sm text-[#141414]" : "text-[#141414]/50 hover:text-[#141414]"
            )}
          >
            <span className="sm:hidden">Novo</span>
            <span className="hidden sm:inline">Novo Levantamento</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold sm:font-medium transition-all",
              activeTab === 'history' ? "bg-white shadow-sm text-[#141414]" : "text-[#141414]/50 hover:text-[#141414]"
            )}
          >
            <span className="sm:hidden">Histórico</span>
            <span className="hidden sm:inline">Histórico de Projetos</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {!hasApiKey && (
            <button 
              onClick={handleOpenKeySelector}
              className="flex items-center gap-2 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition-all"
            >
              <AlertCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Configurar Chave API</span>
              <span className="sm:hidden">API</span>
            </button>
          )}
          <button 
            onClick={handleOpenKeySelector}
            className="p-1.5 sm:p-2 hover:bg-[#F5F5F0] rounded-full transition-colors relative group"
            title="Configurar Chave API"
          >
            <Key className={cn("w-4 h-4 sm:w-5 sm:h-5", !hasApiKey ? "text-amber-500" : "opacity-60")} />
            {!hasApiKey && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full border-2 border-white" />}
          </button>
          <button className="p-1.5 sm:p-2 hover:bg-[#F5F5F0] rounded-full transition-colors hidden sm:block">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
          </button>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-700">BR</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'takeoff' ? (
          <>
            {/* Left Sidebar: Controls */}
            <aside className={cn(
              "absolute inset-0 z-40 bg-white md:relative md:inset-auto md:w-80 border-r border-[#141414]/10 flex flex-col overflow-y-auto transition-transform duration-300 md:translate-x-0",
              mobileActivePanel === 'controls' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
              <div className="p-6 space-y-6">
                <section>
                  <label className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-3 block">Upload do Desenho</label>
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3",
                      isDragActive ? "border-[#141414] bg-[#F5F5F0]" : "border-[#141414]/10 hover:border-[#141414]/30"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 rounded-full bg-[#F5F5F0] flex items-center justify-center">
                      <Upload className="w-6 h-6 opacity-40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file ? file.name : 'Solte o PDF ou Imagem'}</p>
                      <p className="text-[10px] opacity-50 mt-1">PDF, PNG, JPG até 50MB</p>
                    </div>
                  </div>

                  {numPages > 1 && (
                    <div className="mt-4 flex items-center justify-between bg-[#F5F5F0] p-2 rounded-xl border border-[#141414]/5">
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1 hover:bg-white rounded-lg disabled:opacity-20"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <span className="text-[10px] font-bold">Página {currentPage} de {numPages}</span>
                      <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === numPages}
                        className="p-1 hover:bg-white rounded-lg disabled:opacity-20"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {drawingType && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 opacity-50">Tipo de Desenho</p>
                        <p className="text-xs font-bold text-emerald-900">{drawingType}</p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider opacity-50 block">Parâmetros de Análise</label>
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium opacity-70">Áreas de Foco (Opcional)</p>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ex: Focar em símbolos elétricos e contar todos os interruptores..."
                      className="w-full h-24 bg-[#F5F5F0] border-none rounded-xl p-3 text-sm focus:ring-1 ring-[#141414]/20 resize-none placeholder:opacity-30"
                    />
                    <p className="text-[9px] opacity-40 italic">
                      A IA procurará automaticamente a legenda para identificar símbolos e hachuras.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#F5F5F0] rounded-xl border border-[#141414]/5">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 opacity-40" />
                      <span className="text-xs font-medium">Sistema Métrico</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </section>

                <button 
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                    !file || isAnalyzing 
                      ? "bg-[#141414]/5 text-[#141414]/30 cursor-not-allowed" 
                      : "bg-[#141414] text-white hover:bg-[#141414]/90 active:scale-[0.98]"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {analysisProgress 
                        ? `Analisando (${analysisProgress.current}/${analysisProgress.total})...` 
                        : "Analisando Desenho..."}
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Executar Levantamento
                    </>
                  )}
                </button>
              </div>

              <div className="mt-auto p-6 border-t border-[#141414]/10">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    <strong>Dica:</strong> Certifique-se de que a escala do desenho esteja visível para medições lineares e de área precisas.
                  </p>
                </div>
              </div>
            </aside>

            {/* Center: Viewer */}
            <div 
              ref={containerRef}
              onWheel={handleWheel}
              className={cn(
                "flex-1 bg-[#E4E3E0] relative overflow-hidden flex flex-col transition-opacity duration-300",
                mobileActivePanel === 'viewer' ? "opacity-100" : "opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
              )}
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#141414]/10 shadow-sm">
                  <button className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors" onClick={() => setScale(s => Math.max(0.01, s - 0.1))}>
                    <Trash2 className="w-4 h-4 rotate-45 opacity-60" />
                  </button>
                  <span className="text-[10px] font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                  <button className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors" onClick={() => setScale(s => Math.min(10, s + 0.1))}>
                    <Plus className="w-4 h-4 opacity-60" />
                  </button>
                  <div className="w-px h-4 bg-[#141414]/10 mx-1" />
                  <button 
                    title="Ajustar à tela"
                    className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors"
                    onClick={() => { setScale(0.3); setPosition({ x: 0, y: 0 }); }}
                  >
                    <Maximize2 className="w-4 h-4 opacity-60" />
                  </button>
                </div>

                <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-12">
                  {isProcessingFile ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="w-16 h-16 mx-auto animate-spin opacity-20" />
                      <p className="text-lg font-medium opacity-40">Processando arquivo...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center space-y-4 max-w-md">
                      <AlertCircle className="w-16 h-16 mx-auto text-red-500 opacity-50" />
                      <p className="text-lg font-medium text-red-600">{error}</p>
                      <button 
                        onClick={() => setFile(null)}
                        className="text-sm font-bold text-[#141414] underline underline-offset-4"
                      >
                        Tentar outro arquivo
                      </button>
                    </div>
                  ) : previewUrl ? (
                    <motion.div 
                      drag
                      dragMomentum={false}
                      animate={{ scale, x: position.x, y: position.y }}
                      onDrag={(e, info) => {
                        // We don't update state on every drag frame for performance, 
                        // but we need to keep track of where we are.
                        // For simplicity in this demo, we'll just use the reset button to zero out.
                      }}
                      onDragEnd={(e, info) => {
                        setPosition(prev => ({ 
                          x: prev.x + info.offset.x, 
                          y: prev.y + info.offset.y 
                        }));
                      }}
                      className="relative bg-white shadow-2xl rounded-sm cursor-grab active:cursor-grabbing"
                    >
                      <img 
                        src={previewUrl} 
                        alt="Drawing Preview" 
                        className="max-w-none pointer-events-none"
                        style={{ height: 'auto', display: 'block' }}
                      />
                      
                      {/* Highlights Overlay */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 1000 1000"
                        preserveAspectRatio="none"
                      >
                        {results.map((item, itemIdx) => (
                          item.coordinates?.map((coord, coordIdx) => (
                            <motion.rect
                              key={`${itemIdx}-${coordIdx}`}
                              initial={{ opacity: 0 }}
                              animate={{ 
                                opacity: hoveredItem === null || hoveredItem === itemIdx ? 0.4 : 0.1,
                                strokeWidth: hoveredItem === itemIdx ? 4 : 2
                              }}
                              x={coord.x}
                              y={coord.y}
                              width={coord.width}
                              height={coord.height}
                              fill={hoveredItem === itemIdx ? "#10b981" : "#3b82f6"}
                              stroke={hoveredItem === itemIdx ? "#059669" : "#2563eb"}
                              className="transition-colors duration-200"
                            />
                          ))
                        ))}
                      </svg>
                    </motion.div>
                  ) : (
                    <div className="text-center space-y-4 opacity-20">
                      <FileText className="w-24 h-24 mx-auto" strokeWidth={1} />
                      <p className="text-xl font-medium">Nenhum Desenho Carregado</p>
                    </div>
                  )}
                </div>

              {/* Bottom Toolbar */}
              <div className="h-12 bg-white border-t border-[#141414]/10 px-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sistema Pronto</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-40">
                    <Ruler className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Métrico (m)</span>
                  </div>
                </div>
                <div className="text-[10px] font-medium opacity-40">
                  {file ? `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Aguardando entrada...'}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Results & Chat */}
            <aside className={cn(
              "absolute inset-0 z-40 bg-white md:relative md:inset-auto md:w-96 border-l border-[#141414]/10 flex flex-col transition-transform duration-300 md:translate-x-0",
              (mobileActivePanel === 'results' || mobileActivePanel === 'chat') ? "translate-x-0" : "translate-x-full md:translate-x-0"
            )}>
              <div className="p-4 border-b border-[#141414]/10 flex items-center gap-2">
                <button 
                  onClick={() => setRightTab('results')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                    rightTab === 'results' ? "bg-[#141414] text-white" : "text-[#141414]/40 hover:bg-[#F5F5F0]"
                  )}
                >
                  Resultados
                </button>
                <button 
                  onClick={() => setRightTab('chat')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    rightTab === 'chat' ? "bg-[#141414] text-white" : "text-[#141414]/40 hover:bg-[#F5F5F0]"
                  )}
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat IA
                </button>
              </div>

              {rightTab === 'results' ? (
                <>
                  <div className="p-6 border-b border-[#141414]/10 flex items-center justify-between">
                    <h2 className="font-bold text-sm tracking-tight">Levantamento de Quantitativos</h2>
                    <button 
                      onClick={exportToCSV}
                      disabled={results.length === 0}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 disabled:opacity-30"
                    >
                      <Download className="w-3 h-3" />
                      Exportar CSV
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {results.length > 0 ? (
                      <div className="divide-y divide-[#141414]/5">
                        {results.map((item, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            onMouseEnter={() => setHoveredItem(idx)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={cn(
                              "p-4 transition-colors group cursor-pointer border-l-4",
                              hoveredItem === idx ? "bg-[#F5F5F0] border-emerald-500" : "hover:bg-[#F5F5F0] border-transparent"
                            )}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {item.category}
                              </span>
                              <span className="text-[10px] font-bold opacity-30">
                                {Math.round(item.confidence * 100)}% Confiança
                              </span>
                            </div>
                            <h3 className="text-sm font-bold mb-1">{item.itemName}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                              <span className="text-xl font-mono font-bold tracking-tighter">{item.quantity}</span>
                              <span className="text-xs font-medium opacity-50">{item.unit}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-60 italic">
                              {item.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-12 h-12 animate-spin" strokeWidth={1} />
                            <p className="text-sm font-medium">A IA está escaneando o desenho em busca de símbolos, legendas e dimensões...</p>
                          </>
                        ) : (
                          <>
                            <Search className="w-12 h-12" strokeWidth={1} />
                            <p className="text-sm font-medium">Execute a análise para ver as quantidades aqui</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-[#F5F5F0]/50 border-t border-[#141414]/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-40">Total de Itens</span>
                      <span className="text-sm font-bold">{results.length}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-[#141414]/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#141414] rounded-full" style={{ width: results.length > 0 ? '100%' : '0%' }} />
                      </div>
                      <p className="text-[10px] opacity-40 text-center">Os resultados do levantamento são gerados por IA e devem ser verificados por um profissional.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-[#141414]/10">
                    <h2 className="font-bold text-sm tracking-tight">Chat com Assistente IA</h2>
                    <p className="text-[10px] opacity-50">Tire dúvidas sobre o desenho técnico atual.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <MessageSquare className="w-12 h-12" strokeWidth={1} />
                        <p className="text-sm font-medium">Faça uma pergunta sobre o desenho.<br/>Ex: "Onde estão as tomadas?" ou "Identifique a hachura rosa."</p>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-[#141414] text-white ml-auto rounded-tr-none" 
                            : "bg-[#F5F5F0] text-[#141414] mr-auto rounded-tl-none"
                        )}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {chatMessages.length > 0 && !isChatting && (
                      <div className="flex justify-center pt-2">
                        <button 
                          onClick={() => {
                            setRightTab('results');
                            handleAnalyze();
                          }}
                          disabled={isAnalyzing}
                          className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-4 py-2 rounded-full shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                          <Search className="w-3 h-3" />
                          Iniciar Levantamento Agora
                        </button>
                      </div>
                    )}
                    {isChatting && (
                      <div className="bg-[#F5F5F0] text-[#141414] mr-auto p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin opacity-40" />
                        <span className="text-[10px] font-medium opacity-40">IA está pensando...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-[#141414]/10 bg-white">
                    <div className="relative">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Pergunte algo..."
                        disabled={!previewUrl || isChatting}
                        className="w-full bg-[#F5F5F0] border-none rounded-xl py-3 pl-4 pr-12 text-xs focus:ring-1 ring-[#141414]/20 disabled:opacity-50"
                      />
                      <button 
                        type="submit"
                        disabled={!chatInput.trim() || !previewUrl || isChatting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#141414] text-white rounded-lg disabled:opacity-20 transition-all"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </aside>
          </>
        ) : (
          <div className="flex-1 bg-white overflow-y-auto p-6 sm:p-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Histórico de Projetos</h2>
                  <p className="text-xs sm:text-sm opacity-50">Gerencie e revise seus levantamentos anteriores.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('takeoff')}
                  className="w-full sm:w-auto bg-[#141414] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div 
                    key={project.id}
                    className="p-6 rounded-2xl border border-[#141414]/10 hover:border-[#141414]/30 transition-all group cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F5F5F0] flex items-center justify-center group-hover:bg-[#141414] group-hover:text-white transition-colors">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold opacity-30">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                    <p className="text-xs opacity-50 mb-6">Projeto de Levantamento</p>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#F5F5F0] flex items-center justify-center text-[8px] font-bold">
                            {i}
                          </div>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#141414] opacity-40 group-hover:opacity-100 transition-opacity">
                        Ver Detalhes
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="col-span-full py-24 text-center border-2 border-dashed border-[#141414]/10 rounded-3xl">
                    <p className="text-sm opacity-40">Nenhum projeto encontrado. Inicie um novo levantamento para começar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Mobile Navigation */}
        <div className="md:hidden h-16 bg-white border-t border-[#141414]/10 flex items-center justify-around px-2 z-50">
          <button 
            onClick={() => setMobileActivePanel('controls')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              mobileActivePanel === 'controls' ? "text-[#141414]" : "text-[#141414]/30"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">Config</span>
          </button>
          <button 
            onClick={() => setMobileActivePanel('viewer')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              mobileActivePanel === 'viewer' ? "text-[#141414]" : "text-[#141414]/30"
            )}
          >
            <Maximize2 className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">Desenho</span>
          </button>
          <button 
            onClick={() => {
              setMobileActivePanel('results');
              setRightTab('results');
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              mobileActivePanel === 'results' ? "text-[#141414]" : "text-[#141414]/30"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">Resultados</span>
          </button>
          <button 
            onClick={() => {
              setMobileActivePanel('chat');
              setRightTab('chat');
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              mobileActivePanel === 'chat' ? "text-[#141414]" : "text-[#141414]/30"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">Chat</span>
          </button>
        </div>
      </main>
    </div>
  );
}
