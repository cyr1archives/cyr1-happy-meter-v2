"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import confetti from "canvas-confetti";
import { Howl } from 'howler';
import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { DEPARTMENTS } from "@/app/lib/constants";
import { SpeedInsights } from "@vercel/speed-insights/next";

gsap.registerPlugin(useGSAP);

const QUESTIONS = [
  { id: "q1", text: "How are you today?", category: "Mood & Well-Being" },
  { id: "q2", text: "How appreciated do you feel?", category: "Collaboration" },
  { id: "q3", text: "How manageable is your workload today?", category: "Productivity" },
  { id: "q4", text: "How comfortable is your workspace today?", category: "Work Environment" },
  { id: "q5", text: "How motivated do you feel today?", category: "Motivation & Purpose" },
];

const EMOJI_ASSETS: Record<number, string> = {
  1: "/emojis/mood-1.png",
  2: "/emojis/mood-2.png",
  3: "/emojis/mood-3.png",
  4: "/emojis/mood-4.png",
  5: "/emojis/mood-5.png",
};

type StageType = "welcome" | "questions" | "details" | "feedback" | "submitting" | "thankyou";

export default function HappyMeterApp() {
  const [stage, setStage] = useState<StageType>("welcome");
  const [userDetails, setUserDetails] = useState({ employeeId: "", name: "", department: "" });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState("");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [cumulativeScore, setCumulativeScore] = useState<number | null>(null);

  const soundsRef = useRef<Record<string, Howl> | null>(null);
  const heroEmojiRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    soundsRef.current = {
        click: new Howl({ src: ['/sounds/click.mp3'], volume: 0.5, preload: true }),
        hover: new Howl({ src: ['/sounds/hover.mp3'], volume: 0.2, preload: true }),
        submit: new Howl({ src: ['/sounds/submit.mp3'], volume: 0.7, preload: true }),
        confetti: new Howl({ src: ['/sounds/confetti.mp3'], volume: 0.6, preload: true }),
    };
  }, []);

  const playSound = (type: 'click' | 'hover' | 'submit' | 'confetti') => {
    if (soundsRef.current && soundsRef.current[type]) {
        soundsRef.current[type].play();
    }
  };

  const handleStart = () => {
    playSound('click');
    setStage("questions");
    setCumulativeScore(3);
  };

  const handleAnswer = (score: number) => {
    playSound('click');
    const newAnswers = { ...answers, [QUESTIONS[currentQIndex].id]: score };
    setAnswers(newAnswers);

    const values = Object.values(newAnswers);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    setCumulativeScore(avg);

    if (heroEmojiRef.current) {
        gsap.timeline()
          .to(heroEmojiRef.current, { scale: 1.15, rotation: gsap.utils.random(-10, 10), duration: 0.1, ease: "power1.out" })
          .to(heroEmojiRef.current, { scale: 1, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    }

    setTimeout(() => {
      if (currentQIndex < QUESTIONS.length - 1) {
        setCurrentQIndex(currentQIndex + 1);
      } else {
        setStage("details");
      }
    }, 400);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    if (userDetails.name && userDetails.department) {
        setStage("feedback");
    }
  };

  const handleFinalSubmit = async () => {
    playSound('click');
    setStage("submitting");

    const finalName = userDetails.employeeId
        ? `${userDetails.name} (ID: ${userDetails.employeeId})`
        : userDetails.name;

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: finalName,
                department: userDetails.department,
                scores: answers,
                feedback: feedbackText
            })
        });

        if (!response.ok) throw new Error('Submission failed');

        playSound('submit');
        if (cumulativeScore && cumulativeScore > 4.0) {
            playSound('confetti');
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#fcd34d', '#f59e0b', '#10b981', '#3b82f6'] });
        }
        setStage("thankyou");

    } catch (error) {
        console.error(error);
        setStage("feedback");
    }
  };

  const getCurrentHeroImage = () => {
     if (cumulativeScore === null) return EMOJI_ASSETS[3];
     return EMOJI_ASSETS[Math.round(cumulativeScore)] || EMOJI_ASSETS[3];
  };

  return (
    <main ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-1000 ease-in-out font-sans">
      <SpeedInsights />
      <DynamicBackground stage={stage} score={cumulativeScore} />

      <div className="vignette-overlay pointer-events-none" />

      {/* Draggable Emojis Option - Optimized for Touch */}
      {stage === 'welcome' && <DraggableEmojis containerRef={containerRef} />}

      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-30 pointer-events-none">
         <div className="w-10"></div>
         <div className="pointer-events-auto">
             <motion.img
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                src="/logo.svg"
                alt="CYR1 Studio"
                className="h-8 md:h-12 w-auto drop-shadow-md"
             />
         </div>
         <Link href="/admin" className="pointer-events-auto group">
            <div className="bg-white/30 backdrop-blur-md border border-white/40 p-2 rounded-full hover:bg-white/60 transition-all shadow-sm">
                <UserCircle2 className="w-5 h-5 md:w-6 md:h-6 text-gray-700 opacity-60 group-hover:opacity-100" />
            </div>
         </Link>
      </div>

      <AnimatePresence mode="wait">
        {stage === "welcome" && (
          <motion.div key="welcome" {...fadeInUp} className="glass-panel p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] text-center max-w-sm md:max-w-md w-full z-20 relative shadow-2xl border-white/50">
            <motion.div
                className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-6 relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <video autoPlay loop muted playsInline className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(251,191,36,0.3)]">
                <source src="/emojis/hero-welcome.webm" type="video/webm" />
              </video>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-3 tracking-tight">Happy Meter 2.0</h1>
            <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed font-medium px-2">Let’s check in and take a moment to share how you feel this week. Your honest feedback helps shape our workspace</p>
            <button onClick={handleStart} onMouseEnter={() => playSound('hover')} className="glass-button-active bg-yellow-400/80 hover:bg-yellow-400 text-gray-900 px-8 py-4 rounded-full text-lg md:text-xl font-bold w-full transition-all active:scale-95 shadow-yellow-300/50 shadow-lg">
              Start Check-in
            </button>
          </motion.div>
        )}

        {stage === "questions" && (
          <motion.div key="questions" {...fadeInRight} className="glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] max-w-xl w-full z-20 flex flex-col items-center relative shadow-2xl border-white/50">

             <div className="relative h-32 w-32 md:h-48 md:w-48 mb-4">
                  <img ref={heroEmojiRef} src={getCurrentHeroImage()} alt="Current Mood" className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)] will-change-transform" />
             </div>
             <div className="w-full bg-gray-200/50 h-2 md:h-3 rounded-full mb-6 md:mb-8 overflow-hidden backdrop-blur-sm">
                 <motion.div className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400" initial={{ width: 0 }} animate={{ width: `${((currentQIndex) / QUESTIONS.length) * 100}%` }} transition={{ ease: "easeOut" }} />
             </div>

            <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.15em] text-gray-500 mb-1 md:mb-2">{QUESTIONS[currentQIndex].category}</h2>
            <h3 className="text-2xl md:text-3xl font-black text-gray-800 text-center mb-6 md:mb-10 leading-tight px-2">{QUESTIONS[currentQIndex].text}</h3>

            <div className="flex justify-center flex-wrap w-full gap-3 md:gap-6 px-1 pb-2">
                {[1, 2, 3, 4, 5].map((num) => (
                    <ScoreButton key={num} score={num} onClick={() => handleAnswer(num)} onHover={() => playSound('hover')} />
                ))}
            </div>
          </motion.div>
        )}

        {stage === "details" && (
            <motion.div key="details" {...fadeInUp} className="glass-panel p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] max-w-sm md:max-w-md w-full z-20 relative shadow-2xl border-white/50">
             <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-6">Almost Done.</h2>
             <form onSubmit={handleDetailsSubmit} className="space-y-4 md:space-y-5">
                <div>
                    <label htmlFor="id-input" className="block text-xs md:text-sm font-bold text-gray-500 mb-1 md:mb-2 ml-3">Employee ID (Optional)</label>
                    <input id="id-input" type="text" value={userDetails.employeeId} onChange={(e) => setUserDetails({...userDetails, employeeId: e.target.value})} className="glass-input w-full rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base font-medium" placeholder="e.g., 0042" />
                </div>
                <div>
                    <label htmlFor="name-input" className="block text-xs md:text-sm font-bold text-gray-600 mb-1 md:mb-2 ml-3">Your Name</label>
                    <input id="name-input" type="text" required value={userDetails.name} onChange={(e) => setUserDetails({...userDetails, name: e.target.value})} className="glass-input w-full rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base font-medium" placeholder="e.g., Alex Smith" />
                </div>
                <div>
                    <label htmlFor="dept-select" className="block text-xs md:text-sm font-bold text-gray-600 mb-1 md:mb-2 ml-3">Department</label>
                    <select id="dept-select" required value={userDetails.department} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserDetails({...userDetails, department: e.target.value})} className="glass-input w-full rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base appearance-none custom-select-icon font-medium">
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>
                <button type="submit" onMouseEnter={() => playSound('hover')} disabled={!userDetails.name || !userDetails.department} className="glass-button-active bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 px-8 py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-bold w-full transition-all mt-4 shadow-lg">Continue</button>
             </form>
            </motion.div>
        )}

        {stage === "feedback" && (
            <motion.div key="feedback" {...fadeInUp} className="glass-panel p-6 md:p-8 rounded-[2rem] max-w-lg w-full z-20 shadow-2xl border-white/50">
                 <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-1 md:mb-2">Any final thoughts?</h3>
                 <p className="text-sm md:text-gray-600 mb-6 font-medium">Would you like to share anything more? (Optional)</p>
                 <textarea className="glass-input w-full rounded-xl md:rounded-2xl p-4 min-h-[120px] md:min-h-[140px] text-sm md:text-base font-medium resize-none" placeholder="Type here..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                 <div className="flex flex-col md:flex-row gap-3 mt-6">
                    <button onClick={handleFinalSubmit} onMouseEnter={() => playSound('hover')} className="order-1 md:order-2 flex-1 bg-gray-900 text-white py-4 rounded-xl md:rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95">Submit</button>
                    <button onClick={handleFinalSubmit} onMouseEnter={() => playSound('hover')} className="order-2 md:order-1 px-6 py-4 text-gray-500 font-bold hover:text-gray-700 hover:bg-white/30 rounded-xl md:rounded-2xl transition-all">Skip</button>
                 </div>
             </motion.div>
        )}

        {stage === "submitting" && (
             <motion.div key="submitting" initial={{opacity:0}} animate={{opacity:1}} className="z-20 text-center p-6 md:p-8 glass-panel rounded-2xl md:rounded-3xl">
                <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-gray-900 border-t-transparent mb-4"></div>
                <p className="text-base md:text-lg font-bold text-gray-800">Saving your response...</p>
             </motion.div>
        )}

        {stage === "thankyou" && (
            <motion.div key="thankyou" {...fadeInUp} className="glass-panel p-10 md:p-12 rounded-[2rem] md:rounded-[2.5rem] text-center max-w-sm md:max-w-md w-full z-20 shadow-2xl border-white/50">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring', delay:0.2, duration: 1}} className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-6 relative">
                    <video autoPlay loop muted playsInline className="w-full h-full object-contain">
                        <source src="/emojis/hero-onsubmit.webm" type="video/webm" />
                    </video>
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2 md:mb-3">Thank you for sharing how you feel today.</h2>
                <p className="text-base md:text-lg text-gray-600 font-medium">Your response has been recorded. Have a great weekend!</p>
            </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </main>
  );
}

// --- Internal Components ---

function DraggableEmojis({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const floatVariants = useMemo(
    () =>
      Array.from({ length: 5 }).map(() => ({
        driftX: (Math.random() * 24 + 8) * (Math.random() > 0.5 ? 1 : -1),
        driftY: (Math.random() * 22 + 10) * (Math.random() > 0.5 ? 1 : -1),
        rotate: (Math.random() * 6 + 4) * (Math.random() > 0.5 ? 1 : -1),
        scale: Math.random() * 0.06 + 0.98,
        duration: Math.random() * 4 + 6,
        delay: Math.random() * 0.6,
      })),
    []
  );
  const emojis = [
    { src: "/emojis/floating-emojis/emoji-2.png", x: "15%", y: "15%" },
    { src: "/emojis/floating-emojis/emoji-3.png", x: "75%", y: "25%" },
    { src: "/emojis/floating-emojis/emoji-4.png", x: "25%", y: "75%" },
    { src: "/emojis/floating-emojis/emoji-5.png", x: "65%", y: "65%" },
    { src: "/emojis/floating-emojis/emoji-10.png", x: "50%", y: "45%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {emojis.map((item, i) => (
        <motion.img
          key={i}
          src={item.src}
          drag
          dragConstraints={containerRef}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 200, bounceDamping: 18 }}
          whileHover={{ scale: 1.15, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: 0.55,
            x: [0, floatVariants[i].driftX, 0],
            y: [0, floatVariants[i].driftY, 0],
            rotate: [0, floatVariants[i].rotate, 0],
            scale: [1, floatVariants[i].scale, 1],
          }}
          transition={{
            duration: floatVariants[i].duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatVariants[i].delay,
          }}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            cursor: 'grab',
            willChange: 'transform' // GPU Acceleration for mobile
          }}
          className="w-20 h-20 md:w-32 md:h-32 object-contain drop-shadow-lg"
        />
      ))}
    </div>
  );
}

function DynamicBackground({ stage, score }: { stage: StageType, score: number | null }) {
  let moodLevel = "default";
  if (stage !== 'welcome' && score !== null) {
    if (score <= 1.5) moodLevel = "poor";
    else if (score <= 2.5) moodLevel = "fair";
    else if (score <= 3.5) moodLevel = "good";
    else if (score <= 4.5) moodLevel = "very-good";
    else moodLevel = "excellent";
  }

  return (
    <div
      className="absolute inset-0 -z-20 bg-warm-deep-animated transition-all duration-[1500ms] ease-in-out"
      data-mood={moodLevel}
    />
  );
}

function ScoreButton({ score, onClick, onHover }: { score: number, onClick: () => void, onHover: () => void }) {
    const labels: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Exc" };

    let colorClass = "";
    if(score === 1) colorClass = "bg-red-500 text-white border-2 border-red-600 hover:bg-red-600 shadow-red-500/20";
    if(score === 2) colorClass = "bg-orange-500 text-white border-2 border-orange-600 hover:bg-orange-600 shadow-orange-500/20";
    if(score === 3) colorClass = "bg-yellow-500 text-white border-2 border-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20";
    if(score === 4) colorClass = "bg-green-500 text-white border-2 border-green-600 hover:bg-green-600 shadow-green-500/20";
    if(score === 5) colorClass = "bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 shadow-blue-500/20";

    return (
        <div className="flex flex-col items-center gap-1 md:gap-2">
            <button
                onClick={onClick}
                onMouseEnter={onHover}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl transition-all duration-200 active:scale-90 active:translate-y-1 shadow-xl hover:scale-110 ${colorClass}`}
            >
                {score}
            </button>
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500 opacity-80">{labels[score]}</span>
        </div>
    );
}

function Footer() {
  return (
    <footer className="fixed bottom-3 md:bottom-4 w-full text-center z-10 mix-blend-multiply font-bold px-4">
      <a
        href="https://linktr.ee/cyr1archives"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] text-gray-500/60 hover:text-gray-800 transition-colors duration-300"
      >
        Copyright © 2026 CYR1 Studio by Cyrone Dumadag.
      </a>
    </footer>
  );
}

const fadeInUp = { initial: { opacity: 0, y: 40, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.3, ease: "anticipate" } }, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } };
const fadeInRight = { initial: { opacity: 0, x: 40, scale: 0.98 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -40, scale: 0.98, transition: { duration: 0.3, ease: "anticipate" } }, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } };
