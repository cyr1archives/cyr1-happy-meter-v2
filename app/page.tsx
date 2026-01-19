"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import confetti from "canvas-confetti";
import { Howl } from 'howler';
import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { DEPARTMENTS } from "@/app/lib/constants"; // Import here
import { SpeedInsights } from "@vercel/speed-insights/next"
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

  // --- Sound System Fix ---
  // We use a ref to hold the Howl instances so they persist without reloading
  const soundsRef = useRef<Record<string, Howl> | null>(null);

  useEffect(() => {
    // Initialize sounds only on the client side
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

  const heroEmojiRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        alert("Submission failed. Check console.");
        setStage("feedback");
    }
  };

  const getCurrentHeroImage = () => {
     if (cumulativeScore === null) return EMOJI_ASSETS[3];
     return EMOJI_ASSETS[Math.round(cumulativeScore)] || EMOJI_ASSETS[3];
  };

  return (
    <main ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-1000 ease-in-out font-sans">

      <DynamicBackground stage={stage} score={cumulativeScore} />
      <div className="vignette-overlay" />
      {stage !== 'thankyou' && <FloatingInteractiveEmojis containerRef={containerRef} />}

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-30 pointer-events-none">
         <div className="w-10"></div>
         <div className="pointer-events-auto">
             <motion.img
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                src="/logo.svg"
                alt="CYR1 Studio"
                className="h-12 w-auto drop-shadow-md"
             />
         </div>
         <Link href="/admin" className="pointer-events-auto group">
            <div className="bg-white/30 backdrop-blur-md border border-white/40 p-2 rounded-full hover:bg-white/60 transition-all shadow-sm">
                <UserCircle2 className="w-6 h-6 text-gray-700 opacity-60 group-hover:opacity-100" />
            </div>
         </Link>
      </div>

      <AnimatePresence mode="wait">

        {/* --- STAGE: WELCOME --- */}
        {stage === "welcome" && (
          <motion.div key="welcome" {...fadeInUp} className="glass-panel p-12 rounded-[2.5rem] text-center max-w-md w-full z-20 relative shadow-2xl border-white/50">
            <motion.div
                className="w-48 h-48 mx-auto mb-6 relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <video autoPlay loop muted playsInline className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(251,191,36,0.3)]">
                <source src="/emojis/hero-welcome.webm" type="video/webm" />
              </video>
            </motion.div>

            <h1 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">Happy Meter 2.0</h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed font-medium">Let’s check in. Your honest feedback helps shape our workspace.</p>
            <button onClick={handleStart} onMouseEnter={() => playSound('hover')} className="glass-button-active bg-yellow-400/80 hover:bg-yellow-400 text-gray-900 px-10 py-4 rounded-full text-xl font-bold w-full transition-all active:scale-95 shadow-yellow-300/50 shadow-lg">
              Start Check-in
            </button>
          </motion.div>
        )}

{/* --- STAGE: QUESTIONS --- */}
{stage === "questions" && (
  <motion.div key="questions" {...fadeInRight} className="glass-panel p-8 rounded-[2.5rem] max-w-xl w-full z-20 flex flex-col items-center relative shadow-2xl border-white/50">
    {/* ... emoji and progress bar code ... */}

    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">{QUESTIONS[currentQIndex].category}</h2>
    <h3 className="text-3xl font-black text-gray-800 text-center mb-10 leading-tight">{QUESTIONS[currentQIndex].text}</h3>

    {/* UPDATED: Container flex-wrap for mobile and spacing for indicators */}
    <div className="flex justify-center flex-wrap w-full gap-4 md:gap-6 px-1">
        {[1, 2, 3, 4, 5].map((num) => (
            <ScoreButton
                key={num}
                score={num}
                onClick={() => handleAnswer(num)}
                onHover={() => playSound('hover')}
            />
        ))}
    </div>
  </motion.div>
)}

        {/* --- STAGE: DETAILS --- */}
        {stage === "details" && (
            <motion.div key="details" {...fadeInUp} className="glass-panel p-10 rounded-[2.5rem] max-w-md w-full z-20 relative shadow-2xl border-white/50">
             <h2 className="text-2xl font-black text-gray-800 mb-6">Almost done.</h2>
             <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <div>
                    <label htmlFor="id-input" className="block text-sm font-bold text-gray-500 mb-2 ml-3">Employee ID (Optional)</label>
                    <input id="id-input" type="text" value={userDetails.employeeId} onChange={(e) => setUserDetails({...userDetails, employeeId: e.target.value})} className="glass-input w-full rounded-2xl p-4 font-medium" placeholder="e.g., 0042" />
                </div>
                <div>
                    <label htmlFor="name-input" className="block text-sm font-bold text-gray-600 mb-2 ml-3">Your Name</label>
                    <input id="name-input" type="text" required value={userDetails.name} onChange={(e) => setUserDetails({...userDetails, name: e.target.value})} className="glass-input w-full rounded-2xl p-4 font-medium" placeholder="e.g., Alex Smith" />
                </div>
                <div>
                    <label htmlFor="dept-select" className="block text-sm font-bold text-gray-600 mb-2 ml-3">Department</label>
                    <select id="dept-select" required value={userDetails.department} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserDetails({...userDetails, department: e.target.value})} className="glass-input w-full rounded-2xl p-4 appearance-none custom-select-icon font-medium">
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>
                <button type="submit" onMouseEnter={() => playSound('hover')} disabled={!userDetails.name || !userDetails.department} className="glass-button-active bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 px-10 py-4 rounded-2xl text-lg font-bold w-full transition-all mt-4 shadow-lg">Continue</button>
             </form>
            </motion.div>
        )}

        {/* --- STAGE: FEEDBACK --- */}
        {stage === "feedback" && (
            <motion.div key="feedback" {...fadeInUp} className="glass-panel p-8 rounded-[2.5rem] max-w-lg w-full z-20 shadow-2xl border-white/50">
                 <h3 className="text-2xl font-black text-gray-800 mb-2">Any final thoughts?</h3>
                 <p className="text-gray-600 mb-6 font-medium">Something you want to elaborate on? (Optional)</p>
                 <textarea className="glass-input w-full rounded-2xl p-4 min-h-[140px] font-medium resize-none" placeholder="Type here..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                 <div className="flex gap-3 mt-6">
                    <button onClick={handleFinalSubmit} onMouseEnter={() => playSound('hover')} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95">Submit Check-in</button>
                    <button onClick={handleFinalSubmit} onMouseEnter={() => playSound('hover')} className="px-6 text-gray-500 font-bold hover:text-gray-700 hover:bg-white/30 rounded-2xl transition-all">Skip</button>
                 </div>
             </motion.div>
        )}

        {/* --- STAGE: SUBMITTING --- */}
        {stage === "submitting" && (
             <motion.div key="submitting" initial={{opacity:0}} animate={{opacity:1}} className="z-20 text-center p-8 glass-panel rounded-3xl">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent mb-4"></div>
                <p className="text-lg font-bold text-gray-800">Saving your response...</p>
             </motion.div>
        )}

        {/* --- STAGE: THANK YOU --- */}
        {stage === "thankyou" && (
            <motion.div key="thankyou" {...fadeInUp} className="glass-panel p-12 rounded-[2.5rem] text-center max-w-md w-full z-20 shadow-2xl border-white/50">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring', delay:0.2, duration: 1}} className="w-48 h-48 mx-auto mb-6 relative">
                    <video autoPlay loop muted playsInline className="w-full h-full object-contain">
                        <source src="/emojis/hero-onsubmit.webm" type="video/webm" />
                    </video>
                </motion.div>
                <h2 className="text-3xl font-black text-gray-800 mb-3">Thank you!</h2>
                <p className="text-lg text-gray-600 font-medium">Your response has been recorded.</p>
            </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </main>
  );
}

// --- Components ---

// --- Updated Components for app/page.tsx ---

function FloatingInteractiveEmojis({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
    // Exact paths based on your file structure
    const emojis = [
        "/emojis/floating-emojis/emoji-2.png",
        "/emojis/floating-emojis/emoji-3.png",
        "/emojis/floating-emojis/emoji-4.png",
        "/emojis/floating-emojis/emoji-5.png",
        "/emojis/floating-emojis/emoji-10.png"
    ];

    useGSAP(() => {
      // Safety check
      if (!containerRef.current) return;

      const elements = gsap.utils.toArray('.floating-emoji');

      elements.forEach((el: any) => {
        // 1. SET INITIAL POSITION USING CSS PERCENTAGES
        // This bypasses the "window width is 0" bug entirely.
        gsap.set(el, {
          left: gsap.utils.random(10, 90) + "%",
          top: gsap.utils.random(10, 90) + "%",
          xPercent: -50, // Centers the anchor point
          yPercent: -50, // Centers the anchor point
          scale: gsap.utils.random(0.6, 1.1),
          rotation: gsap.utils.random(-20, 20),
          opacity: 0
        });

        // 2. FADE IN
        gsap.to(el, {
            opacity: gsap.utils.random(0.4, 0.7),
            duration: 1.5,
            delay: gsap.utils.random(0, 1)
        });

        // 3. FLOATING MOVEMENT (Relative Pixels)
        // Since the base position is set by %, we can safely bob around using pixels now.
        gsap.to(el, {
          x: "random(-60, 60)", // Move relative to the % position
          y: "random(-60, 60)",
          rotation: "random(-20, 20)",
          duration: "random(10, 20)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });

        // 4. INTERACTIVITY
        el.addEventListener("mouseenter", () => {
          gsap.to(el, { scale: 1.4, rotation: "+=15", opacity: 1, duration: 0.3, overwrite: 'auto' });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, { scale: gsap.utils.random(0.6, 1.1), opacity: 0.6, duration: 0.5, overwrite: 'auto' });
        });
      });
    }, { scope: containerRef });

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {emojis.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            // Ensure absolute positioning is explicit here
            className="floating-emoji absolute w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg pointer-events-auto will-change-transform cursor-pointer"
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
      className="absolute inset-0 -z-10 bg-warm-deep-animated transition-all duration-[1500ms] ease-in-out"
      data-mood={moodLevel}
    />
  );
}

function ScoreButton({ score, onClick, onHover }: { score: number, onClick: () => void, onHover: () => void }) {
    const labels: Record<number, string> = {
        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent"
    };

    let colorClass = "";
    if(score === 1) colorClass = "bg-red-500 text-white border-2 border-red-600 hover:bg-red-600 shadow-red-500/20";
    if(score === 2) colorClass = "bg-orange-500 text-white border-2 border-orange-600 hover:bg-orange-600 shadow-orange-500/20";
    if(score === 3) colorClass = "bg-yellow-400 text-gray-900 border-2 border-yellow-500 hover:bg-yellow-500 shadow-yellow-500/20";
    if(score === 4) colorClass = "bg-green-500 text-white border-2 border-green-600 hover:bg-green-600 shadow-green-500/20";
    if(score === 5) colorClass = "bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 shadow-blue-500/20";

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={onClick}
                onMouseEnter={onHover}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl font-black text-2xl transition-all duration-200 active:scale-90 active:translate-y-1 shadow-xl hover:scale-110 ${colorClass}`}
            >
                {score}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 opacity-80">
                {labels[score]}
            </span>
        </div>
    );
}

function Footer() {
  return (
    <footer className="fixed bottom-4 w-full text-center z-10 mix-blend-multiply font-bold">
      <a
        href="https://linktr.ee/cyr1archives" // Replace with your actual portfolio or studio link
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 hover:text-gray-800 transition-colors duration-300"
      >
        Copyright © 2026 CYR1 Studio by Cyrone Dumadag.
      </a>
    </footer>
  );
}

const fadeInUp = { initial: { opacity: 0, y: 60, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.3, ease: "anticipate" } }, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } };
const fadeInRight = { initial: { opacity: 0, x: 60, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -60, scale: 0.95, transition: { duration: 0.3, ease: "anticipate" } }, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } };