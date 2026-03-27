import React from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  ArrowRight, 
  Play, 
  Layers, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  Target, 
  Clock, 
  FileSearch, 
  Database,
  MessageSquare
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default React.memo(function LandingPage({ onStart }: LandingPageProps) {
  const plans = [
    {
      name: "Profissional",
      searches: "5.000",
      price: "590",
      features: [
        "Até 5.000 pesquisas/mês",
        "Suporte a PDF e Imagens",
        "Identificação de Hachuras",
        "Exportação CSV/Excel",
        "Suporte via Chat"
      ],
      highlight: false,
      color: "sky"
    },
    {
      name: "Enterprise",
      searches: "20.000",
      price: "1.290",
      features: [
        "Até 20.000 pesquisas/mês",
        "Tudo do Profissional",
        "Análise de Alta Resolução",
        "Histórico Ilimitado",
        "Gerente de Conta Dedicado"
      ],
      highlight: true,
      color: "orange"
    },
    {
      name: "Industrial",
      searches: "100.000",
      price: "3.990",
      features: [
        "Até 100.000 pesquisas/mês",
        "Tudo do Enterprise",
        "API Dedicada",
        "Treinamento de Equipe",
        "SLA de 99.9%"
      ],
      highlight: false,
      color: "sky"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Economia de Tempo Extrema",
      desc: "Reduza o tempo gasto em levantamentos manuais em até 90%. O que levava dias agora leva minutos.",
      color: "orange"
    },
    {
      icon: Target,
      title: "Precisão nas Medidas",
      desc: "Elimine o erro humano. Nossa IA identifica e conta cada símbolo e área com consistência absoluta.",
      color: "sky"
    },
    {
      icon: BarChart3,
      title: "Redução de Custos",
      desc: "Evite desperdícios de materiais com quantitativos exatos. Orçamentos mais competitivos e lucrativos.",
      color: "orange"
    }
  ];

  const features = [
    {
      icon: FileSearch,
      title: "Visão Computacional Avançada",
      desc: "Identificação automática de símbolos, blocos e padrões em desenhos complexos de engenharia.",
      color: "sky"
    },
    {
      icon: Layers,
      title: "Análise de Hachuras",
      desc: "Cálculo preciso de áreas e perímetros baseado em padrões de preenchimento e cores.",
      color: "orange"
    },
    {
      icon: MessageSquare,
      title: "Chat Contextual com o Desenho",
      desc: "Tire dúvidas diretamente com a IA sobre detalhes específicos do projeto carregado.",
      color: "sky"
    },
    {
      icon: Database,
      title: "Exportação Inteligente",
      desc: "Gere planilhas de quantitativos (QTO) prontas para integração com seu software de orçamento.",
      color: "orange"
    }
  ];

  const audiences = [
    {
      title: "Engenheiros Civis",
      desc: "Agilize orçamentos de obras e licitações com dados confiáveis e rápidos.",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Arquitetos",
      desc: "Extraia quantitativos de acabamentos e revestimentos sem esforço manual.",
      image: "https://images.unsplash.com/photo-1503387837-b154ad5074bc?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Construtoras",
      desc: "Padronize o processo de levantamento em toda a sua equipe técnica.",
      image: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Orçamentistas",
      desc: "A ferramenta definitiva para aumentar sua produtividade e precisão diária.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#141414] overflow-x-hidden">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/60 via-sky-950/40 to-orange-900/30 z-10" />
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover scale-105"
          >
            <source src="/input_file_0.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="container mx-auto px-6 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="flex justify-center mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 bg-white/90 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-sky-100 relative"
              >
                <Layers className="text-sky-600 w-12 h-12" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="text-white w-4 h-4" />
                </div>
              </motion.div>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]">
              Quant<span className="text-orange-400">IA</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-3xl text-white mb-8 md:mb-12 max-w-4xl mx-auto font-medium leading-tight drop-shadow-lg">
              A Inteligência Artificial que <span className="text-orange-300">automatiza</span> seu levantamento de quantitativos em segundos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-orange-500 text-white rounded-2xl font-black text-lg md:text-xl hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/40 flex items-center justify-center gap-3 group hover:-translate-y-1"
              >
                Começar Agora Grátis
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-white/10 backdrop-blur-xl text-white border-2 border-white/40 rounded-2xl font-black text-lg md:text-xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 hover:-translate-y-1">
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                Ver Demonstração
              </button>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <span className="text-white text-[10px] uppercase tracking-[0.3em] font-bold">Explore as funcionalidades</span>
          <div className="w-1 h-12 bg-gradient-to-b from-white to-transparent rounded-full animate-pulse" />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              className="text-orange-500 font-black uppercase tracking-[0.3em] text-xs sm:text-sm mb-4 block"
            >
              Benefícios Reais
            </motion.span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-sky-950 tracking-tight">
              Mais <span className="text-sky-600">Lucratividade</span> para seu Negócio
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {benefits.map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-6 sm:mb-8 transition-all group-hover:scale-110 group-hover:rotate-6 shadow-lg",
                  benefit.color === "orange" ? "bg-orange-500 text-white shadow-orange-200" : "bg-sky-600 text-white shadow-sky-200"
                )}>
                  <benefit.icon className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 text-sky-950">{benefit.title}</h3>
                <p className="text-sky-800/60 text-base sm:text-lg font-medium leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-sky-50 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 md:mb-24 gap-8 text-center md:text-left">
            <div className="max-w-2xl">
              <span className="text-sky-600 font-black uppercase tracking-[0.3em] text-xs sm:text-sm mb-4 block">Funcionalidades</span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-sky-950 tracking-tight">
                Tecnologia de <span className="text-orange-500">Ponta</span> em Cada Detalhe
              </h2>
            </div>
            <p className="text-lg sm:text-xl text-sky-800/60 font-medium max-w-md">
              Desenvolvemos ferramentas específicas para os desafios reais do canteiro de obras e do escritório técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                className="bg-white p-6 sm:p-12 rounded-3xl sm:rounded-[3rem] border border-sky-100 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start hover:shadow-2xl hover:shadow-sky-900/5 transition-all group text-center sm:text-left"
              >
                <div className={cn(
                  "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                  feature.color === "orange" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"
                )}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black mb-2 sm:mb-3 text-sky-950">{feature.title}</h3>
                  <p className="text-sky-800/60 text-base sm:text-lg font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-sky-950 tracking-tight mb-6">
              Para <span className="text-sky-600">Quem</span> é o QuantIA?
            </h2>
            <p className="text-lg sm:text-xl text-sky-800/60 font-medium max-w-3xl mx-auto">
              Nossa plataforma foi desenhada para atender a toda a cadeia da construção civil.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {audiences.map((audience, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] aspect-[4/5]"
              >
                <img 
                  src={audience.image} 
                  alt={audience.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-sky-950/20 to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <h3 className="text-xl sm:text-2xl font-black mb-2">{audience.title}</h3>
                  <p className="text-sky-100/80 font-medium text-xs sm:text-sm leading-relaxed opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    {audience.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-sky-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
              Veja em <span className="text-orange-500">Ação</span>
            </h2>
            <p className="text-lg sm:text-xl text-sky-200/60 font-medium">
              Assista como nossa IA processa um projeto complexo em tempo recorde.
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            className="max-w-5xl mx-auto rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10"
          >
            <div className="aspect-video bg-sky-900 flex items-center justify-center relative">
              <video 
                controls
                className="absolute inset-0 w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80"
              >
                <source src="/input_file_0.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-white to-orange-50/50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 tracking-tight text-sky-950">Planos <span className="text-orange-500">Sob Medida</span></h2>
            <p className="text-lg sm:text-xl text-sky-800/70 max-w-3xl mx-auto font-medium">Escolha a escala ideal para o seu volume de projetos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative p-6 sm:p-12 rounded-3xl sm:rounded-[4rem] border-2 transition-all bg-white flex flex-col",
                  plan.highlight 
                    ? "border-orange-400 shadow-[0_40px_80px_-15px_rgba(249,115,22,0.2)] md:scale-105 z-10" 
                    : "border-sky-100 hover:border-sky-300 shadow-xl shadow-sky-900/5"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] px-6 sm:px-8 py-2 rounded-full shadow-xl whitespace-nowrap">
                    Mais Popular
                  </div>
                )}
                <div className="mb-8 sm:mb-10">
                  <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 text-sky-950">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-sky-950">R$ {plan.price}</span>
                    <span className="text-base sm:text-lg font-bold text-sky-600/50">/mês</span>
                  </div>
                </div>

                <ul className="space-y-4 sm:space-y-5 mb-8 sm:mb-12 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 sm:gap-4 text-base sm:text-lg text-sky-900 font-medium leading-tight">
                      <div className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        plan.color === "orange" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"
                      )}>
                        <Check className="w-3.5 h-3.5 sm:w-4 h-4 stroke-[3px]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={onStart}
                  className={cn(
                    "w-full py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl transition-all shadow-xl hover:-translate-y-1",
                    plan.highlight 
                      ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30" 
                      : "bg-sky-950 text-white hover:bg-sky-900 shadow-sky-950/20"
                  )}
                >
                  Selecionar Plano
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        className="py-12 border-t border-sky-100 bg-sky-50"
      >
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-sky-900">QuantIA</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-sky-700/60">
            <a href="#" className="hover:text-sky-900 transition-colors">Termos</a>
            <a href="#" className="hover:text-sky-900 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-sky-900 transition-colors">Contato</a>
          </div>
          <p className="text-xs text-sky-600/40">© 2026 QuantIA. Todos os direitos reservados.</p>
        </div>
      </motion.footer>
    </div>
  );
});

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
